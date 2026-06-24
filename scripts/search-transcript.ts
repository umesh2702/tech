import * as fs from "fs";

const logPath = "C:\\Users\\admin\\.gemini\\antigravity-ide\\brain\\85aa5015-02cc-4507-a81f-1c7dac88437c\\.system_generated\\logs\\transcript_full.jsonl";

async function main() {
  if (!fs.existsSync(logPath)) {
    console.error("Log file does not exist at:", logPath);
    return;
  }

  const content = fs.readFileSync(logPath, "utf-8");
  const lines = content.split("\n");
  
  // We want to print: 1292, 1308, 1317 (which are 0-indexed: 1291, 1307, 1316)
  const indices = [1291, 1307, 1316];
  for (const idx of indices) {
    if (idx < lines.length) {
      console.log(`=== LINE ${idx + 1} ===`);
      console.log(lines[idx]);
    }
  }
}

main().catch(console.error);
