import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const UPLOAD_SERVICE_URL = process.env.UPLOAD_SERVICE_URL || "http://localhost:4003";

export const fetchAudioFile = async (category, filename) => {
    try {
        const response = await axios.get(`${UPLOAD_SERVICE_URL}/upload/audio?category=${category}&filename=${filename}`, {
            responseType: "arraybuffer",
        });
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching audio file (${category}/${filename}):`, error.message);
        return null;
    }
};
