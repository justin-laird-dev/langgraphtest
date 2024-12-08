# LangGraph Demo with Claude Vision

A comprehensive demonstration of Claude 3's multimodal capabilities integrated with LangGraph for structured conversation workflows. This project showcases how to build an interactive chat application with image analysis features using TypeScript and the latest Claude 3 model.

## Features
- Interactive chat powered by Claude 3 Sonnet (latest model: claude-3-sonnet-20240229)
- Advanced image analysis using Claude's multimodal capabilities
- Structured conversation flow using LangGraph
- Robust memory and context management
- Support for multiple image formats (JPEG, PNG)
- Type-safe implementation in TypeScript
- Detailed debugging and error handling

## Architecture
The project uses a graph-based architecture with distinct nodes for:
- Image analysis
- Response generation
- State management
- Memory handling

## Prerequisites
- Node.js 18+ 
- TypeScript 5.3+
- An Anthropic API key

## Setup & Installation

1. Clone the repository:
   \`\`\`
   git clone https://github.com/yourusername/langgraph-demo
   cd langgraph-demo
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

3. Create a \`.env\` file in the root directory:
   \`\`\`
   ANTHROPIC_API_KEY=your_api_key_here
   \`\`\`

## Usage

\`\`\`typescript
import { ChatFlow } from './src/chatFlow';

const flow = new ChatFlow();
await flow.start({
  message: "Analyze this image",
  imageUrl: "./path/to/image.jpg"
});
\`\`\`

## Project Structure
\`\`\`
langgraph-demo/
├─�├─�├─�├─�├─�├─�├─� ├── imageAnalysis.ts
│   │   ├�│   │   ├�│   │   ├�│   │   ��─ stateManagement.ts
│   ├── types/
│   │   └── index.ts
│   └── chatFlow.ts
├── tests/
├── .env
└── package.json
\`\`\`

## Contributing
1. Fork the repository
2.2.2.2.2.2.2.2.eature branch (\`git che2.2.2.2.2.2.ture/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing featu3. Commit your ch the branch (\`git3. Commit your changes (\`git commit -m 'Add some amaz Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Anthropic for the Claude 3 API
- LangGraph community
- Contributors and maintainers

## Support
For support, please open an issue in the GitHub repository or contact the maintainers.
