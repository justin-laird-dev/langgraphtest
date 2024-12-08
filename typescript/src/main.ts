import * as dotenv from 'dotenv';
import { ConversationGraph } from './conversationGraph';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.error('ANTHROPIC_API_KEY not found in environment variables');
        process.exit(1);
    }

    const graph = new ConversationGraph(apiKey);
    console.log('Welcome! Send messages or use "--image path/to/image.jpg" to analyze images. Type "quit" to exit.');

    while (true) {
        const input = await new Promise<string>(resolve => rl.question('\nYou: ', resolve));

        if (input.toLowerCase() === 'quit') {
            break;
        }

        try {
            let response: string;

            if (input.startsWith('--image')) {
                const imagePath = input.split(' ')[1];
                if (!imagePath) {
                    console.log('Please provide an image path');
                    continue;
                }

                try {
                    console.log(`Reading image from: ${path.resolve(imagePath)}`);
                    const imageData = await readFile(path.resolve(imagePath));
                    console.log(`Successfully read image: ${imageData.length} bytes`);
                    
                    if (imageData.length === 0) {
                        console.error('Image file is empty');
                        continue;
                    }

                    response = await graph.processMessage(imageData);
                } catch (error: any) {
                    if (error.code === 'ENOENT') {
                        console.error('Image file not found:', imagePath);
                    } else {
                        console.error('Error processing image:', error.message || error);
                    }
                    continue;
                }
            } else {
                response = await graph.processMessage(input);
            }

            console.log('\nClaude:', response);

        } catch (error: any) {
            console.error('Error:', error.message || error);
        }
    }

    rl.close();
}

main().catch(console.error);
