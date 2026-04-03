// app.js

// 1. IMPORTS
import { initAuth } from './auth.js';
import { elements, createMessageElement, scrollToBottom, resetInputField, initialInputHeight } from './ui.js';
import { chatHistory, generateBotResponse } from './api.js';
import { initSpeechRecognition } from './speech.js';
import { initMenus, activeModelName } from './menus.js';

// 2. INITIALIZE FEATURES
initAuth();
initMenus();
initSpeechRecognition();

const userData = {
    message: null,
    file: { data: null, mime_type: null }
};

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; 
let abortController = null;
let isTyping = false;

// 3. MARKDOWN CONFIG
marked.setOptions({
    langPrefix: 'hljs language-',
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

// 4. TYPING ENGINE
const typeText = (element, htmlString, speed = 15) => {
    let i = 0;
    let currentHTML = "";
    element.innerHTML = ""; 
    isTyping = true;

    const typeWriter = () => {
        if (!isTyping) return;

        if (i < htmlString.length) {
            while (i < htmlString.length && htmlString.charAt(i) === '<') {
                while (i < htmlString.length && htmlString.charAt(i) !== '>') {
                    currentHTML += htmlString.charAt(i);
                    i++;
                }
                currentHTML += '>'; 
                i++;
            }

            if (i < htmlString.length) {
                currentHTML += htmlString.charAt(i);
                i++;
            }

            element.innerHTML = currentHTML;
            elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
            setTimeout(typeWriter, speed);
        } else {
            isTyping = false;
            resetUIState();
            if(typeof saveChatToLocal === "function") saveChatToLocal();
        }
    };
    
    typeWriter();
};

const resetUIState = () => {
    elements.chatForm.classList.remove("generating");
    elements.sendMessageButton.innerHTML = "send";
}

// 5. CORE CHAT LOGIC
const handleBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");

    chatHistory.push({
        role: "user",
        parts: [{"text": userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])]
    });

    elements.chatForm.classList.add("generating");
    elements.sendMessageButton.innerHTML = "stop_circle"; 
    abortController = new AbortController();

    try {
        // Gets the active model dynamically from menus.js
        const apiResponseText = await generateBotResponse(chatHistory, activeModelName, abortController.signal);
        const htmlResponse = marked.parse(apiResponseText);
        
        typeText(messageElement, htmlResponse, 5);
        
        chatHistory.push({
            role: "model",
            parts: [{"text": apiResponseText }]
        });
    } catch(error) {
        if(error.name === "AbortError") {
            messageElement.innerText = "Response generation stopped by user.";
            messageElement.style.color = "#a4a3b6";
        }else{
            console.error("API Error:", error);
            messageElement.innerText = error.message;
            messageElement.style.color = "#ff0000";
        }
        resetUIState();
    } finally {
        userData.file = { data: null, mime_type: null };
        incomingMessageDiv.classList.remove("thinking");
        scrollToBottom();
    }
};

const handleOutgoingMessage = (e) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) return;
    lastRequestTime = now;
    
    userData.message = elements.messageInput.value.trim();
    if (!userData.message && !userData.file.data) return; 
    
    resetInputField();

    const messageContent = `<div class="message-text"></div>
    ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`;
    
    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").innerText = userData.message;
    elements.chatBody.appendChild(outgoingMessageDiv);
    scrollToBottom();
    
    setTimeout(() => {
        const botHtml = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                    <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
                </svg>
                <div class="message-text">
                    <div class="thinking-indicator">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>`;
        const incomingMessageDiv = createMessageElement(botHtml, "bot-message", "thinking");
        elements.chatBody.appendChild(incomingMessageDiv);
        scrollToBottom();
        handleBotResponse(incomingMessageDiv);
    }, 600);
};

// 6. BASE EVENT LISTENERS
elements.sendMessageButton.addEventListener("click",(e) => {
    if (elements.chatForm.classList.contains("generating")) {
        if (abortController) abortController.abort(); 
        isTyping = false; 
        resetUIState(); 
    } else {
        handleOutgoingMessage(e);
    }
});

elements.messageInput.addEventListener("keydown", (e) => {
    const userMessage = e.target.value.trim();
    if (e.key === "Enter" && (userMessage || userData.file.data) && !e.shiftKey && window.innerWidth > 760) {
        handleOutgoingMessage(e);
    }
});

elements.clearChatBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all messages?")) {
        elements.chatBody.innerHTML = "";
        chatHistory.length = 0; 
        localStorage.removeItem("saved-chat");
        alert("Chat history cleared!");
    }
});

elements.messageInput.addEventListener("input", () => {
    elements.messageInput.style.height = `${initialInputHeight}px`;
    elements.messageInput.style.height = `${elements.messageInput.scrollHeight}px`;
    elements.chatForm.style.borderRadius = elements.messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

if (elements.fileUploadBtn) {
    elements.fileUploadBtn.addEventListener("click", () => elements.fileInput.click());
}

elements.fileInput.addEventListener("change", () => {
    const file = elements.fileInput.files[0];
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
        alert('Please select a valid image file');
        elements.fileInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        elements.fileUploadWrapper.querySelector("img").src = e.target.result;
        elements.fileUploadWrapper.classList.add("file-uploaded");
        userData.file = { data: e.target.result.split(",")[1], mime_type: file.type };
        elements.fileInput.value = "";
    };
    reader.readAsDataURL(file);
});

elements.fileCancelButton.addEventListener("click", () => {
    userData.file = { data: null, mime_type: null };
    elements.fileUploadWrapper.classList.remove("file-uploaded");
});

let chatbotIsOpen = false;
const heading = document.createElement("div");
const h1 = document.createElement("h1");
h1.innerText = "Welcome to Grand AI";
heading.appendChild(h1);
document.body.appendChild(heading);
heading.classList.add("heading");

elements.chatbotToggler.addEventListener("click", () => {
    chatbotIsOpen = !chatbotIsOpen;
    document.body.classList.toggle("show-chatbot");
    
    if (chatbotIsOpen) {
        heading.classList.add("hidden");
    } else {
        heading.classList.remove("hidden");
    }
});

elements.closeChatbot.addEventListener("click", () => {
    chatbotIsOpen = false;
    document.body.classList.remove("show-chatbot");
    heading.classList.remove("hidden");
});