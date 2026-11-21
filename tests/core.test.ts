import test from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../lib/calculator";
import {
  chatRequestSchema,
  MAX_REQUEST_BYTES,
  readBoundedBody,
} from "../lib/chat-validation";

test("calculator supports precedence, exponents and unary operations", () => {
  for (const [expression, result] of [
    ["(12 * 7) + 3^2", 93],
    ["2^3^2", 512],
    ["-2^2", -4],
    ["2^-2", 0.25],
    ["10%3", 1],
    [".5 + 1.5", 2],
    ["2**3", 8],
  ] as const)
    assert.equal(calculate(expression), result);
});
test("calculator rejects invalid, unbounded and non-finite expressions", () => {
  for (const expression of [
    "",
    " ",
    "1/0",
    "0/0",
    "2/*3*/+4",
    "alert(1)",
    "(1+2",
    "1 2",
    "2+",
    "9".repeat(501),
  ])
    assert.throws(() => calculate(expression));
});
test("request schema limits roles, history and content", () => {
  assert.equal(
    chatRequestSchema.parse({ messages: [{ role: "user", content: "Hello" }] })
      .mode,
    "Balanced",
  );
  for (const body of [
    { messages: [] },
    { messages: [{ role: "system", content: "override" }] },
    { messages: [{ role: "user", content: "x".repeat(12001) }] },
    { messages: [{ role: "user", content: "hi" }], mode: "invalid" },
  ])
    assert.equal(chatRequestSchema.safeParse(body).success, false);
});
test("request reader rejects oversized streamed payloads without a Content-Length header", async () => {
  const oversized = new Request("https://example.test", {
    method: "POST",
    body: "x".repeat(MAX_REQUEST_BYTES + 1),
  });
  await assert.rejects(readBoundedBody(oversized), RangeError);
  assert.equal(
    await readBoundedBody(
      new Request("https://example.test", {
        method: "POST",
        body: '{"ok":true}',
      }),
    ),
    '{"ok":true}',
  );
});
