import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
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
            background-color: #238636;
            color: #ffffff;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>GitHub Discord Bot</h1>
          <p>Webhooks & Slash Commands Service</p>
          <div class="status-badge">Bot is running 🚀</div>
        </div>
      </body>
      </html>
    `);
  } else {
    res.json({
      status: 'online',
      message: 'GitHub Discord Bot is running 🚀',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

export default router;
