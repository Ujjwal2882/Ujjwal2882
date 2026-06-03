// Joke Generator API Configuration
const JOKE_API = 'https://v2.jokeapi.dev/joke';

// DOM Elements
const newJokeBtn = document.getElementById('newJokeBtn');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const jokeTypeSelect = document.getElementById('jokeType');
const loading = document.getElementById('loading');
const jokeDisplay = document.getElementById('jokeDisplay');
const setup = document.getElementById('setup');
const delivery = document.getElementById('delivery');
const singleJoke = document.getElementById('singleJoke');
const errorDiv = document.getElementById('error');
const jokeCountSpan = document.getElementById('jokeCount');
const jokeHistory = document.getElementById('jokeHistory');

// State Management
let jokeCount = 0;
let currentJoke = '';
let jokeHistoryArray = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎭 Joke Generator Initialized');
    loadHistoryFromLocalStorage();
    newJokeBtn.addEventListener('click', getNewJoke);
    copyBtn.addEventListener('click', copyJoke);
    shareBtn.addEventListener('click', shareJoke);
    clearHistoryBtn.addEventListener('click', clearHistory);
    jokeTypeSelect.addEventListener('change', getNewJoke);
});

/**
 * Fetch a random joke from JokeAPI
 */
async function getNewJoke() {
    try {
        clearError();
        showLoading(true);
        
        const jokeType = jokeTypeSelect.value;
        const url = `${JOKE_API}/${jokeType}?format=json`;
        
        console.log(`📡 Fetching joke from: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Joke received:', data);
        
        showLoading(false);
        displayJoke(data);
        incrementJokeCount();
        addToHistory(data);
        
    } catch (error) {
        console.error('❌ Error fetching joke:', error);
        showLoading(false);
        showError(`Oops! Failed to fetch joke: ${error.message}`);
    }
}

/**
 * Display the joke based on its type
 */
function displayJoke(jokeData) {
    jokeDisplay.innerHTML = ''; // Clear previous joke
    
    if (jokeData.type === 'twopart') {
        // Two-part joke
        setup.textContent = `🎤 ${jokeData.setup}`;
        delivery.textContent = `😂 ${jokeData.delivery}`;
        jokeDisplay.appendChild(setup);
        jokeDisplay.appendChild(delivery);
        currentJoke = `${jokeData.setup}\n${jokeData.delivery}`;
    } else {
        // Single-part joke
        singleJoke.textContent = `😆 ${jokeData.joke}`;
        jokeDisplay.appendChild(singleJoke);
        currentJoke = jokeData.joke;
    }
    
    // Animate joke appearance
    jokeDisplay.style.animation = 'none';
    setTimeout(() => {
        jokeDisplay.style.animation = 'slideUp 0.5s ease-out';
    }, 10);
}

/**
 * Copy joke to clipboard
 */
async function copyJoke() {
    if (!currentJoke) {
        showError('No joke to copy! Get a joke first.');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentJoke);
        
        // Show feedback
        const originalText = copyBtn.querySelector('.btn-text').textContent;
        copyBtn.querySelector('.btn-text').textContent = '✅ Copied!';
        copyBtn.classList.add('btn-primary');
        copyBtn.classList.remove('btn-secondary');
        
        setTimeout(() => {
            copyBtn.querySelector('.btn-text').textContent = originalText;
            copyBtn.classList.remove('btn-primary');
            copyBtn.classList.add('btn-secondary');
        }, 2000);
        
        console.log('📋 Joke copied to clipboard');
    } catch (error) {
        console.error('❌ Failed to copy:', error);
        showError('Failed to copy to clipboard');
    }
}

/**
 * Share joke via URL
 */
function shareJoke() {
    if (!currentJoke) {
        showError('No joke to share! Get a joke first.');
        return;
    }
    
    const encodedJoke = encodeURIComponent(currentJoke);
    const jokeType = jokeTypeSelect.value;
    
    // Create shareable URL with joke data
    const shareUrl = `${window.location.href}?joke=${encodedJoke}&type=${jokeType}`;
    
    // Try Web Share API
    if (navigator.share) {
        navigator.share({
            title: '🎭 Check out this joke!',
            text: currentJoke,
            url: shareUrl
        }).catch(err => {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                fallbackShare(shareUrl);
            }
        });
    } else {
        fallbackShare(shareUrl);
    }
}

/**
 * Fallback share method - copy URL to clipboard
 */
function fallbackShare(url) {
    navigator.clipboard.writeText(url).then(() => {
        showError('Share URL copied to clipboard! 🔗', false);
    }).catch(() => {
        showError('Could not generate share link');
    });
}

/**
 * Add joke to history
 */
function addToHistory(jokeData) {
    const jokeText = jokeData.type === 'twopart' 
        ? `${jokeData.setup} - ${jokeData.delivery}`
        : jokeData.joke;
    
    jokeHistoryArray.unshift({
        text: jokeText,
        type: jokeData.type,
        timestamp: new Date().toLocaleTimeString()
    });
    
    // Keep only last 10 jokes
    if (jokeHistoryArray.length > 10) {
        jokeHistoryArray.pop();
    }
    
    saveHistoryToLocalStorage();
    updateHistoryDisplay();
}

/**
 * Update history display
 */
function updateHistoryDisplay() {
    jokeHistory.innerHTML = '';
    
    if (jokeHistoryArray.length === 0) {
        jokeHistory.innerHTML = '<p class="placeholder">Your recent jokes will appear here...</p>';
        clearHistoryBtn.classList.add('hidden');
        return;
    }
    
    clearHistoryBtn.classList.remove('hidden');
    
    jokeHistoryArray.forEach((joke, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <strong>${joke.timestamp}</strong><br/>
            ${joke.text.substring(0, 100)}${joke.text.length > 100 ? '...' : ''}
        `;
        item.addEventListener('click', () => {
            currentJoke = joke.text;
            jokeDisplay.innerHTML = `<div class="joke-text">${joke.text}</div>`;
            copyBtn.focus();
        });
        jokeHistory.appendChild(item);
    });
}

