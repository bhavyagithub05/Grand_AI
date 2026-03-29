// api.js

// Remember to secure this later!
const API_KEY = "AIzaSyAKcthM8GM-Z7XxgTyyOqcGVxSpJmVskSU";




export const chatHistory = [];

export const generateBotResponse = async (chatHistoryPayload, modelName) => {

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`; 

    const requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            contents: chatHistoryPayload,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        })
    };

    const response = await fetch(API_URL, requestOptions);
    
    if (!response.ok) {
        const errorData = await response.json();
        
        // NEW: Catch quota errors and make them friendly
        if (response.status === 429 || (errorData.error && errorData.error.message.includes("Quota"))) {
            throw new Error("I'm a little overwhelmed right now! Please wait a minute and try asking again.");
        }
        
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
};