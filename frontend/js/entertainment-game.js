// ── Mini Game ──
function startMiniGame() {
    stopMiniGame();
    const arena = document.getElementById('game-arena');
    if (!arena) return;
    gameScore = 0;
    gameStreak = 0;
    gameMisses = 0;
    gameRankedScore = 0;
    gameRankedLocked = false;
    leaderboardSubmittedScore = 0;
    gameStartTime = Date.now();
    updateGameUI();
    arena.innerHTML = '';
    loadLeaderboard();
    
    // Start dynamic spawning loop
    gameSpawnLoop();
}

function gameSpawnLoop() {
    const arena = document.getElementById('game-arena');
    if (!arena || !gameStartTime) return;
    
    spawnItem(arena);
    
    const elapsed = (Date.now() - gameStartTime) / 1000;
    // Spawn rate starts at 1400ms, speeds up by 15ms per second of game time, floors at 450ms
    const spawnRate = Math.max(450, 1400 - (elapsed * 15));
    
    gameSpawnTimeout = setTimeout(gameSpawnLoop, spawnRate);
}

function stopMiniGame() {
    if (gameSpawnTimeout) { clearTimeout(gameSpawnTimeout); gameSpawnTimeout = null; }
    gameStartTime = 0;
    const arena = document.getElementById('game-arena');
    if (arena) arena.innerHTML = '';
}

function spawnItem(arena) {
    const el = document.createElement('button');
    const emoji = GAME_ITEMS[Math.floor(Math.random() * GAME_ITEMS.length)];
    el.textContent = emoji;
    el.className = 'game-item';
    el.style.left = `${5 + Math.random() * 78}%`;
    
    // Dynamic difficulty: falling speed increases over time (from 1.6s down to 0.5s)
    const elapsed = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
    const baseFallSpeed = Math.max(0.5, 1.6 - (elapsed * 0.015));
    const randomVariance = Math.max(0.2, 1.2 - (elapsed * 0.01));
    el.style.animationDuration = `${baseFallSpeed + Math.random() * randomVariance}s`;
    
    el.setAttribute('aria-label', `Catch ${emoji}`);

    const catchItem = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (el.classList.contains('caught')) return;
        el.classList.add('caught');
        gameScore += 10 + gameStreak * 2;
        if (!gameRankedLocked) {
            gameRankedScore = gameScore;
        }
        gameStreak++;
        updateGameUI();
        setTimeout(() => el.remove(), 300);
    };

    el.addEventListener('pointerdown', catchItem, { passive: false });

    el.addEventListener('animationend', () => {
        if (!el.classList.contains('caught')) {
            gameStreak = 0;
            if (!gameRankedLocked) {
                gameMisses++;
                if (gameMisses >= GAME_RANKED_MISS_LIMIT) {
                    gameMisses = GAME_RANKED_MISS_LIMIT;
                    gameRankedScore = gameScore;
                    gameRankedLocked = true;
                    showToast(`Ranked score locked at ${gameRankedScore}. Keep playing for fun!`);
                }
            }
            updateGameUI();
            el.remove();
        }
    });

    arena.appendChild(el);
}

function updateGameUI() {
    const scoreEl  = document.getElementById('game-score');
    const streakEl = document.getElementById('game-streak');
    const missesEl = document.getElementById('game-misses');
    const diffEl   = document.getElementById('game-difficulty');
    
    if (scoreEl)  scoreEl.textContent = gameScore;
    if (streakEl) streakEl.textContent = gameStreak;
    if (missesEl) missesEl.textContent = `${gameMisses}/${GAME_RANKED_MISS_LIMIT}`;
    
    if (diffEl) {
        const elapsed = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
        let levelStr = "Cozy 🥗";
        if (elapsed > 45) {
            levelStr = "CHEF MODE! ⚡🔥";
        } else if (elapsed > 25) {
            levelStr = "Spicy! 🌶️";
        } else if (elapsed > 12) {
            levelStr = "Simmering ⏱️";
        }
        diffEl.textContent = levelStr;
    }

    updateLeaderboardSubmitState();
}
