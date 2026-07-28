import app from '../src/app';
import { MappingService } from '../src/services/mapping.service';

// Pre-warm cache on serverless startup
MappingService.warmCache().catch((err) => {
  console.error('⚠️ Warning: Mapping cache warm-up failed:', err);
});

export default app;
