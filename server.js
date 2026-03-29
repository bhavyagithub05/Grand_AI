// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads your .env file

const app = express();
app.use(cors()); // Allows your frontend to talk to this backend
app.use(express.json());

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// This is the endpoint your frontend will call
app.post('/api/chat', async (req, res) => {
    try {
        const { chatHistory, modelName } = req.body;
        const apiKey = process.env.GEMINI_API_KEY; // Pulled safely from .env!
        
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        // Forward the request to Google
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: chatHistory,
                generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        
        // Send the good response back to your frontend
        res.json(data);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: { message: "Internal Server Error" } });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});