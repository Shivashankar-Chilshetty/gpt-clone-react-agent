import { tool } from "@langchain/core/tools";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
import { z } from "zod";
import { writeFileSync } from "node:fs";
import readline from "node:readline/promises";

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

    //insider tool function we have 2 parameters, function & metadata object
    const calendarEvents = tool(
        async ({ query }) => {

            return JSON.stringify([
                { title: "Meeting with Sujoy", time: "7:00 PM", date: "30 sept 2025", location: "Google Meet" }
            ]);
        },
        {
            name: "get-calendar-events",
            description: "Call to get the calendar events.",
            schema: z.object({
                query: z.string().describe("The query to use in calendar event search."),
            }),
        }
    );

    //creating react agent
    const agent = createReactAgent({
        llm: model,
        tools: [search, calendarEvents],
    });

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    while (true) {
        const userQuery = await rl.question("You: ");
        if(userQuery.toLowerCase() == "bye") break;
        //calling the agent
        const result = await agent.invoke({
            messages: [
                {
                    role: `system`,
                    content: `You are a helpful personal assistant. Use provided tools to get the information needed to answer the user's question. Current date & time: ${new Date().toUTCString}`
                },
                {
                    role: "user",
                    content: userQuery,
                },
            ],
        });
        console.log('Assistant:', result.messages[result.messages.length - 1].content)
    }

    rl.close();

    const drawableGraphGraphState = await agent.getGraphAsync();

    const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
    const graphStateArrayBuffer = await graphStateImage.arrayBuffer();

    const filePath = "./graphState.png";
    writeFileSync(filePath, new Uint8Array(graphStateArrayBuffer));

    
}

main();