import * as fs from "fs";
import * as path from "path";

function findFile(dir: string, fileName: string, maxDepth = 4, currentDepth = 0): string[] {
  if (currentDepth > maxDepth) return [];
  let results: string[] = [];

  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      let stat;
      try {
        stat = fs.statSync(filePath);
      } catch (e) {
        continue;
      }
      
      if (stat && stat.isDirectory()) {
        if (file === "node_modules" || file === ".next" || file === "Windows" || file === "System32" || file === "Package Cache") {
          continue;
        }
        results = results.concat(findFile(filePath, fileName, maxDepth, currentDepth + 1));
      } else if (file.toLowerCase() === fileName.toLowerCase()) {
        results.push(filePath);
      }
    }
  } catch (e) {
    // Ignore
  }

  return results;
}

async function main() {
  console.log("Searching D: drive for git.exe...");
  const pathsToCheck = [
    "D:\\Program Files\\Git\\cmd\\git.exe",
    "D:\\Program Files\\Git\\bin\\git.exe",
    "D:\\Program Files (x86)\\Git\\cmd\\git.exe",
    "D:\\Program Files (x86)\\Git\\bin\\git.exe",
    "D:\\Git\\cmd\\git.exe",
    "D:\\Git\\bin\\git.exe",
  ];

  let found = false;
  for (const p of pathsToCheck) {
    if (fs.existsSync(p)) {
      console.log(`✅ Found Git at: ${p}`);
      found = true;
    }
  }

  if (!found) {
    console.log("Searching D:\\Program Files recursively...");
    const dPf = "D:\\Program Files";
    const dPfFiles = findFile(dPf, "git.exe", 4);
    if (dPfFiles.length > 0) {
      for (const f of dPfFiles) {
        console.log(`✅ Found: ${f}`);
        found = true;
      }
    }
  }

  if (!found) {
    console.log("❌ Could not find git.exe on D: drive.");
  }
}

main().catch(console.error);
