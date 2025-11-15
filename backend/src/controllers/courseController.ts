import { Request, Response } from 'express';
import { dynamodb, TABLES } from '../config/aws';

/**
 * GET /api/courses
 * Hent alle golfbaner
 */
export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await dynamodb
      .scan({
        TableName: TABLES.COURSES,
      })
      .promise();

    res.json(result.Items || []);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Kunne ikke hente baner' });
  }
};

/**
 * GET /api/courses/:id
 * Hent en spesifikk golfbane
 */
export const getCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await dynamodb
      .get({
        TableName: TABLES.COURSES,
        Key: { id },
      })
      .promise();

    if (!result.Item) {
      res.status(404).json({ message: 'Bane ikke funnet' });
      return;
    }

    res.json(result.Item);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Kunne ikke hente bane' });
  }
};

/**
 * GET /api/courses/search?q=query
 * Søk etter golfbaner
 */
export const searchCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ message: 'Søkeord mangler' });
      return;
    }

    // Enkel scan med filter - i produksjon bør dette brukeElasticSearch eller lignende
    const result = await dynamodb
      .scan({
        TableName: TABLES.COURSES,
        FilterExpression: 'contains(#name, :query) OR contains(#location, :query)',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#location': 'location',
        },
        ExpressionAttributeValues: {
          ':query': q,
        },
      })
      .promise();

    res.json(result.Items || []);
  } catch (error) {
    console.error('Search courses error:', error);
    res.status(500).json({ message: 'Søk feilet' });
  }
};
