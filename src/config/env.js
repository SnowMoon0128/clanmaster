const dotenv = require('dotenv');

dotenv.config();

const must = (value, key) => {
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: must(process.env.DATABASE_URL, 'DATABASE_URL'),
  jwtSecret: must(process.env.JWT_SECRET, 'JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  siteAdminName: process.env.SITE_ADMIN_NAME || 'JsonParc',
  siteAdminId: process.env.SITE_ADMIN_ID || '00000000',
  siteAdminPassword: process.env.SITE_ADMIN_PASSWORD || '********'
};

module.exports = { env };
