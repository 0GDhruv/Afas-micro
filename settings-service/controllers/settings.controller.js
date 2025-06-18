// settings-service/controllers/settings.controller.js
import {
  getSettings as getGlobalSettingsModel,
  saveSettings as saveGlobalSettingsModel,
  getFlightSettings as getFlightSettingsModel,
  saveFlightSettings as saveFlightSettingsModel
} from "../models/settings.model.js";

// --- Global Settings Controller Functions ---
export const getConfig = async (req, res) => {
  try {
    const config = await getGlobalSettingsModel();
    res.status(200).json(config);
  } catch (err) {
    console.error("Error in getConfig controller:", err.message, err.stack);
    res.status(500).json({ message: "Error fetching global settings", error: err.message });
  }
};

export const updateConfig = async (req, res) => {
  try {
    const settingsData = req.body;
    // Validation for global settings structure
    if (!settingsData || typeof settingsData.languages !== 'object' || 
        !Array.isArray(settingsData.language_order) ||
        (settingsData.regional_language_name !== null && typeof settingsData.regional_language_name !== 'string' && settingsData.regional_language_name !== undefined && settingsData.regional_language_name !== '') || // Allow empty string for "None"
        typeof settingsData.frequency !== 'number' || 
        typeof settingsData.audio_lag_minutes !== 'number' || // Check for audio_lag_minutes
        typeof settingsData.advance_minutes !== 'number') {
      return res.status(400).json({ message: "Invalid or incomplete global settings data provided. Ensure all fields including audio_lag_minutes are correct." });
    }
    if (!settingsData.languages.hasOwnProperty('english') || !settingsData.languages.hasOwnProperty('hindi') || !settingsData.languages.hasOwnProperty('regional_active')){
        return res.status(400).json({ message: "Global 'languages' object must include 'english', 'hindi', and 'regional_active' flags." });
    }

    await saveGlobalSettingsModel(settingsData);
    res.status(200).json({ message: "Global settings saved successfully" });
  } catch (err) {
    console.error("Error in updateConfig controller:", err.message, err.stack);
    res.status(500).json({ message: "Error saving global settings", error: err.message });
  }
};

// --- Flight-Specific Settings Controller Functions ---
export const getFlightConfig = async (req, res) => {
  try {
    const { flight_number } = req.params;
    if (!flight_number) {
      return res.status(400).json({ message: "Flight number parameter is required." });
    }
    const config = await getFlightSettingsModel(flight_number);
    if (!config) {
      const globalDefaults = await getGlobalSettingsModel();
      return res.status(404).json({ 
          message: "No specific settings found for this flight. Global defaults may apply.",
          global_regional_language_name: globalDefaults.regional_language_name 
      });
    }
    res.status(200).json(config);
  } catch (err) {
    console.error(`Error in getFlightConfig for ${req.params.flight_number}:`, err.message, err.stack);
    res.status(500).json({ message: "Error fetching flight-specific settings", error: err.message });
  }
};

export const updateFlightConfig = async (req, res) => {
  try {
    const { flight_number } = req.params;
    const settingsData = req.body;

    if (!flight_number) {
      return res.status(400).json({ message: "Flight number parameter is required." });
    }
    // Validation for flight-specific settings structure
    if (!settingsData || typeof settingsData.languages !== 'object' || 
        !Array.isArray(settingsData.language_order) ||
        (settingsData.fourth_language_name !== null && typeof settingsData.fourth_language_name !== 'string' && settingsData.fourth_language_name !== undefined && settingsData.fourth_language_name !== '') || // Allow empty string
        settingsData.frequency === undefined || // Can be null, but must be present
        settingsData.audio_lag_minutes === undefined ) { // Check for audio_lag_minutes, can be null
      return res.status(400).json({ message: "Invalid or incomplete flight settings data provided. Ensure all fields including audio_lag_minutes are correct." });
    }
     if (!settingsData.languages.hasOwnProperty('english') || 
         !settingsData.languages.hasOwnProperty('hindi') || 
         !settingsData.languages.hasOwnProperty('regional_active_for_flight') ||
         !settingsData.languages.hasOwnProperty('fourth_lang_active')){
        return res.status(400).json({ message: "Flight 'languages' object must include all required flags (english, hindi, regional_active_for_flight, fourth_lang_active)." });
    }
    if (settingsData.language_order.length > 4) {
        return res.status(400).json({ message: "Language order cannot exceed 4 languages for flight settings."});
    }

    await saveFlightSettingsModel(flight_number, settingsData);
    res.status(200).json({ message: `Settings for flight ${flight_number} saved successfully` });
  } catch (err) {
    console.error(`Error in updateFlightConfig for ${req.params.flight_number}:`, err.message, err.stack);
    res.status(500).json({ message: "Error saving flight-specific settings", error: err.message });
  }
};
