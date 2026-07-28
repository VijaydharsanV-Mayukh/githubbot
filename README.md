# GitHub → Discord Notification Bot 🚀

Production-ready, serverless-friendly Discord bot written in **TypeScript** using **Express.js**, **discord.js v14**, and **Prisma with SQLite**.

Receives GitHub Webhooks (pushes, pull requests, releases, issues, workflow runs, stars, forks, discussions, etc.) and dispatches rich Discord embeds to configured channels without requiring code changes for new repositories or channels.

---

## 🌟 Features

- ⚡ **Vercel Serverless Ready**: Stateless HTTP event handling with `@discordjs/rest`.
- 🔐 **GitHub HMAC SHA256 Verification**: Verifies `X-Hub-Signature-256` header on all incoming webhooks.
- 🗄️ **Zero-Config Database**: Embedded SQLite database (`dev.db`) managed via Prisma ORM.
- ⚡ **In-Memory Caching**: Ultra-low latency mapping lookups for high-frequency webhook events.
- 🤖 **Discord Slash Commands**: Full `/repo` command suite (`add`, `remove`, `edit`, `list`, `test`) and `/help`.
- 🎨 **Rich Visual Embeds**: GitHub brand colors, avatars, commit details, markdown formatting, and action tags.
- 🌐 **Status Endpoint**: `GET /` returns `"GitHub Discord Bot is running 🚀"`.

---

## 📁 Project Structure

```text
github-discord-bot/
├── api/
│   └── index.ts                 # Vercel Serverless Function entrypoint
├── prisma/
│   └── schema.prisma            # Prisma SQLite database schema
├── scripts/
│   └── deploy-commands.ts       # Global Discord Slash Commands registration script
├── src/
│   ├── app.ts                   # Express server setup & middlewares
│   ├── index.ts                 # Local development server entrypoint
│   ├── config/
│   │   └── env.ts               # Environment validation (Zod)
│   ├── database/
│   │   └── prisma.ts            # Prisma client singleton
│   ├── middleware/
│   │   ├── verifyGithubSignature.ts # HMAC SHA256 verification
│   │   └── errorHandler.ts     # Global error handling
│   ├── routes/
│   │   ├── status.ts            # GET / status ("Bot is running 🚀")
│   │   ├── githubWebhook.ts     # POST /api/webhook/github
│   │   └── discordInteractions.ts # Discord slash command HTTP handler
│   ├── services/
│   │   ├── discord.service.ts   # Discord REST embed dispatcher
│   │   ├── embed.service.ts     # Rich embed generators
│   │   ├── github.service.ts    # Webhook router & event processor
│   │   └── mapping.service.ts   # Database CRUD & caching
│   ├── types/
│   │   ├── discord.ts           # Discord types
│   │   └── github.ts            # GitHub webhook payload types
│   └── utils/
│       ├── colors.ts            # Embed color palette
│       ├── constants.ts         # Supported event constants
│       └── helpers.ts           # Text formatters & utilities
├── package.json
├── tsconfig.json
├── vercel.json
├── .env.example
└── README.md
```

---

## 🛠️ Setup & Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your secrets:

```env
DISCORD_TOKEN="your_bot_token"
DISCORD_CLIENT_ID="your_client_id"
GITHUB_WEBHOOK_SECRET="your_webhook_secret"
DATABASE_URL="file:./dev.db"
PORT=3000
```

### 3. Initialize SQLite Database

```bash
npm run db:push
```

### 4. Deploy Slash Commands to Discord

```bash
npm run deploy-commands
```

### 5. Start Local Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

---

## 🚀 Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables (`DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `GITHUB_WEBHOOK_SECRET`, `DATABASE_URL`).
4. Click **Deploy**.

Vercel will output a live URL (e.g. `https://your-bot.vercel.app`).
- Status check: `https://your-bot.vercel.app/`
- Webhook URL: `https://your-bot.vercel.app/api/webhook/github`

---

## ⚙️ GitHub Webhook Configuration

In your GitHub Repository (or Organization):
1. Go to **Settings** ➔ **Webhooks** ➔ **Add webhook**.
2. **Payload URL**: `https://your-bot.vercel.app/api/webhook/github`
3. **Content type**: `application/json`
4. **Secret**: Value matching `GITHUB_WEBHOOK_SECRET` in your `.env`.
5. Select events (e.g. Pushes, Pull Requests, Issues, Releases, Workflow runs).
6. Click **Add webhook**.

---

## 🤖 Discord Slash Commands

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/repo add` | `repository`, `channel` | Maps a GitHub repository (e.g. `owner/repo`) to a Discord channel. |
| `/repo remove` | `repository` | Removes a repository mapping. |
| `/repo edit` | `repository`, `channel` | Updates the target channel for a repository. |
| `/repo list` | *None* | Lists all active repository mappings for the server. |
| `/repo test` | `repository` | Sends a mock notification embed to verify setup. |
| `/help` | *None* | Displays command help menu. |

---

## 📄 License

MIT License
