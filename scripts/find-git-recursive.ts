import * as fs from "fs";
import * as path from "path";

function findFile(dir: string, fileName: string, maxDepth = 5, currentDepth = 0): string[] {
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
        // Skip large system dirs or node_modules
        if (file === "node_modules" || file === ".next" || file === "Windows" || file === "System32" || file === "Package Cache") {
          continue;
        }
        results = results.concat(findFile(filePath, fileName, maxDepth, currentDepth + 1));
      } else if (file.toLowerCase() === fileName.toLowerCase()) {
        results.push(filePath);
      }
    }
  } catch (e) {
    // Ignore permission errors
  }

  return results;
}

async function main() {
  console.log("Searching AppData for git.exe...");
  const userProfile = process.env.USERPROFILE || "C:\\Users\\admin";
  const appDataLocal = path.join(userProfile, "AppData", "Local");
  const appDataRoaming = path.join(userProfile, "AppData", "Roaming");
  
  const localGitFiles = findFile(appDataLocal, "git.exe", 5);
  const roamingGitFiles = findFile(appDataRoaming, "git.exe", 5);

  const found = [...localGitFiles, ...roamingGitFiles];
  if (found.length > 0) {
    console.log(`✅ Found ${found.length} instance(s) of git.exe in AppData:`);
    for (const f of found) {
      console.log(`- ${f}`);
    }
  } else {
    console.log("❌ Could not find git.exe in AppData.");
    
    // Check Chocolatey
    console.log("Checking Chocolatey installation...");
    const chocoBin = "C:\\ProgramData\\chocolatey\\bin\\git.exe";
    if (fs.existsSync(chocoBin)) {
      console.log(`✅ Found git.exe in Chocolatey: ${chocoBin}`);
    } else {
      console.log("❌ Not in Chocolatey.");
    }
  }
}

main().catch(console.error);
