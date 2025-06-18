import axios from "axios";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const UPLOAD_SERVICE_URL = process.env.UPLOAD_SERVICE_URL || "http://localhost:4003";

export const fetchAudioFile = async (category, filename, language = "english") => {
  try {
    const url = `${UPLOAD_SERVICE_URL}/audio-file`;
    const response = await axios.get(url, {
      params: { category, filename, language },
      responseType: "arraybuffer",
    });

    if (response.status === 200) {
      const tempDir = path.resolve("output_audio/tmp"); // ✅ Writable local folder
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filePath = path.join(tempDir, `${Date.now()}-${filename}`);
      const fsPromises = await import("fs/promises");
      await fsPromises.writeFile(filePath, Buffer.from(response.data));
      return filePath;
    } else {
      console.warn(`❌ Audio not found: ${category}/${filename}`);
      return null;
    }
  } catch (err) {
    console.error(`❌ Error fetching audio file (${category}/${filename}):`, err.message);
    return null;
  }
};
