// ============================================================================
// CONFIGURATION - Update this with your n8n webhook URL
// ============================================================================

const CONFIG = {
    // Replace this with YOUR n8n webhook URL
    N8N_WEBHOOK_URL: 'YOUR_N8N_WEBHOOK_URL_HERE'
    // Example: 'https://your-n8n-instance.app.n8n.cloud/webhook/charades-topic'
};

// ============================================================================
// GAME STATE - Everything stored locally on this phone
// ============================================================================

let gameState = {
    // Game Settings
    timerLength: 60,        // seconds per turn
    totalRounds: 3,         // how many rounds to play
    
    // Players
    players: [],            // {name, photo, score, skipsLeft}
    
    // Game Progress
    currentRound: 1,        // which round we're on
    currentPlayerIndex: 0,  // whose turn it is
    usedTopics: [],         // topics we've already used (for memory)
    
    // Current Turn
    timerInterval: null,
    currentTopic: null,
    currentCategory: null
};

// ============================================================================
// SCREEN NAVIGATION
// ============================================================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showElement(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideElement(id) {
    document.getElementById(id).classList.add('hidden');
}

// ============================================================================
// SETUP SCREEN - Add players and configure game
// ============================================================================

let tempPhoto = null; // Temporary storage for photo being added

// Photo upload
document.getElementById('photo-preview').addEventListener('click', () => {
    document.getElementById('photo-input').click();
});

document.getElementById('photo-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            tempPhoto = event.target.result;
            const preview = document.getElementById('photo-preview');
            preview.innerHTML = `<img src="${tempPhoto}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// Add player
document.getElementById('add-player-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('player-name-input');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter a player name');
        return;
    }
    
    // Check for duplicate names
    if (gameState.players.find(p => p.name === name)) {
        alert('Someone with that name is already playing!');
        return;
    }
    
    // Add player
    gameState.players.push({
        name: name,
        photo: tempPhoto || null,
        score: 0,
        skipsLeft: 1  // Everyone gets 1 skip per round
    });
    
    // Reset form
    nameInput.value = '';
    tempPhoto = null;
    document.getElementById('photo-preview').innerHTML = '<span class="photo-placeholder">📸</span>';
    
    // Update display
    updatePlayersGrid();
    updateStartButton();
});

// Update players grid
function updatePlayersGrid() {
    const grid = document.getElementById('players-list');
    grid.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <div class="player-card-photo">
                ${player.photo ? `<img src="${player.photo}" alt="${player.name}">` : '🎭'}
            </div>
            <div class="player-card-name">${player.name}</div>
            <button class="remove-player" onclick="removePlayer(${index})">×</button>
        `;
        grid.appendChild(card);
    });
}

// Remove player
function removePlayer(index) {
    gameState.players.splice(index, 1);
    updatePlayersGrid();
    updateStartButton();
}

// Update start button state
function updateStartButton() {
    const btn = document.getElementById('start-game-btn');
    if (gameState.players.length >= 2) {
        btn.disabled = false;
        btn.textContent = `Start Game (${gameState.players.length} players)`;
    } else {
        btn.disabled = true;
        btn.textContent = 'Start Game (need 2+ players)';
    }
}

// Settings
document.getElementById('timer-setting').addEventListener('change', (e) => {
    gameState.timerLength = parseInt(e.target.value);
});

document.getElementById('rounds-setting').addEventListener('change', (e) => {
    gameState.totalRounds = parseInt(e.target.value);
});

// Start game
document.getElementById('start-game-btn').addEventListener('click', () => {
    // Shuffle player order
    gameState.players.sort(() => Math.random() - 0.5);
    
    // Reset everyone's skips
    gameState.players.forEach(p => p.skipsLeft = 1);
    
    // Reset game state
    gameState.currentRound = 1;
    gameState.currentPlayerIndex = 0;
    gameState.usedTopics = [];
    
    // Go to game screen
    showGameScreen();
});

// ============================================================================
// GAME SCREEN - Main gameplay
// ============================================================================

function showGameScreen() {
    showScreen('game-screen');
    displayCurrentPlayer();
    updateRoundIndicator();
    
    // Reset turn display
    hideElement('timer-container');
    hideElement('topic-container');
    hideElement('turn-actions-section');
    hideElement('guesser-section');
    showElement('start-turn-section');
}

function displayCurrentPlayer() {
    const player = gameState.players[gameState.currentPlayerIndex];
    
    const photoEl = document.getElementById('current-player-photo');
    if (player.photo) {
        photoEl.innerHTML = `<img src="${player.photo}" alt="${player.name}">`;
    } else {
        photoEl.innerHTML = '<span>🎭</span>';
    }
    
    document.getElementById('current-player-name').textContent = player.name;
}

function updateRoundIndicator() {
    const text = `Round ${gameState.currentRound} of ${gameState.totalRounds}`;
    document.getElementById('round-indicator').textContent = text;
    document.getElementById('leaderboard-round').textContent = text;
}

