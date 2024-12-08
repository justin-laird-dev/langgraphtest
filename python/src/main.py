import os
from dotenv import load_dotenv
from conversation_graph import create_conversation_graph, ConversationState
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import HumanMessage, AIMessage
import argparse

def main():
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
        user_input = input("\nYou: ")
        if user_input.lower() == 'quit':
            break
            
        if user_input.startswith('--image'):
            image_path = user_input.split(' ')[1]
            if not os.path.exists(image_path):
                print(f"Error: Image file not found: {image_path}")
                continue
                
            with open(image_path, "rb") as f:
                image_data = f.read()
            
            # Create message with image
            message = HumanMessage(
                content="Please analyze this image",
                additional_kwargs={"image_data": image_data}
            )
        else:
            message = HumanMessage(content=user_input)
        
        state["messages"].append(message)
        
        try:
            new_state = graph.invoke(state)
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
