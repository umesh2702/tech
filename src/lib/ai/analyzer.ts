import { z } from "zod";

// Zod schema matching the expected structured output
export const IntelligenceAnalysisSchema = z.object({
  whatHappened: z
    .string()
    .describe("1-2 concise sentences summarizing the factual event. No fluff."),
  whyItMatters: z
    .string()
    .describe(
      "2-3 concise sentences explaining the immediate impact or second-order effects for founders/investors."
    ),
  founderOpportunity: z
    .string()
    .describe(
      "Concrete, actionable opportunity for founders, agencies, SaaS builders, consultants, or AI startups. E.g., SaaS, Dev tool, marketplace, automation. If none, explicitly state 'No immediate business opportunity identified.'"
    ),
  whoShouldCare: z
    .string()
    .describe("Specific types of founders, builders, or investors who should care about this."),
  opportunityScore: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe(
      "How commercially actionable the opportunity is. If no meaningful founder opportunity exists, assign below 5."
    ),
  founderFitScore: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe(
      "How attractive this opportunity is for a founder, agency, SaaS builder, consultant, or AI startup."
    ),
});

export type IntelligenceAnalysis = z.infer<typeof IntelligenceAnalysisSchema>;

const SYSTEM_PROMPT = `You are an elite business analyst for founders. You extract signal from noise. Your output must ALWAYS be framed through the lens of business opportunity. Be concise, direct, and authoritative.
The goal of Pulse AI is not to summarize news. The goal is to identify opportunities founders can build or sell.

Analyze the provided raw content and return a structured JSON response EXACTLY matching this schema:
{
  "whatHappened": "...",
  "whyItMatters": "...",
  "founderOpportunity": "...",
  "whoShouldCare": "...",
  "opportunityScore": integer (1-10),
  "founderFitScore": integer (1-10)
}

RULES:
1. The Founder Opportunity must be concrete and actionable.
2. Avoid generic outputs like "Businesses can use this technology" or "Companies may benefit".
3. Prefer concrete ideas: SaaS opportunities, Agency opportunities, AI tool opportunities, Developer tooling opportunities, Marketplace opportunities, Automation opportunities.
4. If no meaningful founder opportunity exists, assign opportunityScore below 5 and explicitly state in founderOpportunity that no immediate business opportunity was identified.`;

export async function analyzeContent(
  rawContent: string
): Promise<IntelligenceAnalysis> {
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const prompt = `${SYSTEM_PROMPT}\n\nRAW CONTENT:\n${rawContent}`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const parsed = JSON.parse(responseText);
      return parsed as IntelligenceAnalysis;
    } catch (error) {
      console.error("Gemini Error analyzing content:", error);
      throw error;
    }
  }

  // Fallback to OpenAI if GEMINI_API_KEY is not set
  if (!process.env.OPENAI_API_KEY) {
    console.warn("API keys missing. Falling back to mock analysis.");
    return generateMockAnalysis(rawContent);
  }

  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `RAW CONTENT:\n${rawContent}` },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to get response content from OpenAI.");
    }
    
    const parsed = JSON.parse(content);
    return parsed as IntelligenceAnalysis;
  } catch (error) {
    console.error("OpenAI Error analyzing content:", error);
    throw error;
  }
}

function generateMockAnalysis(content: string): IntelligenceAnalysis {
  return {
    whatHappened: "A new development was announced in the tech ecosystem.",
    whyItMatters: "This lowers the barrier to entry for early-stage startups and forces incumbents to adapt.",
    founderOpportunity: "Build specialized tooling that leverages this new paradigm for enterprise clients.",
    whoShouldCare: "SaaS founders and AI tool builders.",
    opportunityScore: Math.floor(Math.random() * 5) + 5,
    founderFitScore: 8,
  };
}
