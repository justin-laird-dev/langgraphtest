# LangGraph Demo with Claude Vision

A demonstration of using LangGraph with Claude 3's multimodal capabilities to analyze images.

## Documentation Links
- [LangGraph Documentation](https://python.langchain.com/docs/langgraph)
- [Claude 3 API Documentation](https://docs.anthropic.com/claude/docs)
- [LangChain Anthropic Integration](https://python.langchain.com/docs/integrations/chat/anthropic)
- [Claude Vision Guide](https://docs.anthropic.com/claude/docs/vision)

## Setup

1. Clone the repository
2. Create a `.env` file with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```
3. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Basic usage:
```bash
python src/main.py --images path/to/image.jpg
```

Multiple images:
```bash
python src/main.py --images image1.jpg image2.jpg
```

Custom question:
```bash
python src/main.py --images image.jpg
```