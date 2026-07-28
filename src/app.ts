import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import statusRouter from './routes/status';
import githubWebhookRouter from './routes/githubWebhook';
import discordInteractionsRouter from './routes/discordInteractions';
import { errorHandler } from './middleware/errorHandler';
import { RequestWithRawBody } from './middleware/verifyGithubSignature';

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));

// Raw body parser middleware for /api/webhook/github signature verification
app.use('/api/webhook/github', (req: RequestWithRawBody, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = Buffer.from(data);
    try {
      req.body = JSON.parse(data);
    } catch {
      req.body = {};
    }
    next();
  });
});

// Standard JSON body parsing for other routes
app.use(express.json());

// Routes
app.use('/', statusRouter);
app.use('/api/webhook', githubWebhookRouter);
app.use('/api', discordInteractionsRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