// ============================================================================
// TURN FLOW
// ============================================================================

// Start turn - call n8n for topic
document.getElementById('start-turn-btn').addEventListener('click', async () => {
    hideElement('start-turn-section');
    showElement('loading');
    
    try {
        const topic = await getTopicFromAI();
        
        if (topic) {
            gameState.currentTopic = topic.topic;
            gameState.currentCategory = topic.category;
            gameState.usedTopics.push(topic.topic);
            
            // Display topic
            document.getElementById('category-badge').textContent = `${topic.emoji} ${topic.category}`;
            document.getElementById('topic-text').textContent = topic.topic;
            
            // Show topic and actions
            hideElement('loading');
            showElement('topic-container');
            showElement('turn-actions-section');
            
            // Update skip button
            const player = gameState.players[gameState.currentPlayerIndex];
            const skipBtn = document.getElementById('skip-btn');
            if (player.skipsLeft > 0) {
                document.getElementById('skip-text').textContent = `Skip (${player.skipsLeft} left)`;
                skipBtn.disabled = false;
            } else {
                document.getElementById('skip-text').textContent = 'No skips left';
                skipBtn.disabled = true;
            }
            
            // Start timer
            startTimer();
        } else {
            // Fallback if API fails
            hideElement('loading');
            alert('Could not get topic from AI. Using fallback.');
            useFallbackTopic();
        }
    } catch (error) {
        hideElement('loading');
        alert('Error connecting to AI. Using fallback topic.');
        useFallbackTopic();
    }
});

// Get topic from n8n/Claude
async function getTopicFromAI() {
    const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            usedTopics: gameState.usedTopics
        })
    });
    
    if (!response.ok) {
        throw new Error('API request failed');
    }
    
    const data = await response.json();
    return data; // Expecting: {category, emoji, topic}
}

// Fallback topics if AI fails
function useFallbackTopic() {
    const fallbacks = [
        { category: 'Movie', emoji: '🎬', topic: 'Home Alone' },
        { category: 'Song', emoji: '🎵', topic: 'Jingle Bells' },
        { category: 'Activity', emoji: '🎄', topic: 'Building a Snowman' },
        { category: 'Movie', emoji: '🎬', topic: 'Elf' },
        { category: 'Song', emoji: '🎵', topic: 'All I Want for Christmas' },
        { category: 'Book', emoji: '📚', topic: 'A Christmas Carol' },
        { category: 'Character', emoji: '⭐', topic: 'Santa Claus' },
        { category: 'Activity', emoji: '🎄', topic: 'Decorating the Tree' }
    ];
    
    // Pick random fallback not already used
    const available = fallbacks.filter(f => !gameState.usedTopics.includes(f.topic));
    const topic = available[Math.floor(Math.random() * available.length)] || fallbacks[0];
    
    gameState.currentTopic = topic.topic;
    gameState.currentCategory = topic.category;
    gameState.usedTopics.push(topic.topic);
    
    document.getElementById('category-badge').textContent = `${topic.emoji} ${topic.category}`;
    document.getElementById('topic-text').textContent = topic.topic;
    
    showElement('topic-container');
    showElement('turn-actions-section');
    startTimer();
}

