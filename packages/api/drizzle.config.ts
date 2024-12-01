import { defineConfig } from 'drizzle-kit';
import Path from 'node:path';
import { SRCBOOK_DIR } from './constants.mts';

export default defineConfig({
  schema: './db/schema.mts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: Path.join(SRCBOOK_DIR, 'srcbook.db'),
  },
  scalability: {
    maxConnections: 100,
    connectionTimeout: 30000,
  },
  maintainability: {
    enableLogging: true,
    logLevel: 'info',
  },
});
