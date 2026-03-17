const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");

/**
 * Loads text content from a PDF file.
 * @param {string} filePath - Path to the PDF file.
 * @param {number} [limit] - Optional page limit.
 * @returns {Promise<Document[]>} - Array of LangChain Documents.
 */
async function loadPDF(filePath, limit) {
    try {
        const loader = new PDFLoader(filePath);
        let docs = await loader.load();

        if (limit && limit > 0) {
            docs = docs.slice(0, limit);
        }

        console.log(`Successfully loaded PDF: ${filePath} (${docs.length} pages)`);
        return docs;
    } catch (error) {
        console.error("Error loading PDF:", error);
        throw error;
    }
}

module.exports = { loadPDF };
