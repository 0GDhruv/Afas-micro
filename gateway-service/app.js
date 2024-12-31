import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

//Middleware for routing requests to auth-service
app.use('/auth', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
})
);

//Middleware for routing requests to user-service
app.use('/user', createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
})
);

//Middleware for routing requests to frontend-service
app.use('/', createProxyMiddleware({
    target: process.env.FRONTEND_SERVICE_URL,
    changeOrigin: true,
})
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Gateway service is running on port ${PORT}`);
});