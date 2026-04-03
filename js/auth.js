// auth.js

export const initAuth = () => {
    const authOverlay = document.getElementById('auth-overlay');
    const toggleLogin = document.getElementById('toggle-login');
    const toggleSignup = document.getElementById('toggle-signup');
    const authForm = document.getElementById('auth-form');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    const confirmPasswordInput = document.getElementById('auth-confirm-password');
    const submitBtn = document.getElementById('auth-submit-btn');
    const subtitle = document.getElementById('auth-subtitle');
    const errorMsg = document.getElementById('auth-error');

    let isLoginMode = true;

    // --- Check if already logged in ---
    // If we saved a session token previously, hide the login screen immediately!
    if (localStorage.getItem('grand_ai_session')) {
        authOverlay.classList.add('hidden');
        return; // Exit the function, user is already authenticated
    }

    // --- UI Toggles ---
    toggleSignup.addEventListener('click', () => {
        isLoginMode = false;
        toggleSignup.classList.add('active');
        toggleLogin.classList.remove('active');
        
        confirmPasswordGroup.classList.remove('hidden');
        confirmPasswordInput.setAttribute('required', 'true');
        
        submitBtn.innerText = "Create Account";
        subtitle.innerText = "Create an account to start chatting.";
        errorMsg.classList.add('hidden');
    });

    toggleLogin.addEventListener('click', () => {
        isLoginMode = true;
        toggleLogin.classList.add('active');
        toggleSignup.classList.remove('active');
        
        confirmPasswordGroup.classList.add('hidden');
        confirmPasswordInput.removeAttribute('required');
        
        submitBtn.innerText = "Login";
        subtitle.innerText = "Welcome back! Please login to continue.";
        errorMsg.classList.add('hidden');
    });


    // --- REAL Form Submission Logic ---
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        
        // Disable button to prevent double-clicks
        submitBtn.disabled = true;
        submitBtn.innerText = "Processing...";
        errorMsg.classList.add('hidden');

        try {
            // Determine the endpoint based on the current mode
            const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/signup';

            // If Signup, check passwords first
            if (!isLoginMode) {
                const confirmPassword = confirmPasswordInput.value;
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match!");
                }
            }

            // --- SEND DATA TO YOUR NODE.JS BACKEND ---
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Authentication failed.");
            }

            // --- SUCCESS! ---
            // 1. Save the REAL JWT token from your server
            localStorage.setItem('grand_ai_token', data.token);
            
            // 2. Hide the overlay
            authOverlay.classList.add('hidden');
            authForm.reset();

        } catch (error) {
            // Show the error from the backend (e.g., "User already exists" or "Invalid credentials")
            errorMsg.innerText = error.message;
            errorMsg.classList.remove('hidden');
        } finally {
            // Re-enable the button
            submitBtn.disabled = false;
            submitBtn.innerText = isLoginMode ? "Login" : "Create Account";
        }
    });
};