import { z } from 'zod';
import { Tool } from '../types.js';
import { Anthropic } from '@anthropic-ai/sdk';
import { log, logDebug, logGraphQLRequest, logGraphQLResponse } from '../utils/logging.js';
import { callLLM, getTextContent, callWithTimeout } from '../utils/graphql.js';
import { GraphQLClient } from 'graphql-request';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const introspectionQuery = `
query IntrospectionQuery {
    __schema {
        queryType { name }
        types {
            name
            kind
            description
            fields {
                name
                description
                args {
                    name
                    description
                    type { name kind ofType { name kind } }
                }
                type { name kind ofType { name kind } }
            }
        }
    }
}`;

interface APIInfo {
    name: string;
    description: string;
    queryCount: number;
    lastQueryTime?: number;
    schema: GraphQLSchema;
    semantics: {
        domain: string;
        capabilities: string[];
        relationships: string[];
    };
    url: string;
}

export class SchemaStore {
    private static instance: SchemaStore;
    private apis: Map<string, APIInfo> = new Map();

    private constructor() {}

    static getInstance(): SchemaStore {
        if (!SchemaStore.instance) {
            SchemaStore.instance = new SchemaStore();
        }
        return SchemaStore.instance;
    }

    private extractQueryConcepts(query: string): Set<string> {
        const queryLower = query.toLowerCase();
        // Common geographic terms
        const geographicTerms = ['country', 'countries', 'continent', 'continents', 'language', 'languages', 
                               'capital', 'region', 'europe', 'asia', 'africa', 'america', 'oceania',
                               'population', 'currency', 'speak', 'spoken'];
        // Common media/entertainment terms
        const mediaTerms = ['anime', 'manga', 'episode', 'character', 'series', 'show', 'movie',
                          'season', 'rating', 'popular', 'top', 'latest'];
        
        const concepts = new Set<string>();
        // Add individual words
        queryLower.split(/\s+/).forEach(word => concepts.add(word));
        // Add matching domain terms
        geographicTerms.forEach(term => {
            if (queryLower.includes(term)) concepts.add(term);
        });
        mediaTerms.forEach(term => {
            if (queryLower.includes(term)) concepts.add(term);
        });
        
        return concepts;
    }

    findRelevantAPIs(query: string): Array<{api: APIInfo, relevance: number}> {
        if (this.apis.size === 0) return [];
        
        const concepts = this.extractQueryConcepts(query);
        const apis = Array.from(this.apis.values());
        
        // Score each API based on relevance to the query
        const scores = apis.map(api => {
            let relevance = 0;
            
            // Combine all API text for matching
            const apiText = [
                api.description.toLowerCase(),
                ...api.semantics.capabilities.map(c => c.toLowerCase()),
                ...api.semantics.relationships.map(r => r.toLowerCase())
            ].join(' ');
            
            // Check each concept against API description and capabilities
            concepts.forEach(concept => {
                // Higher score for matches in domain description
                if (api.description.toLowerCase().includes(concept)) relevance += 3;
                // Score for matches in capabilities
                if (api.semantics.capabilities.some(c => 
                    c.toLowerCase().includes(concept))) relevance += 2;
                // Score for matches in relationships
                if (api.semantics.relationships.some(r => 
                    r.toLowerCase().includes(concept))) relevance += 1;
            });
            
            // Boost score for APIs that match the query's domain
            if ((apiText.includes('country') || apiText.includes('continent')) && 
                (concepts.has('countries') || concepts.has('continent') || 
                 concepts.has('asia') || concepts.has('europe'))) {
                relevance += 5;
            }
            if (apiText.includes('anime') && 
                (concepts.has('anime') || concepts.has('manga'))) {
                relevance += 5;
            }
            
            logDebug('scoring', `API ${api.name} relevance: ${relevance}`, {
                concepts: Array.from(concepts),
                apiText: apiText.substring(0, 100) + '...'
            });
            
            return { api, relevance };
        });
        
        // Return all APIs with non-zero relevance, sorted by score
        return scores
            .filter(s => s.relevance > 0)
            .sort((a, b) => b.relevance - a.relevance);
    }

    getAPISummary(): string {
        if (this.apis.size === 0) {
            return "I haven't discovered any APIs yet. Share a GraphQL endpoint with me to get started! Here are some you can try:\n\n" +
                   "• https://graphql.anilist.co (Anime/Manga data)\n" +
                   "• https://countries.trevorblades.com/graphql (Country information)\n" +
                   "• https://rickandmortyapi.com/graphql (Rick and Morty show data)";
        }

        const summaries = Array.from(this.apis.values()).map(api => 
            `• ${api.name} (${api.url})\n  ${api.description}\n  Key capabilities: ${api.semantics.capabilities.join(', ')}`
        );

        return "I know about these GraphQL APIs:\n\n" + summaries.join('\n\n') + 
               "\n\nI can help you explore any of these APIs or discover new ones!";
    }

