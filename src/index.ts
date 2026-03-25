import { AGENT_CARD_PATH } from '@a2a-js/sdk';
import { JsonRpcTransportHandler } from '@a2a-js/sdk/server';
import { Hono } from 'hono';
import { createRequestHandler } from './agent';

interface Env {
  ENVIRONMENT: string;
  BASE_URL: string;
  AI_GATEWAY_ID: string;
  AI: Ai;
  BFF_CHAT_URL: string;
  INTERNAL_GATEWAY_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', c => c.text('Hello from CROW A2A Service!'));

app.get(`/${AGENT_CARD_PATH}`, async c => {
  const requestHandler = createRequestHandler(
    c.env.BASE_URL,
    c.env.BFF_CHAT_URL ?? '',
    c.env.INTERNAL_GATEWAY_KEY ?? ''
  );
  const agentCard = await requestHandler.getAgentCard();
  return c.json(agentCard);
});

app.post('/a2a/jsonrpc', async c => {
  const requestHandler = createRequestHandler(
    c.env.BASE_URL,
    c.env.BFF_CHAT_URL ?? '',
    c.env.INTERNAL_GATEWAY_KEY ?? ''
  );
  const transportHandler = new JsonRpcTransportHandler(requestHandler);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null,
      },
      400
    );
  }

  const result = await transportHandler.handle(body);

  if (Symbol.asyncIterator in new Object(result)) {
    const stream = result as AsyncGenerator<unknown, void, undefined>;
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            );
          }
        } finally {
          controller.close();
        }
      },
    });
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  return c.json(result);
});

export default app;
