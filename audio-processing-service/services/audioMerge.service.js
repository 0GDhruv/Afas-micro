import { exec } from "child_process";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = "output_audio/";

export const mergeAudioFiles = async (audioPaths, outputFileName) => {
  if (!audioPaths.length) {
    console.error("❌ No audio files to merge.");
    return null;
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const listFilePath = path.join(OUTPUT_DIR, `concat_list_${Date.now()}.txt`);
  const listContent = audioPaths.map(file => `file '${path.resolve(file)}'`).join("\n");
  fs.writeFileSync(listFilePath, listContent);

  const finalName = outputFileName || `${Date.now()}.wav`;
  const outputPath = path.join(OUTPUT_DIR, finalName);

  const cmd = `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${outputPath}"`;

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      fs.unlinkSync(listFilePath);
      if (err) {
        console.error("❌ Merge error:", stderr || err.message);
        return reject(null);
      }
      console.log(`✅ Merged Audio: ${outputPath}`);
      resolve(finalName);
    });
  });
};
