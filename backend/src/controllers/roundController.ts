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

    // Beregn total score og par
    const totalScore = roundData.holes.reduce((sum, hole) => sum + hole.strokes, 0);
    const totalPar = roundData.holes.reduce((sum, hole) => sum + hole.par, 0);

    // TODO: Hent faktisk course rating og slope fra database
    const courseRating = 72.0;
    const slopeRating = 130;

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

    // TODO: Oppdater brukerens handicap basert på nye runder

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
