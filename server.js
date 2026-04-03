// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // Loads your .env file


const app = express();
app.use(cors()); // Allows your frontend to talk to this backend
app.use(express.json());

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// --- 1. CONNECT TO MONGODB ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB!'))
    .catch((error) => console.error('❌ MongoDB connection error:', error));


// --- 2. AUTHENTICATION ROUTES ---
// Import the router you created in routes/auth.js
const authRoutes = require('./routes/auth');

// Tell Express: "Any request that starts with /api/auth, send it to authRoutes!"
app.use('/api/auth', authRoutes);




// This is the endpoint your frontend will call
app.post('/api/chat', async (req, res) => {
    try {
        const { chatHistory, modelName } = req.body;
        const apiKey = process.env.GEMINI_API_KEY; // Pulled safely from .env!
        
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const currentDateTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        // Forward the request to Google
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: chatHistory,
                // 2. Add the Master Persona and inject the live time
                system_instruction: {
                    role: "user",
                    parts: [{ 
                        text: `You are Grand AI, an advanced and friendly chatbot.
                               - Today's exact date and time is ${currentDateTime}.
                               - Always use Markdown to format your responses (bolding, lists, etc.).
                               - If the user asks about current events, weather, or real-time data, use your search tools to find the most accurate information.
                               - CRITICAL: If the user asks for code, programming, or algorithms, DO NOT search the web. Write the code directly using your own expert knowledge.` 
                    }]
                },

                // 3. MAGIC LINE: Give Grand AI full access to Google Search!
                tools: [{ googleSearch: {} }],

                generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8192 }
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