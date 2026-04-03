// js/speech.js
import { elements } from './ui.js';

export const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US"; 
        recognition.interimResults = false; 

        let isRecording = false;
        let recordingTimer = null;

        const stopListening = () => {
            if (isRecording) {
                recognition.stop();
                isRecording = false;
                clearTimeout(recordingTimer); 
                elements.micBtn.classList.remove("recording");
                
                if (elements.messageInput.placeholder === "Listening... (auto-stops after 15s silence)") {
                    elements.messageInput.placeholder = "Type a message...";
                }
            }
        };

        const resetSilenceTimer = () => {
            clearTimeout(recordingTimer); 
            recordingTimer = setTimeout(() => {
                stopListening(); 
            }, 15000);
        };

        recognition.onstart = () => {
            isRecording = true; 
            elements.micBtn.classList.add("recording");
            elements.messageInput.placeholder = "Listening... (auto-stops after 15s silence)"; 
            resetSilenceTimer(); 
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const currentText = elements.messageInput.value.trim();
            elements.messageInput.value = currentText ? `${currentText} ${transcript}` : transcript;
            elements.messageInput.dispatchEvent(new Event('input')); 
            resetSilenceTimer(); 
        };

        recognition.onend = () => stopListening();

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            stopListening();
            elements.messageInput.placeholder = "Microphone error. Type a message...";
            setTimeout(() => {
                elements.messageInput.placeholder = "Type a message...";
            }, 3000);
        };

        elements.micBtn.addEventListener("click", () => {
            if (isRecording) {
                stopListening(); 
            } else {
                try {
                    recognition.start(); 
                } catch(e) {
                    console.log("Recognition is already started.");
                }
            }
        });

    } else {
        if(elements.micBtn) elements.micBtn.style.display = "none";
        console.warn("Speech Recognition API is not supported in this browser.");
    }
};