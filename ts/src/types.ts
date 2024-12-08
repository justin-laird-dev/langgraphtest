import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { BaseMemory } from "@langchain/core/memory";
import { z } from 'zod';

export interface ConversationState {
    messages: BaseMessage[];
    memory: BaseMemory;
    image_analysis: Record<string, string>;
}

export interface GraphNode {
    process: (state: ConversationState) => Promise<ConversationState>;
}

export interface Graph {
    nodes: Map<string, GraphNode>;
    edges: Map<string, string>;
    startNode: string;
    endNode: string;
}

export abstract class Tool {
    abstract name: string;
    abstract description: string;
    abstract schema: z.ZodEffects<z.ZodObject<any, any, any>, any, any>;
    abstract _call(input: string): Promise<string>;
}
