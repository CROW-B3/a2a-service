import {
  agentCardHandler,
  jsonRpcHandler,
  restHandler,
  UserBuilder,
} from '@a2a-js/sdk/server/express';
import { Hono } from 'hono';
import { requestHandler } from './agent';

type Environment = CloudflareBindings;

const app = new Hono<{ Bindings: Environment }>();

app.get('/', c => {
  return c.text('Hello from CROW A2A Service!');
});

app.all(
  '/.well-known/agent.json',
  agentCardHandler({ agentCardProvider: requestHandler })
);

app.all(
  '/a2a/jsonrpc',
  jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication })
);

app.all(
  '/a2a/rest',
  restHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication })
);

export default app;
