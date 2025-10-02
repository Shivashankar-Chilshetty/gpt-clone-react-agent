/**
 * 1. Bring in LLM
 * 2. Build the graph
 * 3. Invoke the agent
 * 4. Add the memory
 */
import readline from 'node:readline/promises';
import { tool } from '@langchain/core/tools';
import { ChatGroq } from '@langchain/groq';
import { END, MemorySaver, MessagesAnnotation, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { TavilySearch } from '@langchain/tavily';
import z from 'zod';
import { printGraph } from './utils.js';


// adding Memory as checkpointer to save the past messages
const checkpointer = new MemorySaver();

/** Tools */
//Tool 1 - Search
const search = new TavilySearch({
    maxResults: 3,
    topic: 'general',
});

//Tool 2 - Calendar Events
const calendarEvents = tool(
    async ({ query }) => {
        // Google calendar logic goes
        return JSON.stringify([
            {
                title: 'Meeting with Sujoy',
                date: '9th Aug 2025',
                time: '2 PM',
                location: 'Gmeet',
            },
        ]);
    },
    {
        name: 'get-calendar-events',
        description: 'Call to get the calendar events.',
        schema: z.object({
            query: z.string().describe('The query to use in calendar event search.'),
        }),
    }
);

const tools = [search, calendarEvents];
// Node - 2 - tools
//ToolNode - prebuild node/function which takes care of calling the tools(multime times - if needed) & updating the state/messages array with tool responses & send it to the next node/LLM
const toolNode = new ToolNode(tools); 


// Initilise the LLM
const llm = new ChatGroq({
    model: 'openai/gpt-oss-120b',
    temperature: 0,
}).bindTools(tools);    //binding the tools to the llm so that it can use the tools when required


//Build the graph
// Node - 1 - callmodel
async function callModel(state) {
    //calling the llm with messages from the state
    const response = await llm.invoke(state.messages);
    //note: whatever we return from here(node) that gets added/merged to the state(messages array) & all nodes can access the state(messages)
    return { messages: [response] };
}


// Conditional Edge
function shouldContinue(state) {
    //check the previous/last message from ai, if it has tool calls then go to tools node else end the graph
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage.tool_calls?.length) { //if tool calls are present in the last message of LLM/AI
        return 'tools';
    }
    return '__end__';
}

// Build the graph
const graph = new StateGraph(MessagesAnnotation)
    .addNode('llm', callModel)
    .addNode('tools', toolNode)
    .addEdge('__start__', 'llm')
    .addEdge('tools', 'llm')
    .addConditionalEdges('llm', shouldContinue, {
        __end__: END,
        tools: 'tools',
    });

//making the graph runnable by compiling it & passing the checkpointer(memory) to save the past messages
const app = graph.compile({ checkpointer });   //checkpointer will save the past messages in thee memory

async function main() {
    //since we are storing the messages in memory(checkpointer) we need to pass the thread_id to identify the conversation
    let config = { configurable: { thread_id: '1' } };

    //Print the graph
    await printGraph(app, './customGraph.png');

    // Take user input
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    while (true) {
        const userInput = await rl.question('You: ');
        if (userInput === '/bye') {
            break;
        }
        //invoking the graph with initial message
        const result = await app.invoke(
            {
                messages: [{ role: 'user', content: userInput }],
            },
            config //passing the thread_id to identify the conversation
        );

        const messages = result.messages;
        //getting the last message from the messages array
        const final = messages[messages.length - 1];

        console.log('AI: ', final.content);
    }
    rl.close();
}

main();