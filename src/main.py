import os
from dotenv import load_dotenv
from conversation_graph import create_conversation_graph, ConversationState
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import HumanMessage, AIMessage
import argparse

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", help="Path to image file")
    args = parser.parse_args()

    load_dotenv()
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
    
    print("Debug: Creating conversation graph")
    graph = create_conversation_graph(api_key)
    
    # Initialize state
    state = {
        "messages": [],
        "memory": ConversationBufferMemory(return_messages=True),
        "image_analysis": {}
    }
    
    print("Welcome! Send messages or use '--image path/to/image.jpg' to analyze images. Type 'quit' to exit.")
    
    while True:
        if args.image:
            print(f"\nAnalyzing image: {args.image}")
            if not os.path.exists(args.image):
                print(f"Error: Image file not found: {args.image}")
                args.image = None
                continue
                
            with open(args.image, "rb") as f:
                image_data = f.read()
            
            # Create message with image
            message = HumanMessage(
                content="Please analyze this image",
                additional_kwargs={"image_data": image_data}
            )
            args.image = None  # Reset so we don't reprocess
        else:
            user_input = input("\nYou: ")
            if user_input.lower() == 'quit':
                break
            message = HumanMessage(content=user_input)
        
        # Add message to state
        state["messages"].append(message)
        print(f"Debug: State after adding message = {state}")
        
        try:
            # Run the graph
            print("Debug: Running graph")
            new_state = graph.invoke(state)
            print(f"Debug: Graph returned state = {new_state}")
            
            if new_state and "messages" in new_state and len(new_state["messages"]) > 0:
                print("\nClaude:", new_state["messages"][-1].content)
                state = new_state
            else:
                print("\nError: No response generated")
                
        except Exception as e:
            print(f"\nError occurred: {str(e)}")
            continue

if __name__ == "__main__":
    main() 