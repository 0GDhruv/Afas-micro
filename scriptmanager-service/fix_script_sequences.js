import db from "./config/db.config.js";

const fixBrokenSequences = async () => {
  try {
    console.log("🔄 Checking and fixing non-JSON sequences...");

    const [rows] = await db.execute("SELECT id, sequence FROM scripts");

    for (const row of rows) {
      const { id, sequence } = row;

      let needsUpdate = false;
      let fixedSequenceArray = [];

      if (typeof sequence === "string") {
        // Check if it's already valid JSON
        try {
          const parsed = JSON.parse(sequence);
          if (Array.isArray(parsed)) {
            continue; // ✅ Already valid
          }
        } catch (err) {
          // ❌ Not valid JSON, attempt to fix it
          fixedSequenceArray = sequence
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "");

          needsUpdate = true;
        }
      } else if (Array.isArray(sequence)) {
        // Already a valid array (from MySQL JSON column)
        continue;
      }

      if (needsUpdate) {
        const fixedSequenceJSON = JSON.stringify(fixedSequenceArray);
        await db.execute("UPDATE scripts SET sequence = ? WHERE id = ?", [
          fixedSequenceJSON,
          id,
        ]);
        console.log(`✅ Fixed script ID ${id}:`, fixedSequenceJSON);
      }
    }

    console.log("🎉 All broken sequences converted to JSON.");
  } catch (err) {
    console.error("❌ Error fixing sequences:", err.message);
  } finally {
    process.exit(0);
  }
};

fixBrokenSequences();
