import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dynamodb, s3, TABLES, S3_BUCKET } from '../config/aws';
import { UpdateProfileInput } from '../validators/schemas';

/**
 * GET /api/user/profile
 * Hent brukerens profil
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const result = await dynamodb
      .get({
        TableName: TABLES.USERS,
        Key: { id: userId },
      })
      .promise();

    if (!result.Item) {
      res.status(404).json({ message: 'Bruker ikke funnet' });
      return;
    }

    const { password, ...userWithoutPassword } = result.Item;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Kunne ikke hente profil' });
  }
};

/**
 * PUT /api/user/profile
 * Oppdater brukerens profil
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const updates = req.body as UpdateProfileInput;

    const result = await dynamodb
      .update({
        TableName: TABLES.USERS,
        Key: { id: userId },
        UpdateExpression:
          'set firstName = :firstName, lastName = :lastName, bio = :bio, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':firstName': updates.firstName,
          ':lastName': updates.lastName,
          ':bio': updates.bio || '',
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      })
      .promise();

    const { password, ...userWithoutPassword } = result.Attributes || {};
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Kunne ikke oppdatere profil' });
  }
};

/**
 * POST /api/user/profile-image
 * Last opp profilbilde til S3
 */
export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'Ingen fil lastet opp' });
      return;
    }

    // Generer unikt filnavn
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${userId}-${uuidv4()}.${fileExtension}`;
    const s3Key = `profile-images/${fileName}`;

    // Last opp til S3
    await s3
      .putObject({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
      .promise();

    // Generer URL
    const imageUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`;

    // Oppdater brukerens profil med bilde-URL
    await dynamodb
      .update({
        TableName: TABLES.USERS,
        Key: { id: userId },
        UpdateExpression: 'set profileImageUrl = :url, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':url': imageUrl,
          ':updatedAt': new Date().toISOString(),
        },
      })
      .promise();

    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ message: 'Kunne ikke laste opp bilde' });
  }
};

/**
 * GET /api/user/handicap-history
 * Hent handicap-historikk
 */
export const getHandicapHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Hent alle runder for bruker
    const result = await dynamodb
      .query({
        TableName: TABLES.ROUNDS,
        IndexName: 'userId-date-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: true, // Sortert etter dato
      })
      .promise();

    // TODO: Beregn handicap-utvikling basert på runder
    // Dette er en forenklet versjon
    const history =
      result.Items?.map(round => ({
        date: round.date,
        handicap: round.handicapAfterRound || 54.0,
      })) || [];

    res.json(history);
  } catch (error) {
    console.error('Get handicap history error:', error);
    res.status(500).json({ message: 'Kunne ikke hente handicap-historikk' });
  }
};

/**
 * GET /api/users/search?q=query
 * Søk etter brukere (for å finne medspillere)
 */
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = ((req.query.q as string) || '').toLowerCase().trim();

    if (!query || query.length < 2) {
      res.status(400).json({ message: 'Søkeord må være minst 2 tegn' });
      return;
    }

    // Hent alle brukere (i produksjon bør dette optimaliseres med en søkeindeks)
    const result = await dynamodb
      .scan({
        TableName: TABLES.USERS,
        ProjectionExpression: 'id, firstName, lastName, email, handicap, profileImageUrl',
      })
      .promise();

    const users = result.Items || [];

    // Filtrer brukere basert på søkeord
    const filteredUsers = users.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });

    // Sorter etter relevans (match i navn kommer først)
    const sortedUsers = filteredUsers.sort((a, b) => {
      const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
      const aStartsWith = aName.startsWith(query);
      const bStartsWith = bName.startsWith(query);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return aName.localeCompare(bName);
    });

    // Begrens til 20 resultater
    const limitedResults = sortedUsers.slice(0, 20).map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      handicap: user.handicap,
      profileImageUrl: user.profileImageUrl,
    }));

    res.json(limitedResults);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Kunne ikke søke etter brukere' });
  }
};
