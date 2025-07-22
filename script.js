// ReleaseWit - Funny Release Notes Generator
class ReleaseWitApp {
    constructor() {
        // Check localStorage availability
        if (typeof Storage === "undefined") {
            console.error('localStorage is not available in this browser');
            alert('Your browser does not support localStorage. API key cannot be saved.');
        }
        
        this.apiKey = localStorage.getItem('claude_api_key');
        this.savedNotes = JSON.parse(localStorage.getItem('saved_notes')) || [];
        this.examples = [];
        this.currentNotes = [];
        this.formValidationSetup = false;
        
        
        
        this.init();
    }

    async init() {
        await this.loadExamples();
        this.setupEventListeners();
        this.updateUIState();
        this.displaySavedNotes();
        this.restoreActiveTab();
    }

    async loadExamples() {
        try {
            const response = await fetch('./examples.json');
            const data = await response.json();
            this.examples = data.examples;
        } catch (error) {
            console.error('Failed to load examples:', error);
            // Fallback examples in case file fails to load
            this.examples = [
                "🚀 Version 2.3.1: Fixed the bug where our app would crash when you tried to actually use it. Turns out, testing is important. Who knew?",
                "🎉 Release 1.8.0: Added dark mode because apparently light mode is now considered a war crime. Your retinas can thank us later."
            ];
        }
    }