    isAPIRelatedQuery(input: string): boolean {
        const apiKeywords = [
            'api', 'apis', 'endpoints', 'services',
            'what can you do', 'what do you know',
            'show me', 'list', 'available', 'capabilities',
            'which apis', 'what apis', 'known apis'
        ];
        
        const inputLower = input.toLowerCase();
        return apiKeywords.some(keyword => inputLower.includes(keyword));
    }

    getAPI(url: string): APIInfo | undefined {
        return this.apis.get(url);
    }

    getKnownAPIs(): APIInfo[] {
        return Array.from(this.apis.values());
    }

    incrementQueryCount(url: string) {
        const api = this.apis.get(url);
        if (api) {
            api.queryCount++;
            api.lastQueryTime = Date.now();
            this.apis.set(url, api);
        }
    }

    addAPI(url: string, schema: GraphQLSchema, semantics: any) {
        this.apis.set(url, {
            name: new URL(url).hostname,
            description: semantics.domain,
            queryCount: 0,
            lastQueryTime: Date.now(),
            schema,
            semantics,
            url
        });
        logDebug('store', `Added API: ${url}`, this.getAPISummary());
    }
}

function simplifySchema(schema: GraphQLSchema) {
    const types = schema.__schema.types;
    // Get root query fields first
    const queryType = types.find((t: any) => t.name === 'Query');
    const queryFields = queryType?.fields?.map((f: any) => ({
        name: f.name,
        description: f.description,
        returnType: f.type.name || f.type.ofType?.name,
        args: f.args?.map((a: any) => a.name).join(', ')
    }));

    // Get main types referenced in queries
    const mainTypeNames = new Set(queryFields?.map((f: any) => f.returnType));
    const mainTypes = types
        .filter((t: any) => 
            mainTypeNames.has(t.name) && 
            !t.name.startsWith('__') &&
            t.kind === 'OBJECT'
        )
        .map((t: any) => ({
            name: t.name,
            description: t.description,
            fields: (t.fields || [])
                .filter((f: any) => !f.name.startsWith('_'))
                .slice(0, 10)  // Only first 10 fields per type
                .map((f: any) => f.name)
                .join(', ')
        }));

    return {
        queries: queryFields?.slice(0, 10),  // Only first 10 queries
        types: mainTypes
    };
}

interface GraphQLSchema {
    __schema: {
        queryType: {
            name: string;
            fields: any[];
        };
        types: any[];
    };
}

function isGraphQLSchema(obj: any): obj is GraphQLSchema {
    return obj && 
           typeof obj === 'object' && 
           '__schema' in obj &&
           obj.__schema &&
           'queryType' in obj.__schema &&
           'types' in obj.__schema;
}

export class GraphQLQueryTool extends Tool {
    name = "graphql_query";
    description = "Makes GraphQL queries using discovered schemas";
    schema = z.object({
        input: z.string().optional()
    }).transform(input => input?.input || "");

    private store = SchemaStore.getInstance();
    private agent: Anthropic;

    constructor(apiKey: string) {
        super();
        this.agent = new Anthropic({ apiKey });
    }

    private async generateQuery(schema: GraphQLSchema, question: string): Promise<string> {
        const analysis = await callLLM(this.agent, [{
            role: "user",
            content: `Given this GraphQL schema and user question, generate a valid GraphQL query.
            
            Schema: ${JSON.stringify(schema.__schema, null, 2)}
            Question: "${question}"
            
            Return ONLY the GraphQL query, no explanation.`
        }]);

        return analysis.trim();
    }

