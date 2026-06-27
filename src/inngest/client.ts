import { Inngest } from "inngest";

// isDev is explicitly derived from NODE_ENV so that no other environment
// variable (including INNGEST_DEV) can accidentally force development mode
// in production. On Vercel, NODE_ENV is always "production" → isDev = false
// → mode: "cloud". Locally, NODE_ENV = "development" → isDev = true → mode: "dev".
export const inngest = new Inngest({
  id: "pulse-ai",
  isDev: process.env.NODE_ENV === "development",
});
