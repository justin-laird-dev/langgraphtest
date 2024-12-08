import debug from 'debug';

const graphqlLogger = debug('graphql');
const agentLogger = debug('agent');

export function log(message: string, ...args: any[]) {
    agentLogger('[GraphQL Agent]', message, ...args);
}

export function logGraphQLRequest(operation: string, endpoint: string, query: string) {
    graphqlLogger(`\n=== GraphQL ${operation} Request ===`);
    graphqlLogger(`Endpoint: ${endpoint}`);
    graphqlLogger(`Query:\n${query}\n`);
}

export function logGraphQLResponse(operation: string, response: any) {
    graphqlLogger(`\n=== GraphQL ${operation} Response ===`);
    graphqlLogger(JSON.stringify(response, null, 2));
    graphqlLogger('===========================\n');
}

export function logDebug(category: string, message: string, data?: any) {
    if (process.env.DEBUG) {
        console.log(`[DEBUG:${category}] ${message}`);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
    }
} 