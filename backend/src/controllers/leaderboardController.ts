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
    const usersResult = await dynamodb
      .scan({
        TableName: TABLES.USERS,
        ProjectionExpression: 'id, firstName, lastName, handicap, profileImageUrl',
      })
      .promise();

    const users = usersResult.Items || [];

    // Sorter etter handicap (lavest først)
    const sortedUsers = users.sort((a, b) => a.handicap - b.handicap);

    // Begrens antall resultater
    const topUsers = sortedUsers.slice(0, limit);

    // Hent antall runder for hver bruker
    const enrichedLeaderboard = await Promise.all(
      topUsers.map(async user => {
        const roundsResult = await dynamodb
          .query({
            TableName: TABLES.ROUNDS,
            IndexName: 'userId-date-index',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': user.id,
            },
            Select: 'COUNT',
          })
          .promise();

        return {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          handicap: user.handicap,
          profileImageUrl: user.profileImageUrl,
          roundsPlayed: roundsResult.Count || 0,
        };
      })
    );

    res.json(enrichedLeaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Kunne ikke hente leaderboard' });
  }
};
