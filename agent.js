import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";

async function main() {
    //creating groq model
    const model = new ChatGroq({
        model: "openai/gpt-oss-120b",
        temperature: 0
    });

    const search = new TavilySearch({
        maxResults: 3,
        topic: "general"
    });

    //creating react agent
    const agent = createReactAgent({
        llm: model,
        tools: [search],
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