import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamodb, TABLES } from '../config/aws';
import { CreateRoundInput, CreateMultiPlayerRoundInput } from '../validators/schemas';
import { logger } from '../config/logger';
import { updateUserHandicap } from '../utils/handicap';

/**
 * Beregn score differential for handicap-beregning
 * Følger WHS (World Handicap System) regler
 *
 * For 9-hulls runder:
 * - courseRating må være 9-hulls rating (dvs. 18-hulls rating / 2)
 * - Score og rating blir doblet for å simulere 18-hull
 * - Bruker full 18-hulls slope (ikke halveres)
 *
 * Exported for testing
 */
export const calculateScoreDifferential = (
  totalScore: number,
  courseRating: number,
  slopeRating: number,
  numberOfHoles: number = 18
): number => {
  // For 9-hulls: doble både score og rating
  // OBS: courseRating skal være 9-hulls rating som input
  const adjustedScore = numberOfHoles === 9 ? totalScore * 2 : totalScore;
  const adjustedRating = numberOfHoles === 9 ? courseRating * 2 : courseRating;

  return ((adjustedScore - adjustedRating) * 113) / slopeRating;
};



/**
 * GET /api/rounds?limit=20&nextToken=...
 * Hent runder for innlogget bruker med paginering
 */
export const getRounds = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Ikke autentisert' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const nextToken = req.query.nextToken as string | undefined;

    // Validate limit
    if (limit < 1 || limit > 100) {
      res.status(400).json({ message: 'Limit må være mellom 1 og 100' });
      return;
    }

    const queryParams: {
      TableName: string;
      IndexName: string;
      KeyConditionExpression: string;
      ExpressionAttributeValues: Record<string, string>;
      ScanIndexForward: boolean;
      Limit: number;
      ExclusiveStartKey?: Record<string, unknown>;
    } = {
      TableName: TABLES.ROUNDS,
      IndexName: 'userId-date-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Nyeste først
      Limit: limit,
    };

    // Add pagination token if provided
    if (nextToken) {
      try {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        res.status(400).json({ message: 'Ugyldig nextToken' });
        return;
      }
    }

    const result = await dynamodb.send(new QueryCommand(queryParams));

    // Encode LastEvaluatedKey as base64 token
    const responseNextToken = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : null;

    res.json({
      rounds: result.Items || [],
      nextToken: responseNextToken,
      hasMore: !!result.LastEvaluatedKey,
    });
  } catch (error) {
    logger.error('Get rounds error:', error);
    res.status(500).json({ message: 'Kunne ikke hente runder' });
  }
};

/**
 * GET /api/rounds/:id
 * Hent en spesifikk runde
 */
export const getRound = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const result = await dynamodb.send(
      new GetCommand({
        TableName: TABLES.ROUNDS,
        Key: { id },
      })
    );

    if (!result.Item) {
      res.status(404).json({ message: 'Runde ikke funnet' });
      return;
    }

    // Sjekk at runden tilhører bruker
    if (result.Item.userId !== userId) {
      res.status(403).json({ message: 'Ingen tilgang' });
      return;
    }

    res.json(result.Item);
  } catch (error) {
    logger.error('Get round error:', error);
    res.status(500).json({ message: 'Kunne ikke hente runde' });
  }
};

/**
 * POST /api/rounds/by-criteria
 * Hent runder basert på dato, bane og spillere
 * Brukes for å finne relaterte runder i en multi-player gruppe
 */
export const getRoundsByCriteria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, courseId, userIds } = req.body;

    if (!date || !courseId || !userIds || !Array.isArray(userIds)) {
      res.status(400).json({ message: 'date, courseId og userIds er påkrevd' });
      return;
    }

    // Hent runder for hver bruker på den gitte datoen
    const roundPromises = userIds.map(async (userId: string) => {
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: TABLES.ROUNDS,
          IndexName: 'userId-date-index',
          KeyConditionExpression: 'userId = :userId AND #date = :date',
          FilterExpression: 'courseId = :courseId',
          ExpressionAttributeNames: {
            '#date': 'date',
          },
          ExpressionAttributeValues: {
            ':userId': userId,
            ':date': date,
            ':courseId': courseId,
          },
        })
      );

      // Returner første match (skal bare være én per bruker per dato/bane)
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    });

    const rounds = await Promise.all(roundPromises);
    // Filtrer bort null-verdier
    const validRounds = rounds.filter(r => r !== null);

    res.json(validRounds);
  } catch (error) {
    logger.error('Get rounds by criteria error:', error);
    res.status(500).json({ message: 'Kunne ikke hente runder' });
  }
};

