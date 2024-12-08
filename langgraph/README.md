# LangGraph Demo with Claude Vision

A demonstration of Claude 3's multimodal capabilities using LangGraph for workflow management.

## Features
- Interactive chat with Claude 3 Sonnet
- Image analysis using Claude's vision capabilities 
- Conversation memory and context management
- Support for multiple image formats (png, jpg, jpeg, gif)

## Setup & Usage

1. Install dependencies:
   pip install -r requirements.txt

2. Create .env file with your API key:
   ANTHROPIC_API_KEY=your_key_here

3. Run the application:
   python src/main.py

## Commands
- Chat: Type any message
- Images: --image path/to/image.png
- Exit: Type 'quit'

## Example
Get a random cat image:
curl -o cat.png https://cataas.com/cat

Then analyze it:
python src/main.py
--image cat.png

## License
MIT