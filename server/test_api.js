// Quick test: verify Groq API key works
require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

async function test() {
    try {
        const r = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: 'Reply with JSON: {"status":"ok"}' }],
            response_format: { type: "json_object" },
            max_tokens: 50,
        });
        console.log("SUCCESS:", r.choices[0].message.content);
    } catch (e) {
        console.log("ERROR:", e.status, e.code, e.message);
    }
}

test();
