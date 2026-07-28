import { Router, Request, Response } from 'express';
import { env } from '../config/env';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const missingVars: string[] = [];
  if (!env.DISCORD_TOKEN) missingVars.push('DISCORD_TOKEN');
  if (!env.DISCORD_CLIENT_ID) missingVars.push('DISCORD_CLIENT_ID');
  if (!env.GITHUB_WEBHOOK_SECRET) missingVars.push('GITHUB_WEBHOOK_SECRET');

  const acceptsHtml = req.accepts('html', 'json') === 'html';

  if (acceptsHtml) {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GitHub Discord Bot</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0d1117;
            color: #c9d1d9;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background-color: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            max-width: 480px;
          }
          h1 {
            color: #58a6ff;
            margin-bottom: 8px;
            font-size: 24px;
          }
          p {
            font-size: 16px;
            color: #8b949e;
            margin-top: 0;
          }
          .status-badge {
            display: inline-block;
            background-color: ${missingVars.length > 0 ? '#da3633' : '#238636'};
            color: #ffffff;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-top: 16px;
          }
          .warning {
            color: #f85149;
            font-size: 13px;
            margin-top: 15px;
            text-align: left;
            background: #21262d;
            padding: 10px;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>GitHub Discord Bot</h1>
          <p>Webhooks & Slash Commands Service</p>
          <div class="status-badge">${missingVars.length > 0 ? 'Action Required ⚠️' : 'Bot is running 🚀'}</div>
          ${
            missingVars.length > 0
              ? `<div class="warning">⚠️ Missing Environment Variables in Vercel Dashboard:<br><b>${missingVars.join(
                  ', '
                )}</b></div>`
              : ''
          }
        </div>
      </body>
      </html>
    `);
  } else {
    res.json({
      status: missingVars.length > 0 ? 'configuration_required' : 'online',
      message: missingVars.length > 0 ? 'Missing environment variables in Vercel' : 'GitHub Discord Bot is running 🚀',
      missingVariables: missingVars.length > 0 ? missingVars : undefined,
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

export default router;
