import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ✅ Get the announcement sequence from Script Manager Service
export const getAnnouncementSequence = async (announcementType) => {
  try {
    console.log(`🔍 Fetching sequence for announcement: ${announcementType}`);
    const response = await axios.get(
      `${process.env.SCRIPT_MANAGER_SERVICE_URL}/scriptmanager/scripts?announcementType=${encodeURIComponent(announcementType)}`
    );

    if (response.data.length === 0) {
      console.warn(`⚠ No sequence found for announcement: ${announcementType}`);
      return null;
    }

    return response.data[0].sequence;
  } catch (error) {
    console.error(`❌ Error fetching announcement sequence:`, error.message);
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

