import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
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

/**
 * POST /api/courses
 * Opprett ny golfbane (brukergenerert)
 */
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, location, holes, rating, slope } = req.body;

    // Validering
    if (!name || !location || !holes || !rating || !slope) {
      res.status(400).json({ message: 'Alle felt er påkrevd' });
      return;
    }

    if (!Array.isArray(holes) || (holes.length !== 9 && holes.length !== 18)) {
      res.status(400).json({ message: 'Antall hull må være 9 eller 18' });
      return;
    }

    // Sjekk om bane allerede finnes (unngå duplikater)
    const existingCourses = await dynamodb
      .scan({
        TableName: TABLES.COURSES,
        FilterExpression: '#name = :name AND #location = :location',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#location': 'location',
        },
        ExpressionAttributeValues: {
          ':name': name,
          ':location': location,
        },
      })
      .promise();

    if (existingCourses.Items && existingCourses.Items.length > 0) {
      // Bane finnes allerede, returner eksisterende
      res.status(200).json(existingCourses.Items[0]);
      return;
    }

    // Opprett ny bane
    const courseId = uuidv4();
    const timestamp = new Date().toISOString();

    const newCourse = {
      id: courseId,
      name,
      location,
      holes,
      rating,
      slope,
      createdAt: timestamp,
      createdBy: req.user?.userId || 'anonymous',
    };

    await dynamodb
      .put({
        TableName: TABLES.COURSES,
        Item: newCourse,
      })
      .promise();

    console.log(`✅ Ny bane opprettet: ${name} (${location})`);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Kunne ikke opprette bane' });
  }
};
