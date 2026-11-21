import { z } from "zod";

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().max(200).optional(),
        role: z.enum(["user", "assistant"]),
        content: z.string().max(12000),
        // AI SDK message parts retain tool calls/results across multi-step turns.
        parts: z.array(z.unknown()).max(100).optional(),
        toolInvocations: z.array(z.unknown()).max(30).optional(),
      }),
    )
    .min(1)
    .max(100),
  mode: z.enum(["Balanced", "Concise", "Detailed"]).default("Balanced"),
});

export const MAX_REQUEST_BYTES = 256000;

/** Bound the actual streamed body, including requests without Content-Length. */
export async function readBoundedBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new RangeError("Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}
