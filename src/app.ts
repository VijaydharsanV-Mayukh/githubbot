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

// Standard JSON body parsing with rawBody retention for HMAC & Ed25519 signature verifications
app.use(
  express.json({
    verify: (req: RequestWithRawBody, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Routes
app.use('/', statusRouter);
app.use('/api/webhook', githubWebhookRouter);
app.use('/api', discordInteractionsRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
