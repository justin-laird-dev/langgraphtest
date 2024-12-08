import { GraphQLClient } from 'graphql-request';

export class GraphQLService {
    private clients: Map<string, GraphQLClient> = new Map();

    hasServer(url: string): boolean {
        return this.clients.has(url);
    }

    async discoverServer(url: string) {
        const client = new GraphQLClient(url);
        const schema = await client.request(`
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
                                type {
                                    name
                                    kind
                                    ofType { name kind }
                                }
                                defaultValue
                            }
                            type {
                                name
                                kind
                                ofType { name kind }
                            }
                        }
                        inputFields {
                            name
                            description
                            type {
                                name
                                kind
                                ofType { name kind }
                            }
                            defaultValue
                        }
                    }
                }
            }
        `);
        this.clients.set(url, client);
        return schema;
    }

    async queryServer(url: string, query: string) {
        const client = this.clients.get(url);
        if (!client) {
            throw new Error(`Server not discovered: ${url}`);
        }
        return await client.request(query);
    }
} 