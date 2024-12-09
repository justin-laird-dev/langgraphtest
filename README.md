# GraphQL Explorer

An AI-powered assistant that helps you explore and interact with GraphQL APIs using natural language. It understands multiple APIs simultaneously and intelligently chooses the right one for your questions.

## Features

- 🧠 **API Understanding**: Automatically learns what each GraphQL API can do
- 🎯 **Smart API Selection**: Picks the most relevant API for your questions
- 💬 **Natural Language**: Just ask questions in plain English
- 🔍 **Auto-Discovery**: Analyzes any GraphQL API you share
- 🤹 **Multi-API**: Works with multiple APIs at once
- 📝 **Detailed Logging**: Optional debug mode to see what's happening

## Quick Start

```bash
# Install dependencies
npm install

# Set up your API key
cp .env.example .env
# Add your Anthropic API key to .env

# Run the explorer
npm start
```

## Example Conversation

```
> What can you do?
I can help you explore GraphQL APIs! Share an API endpoint with me or ask about data.

> https://countries.trevorblades.com/graphql
I've analyzed the API. It provides information about countries, continents, and languages.

> How many countries are in Asia?
There are 48 countries in Asia...

> What's the most popular anime this season?
Let me check the AniList API for that information...
```

## How It Works

The explorer uses two main components:

### 1. Schema Discovery
- Learns what an API can do when you share it
- Understands its capabilities and data types
- Remembers APIs for future use

### 2. Query Generation
- Picks the right API for your question
- Turns your question into a GraphQL query
- Explains the results in plain English

## Project Structure

```
src/
├── tools/
│   └── graphqlTools.ts    # API interaction logic
├── utils/
│   └── logging.ts         # Debug logging
└── main.ts               # Core application
```

## Supported APIs

Works with any GraphQL API! Some popular ones to try:

- **Countries**: https://countries.trevorblades.com/graphql
  - Country info, languages, continents
  
- **Anime/Manga**: https://graphql.anilist.co
  - Anime, manga, characters
  
- **Rick & Morty**: https://rickandmortyapi.com/graphql
  - Show characters and episodes

## Debug Mode

See what's happening under the hood:
```bash
DEBUG=graphql,agent npm start
```

Shows:
- API requests and responses
- Why APIs were chosen
- Query generation process

## Development

### Requirements
- Node.js 18+
- TypeScript 4.5+
- Anthropic API key

### Key Files

- `graphqlTools.ts`: Core API handling
- `logging.ts`: Debug utilities
- `main.ts`: Application entry point

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## License

MIT - See LICENSE file

## Notes

- The explorer remembers APIs between questions
- It can handle multiple APIs at once
- Debug mode is helpful for development
- No API keys needed except for Anthropic
