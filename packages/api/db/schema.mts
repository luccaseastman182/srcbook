import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { randomid } from '@srcbook/shared';

export const configs = sqliteTable('config', {
  // Directory where .src.md files will be stored and searched by default.
  baseDir: text('base_dir').notNull().check(sql`length(base_dir) > 0`),
  defaultLanguage: text('default_language').notNull().default('typescript').check(sql`length(default_language) > 0`),
  openaiKey: text('openai_api_key').check(sql`length(openai_api_key) > 0`),
  anthropicKey: text('anthropic_api_key').check(sql`length(anthropic_api_key) > 0`),
  xaiKey: text('xai_api_key').check(sql`length(xai_api_key) > 0`),
  // TODO: This is deprecated in favor of SRCBOOK_DISABLE_ANALYTICS env variable. Remove this.
  enabledAnalytics: integer('enabled_analytics', { mode: 'boolean' }).notNull().default(true),
  // Stable ID for posthog
  installId: text('srcbook_installation_id').notNull().default(randomid()).check(sql`length(srcbook_installation_id) > 0`),
  aiProvider: text('ai_provider').notNull().default('openai').check(sql`length(ai_provider) > 0`),
  aiModel: text('ai_model').default('gpt-4o').check(sql`length(ai_model) > 0`),
  aiBaseUrl: text('ai_base_url').check(sql`length(ai_base_url) > 0`),
  // Null: unset. Email: subscribed. "dismissed": dismissed the dialog.
  subscriptionEmail: text('subscription_email').check(sql`length(subscription_email) > 0`),
});

export type Config = typeof configs.$inferSelect;

export const secrets = sqliteTable('secrets', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique().check(sql`length(name) > 0`),
  value: text('value').notNull().check(sql`length(value) > 0`),
});

export type Secret = typeof secrets.$inferSelect;

export const secretsToSession = sqliteTable(
  'secrets_to_sessions',
  {
    id: integer('id').primaryKey(),
    session_id: text('session_id').notNull().check(sql`length(session_id) > 0`),
    secret_id: integer('secret_id')
      .notNull()
      .references(() => secrets.id),
  },
  (t) => ({
    unique_session_secret: unique().on(t.session_id, t.secret_id),
  }),
);

export type SecretsToSession = typeof secretsToSession.$inferSelect;

export const apps = sqliteTable('apps', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().check(sql`length(name) > 0`),
  externalId: text('external_id').notNull().unique().check(sql`length(external_id) > 0`),
  history: text('history').notNull().default('[]').check(sql`length(history) > 0`), // JSON encoded value of the history
  historyVersion: integer('history_version').notNull().default(1), // internal versioning of history type for migrations
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type App = typeof apps.$inferSelect;
