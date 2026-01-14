import type { AgentCard, Message } from '@a2a-js/sdk';
import type {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from '@a2a-js/sdk/server';
import { DefaultRequestHandler, InMemoryTaskStore } from '@a2a-js/sdk/server';
import { v4 as uuidv4 } from 'uuid';

const helloAgentCard: AgentCard = {
  name: 'Hello Agent',
  description: 'A simple agent that says hello.',
  protocolVersion: '0.3.0',
  version: '0.1.0',
  url: 'http://localhost:4000/a2a/jsonrpc',
  skills: [
    { id: 'chat', name: 'Chat', description: 'Say hello', tags: ['chat'] },
  ],
  capabilities: {
    pushNotifications: false,
  },
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  additionalInterfaces: [
    { url: 'http://localhost:4000/a2a/jsonrpc', transport: 'JSONRPC' },
    { url: 'http://localhost:4000/a2a/rest', transport: 'HTTP+JSON' },
  ],
};

class HelloExecutor implements AgentExecutor {
  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const responseMessage: Message = {
      kind: 'message',
      messageId: uuidv4(),
      role: 'agent',
      parts: [{ kind: 'text', text: 'Hello, world!' }],
      contextId: requestContext.contextId,
    };
    eventBus.publish(responseMessage);
    eventBus.finished();
  }
  cancelTask = async (): Promise<void> => {};
}

export const agentExecutor = new HelloExecutor();
export const requestHandler = new DefaultRequestHandler(
  helloAgentCard,
  new InMemoryTaskStore(),
  agentExecutor
);
