import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

export interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

export function verifyGithubSignature(req: RequestWithRawBody, res: Response, next: NextFunction): void {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;

  if (!signature) {
    console.warn('⚠️ Webhook request rejected: Missing X-Hub-Signature-256 header');
    res.status(401).json({ error: 'Unauthorized: Missing signature header' });
    return;
  }

  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const secret = env.GITHUB_WEBHOOK_SECRET;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(rawBody).digest('hex')}`;

  const sigBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (sigBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(sigBuffer, digestBuffer)) {
    console.warn('⚠️ Webhook request rejected: Invalid HMAC signature');
    res.status(401).json({ error: 'Unauthorized: Invalid signature' });
    return;
  }

  next();
}