    setupEventListeners() {
        // Login/Logout functionality
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('saveApiKey').addEventListener('click', () => this.saveApiKey());
        
        // Login screen functionality
        document.getElementById('loginSubmitBtn').addEventListener('click', () => this.loginFromScreen());
        document.getElementById('loginApiKey').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loginFromScreen();
        });
        
        // Modal functionality
        const modal = document.getElementById('loginModal');
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => this.hideLoginModal());
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.hideLoginModal();
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());
        
        // Logo/title click to go to homepage
        document.getElementById('logoSection').addEventListener('click', () => this.goToHomepage());
        
        // Tab switching (sidebar navigation)
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
        });

        // Generation buttons
        document.getElementById('generateBtn').addEventListener('click', () => this.generateReleaseNotes());

        // Saved notes management

        // Enter key support for API key input
        document.getElementById('apiKey').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });

        // Form validation will be setup when UI becomes visible
    }

    setupFormValidation() {
        // Prevent duplicate event listeners
        if (this.formValidationSetup) return;
        
        const reviewTextElement = document.getElementById('reviewText');
        if (reviewTextElement) {
            reviewTextElement.addEventListener('input', () => {
                this.validateForm();
            });
            this.formValidationSetup = true;
        }
    }

    updateUIState() {
        // Force refresh the API key from localStorage
        this.apiKey = localStorage.getItem('claude_api_key');
        const hasApiKey = !!this.apiKey;
        
        // Show/hide main sections
        if (hasApiKey) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appMain').style.display = 'block';
            document.getElementById('sidebar').style.display = 'flex';
            
            // Setup event listener for form validation if not already setup
            this.setupFormValidation();
            
            // Validate form when showing the app
            this.validateForm();
        } else {
            document.getElementById('loginScreen').style.display = 'block';
            document.getElementById('appMain').style.display = 'none';
            document.getElementById('sidebar').style.display = 'none';
        }
    }

    validateForm() {
        const reviewText = document.getElementById('reviewText').value.trim();
        const generateBtn = document.getElementById('generateBtn');
        
        if (reviewText.length === 0) {
            generateBtn.disabled = true;
            generateBtn.style.opacity = '0.6';
            generateBtn.style.cursor = 'not-allowed';
        } else {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            generateBtn.style.cursor = 'pointer';
        }
    }

    showLoginModal() {
        document.getElementById('loginModal').style.display = 'block';
        document.getElementById('apiKey').focus();
    }

    hideLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('apiKey').value = '';
    }

    saveApiKey() {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (!apiKey) {
            alert('Please enter your Claude API key');
            return;
        }

        // Basic validation - Claude API keys typically start with 'sk-ant-'
        if (!apiKey.startsWith('sk-ant-')) {
            const confirm = window.confirm('The API key format looks unusual. Claude API keys typically start with "sk-ant-". Continue anyway?');
            if (!confirm) return;
        }

        this.apiKey = apiKey;
        localStorage.setItem('claude_api_key', apiKey);
        this.hideLoginModal();
        this.updateUIState();
        
        // Show success message
        this.showTemporaryMessage('API key saved successfully!', 'success');
    }

    loginFromScreen() {
        const apiKey = document.getElementById('loginApiKey').value.trim();
        if (!apiKey) {
            alert('Please enter your Claude API key');
            return;
        }

        // Basic validation - Claude API keys typically start with 'sk-ant-'
        if (!apiKey.startsWith('sk-ant-')) {
            const confirm = window.confirm('The API key format looks unusual. Claude API keys typically start with "sk-ant-". Continue anyway?');
            if (!confirm) return;
        }

        // Store API key
        this.apiKey = apiKey;
        try {
            localStorage.setItem('claude_api_key', apiKey);
        } catch (error) {
            console.error('Failed to save API key to localStorage:', error);
            alert('Failed to save API key. Please check if localStorage is available.');
            return;
        }
        
        this.updateUIState();
        
        // Clear the input
        document.getElementById('loginApiKey').value = '';
        
        // Show success message
        this.showTemporaryMessage('Login successful!', 'success');
    }

    logout() {
        this.apiKey = null;
        localStorage.removeItem('claude_api_key');
        this.updateUIState();
        this.clearCurrentResults();
        this.showTemporaryMessage('Logged out successfully', 'info');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('appMain');
        
        sidebar.classList.toggle('minimized');
        
        // Adjust main content margin based on sidebar state
        if (sidebar.classList.contains('minimized')) {
            mainContent.style.marginLeft = '60px';
        } else {
            mainContent.style.marginLeft = '240px';
        }
    }

    goToHomepage() {
        // Switch to generator tab and clear any active nav items
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById('generator').classList.add('active');
    }

    switchTab(tabName) {
        // Update sidebar navigation
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) targetBtn.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        // Save active tab to localStorage
        localStorage.setItem('activeTab', tabName);

        // Update saved notes display when switching to saved tab
        if (tabName === 'saved') {
            this.displaySavedNotes();
        }
    }

    async generateReleaseNotes() {
        if (!this.apiKey) {
            alert('Please login with your Claude API key first');
            return;
        }

        const reviewText = document.getElementById('reviewText').value.trim();
        const topicText = document.getElementById('topicText').value.trim();

        if (!reviewText) {
            alert('Please enter some content about what was released or updated');
            return;
        }

        this.showLoading(true);
        this.clearCurrentResults();

        try {
            const prompt = this.buildPrompt(reviewText, topicText);
            const releaseNotes = await this.callClaudeAPI(prompt);
            
            if (releaseNotes && releaseNotes.length > 0) {
                this.currentNotes = releaseNotes;
                this.displayReleaseNotes(releaseNotes);
            } else {
                throw new Error('No release notes generated');
            }
        } catch (error) {
            console.error('Generation failed:', error);
            console.error('Error type:', typeof error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            this.showTemporaryMessage(`Failed to generate release notes: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    buildPrompt(reviewText, topicText) {        
        let prompt = `Create exactly 10 funny and engaging release notes based on the content provided. Use UK English and make each one a complete, entertaining story.

Requirements:
- Exactly 10 release notes
- Each should be at least 500 characters long
- Make them sassy, funny, and engaging
- Each should be a complete story
- Use UK English spelling and expressions

Content to base the release notes on:
${reviewText}`;

        if (topicText) {
            prompt += `\n\nTopic/Theme to incorporate: ${topicText}\nCreatively weave this theme into the release notes where appropriate.`;
        }

        prompt += `\n\nIMPORTANT: Return exactly 10 release notes as a JSON array of strings. No additional text, formatting, or explanation. Just the JSON array with exactly 10 strings.`;

        return prompt;
    }

    async callClaudeAPI(prompt) {
        try {
            const response = await fetch('/api/claude', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 4000,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            }).catch(error => {
                console.error('Fetch error:', error);
                throw new Error(`Network error: ${error.message}`);
            });

            console.log('Response status:', response.status, response.statusText);
            console.log('Response headers:', [...response.headers.entries()]);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API error response:', errorData);
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const content = data.content[0].text;

            try {
                // Try to parse as JSON array
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                // If JSON parsing fails, try to extract lines
                const lines = content.split('\n').filter(line => line.trim().length > 0);
                if (lines.length > 0) {
                    return lines.map(line => line.replace(/^\d+\.\s*/, '').trim());
                }
            }

            throw new Error('Could not parse generated release notes');
            
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('Load failed')) {
                throw new Error('Cannot connect to Claude API from localhost due to CORS policy. Please deploy to a server or use a CORS proxy.');
            }
            throw error;
        }
    }

    displayReleaseNotes(notes) {
        const container = document.getElementById('releaseNotes');
        container.innerHTML = '';

        // Update button text to "Generate New Batch"
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.querySelector('.btn-text').textContent = 'Generate New Batch';

        notes.forEach((note, index) => {
            const card = document.createElement('div');
            card.className = 'release-note-card';
            
            // Remove quotes from the note text
            const cleanNote = note.replace(/^["']|["']$/g, '');
            
            card.innerHTML = `
                <button class="copy-btn" onclick="app.copyToClipboard('${this.escapeHtml(cleanNote).replace(/'/g, "\\'")}', this)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                </button>
                <div class="release-note-text">${this.escapeHtml(cleanNote)}</div>
                <button class="save-btn" onclick="app.saveNote('${this.escapeHtml(cleanNote).replace(/'/g, "\\'")}', ${index})">
                    Save for Later
                </button>
            `;
            container.appendChild(card);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            // Temporarily show copied state
            const originalContent = buttonElement.innerHTML;
            buttonElement.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            
            setTimeout(() => {
                buttonElement.innerHTML = originalContent;
            }, 1000);
        }).catch(() => {
            this.showTemporaryMessage('Failed to copy to clipboard', 'error');
        });
    }

    saveNote(noteText, index) {
        // Check if note is already saved
        if (this.savedNotes.some(saved => saved.text === noteText)) {
            this.showTemporaryMessage('Note already saved!', 'info');
            return;
        }

        const savedNote = {
            text: noteText,
            savedAt: new Date().toISOString(),
            id: Date.now() + Math.random()
        };

        this.savedNotes.push(savedNote);
        localStorage.setItem('saved_notes', JSON.stringify(this.savedNotes));

        // Update button state
        const buttons = document.querySelectorAll('.save-btn');
        if (buttons[index]) {
            buttons[index].textContent = 'Saved';
            buttons[index].classList.add('saved');
            buttons[index].disabled = true;
        }

        this.showTemporaryMessage('Note saved successfully!', 'success');
    }

    restoreActiveTab() {
        const activeTab = localStorage.getItem('activeTab') || 'generate';
        this.switchTab(activeTab);
    }

    displaySavedNotes() {
        const container = document.getElementById('savedNotes');
        const noNotesMsg = document.getElementById('noSavedNotes');
        
        if (this.savedNotes.length === 0) {
            container.style.display = 'none';
            noNotesMsg.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        noNotesMsg.style.display = 'none';
        container.innerHTML = '';

        // Sort by saved date (newest first)
        const sortedNotes = [...this.savedNotes].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

        sortedNotes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'saved-note-card';
            
            const savedDate = new Date(note.savedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            card.innerHTML = `
                <button class="copy-btn" onclick="app.copyToClipboard('${this.escapeHtml(note.text).replace(/'/g, "\\'")}', this)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                </button>
                <div class="saved-note-meta">Saved on ${savedDate}</div>
                <div class="saved-note-text">${this.escapeHtml(note.text)}</div>
                <button class="remove-btn" onclick="app.removeSavedNote('${note.id}')">
                    Remove
                </button>
            `;
            container.appendChild(card);
        });
    }

    removeSavedNote(noteId) {
        if (confirm('Are you sure you want to remove this saved note?')) {
            this.savedNotes = this.savedNotes.filter(note => note.id != noteId);
            localStorage.setItem('saved_notes', JSON.stringify(this.savedNotes));
            this.displaySavedNotes();
            this.showTemporaryMessage('Note removed', 'info');
        }
    }

    clearAllSavedNotes() {
        if (this.savedNotes.length === 0) {
            this.showTemporaryMessage('No notes to clear', 'info');
            return;
        }

        if (confirm(`Are you sure you want to clear all ${this.savedNotes.length} saved notes? This cannot be undone.`)) {
            this.savedNotes = [];
            localStorage.setItem('saved_notes', JSON.stringify(this.savedNotes));
            this.displaySavedNotes();
            this.showTemporaryMessage('All notes cleared', 'info');
        }
    }

    showLoading(show) {
        // Toggle spinner and disable button
        const generateBtn = document.getElementById('generateBtn');
        
        if (show) {
            generateBtn.classList.add('loading');
            generateBtn.disabled = true;
            generateBtn.style.cursor = 'not-allowed';
        } else {
            generateBtn.classList.remove('loading');
            generateBtn.disabled = false;
            generateBtn.style.cursor = 'pointer';
        }
    }

    clearCurrentResults() {
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('releaseNotes').innerHTML = '';
        this.currentNotes = [];
        
        // Reset button text to "Generate"
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.querySelector('.btn-text').textContent = 'Generate';
    }

    showTemporaryMessage(message, type = 'info') {
        // Remove any existing messages
        const existingMessage = document.querySelector('.temp-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message element
        const messageElement = document.createElement('div');
        messageElement.className = `temp-message temp-message-${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                messageElement.style.backgroundColor = '#28a745';
                break;
            case 'error':
                messageElement.style.backgroundColor = '#dc3545';
                break;
            case 'info':
            default:
                messageElement.style.backgroundColor = '#667eea';
                break;
        }

        document.body.appendChild(messageElement);

        // Animate in
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateX(0)';
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateX(100%)';
            setTimeout(() => messageElement.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ReleaseWitApp();
});