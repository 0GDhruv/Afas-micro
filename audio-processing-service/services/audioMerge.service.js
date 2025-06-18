import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const OUTPUT_DIR = "output_audio/";

// ✅ Merge audio clips into a single `.wav`
export const mergeAudioFiles = async (audioBuffers) => {
    if (audioBuffers.length === 0) {
        console.error("❌ No audio files found for merging.");
        return null;
    }

    // ✅ Generate unique file name
    const outputFileName = `${uuidv4()}.wav`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    // ✅ Write individual temp files
    const tempFiles = audioBuffers.map((buffer, index) => {
        const filePath = path.join(OUTPUT_DIR, `temp_${index}.wav`);
        fs.writeFileSync(filePath, buffer);
        return filePath;
    });

    // ✅ Merge using FFmpeg
    const ffmpegCommand = `ffmpeg -y -i "concat:${tempFiles.join("|")}" -acodec copy ${outputPath}`;

    return new Promise((resolve, reject) => {
        exec(ffmpegCommand, (error) => {
            if (error) {
                console.error("❌ Error merging audio:", error.message);
                reject(null);
            } else {
                console.log(`✅ Merged Audio: ${outputPath}`);
                resolve(outputPath);
            }

            // ✅ Cleanup Temp Files
            tempFiles.forEach((file) => fs.unlinkSync(file));
        });
    });
};
