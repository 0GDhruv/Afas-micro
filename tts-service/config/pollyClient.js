// tts-service/config/pollyClient.js
import { PollyClient } from "@aws-sdk/client-polly";
import dotenv from "dotenv";

dotenv.config();

const REGION = process.env.AWS_REGION || "us-east-1"; // Default region if not set

// Configure the AWS SDK Polly client
const pollyClient = new PollyClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default pollyClient;
