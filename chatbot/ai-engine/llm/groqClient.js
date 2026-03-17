const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Generates a response from Groq using the provided prompt and model.
 * @param {string} systemPrompt - The system instructions to send to the LLM.
 * @param {string} userPrompt - The user question to send to the LLM.
 * @returns {Promise<string>} - The AI generated response.
 */
async function getGroqCompletion(systemPrompt, userPrompt) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.2,
            max_tokens: 1024,
        });

        const answer = chatCompletion.choices[0]?.message?.content || "";
        if (!answer) {
            console.warn("[GROQ] Empty response received from API");
            return "I'm sorry, I couldn't generate a response. Please try again.";
        }
        return answer;
    } catch (error) {
        console.error("Error calling Groq API:", error.message || error);
        if (error.status === 401) {
            return "The AI service API key has expired or is invalid. Please contact the administrator.";
        }
        return "I'm having trouble connecting to the AI service. Please try again in a moment.";
    }
}

module.exports = { getGroqCompletion };
