import * as fs from "fs";

const logPath = "C:\\Users\\admin\\.gemini\\antigravity-ide\\brain\\85aa5015-02cc-4507-a81f-1c7dac88437c\\.system_generated\\logs\\transcript_full.jsonl";

async function main() {
  if (!fs.existsSync(logPath)) {
    console.error("Log file does not exist at:", logPath);
    return;
  }

  const content = fs.readFileSync(logPath, "utf-8");
  const lines = content.split("\n");
  
  // Search for any 10-12 digit numbers in the text that are not IDs or timestamps
  const phonePattern = /\b(91\d{10}|\+91\d{10}|\d{10})\b/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(phonePattern);
    if (match) {
      console.log(`Line ${i + 1} matches: ${match[0]}`);
      console.log(`  Snippet: ${line.substring(Math.max(0, line.indexOf(match[0]) - 50), line.indexOf(match[0]) + 150)}...`);
    }
  }
}

main().catch(console.error);
