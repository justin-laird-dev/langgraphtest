import { Anthropic } from '@anthropic-ai/sdk';
import { log } from './logging.js';

export async function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });
    return Promise.race([promise, timeout]) as Promise<T>;
}

export async function callLLM(agent: Anthropic, messages: Array<{role: string, content: string}>) {
    if (!messages?.length || !messages[0]?.content?.trim()) {
        throw new Error('Invalid message content');
    }
    
    try {
        log('Calling Claude...', { messageLength: messages[0].content.length });
        const response = await callWithTimeout(agent.messages.create({
            messages: messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            })),
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            system: "You are an API research assistant helping users explore GraphQL APIs."
        }));
        log('Received response from Claude');
        const content = response.content[0];
        if ('type' in content && content.type === 'text') {
            return content.text;
        }
        return '';
    } catch (error) {
        log('Error calling Claude', { error: error.message });
        if ((error as any).error?.type === 'invalid_request_error') {
            throw new Error('Failed to process request - it might be too large or complex');
        }
        throw error;
    }
}

export function getTextContent(content: string): string {
    return content;
} 