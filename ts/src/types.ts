import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { BaseMemory } from "@langchain/core/memory";

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
