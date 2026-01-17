import type { AgentCard, Message } from '@a2a-js/sdk';
import type {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from '@a2a-js/sdk/server';
import { DefaultRequestHandler, InMemoryTaskStore } from '@a2a-js/sdk/server';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8020';

const createAgentCard = (baseUrl: string): AgentCard => ({
  name: 'CROW A2A Agent',
  description: 'CROW A2A protocol agent service.',
  protocolVersion: '0.3.0',
  version: '0.1.0',
  url: `${baseUrl}/a2a/jsonrpc`,
  skills: [
    { id: 'chat', name: 'Chat', description: 'Chat with the agent', tags: ['chat'] },
  ],
  capabilities: {
    pushNotifications: false,
  },
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  additionalInterfaces: [
    { url: `${baseUrl}/a2a/jsonrpc`, transport: 'JSONRPC' },
    { url: `${baseUrl}/a2a/rest`, transport: 'HTTP+JSON' },
  ],
});

class CrowAgentExecutor implements AgentExecutor {
  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const responseMessage: Message = {
      kind: 'message',
      messageId: uuidv4(),
      role: 'agent',
      parts: [{ kind: 'text', text: 'Hello from CROW A2A Agent!' }],
      contextId: requestContext.contextId,
    };
    eventBus.publish(responseMessage);
    eventBus.finished();
  }
  cancelTask = async (): Promise<void> => {};
}

export const agentExecutor = new CrowAgentExecutor();
export const agentCard = createAgentCard(BASE_URL);
export const requestHandler = new DefaultRequestHandler(
  agentCard,
  new InMemoryTaskStore(),
  agentExecutor
);
