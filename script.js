const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// API setup - REPLACE WITH YOUR BACKEND ENDPOINT
const API_KEY = "AIzaSyC8zZBUp17KHTUFpSAwo2DPOgAavwbt7FE";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`; // Use a backend proxy instead of direct API calls

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
}

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

// Create message element with dynamic class and return it.
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

// Generate bot response using API with retry logic
const generateBotResponses = async (incomingMessageDiv, retryCount = 0) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");
    const maxRetries = 2;
    
    // Add user message to chat history
    chatHistory.push({
        role: "user",
        parts: [{"text": userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])]
    });

    // API request options
    const requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            contents: chatHistory,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        
        // Handle 503 Service Unavailable with retry logic
        if (response.status === 503) {
            if (retryCount < maxRetries) {
                messageElement.innerHTML = `<div class="thinking-indicator">Service busy, retrying in ${(retryCount + 1) * 2} seconds...</div>`;
                
                // Wait and retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
                return generateBotResponses(incomingMessageDiv, retryCount + 1);
            }
            throw new Error("Service is temporarily overloaded. Please try again in a few minutes.");
        }
        
        // Handle other HTTP errors
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract and display bot response text
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        messageElement.innerText = apiResponseText;
        
        // Add bot response to chat history
        chatHistory.push({
            role: "model",
            parts: [{"text": apiResponseText }]
        });
        
    } catch(error) {
        console.error("API Error:", error);
        messageElement.innerText = error.message;
        messageElement.style.color = "#ff0000";
    } finally {
        // Reset user's file data, remove thinking indicator and scroll chat to bottom 
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking");
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }
}

// Handle outgoing user message 
const HandleOutgoingMessage = (e) => {
    e.preventDefault();
    
    // Rate limiting check
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        return; // Ignore rapid consecutive requests
    }
    lastRequestTime = now;
    
    userData.message = messageInput.value.trim();
    if (!userData.message && !userData.file.data) return; // Don't send empty messages
    
    messageInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.dispatchEvent(new Event("input"));

    // Create and display user message
    const messageContent = `<div class="message-text"></div>
    ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`;
    
    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").innerText = userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    
    // Simulate bot response with thinking indicator after a delay
    setTimeout(() => {
        const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                    <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
                </svg>
                <div class="message-text">
                    <div class="thinking-indicator">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>`;
        
        const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
        generateBotResponses(incomingMessageDiv);
    }, 600);
}

// Handle enter key press for sending message
messageInput.addEventListener("keydown", (e) => {
    const userMessage = e.target.value.trim();
    if (e.key === "Enter" && (userMessage || userData.file.data) && !e.shiftKey && window.innerWidth > 760) {
        HandleOutgoingMessage(e);
    }
});

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP, GIF)');
        fileInput.value = "";
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please select an image smaller than 5MB.');
        fileInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");

        const base64String = e.target.result.split(",")[1];

        // Storing file data in userData
        userData.file = {
            data: base64String,
            mime_type: file.type
        }
        
        fileInput.value = "";
    }

    reader.onerror = () => {
        alert('Error reading file. Please try again.');
        fileInput.value = "";
    }

    reader.readAsDataURL(file);
});

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("file-uploaded");
});

// Initialize emoji picker and handle emoji selection
let picker;
try {
    picker = new EmojiMart.Picker({
        theme: "light",
        skinTonePosition: "none",
        previewPosition: "none",
        onEmojiSelect: (emoji) => {
            const { selectionStart: start, selectionEnd: end } = messageInput;
            messageInput.setRangeText(emoji.native, start, end, "end");
            messageInput.focus();
        }
    });
    
    document.querySelector(".chat-form").appendChild(picker);
} catch (error) {
    console.warn("Emoji picker not available:", error);
}

// Handle click outside emoji picker
document.addEventListener('click', (e) => {
    if (!e.target.closest('.emoji-picker') && !e.target.closest('#emoji-picker')) {
        document.body.classList.remove("show-emoji-picker");
    }
});

// Event listeners
sendMessageButton.addEventListener("click", (e) => HandleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());

// Chatbot toggle functionality
let chatbotIsOpen = false;
const heading = document.createElement("div");
const h1 = document.createElement("h1");
h1.innerText = "Welcome to Grand AI";
heading.appendChild(h1);
document.body.appendChild(heading);
heading.classList.add("heading");

chatbotToggler.addEventListener("click", () => {
    chatbotIsOpen = !chatbotIsOpen;
    document.body.classList.toggle("show-chatbot");
    
    if (chatbotIsOpen) {
        heading.classList.add("hidden");
    } else {
        heading.classList.remove("hidden");
    }
});

closeChatbot.addEventListener("click", () => {
    chatbotIsOpen = false;
    document.body.classList.remove("show-chatbot");
    heading.classList.remove("hidden");
});

// Clear chat history function (optional)
const clearChatHistory = () => {
    chatHistory.length = 0;
    userData.file = {};
    userData.message = null;
    chatBody.innerHTML = '';
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.value = "";
    messageInput.dispatchEvent(new Event("input"));
};

// Add clear chat button if needed
// document.querySelector("#clear-chat").addEventListener("click", clearChatHistory);