from typing import Dict, TypedDict, List, Annotated, Union
from langgraph.graph import Graph, START
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage
from langchain.memory import ConversationBufferMemory
import base64

# Define our state structure
class ConversationState(TypedDict):
    messages: List[Union[HumanMessage, AIMessage]]
    memory: ConversationBufferMemory
    image_analysis: Dict[str, str]

def create_conversation_graph(api_key: str):
    # Initialize Claude with vision capabilities
    model = ChatAnthropic(
        model="claude-3-sonnet-20240229",
        anthropic_api_key=api_key,
        max_tokens=4096
    )
    
    # Define our nodes
    def analyze_images(state: ConversationState) -> Dict:
        print("Debug: Entering analyze_images")
        
        latest_message = state["messages"][-1]
        if hasattr(latest_message, "additional_kwargs") and "image_data" in latest_message.additional_kwargs:
            try:
                # Convert image data to base64
                image_data = latest_message.additional_kwargs["image_data"]
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                
                # Create message with properly formatted image
                image_message = HumanMessage(
                    content=[
                        {
                            "type": "text",
                            "text": "What do you see in this image?"
                        },
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_base64
                            }
                        }
                    ]
                )
                
                # Get Claude's analysis
                response = model.invoke([image_message])
                analysis = response.content
                state["image_analysis"][str(len(state["image_analysis"]))] = analysis
                
                # Add the analysis as a response
                state["messages"].append(AIMessage(content=analysis))
                print(f"Debug: Image analysis complete: {analysis}")
            except Exception as e:
                print(f"Debug: Error in image analysis: {str(e)}")
                raise e
                
        return state

    def generate_response(state: Dict) -> Dict:
        print("Debug: Entering generate_response")
        
        try:
            # Only generate a new response if the last message wasn't from image analysis
            if not (state["messages"] and isinstance(state["messages"][-1], AIMessage)):
                context = ""
                if state["image_analysis"]:
                    context = "Previous image analysis:\n" + "\n".join(state["image_analysis"].values()) + "\n\n"
                
                latest_message = state["messages"][-1]
                prompt = context + latest_message.content
                
                response = model.invoke([HumanMessage(content=prompt)])
                state["messages"].append(AIMessage(content=response.content))
            
            return state
            
        except Exception as e:
            print(f"Debug: Error in generate_response: {str(e)}")
            raise e

    # Create and compile the graph
    workflow = Graph()
    
    workflow.add_node("analyze_images", analyze_images)
    workflow.add_node("generate_response", generate_response)
    
    # Add edges - only use add_edge() for START
    workflow.add_edge(START, "analyze_images")
    workflow.add_edge("analyze_images", "generate_response")
    
    # Set final node
    workflow.set_finish_point("generate_response")
    
    return workflow.compile() 