import { google } from "@ai-sdk/google";
import { streamText, convertToCoreMessages } from "ai";
import { tools } from "@/lib/tools";

export const runtime = "edge";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a helpful personal agent.

You have access to tools:
- webSearch
- calculator
- getDateTime

Use tools whenever they are useful.
Be concise and direct.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    console.log("Received messages:", JSON.stringify(messages, null, 2));

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY is missing");
      return new Response(
        JSON.stringify({
          error: "GOOGLE_GENERATIVE_AI_API_KEY is missing",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = streamText({
      model: google("gemini-3.6-flash"),
      system: SYSTEM_PROMPT,
      messages: convertToCoreMessages(messages),
      tools,
      maxSteps: 8,

      onError({ error }) {
        console.error("AI STREAM ERROR:", error);
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("API ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}