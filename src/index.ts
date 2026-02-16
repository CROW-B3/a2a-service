import './lib/tracing';
import express from 'express';
import { AGENT_CARD_PATH } from '@a2a-js/sdk';
import {
  agentCardHandler,
  jsonRpcHandler,
  restHandler,
  UserBuilder,
} from '@a2a-js/sdk/server/express';
import { requestHandler } from './agent';

const PORT = process.env.PORT || 8020;

const app = express();

app.get('/', (_req, res) => {
  res.send('Hello from CROW A2A Service!');
});

app.use(
  `/${AGENT_CARD_PATH}`,
  agentCardHandler({ agentCardProvider: requestHandler })
);

app.use(
  '/a2a/jsonrpc',
  jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication })
);

app.use(
  '/a2a/rest',
  restHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication })
);

app.listen(PORT, () => {
  console.log(`CROW A2A Service started on http://localhost:${PORT}`);
});
