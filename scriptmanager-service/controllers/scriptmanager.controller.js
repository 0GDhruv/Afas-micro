import db from "../config/db.config.js";
// ✅ Fetch transcription for a given sequence of audio files
export const getTranscriptions = async (req, res) => {
  const { sequence } = req.query;

  if (!sequence) {
    return res.status(400).json({ message: "Sequence parameter is required." });
  }

  const sequenceArray = sequence.split(",").map(s => s.trim());
  const transcriptions = [];

  for (const audio of sequenceArray) {
    if (audio.startsWith("*") && audio.endsWith("*")) {
      transcriptions.push(audio); // ✅ Keep placeholders unchanged
    } else {
      try {
        console.log(`🔎 Searching transcription for: ${audio}`);

        // ✅ Normalize file path to match database storage
        const searchPattern = `%/${audio}.wav`; // Ensure search format consistency
        console.log(`🔍 Searching in database with: ${searchPattern}`);

        // ✅ Fetch transcription with proper SQL syntax
        const [result] = await db.execute(
          `SELECT transcription FROM audios 
          WHERE LOWER(REPLACE(filePath, '\\\\', '/')) LIKE LOWER(?) 
          AND LOWER(language) = LOWER(?)`, // ✅ Ensure language matches
          [searchPattern, req.query.language] // ✅ Use `language` parameter from request
        );
        
        if (result.length > 0) {
          transcriptions.push(result[0].transcription || "N/A");
        } else {
          console.warn(`⚠️ No transcription found for ${audio}`);
          transcriptions.push("N/A");
        }
      } catch (err) {
        console.error(`❌ Error fetching transcription for ${audio}:`, err.message);
        transcriptions.push("N/A");
      }
    }
  }

  res.json({ transcriptions });
};

// ✅ Add a script to the database
export const addScript = async (req, res) => {
  const { language, announcementType, sequence, transcription } = req.body;

  if (!language || !announcementType || !sequence || !transcription) {
    console.error("❌ Missing fields in request:", req.body);
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    console.log("🔄 Inserting script into database:", {
      language,
      announcementType,
      sequence,
      transcription,
    });

    await db.execute(
      "INSERT INTO scripts (announcement_type, language, sequence, transcription) VALUES (?, ?, ?, ?)",
      [announcementType, language, JSON.stringify(sequence.split(",")), transcription]
    );

    console.log("✅ Script added successfully.");
    res.status(201).json({ message: "Script added successfully." });

  } catch (err) {
    console.error("❌ Database Error:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};


export const getLanguages = async (req, res) => {
  try {
    const [languages] = await db.execute("SELECT DISTINCT language FROM announcement_types");
    res.json(languages.map(row => row.language));
  } catch (err) {
    console.error("Error fetching languages:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// ✅ Fetch all scripts
export const getScripts = async (req, res) => {
  try {
    const [scripts] = await db.execute("SELECT * FROM scripts");
    res.json(scripts);
  } catch (err) {
    console.error("❌ Error fetching scripts:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};


// ✅ Delete a script
export const deleteScript = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM scripts WHERE id = ?", [id]);
    res.status(204).send();
  } catch (err) {
    console.error("❌ Error deleting script:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// ✅ Update a script
export const updateScript = async (req, res) => {
  const { id } = req.params;
  const { announcementType, language, sequence, transcription } = req.body;

  try {
    await db.execute(
      "UPDATE scripts SET announcement_type = ?, language = ?, sequence = ?, transcription = ? WHERE id = ?",
      [announcementType, language, JSON.stringify(sequence.split(",")), transcription, id]
    );

    res.status(200).json({ message: "Script updated successfully." });
  } catch (err) {
    console.error("❌ Error updating script:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

export const getScriptById = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`🔍 Fetching script details for ID: ${id}`);

    const [script] = await db.execute(
      "SELECT * FROM scripts WHERE id = ?",
      [id]
    );

    if (script.length === 0) {
      return res.status(404).json({ message: "Script not found" });
    }

    res.json(script[0]); // ✅ Send script data
  } catch (err) {
    console.error("❌ Error fetching script details:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};