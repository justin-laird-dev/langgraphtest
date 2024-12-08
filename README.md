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
python src/main.py --images image.jpg --question "What colors are present in this image?"
```

## Examples

Here are some sample questions you can ask:
- "Describe what you see in this image"
- "What objects are present?"
- "What is the overall mood or atmosphere?"
- "Are there any people in this image?"
- "What time of day does this appear to be?"

## Notes
- The model works best with clear, well-lit images
- You can analyze up to 10 images at once
- Supported image formats: JPG, PNG, WEBP