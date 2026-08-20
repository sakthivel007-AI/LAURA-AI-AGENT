import { tool } from "ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Define your agent's tools here. Each tool the model can call autonomously
// as part of its reasoning loop — this is what makes it "agentic" rather
// than a plain chatbot. Swap the bodies below for real implementations
// (a search API, your filesystem, a database, etc).
// ---------------------------------------------------------------------------

export const tools = {
  webSearch: tool({
    description:
      "Search the web for current information. Use this for anything time-sensitive, recent, or that you're not certain about.",
    parameters: z.object({
      query: z.string().describe("The search query"),
    }),
    execute: async ({ query }) => {
      // Plug in a real provider (Tavily, SerpAPI, Brave Search, etc).
      // Returning a stub so the app runs out of the box.
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return {
          note: "No search provider configured. Add TAVILY_API_KEY to enable real web search.",
          query,
        };
      }
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, query, max_results: 5 }),
      });
      const data = await res.json();
      return data;
    },
  }),

  calculator: tool({
    description: "Evaluate a mathematical expression precisely.",
    parameters: z.object({
      expression: z.string().describe("A math expression, e.g. '(12 * 7) + 3^2'"),
    }),
    execute: async ({ expression }) => {
      try {
        // Safe-ish eval: strip anything that isn't a number/operator.
        const cleaned = expression.replace(/\^/g, "**");
        if (!/^[0-9+\-*/().%\s]*$/.test(cleaned)) {
          return { error: "Expression contains disallowed characters." };
        }
        // eslint-disable-next-line no-eval
        const result = eval(cleaned);
        return { expression, result };
      } catch (e) {
        return { error: "Could not evaluate expression." };
      }
    },
  }),

  getDateTime: tool({
    description: "Get the current date and time.",
    parameters: z.object({}),
    execute: async () => {
      return { iso: new Date().toISOString() };
    },
  }),
};
