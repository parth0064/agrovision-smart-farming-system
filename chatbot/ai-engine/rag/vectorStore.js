const { MemoryVectorStore } = require("@langchain/classic/vectorstores/memory");
const { HuggingFaceInferenceEmbeddings } = require("@langchain/community/embeddings/hf");

/**
 * Creates a vector store from document chunks.
 * @param {Document[]} chunks - Array of chunked Documents.
 * @returns {Promise<MemoryVectorStore>} - The initialized vector store.
 */
async function createVectorStore(chunks) {
    try {
        const embeddings = new HuggingFaceInferenceEmbeddings({
            apiKey: process.env.HF_TOKEN,
        });

        const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
        console.log("Vector store successfully created.");
        return vectorStore;
    } catch (error) {
        console.error("Error creating vector store:", error);
        throw error;
    }
}

module.exports = { createVectorStore };
