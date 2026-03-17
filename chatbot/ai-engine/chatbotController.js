const path = require("path");
const { loadPDF } = require("./rag/pdfLoader");
const { splitText } = require("./rag/textChunker");
const { createVectorStore } = require("./rag/vectorStore");
const { getGroqCompletion } = require("./llm/groqClient");

let vectorStore = null;
let initAttempted = false;
let ragReady = false;

/**
 * Initializes the RAG system by loading the PDF and creating the vector store.
 * Has a 10-second timeout to prevent blocking the server.
 */
async function initializeRAG() {
    if (ragReady || initAttempted) return;
    initAttempted = true;

    try {
        const dataPath = path.join(__dirname, "data");
        const cachePath = path.join(dataPath, "vector_cache.json");
        const fs = require('fs');

        if (fs.existsSync(cachePath)) {
            console.log("[RAG] Loading precomputed vector store from cache...");
            const { MemoryVectorStore } = require("@langchain/classic/vectorstores/memory");
            vectorStore = new MemoryVectorStore(null); 
            const cachedVectors = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
            vectorStore.memoryVectors = cachedVectors;
            ragReady = true;
            console.log("[RAG] System initialized from cache.");
        } else {
            console.log("[RAG] No cache found. RAG will be skipped. Run precomputeVectors.js to enable.");
        }
    } catch (error) {
        console.error("[RAG] Failed to initialize RAG system:", error.message);
    }
}

// Fire and forget — don't block server startup
initializeRAG().catch(err => console.error("[RAG] Init error:", err.message));

/**
 * Handles the chatbot response logic.
 * @param {string} userQuestion - The question from the farmer.
 * @param {string} language - The preferred language (mr, hi, en).
 * @param {string} userName - The name of the user.
 * @returns {Promise<string>} - The AI generated answer in the preferred language.
 */
async function getChatbotResponse(userQuestion, language, userName = "Farmer") {
    let context = "";
    try {
        if (!vectorStore) {
            // Attempt one-time init if not done, but don't block forever
            await initializeRAG();
        }
        
        if (vectorStore) {
            // Retrieve top 3 relevant chunks
            const retriever = vectorStore.asRetriever({ k: 3 });
            const relevantDocs = await retriever.invoke(userQuestion);
            context = relevantDocs.map(doc => doc.pageContent).join("\n\n");
        } else {
            console.log("[RAG] Skipping context retrieval: Vector store not ready.");
        }
    } catch (err) {
        console.warn("RAG context retrieval failed. Proceeding with general knowledge only.");
    }

    try {
        // Map language code to full name
        const languageMap = {
            mr: "Marathi",
            hi: "Hindi",
            en: "English"
        };
        const langName = languageMap[language] || "English";

        // Construct prompt template
        const systemPrompt = `You are a professional agricultural advisor.
${langName === 'English' ? 'PERSONA: You are an English-only expert. You DO NOT understand Hindi or Marathi script. You MUST answer in 100% plain English. If you see Hindi characters in the context, TRANSLATE THEM to English in your mind before answering. NEVER output a single word of Devanagari script.' : `You are a helpful agricultural advisor for farmers. You must write your entire response ONLY in ${langName} (${language}).`}

Context for your answer:
${context ? context : "No specific context available."}`;

        const userPrompt = `Farmer Name: ${userName}\nRequested Output Language: ${langName}\nFarmer Question:\n${userQuestion}`;

        console.log(`[CHATBOT API] Request received - Language Code: "${language}", Mapped LangName: "${langName}"`);
        console.log(`[CHATBOT API] User Question: "${userQuestion}"`);
        console.log(`[CHATBOT API] System Prompt preview: ${systemPrompt.substring(0, 150)}...`);

        const answer = await getGroqCompletion(systemPrompt, userPrompt);
        return answer;
    } catch (error) {
        console.error("Error generating chatbot response:", error);
        throw error;
    }
}

module.exports = { getChatbotResponse };
