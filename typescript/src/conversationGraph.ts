import { Anthropic } from "@anthropic-ai/sdk";
import type { Message } from '@anthropic-ai/sdk/resources/messages';
import { ConversationState, ContentBlock, StoredMessage, MediaType } from "./types";
import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

export class ConversationGraph {
    private model: Anthropic;
    private state: ConversationState;

    constructor(apiKey: string) {
        this.model = new Anthropic({
            apiKey: apiKey
        });

        this.state = {
            messages: [],
            imageAnalysis: {}
        };
    }

    private async analyzeImage(imageData: Buffer): Promise<string> {
        try {
            const base64Image = imageData.toString('base64');
            
            // Debug logging
            console.log("Image size:", imageData.length, "bytes");
            console.log("MIME type:", this.getMimeType(imageData));
            
            const content: ContentBlock[] = [
                {
                    type: "text",
                    text: "Please provide a detailed analysis of this image, including:\n" +
                          "1. All visible section headings\n" +
                          "2. Key rules and mechanics mentioned\n" +
                          "3. Any specific numerical values or modifiers\n" +
                          "4. Tables or structured data\n" +
                          "5. Important terms and definitions\n" +
                          "Please be as specific as possible in extracting and organizing this information."
                },
                {
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: this.getMimeType(imageData),
                        data: base64Image
                    }
                }
            ];

            const response = await this.model.messages.create({
                model: "claude-3-sonnet-20240229",
                max_tokens: 4096,
                messages: [{
                    role: "user",
                    content
                }]
            });

            return response.content[0].text;
        } catch (error) {
            console.error("Image analysis error details:", error);
            throw error;
        }
    }

    // Helper method to detect MIME type
    private getMimeType(buffer: Buffer): MediaType {
        const signatures: Record<string, MediaType> = {
            'ffd8ffe0': 'image/jpeg',
            '89504e47': 'image/png',
            '47494638': 'image/gif',
            '52494646': 'image/webp'
        };

        // Get first 4 bytes as hex
        const hex = buffer.toString('hex', 0, 4);
        
        // Log for debugging
        console.log("File signature:", hex);
        
        for (const [signature, mimeType] of Object.entries(signatures)) {
            if (hex.startsWith(signature)) {
                return mimeType;
            }
        }
        
        return 'image/jpeg'; // default fallback
    }

    private async generateResponse(userMessage: string): Promise<string> {
        try {
            const context = Object.values(this.state.imageAnalysis).length > 0
                ? "Previous image analysis:\n" + Object.values(this.state.imageAnalysis).join("\n\n") + "\n\n"
                : "";

            const response = await this.model.messages.create({
                model: "claude-3-sonnet-20240229",
                max_tokens: 4096,
                messages: [{
                    role: "user",
                    content: userMessage || "Hello"  // Provide default message if empty
                }]
            });

            return response.content[0].text;
        } catch (error) {
            console.error("Error generating response:", error);
            throw error;
        }
    }

    async processMessage(input: string | Buffer): Promise<string> {
        try {
            let response: string;

            if (Buffer.isBuffer(input)) {
                response = await this.analyzeImage(input);
                this.state.imageAnalysis[String(Object.keys(this.state.imageAnalysis).length)] = response;
            } else {
                response = await this.generateResponse(input);
            }

            // Store the interaction using our StoredMessage type
            const userMessage: StoredMessage = {
                role: "user",
                content: typeof input === 'string' ? input : "Uploaded an image"
            };

            const assistantMessage: StoredMessage = {
                role: "assistant",
                content: response
            };

            this.state.messages.push(userMessage, assistantMessage);

            return response;

        } catch (error) {
            console.error('Error processing message:', error);
            throw error;
        }
    }

    getState(): ConversationState {
        return this.state;
    }
}
