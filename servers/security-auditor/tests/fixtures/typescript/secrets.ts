// Test fixture: Hardcoded secrets

// VULNERABLE: API keys
export const STRIPE_API_KEY = 'sk_live_1234567890abcdef';
export const OPENAI_KEY = 'sk-proj-abcdefghijklmnop';

// VULNERABLE: Passwords
const DB_PASSWORD = 'password123';
const ADMIN_PASS = 'admin@123';

// VULNERABLE: JWT secrets
const JWT_SECRET = 'my-secret-key';
const TOKEN_SECRET = 'supersecret';

// VULNERABLE: Connection strings
const CONNECTION_STRING = 'Server=localhost;Database=mydb;User Id=sa;Password=MyPassword123';

// SAFE: Environment variables
const API_KEY = process.env.API_KEY;
const DB_PASS = process.env.DB_PASSWORD;
