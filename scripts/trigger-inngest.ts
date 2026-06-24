import { Inngest } from "inngest";

process.env.INNGEST_EVENT_KEY = "local";
process.env.INNGEST_DEV = "1";
const inngest = new Inngest({ id: "pulse-ai" });

async function trigger() {
  console.log("Triggering Ingestion pipeline...");
  await inngest.send({
    name: "app/ingest.trigger"
  });
  console.log("Trigger dispatched! Check the Inngest Dev Server logs.");
}

trigger().catch(console.error);
