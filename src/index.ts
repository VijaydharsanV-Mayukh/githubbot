import app from './app';
import { env } from './config/env';
import { MappingService } from './services/mapping.service';

async function bootstrap() {
  await MappingService.warmCache();

  app.listen(env.PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🚀 GitHub Discord Bot Server running!`);
    console.log(`🌐 Local URL: http://localhost:${env.PORT}`);
    console.log(`📥 GitHub Webhook URL: http://localhost:${env.PORT}/api/webhook/github`);
    console.log(`🤖 Status Message: "GitHub Discord Bot is running 🚀"`);
    console.log(`==============================================\n`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
