const path = require("path");
const fs = require("fs");
const envPath = path.join(__dirname, "../../backend/.env");
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/HF_TOKEN=(.*)/);
    if (match) process.env.HF_TOKEN = match[1].trim();
}
const { loadPDF } = require("./rag/pdfLoader");
const { splitText } = require("./rag/textChunker");
const { createVectorStore } = require("./rag/vectorStore");

async function precompute() {
    console.log("Precomputing vector store embeddings...");
    try {
        const pdfPath = path.join(__dirname, "data", "book_one.pdf");
        const cachePath = path.join(__dirname, "data", "vector_cache.json");

        const docs = await loadPDF(pdfPath);
        const chunks = await splitText(docs);
        const vectorStore = await createVectorStore(chunks);

        fs.writeFileSync(cachePath, JSON.stringify(vectorStore.memoryVectors));
        console.log("Successfully cached vector store to", cachePath);
    } catch (e) {
        console.error("Error precomputing:", e);
    }
}
precompute();
