import { createInterface } from 'readline';
import { SchemaDiscoveryTool, GraphQLQueryTool } from './tools/graphqlTools.js';
import { config } from 'dotenv';

config();

const WELCOME_MESSAGE = `Welcome to GraphQL Explorer! 🚀

I'm your AI assistant for discovering and querying GraphQL APIs. I can help you:
• Discover and understand new GraphQL APIs
• Generate and execute queries based on your questions
• Keep track of APIs you've explored

To get started:
1. Share a GraphQL endpoint URL (starts with http)
2. I'll analyze its capabilities and show you what's possible
3. Then you can ask questions about the data!

Some popular GraphQL APIs to try:
• https://graphql.anilist.co (Anime/Manga data)
• https://countries.trevorblades.com/graphql (Country information)
• https://rickandmortyapi.com/graphql (Rick and Morty show data)

What API would you like to explore?`;

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

const schemaDiscovery = new SchemaDiscoveryTool(process.env.ANTHROPIC_API_KEY || '');
const queryTool = new GraphQLQueryTool(process.env.ANTHROPIC_API_KEY || '');

async function processInput(input: string): Promise<void> {
    if (input.toLowerCase() === 'quit') {
        console.log('Thanks for exploring GraphQL APIs with me! Come back anytime! 👋');
        rl.close();
        return;
    }

    try {
        if (input.startsWith('http')) {
            const response = await schemaDiscovery._call(input);
            console.log(response);
        } else {
            const response = await queryTool._call(input);
            console.log(response);
        }
    } catch (error) {
        console.error('Error:', error);
    }

    rl.question('> ', processInput);
}

console.log(WELCOME_MESSAGE);
rl.question('> ', processInput);