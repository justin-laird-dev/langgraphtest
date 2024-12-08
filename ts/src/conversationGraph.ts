import { Anthropic } from "@anthropic-ai/sdk";
import { ConversationState, Graph } from "./types";
import * as fs from "fs";
import * as path from "path";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export function createConversationGraph(apiKey: string): Graph {
    const claude = new Anthropic({
        apiKey: apiKey
    });

    async function analyzeImages(state: ConversationState): Promise<ConversationState> {
        console.log("Debug: Entering analyze_images");
        const latestMessage = state.messages[state.messages.length - 1];
        
        if (latestMessage.additional_kwargs?.image_data) {
            try {
                const imageData = latestMessage.additional_kwargs.image_data as Buffer;
                console.log("Debug: Image data size:", imageData.byteLength);
                
                // Convert to base64 with proper encoding
                const imageBase64 = imageData.toString('base64');
                console.log("Debug: Converted to base64");
                
                // Try different media types
                const mediaTypes = ["image/jpeg", "image/png"] as const;
                let lastError = null;
                
                for (const mediaType of mediaTypes) {
                    try {
                        const response = await claude.messages.create({
                            model: "claude-3-sonnet-20240229",
                            max_tokens: 4096,
                            messages: [{
                                role: "user",
                                content: [{
                                    type: "image",
                                    source: {
                                        type: "base64",
                                        media_type: mediaType,
                                        data: imageBase64
                                    }
                                }, {
                                    type: "text",
                                    text: "Please analyze this image"
                                }]
                            }]
                        });
                        
                        console.log("Debug: Got response from Claude");
                        const contentBlock = response.content[0];
                        const analysis = typeof contentBlock === 'object' && 'text' in contentBlock ? contentBlock.text : '';
                        console.log("Debug: Analysis:", analysis);
                        
                        state.image_analysis[Object.keys(state.image_analysis).length.toString()] = analysis;
                        state.messages.push(new AIMessage({ content: analysis }));
                        return state;
                    } catch (e) {
                        lastError = e;
                        continue;
                    }
                }
                throw lastError;
            } catch (e) {
                console.error("Debug: Error in image analysis:", e);
                throw e;
            }
        }
        return state;
    }

    async function generateResponse(state: ConversationState): Promise<ConversationState> {
        console.log("Debug: Entering generate_response");
        console.log("Debug: Current messages:", state.messages.length);
        
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            console.log("Debug: Last message type:", lastMessage instanceof AIMessage ? "AI" : "Human");
            if (!(lastMessage instanceof AIMessage)) {
                let context = "";
                if (Object.keys(state.image_analysis).length > 0) {
                    context = "Previous image analysis:\n" + 
                             Object.values(state.image_analysis).join("\n") + "\n\n";
                }
                
                const prompt = context + lastMessage.content;
                
                if (prompt.trim()) {
                    const response = await claude.messages.create({
                        model: "claude-3-sonnet-20240229",
                        max_tokens: 4096,
                        messages: [{ role: "user", content: prompt }]
                    });
                    
                    state.messages.push(new AIMessage({ content: response.content }));
                }
            }
            return state;
        } catch (e) {
            console.error("Debug: Error in generate_response:", e);
            throw e;
        }
    }

    return {
        nodes: new Map([
            ["START", { process: async (state) => state }],
            ["analyze_images", { process: analyzeImages }],
            ["generate_response", { process: generateResponse }],
            ["END", { process: async (state) => state }]
        ]),
        edges: new Map([
            ["START", "analyze_images"],
            ["analyze_images", "generate_response"],
            ["generate_response", "END"]
        ]),
        startNode: "START",
        endNode: "END"
    };
}
