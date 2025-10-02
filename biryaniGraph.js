import { StateGraph, MessagesAnnotation, END } from '@langchain/langgraph';
import { writeFileSync } from 'node:fs';

/**
 * Cut the vegetables
 */
function cutTheVegetables(state) {
    console.log('Cutting the vegetables....');
    return state;
}

/**
 * Boil the Rice
 */
function boilTheRice(state) {
    console.log('Boiling the Rice...');
    return state;
}

/**
 * Add the salt
 */
function addTheSalt(state) {
    console.log('Adding the salt...');
    return state;
}

/**
 * Taste the Biryani
 */

function tasteTheBiryani(state) {
    console.log('Tasting the Biryani...');
    return state;
}

/**
 * Where to go ?
 */
function whereToGo() {
    if (true) {
        return '__end__';
    } else {
        return 'addSalt';
    }
}

//creating the state graph, 
//message annotation is used to store the messages(history) in the state(ex: user, aimessage, system messages etc)
//Prebuilt state annotation that combines returned messages. Can handle standard messages and special modifiers like RemoveMessage instances.
const graph = new StateGraph(MessagesAnnotation)
    .addNode('cutTheVegetable', cutTheVegetables)
    .addNode('boilTheRice', boilTheRice)
    .addNode('addSalt', addTheSalt)
    .addNode('tasteTheBiryani', tasteTheBiryani)
    .addEdge('__start__', 'cutTheVegetable')
    .addEdge('cutTheVegetable', 'boilTheRice')
    .addEdge('boilTheRice', 'addSalt')
    .addEdge('addSalt', 'tasteTheBiryani')
    .addConditionalEdges('tasteTheBiryani', whereToGo, {
        __end__: END,
        addSalt: 'addSalt',
    });

//addNode function takes 2 parameters, name of the node & function to be executed
//addEdge function takes 2 parameters, from node & to node
//addConditionalEdges function takes 3 parameters, from node, function to decide the next node & object with key as return value of the function & value as the next node

//compiling the graph
const biryaniProcess = graph.compile();

async function main() {
    /**
     * Graph visualization
     */
    const drawableGraphGraphState = await biryaniProcess.getGraph();
    const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
    const graphStateArrayBuffer = await graphStateImage.arrayBuffer();

    const filePath = './biryaniState.png';
    writeFileSync(filePath, new Uint8Array(graphStateArrayBuffer));

    /**
     * Invoke the graph
     */
    const finalState = await biryaniProcess.invoke({
        messages: [],
    });

    console.log('final: ', finalState);
}

main();