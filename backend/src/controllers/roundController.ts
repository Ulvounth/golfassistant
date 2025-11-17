import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dynamodb, TABLES } from '../config/aws';
import { CreateRoundInput } from '../validators/schemas';

/**
 * Beregn score differential for handicap-beregning
 * Forenklet versjon - i produksjon må dette være mer nøyaktig
 */
const calculateScoreDifferential = (
  totalScore: number,
  courseRating: number,
  slopeRating: number
): number => {
  return ((totalScore - courseRating) * 113) / slopeRating;
};

/**
 * Beregn og oppdater brukerens handicap basert på WHS (World Handicap System)
 * Handicap = gjennomsnitt av de 8 beste score differentials av de siste 20 rundene
 */
const updateUserHandicap = async (userId: string): Promise<void> => {
  try {
    // Hent brukerens siste 20 runder
    const roundsResult = await dynamodb
      .query({
        TableName: TABLES.ROUNDS,
        IndexName: 'userId-date-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Nyeste først
        Limit: 20,
      })
      .promise();

    const rounds = roundsResult.Items || [];

    if (rounds.length === 0) {
      // Ingen runder, sett handicap til 54 (maks)
      await dynamodb
        .update({
          TableName: TABLES.USERS,
          Key: { id: userId },
          UpdateExpression: 'set handicap = :handicap, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':handicap': 54.0,
            ':updatedAt': new Date().toISOString(),
          },
        })
        .promise();
      return;
    }

    // Sorter etter score differential (beste først)
    const sortedDifferentials = rounds.map(r => r.scoreDifferential).sort((a, b) => a - b);

    // WHS regel: Bruk antall runder for å bestemme hvor mange som teller
    let numberOfScoresToUse = 1;
    if (rounds.length >= 20) {
      numberOfScoresToUse = 8;
    } else if (rounds.length >= 19) {
      numberOfScoresToUse = 7;
    } else if (rounds.length >= 16) {
      numberOfScoresToUse = 6;
    } else if (rounds.length >= 12) {
      numberOfScoresToUse = 5;
    } else if (rounds.length >= 9) {
      numberOfScoresToUse = 4;
    } else if (rounds.length >= 6) {
      numberOfScoresToUse = 3;
    } else if (rounds.length >= 3) {
      numberOfScoresToUse = 2;
    }

    // Ta de beste differentialene
    const bestDifferentials = sortedDifferentials.slice(0, numberOfScoresToUse);
    const averageDifferential =
      bestDifferentials.reduce((sum, diff) => sum + diff, 0) / bestDifferentials.length;

    // Handicap Index = gjennomsnitt av beste differentials (avrundet til 1 desimal)
    const newHandicap = Math.round(averageDifferential * 10) / 10;

    // Oppdater brukerens handicap
    await dynamodb
      .update({
        TableName: TABLES.USERS,
        Key: { id: userId },
        UpdateExpression: 'set handicap = :handicap, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':handicap': Math.max(0, Math.min(54, newHandicap)), // Clamp mellom 0 og 54
          ':updatedAt': new Date().toISOString(),
        },
      })
      .promise();

    console.log(
      `Updated handicap for user ${userId}: ${newHandicap} (from ${rounds.length} rounds)`
    );
  } catch (error) {
    console.error('Error updating handicap:', error);
    // Ikke kast feil - handicap-oppdatering skal ikke stoppe runde-lagring
  }
};

/**
 * GET /api/rounds
 * Hent alle runder for innlogget bruker
 */
export const getRounds = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const result = await dynamodb
      .query({
        TableName: TABLES.ROUNDS,
        IndexName: 'userId-date-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Nyeste først
      })
      .promise();

    res.json(result.Items || []);
  } catch (error) {
    console.error('Get rounds error:', error);
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

    const result = await dynamodb
      .get({
        TableName: TABLES.ROUNDS,
        Key: { id },
      })
      .promise();

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
    console.error('Get round error:', error);
    res.status(500).json({ message: 'Kunne ikke hente runde' });
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
    const courseResult = await dynamodb
      .get({
        TableName: TABLES.COURSES,
        Key: { id: roundData.courseId },
      })
      .promise();

    if (!courseResult.Item) {
      res.status(404).json({ message: 'Golfbane ikke funnet' });
      return;
    }

    const course = courseResult.Item;
    let courseRating = course.rating[roundData.teeColor];
    let slopeRating = course.slope[roundData.teeColor];

    // For 9-hulls runder: juster rating og slope (delt på 2)
    if (roundData.numberOfHoles === 9) {
      courseRating = courseRating / 2;
      slopeRating = slopeRating / 2;
    }

    // Beregn total score og par
    const totalScore = roundData.holes.reduce((sum, hole) => sum + hole.strokes, 0);
    const totalPar = roundData.holes.reduce((sum, hole) => sum + hole.par, 0);

    const scoreDifferential = calculateScoreDifferential(totalScore, courseRating, slopeRating);

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

    await dynamodb
      .put({
        TableName: TABLES.ROUNDS,
        Item: round,
      })
      .promise();

    // Oppdater brukerens handicap basert på WHS
    if (userId) {
      await updateUserHandicap(userId);
    }

    res.status(201).json(round);
  } catch (error) {
    console.error('Create round error:', error);
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
    const existing = await dynamodb
      .get({
        TableName: TABLES.ROUNDS,
        Key: { id },
      })
      .promise();

    if (!existing.Item || existing.Item.userId !== userId) {
      res.status(403).json({ message: 'Ingen tilgang' });
      return;
    }

    // Oppdater runde
    const result = await dynamodb
      .update({
        TableName: TABLES.ROUNDS,
        Key: { id },
        UpdateExpression: 'set holes = :holes, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':holes': updates.holes,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      })
      .promise();

    res.json(result.Attributes);
  } catch (error) {
    console.error('Update round error:', error);
    res.status(500).json({ message: 'Kunne ikke oppdatere runde' });
  }
};

/**
 * DELETE /api/rounds/:id
 * Slett runde
 */
export const deleteRound = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Sjekk at runden tilhører bruker
    const existing = await dynamodb
      .get({
        TableName: TABLES.ROUNDS,
        Key: { id },
      })
      .promise();

    if (!existing.Item || existing.Item.userId !== userId) {
      res.status(403).json({ message: 'Ingen tilgang' });
      return;
    }

    await dynamodb
      .delete({
        TableName: TABLES.ROUNDS,
        Key: { id },
      })
      .promise();

    res.json({ message: 'Runde slettet' });
  } catch (error) {
    console.error('Delete round error:', error);
    res.status(500).json({ message: 'Kunne ikke slette runde' });
  }
};
