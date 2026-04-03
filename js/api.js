// api.js

// Look! No API key here anymore! It is completely secure.
const BACKEND_URL = "/api/chat"; 

export const chatHistory = [];

export const generateBotResponse = async (chatHistoryPayload, modelName, signal) => {
    const requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            chatHistory: chatHistoryPayload,
            modelName: modelName
        }),
        signal: signal
    };

    const response = await fetch(BACKEND_URL, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
        if (response.status === 429 || (data.error && data.error.message.includes("Quota"))) {
            throw new Error("I'm a little overwhelmed right now! Please wait a minute.");
        }
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
    }
    
    const apiRawText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
    
    return marked.parse(apiRawText);
};