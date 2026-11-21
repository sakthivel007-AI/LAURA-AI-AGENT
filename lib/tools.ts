import { tool } from "ai";
import { z } from "zod";
import { calculate } from "./calculator";

export const tools = {
  webSearch: tool({
    description:
      "Search the web for current information. Cite source URLs in your answer. If unavailable, tell the user; never invent search results.",
    parameters: z.object({
      query: z.string().trim().min(1).max(500).describe("The search query"),
    }),
    execute: async ({ query }, { abortSignal }) => {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey)
        return {
          error:
            "Web search is not configured. Ask the workspace owner to add TAVILY_API_KEY.",
        };
      const controller = new AbortController();
      const cancel = () => controller.abort();
      if (abortSignal?.aborted) controller.abort();
      abortSignal?.addEventListener("abort", cancel, { once: true });
      const timer = setTimeout(cancel, 12000);
      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: apiKey, query, max_results: 5 }),
          signal: controller.signal,
        });
        if (!response.ok)
          return { error: "Search provider is unavailable. Try again later." };
        const data = z
          .object({
            results: z
              .array(
                z.object({
                  title: z.string(),
                  url: z.string().url(),
                  content: z.string(),
                }),
              )
              .max(10),
          })
          .parse(await response.json());
        return {
          results: data.results
            .slice(0, 5)
            .map((r) => ({ ...r, content: r.content.slice(0, 3000) })),
        };
      } catch {
        return { error: "Search failed or timed out. Please try again." };
      } finally {
        clearTimeout(timer);
        abortSignal?.removeEventListener("abort", cancel);
      }
    },
  }),
  calculator: tool({
    description:
      "Evaluate arithmetic (+, -, *, /, %, ^, parentheses). Uses JavaScript floating-point numbers, not financial decimal precision.",
    parameters: z.object({
      expression: z
        .string()
        .min(1)
        .max(500)
        .describe("An arithmetic expression, e.g. '(12 * 7) + 3^2'"),
    }),
    execute: async ({ expression }) => {
      try {
        return { expression, result: calculate(expression) };
      } catch {
        return {
          error:
            "Could not evaluate expression. Use valid arithmetic with a finite result.",
        };
      }
    },
  }),
  getDateTime: tool({
    description: "Get the current date and time in UTC.",
    parameters: z.object({}),
    execute: async () => ({ iso: new Date().toISOString(), timezone: "UTC" }),
  }),
};
