from typing import TypedDict, Annotated, Sequence, Union, Literal
from langgraph.graph import Graph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage
import os
from dotenv import load_dotenv
import argparse
import base64
from pathlib import Path

# Load environment variables
load_dotenv()
if not os.getenv("ANTHROPIC_API_KEY"):
    print("Error: ANTHROPIC_API_KEY not found in environment variables")
    exit(1)

def encode_image_to_base64(image_path: str) -> str:
    """Convert image to base64 string"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Define our state type
class AgentState(TypedDict):
    messages: Sequence[HumanMessage | AIMessage]
    next_step: str

# Create our chat model
model = ChatAnthropic(model="claude-3-sonnet-20240229")
print("Successfully initialized ChatAnthropic")

def researcher(state: AgentState) -> AgentState:
    """Research node that processes the initial query."""
    print("Sending request to Claude...")
    
    messages = state["messages"]
    response = model.invoke(messages)
    print("Received response from Claude")
    
    return {
        "messages": [*messages, response],
        "next_step": "complete"
    }

def create_multimodal_message(question: str, image_paths: list[str]) -> HumanMessage:
    """Create a message with text and images"""
    content = [{"type": "text", "text": question}]
    
    for image_path in image_paths:
        # Convert image to base64
        base64_image = encode_image_to_base64(image_path)
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": base64_image
            }
        })
    
    return HumanMessage(content=content)

def run_workflow(question: str, image_paths: list[str]):
    # Create the graph
    workflow = Graph()
    
    # Add the researcher node
    workflow.add_node("researcher", researcher)
    
    # Set the entry point
    workflow.set_entry_point("researcher")
    
    # Add edge to END
    workflow.add_edge("researcher", END)
    
    # Compile the graph
    chain = workflow.compile()
    
    # Create multimodal message
    initial_message = create_multimodal_message(question, image_paths)
    
    # Create initial state
    initial_state = {
        "messages": [initial_message],
        "next_step": "start"
    }
    
    # Run the chain
    final_state = chain.invoke(initial_state)
    return final_state

if __name__ == "__main__":
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Analyze images using Claude')
    parser.add_argument('--images', nargs='+', help='Paths to image files', required=True)
    parser.add_argument('--question', type=str, 
                       default="What's in these images? Please describe them in detail.",
                       help='Question to ask about the images')
    
    args = parser.parse_args()
    
    # Verify images exist
    for image_path in args.images:
        if not Path(image_path).exists():
            print(f"Error: Image file not found: {image_path}")
            exit(1)
    
    print(f"\nAnalyzing {len(args.images)} images...")
    print(f"Question: {args.question}\n")
    
    result = run_workflow(args.question, args.images)
    
    if result:
        print("\nResult received. Processing messages...")
        messages = result.get("messages", [])
        for msg in messages:
            if isinstance(msg, AIMessage):
                print("\nAI Response:")
                print(msg.content)
            elif isinstance(msg, HumanMessage):
                print("\nHuman Message:")
                if isinstance(msg.content, list):
                    # Print only the text part of multimodal message
                    text_contents = [c["text"] for c in msg.content if c["type"] == "text"]
                    print("\n".join(text_contents))
                else:
                    print(msg.content)
    else:
        print("No result received from workflow") 