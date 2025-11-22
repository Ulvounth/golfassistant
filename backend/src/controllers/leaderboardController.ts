import { Request, Response } from 'express';
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb, TABLES } from '../config/aws';
import { logger } from '../config/logger';

/**
 * GET /api/leaderboard?limit=50
 * Hent leaderboard sortert etter handicap
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[LEADERBOARD] Starting getLeaderboard...');
    const limit = parseInt(req.query.limit as string) || 50;

    // Hent alle brukere og sorter etter handicap
    console.log('[LEADERBOARD] Scanning users table...');
    const usersResult = await dynamodb.send(
      new ScanCommand({
        TableName: TABLES.USERS,
        ProjectionExpression: 'id, firstName, lastName, handicap, profileImageUrl',
      })
    );

    const users = usersResult.Items || [];
    console.log(`[LEADERBOARD] Found ${users.length} users`);

    // Sorter etter handicap (lavest først)
    const sortedUsers = users.sort((a, b) => a.handicap - b.handicap);

    // Begrens antall resultater
    const topUsers = sortedUsers.slice(0, limit);

    // Hent antall runder for hver bruker
    const enrichedLeaderboard = await Promise.all(
      topUsers.map(async user => {
        const roundsResult = await dynamodb.send(
          new QueryCommand({
            TableName: TABLES.ROUNDS,
            IndexName: 'userId-date-index',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': user.id,
            },
            Select: 'COUNT',
          })
        );

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
    logger.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Kunne ikke hente leaderboard' });
  }
};
