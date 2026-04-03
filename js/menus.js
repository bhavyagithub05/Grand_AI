// js/menus.js
import { elements } from './ui.js';
import { chatHistory } from './api.js';

// We export this so app.js knows which model is currently selected!
export let activeModelName = "gemini-2.5-flash"; 

export const initMenus = () => {
    // --- 1. CUSTOM MODEL SELECTOR LOGIC ---
    const modelToggler = document.getElementById('model-toggler');
    const modelMenu = document.getElementById('model-menu');
    const modelOptions = document.querySelectorAll('.model-option');

    if (modelToggler) {
        modelToggler.addEventListener('click', (e) => {
            e.stopPropagation(); 
            modelMenu.classList.toggle('hidden');
        });

        modelOptions.forEach(option => {
            option.addEventListener('click', () => {
                modelOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                activeModelName = option.getAttribute('data-value'); // Updates the live variable
                const titleText = option.querySelector('.model-title').innerText;
                modelToggler.querySelector('span:first-child').innerText = titleText;
                modelMenu.classList.add('hidden');
            });
        });
    }

    // --- 2. TOOLS "+" MENU LOGIC ---
    const toolsToggler = document.getElementById('tools-toggler');
    const toolsMenu = document.getElementById('tools-menu');
    const fileUploadMenuBtn = document.getElementById('file-upload-menu-btn');
    const fileInput = document.getElementById('file-input'); 

    if (toolsToggler) {
        toolsToggler.addEventListener('click', (e) => {
            e.stopPropagation();
            toolsMenu.classList.toggle('hidden');
            if(modelMenu) modelMenu.classList.add('hidden'); 
        });
    }

    if (fileUploadMenuBtn) {
        fileUploadMenuBtn.addEventListener('click', () => {
            fileInput.click();
            toolsMenu.classList.add('hidden'); 
        });
    }

    // Global click listener to close menus
    document.addEventListener('click', (e) => {
        if (modelToggler && !modelToggler.contains(e.target) && !modelMenu.contains(e.target)) {
            modelMenu.classList.add('hidden');
        }
        if (toolsToggler && !toolsToggler.contains(e.target) && !toolsMenu.contains(e.target)) {
            toolsMenu.classList.add('hidden');
        }
    });

    // --- 3. EMOJI PICKER LOGIC ---
    try {
        const picker = new EmojiMart.Picker({
            theme: "dark",
            skinTonePosition: "none",
            previewPosition: "none",
            onEmojiSelect: (emoji) => {
                const { selectionStart: start, selectionEnd: end } = elements.messageInput;
                elements.messageInput.setRangeText(emoji.native, start, end, "end");
                elements.messageInput.focus();
            }
        });
        elements.chatForm.appendChild(picker);
    } catch (error) {
        console.warn("Emoji picker not available:", error);
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('em-emoji-picker') && !e.target.closest('#emoji-picker')) {
            document.body.classList.remove("show-emoji-picker");
        }
    });

    if (elements.emojiPickerBtn) {
        elements.emojiPickerBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            document.body.classList.toggle("show-emoji-picker");
        });
    }

    // --- 4. CUSTOM RIGHT-CLICK MENU LOGIC ---
    const contextMenu = document.getElementById("context-menu");
    const copyBtn = document.getElementById("copy-btn");
    const editBtn = document.getElementById("edit-btn");
    let targetMessageElement = null; 

    if(elements.chatBody && contextMenu) {
        elements.chatBody.addEventListener("contextmenu", (e) => {
            const messageText = e.target.closest(".message-text");
            if (!messageText) return; 

            e.preventDefault(); 
            targetMessageElement = messageText; 
            const messageBubble = messageText.parentElement;
            
            const isUserMessage = messageBubble.classList.contains("user-message");
            const allUserMessages = document.querySelectorAll(".user-message");
            const lastUserMessage = allUserMessages[allUserMessages.length - 1];
            const isLastUserMessage = (messageBubble === lastUserMessage);

            if (isUserMessage && isLastUserMessage) {
                editBtn.style.display = "flex"; 
            } else {
                editBtn.style.display = "none"; 
            }

            contextMenu.style.top = `${e.pageY}px`;
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.classList.remove("hidden");
        });

        document.addEventListener("click", () => {
            contextMenu.classList.add("hidden");
        });

        copyBtn.addEventListener("click", () => {
            if (targetMessageElement) {
                navigator.clipboard.writeText(targetMessageElement.innerText);
            }
        });

        editBtn.addEventListener("click", () => {
            if (targetMessageElement) {
                elements.messageInput.value = targetMessageElement.innerText;
                const userMsgNode = targetMessageElement.parentElement;
                const botMsgNode = userMsgNode.nextElementSibling; 

                userMsgNode.remove();
                if (botMsgNode && botMsgNode.classList.contains("bot-message")) {
                    botMsgNode.remove();
                }

                chatHistory.pop(); 
                chatHistory.pop(); 

                if(typeof saveChatToLocal === "function") saveChatToLocal();
                elements.messageInput.focus();
            }
        });
    }
};