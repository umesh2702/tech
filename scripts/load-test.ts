import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// Load local environment settings if present
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const prisma = new PrismaClient();

// Parse command line arguments or read env variables
const args = process.argv.slice(2);
const getArg = (name: string, fallback: string): string => {
  const envVal = process.env[name.toUpperCase()];
  if (envVal) return envVal;
  
  const arg = args.find(a => a.startsWith(`--${name}=`));
  if (arg) return arg.split("=")[1];
  
  const argIndex = args.indexOf(`--${name}`);
  if (argIndex !== -1 && args[argIndex + 1]) {
    return args[argIndex + 1];
  }
  
  return fallback;
};

const concurrency = parseInt(getArg("concurrency", "50"), 10);
const requestLimit = parseInt(getArg("requests", "200"), 10);
const durationSec = parseInt(getArg("duration", "10"), 10);

async function simulateDashboardQuery() {
  const start = Date.now();
  // Queries mimicking dashboard feed loading
  await prisma.intelligenceItem.findMany({
    where: { analysisStatus: "COMPLETED" },
    orderBy: { opportunityScore: "desc" },
    take: 10
  });
  return Date.now() - start;
}

async function runLoadTest() {
  console.log("\n========================================================");
  console.log("            PULSE AI LOAD TESTING UTILITY               ");
  console.log("========================================================");
  console.log(`  Concurrency Target : ${concurrency} parallel requests`);
  console.log(`  Target Request Max : ${requestLimit} requests`);
  console.log(`  Duration Limit     : ${durationSec} seconds`);
  console.log("========================================================\n");

  const startTestTime = Date.now();
  const endTestTime = startTestTime + durationSec * 1000;

  let totalRequests = 0;
  let successRequests = 0;
  let failedRequests = 0;
  const latencies: number[] = [];

  const worker = async () => {
    while (Date.now() < endTestTime && totalRequests < requestLimit) {
      totalRequests++;
      try {
        const latency = await simulateDashboardQuery();
        successRequests++;
        latencies.push(latency);
      } catch (err) {
        failedRequests++;
      }
    }
  };

  // Launch workers in parallel matching target concurrency
  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  const actualDuration = (Date.now() - startTestTime) / 1000;

  // Compile calculations
  latencies.sort((a, b) => a - b);
  const totalLatency = latencies.reduce((sum, val) => sum + val, 0);
  const avgLatency = latencies.length > 0 ? (totalLatency / latencies.length).toFixed(1) : "0";
  const minLatency = latencies.length > 0 ? latencies[0] : 0;
  const maxLatency = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
  const p95Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const rps = (successRequests / actualDuration).toFixed(1);

  console.log("========================================================");
  console.log("                 PERFORMANCE ANALYSIS                   ");
  console.log("========================================================");
  console.log(`  Total Requests Executed : ${totalRequests}`);
  console.log(`  Successful Queries      : ${successRequests}`);
  console.log(`  Failed Queries          : ${failedRequests}`);
  console.log(`  Actual Test Duration    : ${actualDuration.toFixed(2)} seconds`);
  console.log(`  Average Request Rate    : ${rps} RPS (Requests/sec)`);
  console.log("--------------------------------------------------------");
  console.log(`  Minimum Query Latency   : ${minLatency}ms`);
  console.log(`  Average Query Latency   : ${avgLatency}ms`);
  console.log(`  95th Percentile Latency : ${p95Latency}ms`);
  console.log(`  Maximum Query Latency   : ${maxLatency}ms`);
  console.log("========================================================\n");

  await prisma.$disconnect();
}

runLoadTest().catch(async (e) => {
  console.error("Load test runner crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