// Timer
function startTimer() {
    let timeLeft = gameState.timerLength;
    const display = document.getElementById('timer-display');
    
    display.textContent = timeLeft;
    display.classList.remove('warning', 'danger');
    showElement('timer-container');
    
    gameState.timerInterval = setInterval(() => {
        timeLeft--;
        display.textContent = timeLeft;
        
        if (timeLeft <= 5) {
            display.classList.add('danger');
        } else if (timeLeft <= 10) {
            display.classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            stopTimer();
            // Auto-fail when time runs out
            handleFail();
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// Skip button
document.getElementById('skip-btn').addEventListener('click', async () => {
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (player.skipsLeft > 0) {
        player.skipsLeft--;
        stopTimer();
        
        // Get new topic
        hideElement('topic-container');
        hideElement('turn-actions-section');
        hideElement('timer-container');
        showElement('loading');
        
        try {
            const topic = await getTopicFromAI();
            if (topic) {
                gameState.currentTopic = topic.topic;
                gameState.currentCategory = topic.category;
                gameState.usedTopics.push(topic.topic);
                
                document.getElementById('category-badge').textContent = `${topic.emoji} ${topic.category}`;
                document.getElementById('topic-text').textContent = topic.topic;
                
                hideElement('loading');
                showElement('topic-container');
                showElement('turn-actions-section');
                
                // Update skip button
                document.getElementById('skip-text').textContent = player.skipsLeft > 0 ? 
                    `Skip (${player.skipsLeft} left)` : 'No skips left';
                document.getElementById('skip-btn').disabled = player.skipsLeft === 0;
                
                startTimer();
            } else {
                useFallbackTopic();
            }
        } catch (error) {
            hideElement('loading');
            useFallbackTopic();
        }
    }
});

// Success button
document.getElementById('success-btn').addEventListener('click', () => {
    stopTimer();
    
    // Actor gets a point
    gameState.players[gameState.currentPlayerIndex].score++;
    showPointsNotification();
    
    // Show guesser selection
    hideElement('turn-actions-section');
    showGuesserSelection();
});

// Fail button
document.getElementById('fail-btn').addEventListener('click', () => {
    handleFail();
});

function handleFail() {
    stopTimer();
    // No points awarded
    nextTurn();
}

// Show guesser selection
function showGuesserSelection() {
    const list = document.getElementById('guesser-list');
    list.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        // Skip current actor
        if (index === gameState.currentPlayerIndex) return;
        
        const btn = document.createElement('button');
        btn.className = 'guesser-btn';
        
        const photoHtml = player.photo ? 
            `<img src="${player.photo}" alt="${player.name}">` :
            `<div class="guesser-btn-photo">🎭</div>`;
        
        btn.innerHTML = `${photoHtml}<span>${player.name}</span>`;
        
        btn.addEventListener('click', () => {
            // Guesser gets a point
            player.score++;
            showPointsNotification();
            
            // Move to next turn
            setTimeout(() => {
                nextTurn();
            }, 500);
        });
        
        list.appendChild(btn);
    });
    
    showElement('guesser-section');
}

// Move to next turn
function nextTurn() {
    hideElement('guesser-section');
    hideElement('turn-actions-section');
    hideElement('topic-container');
    hideElement('timer-container');
    
    // Next player
    gameState.currentPlayerIndex++;
    
    // Check if round is complete
    if (gameState.currentPlayerIndex >= gameState.players.length) {
        // Round complete
        gameState.currentPlayerIndex = 0;
        gameState.currentRound++;
        
        // Reset everyone's skips for new round
        gameState.players.forEach(p => p.skipsLeft = 1);
        
        // Check if game is over
        if (gameState.currentRound > gameState.totalRounds) {
            showGameOver();
            return;
        }
    }
    
    // Show next player
    showGameScreen();
}

// ============================================================================
// LEADERBOARD
// ============================================================================

document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
    showLeaderboard();
});

document.getElementById('back-to-game-btn').addEventListener('click', () => {
    showGameScreen();
});

function showLeaderboard() {
    showScreen('leaderboard-screen');
    updateRoundIndicator();
    
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    
    // Sort by score
    const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
    
    sorted.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        if (index === 0) item.classList.add('winner');
        
        const photoHtml = player.photo ?
            `<img src="${player.photo}" alt="${player.name}">` :
            '🎭';
        
        item.innerHTML = `
            <div class="leaderboard-rank">${index === 0 ? '🏆' : index + 1}</div>
            <div class="leaderboard-photo">${photoHtml}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${player.name}</div>
                <div class="leaderboard-score">${player.score} pts</div>
            </div>
        `;
        
        list.appendChild(item);
    });
}

// ============================================================================
// GAME OVER
// ============================================================================

function showGameOver() {
    showScreen('game-over-screen');
    
    // Find winner
    const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    
    // Winner announcement
    const announcement = document.getElementById('winner-announcement');
    announcement.innerHTML = `
        <h2>🎉 ${winner.name} Wins! 🎉</h2>
        <p style="font-size: 1.3rem; font-weight: bold;">${winner.score} points</p>
    `;
    
    // Final leaderboard
    const list = document.getElementById('final-leaderboard');
    list.innerHTML = '';
    
    sorted.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        if (index === 0) item.classList.add('winner');
        
        const photoHtml = player.photo ?
            `<img src="${player.photo}" alt="${player.name}">` :
            '🎭';
        
        item.innerHTML = `
            <div class="leaderboard-rank">${index === 0 ? '🏆' : index + 1}</div>
            <div class="leaderboard-photo">${photoHtml}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${player.name}</div>
                <div class="leaderboard-score">${player.score} pts</div>
            </div>
        `;
        
        list.appendChild(item);
    });
}

// Play again
document.getElementById('new-game-btn').addEventListener('click', () => {
    // Reset scores
    gameState.players.forEach(p => {
        p.score = 0;
        p.skipsLeft = 1;
    });
    gameState.currentRound = 1;
    gameState.currentPlayerIndex = 0;
    gameState.usedTopics = [];
    
    // Shuffle players
    gameState.players.sort(() => Math.random() - 0.5);
    
    // Back to game
    showGameScreen();
});

// ============================================================================
// UI HELPERS
// ============================================================================

function showPointsNotification() {
    const notification = document.getElementById('points-notification');
    notification.classList.remove('show');
    void notification.offsetWidth; // Force reflow
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 1500);
}

// ============================================================================
// SERVICE WORKER REGISTRATION (for PWA)
// ============================================================================

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.error('Service Worker registration failed:', err));
}
