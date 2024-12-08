# LangGraph Implementations

Demonstration of LangGraph implementations in both TypeScript and Python, showcasing structured conversation workflows with Claude 3's multimodal capabilities.

## Project Structure
```
langgraph/
├── ts/                   # TypeScript implementation
│   ├── src/
│   │   ├── main.ts
│   │   ├── conversationGraph.ts
│   │   ├── types.ts
│   │   ├── schema/
│   │   │   ├── typeDefs.ts      # GraphQL type definitions
│   │   │   └── resolvers.ts     # GraphQL resolvers
│   │   └── server.ts            # Apollo Server setup
│   └── package.json
│
└── python/              # Python implementation
    └── src/
        ├── main.py
        └── conversation_graph.py
```

## TypeScript Implementation

### Setup
1. Install dependencies:
```bash
cd ts
npm install
```

2. Create a `.env` file:
```bash
ANTHROPIC_API_KEY=your_key_here
```

### Run
```bash
npm start
```

## Python Implementation

### Setup
1. Install dependencies:
```bash
cd python
pip install -r requirements.txt
```

2. Create a `.env` file:
```bash
ANTHROPIC_API_KEY=your_key_here
```

### Run
```bash
python src/main.py
```

## Features
- Structured conversation flows using LangGraph
- Claude 3 integration for:
  - Advanced text analysis
  - Image understanding
  - Multi-turn conversations
- Memory management
- Type-safe implementations

## Documentation References

### LangGraph
- [LangGraph Documentation](https://python.langchain.com/docs/langgraph)
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)

### Anthropic Claude
- [Claude API Documentation](https://docs.anthropic.com/claude/docs)
- [Claude TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Claude Python SDK](https://github.com/anthropics/anthropic-sdk-python)

### LangChain
- [LangChain Documentation](https://python.langchain.com/docs/get_started/introduction)
- [LangChain TypeScript](https://js.langchain.com/docs/get_started/introduction)

## Requirements

### TypeScript
- Node.js 16+
- TypeScript 4.5+
- @anthropic-ai/sdk
- @langchain/core

### Python
- Python 3.9+
- anthropic
- langgraph
- langchain

## Usage

### Commands
- Text chat: Type your message and press Enter
- Image analysis: `--image path/to/image.jpg`
- Exit: Type `quit`

## Contributing
Contributions welcome! Please read our contributing guidelines and submit pull requests.

## License
MIT License - see LICENSE file for details

### GraphQL API

Start the GraphQL server:
```bash
npm run serve
```

Example queries:
```graphql
# Get conversation state
query GetState {
  getState {
    messages {
      role
      content
    }
    imageAnalysis {
      id
      content
    }
  }
}

# Send a message
mutation SendMessage {
  sendMessage(content: "Hello Claude!") {
    role
    content
  }
}

# Analyze an image
mutation AnalyzeImage {
  analyzeImage(base64Image: "...base64 encoded image...") {
    id
    content
  }
}
```

### GraphQL Client Commands

The agent can discover and query GraphQL servers using these commands:

```bash
# Discover a GraphQL server and its schema
discover graphql https://api.example.com/graphql

# Execute a query against a discovered server
query graphql https://api.example.com/graphql query { 
  users { 
    id 
    name 
  } 
}
```

The agent will:
- Discover available types and fields through introspection
- Cache GraphQL clients for discovered servers
- Execute queries and return formatted results
- Handle errors gracefully with informative messages

### Test with public GraphQL APIs:

# Star Wars API
discover graphql https://swapi-graphql.netlify.app/.netlify/functions/index
query graphql https://swapi-graphql.netlify.app/.netlify/functions/index query { 
  allFilms {
    films {
      title
      releaseDate
    }
  }
}

# Countries API
discover graphql https://countries.trevorblades.com/graphql

# Example query for Countries
query graphql https://countries.trevorblades.com/graphql query {
  countries {
    name
    capital
    currency
  }
}

# Rick and Morty API
discover graphql https://rickandmortyapi.com/graphql

# Example query for Rick and Morty
query graphql https://rickandmortyapi.com/graphql query {
  characters {
    results {
      name
      species
    }
  }
}
