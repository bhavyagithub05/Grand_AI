// ui.js

// 1. Export DOM Elements so other files can use them
export const elements = {
    chatBody: document.querySelector(".chat-body"),
    messageInput: document.querySelector(".message-input"),
    sendMessageButton: document.querySelector("#send-message"),
    fileInput: document.querySelector("#file-input"),
    fileUploadWrapper: document.querySelector(".file-upload-wrapper"),
    fileCancelButton: document.querySelector("#file-cancel"),
    chatbotToggler: document.querySelector("#chatbot-toggler"),
    closeChatbot: document.querySelector("#close-chatbot"),
    fileUploadBtn: document.querySelector("#file-upload"), // Fixed missing variable
    chatForm: document.querySelector(".chat-form"),
    modelSelector: document.querySelector("#model-selector"),
    emojiPickerBtn: document.querySelector("#emoji-picker")
};

export const initialInputHeight = elements.messageInput.scrollHeight;

// 2. Export UI Helper Functions
export const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

export const scrollToBottom = () => {
    elements.chatBody.scrollTo({ top: elements.chatBody.scrollHeight, behavior: "smooth" });
};

export const resetInputField = () => {
    elements.messageInput.value = "";
    elements.fileUploadWrapper.classList.remove("file-uploaded");
    elements.messageInput.style.height = `${initialInputHeight}px`;
};