/**
 * Clear joke history
 */
function clearHistory() {
    if (confirm('Are you sure you want to clear all jokes from history?')) {
        jokeHistoryArray = [];
        saveHistoryToLocalStorage();
        updateHistoryDisplay();
    }
}

/**
 * Increment joke counter
 */
function incrementJokeCount() {
    jokeCount++;
    jokeCountSpan.textContent = jokeCount;
}

/**
 * Show/hide loading animation
 */
function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
        newJokeBtn.disabled = true;
    } else {
        loading.classList.add('hidden');
        newJokeBtn.disabled = false;
    }
}

/**
 * Show error message
 */
function showError(message, isError = true) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    if (isError) {
        setTimeout(() => {
            clearError();
        }, 5000);
    }
}

/**
 * Clear error message
 */
function clearError() {
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
}

/**
 * Save history to localStorage
 */
function saveHistoryToLocalStorage() {
    try {
        localStorage.setItem('jokeHistory', JSON.stringify(jokeHistoryArray));
    } catch (error) {
        console.error('Failed to save history:', error);
    }
}

/**
 * Load history from localStorage
 */
function loadHistoryFromLocalStorage() {
    try {
        const saved = localStorage.getItem('jokeHistory');
        if (saved) {
            jokeHistoryArray = JSON.parse(saved);
            updateHistoryDisplay();
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

/**
 * Load joke from URL parameter (for sharing)
 */
function loadJokeFromURL() {
    const params = new URLSearchParams(window.location.search);
    const joke = params.get('joke');
    const type = params.get('type');
    
    if (joke) {
        currentJoke = decodeURIComponent(joke);
        jokeDisplay.innerHTML = `<div class="joke-text">${currentJoke}</div>`;
        incrementJokeCount();
        if (type) {
            jokeTypeSelect.value = type;
        }
    }
}

// Load joke from URL on page load
window.addEventListener('load', loadJokeFromURL);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        newJokeBtn.click();
    }
});

console.log('🎭 Joke Generator Script Loaded Successfully!');
