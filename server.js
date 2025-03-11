const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");

const PORT = 8888;
const app = express();
app.use(cors());
app.use("/frames", express.static(path.join(__dirname, "frames")));

const upload = multer({ dest: "uploads/" });

app.post("/generate_frames", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File not found" });
  }
  const videoPath = req.file.path;
  const timeCodes = req.body.timeCodes.split(",");
  const outputDir = `frames/${req.file.filename}`;

  await fs.ensureDir(outputDir);

  const framePaths = [];
  const commands = timeCodes.map((timeCode) => {
    const framePath = path.join(outputDir, `frame_${timeCode}.jpg`);
    framePaths.push(`http://localhost:${PORT}/${framePath}`);
    return `ffmpeg -i "${videoPath}" -ss ${timeCode} -vframes 1 "${framePath}"`;
  });
  for (const command of commands) {
    await new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }
  await fs.remove(videoPath).catch((error) => console.error(error));
  res.json(framePaths);
});

app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));
