import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

async function main() {
    //creating groq model
    const model = new ChatGroq({
        model: "groq/compound",
        temperature: 0
    });

    //creating react agent
    const agent = createReactAgent({
        llm: model,
        tools: [],
    });

    //calling the agent
    const result = await agent.invoke({
        messages: [
            {
                role: "user",
                content: "what is the weather in sf",
            },
        ],
    });
    console.log('Assistant:', result.messages[result.messages.length - 1].content)
}

main();