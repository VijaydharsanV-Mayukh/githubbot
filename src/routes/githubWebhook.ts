import { Router, Response } from 'express';
import { verifyGithubSignature, RequestWithRawBody } from '../middleware/verifyGithubSignature';
import { GitHubService } from '../services/github.service';

const router = Router();

router.post('/github', verifyGithubSignature, async (req: RequestWithRawBody, res: Response) => {
  const eventType = req.headers['x-github-event'] as string;

  if (!eventType) {
    res.status(400).json({ error: 'Missing X-GitHub-Event header' });
    return;
  }

  try {
    const payload = req.body;
    console.log(`📥 Received GitHub webhook: ${eventType} for repository: ${payload.repository?.full_name || 'N/A'}`);

    const result = await GitHubService.processWebhook(eventType, payload);

    res.status(200).json({
      received: true,
      event: eventType,
      channelsNotified: result.channelsNotified,
    });
  } catch (error: any) {
    console.error('❌ Failed processing GitHub webhook:', error.message || error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

export default router;
