/* FridgeJam Entertainment Zone */

// ─────────────────────────────────────────
//  ENTERTAINMENT ZONE — Jokes + Mini Game
// ─────────────────────────────────────────

const FOOD_JOKES = [
    { setup: "Why did the tomato turn red?", punchline: "Because it saw the salad dressing! 🥗", keywords: ["dressing", "saw", "salad"] },
    { setup: "What do you call a stolen yam?", punchline: "A hot potato! 🥔", keywords: ["hot potato", "potato", "hot"] },
    { setup: "Why did the baker stop making donuts?", punchline: "He was sick of the hole business! 🍩", keywords: ["hole", "whole"] },
    { setup: "What do you call cheese that isn't yours?", punchline: "Nacho cheese! 🧀", keywords: ["nacho", "not yours"] },
    { setup: "Why did the banana go to the doctor?", punchline: "Because it wasn't peeling well! 🍌", keywords: ["peel", "peeling", "feeling"] },
    { setup: "What did the ocean say to the pizza?", punchline: "Nothing, it just waved! 🌊🍕", keywords: ["waved", "wave"] },
    { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up! 🥚", keywords: ["crack", "cracking"] },
    { setup: "What do you call a fake noodle?", punchline: "An impasta! 🍝", keywords: ["impasta", "imposter"] },
    { setup: "Why did the cookie go to the doctor?", punchline: "It was feeling crummy! 🍪", keywords: ["crummy", "crumb", "feeling"] },
    { setup: "What did the lettuce say to the celery?", punchline: "Quit stalking me! 🥬", keywords: ["stalk", "stalking", "stalks"] },
    { setup: "Why did the grape stop in the middle of the road?", punchline: "Because it ran out of juice! 🍇", keywords: ["juice", "run out", "ran out"] },
    { setup: "What do you call a sad strawberry?", punchline: "A blueberry! 🍓", keywords: ["blue", "blueberry"] },
    { setup: "Why was the mushroom always invited to parties?", punchline: "Because he was a fun-gi! 🍄", keywords: ["fun-gi", "fungi", "fun guy"] },
    { setup: "What did the sushi say to the bee?", punchline: "Wasabi! 🍣", keywords: ["wasabi", "sushi", "bee"] },
    { setup: "Why did the student eat his homework?", punchline: "The teacher said it was a piece of cake! 🎂", keywords: ["cake", "piece of cake"] },
    { setup: "What do you call a sleeping pizza?", punchline: "A pi-zzz-a! 🍕", keywords: ["pi-zzz-a", "pizzza", "sleep", "zzz"] },
    { setup: "Why did the chef get arrested?", punchline: "Because he was caught beating an egg! 🥚", keywords: ["beating", "beat", "egg"] },
    { setup: "What's a potato's favourite TV show?", punchline: "Starch Trek! 🥔🚀", keywords: ["starch", "trek", "starch trek"] },
    { setup: "Why did the orange lose the race?", punchline: "It ran out of juice! 🍊", keywords: ["juice", "run out", "orange"] },
    { setup: "What did one plate say to the other?", punchline: "Lunch is on me! 🍽️", keywords: ["lunch is on me", "lunch", "on me"] }
];

let jokeIndex = 0;
let gameScore = 0;
let gameStreak = 0;
let gameMisses = 0;
let gameRankedScore = 0;
let gameRankedLocked = false;
let entertainChoice = null; // 'jokes' | 'game' | null
let pendingRecipeData = null; // store finished recipe until user clicks "See My Recipe"
let jokesViewedCount = 0;
let gameStartTime = 0;
let gameSpawnTimeout = null;
let leaderboardDb = null;
let leaderboardReady = false;
let leaderboardSubmittedScore = 0;

const GAME_ITEMS = ['🍅','🥕','🧅','🥦','🍋','🥚','🧄','🌽','🍄','🥑','🍇','🥝','🍓','🫑','🥒'];
const GAME_RANKED_MISS_LIMIT = 5;

function pickEntertain(choice) {
    entertainChoice = choice;
    const picker = document.getElementById('ez-picker');
    const jokesPanel = document.getElementById('ez-panel-jokes');
    const gamePanel  = document.getElementById('ez-panel-game');
    if (picker)     picker.classList.add('hidden');
    if (jokesPanel) jokesPanel.classList.add('hidden');
    if (gamePanel)  gamePanel.classList.add('hidden');

    if (choice === 'jokes') {
        jokeIndex = Math.floor(Math.random() * FOOD_JOKES.length);
        loadJoke(jokeIndex);
        if (jokesPanel) jokesPanel.classList.remove('hidden');
    } else {
        startMiniGame();
        if (gamePanel) gamePanel.classList.remove('hidden');
    }
}

function resetEntertainPicker() {
    stopMiniGame();
    entertainChoice = null;
    const picker = document.getElementById('ez-picker');
    const jokesPanel = document.getElementById('ez-panel-jokes');
    const gamePanel  = document.getElementById('ez-panel-game');
    if (jokesPanel) jokesPanel.classList.add('hidden');
    if (gamePanel)  gamePanel.classList.add('hidden');
    if (picker)     picker.classList.remove('hidden');
}

function initLeaderboard() {
    if (leaderboardReady || !window.firebase) return;
    try {
        if (!initFirebaseServices() || !authDb) return;
        leaderboardDb = authDb;
        leaderboardReady = true;
    } catch (err) {
        console.warn("[FridgeJam] Leaderboard unavailable:", err);
        leaderboardReady = false;
    }
}

function renderLeaderboardRows(scores) {
    const list = document.getElementById('game-leaderboard-list');
    if (!list) return;

    if (!scores || scores.length === 0) {
        list.innerHTML = '<li class="leaderboard-muted">No scores yet. Be the first to catch something.</li>';
        return;
    }

    list.innerHTML = scores.map((entry, index) => `
        <li>
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${escapeHtml(entry.nickname || 'Chef')}</span>
            <strong>${Number(entry.score || 0)}</strong>
        </li>
    `).join('');
}

async function loadLeaderboard() {
    initLeaderboard();
    const list = document.getElementById('game-leaderboard-list');
    if (list) list.innerHTML = '<li class="leaderboard-muted">Loading top catches...</li>';

    if (!leaderboardReady || !leaderboardDb) {
        if (list) list.innerHTML = '<li class="leaderboard-muted">Leaderboard needs Firestore rules before it can load.</li>';
        return;
    }

    try {
        const snapshot = await leaderboardDb
            .collection('game_scores')
            .orderBy('score', 'desc')
            .limit(5)
            .get();
        const scores = snapshot.docs.map(doc => doc.data());
        renderLeaderboardRows(scores);
    } catch (err) {
        console.warn("[FridgeJam] Could not load leaderboard:", err);
        if (list) list.innerHTML = '<li class="leaderboard-muted">Leaderboard is locked until rules are published.</li>';
    }
}

function updateLeaderboardSubmitState() {
    const form = document.getElementById('leaderboard-submit-form');
    const input = document.getElementById('leaderboard-name-input');
    const note = document.getElementById('leaderboard-submit-note');
    if (!form) return;

    const canSubmit = gameRankedLocked && gameRankedScore > 0 && leaderboardSubmittedScore === 0;
    form.classList.toggle('hidden', !canSubmit);

    if (note) {
        note.textContent = gameRankedLocked
            ? `Your leaderboard score is ${gameRankedScore}. Recording stopped when you made your 5th miss, but you can keep playing for fun.`
            : `Leaderboard recording stops at your 5th missed ingredient. You can keep playing after that for fun.`;
    }

    if (input && canSubmit && !input.value.trim()) {
        input.value = localStorage.getItem('fridgejamLeaderboardName') || '';
    }
}

function sanitizeNickname(value) {
    return value
        .trim()
        .replace(/[^\w\s.-]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 18);
}

async function submitLeaderboardScore(e) {
    e.preventDefault();
    initLeaderboard();

    if (!leaderboardReady || !leaderboardDb) {
        showToast("Leaderboard is not ready yet. Check Firestore rules.");
        return;
    }

    if (!gameRankedLocked) {
        showToast("Leaderboard score locks after 5 missed ingredients.");
        return;
    }

    if (gameRankedScore <= 0) {
        showToast("Catch at least one ingredient before the 5th miss!");
        return;
    }

    const input = document.getElementById('leaderboard-name-input');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const nickname = sanitizeNickname(input ? input.value : '');

    if (nickname.length < 2) {
        showToast("Use at least 2 characters for your nickname.");
        return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
        await leaderboardDb.collection('game_scores').add({
            nickname,
            score: gameRankedScore,
            gameType: 'catch-ingredients',
            missesLimit: GAME_RANKED_MISS_LIMIT,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        leaderboardSubmittedScore = gameRankedScore;
        localStorage.setItem('fridgejamLeaderboardName', nickname);
        queueCloudSync();
        updateLeaderboardSubmitState();
        await loadLeaderboard();
        showToast("Score saved to the leaderboard! 🏆");
    } catch (err) {
        console.warn("[FridgeJam] Could not save leaderboard score:", err);
        showToast("Score could not be saved yet. Check Firestore rules.");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

function loadJoke(index) {
    jokesViewedCount++;
    
    const setup     = document.getElementById('joke-setup');
    const punchline = document.getElementById('joke-punchline');
    const nextBtn   = document.getElementById('joke-next-btn');
    const userJokeContainer = document.getElementById('user-joke-container');
    const userJokePrompt = document.getElementById('user-joke-prompt');
    const userJokeInput = document.getElementById('user-joke-input');
    const submitBtn = document.getElementById('btn-submit-user-joke');
    const guessContainer = document.getElementById('joke-guess-container');
    const guessInput = document.getElementById('joke-guess-input');
    
    // Wire up submit button event listener exactly once
    if (submitBtn && !submitBtn.dataset.bound) {
        submitBtn.dataset.bound = "true";
        submitBtn.onclick = submitUserJoke;
    }
    
    // If they viewed at least 3 jokes, prompt them to tell their own joke
    if (jokesViewedCount >= 3) {
        if (setup) setup.textContent = "";
        if (punchline) punchline.classList.add('hidden');
        if (guessContainer) guessContainer.style.display = 'none';
        if (nextBtn) nextBtn.classList.add('hidden');
        
        if (userJokeContainer) {
            userJokeContainer.classList.remove('hidden');
            if (userJokeInput) userJokeInput.value = "";
            
            const chefPromptNames = {
                budget: "Alright friend, Tony's clean out of jokes! Now it's your turn. Tell me a food joke of your own! 🎤",
                grandma: "Sweetheart, grandma has told you all her best puns! Now you must tell me one of yours! 👵🎤",
                chef: "Pierre has plated his best puns! Now it is your turn. Show me your culinary comedy! 👨‍🍳🎤",
                chloe: "Boom! Clean jokes complete! Your turn to supply the positive energy. Drop a food joke on me! 🥗🎤"
            };
            const activePersonality = appState.selectedPersonality || 'grandma';
            if (userJokePrompt) {
                userJokePrompt.textContent = chefPromptNames[activePersonality] || chefPromptNames.grandma;
            }
        }
        return;
    }
    
    if (userJokeContainer) userJokeContainer.classList.add('hidden');
    
    const joke = FOOD_JOKES[index % FOOD_JOKES.length];
    if (setup)     setup.textContent = joke.setup;
    if (punchline) { punchline.textContent = joke.punchline; punchline.classList.add('hidden'); }
    if (guessContainer) {
        guessContainer.style.display = 'flex';
        if (guessInput) guessInput.value = "";
    }
    if (nextBtn)   nextBtn.classList.add('hidden');
}

function submitJokeGuess() {
    const inputEl = document.getElementById('joke-guess-input');
    const punchlineEl = document.getElementById('joke-punchline');
    const guessContainer = document.getElementById('joke-guess-container');
    const nextBtn = document.getElementById('joke-next-btn');
    const setupEl = document.getElementById('joke-setup');
    
    if (!inputEl) return;
    const guessText = inputEl.value.trim().toLowerCase();
    if (guessText.length < 2) {
        showToast("Guess something first! 🧠");
        return;
    }
    
    const joke = FOOD_JOKES[jokeIndex % FOOD_JOKES.length];
    const keywords = joke.keywords || [];
    
    // Check if guess matches any keyword or is extremely close
    const isCorrect = keywords.some(k => guessText.includes(k.toLowerCase())) || 
                      guessText.includes(joke.punchline.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    const activePersonality = appState.selectedPersonality || 'grandma';
    let reactionText = "";
    
    if (isCorrect) {
        if (synth && typeof synth.playSuccessBeep === 'function') {
            synth.playSuccessBeep();
            setTimeout(() => synth.playSuccessBeep(), 150);
        }
        
        const correctReactions = {
            budget: `Boom! Spot on! You saved those brain calories: "${joke.punchline}" 💰`,
            grandma: `Oh sweetheart, you got it! Grandma is so proud of you: "${joke.punchline}" 👵❤️`,
            chef: `Magnifique! Absolute culinary perfection! You guessed it: "${joke.punchline}" 👨‍🍳✨`,
            chloe: `BOOM! Clean pun power! Spot on guess: "${joke.punchline}"! Keep that energy up! 🥗💪`
        };
        reactionText = correctReactions[activePersonality] || correctReactions.grandma;
    } else {
        if (synth && typeof synth.playDialClick === 'function') {
            synth.playDialClick();
        }
        
        const incorrectReactions = {
            budget: `Nice try, but that guess is worth about two cents! The real answer is: "${joke.punchline}" 🧀`,
            grandma: `Oh bless your sweet heart, that's not quite it honey, but I love the creative thinking! The real answer is: "${joke.punchline}" 👵☕`,
            chef: `Mon dieu... that guess is like a flat, overcooked soufflé. Tasteless! The real gourmet punchline is: "${joke.punchline}" 🥖`,
            chloe: `Oof, missed the rep on that guess! Push harder next time. The real punchline is: "${joke.punchline}"! 🥗⚡`
        };
        reactionText = incorrectReactions[activePersonality] || incorrectReactions.grandma;
    }
    
    if (setupEl) setupEl.textContent = reactionText;
    if (guessContainer) guessContainer.style.display = 'none';
    if (nextBtn) nextBtn.classList.remove('hidden');
}

function revealPunchline() {
    const joke = FOOD_JOKES[jokeIndex % FOOD_JOKES.length];
    const setupEl = document.getElementById('joke-setup');
    const guessContainer = document.getElementById('joke-guess-container');
    const nextBtn = document.getElementById('joke-next-btn');
    
    if (synth && typeof synth.playDialClick === 'function') {
        synth.playDialClick();
    }
    
    const activePersonality = appState.selectedPersonality || 'grandma';
    const giveUpMessages = {
        budget: `Smart, save that cognitive energy! The answer is: "${joke.punchline}"`,
        grandma: `No worries, my darling! Here is the punchline: "${joke.punchline}"`,
        chef: `Ah, the mystery is solved! The gourmet punchline is: "${joke.punchline}"`,
        chloe: `Resting on this set? Totally fine! The answer is: "${joke.punchline}"`
    };
    
    if (setupEl) setupEl.textContent = giveUpMessages[activePersonality] || giveUpMessages.grandma;
    if (guessContainer) guessContainer.style.display = 'none';
    if (nextBtn) nextBtn.classList.remove('hidden');
}

function nextJoke() {
    jokeIndex = (jokeIndex + 1) % FOOD_JOKES.length;
    loadJoke(jokeIndex);
}

function submitUserJoke() {
    const inputEl = document.getElementById('user-joke-input');
    const promptEl = document.getElementById('user-joke-prompt');
    
    if (!inputEl) return;
    const jokeText = inputEl.value.trim();
    if (jokeText.length < 3) {
        showToast("Tell me a little more than that, chef! 🍳");
        return;
    }
    
    showToast("Chef is taste-testing your joke... 🤔");
    if (promptEl) promptEl.textContent = "Listening carefully...";
    
    const activePersonality = appState.selectedPersonality || 'grandma';
    
    fetch('/api/evaluate-joke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joke: jokeText, personality: activePersonality })
    })
    .then(res => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
    })
    .then(data => {
        displayJokeFeedback(data.is_funny, data.reaction);
    })
    .catch(err => {
        console.log("[FridgeJam] Backend joke evaluate failed, using local evaluator...", err);
        const data = evaluateUserJokeLocally(jokeText, activePersonality);
        displayJokeFeedback(data.is_funny, data.reaction);
    });
}

function evaluateUserJokeLocally(jokeText, personality) {
    const isFoodRelated = /tomato|egg|lettuce|fridge|banana|pear|cheese|pizza|coffee|cookie|bean|bread|potato|carrot|broccoli|kitchen|cook|eat|bake|fry|pot|pan|onion|garlic|soup|chef/i.test(jokeText);
    const isFunny = isFoodRelated && jokeText.length > 8;
    let reaction = "";
    
    if (personality === 'chef') {
        reaction = isFunny 
            ? `*Hon hon hon!* Magnifique! A delicious pun, my friend! I give it three Michelin stars!` 
            : `Mon dieu... that joke is like overcooked soufflé. Flat and tasteless, but I admire your courage!`;
    } else if (personality === 'budget') {
        reaction = isFunny 
            ? `Haha! That joke is rich! I love a pun that doesn't cost a dime!` 
            : `Oof, I've seen cheaper store-brand processed cheese than that joke. Let's keep scanning leftovers, buddy!`;
    } else if (personality === 'chloe') {
        reaction = isFunny 
            ? `BOOM! Clean pun power! That's the exact positive vibe we need! Keep it up!` 
            : `Alright, that punchline ran out of steam! No worries, push hard on the next rep!`;
    } else {
        reaction = isFunny 
            ? `Oh sweetheart, haha! That is absolutely darling! You've warmed this old grandma's heart!` 
            : `Oh bless your sweet heart... that joke was a bit dry, like my last loaf of cornbread. Stick to cooking, honey!`;
    }
    return { is_funny: isFunny, reaction: reaction };
}

function displayJokeFeedback(isFunny, reactionText) {
    const setupEl = document.getElementById('joke-setup');
    const containerEl = document.getElementById('user-joke-container');
    const nextBtn = document.getElementById('joke-next-btn');
    
    if (containerEl) containerEl.classList.add('hidden');
    if (setupEl) setupEl.textContent = reactionText;
    
    if (synth && typeof synth.playSuccessBeep === 'function') {
        if (isFunny) {
            synth.playSuccessBeep();
            setTimeout(() => synth.playSuccessBeep(), 150);
        } else {
            synth.playDialClick();
        }
    }
    
    if (nextBtn) {
        nextBtn.textContent = "Tell more jokes →";
        nextBtn.classList.remove('hidden');
        nextBtn.onclick = () => {
            jokesViewedCount = 0; // reset joke count
            nextJoke(); // load a new standard joke
            nextBtn.onclick = null; // clear override
            nextBtn.textContent = "Next joke →";
        };
    }
}

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

function resetEntertainZone() {
    stopMiniGame();
    entertainChoice = null;
    pendingRecipeData = null;
    jokesViewedCount = 0; // Reset joke interaction count

    const ez         = document.getElementById('entertain-zone');
    const picker     = document.getElementById('ez-picker');
    const jokesPanel = document.getElementById('ez-panel-jokes');
    const gamePanel  = document.getElementById('ez-panel-game');
    const banner     = document.getElementById('ready-banner');
    const reminder   = document.getElementById('ready-reminder');

    if (ez)         ez.style.opacity = '1';
    if (picker)     picker.classList.remove('hidden');
    if (jokesPanel) jokesPanel.classList.add('hidden');
    if (gamePanel)  gamePanel.classList.add('hidden');
    if (banner)     banner.classList.add('hidden');
    if (reminder)   reminder.remove();
}

// ── Ready Banner ──
function showReadyBanner(onSeeRecipe) {
    // Dim the entertainment zone slightly — still usable
    const ez = document.getElementById('entertain-zone');
    if (ez) ez.style.opacity = '0.5';

    const banner = document.getElementById('ready-banner');
    if (!banner) return;

    banner.classList.remove('hidden');

    // "See My Recipe" — navigate immediately
    const seeBtn = document.getElementById('ready-see-btn');
    if (seeBtn) {
        seeBtn.onclick = () => {
            resetEntertainZone();
            onSeeRecipe();
        };
    }

    // "Keep Playing" — dismiss the banner, restore zone brightness, save callback
    const keepBtn = document.getElementById('ready-keep-btn');
    if (keepBtn) {
        keepBtn.onclick = () => {
            banner.classList.add('hidden');
            if (ez) ez.style.opacity = '1';

            // Show a subtle sticky reminder in the zone header
            showReadyReminder(onSeeRecipe);
        };
    }

    synth.playDinnerBell();
}

// Small persistent reminder bar that stays after "Keep Playing"
function showReadyReminder(onSeeRecipe) {
    // Remove any existing reminder
    const existing = document.getElementById('ready-reminder');
    if (existing) existing.remove();

    // Insert the reminder as a SIBLING after entertain-zone, not inside it
    // This avoids overflow:hidden clipping issues inside the zone
    const stove = document.querySelector('.stove-station');
    if (!stove) return;

    const reminder = document.createElement('div');
    reminder.id = 'ready-reminder';
    reminder.className = 'ready-reminder';
    reminder.innerHTML = `
        <span>🍽️ Your dish is ready whenever you are!</span>
        <button class="ready-reminder-btn" id="ready-reminder-btn">View Recipe →</button>
    `;

    // Append at the end of stove-station (after entertain-zone)
    stove.appendChild(reminder);

    const btn = document.getElementById('ready-reminder-btn');
    if (btn) {
        btn.onclick = () => {
            resetEntertainZone();
            onSeeRecipe();
        };
    }
}

function initEntertainmentZoneEvents() {
    const leaderboardForm = document.getElementById('leaderboard-submit-form');
    if (leaderboardForm) {
        leaderboardForm.addEventListener('submit', submitLeaderboardScore);
    }

    const leaderboardRefreshBtn = document.getElementById('leaderboard-refresh-btn');
    if (leaderboardRefreshBtn) {
        leaderboardRefreshBtn.addEventListener('click', loadLeaderboard);
    }
}
