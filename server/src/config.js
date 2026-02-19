/**
 * Server runtime configuration.
 * Centralizes environment variables for database, uploads, and tenant resolution behavior.
 */
export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/supermall',
  uploadsDir: process.env.UPLOADS_DIR || 'data/uploads',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  simulateParking: (process.env.SIMULATE_PARKING || 'true') === 'true'
};
