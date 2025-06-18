// tts-service/controllers/tts.controller.js
import { SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import pollyClient from "../config/pollyClient.js";
import fs from "fs-extra"; // Using fs-extra for ensureDirSync and writeFile
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the directory for storing generated audio files
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
fs.ensureDirSync(UPLOADS_DIR); // Create the directory if it doesn't exist

/**
 * Converts text to speech using AWS Polly and saves it as an MP3 file.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const synthesizeText = async (req, res) => {
  const { text, voiceId = "Kajal", engine = "neural" } = req.body; // Default voice and engine

  if (!text) {
    return res.status(400).json({ message: "Text input is required." });
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("AWS credentials are not configured in .env file.");
    return res.status(500).json({ message: "Server configuration error: AWS credentials missing." });
  }


  const params = {
    Text: text,
    OutputFormat: "mp3",
    VoiceId: voiceId,
    Engine: engine, // 'standard' or 'neural'
  };

  try {
    const command = new SynthesizeSpeechCommand(params);
    const data = await pollyClient.send(command);

    if (data.AudioStream) {
      // Convert stream to buffer
      const audioBuffer = await streamToBuffer(data.AudioStream);

      // Generate a unique filename (e.g., based on timestamp or hash of text)
      const timestamp = Date.now();
      const safeTextPrefix = text.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize
      const filename = `speech_${safeTextPrefix}_${timestamp}.mp3`;
      const filePath = path.join(UPLOADS_DIR, filename);

      // Save the audio file
      await fs.writeFile(filePath, audioBuffer);
      console.log(`Audio file saved: ${filePath}`);

      // Construct URL to access the file
      // The base URL should be configurable, especially for different environments
      const audioFileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      // Or use an environment variable:
      // const audioFileUrl = `${process.env.AUDIO_BASE_URL || `${req.protocol}://${req.get('host')}`}/uploads/${filename}`;


      res.status(200).json({
        message: "Speech synthesized successfully.",
        audioUrl: audioFileUrl,
        filename: filename
      });
    } else {
      throw new Error("AudioStream not found in Polly response.");
    }
  } catch (error) {
    console.error("Error synthesizing speech with AWS Polly:", error);
    res.status(500).json({ message: "Failed to synthesize speech.", error: error.message });
  }
};

/**
 * Helper function to convert a readable stream to a buffer.
 * @param {ReadableStream} stream - The readable stream to convert.
 * @returns {Promise<Buffer>} A promise that resolves with the buffer.
 */
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Cleans up old audio files from the uploads directory.
 * This is a simple example; a more robust solution might use a cron job
 * or track file usage.
 */
export const cleanupOldFiles = async () => {
    const files = await fs.readdir(UPLOADS_DIR);
    const now = Date.now();
    const maxAge = 1 * 60 * 60 * 1000; // 1 hour in milliseconds

    for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file);
        try {
            const stats = await fs.stat(filePath);
            if (now - stats.mtimeMs > maxAge) {
                await fs.unlink(filePath);
                console.log(`Cleaned up old file: ${file}`);
            }
        } catch (err) {
            console.error(`Error processing file ${file} for cleanup:`, err);
        }
    }
};
// Run cleanup periodically (e.g., every hour)
setInterval(cleanupOldFiles, 60 * 60 * 1000);
console.log("Periodic cleanup of old audio files scheduled.");
