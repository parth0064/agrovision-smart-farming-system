const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

/**
 * Splits LangChain documents into smaller chunks.
 * @param {Document[]} docs - Array of LangChain Documents.
 * @returns {Promise<Document[]>} - Array of chunked Documents.
 */
async function splitText(docs) {
    try {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 100,
        });

        const chunks = await splitter.splitDocuments(docs);
        console.log(`Successfully split documents into ${chunks.length} chunks.`);
        return chunks;
    } catch (error) {
        console.error("Error splitting text:", error);
        throw error;
    }
}

module.exports = { splitText };
