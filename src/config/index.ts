/* eslint no-process-env: "off" */

// NOTE: All env vars from process.env are imported as STRINGS. It is important to keep this in mind and cast your env vars as needed.

export const { NODE_ENV, APP_ENV, APP_ENV_SHORT, APP_MODE } = process.env;

export const SERVICE_NAME = process.env.SERVICE_NAME || 'express-dashboard-starter';
export const PORT = process.env.PORT || '3000';

export const API_KEY = process.env.API_KEY;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_APP_ENV_PRODUCTION = APP_ENV === 'production';
export const IS_LOCAL = APP_ENV === 'local';
export const IS_TEST = NODE_ENV === 'test';
export const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
export const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3030/';

// Pagination
export const MAX_PAGINATION_TAKE = 50;
export const DEFAULT_PAGINATION_TAKE = 10;
export const DEFAULT_PAGINATION_SKIP = 0;

// MongoDB
export const DATABASE_URL = process.env.DATABASE_URL;

// Sendgrid
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// Mailgun
export const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
export const EMAIL_SERVER_API_KRY = process.env.EMAIL_SERVER_API_KRY;
export const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;
export const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST || 'smtp.mailgun.org';
export const EMAIL_SERVER_DOMAIN = process.env.EMAIL_SERVER_DOMAIN;
export const EMAIL_SERVER_PORT = process.env.EMAIL_SERVER_PORT || 587;
export const EMAIL_FROM = process.env.EMAIL_FROM;
