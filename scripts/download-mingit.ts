import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const MINGIT_URL = "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/MinGit-2.44.0-64-bit.zip";
const TEMP_ZIP = path.join(process.cwd(), "mingit.zip");
const TARGET_DIR = path.join(process.cwd(), ".git-portable");

async function downloadFile(url: string, dest: string): Promise<void> {
  const https = await import("https");
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, dest).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
      });
      file.on("close", () => {
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log(`Downloading MinGit from: ${MINGIT_URL}...`);
    await downloadFile(MINGIT_URL, TEMP_ZIP);
    console.log("Download complete!");

    console.log(`Extracting to: ${TARGET_DIR}...`);
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    // Run tar -xf to extract
    const cmd = `tar -xf "${TEMP_ZIP}" -C "${TARGET_DIR}"`;
    console.log(`Running: ${cmd}`);
    execSync(cmd);
    console.log("Extraction complete!");

    // Clean up zip
    if (fs.existsSync(TEMP_ZIP)) {
      fs.unlinkSync(TEMP_ZIP);
    }
    console.log("✅ MinGit is ready at:", path.join(TARGET_DIR, "cmd", "git.exe"));
  } catch (error: any) {
    console.error("❌ Failed to download and extract MinGit:", error.message);
  }
}

main().catch(console.error);
