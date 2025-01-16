// app.js
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Proxy routes
app.use(
  "/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
  })
);

app.use(
  "/users",
  createProxyMiddleware({
    target: process.env.USERS_SERVICE_URL,
    changeOrigin: true,
  })
);

app.use(
  "/",
  createProxyMiddleware({
    target: process.env.FRONTEND_SERVICE_URL,
    changeOrigin: true,
  })
);

app.listen(process.env.PORT, () => {
  console.log(`Gateway Service running on port ${process.env.PORT}`);
});
