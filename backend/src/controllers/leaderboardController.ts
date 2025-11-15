import { Request, Response } from 'express';
import { dynamodb, TABLES } from '../config/aws';

/**
 * GET /api/leaderboard?limit=50
 * Hent leaderboard sortert etter handicap
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    // Hent alle brukere og sorter etter handicap
    const result = await dynamodb
      .scan({
        TableName: TABLES.USERS,
        ProjectionExpression: 'id, firstName, lastName, handicap, profileImageUrl',
      })
      .promise();

    const users = result.Items || [];

    // Sorter etter handicap (lavest først)
    const sortedUsers = users.sort((a, b) => a.handicap - b.handicap);

    // Begrens antall resultater
    const leaderboard = sortedUsers.slice(0, limit);

    // TODO: Legg til antall runder spilt for hver bruker
    const enrichedLeaderboard = leaderboard.map(user => ({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      handicap: user.handicap,
      profileImageUrl: user.profileImageUrl,
      roundsPlayed: 0, // TODO: Hent fra rounds-tabell
    }));

    res.json(enrichedLeaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Kunne ikke hente leaderboard' });
  }
};
