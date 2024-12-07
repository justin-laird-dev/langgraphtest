from typing import TypedDict, Annotated, Sequence, Union, Literal
from langgraph.graph import Graph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
if not os.getenv("ANTHROPIC_API_KEY"):
    print("Error: ANTHROPIC_API_KEY not found in environment variables")
    exit(1)

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

def run_workflow(question: str):
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
    
    # Create initial state
    initial_state = {
        "messages": [HumanMessage(content=question)],
        "next_step": "start"
    }
    
    # Run the chain
    final_state = chain.invoke(initial_state)
    return final_state

if __name__ == "__main__":
    question = "What are the main features of LangGraph?"
    print("\nStarting workflow with question:", question)
    
    result = run_workflow(question)
    print("\nWorkflow completed")
    
    if result:
        print("\nResult received. Processing messages...")
        messages = result.get("messages", [])
        for msg in messages:
            if isinstance(msg, AIMessage):
                print("\nAI Response:")
                print(msg.content)
            elif isinstance(msg, HumanMessage):
                print("\nHuman Message:")
                print(msg.content)
    else:
        print("No result received from workflow") 