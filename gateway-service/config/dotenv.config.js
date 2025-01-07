import dotenv from 'dotenv';
dotenv.config();

export default {
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
  USER_SERVICE_URL: process.env.USER_SERVICE_URL,
  FRONTEND_SERVICE_URL: process.env.FRONTEND_SERVICE_URL,
};
