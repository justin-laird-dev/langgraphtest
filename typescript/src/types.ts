import type { Message } from '@anthropic-ai/sdk/resources/messages';

// For storing messages in state
export interface StoredMessage {
    role: "user" | "assistant";
    content: string | ContentBlock[];
}

export interface ConversationState {
    messages: StoredMessage[];
    imageAnalysis: Record<string, string>;
}

export type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export interface ImageBlockSource {
    type: "base64";
    media_type: MediaType;
    data: string;
}

export interface ImageBlock {
    type: "image";
    source: ImageBlockSource;
}

export interface TextBlock {
    type: "text";
    text: string;
}

export type ContentBlock = TextBlock | ImageBlock;
