/**
 * SSE (Server-Sent Events) Helper Functions
 *
 * Provides consistent streaming utilities for API endpoints that need
 * to stream progress events to the client.
 */

const encoder = new TextEncoder();

/**
 * Create an SSE Response with proper headers for streaming.
 *
 * @param stream - The ReadableStream to send to the client
 * @returns A Response object configured for SSE streaming
 */
export function createSSEResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Send an SSE event through the stream controller.
 *
 * Formats the message according to SSE spec:
 * event: {event}
 * data: {JSON.stringify(data)}
 *
 * @param controller - The ReadableStream controller
 * @param event - The event type name
 * @param data - The data object to send (will be JSON stringified)
 */
export function sendSSE(
  controller: ReadableStreamDefaultController,
  event: string,
  data: object
): void {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(message));
}
