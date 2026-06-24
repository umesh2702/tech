import * as fs from "fs";
import * as path from "path";

const possiblePaths = [
  "C:\\Program Files\\Git\\cmd\\git.exe",
  "C:\\Program Files\\Git\\bin\\git.exe",
  "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
  "C:\\Program Files (x86)\\Git\\bin\\git.exe",
  path.join(process.env.USERPROFILE || "C:\\Users\\admin", "AppData\\Local\\Programs\\Git\\cmd\\git.exe"),
  path.join(process.env.USERPROFILE || "C:\\Users\\admin", "AppData\\Local\\Programs\\Git\\bin\\git.exe"),
];

async function main() {
  console.log("Searching for git.exe...");
  let found = false;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`✅ Found Git at: ${p}`);
      found = true;
    }
  }

  if (!found) {
    console.log("❌ Could not find git.exe in standard paths.");
  }
}

main().catch(console.error);
