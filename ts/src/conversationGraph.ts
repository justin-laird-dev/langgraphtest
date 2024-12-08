import { AIMessage, BaseMessage, SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, END } from "@langchain/langgraph";
import { GraphQLQueryTool } from "./tools/graphqlTools.js";

interface AgentState {
    messages: BaseMessage[];
    currentEndpoint?: string;
}

export function createConversationGraph(apiKey: string) {
    const tools = [
        new GraphQLQueryTool(apiKey)
    ];

    const model = new ChatAnthropic({
        anthropicApiKey: apiKey,
        modelName: "claude-3-sonnet-20240229"
    });

    async function callModel(state: AgentState) {
        // Check if input is a URL and handle schema discovery
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage instanceof HumanMessage) {
            const content = lastMessage.content.toString();
            if (content.startsWith('http')) {
                state.currentEndpoint = content;
                try {
                    const result = await tools[0]._call(content);
                    return {
                        messages: [
                            ...state.messages,
                            new AIMessage({ content: `I've discovered the schema: ${result}. What would you like to know about this API?` })
                        ],
                        currentEndpoint: state.currentEndpoint
                    };
                } catch (error) {
                    return {
                        messages: [
                            ...state.messages,
                            new AIMessage({ content: `Error discovering schema: ${error.message}` })
                        ],
                        currentEndpoint: undefined
                    };
                }
            }
        }

        // For questions, use the query tool if we have an endpoint
        if (state.currentEndpoint) {
            try {
                const result = await tools[0]._call(`${state.currentEndpoint} ${lastMessage.content}`);
                const response = await model.invoke([
                    new SystemMessage(`You are a helpful assistant that explains GraphQL query results.
                        1. Look at the data structure
                        2. Understand what information is present
                        3. Present it in a clear, organized way
                        4. If it's a list, format it nicely
                        5. Include relevant details but be concise
                        
                        The user asked: "${lastMessage.content}"
                        Here's the data:`),
                    new HumanMessage(result)
                ]);
                return {
                    messages: [...state.messages, response],
                    currentEndpoint: state.currentEndpoint
                };
            } catch (error) {
                return {
                    messages: [
                        ...state.messages,
                        new AIMessage({ content: `Error querying API: ${error.message}` })
                    ],
                    currentEndpoint: state.currentEndpoint
                };
            }
        }

        // Default conversation
        const response = await model.invoke([
            new SystemMessage("You are a helpful assistant that can interact with GraphQL APIs. If the user provides a URL, you'll discover its schema. If they ask questions about a discovered API, you'll query it for them."),
            ...state.messages
        ]);

        return {
            messages: [...state.messages, response],
            currentEndpoint: state.currentEndpoint
        };
    }

    const workflow = new StateGraph<AgentState>({
        channels: {
            messages: {
                value: (left: BaseMessage[], right: BaseMessage[]) => [...left, ...right],
                default: () => []
            },
            currentEndpoint: {
                value: (_left: string | undefined, right: string | undefined) => right,
                default: () => undefined
            }
        }
    });

    workflow.addNode("agent", callModel);
    workflow.setEntryPoint("agent");
    workflow.addEdge("agent", END);

    return workflow.compile();
}