/**
 * POST /api/rounds
 * Opprett ny runde
 */
export const createRound = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const roundData = req.body as CreateRoundInput;

    // Hent course fra database for å få rating og slope
    const courseResult = await dynamodb.send(
      new GetCommand({
        TableName: TABLES.COURSES,
        Key: { id: roundData.courseId },
      })
    );

    if (!courseResult.Item) {
      res.status(404).json({ message: 'Golfbane ikke funnet' });
      return;
    }

    const course = courseResult.Item;

    // For 9-hulls: bruk halvparten av 18-hulls rating
    // WHS krever at vi sender 9-hulls rating til calculateScoreDifferential
    const courseRating =
      roundData.numberOfHoles === 9
        ? course.rating[roundData.teeColor] / 2
        : course.rating[roundData.teeColor];

    // Slope forblir full 18-hulls verdi (per WHS)
    const slopeRating = course.slope[roundData.teeColor];

    // Beregn total score og par
    const totalScore = roundData.holes.reduce((sum, hole) => sum + hole.strokes, 0);
    const totalPar = roundData.holes.reduce((sum, hole) => sum + hole.par, 0);

    // calculateScoreDifferential håndterer 9-hulls automatisk
    const scoreDifferential = calculateScoreDifferential(
      totalScore,
      courseRating,
      slopeRating,
      roundData.numberOfHoles
    );

    const roundId = uuidv4();
    const timestamp = new Date().toISOString();

    const round = {
      id: roundId,
      userId,
      ...roundData,
      totalScore,
      totalPar,
      scoreDifferential,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: TABLES.ROUNDS,
        Item: round,
      })
    );

    // Oppdater brukerens handicap basert på WHS
    if (userId) {
      await updateUserHandicap(userId);
    }

    res.status(201).json(round);
  } catch (error) {
    logger.error('Create round error:', error);
    res.status(500).json({ message: 'Kunne ikke opprette runde' });
  }
};

/**
 * POST /api/rounds/multi-player
 * Opprett runde for flere spillere samtidig
 * Dette oppretter én runde per spiller med deres individuelle scores
 */
export const createMultiPlayerRound = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestingUserId = req.user?.userId;
    const roundData = req.body as CreateMultiPlayerRoundInput;

    // Verify that the requesting user is one of the players
    const playerIds = roundData.playerScores.map(ps => ps.playerId);
    if (!playerIds.includes(requestingUserId!)) {
      res.status(403).json({ message: 'Du må være en av spillerne i runden' });
      return;
    }

    // Verify all players exist
    const playerChecks = await Promise.all(
      playerIds.map(playerId =>
        dynamodb.send(
          new GetCommand({
            TableName: TABLES.USERS,
            Key: { id: playerId },
          })
        )
      )
    );

    const missingPlayers = playerChecks.filter(result => !result.Item);
    if (missingPlayers.length > 0) {
      res.status(400).json({ message: 'En eller flere spillere finnes ikke i systemet' });
      return;
    }

    // Hent course fra database for å få rating og slope
    const courseResult = await dynamodb.send(
      new GetCommand({
        TableName: TABLES.COURSES,
        Key: { id: roundData.courseId },
      })
    );

    if (!courseResult.Item) {
      res.status(404).json({ message: 'Golfbane ikke funnet' });
      return;
    }

    const course = courseResult.Item;

    // For 9-hulls: bruk halvparten av 18-hulls rating
    // WHS krever at vi sender 9-hulls rating til calculateScoreDifferential
    const courseRating =
      roundData.numberOfHoles === 9
        ? course.rating[roundData.teeColor] / 2
        : course.rating[roundData.teeColor];

    // Slope forblir full 18-hulls verdi (per WHS)
    const slopeRating = course.slope[roundData.teeColor];

    const timestamp = new Date().toISOString();

    // Prepare all rounds first
    const roundsToCreate = roundData.playerScores.map(playerScore => {
      const totalScore = playerScore.holes.reduce((sum, hole) => sum + hole.strokes, 0);
      const totalPar = playerScore.holes.reduce((sum, hole) => sum + hole.par, 0);

      // calculateScoreDifferential håndterer 9-hulls automatisk
      const scoreDifferential = calculateScoreDifferential(
        totalScore,
        courseRating,
        slopeRating,
        roundData.numberOfHoles
      );

      const roundId = uuidv4();

      // Get list of other players (excluding current player)
      const otherPlayers = playerIds.filter(id => id !== playerScore.playerId);

      return {
        id: roundId,
        userId: playerScore.playerId,
        courseId: roundData.courseId,
        courseName: roundData.courseName,
        teeColor: roundData.teeColor,
        numberOfHoles: roundData.numberOfHoles,
        date: roundData.date,
        players: otherPlayers, // Other players in the round
        holes: playerScore.holes,
        totalScore,
        totalPar,
        scoreDifferential,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    });

    // Create all rounds in parallel (all or nothing approach)
    try {
      await Promise.all(
        roundsToCreate.map(round =>
          dynamodb.send(
            new PutCommand({
              TableName: TABLES.ROUNDS,
              Item: round,
            })
          )
        )
      );
    } catch (dbError) {
      logger.error('Error creating rounds in DynamoDB:', dbError);
      res.status(500).json({
        message: 'Failed to create rounds. Please try again.',
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });
      return;
    }

    // Update handicap for all players in parallel
    await Promise.all(playerIds.map(playerId => updateUserHandicap(playerId)));

    res.status(201).json({
      message: `Successfully created ${roundsToCreate.length} rounds`,
      rounds: roundsToCreate,
    });
  } catch (error) {
    logger.error('Create multi-player round error:', error);
    res.status(500).json({ message: 'Kunne ikke opprette runde' });
  }
};

