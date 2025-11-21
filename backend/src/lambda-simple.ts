import serverless from 'serverless-http';
import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Simple Lambda works!' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Root path works!' });
});

export const handler = serverless(app);
