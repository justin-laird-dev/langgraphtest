import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { ConversationState, Graph } from './types';
import { BufferMemory } from "langchain/memory";
import { ChatAnthropic } from "@langchain/anthropic";
import { createConversationGraph } from './conversationGraph';
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import * as fs from 'fs';

async function main() {
    dotenv.config();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY not found in environment variables");
    }
    
    const llm = new ChatAnthropic({
        anthropicApiKey: apiKey,
        modelName: "claude-3-sonnet-20240229"
    });
    
    console.log("Debug: Creating conversation graph");
    const graph = createConversationGraph(apiKey);
    
    // Initialize state
    const state: ConversationState = {
        messages: [],
        memory: new BufferMemory(),
        image_analysis: {}
    };
    
    console.log("Welcome! Send messages or use '--image path/to/image.jpg' to analyze images. Type 'quit' to exit.");
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while (true) {
        const userInput = await new Promise<string>(resolve => rl.question("\nYou: ", resolve));
        
        if (userInput.toLowerCase() === 'quit') {
            break;
        }
        
        try {
            // Handle image input
            if (userInput.startsWith('--image')) {
                const imagePath = userInput.split(' ')[1];
                if (!fs.existsSync(imagePath)) {
                    console.log(`Error: Image file not found: ${imagePath}`);
                    continue;
                }
                
                const imageData = fs.readFileSync(imagePath);
                state.messages.push(new HumanMessage({ 
                    content: "Please analyze this image",
                    additional_kwargs: { image_data: imageData }
                }));
            } else {
                state.messages.push(new HumanMessage({ content: userInput }));
            }
            
            // Process through graph
            const newState = await executeGraph(state, graph);
            
            // Update state and show response
            if (newState.messages.length > 0) {
                const lastMessage = newState.messages[newState.messages.length - 1];
                if (lastMessage instanceof AIMessage) {
                    console.log("\nClaude:", lastMessage.content);
                }
            }
            
            // Update state for next iteration
            Object.assign(state, newState);
            
        } catch (error) {
            console.error("Error:", error);
        }
    }

    rl.close();
}

async function executeGraph(state: ConversationState, graph: Graph) {
    console.log("Debug: Starting graph execution");
    let currentNode = graph.startNode;
    let currentState = { ...state };

    while (currentNode && currentNode !== graph.endNode) {
        console.log(`Debug: Processing node: ${currentNode}`);
        const node = graph.nodes.get(currentNode);
        if (!node) {
            console.log(`Debug: No node found for ${currentNode}`);
            break;
        }

        try {
            currentState = await node.process(currentState);
            const nextNode = graph.edges.get(currentNode);
            if (!nextNode) {
                console.log(`Debug: No edge found from ${currentNode}`);
                break;
            }
            currentNode = nextNode;
        } catch (error) {
            console.error(`Debug: Error in node ${currentNode}:`, error);
            throw error;
        }
    }

    console.log("Debug: Graph execution completed");
    return currentState;
}

if (require.main === module) {
    main().catch(console.error);
}