/**
 * PUT /api/rounds/:id
 * Oppdater eksisterende runde
 */
export const updateRound = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const updates = req.body;

    // Sjekk at runden tilhører bruker
    const existing = await dynamodb.send(
      new GetCommand({
        TableName: TABLES.ROUNDS,
        Key: { id },
      })
    );

    if (!existing.Item || existing.Item.userId !== userId) {
      res.status(403).json({ message: 'Ingen tilgang' });
      return;
    }

    // Oppdater runde
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: TABLES.ROUNDS,
        Key: { id },
        UpdateExpression: 'set holes = :holes, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':holes': updates.holes,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    res.json(result.Attributes);
  } catch (error) {
    logger.error('Update round error:', error);
    res.status(500).json({ message: 'Kunne ikke oppdatere runde' });
  }
};

/**
 * DELETE /api/rounds/:id?deleteRelated=true
 * Slett runde og valgfritt alle relaterte runder (multi-player)
 * Query param deleteRelated=true sletter alle spillernes runder
 * Query param deleteRelated=false eller ikke satt sletter bare din egen runde
 */
export const deleteRound = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const deleteRelated = req.query.deleteRelated === 'true';

    // Hent runden som skal slettes
    const existing = await dynamodb.send(
      new GetCommand({
        TableName: TABLES.ROUNDS,
        Key: { id },
      })
    );

    if (!existing.Item || existing.Item.userId !== userId) {
      res.status(403).json({ message: 'Ingen tilgang' });
      return;
    }

    const round = existing.Item;

    // Finn alle relaterte runder (samme dato/bane med andre spillere)
    let relatedRounds: Record<string, unknown>[] = [];
    
    if (deleteRelated && round.players && round.players.length > 0) {
      // Slett alle spillernes runder (brukes når bruker eksplisitt sletter en multi-player runde)
      const allPlayerIds = [userId, ...round.players];

      const relatedRoundsResult = await Promise.all(
        allPlayerIds.map(async (playerId: string) => {
          const result = await dynamodb.send(
            new QueryCommand({
              TableName: TABLES.ROUNDS,
              IndexName: 'userId-date-index',
              KeyConditionExpression: 'userId = :userId AND #date = :date',
              FilterExpression: 'courseId = :courseId',
              ExpressionAttributeNames: {
                '#date': 'date',
              },
              ExpressionAttributeValues: {
                ':userId': playerId,
                ':date': round.date,
                ':courseId': round.courseId,
              },
            })
          );
          return result.Items || [];
        })
      );
      relatedRounds = relatedRoundsResult.flat();
    } else {
      // Slett bare denne ene runden (default oppførsel)
      relatedRounds = [round];
    }

    // Slett alle relaterte runder
    const deletePromises = relatedRounds.map(r =>
      dynamodb.send(
        new DeleteCommand({
          TableName: TABLES.ROUNDS,
          Key: { id: r.id },
        })
      )
    );

    await Promise.all(deletePromises);

    // Oppdater handicap for alle berørte spillere
    const uniquePlayerIds = [...new Set(relatedRounds.map(r => r.userId as string))];
    await Promise.all(uniquePlayerIds.map(playerId => updateUserHandicap(playerId)));

    res.json({
      message: `${relatedRounds.length} runde${relatedRounds.length > 1 ? 'r' : ''} slettet`,
      deletedCount: relatedRounds.length,
    });
  } catch (error) {
    logger.error('Delete round error:', error);
    res.status(500).json({ message: 'Kunne ikke slette runde' });
  }
};