    async _call(input: string): Promise<string> {
        try {
            // Handle API-related queries more naturally
            if (this.store.isAPIRelatedQuery(input)) {
                return this.store.getAPISummary();
            }

            // If input is a URL, analyze new API
            if (input.startsWith('http')) {
                if (this.store.getAPI(input)) {
                    const api = this.store.getAPI(input)!;
                    return `I already know about the ${api.name} API.\n${api.description}\n\nCapabilities:\n${api.semantics.capabilities.map(c => `• ${c}`).join('\n')}`;
                }
                return "I need to analyze this API first. Let me do that for you.";
            }

            // Find relevant APIs for this query
            const relevantAPIs = this.store.findRelevantAPIs(input);
            if (relevantAPIs.length === 0) {
                const apis = this.store.getKnownAPIs();
                if (apis.length === 0) {
                    return this.store.getAPISummary();
                } else {
                    return `I'm not sure which API would be best for that query. Here are the APIs I know about:\n\n${apis.map(api => 
                        `• ${api.name}: ${api.description}`).join('\n')}\n\nCould you clarify what you're looking for?`;
                }
            }

            // Try the most relevant API first
            const bestAPI = relevantAPIs[0].api;
            log(`Using ${bestAPI.name} API as it seems most relevant for this query.`);

            const query = await this.generateQuery(bestAPI.schema, input);
            logGraphQLRequest('Query', bestAPI.url, query);

            const client = new GraphQLClient(bestAPI.url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            const result = await client.request(query);
            logGraphQLResponse('Query', result);
            
            this.store.incrementQueryCount(bestAPI.url);
            
            let response = await callLLM(this.agent, [{
                role: "user",
                content: `The user asked: "${input}"
                I queried the ${bestAPI.name} API and got this data: ${JSON.stringify(result, null, 2)}
                
                ${relevantAPIs.length > 1 ? 
                    `Note: There are ${relevantAPIs.length - 1} other potentially relevant APIs: ${
                        relevantAPIs.slice(1).map(r => r.api.name).join(', ')
                    }` : ''}
                
                Analyze the data and provide a clear, natural response that answers the user's question.
                If the data seems insufficient, mention that we could try another relevant API.`
            }]);

            // Add context about other APIs if relevant
            if (relevantAPIs.length > 1) {
                response += `\n\nI used the ${bestAPI.name} API for this query, but I could also try ${
                    relevantAPIs.slice(1).map(r => r.api.name).join(' or ')
                } if you'd like different information.`;
            }

            return response;

        } catch (error) {
            log('Error:', error.message);
            if (error.message.includes('413')) {
                return "That query was too large for the API. Could you try a more specific question?";
            }
            return `I ran into an issue: ${error.message}. Would you like to try a different approach?`;
        }
    }
}

function simplifySchemaForAnalysis(schema: GraphQLSchema) {
    const types = schema.__schema.types;
    const queryType = types.find((t: any) => t.name === 'Query');
    
    // Get only the main query fields
    const mainQueries = queryType?.fields?.map(f => ({
        name: f.name,
        description: f.description,
        returnType: f.type.name || f.type.ofType?.name
    })).slice(0, 10);

    // Get only the main types
    const mainTypes = types
        .filter((t: any) => 
            t.kind === 'OBJECT' && 
            !t.name.startsWith('__') &&
            t.name !== 'Query' &&
            t.name !== 'Mutation'
        )
        .slice(0, 10)
        .map(t => ({
            name: t.name,
            description: t.description,
            fields: t.fields?.slice(0, 5).map((f: any) => f.name)
        }));

    return {
        queries: mainQueries,
        types: mainTypes
    };
}

export class SchemaDiscoveryTool extends Tool {
    name = "schema_discovery";
    description = "Discovers and analyzes GraphQL API schemas";
    schema = z.object({
        input: z.string().describe("The GraphQL endpoint URL")
    }).transform(input => input?.input || "");

    private store = SchemaStore.getInstance();
    private agent: Anthropic;

    constructor(apiKey: string) {
        super();
        this.agent = new Anthropic({ apiKey });
    }

    async _call(input: string): Promise<string> {
        try {
            log('Discovering new endpoint:', input);
            const client = new GraphQLClient(input, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            log('Discovering schema for:', input);
            logGraphQLRequest('Introspection', input, introspectionQuery);
            const schemaResponse = await client.request(introspectionQuery);
            logGraphQLResponse('Introspection', schemaResponse);
            
            const schema = schemaResponse as GraphQLSchema;

            log('Analyzing schema structure...');
            const simplified = simplifySchemaForAnalysis(schema);
            logDebug('schema', 'Simplified schema for analysis', simplified);

            const semanticResponse = await callLLM(this.agent, [{
                role: "user",
                content: `Analyze this simplified GraphQL schema and return a JSON object with:
                {
                    "domain": "One sentence description of what this API provides",
                    "capabilities": ["3-5 main features as bullet points"],
                    "relationships": ["2-3 key data relationships"]
                }

                Schema: ${JSON.stringify(simplified, null, 2)}
                
                Return ONLY valid JSON.`
            }]);

            const semantics = JSON.parse(semanticResponse.trim());
            logDebug('schema', 'Semantic analysis', semantics);

            log('Storing API information...');
            this.store.addAPI(input, schema, semantics);

            return `I've analyzed the API. ${semantics.domain}\n\nCapabilities:\n${semantics.capabilities.map(c => `• ${c}`).join('\n')}\n\nWhat would you like to know?`;

        } catch (error) {
            log('Error:', error);
            return `I had trouble analyzing that API: ${error.message}. Could you check the endpoint and try again?`;
        }
    }
} 