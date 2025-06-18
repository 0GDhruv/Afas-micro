import axios from "axios";
import dotenv from "dotenv";
import fidsDb from "../config/fids_db.config.js"; // FIDS Database
import afasDb from "../config/afas_db.config.js"; // AFAS Database
dotenv.config();

// ✅ Get the announcement sequence from Script Manager Service
export const getAnnouncementSequence = async (announcementType, area) => {
  try {
      console.log(`🔍 Fetching script for: ${announcementType} in ${area}`);
      
      const [rows] = await afasDb.execute(
          `SELECT sequence FROM scripts WHERE announcement_type = ? AND area = ? LIMIT 1`,
          [announcementType, area]
      );

      if (rows.length === 0) {
          console.log(`⚠ No script found for ${announcementType} in ${area}`);
          return null;
      }

      let sequenceData = rows[0].sequence;

      // ✅ Check if the sequence is already valid JSON
      if (typeof sequenceData === "string") {
          if (!sequenceData.startsWith("[") || !sequenceData.endsWith("]")) {
              console.warn(`⚠ Sequence is not a valid JSON array, treating it as a string: ${sequenceData}`);
              return [sequenceData]; // Return as an array
          }

          try {
              return JSON.parse(sequenceData); // Try parsing JSON
          } catch (jsonError) {
              console.error(`❌ Error parsing sequence JSON:`, jsonError);
              return null;
          }
      }

      return sequenceData; // Return directly if already JSON
  } catch (error) {
      console.error(`❌ Error fetching sequence:`, error);
      return null;
  }
};


// ✅ Send the processed announcement to the Playlist Service
export const sendToPlaylist = async (announcementData) => {
  try {
    console.log(`📢 Sending to playlist:`, announcementData);
    
    const response = await axios.post(`${process.env.PLAYLIST_SERVICE_URL}/playlist`, announcementData);

    console.log(`✅ Playlist API Response:`, response.data);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Error sending to playlist:`, error.message);
    console.error(`❌ Full Error:`, error.response?.data || error);
    return null;
  }
};

