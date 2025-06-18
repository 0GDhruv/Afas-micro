// settings-service/models/settings.model.js
import db from "../config/db.config.js";

// --- Global Settings ---
export const getSettings = async () => {
  const [rows] = await db.execute("SELECT * FROM settings ORDER BY id LIMIT 1");

  if (!rows.length) {
    return {
      languages: { english: true, hindi: false, regional_active: false },
      regional_language_name: null,
      language_order: ["english"],
      frequency: 1,
      audio_lag_minutes: 2, // Changed from audio_lag
      advance_minutes: 15,
    };
  }

  const row = rows[0];
  const languages = typeof row.languages === 'string' 
    ? JSON.parse(row.languages) 
    : (row.languages || { english: true, hindi: false, regional_active: false });
  const language_order = typeof row.language_order === 'string' 
    ? JSON.parse(row.language_order) 
    : (row.language_order || (languages.english ? ['english'] : []));

  return {
    languages,
    regional_language_name: row.regional_language_name,
    language_order,
    frequency: row.frequency !== null ? parseInt(row.frequency, 10) : 1,
    audio_lag_minutes: row.audio_lag_minutes !== null ? parseInt(row.audio_lag_minutes, 10) : 2, // Use audio_lag_minutes
    advance_minutes: row.advance_minutes !== null ? parseInt(row.advance_minutes, 10) : 15,
  };
};

export const saveSettings = async (settingsData) => {
  const {
    languages,
    regional_language_name,
    language_order,
    frequency,
    audio_lag_minutes, // Changed from audio_lag
    advance_minutes
  } = settingsData;

  const langJson = JSON.stringify(languages || {});
  const orderJson = JSON.stringify(language_order || []);
  const freq = frequency !== undefined ? parseInt(frequency, 10) : 1;
  const lagMins = audio_lag_minutes !== undefined ? parseInt(audio_lag_minutes, 10) : 2; // Use audio_lag_minutes
  const advance = advance_minutes !== undefined ? parseInt(advance_minutes, 10) : 15;

  const [existingRows] = await db.execute("SELECT id FROM settings LIMIT 1");

  if (existingRows.length > 0) {
    const settingId = existingRows[0].id;
    await db.execute(
      `UPDATE settings SET languages = ?, regional_language_name = ?, language_order = ?, 
       frequency = ?, audio_lag_minutes = ?, advance_minutes = ?, updated_at = NOW()
       WHERE id = ?`,
      [langJson, regional_language_name, orderJson, freq, lagMins, advance, settingId]
    );
  } else {
    await db.execute(
      `INSERT INTO settings (languages, regional_language_name, language_order, frequency, audio_lag_minutes, advance_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`, // Added audio_lag_minutes
      [langJson, regional_language_name, orderJson, freq, lagMins, advance]
    );
  }
};

// --- Flight-Specific Settings ---
export const getFlightSettings = async (flightNumber) => {
  const sql = "SELECT languages, fourth_language_name, language_order, frequency, audio_lag_minutes FROM flight_settings WHERE flight_number = ?"; // Use audio_lag_minutes
  const [rows] = await db.execute(sql, [flightNumber]);

  if (!rows.length) {
    return null;
  }

  const row = rows[0];
  const languages = typeof row.languages === 'string' ? JSON.parse(row.languages) : row.languages;
  const language_order = typeof row.language_order === 'string' ? JSON.parse(row.language_order) : row.language_order;
  
  const globalSettings = await getSettings();

  return {
    languages, 
    fourth_language_name: row.fourth_language_name, 
    language_order, 
    frequency: row.frequency, 
    audio_lag_minutes: row.audio_lag_minutes,   // Use audio_lag_minutes
    global_regional_language_name: globalSettings.regional_language_name 
  };
};

export const saveFlightSettings = async (flightNumber, settingsData) => {
  const {
    languages, 
    fourth_language_name,
    language_order,
    frequency,
    audio_lag_minutes // Changed from audio_lag
  } = settingsData;

  const langJson = JSON.stringify(languages || {});
  const orderJson = JSON.stringify(language_order || []);
  const freqValue = frequency !== undefined ? (frequency === null ? null : parseInt(frequency, 10)) : null;
  const lagMinsValue = audio_lag_minutes !== undefined ? (audio_lag_minutes === null ? null : parseInt(audio_lag_minutes, 10)) : null; // Use audio_lag_minutes

  const sql = `
    INSERT INTO flight_settings (flight_number, languages, fourth_language_name, language_order, frequency, audio_lag_minutes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      languages = VALUES(languages),
      fourth_language_name = VALUES(fourth_language_name),
      language_order = VALUES(language_order),
      frequency = VALUES(frequency),
      audio_lag_minutes = VALUES(audio_lag_minutes), 
      updated_at = NOW()
  `;

  await db.execute(sql, [
    flightNumber,
    langJson,
    fourth_language_name, 
    orderJson,
    freqValue, 
    lagMinsValue  // Use audio_lag_minutes
  ]);
};
