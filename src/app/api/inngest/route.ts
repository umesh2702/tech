import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { ingestSources, analyzeArticle } from "@/inngest/functions";
import { sendScheduledDigests, sendInstantAlert } from "@/inngest/whatsapp";

// Create an API that serves zero-downtime background jobs
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ingestSources,
    analyzeArticle,
    sendScheduledDigests,
    sendInstantAlert,
  ],
});
