import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

// Add CORS middleware
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from frontend-service
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));



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