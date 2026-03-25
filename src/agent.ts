import type { AgentCard, Message } from '@a2a-js/sdk';
import type {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from '@a2a-js/sdk/server';
import { DefaultRequestHandler, InMemoryTaskStore } from '@a2a-js/sdk/server';
import { v4 as uuidv4 } from 'uuid';

export const createAgentCard = (baseUrl: string): AgentCard => ({
  name: 'CROW A2A Agent',
  description: 'CROW A2A protocol agent service.',
  protocolVersion: '0.3.0',
  version: '0.1.0',
  url: `${baseUrl}/a2a/jsonrpc`,
  skills: [
    {
      id: 'chat',
      name: 'Chat',
      description: 'Chat with the agent',
      tags: ['chat'],
    },
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

export class CrowAgentExecutor implements AgentExecutor {
  private bffChatUrl: string;
  private internalGatewayKey: string;

  constructor(bffChatUrl: string, internalGatewayKey: string) {
    this.bffChatUrl = bffChatUrl;
    this.internalGatewayKey = internalGatewayKey;
  }

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const userMessage = requestContext.userMessage;
    const textPart = userMessage.parts.find(p => p.kind === 'text');
    const userText = textPart && 'text' in textPart ? textPart.text : '';

    let responseText = 'Hello from CROW A2A Agent!';

    if (userText && this.bffChatUrl && this.internalGatewayKey) {
      try {
        const res = await fetch(`${this.bffChatUrl}/a2a/tasks/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.internalGatewayKey,
          },
          body: JSON.stringify({
            id: requestContext.taskId,
            message: {
              parts: [{ type: 'text', text: userText }],
            },
            metadata: {
              organizationId:
                (userMessage.metadata as Record<string, string> | undefined)
                  ?.organizationId ?? 'default',
            },
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            artifacts?: Array<{ parts?: Array<{ text?: string }> }>;
          };
          const firstArtifact = data.artifacts?.[0];
          const firstPart = firstArtifact?.parts?.[0];
          if (firstPart?.text) {
            responseText = firstPart.text;
          }
        } else {
          console.error('BFF chat service returned error:', res.status);
        }
      } catch (err) {
        console.error('Failed to call BFF chat service:', err);
      }
    }

    const responseMessage: Message = {
      kind: 'message',
      messageId: uuidv4(),
      role: 'agent',
      parts: [{ kind: 'text', text: responseText }],
      contextId: requestContext.contextId,
    };
    eventBus.publish(responseMessage);
    eventBus.finished();
  }

  cancelTask = async (): Promise<void> => {};
}

export function createRequestHandler(
  baseUrl: string,
  bffChatUrl: string,
  internalGatewayKey: string
) {
  const agentCard = createAgentCard(baseUrl);
  const agentExecutor = new CrowAgentExecutor(bffChatUrl, internalGatewayKey);
  return new DefaultRequestHandler(
    agentCard,
    new InMemoryTaskStore(),
    agentExecutor
  );
}
