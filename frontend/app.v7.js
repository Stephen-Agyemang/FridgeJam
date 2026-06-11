/* FridgeJam — Premium Frontend Logic & State Machine */

// --- Sound Effects Synthesizer using Web Audio API ---
class KitchenSynth {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Deep retro stove dial click sound
    playDialClick() {
        this.init();
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    }

    // Synthesized gas ignition and sizzle (using white noise)
    playStoveSizzle() {
        this.init();
        const ctx = this.ctx;
        
        // Generate white noise buffer
        const bufferSize = ctx.sampleRate * 2.5; // 2.5 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        // Custom filter to shape the sizzle sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(4500, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 2.0);
        
        // Gain envelope for smooth sizzle fade-in & fade-out
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3); // ignition blast
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.0); // steady simmer
        gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 2.4);  // fade out
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start();
        noise.stop(ctx.currentTime + 2.5);
    }

    // High-end crystal dinner bell chime when food is plated
    playDinnerBell() {
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;
        
        // Dual oscillator chime for rich bell harmonics
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5 note
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.51, now); // E6 harmonic
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(now + 1.6);
        osc2.stop(now + 1.6);
    }

    // Cute slide tone for opening Recipe Box
    playDrawerSlide() {
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now); // E4
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.25); // A4
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(now + 0.36);
    }
}

// Instantiate the kitchen synth
const synth = new KitchenSynth();

// --- State Machine & DOM Elements ---
const DOM = {
    stateInput: document.getElementById('state-input'),
    stateLoading: document.getElementById('state-loading'),
    stateRecipe: document.getElementById('state-recipe'),
    
    ingredientsInput: document.getElementById('ingredients-input'),
    charCount: document.getElementById('char-count'),
    ingredientsPool: document.getElementById('ingredients-pool'),
    btnCook: document.getElementById('btn-cook'),
    
    chefButtons: document.querySelectorAll('.chef-btn'),
    chefBioDisplay: document.getElementById('chef-bio-display'),
    chefBioName: document.getElementById('chef-bio-name'),
    chefBioRole: document.getElementById('chef-bio-role'),
    chefBioDesc: document.getElementById('chef-bio-desc'),
    
    cardOverlay: document.getElementById('card-overlay'),
    cardOverlayBackdrop: document.getElementById('card-overlay-backdrop'),
    
    recipeBackBtn: document.getElementById('recipe-back-btn'),
    recipeHeartBtn: document.getElementById('recipe-heart-btn'),
    recipeShareBtn: document.getElementById('recipe-share-btn'),
    
    loadingChefTitle: document.getElementById('loading-chef-title'),
    loadingProgress: document.getElementById('loading-progress'),
    loadingSubtitle: document.querySelector('.loading-subtitle'),
    cookingLogText: document.getElementById('cooking-log-text'),
    
    dishPhotoImg: document.getElementById('dish-photo-img'),
    dishPhotoFallback: document.getElementById('dish-photo-fallback'),
    fallbackEmoji: document.getElementById('fallback-emoji'),
    recipeChefBadge: document.getElementById('recipe-chef-badge'),
    recipeStatTime: document.getElementById('recipe-stat-time'),
    recipeStatDifficulty: document.getElementById('recipe-stat-difficulty'),
    recipeTitle: document.getElementById('recipe-title'),
    recipeIntro: document.getElementById('recipe-intro'),
    recipeNarrativeText: document.getElementById('recipe-narrative-text'),
    recipeIngredientsList: document.getElementById('recipe-ingredients-list'),
    recipeStepsList: document.getElementById('recipe-steps-list'),
    recipeTipText: document.getElementById('recipe-tip-text'),
    recipeTipHeaderTitle: document.getElementById('recipe-tip-header-title'),
    
    // Nutrition Facts Elements
    recipeNutritionCard: document.getElementById('recipe-nutrition-card'),
    nutrCalories: document.getElementById('nutr-calories'),
    nutrProtein: document.getElementById('nutr-protein'),
    nutrCarbs: document.getElementById('nutr-carbs'),
    nutrFat: document.getElementById('nutr-fat'),
    
    btnRestart: document.getElementById('btn-restart'),
    toast: document.getElementById('app-toast'),
    btnScanPhoto: document.getElementById('btn-scan-photo'),
    fridgePhotoInput: document.getElementById('fridge-photo-input'),
    
    // Recipe Box Elements
    recipeBoxBtn: document.getElementById('recipe-box-btn'),
    recipeBoxCount: document.getElementById('recipe-box-count'),
    recipeBoxDrawer: document.getElementById('recipe-box-drawer'),
    recipeBoxBackdrop: document.getElementById('recipe-box-backdrop'),
    recipeBoxClose: document.getElementById('recipe-box-close'),
    recipeBoxList: document.getElementById('recipe-box-list')
};

// Global App State
let appState = {
    ingredients: [],
    selectedPersonality: 'grandma', // default selected
    currentRecipe: null,
    favorites: [],  // loaded dynamically from localStorage on boot
    mealPlan: {}    // loaded dynamically from localStorage on boot
};

// --- View State Manager (Refined with Modal Overlay Support) ---
function showState(stateName) {
    DOM.stateInput.classList.remove('active');
    DOM.stateLoading.classList.remove('active');
    
    if (stateName === 'input') {
        DOM.stateInput.classList.add('active');
        closeCard();
    } else if (stateName === 'loading') {
        DOM.stateLoading.classList.add('active');
        closeCard();
    } else if (stateName === 'recipe') {
        // Keep the main input screen active in the background for a premium layer overlay look
        DOM.stateInput.classList.add('active');
        // Reset scroll position of both scrollable column panels to the top
        const leftPanel = document.querySelector('.recipe-left-panel');
        const rightPanel = document.querySelector('.recipe-right-panel');
        if (leftPanel) leftPanel.scrollTop = 0;
        if (rightPanel) rightPanel.scrollTop = 0;
        openCard();
    }
}

function openCard() {
    if (DOM.cardOverlay) {
        DOM.cardOverlay.classList.remove('hidden');
        DOM.cardOverlay.focus();
    }
}

function closeCard() {
    if (DOM.cardOverlay) {
        DOM.cardOverlay.classList.add('hidden');
    }
}

// --- Natural Language Ingredient Cleaning Helper ---
function cleanIngredientText(text) {
    let cleaned = text.trim();
    // Remove ending punctuation like period, comma, semicolon
    cleaned = cleaned.replace(/[.,;!]$/, '').trim();
    
    // Remove common starting filler phrases (case-insensitive)
    const fillerRegex = /^(i\s+have\s+|i've\s+got\s+|we\s+have\s+|we've\s+got\s+|some\s+|a\s+|an\s+|the\s+|and\s+)+/i;
    cleaned = cleaned.replace(fillerRegex, '').trim();
    
    // Capitalize first letter
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return cleaned;
}

// --- Dynamic Emoji Picker ---
function getEmojiForIngredient(ing) {
    const ingredientEmojis = {
        egg: "🥚", milk: "🥛", cheese: "🧀", butter: "🧈", yogurt: "🥛", cream: "🥛",
        bacon: "🥓", onion: "🧅", garlic: "🧄", spinach: "🥬", potato: "🥔", 
        carrot: "🥕", celery: "🥬", mushroom: "🍄", pepper: "🫑", tomato: "🍅",
        chicken: "🍗", beef: "🥩", pork: "🥩", steak: "🥩", fish: "🐟", shrimp: "🍤",
        rice: "🍚", pasta: "🍝", bread: "🍞", flour: "🌾", sugar: "🍬", salt: "🧂",
        oil: "🍾", vinegar: "🍾", lemon: "🍋", lime: "🍋", orange: "🍊", apple: "🍎",
        banana: "🍌", berry: "🍓", strawberry: "🍓", cilantro: "🌿", basil: "🌿", parsley: "🌿"
    };
    
    let emoji = "🥗"; // default cute salad/food bowl
    const lowerIng = ing.toLowerCase();
    for (const [key, value] of Object.entries(ingredientEmojis)) {
        if (lowerIng.includes(key)) {
            emoji = value;
            break;
        }
    }
    return emoji;
}

// --- Natural-Language Textarea Parser & Index-Based Jar Slips Diffing ---
function updateInputTextareaAndSync() {
    const rawVal = DOM.ingredientsInput.value;
    const len = rawVal.length;
    
    // 1. Update character count text and class
    if (DOM.charCount) {
        DOM.charCount.textContent = `${len} / 1000`;
        DOM.charCount.classList.toggle('warning', len >= 800 && len < 950);
        DOM.charCount.classList.toggle('danger', len >= 950);
    }
    
    // 2. Enable/disable cook button (disabled below 5 characters)
    if (DOM.btnCook) {
        DOM.btnCook.disabled = len < 5;
    }
    
    // 3. Parse ingredients from text
    // Split by commas, semicolons, newlines, or "and" word
    let splitIngs = [];
    if (rawVal.trim().length > 0) {
        splitIngs = rawVal.split(/\s*,\s*|\s*;\s*|\s*\n\s*|\s+\band\b\s+/i)
                          .map(cleanIngredientText)
                          .filter(i => i.length >= 2);
    }
    
    // De-duplicate
    const uniqueIngs = [];
    splitIngs.forEach(ing => {
        if (!uniqueIngs.some(u => u.toLowerCase() === ing.toLowerCase())) {
            uniqueIngs.push(ing);
        }
    });
    
    appState.ingredients = uniqueIngs;
    
    // 4. Render pill tags pool
    renderIngredientsTags();
    
    // 5. Diff jar slips (in-place label updates to avoid physics drop triggers on every keystroke)
    const jarContents = document.getElementById('leftovers-jar-contents');
    const jarEmpty = document.getElementById('leftovers-jar-empty');
    
    if (appState.ingredients.length === 0) {
        if (jarEmpty) jarEmpty.classList.remove('hidden');
        if (jarContents) jarContents.innerHTML = '';
        return;
    }
    
    if (jarEmpty) jarEmpty.classList.add('hidden');
    
    if (jarContents) {
        const existingSlips = jarContents.querySelectorAll('.jar-slip');
        
        // Match existing slips by index
        appState.ingredients.forEach((ing, i) => {
            const emoji = getEmojiForIngredient(ing);
            
            if (existingSlips[i]) {
                const labelSpan = existingSlips[i].querySelector('.slip-label');
                const emojiSpan = existingSlips[i].querySelector('.slip-emoji');
                if (labelSpan && labelSpan.textContent !== ing) {
                    labelSpan.textContent = ing;
                }
                if (emojiSpan && emojiSpan.textContent !== emoji) {
                    emojiSpan.textContent = emoji;
                }
            } else {
                const colors = [
                    { accent: '#E8927A', bg: '#FFF0ED' }, // peach
                    { accent: '#F2BFA0', bg: '#FFF5F0' }, // apricot
                    { accent: '#C7BDE8', bg: '#F2EFFB' }, // lavender
                    { accent: '#B0D4B8', bg: '#EEF6F0' }, // sage
                    { accent: '#E4A4B4', bg: '#FFF0F3' }  // rose
                ];
                let hash = 0;
                for (let c = 0; c < ing.length; c++) {
                    hash += ing.charCodeAt(c);
                }
                const color = colors[hash % colors.length];
                
                const rotation = (Math.random() - 0.5) * 12; // tilt
                const offset = (Math.random() - 0.5) * 14;   // shift
                
                const slip = document.createElement('div');
                slip.className = 'jar-slip';
                slip.style.setProperty('--slip-accent', color.accent);
                slip.style.setProperty('--slip-bg', color.bg);
                slip.style.setProperty('--slip-rotation', rotation + 'deg');
                slip.style.transform = `rotate(${rotation}deg) translateX(${offset}px)`;
                
                slip.innerHTML = `
                    <span class="slip-emoji">${emoji}</span>
                    <span class="slip-label">${escapeHtml(ing)}</span>
                `;
                jarContents.appendChild(slip);
            }
        });
        
        // Remove extra slips if any
        for (let j = appState.ingredients.length; j < existingSlips.length; j++) {
            existingSlips[j].remove();
        }
    }
}

// --- Pill Tags Render ---
function renderIngredientsTags() {
    DOM.ingredientsPool.innerHTML = '';
    const jarEmpty = document.getElementById('leftovers-jar-empty');
    
    if (appState.ingredients.length === 0) {
        DOM.ingredientsPool.innerHTML = '<span class="placeholder-tag">Your cooking counter is empty...</span>';
        if (jarEmpty) jarEmpty.classList.remove('hidden');
        return;
    }
    
    if (jarEmpty) jarEmpty.classList.add('hidden');
    
    appState.ingredients.forEach((ing, index) => {
        const tag = document.createElement('span');
        tag.className = 'ingredient-tag';
        tag.innerHTML = `
            ${escapeHtml(ing)}
            <button class="btn-tag-remove" type="button" aria-label="Remove ${escapeHtml(ing)}">&times;</button>
        `;
        
        // Remove tag and update textarea
        tag.querySelector('.btn-tag-remove').addEventListener('click', () => {
            removeIngredient(index);
        });
        
        DOM.ingredientsPool.appendChild(tag);
    });
}

function removeIngredient(index) {
    appState.ingredients.splice(index, 1);
    DOM.ingredientsInput.value = appState.ingredients.join(', ');
    updateInputTextareaAndSync();
}

// --- Chef Picker Selection Handler (Cozy Bio Display Box) ---
const chefBios = {
    budget: {
        name: "Thrifty Chef Tony",
        role: "Strict Budget Planner",
        desc: "\"Waste not, want not! I'll help you stretch every single scrap into a filling, cost-effective meal. Let's get thrifty.\""
    },
    grandma: {
        name: "Grandma Marie",
        role: "Supportive Grandma",
        desc: "\"Hello sweetheart! Let's make something absolutely delicious and warm. Cooked with love.\""
    },
    chef: {
        name: "Chef Pierre",
        role: "High-End Gourmet",
        desc: "\"Welcome, mon ami. We shall orchestrate a symphony of refined textures and balanced aromas from your humble ingredients.\""
    },
    chloe: {
        name: "Healthy Chef Chloe",
        role: "Veggie & Nutrition Coach",
        desc: "\"Let's fuel that body! I'll help you turn these ingredients into a clean, nutritious, high-protein, or keto-friendly meal. You've got this!\""
    }
};

function selectChef(personality) {
    appState.selectedPersonality = personality;
    
    // Play cozy dial audio
    synth.playDialClick();

    // Toggle button selected classes
    DOM.chefButtons.forEach(btn => {
        const matches = btn.getAttribute('data-personality') === personality;
        btn.classList.toggle('selected', matches);
        btn.setAttribute('aria-checked', matches ? 'true' : 'false');
    });

    // Update Chef Bio text
    const bio = chefBios[personality] || chefBios.grandma;
    if (DOM.chefBioName) DOM.chefBioName.textContent = bio.name;
    if (DOM.chefBioRole) DOM.chefBioRole.textContent = bio.role;
    if (DOM.chefBioDesc) DOM.chefBioDesc.textContent = bio.desc;

    // Trigger elegant fade-in micro-animation
    if (DOM.chefBioDisplay) {
        DOM.chefBioDisplay.classList.remove('fade-in');
        void DOM.chefBioDisplay.offsetWidth; // Force layout recalculation
        DOM.chefBioDisplay.classList.add('fade-in');
    }
}

// --- Dynamic Cooking Logs ---
let logInterval = null;
const cookingLogs = {
    budget: [
        { text: "Frugal apron tied! Prepping counter scraps...", pct: 15 },
        { text: "Firing up the discount gas stovetop...", pct: 30 },
        { text: "Tossing odd bits into the budget skillet...", pct: 50 },
        { text: "Squeezing maximum value out of those ingredients...", pct: 70 },
        { text: "Plating up an absolute budget masterpiece...", pct: 90 }
    ],
    grandma: [
        { text: "Grandma is tying her apron and preheating with love...", pct: 15 },
        { text: "Getting out the heavy seasoned cast-iron skillet...", pct: 30 },
        { text: "Whisking ingredients gently while telling a happy story...", pct: 50 },
        { text: "Simmering slowly so all the flavors get happy together...", pct: 70 },
        { text: "Pouring comfort into a warm stoneware dish...", pct: 90 }
    ],
    chef: [
        { text: "Chef Pierre is calibrating the induction burners...", pct: 15 },
        { text: "Meticulously chopping and preparing French mise en place...", pct: 30 },
        { text: "Sautéing with exact thermal control and balance...", pct: 50 },
        { text: "Reducing culinary liquids to concentrate aroma...", pct: 70 },
        { text: "Garnishing micro-herbs for exquisite vertical presentation...", pct: 90 }
    ],
    chloe: [
        { text: "Chloe is tying her lightweight running apron and prepping...", pct: 15 },
        { text: "Warming up the non-stick skillet for clean power...", pct: 30 },
        { text: "Sautéing ingredients with heart-healthy cold-pressed oil...", pct: 50 },
        { text: "Adding nutritious, high-protein plant energy...", pct: 70 },
        { text: "Plating clean nutrients to crush your fitness goals...", pct: 90 }
    ]
};

function setLoadingProgress(pct) {
    if (DOM.loadingProgress) {
        DOM.loadingProgress.style.width = `${pct}%`;
    }
    if (DOM.loadingSubtitle) {
        if (pct < 50) {
            DOM.loadingSubtitle.textContent = "taste-testing in our heads";
        } else {
            DOM.loadingSubtitle.textContent = "plating it up just so";
        }
    }
}

function startCookingAnimation(chefName) {
    let stepIndex = 0;
    const steps = cookingLogs[chefName] || cookingLogs.grandma;
    
    // Set initial loading state
    const chefTitles = {
        budget: "Thrifty Chef Tony is counting the scraps...",
        grandma: "Grandma Marie is tying her apron...",
        chef: "Chef Pierre is organizing his culinary station...",
        chloe: "Healthy Chef Chloe is lacing up her apron..."
    };
    if (DOM.loadingChefTitle) {
        DOM.loadingChefTitle.textContent = chefTitles[chefName] || chefTitles.grandma;
    }
    
    setLoadingProgress(10);
    
    if (DOM.cookingLogText) {
        DOM.cookingLogText.textContent = steps[0].text;
    }
    
    logInterval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
            if (DOM.cookingLogText) {
                DOM.cookingLogText.textContent = steps[stepIndex].text;
            }
            setLoadingProgress(steps[stepIndex].pct);
        }
    }, 1800);
}

function stopCookingAnimation() {
    if (logInterval) {
        clearInterval(logInterval);
        logInterval = null;
    }
}

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
let entertainChoice = null; // 'jokes' | 'game' | null
let pendingRecipeData = null; // store finished recipe until user clicks "See My Recipe"
let jokesViewedCount = 0;
let gameStartTime = 0;
let gameSpawnTimeout = null;

const GAME_ITEMS = ['🍅','🥕','🧅','🥦','🍋','🥚','🧄','🌽','🍄','🥑','🍇','🥝','🍓','🫑','🥒'];

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
    gameScore = 0; gameStreak = 0;
    gameStartTime = Date.now();
    updateGameUI();
    arena.innerHTML = '';
    
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

    el.addEventListener('click', () => {
        el.classList.add('caught');
        gameScore += 10 + gameStreak * 2;
        gameStreak++;
        updateGameUI();
        setTimeout(() => el.remove(), 300);
    });

    el.addEventListener('animationend', () => {
        if (!el.classList.contains('caught')) {
            gameStreak = 0;
            updateGameUI();
            el.remove();
        }
    });

    arena.appendChild(el);
}

function updateGameUI() {
    const scoreEl  = document.getElementById('game-score');
    const streakEl = document.getElementById('game-streak');
    const diffEl   = document.getElementById('game-difficulty');
    
    if (scoreEl)  scoreEl.textContent = gameScore;
    if (streakEl) streakEl.textContent = gameStreak;
    
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


// --- Toast Manager ---
let toastTimeout = null;
function showToast(message, persist = false) {
    const toastMsg = document.getElementById('toast-text-msg');
    if (toastMsg) {
        toastMsg.textContent = message;
    } else {
        DOM.toast.textContent = message;
    }
    DOM.toast.classList.remove('hidden');
    
    if (toastTimeout) clearTimeout(toastTimeout);
    
    if (!persist) {
        toastTimeout = setTimeout(() => {
            DOM.toast.classList.add('hidden');
        }, 3000);
    }
}

// --- API Cooking Trigger ---
async function startCooking() {
    if (appState.ingredients.length === 0) {
        showToast("Add some ingredients first before lighting the stove!");
        return;
    }
    
    // 1. Synthesize burner click sound
    synth.playDialClick();

    // 2. Trigger physical leftovers jar shake animation & slip scatter!
    const jarContainer = document.getElementById('leftovers-jar-container');
    const jarContents = document.getElementById('leftovers-jar-contents');
    if (jarContainer) {
        jarContainer.classList.add('shaking');
        if (jarContents) {
            const slips = jarContents.querySelectorAll('.jar-slip');
            slips.forEach(s => {
                const rx = (Math.random() - 0.5) * 20;
                const ry = (Math.random() - 0.5) * 15;
                s.style.transition = 'transform 0.3s ease-out';
                s.style.transform = `translate(${rx}px, ${ry}px) rotate(${(Math.random() - 0.5) * 16}deg)`;
            });
        }
        jarContainer.addEventListener('animationend', () => {
            jarContainer.classList.remove('shaking');
        }, { once: true });
    }

    // 3. Wait 600ms for tactile jar shake before transitioning
    await new Promise(resolve => setTimeout(resolve, 600));

    synth.playStoveSizzle();

    // Reset entertainment zone for fresh session
    resetEntertainZone();

    // Swap states to Loading
    showState('loading');
    startCookingAnimation(appState.selectedPersonality);
    
    const ingredientsPayload = appState.ingredients.join(', ');
    
    try {
        // Step 1: Generate Recipe JSON from Gemini
        // Retry once on 5xx / network failure to survive Cloud Run cold-start timeouts.
        const recipePayload = JSON.stringify({
            ingredients: ingredientsPayload,
            personality: appState.selectedPersonality
        });
        let recipeResponse = null;
        for (let attempt = 0; attempt <= 1; attempt++) {
            try {
                recipeResponse = await fetch('/api/recipe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: recipePayload
                });
                if (recipeResponse.ok || recipeResponse.status < 500) break;
            } catch (_networkErr) {
                if (attempt === 1) throw new Error("The kitchen connection dropped! Check your internet and try again.");
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        if (!recipeResponse || !recipeResponse.ok) {
            const errData = recipeResponse ? await recipeResponse.json().catch(() => ({})) : {};
            throw new Error(errData.detail || "Stove failure during recipe creation.");
        }
        
        const recipeData = await recipeResponse.json();
        
        // Safety Check: Inedible or non-food ingredients rejection
        if (recipeData.is_food === false) {
            stopCookingAnimation();
            resetEntertainZone();
            showState('input');
            showToast(recipeData.error_message || "The chef says those items aren't edible! Let's stick to real food.", true);
            return;
        }
        
        appState.currentRecipe = recipeData;
        
        // Update progress bar
        setLoadingProgress(85);
        if (DOM.cookingLogText) {
            DOM.cookingLogText.textContent = "Plating dish and snapping a photo...";
        }
        
        // Step 2: Generate Imagen photo
        let imageData = { success: false, image_url: null };
        const promptText = recipeData.image_prompt || recipeData.imagePrompt || recipeData.image_description || recipeData.title || "A professional food photograph of delicious culinary dish";
        try {
            const imageResponse = await fetch('/api/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText })
            });
            if (imageResponse.ok) {
                imageData = await imageResponse.json();
            }
        } catch (imageErr) {
            console.warn("Image generation failed:", imageErr);
        }
        
        // Pre-render the recipe silently (doesn't navigate yet)
        renderRecipeScreen(recipeData, imageData);
        stopCookingAnimation();
        setLoadingProgress(100);

        // Show the ready banner — user clicks to navigate
        showReadyBanner(() => {
            showState('recipe');
        });
        
    } catch (err) {
        console.error("Cooking failed:", err);
        stopCookingAnimation();
        resetEntertainZone();
        showState('input');
        showToast(err.message || "The skillet overflowed! Please try again.");
    }
}

// --- Render Recipe Details ---
function renderRecipeScreen(recipe, imageResult) {
    // 0. Reset Polaroid image and fallback presentation states
    DOM.dishPhotoImg.src = '';
    DOM.dishPhotoImg.classList.add('hidden');
    if (DOM.dishPhotoFallback) DOM.dishPhotoFallback.style.display = 'flex'; // explicit flex, not empty string

    // 1. Chef Badge & Emoji Fallback mapping
    const chefBadges = {
        budget: { emoji: "🍳", text: "Plated by Thrifty Chef Tony" },
        grandma: { emoji: "👵", text: "Plated by Grandma Marie" },
        chef: { emoji: "👨‍🍳", text: "Plated by Chef Pierre" },
        chloe: { emoji: "🥗", text: "Plated by Healthy Chef Chloe" }
    };
    
    const badgeInfo = chefBadges[recipe.selected_personality] || chefBadges.grandma;
    DOM.recipeChefBadge.innerHTML = `<span class="badge-emoji">${badgeInfo.emoji}</span> ${badgeInfo.text}`;
    
    // Set fallback dish icon based on title keywords
    const foodEmojis = ["🍲", "🍳", "🥗", "🥘", "🍕", "🍝", "🥙", "🥪", "🍰"];
    let selectedFallbackEmoji = "🍲";
    const titleLower = recipe.title.toLowerCase();
    
    if (titleLower.includes("egg") || titleLower.includes("scramble") || titleLower.includes("frittata") || titleLower.includes("omelet")) {
        selectedFallbackEmoji = "🍳";
    } else if (titleLower.includes("salad") || titleLower.includes("spinach") || titleLower.includes("greens")) {
        selectedFallbackEmoji = "🥗";
    } else if (titleLower.includes("fry") || titleLower.includes("curry") || titleLower.includes("skillet") || titleLower.includes("sauté")) {
        selectedFallbackEmoji = "🥘";
    } else if (titleLower.includes("pasta") || titleLower.includes("noodle") || titleLower.includes("spaghetti")) {
        selectedFallbackEmoji = "🍝";
    } else if (titleLower.includes("sandwich") || titleLower.includes("toast") || titleLower.includes("wrap")) {
        selectedFallbackEmoji = "🥪";
    } else {
        // Random pick
        selectedFallbackEmoji = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
    }
    DOM.fallbackEmoji.textContent = selectedFallbackEmoji;

    // 2. Set Dish Photo or Fallback
    if (imageResult && imageResult.success && imageResult.image_url) {
        console.log('[FridgeJam] Setting dish photo src, data length:', imageResult.image_url.length);
        DOM.dishPhotoImg.src = imageResult.image_url;
        DOM.dishPhotoImg.alt = recipe.title;
        DOM.dishPhotoImg.onload = () => console.log('[FridgeJam] Dish photo loaded successfully!');
        DOM.dishPhotoImg.onerror = () => {
            console.error('[FridgeJam] Dish photo FAILED to load — showing fallback');
            DOM.dishPhotoImg.classList.add('hidden');
            if (DOM.dishPhotoFallback) DOM.dishPhotoFallback.style.display = 'flex';
        };
        DOM.dishPhotoImg.classList.remove('hidden');
        if (DOM.dishPhotoFallback) DOM.dishPhotoFallback.style.display = 'none';
    } else {
        // Fallback to a gorgeous, themed public culinary photograph matching the dish title keywords
        const foodPhotos = [
            {
                category: "egg",
                keys: ["egg", "scramble", "frittata", "omelet", "breakfast", "benedict", "shakshuka", "quiche", "yolk", "whites", "sunny-side"],
                url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "salad",
                keys: ["salad", "spinach", "green", "cucumber", "veggie", "vegetable", "lettuce", "kale", "slaw", "caesar", "avocado"],
                url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "pasta",
                keys: ["pasta", "noodle", "spaghetti", "macaroni", "penne", "fettuccine", "lasagna", "ravioli", "carbonara", "bolognese", "pesto"],
                url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "soup",
                keys: ["soup", "stew", "broth", "chowder", "ramen", "pho", "minestrone", "bisque", "gumbo"],
                url: "https://images.unsplash.com/photo-1547592165-e1d17f57655c?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "sandwich",
                keys: ["sandwich", "toast", "wrap", "panini", "sourdough", "croissant", "bagel", "bruschetta"],
                url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "pancake",
                keys: ["pancake", "waffle", "oat", "oatmeal", "porridge", "french toast", "crepe"],
                url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "dessert",
                keys: ["cake", "cookie", "sweet", "chocolate", "dessert", "pastry", "pie", "brownie", "muffin", "tart", "ice cream"],
                url: "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "chicken",
                keys: ["chicken", "turkey", "poultry", "wing", "breast", "drumstick", "nugget"],
                url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "beef",
                keys: ["beef", "steak", "meat", "pork", "rib", "lamb", "chop", "ham", "bacon", "sausage", "meatball"],
                url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "fish",
                keys: ["fish", "salmon", "shrimp", "seafood", "prawn", "crab", "lobster", "tuna", "cod", "trout", "scallop"],
                url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "rice",
                keys: ["rice", "grain", "quinoa", "fried rice", "risotto", "paella", "pilaf"],
                url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "potato",
                keys: ["potato", "fry", "wedges", "hash brown", "tater", "sweet potato", "gnocchi"],
                url: "https://images.unsplash.com/photo-1518013006361-71899c437b3b?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "pizza",
                keys: ["pizza", "flatbread", "mozzarella", "cheese", "calzone"],
                url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "taco",
                keys: ["taco", "nacho", "fajita", "mexican", "burrito", "salsa", "guacamole"],
                url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "burger",
                keys: ["burger", "hamburger", "cheeseburger", "slider"],
                url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "smoothie",
                keys: ["smoothie", "yogurt", "fruit", "berry", "banana", "apple", "mango", "peach", "citrus", "orange", "lemon"],
                url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "curry",
                keys: ["curry", "masala", "paneer", "chana", "lentil", "dhal", "dal", "turmeric", "naan", "spiced"],
                url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80"
            }
        ];

        // Intelligent Scoring Matcher
        let bestCategory = null;
        let highestScore = -1;

        const promptLower = (recipe.image_prompt || recipe.imagePrompt || "").toLowerCase();
        const ingredientsText = (recipe.ingredients || []).map(i => (i.name || "").toLowerCase()).join(" ");

        for (const photo of foodPhotos) {
            let score = 0;
            
            // Check matches in title (high weight)
            for (const key of photo.keys) {
                if (titleLower.includes(key)) {
                    score += 10;
                }
            }

            // Check matches in ingredients (medium weight)
            for (const key of photo.keys) {
                if (ingredientsText.includes(key)) {
                    score += 5;
                }
            }

            // Check matches in image prompt (low weight)
            for (const key of photo.keys) {
                if (promptLower.includes(key)) {
                    score += 2;
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestCategory = photo;
            }
        }

        // Default to a gorgeous general culinary spread if no matches found
        let selectedUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
        if (bestCategory && highestScore > 0) {
            selectedUrl = bestCategory.url;
        }

        DOM.dishPhotoImg.src = selectedUrl;
        DOM.dishPhotoImg.alt = recipe.title;
        DOM.dishPhotoImg.classList.remove('hidden');
        if (DOM.dishPhotoFallback) DOM.dishPhotoFallback.style.display = 'none';
    }

    // 3. Stats & Header
    if (DOM.recipeStatTime) DOM.recipeStatTime.textContent = recipe.cooking_time || "20 mins";
    if (DOM.recipeStatDifficulty) DOM.recipeStatDifficulty.textContent = recipe.difficulty || "Easy";
    if (DOM.recipeTitle) DOM.recipeTitle.textContent = recipe.title;
    if (DOM.recipeIntro) DOM.recipeIntro.textContent = `A custom creation in the voice of ${badgeInfo.text.replace("Plated by ", "")}`;
    if (DOM.recipeNarrativeText) DOM.recipeNarrativeText.textContent = recipe.personality_intro;

    // 3b. Nutrition Facts Card (with smart unit parsing and safe backwards-compatible fallback)
    if (DOM.recipeNutritionCard) {
        if (recipe.nutrition) {
            let calVal = recipe.nutrition.calories;
            if (calVal) {
                const calStr = String(calVal).trim();
                if (!calStr.toLowerCase().includes('kcal')) {
                    calVal = `${calStr} kcal`;
                } else {
                    calVal = calStr;
                }
            } else {
                calVal = "-";
            }
            if (DOM.nutrCalories) DOM.nutrCalories.innerHTML = `🔥 <strong>${calVal}</strong>`;
            if (DOM.nutrProtein) DOM.nutrProtein.innerHTML = `🥩 <strong>${recipe.nutrition.protein || "-"}</strong> Prot`;
            if (DOM.nutrCarbs) DOM.nutrCarbs.innerHTML = `🍞 <strong>${recipe.nutrition.carbs || "-"}</strong> Carbs`;
            if (DOM.nutrFat) DOM.nutrFat.innerHTML = `🧈 <strong>${recipe.nutrition.fat || "-"}</strong> Fat`;
            DOM.recipeNutritionCard.style.display = 'flex';
        } else {
            DOM.recipeNutritionCard.style.display = 'none';
        }
    }

    // Set Heart Icon depending on favorites status
    if (DOM.recipeHeartBtn) {
        const heartIcon = DOM.recipeHeartBtn.querySelector('.heart-icon');
        if (heartIcon) {
            const isFavorited = appState.favorites.some(fav => fav.title === recipe.title);
            heartIcon.textContent = isFavorited ? '❤️' : '🤍';
        }
    }

    // 4. Ingredients Rows Pills
    if (DOM.recipeIngredientsList) {
        DOM.recipeIngredientsList.innerHTML = '';
        recipe.ingredients.forEach(ing => {
            const div = document.createElement('div');
            div.className = `ingredient-row-pill ${ing.is_user_ingredient ? 'have-style' : 'need-style'}`;
            
            const svg = ing.is_user_ingredient 
                ? `<svg class="status-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#B5D3B8" stroke="#25283D" stroke-width="2"/>
                    <path d="M8 12L11 15L16 9" stroke="#25283D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                   </svg>`
                : `<svg class="status-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="#25283D" stroke-width="2" stroke-dasharray="3 3"/>
                    <path d="M12 8V16M8 12H16" stroke="#25283D" stroke-width="2" stroke-linecap="round"/>
                   </svg>`;
                   
            const amountName = ing.amount ? `${escapeHtml(ing.amount)} ${escapeHtml(ing.name)}` : escapeHtml(ing.name);
            const badgeClass = ing.is_user_ingredient ? 'badge-have' : 'badge-need';
            const badgeText = ing.is_user_ingredient ? 'have' : 'need';
            
            div.innerHTML = `
                <div class="row-left">
                    ${svg}
                    <span>${amountName}</span>
                </div>
                <span class="row-badge ${badgeClass}">${badgeText}</span>
            `;
            DOM.recipeIngredientsList.appendChild(div);
        });
    }

    // 5. Preparation Steps
    if (DOM.recipeStepsList) {
        DOM.recipeStepsList.innerHTML = '';
        recipe.steps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            DOM.recipeStepsList.appendChild(li);
        });
    }

    // 6. Chef's Secret Tip
    if (DOM.recipeTipText) {
        DOM.recipeTipText.textContent = recipe.chef_tip;
    }
    if (DOM.recipeTipHeaderTitle) {
        const chefTipTitles = {
            budget: "Tony's Frugal Tip",
            grandma: "Grandma's Secret Tip",
            chef: "Pierre's Master Tip",
            chloe: "Chloe's Fitness Tip"
        };
        DOM.recipeTipHeaderTitle.textContent = chefTipTitles[recipe.selected_personality] || "Chef's Secret Tip";
    }
}

// --- Share Integration ---
function downloadRecipeAsPDF() {
    if (!appState.currentRecipe) return;
    const r = appState.currentRecipe;
    
    // Explicit permission check
    const confirmDownload = confirm(`Chef, would you like to save "${r.title}" as a beautiful, print-ready PDF cookbook card?`);
    if (!confirmDownload) {
        showToast("PDF download canceled.");
        return;
    }
    
    showToast("Preparing your print-ready PDF cookbook card... 🍳");
    if (synth && typeof synth.playDialClick === 'function') {
        synth.playDialClick();
    }

    // 1. Grab all PDF template elements
    const pdfTemplate = document.getElementById('recipe-pdf-template');
    const pdfTitle = document.getElementById('pdf-recipe-title');
    const pdfByline = document.getElementById('pdf-recipe-byline');
    const pdfPhoto = document.getElementById('pdf-dish-photo');
    const pdfNarrative = document.getElementById('pdf-narrative-text');
    const pdfTipHeader = document.getElementById('pdf-tip-header-title');
    const pdfTipText = document.getElementById('pdf-tip-text');
    const pdfTime = document.getElementById('pdf-stat-time');
    const pdfDifficulty = document.getElementById('pdf-stat-difficulty');
    const pdfIngredients = document.getElementById('pdf-ingredients-list');
    const pdfSteps = document.getElementById('pdf-steps-list');
    const pdfCal = document.getElementById('pdf-nutr-calories');
    const pdfProt = document.getElementById('pdf-nutr-protein');
    const pdfCarb = document.getElementById('pdf-nutr-carbs');
    const pdfFat = document.getElementById('pdf-nutr-fat');
    const pdfNutrBox = document.getElementById('pdf-nutrition-row-box');

    if (!pdfTemplate) {
        console.error("PDF printable template element not found!");
        showToast("PDF failed. Copying recipe text to clipboard instead!");
        copyRecipeToClipboard();
        return;
    }

    // 2. Populate the template with current recipe data
    if (pdfTitle) pdfTitle.textContent = r.title;
    
    const chefBadges = {
        budget: { emoji: "🥄", text: "Plated by Thrifty Chef Tony" },
        grandma: { emoji: "👵", text: "Plated by Grandma Marie" },
        chef: { emoji: "🍽️", text: "Plated by Chef Pierre" },
        chloe: { emoji: "🥗", text: "Plated by Healthy Chef Chloe" }
    };
    const badgeInfo = chefBadges[r.selected_personality] || chefBadges.grandma;
    if (pdfByline) pdfByline.innerHTML = `<span class="badge-emoji">${badgeInfo.emoji}</span> ${badgeInfo.text}`;
    
    // Set accurate image
    if (pdfPhoto) {
        let currentImgSrc = DOM.dishPhotoImg ? DOM.dishPhotoImg.getAttribute('src') : null;
        if (!currentImgSrc || (!currentImgSrc.startsWith('http') && !currentImgSrc.startsWith('data:image'))) {
            currentImgSrc = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
        }
        // Cache bust remote Unsplash image URLs to prevent tainted canvas CORS errors
        if (currentImgSrc.startsWith('http') && !currentImgSrc.includes('data:image')) {
            const cleanUrl = currentImgSrc.split('&cb=')[0].split('?cb=')[0];
            const cleanSeparator = cleanUrl.includes('?') ? '&' : '?';
            currentImgSrc = `${cleanUrl}${cleanSeparator}cb=${new Date().getTime()}`;
        }
        pdfPhoto.src = currentImgSrc;
    }

    if (pdfNarrative) {
        const intro = r.personality_intro || '';
        pdfNarrative.textContent = intro.length > 220 ? intro.substring(0, 217) + '...' : intro;
    }

    const chefTipTitles = {
        budget: "Tony's Frugal Tip",
        grandma: "Grandma's Secret Tip",
        chef: "Pierre's Master Tip",
        chloe: "Chloe's Fitness Tip"
    };
    if (pdfTipHeader) pdfTipHeader.textContent = `💡 ${chefTipTitles[r.selected_personality] || "Chef's Secret Tip"}`;
    if (pdfTipText) {
        const tip = r.chef_tip || '';
        pdfTipText.textContent = tip.length > 180 ? tip.substring(0, 177) + '...' : tip;
    }
    
    if (pdfTime) pdfTime.textContent = `⏱️ ${r.cooking_time || "20 mins"}`;
    if (pdfDifficulty) pdfDifficulty.textContent = `⭐️ ${r.difficulty || "Easy"}`;

    // Populate Ingredients
    if (pdfIngredients) {
        pdfIngredients.innerHTML = '';
        r.ingredients.forEach(ing => {
            const li = document.createElement('li');
            const origin = ing.is_user_ingredient ? "(in fridge)" : "(needed)";
            li.textContent = ing.amount ? `${ing.amount} ${ing.name} ${origin}` : `${ing.name} ${origin}`;
            pdfIngredients.appendChild(li);
        });
    }

    // Populate Steps
    if (pdfSteps) {
        pdfSteps.innerHTML = '';
        r.steps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            pdfSteps.appendChild(li);
        });
    }

    // Populate Nutrition (with safe fallback)
    if (r.nutrition) {
        let calVal = r.nutrition.calories;
        if (calVal) {
            const calStr = String(calVal).trim();
            calVal = calStr.toLowerCase().includes('kcal') ? calStr : `${calStr} kcal`;
        } else {
            calVal = "-";
        }
        if (pdfCal) pdfCal.innerHTML = `🔥 <strong>${calVal}</strong>`;
        if (pdfProt) pdfProt.innerHTML = `🥩 <strong>${r.nutrition.protein || "-"}</strong> Prot`;
        if (pdfCarb) pdfCarb.innerHTML = `🍞 <strong>${r.nutrition.carbs || "-"}</strong> Carbs`;
        if (pdfFat) pdfFat.innerHTML = `🧈 <strong>${r.nutrition.fat || "-"}</strong> Fat`;
        if (pdfNutrBox) pdfNutrBox.style.display = 'flex';
    } else {
        if (pdfNutrBox) pdfNutrBox.style.display = 'none';
    }

    // 3a. Auto-shrink list font size if the right column overflows the available card height
    const pdfCardBody = pdfTemplate.querySelector('.pdf-card-body');
    const pdfRightColumn = pdfTemplate.querySelector('.pdf-right-column');
    const pdfLists = pdfTemplate.querySelectorAll('.pdf-ingredients-list, .pdf-steps-list');
    if (pdfCardBody && pdfRightColumn && pdfLists.length) {
        let fontSizeRem = 0.65;
        const minFontRem = 0.44;
        // Compare right column's natural scroll height against card body's available height.
        // Using pdfRightColumn.scrollHeight (not cardBody) so left column height doesn't cause
        // the loop to shrink right column fonts unnecessarily.
        while (pdfRightColumn.scrollHeight > pdfCardBody.clientHeight + 2 && fontSizeRem > minFontRem) {
            fontSizeRem = Math.round((fontSizeRem - 0.02) * 100) / 100;
            pdfLists.forEach(l => {
                l.style.fontSize = `${fontSizeRem}rem`;
                l.style.lineHeight = fontSizeRem < 0.56 ? '1.1' : '1.2';
            });
        }
    }

    // 3. Configuration options with strict scroll reset coordinates for html2canvas
    const opt = {
        margin:       [0.15, 0.15, 0.15, 0.15],
        filename:     `${r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            backgroundColor: '#FAF7F0',
            scrollY: 0,
            scrollX: 0
        },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    
    // 4. Helper to trigger generation
    const executePDFGeneration = () => {
        const resetListStyles = () => {
            pdfTemplate.querySelectorAll('.pdf-ingredients-list, .pdf-steps-list').forEach(l => {
                l.style.fontSize = '';
                l.style.lineHeight = '';
            });
        };
        html2pdf().set(opt).from(pdfTemplate).save()
            .then(() => {
                resetListStyles();
                showToast("Recipe card saved successfully! 🍳✨");
            })
            .catch(err => {
                resetListStyles();
                console.error("PDF generation failed:", err);
                showToast("PDF failed. Copying recipe text instead!");
                copyRecipeToClipboard();
            });
    };

    // 5. Defer generation if photo is still loading to prevent blank image slots
    if (pdfPhoto && pdfPhoto.src && !pdfPhoto.complete) {
        pdfPhoto.onload = executePDFGeneration;
        pdfPhoto.onerror = executePDFGeneration; // fallback even if image fails
    } else {
        executePDFGeneration();
    }
}

function copyRecipeToClipboard() {
    if (!appState.currentRecipe) return;
    
    const r = appState.currentRecipe;
    
    // Construct rich text string representation
    let formattedText = `🍳 FridgeJam Recipe: ${r.title}\n`;
    formattedText += `⏱️ Time: ${r.cooking_time} | 📈 Level: ${r.difficulty}\n\n`;
    formattedText += `"${r.personality_intro}"\n\n`;
    formattedText += `📋 INGREDIENTS:\n`;
    r.ingredients.forEach(ing => {
        const origin = ing.is_user_ingredient ? "[User]" : "[Pantry]";
        formattedText += `- ${ing.name} (${ing.amount}) ${origin}\n`;
    });
    formattedText += `\n🔥 STEPS:\n`;
    r.steps.forEach((step, idx) => {
        formattedText += `${idx + 1}. ${step}\n`;
    });
    formattedText += `\n✨ CHEF'S TIP:\n"${r.chef_tip}"\n\n`;
    formattedText += `Plated with love via FridgeJam. Keep cooking zero waste!`;

    navigator.clipboard.writeText(formattedText)
        .then(() => showToast("Recipe copied to clipboard! Share it with friends!"))
        .catch(() => showToast("Couldn't copy. Copy it from the screen!"));
}

// --- Helper Functions ---
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// --- Event Listeners Initialization ---
function initEvents() {
    // Natural-Language input listener for real-time tag extraction and jar slips diffing
    if (DOM.ingredientsInput) {
        DOM.ingredientsInput.addEventListener('input', updateInputTextareaAndSync);
    }

    // Fridge Photo Scanner: Trigger hidden input file dialog on button click
    if (DOM.btnScanPhoto && DOM.fridgePhotoInput) {
        DOM.btnScanPhoto.addEventListener('click', () => {
            DOM.fridgePhotoInput.click();
            if (synth && typeof synth.playDialClick === 'function') {
                synth.playDialClick();
            }
        });
        
        DOM.fridgePhotoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Show custom glassmorphic scanner overlay
            const scanOverlay = document.createElement('div');
            scanOverlay.className = 'scan-overlay';
            scanOverlay.innerHTML = `
                <div class="scan-overlay-content">
                    <div class="scanner-laser"></div>
                    <div class="scan-spinner">📸</div>
                    <h3 style="font-family: var(--font-display); font-weight: 700; margin-bottom: 8px;">Scanning your fridge...</h3>
                    <p style="font-family: var(--font-body); font-size: 0.9rem; color: var(--text-secondary);">Our culinary scanner is analyzing the image...</p>
                </div>
            `;
            document.body.appendChild(scanOverlay);
            
            // Prepare request payload
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch('/api/scan', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Scanner response failed.');
                }
                
                const data = await response.json();
                
                // Clear the input file selection
                DOM.fridgePhotoInput.value = '';
                
                // Dismiss the overlay
                if (document.body.contains(scanOverlay)) {
                    document.body.removeChild(scanOverlay);
                }
                
                const newIngredients = data.ingredients || [];
                if (newIngredients.length > 0) {
                    // Append detected ingredients one by one with a delay to watch them drop into Leftovers Jar
                    let idx = 0;
                    function addNext() {
                        if (idx < newIngredients.length) {
                            const ing = newIngredients[idx];
                            
                            // Check if ingredient is already in the list to avoid duplicate drops
                            if (!appState.ingredients.some(existing => existing.toLowerCase() === ing.toLowerCase())) {
                                const currentText = DOM.ingredientsInput.value.trim();
                                const appendStr = (currentText === "" || currentText.endsWith(",")) ? ing : `, ${ing}`;
                                DOM.ingredientsInput.value += appendStr;
                                updateInputTextareaAndSync();
                                
                                // Play cute bubble sound!
                                if (synth && typeof synth.playBubble === 'function') {
                                    synth.playBubble();
                                }
                            }
                            
                            idx++;
                            setTimeout(addNext, 450);
                        } else {
                            showToast(`Scanned ${newIngredients.length} ingredients successfully! 📸`);
                        }
                    }
                    addNext();
                } else {
                    showToast("We couldn't spot any ingredients in the photo. Try another angle or check the lighting! 🔍");
                }
                
            } catch (err) {
                console.error("Scanning failed:", err);
                if (document.body.contains(scanOverlay)) {
                    document.body.removeChild(scanOverlay);
                }
                showToast("The fridge scanner had a glitch. Please try again!");
            }
        });
    }

    // Chef selection interaction
    DOM.chefButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const personality = btn.getAttribute('data-personality');
            selectChef(personality);
        });
        
        // Accessibility: allow selecting cards via Keyboard Space or Enter
        btn.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                const personality = btn.getAttribute('data-personality');
                selectChef(personality);
            }
        });
    });

    // Cooking Trigger
    if (DOM.btnCook) {
        DOM.btnCook.addEventListener('click', startCooking);
    }

    // Back / Close Button click
    if (DOM.recipeBackBtn) {
        DOM.recipeBackBtn.addEventListener('click', () => showState('input'));
    }
    
    // Fallback error image handler to elegantly display the styled fallback on load failure
    if (DOM.dishPhotoImg) {
        DOM.dishPhotoImg.addEventListener('error', () => {
            console.warn('[FridgeJam] Dish photo error event fired. Showing fallback.');
            DOM.dishPhotoImg.classList.add('hidden');
            if (DOM.dishPhotoFallback) DOM.dishPhotoFallback.style.display = 'flex';
        });
    }
    
    // Heart Button Favorite click
    if (DOM.recipeHeartBtn) {
        DOM.recipeHeartBtn.addEventListener('click', () => {
            if (!appState.currentRecipe) return;
            const heartIcon = DOM.recipeHeartBtn.querySelector('.heart-icon');
            if (heartIcon) {
                if (heartIcon.textContent === '🤍') {
                    heartIcon.textContent = '❤️';
                    synth.playDialClick(); // play cute tactile click sound
                    
                    // Grab selected URL, checking literal attribute to prevent resolving to page URL when empty
                    let currentImg = DOM.dishPhotoImg ? DOM.dishPhotoImg.getAttribute('src') : null;
                    if (!currentImg || (!currentImg.startsWith('http') && !currentImg.startsWith('data:image'))) {
                        currentImg = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
                    }
                    
                    saveRecipeToFavorites(appState.currentRecipe, currentImg);
                    showToast("Recipe added to your favorites! ❤️");
                } else {
                    heartIcon.textContent = '🤍';
                    synth.playDialClick(); // play cute tactile click sound
                    removeRecipeFromFavorites(appState.currentRecipe.title);
                    showToast("Removed recipe from favorites.");
                }
            }
        });
    }

    // Share Button click (PDF download with copy fallback)
    if (DOM.recipeShareBtn) {
        DOM.recipeShareBtn.addEventListener('click', downloadRecipeAsPDF);
    }
    
    // Modal Backdrop click
    if (DOM.cardOverlayBackdrop) {
        DOM.cardOverlayBackdrop.addEventListener('click', () => showState('input'));
    }

    // Modal Escape Keydown dismiss
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.cardOverlay && !DOM.cardOverlay.classList.contains('hidden')) {
            showState('input');
        }
    });

    // Reset button (Cook Another Dish)
    if (DOM.btnRestart) {
        DOM.btnRestart.addEventListener('click', () => {
            // Soft reset inputs
            appState.ingredients = [];
            appState.currentRecipe = null;
            DOM.ingredientsInput.value = '';
            updateInputTextareaAndSync();
            showState('input');
        });
    }

    // Toast Dismiss button
    const toastDismiss = document.getElementById('toast-dismiss');
    if (toastDismiss) {
        toastDismiss.addEventListener('click', () => {
            if (DOM.toast) {
                DOM.toast.classList.add('hidden');
            }
        });
    }

    // Recipe Box Drawer Toggle Event
    if (DOM.recipeBoxBtn) {
        DOM.recipeBoxBtn.addEventListener('click', () => {
            synth.playDrawerSlide();
            openRecipeBox();
        });
    }

    if (DOM.recipeBoxClose) {
        DOM.recipeBoxClose.addEventListener('click', () => {
            synth.playDrawerSlide();
            closeRecipeBox();
        });
    }

    if (DOM.recipeBoxBackdrop) {
        DOM.recipeBoxBackdrop.addEventListener('click', () => {
            synth.playDrawerSlide();
            closeRecipeBox();
        });
    }

    // Initialize drawer resizing capability
    initDrawerResize();
}

// --- Drawer Resizing Handler ---
function initDrawerResize() {
    const drawer = document.getElementById('recipe-box-drawer');
    const handle = document.getElementById('recipe-box-resize-handle');
    if (!drawer || !handle) return;

    // Load saved width from localStorage if exists
    const savedWidth = localStorage.getItem('recipeBoxWidth');
    if (savedWidth) {
        drawer.style.width = savedWidth;
    }

    let isResizing = false;

    function startResize(e) {
        isResizing = true;
        drawer.classList.add('resizing');
        document.body.classList.add('resizing-drawer');
        
        // Prevent default browser selecting/scrolling during drag
        e.preventDefault();
        
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('touchmove', handleResize, { passive: false });
        
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);
    }

    function handleResize(e) {
        if (!isResizing) return;
        
        // Support both mouse clientX and touch clientX
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        
        // Drawer is right-aligned, so width is the viewport width minus the cursor X coordinate
        let newWidth = window.innerWidth - clientX;
        
        // Set limits: minimum 360px wide, maximum 90% of screen width
        const minWidth = 360;
        const maxWidth = window.innerWidth * 0.9;
        
        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > maxWidth) newWidth = maxWidth;
        
        drawer.style.width = `${newWidth}px`;
    }

    function stopResize() {
        if (!isResizing) return;
        isResizing = false;
        
        drawer.classList.remove('resizing');
        document.body.classList.remove('resizing-drawer');
        
        // Save the chosen width to localStorage
        localStorage.setItem('recipeBoxWidth', drawer.style.width);
        
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('touchmove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchend', stopResize);
    }

    handle.addEventListener('mousedown', startResize);
    handle.addEventListener('touchstart', startResize);
}

// --- Recipe Box Utility Functions ---
function loadFavorites() {
    try {
        const saved = localStorage.getItem('favorites');
        appState.favorites = saved ? JSON.parse(saved) : [];
        
        // Auto-heal any corrupted favorite image URLs saved before the fix
        let changed = false;
        appState.favorites.forEach(fav => {
            const img = fav.saved_image_url;
            // If the URL matches the absolute local server root or index.html instead of a real image
            if (img && (img.includes('localhost') || img.includes('127.0.0.1')) && !img.includes('data:image')) {
                console.info("Healing corrupted favorite image URL for:", fav.title);
                
                // Re-run fallback category scoring
                const titleLower = fav.title.toLowerCase();
                const foodPhotos = [
                    { category: "egg", url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80" },
                    { category: "salad", url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80" },
                    { category: "pasta", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80" },
                    { category: "soup", url: "https://images.unsplash.com/photo-1547592165-e1d17f57655c?auto=format&fit=crop&w=800&q=80" },
                    { category: "sandwich", url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80" },
                    { category: "pancake", url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80" },
                    { category: "dessert", url: "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=80" },
                    { category: "chicken", url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80" },
                    { category: "beef", url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80" },
                    { category: "fish", url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80" },
                    { category: "rice", url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80" },
                    { category: "potato", url: "https://images.unsplash.com/photo-1518013006361-71899c437b3b?auto=format&fit=crop&w=800&q=80" },
                    { category: "pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80" },
                    { category: "taco", url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80" },
                    { category: "burger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80" },
                    { category: "smoothie", url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80" },
                    { category: "curry", url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80" }
                ];
                
                let selectedUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
                // Find matching category
                const match = foodPhotos.find(p => titleLower.includes(p.category));
                if (match) {
                    selectedUrl = match.url;
                }
                fav.saved_image_url = selectedUrl;
                changed = true;
            }
        });
        
        if (changed) {
            localStorage.setItem('favorites', JSON.stringify(appState.favorites));
        }
    } catch (e) {
        console.warn("Could not load favorites from localStorage", e);
        appState.favorites = [];
    }
    updateFavoritesBadge();
}

function updateFavoritesBadge() {
    if (DOM.recipeBoxCount) {
        DOM.recipeBoxCount.textContent = appState.favorites.length;
    }
}

function saveRecipeToFavorites(recipe, imageUrl) {
    // Prevent duplicate entries
    if (appState.favorites.some(fav => fav.title === recipe.title)) return;
    
    // Save a copy with image_url bundled
    const recipeCopy = {
        ...recipe,
        saved_image_url: imageUrl,
        saved_at: new Date().toISOString()
    };
    
    appState.favorites.push(recipeCopy);
    localStorage.setItem('favorites', JSON.stringify(appState.favorites));
    updateFavoritesBadge();
}

function removeRecipeFromFavorites(title) {
    appState.favorites = appState.favorites.filter(fav => fav.title !== title);
    localStorage.setItem('favorites', JSON.stringify(appState.favorites));
    updateFavoritesBadge();
    
    // If the active recipe is currently shown, update heart icon in real-time
    if (appState.currentRecipe && appState.currentRecipe.title === title) {
        const heartIcon = DOM.recipeHeartBtn.querySelector('.heart-icon');
        if (heartIcon) heartIcon.textContent = '🤍';
    }
}

function openRecipeBox() {
    renderRecipeBoxList();
    if (DOM.recipeBoxDrawer) DOM.recipeBoxDrawer.classList.add('open');
    if (DOM.recipeBoxBackdrop) DOM.recipeBoxBackdrop.classList.add('open');
}

function closeRecipeBox() {
    if (DOM.recipeBoxDrawer) DOM.recipeBoxDrawer.classList.remove('open');
    if (DOM.recipeBoxBackdrop) DOM.recipeBoxBackdrop.classList.remove('open');
}

function renderRecipeBoxList() {
    if (!DOM.recipeBoxList) return;
    DOM.recipeBoxList.innerHTML = '';
    
    if (appState.favorites.length === 0) {
        DOM.recipeBoxList.innerHTML = `
            <div class="recipe-box-empty">
                <p>Your Recipe Box is empty!</p>
                <p class="empty-sub">Heart recipe cards to save them here for later zero-waste inspiration. ❤️</p>
            </div>
        `;
        return;
    }
    
    // Sort favorites so newest is at the top
    const sorted = [...appState.favorites].sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
    
    sorted.forEach(recipe => {
        const wrapper = document.createElement('div');
        wrapper.className = 'recipe-box-item';

        const chefEmojis = { budget: "🍳", grandma: "👵", chef: "👨‍🍳", chloe: "🥗" };
        const chefNames  = { budget: "Tony", grandma: "Marie", chef: "Pierre", chloe: "Chloe" };
        const chefEmoji  = chefEmojis[recipe.selected_personality] || "🧑‍🍳";
        const chefName   = chefNames[recipe.selected_personality]  || "Chef";

        // Build ingredients HTML
        const ingredientsHtml = (recipe.ingredients || []).map(ing => {
            const name = ing.name || ing;
            const qty  = ing.quantity || '';
            const have = ing.have_it !== false;
            return `<li class="rbe-ingredient ${have ? 'rbe-have' : 'rbe-need'}">
                        <span class="rbe-ing-dot">${have ? '✅' : '🛒'}</span>
                        <span>${qty ? escapeHtml(qty) + ' ' : ''}${escapeHtml(name)}</span>
                    </li>`;
        }).join('');

        // Build steps HTML (first 3 steps shown, rest collapsed)
        const steps = recipe.steps || recipe.instructions || [];
        const stepsHtml = steps.map((step, i) => {
            const text = typeof step === 'string' ? step : (step.instruction || step.text || '');
            return `<li class="rbe-step"><span class="rbe-step-num">${i + 1}</span><span>${escapeHtml(text)}</span></li>`;
        }).join('');

        wrapper.innerHTML = `
            <div class="recipe-box-card" role="button" tabindex="0" aria-expanded="false">
                <img class="recipe-box-thumb" src="${recipe.saved_image_url}" alt="${escapeHtml(recipe.title)}"
                     onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'">
                <div class="recipe-box-card-content">
                    <h4 class="recipe-box-card-title">${escapeHtml(recipe.title)}</h4>
                    <div class="recipe-box-card-meta">
                        <span class="recipe-box-card-meta-time">⏱️ ${recipe.cooking_time || "20 mins"}</span>
                        <span class="recipe-box-card-chef-badge">${chefEmoji} ${chefName}</span>
                    </div>
                </div>
                <span class="recipe-box-card-chevron">▾</span>
                <button class="recipe-box-card-delete" aria-label="Delete Favorite">🗑️</button>
            </div>

            <div class="recipe-box-expand" aria-hidden="true">
                <div class="rbe-inner">
                    ${recipe.saved_image_url ? `<img class="rbe-hero" src="${recipe.saved_image_url}"
                        alt="${escapeHtml(recipe.title)}"
                        onerror="this.style.display='none'">` : ''}

                    <section class="rbe-section">
                        <h5 class="rbe-section-title">🥕 Ingredients</h5>
                        <ul class="rbe-ingredients-list">${ingredientsHtml || '<li>No ingredients listed.</li>'}</ul>
                    </section>

                    ${stepsHtml ? `<section class="rbe-section">
                        <h5 class="rbe-section-title">👨‍🍳 Steps</h5>
                        <ol class="rbe-steps-list">${stepsHtml}</ol>
                    </section>` : ''}

                    <button class="rbe-cook-btn">Cook This Recipe →</button>
                </div>
            </div>
        `;

        const card       = wrapper.querySelector('.recipe-box-card');
        const expandPane = wrapper.querySelector('.recipe-box-expand');
        const chevron    = wrapper.querySelector('.recipe-box-card-chevron');
        const cookBtn    = wrapper.querySelector('.rbe-cook-btn');
        const delBtn     = wrapper.querySelector('.recipe-box-card-delete');

        // Toggle expand on card click — uses direct inline styles to avoid CSS cascade issues
        card.addEventListener('click', (e) => {
            if (e.target.closest('.recipe-box-card-delete')) return;
            synth.playDialClick();

            const isOpen = expandPane.style.maxHeight && expandPane.style.maxHeight !== '0px' && expandPane.style.maxHeight !== '0';

            // Close all other open cards first
            DOM.recipeBoxList.querySelectorAll('.recipe-box-item').forEach(el => {
                const ep = el.querySelector('.recipe-box-expand');
                const ch = el.querySelector('.recipe-box-card-chevron');
                if (ep) { 
                    if (ep.style.maxHeight === 'none') {
                        ep.style.maxHeight = ep.scrollHeight + 'px';
                        void ep.offsetHeight; // force reflow
                    }
                    ep.style.maxHeight = '0'; 
                    ep.style.borderTopWidth = '0'; 
                }
                if (ch) ch.textContent = '▾';
                el.querySelector('.recipe-box-card')?.setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                // Open this card by setting maxHeight to the actual scroll height
                expandPane.style.maxHeight = expandPane.scrollHeight + 'px';
                expandPane.style.borderTopWidth = '2px';
                card.setAttribute('aria-expanded', 'true');
                if (chevron) chevron.textContent = '▴';
                
                // Allow card to dynamically auto-resize when image loads asynchronously
                expandPane.addEventListener('transitionend', function onEnd() {
                    if (card.getAttribute('aria-expanded') === 'true') {
                        expandPane.style.maxHeight = 'none';
                    }
                    expandPane.removeEventListener('transitionend', onEnd);
                });

                // Scroll the card smoothly to the top of the drawer list, starting almost immediately for a premium, fluid transition
                setTimeout(() => {
                    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        });

        // "Cook This" button — navigate to full recipe view
        cookBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            synth.playDinnerBell();
            closeRecipeBox();
            appState.currentRecipe = recipe;
            renderRecipeScreen(recipe, { success: !!(recipe.saved_image_url), image_url: recipe.saved_image_url });
            showState('recipe');
        });

        // Delete button
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            synth.playDialClick();
            removeRecipeFromFavorites(recipe.title);
            renderRecipeBoxList();
        });

        DOM.recipeBoxList.appendChild(wrapper);
    });
}

// --- Theme Toggle System ---
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const setDarkTheme = (isDark) => {
        if (isDark) {
            document.body.classList.add('dark-theme');
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.setAttribute('data-theme', 'light');
        }
        updateThemeToggleUI(isDark);
    };
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        setDarkTheme(true);
    } else {
        setDarkTheme(false);
    }
    
    themeToggle.addEventListener('click', () => {
        const isDark = !document.body.classList.contains('dark-theme');
        setDarkTheme(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        // Play cozy dial sound
        synth.playDialClick();
    });
}

function updateThemeToggleUI(isDark) {
    const toggleIcon = document.querySelector('#theme-toggle .toggle-icon');
    const toggleText = document.querySelector('#theme-toggle .toggle-text');
    if (toggleIcon) toggleIcon.textContent = isDark ? '☀️' : '🌙';
    if (toggleText) toggleText.textContent = isDark ? 'Morning Sun' : 'Twilight Hearth';

    // Dynamically update the Recipe Box divider icon to match the active theme!
    const dividerSun = document.querySelector('.recipe-box-divider-sun');
    if (dividerSun) {
        dividerSun.textContent = isDark ? '🌙' : '☀️';
    }
}

// ─────────────────────────────────────────────
// FEATURE: Voice Ingredient Input
// ─────────────────────────────────────────────
let voiceRecognition = null;
let isListening = false;

function initVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = document.getElementById('btn-voice-input');

    if (!SpeechRecognition) {
        if (btn) btn.style.display = 'none';
        return;
    }

    voiceRecognition = new SpeechRecognition();
    voiceRecognition.continuous = false;
    voiceRecognition.interimResults = false;
    voiceRecognition.lang = 'en-US';

    voiceRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const currentText = DOM.ingredientsInput.value.trim();
        const separator = (currentText === '' || currentText.endsWith(',')) ? ' ' : ', ';
        DOM.ingredientsInput.value = currentText + separator + transcript;
        updateInputTextareaAndSync();
        showToast(`Added: "${transcript}" 🎤`);
    };

    voiceRecognition.onend = () => {
        isListening = false;
        updateVoiceBtnState(false);
    };

    voiceRecognition.onerror = (event) => {
        isListening = false;
        updateVoiceBtnState(false);
        if (event.error !== 'no-speech') {
            showToast('Microphone issue — please check browser permissions!');
        }
    };

    if (btn) {
        btn.addEventListener('click', async () => {
            if (isListening) {
                voiceRecognition.stop();
            } else {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    voiceRecognition.start();
                    isListening = true;
                    updateVoiceBtnState(true);
                    synth.playDialClick();
                } catch (e) {
                    showToast('Microphone access denied — please allow it in your browser settings.');
                }
            }
        });
    }
}

function updateVoiceBtnState(listening) {
    const btn = document.getElementById('btn-voice-input');
    const text = document.getElementById('voice-btn-text');
    if (!btn) return;
    btn.classList.toggle('listening', listening);
    if (text) text.textContent = listening ? 'Listening...' : 'Speak';
}


// ─────────────────────────────────────────────
// FEATURE: Shopping List
// ─────────────────────────────────────────────
function openShoppingList() {
    if (!appState.currentRecipe) return;

    const missingIngs = appState.currentRecipe.ingredients.filter(ing => !ing.is_user_ingredient);
    const modal    = document.getElementById('shopping-list-modal');
    const itemsList = document.getElementById('shopping-list-items');
    const subtitle = document.getElementById('shopping-list-subtitle');
    if (!modal || !itemsList) return;

    itemsList.innerHTML = '';

    if (missingIngs.length === 0) {
        if (subtitle) subtitle.textContent = 'You already have everything! ✅';
        itemsList.innerHTML = '<li class="shopping-all-good">Nothing to shop for — your fridge is fully stocked!</li>';
    } else {
        if (subtitle) subtitle.textContent = `${missingIngs.length} item${missingIngs.length !== 1 ? 's' : ''} to pick up:`;
        missingIngs.forEach(ing => {
            const li = document.createElement('li');
            li.className = 'shopping-item';
            const label = ing.amount ? `${escapeHtml(ing.amount)} ${escapeHtml(ing.name)}` : escapeHtml(ing.name);
            li.innerHTML = `
                <label class="shopping-item-label">
                    <input type="checkbox" class="shopping-item-check">
                    <span class="shopping-item-name">${label}</span>
                </label>
            `;
            itemsList.appendChild(li);
        });
    }

    modal.classList.remove('hidden');
    synth.playDrawerSlide();
}

function closeShoppingList() {
    const modal = document.getElementById('shopping-list-modal');
    if (modal) modal.classList.add('hidden');
}

function copyShoppingList() {
    if (!appState.currentRecipe) return;
    const missingIngs = appState.currentRecipe.ingredients.filter(ing => !ing.is_user_ingredient);
    if (missingIngs.length === 0) {
        showToast('Nothing to copy — you have everything!');
        return;
    }
    const lines = missingIngs.map(ing => `- ${ing.amount ? ing.amount + ' ' : ''}${ing.name}`).join('\n');
    const text = `🛒 Shopping List for "${appState.currentRecipe.title}"\n\n${lines}\n\nFrom FridgeJam 🍳`;
    navigator.clipboard.writeText(text)
        .then(() => showToast('Shopping list copied to clipboard! 🛒'))
        .catch(() => showToast('Copy failed — try again!'));
}

function initShoppingListEvents() {
    const modal    = document.getElementById('shopping-list-modal');
    const panel    = modal ? modal.querySelector('.shopping-list-panel') : null;
    const closeBtn = document.getElementById('shopping-list-close');
    const copyBtn  = document.getElementById('shopping-list-copy-btn');
    const shopBtn  = document.getElementById('recipe-shopping-btn');

    if (shopBtn)  shopBtn.addEventListener('click', openShoppingList);
    if (closeBtn) closeBtn.addEventListener('click', closeShoppingList);
    if (modal)    modal.addEventListener('click', (e) => {
        if (panel && !panel.contains(e.target)) closeShoppingList();
    });
    if (copyBtn)  copyBtn.addEventListener('click', copyShoppingList);
}


// ─────────────────────────────────────────────
// FEATURE: Meal Planner
// ─────────────────────────────────────────────
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function loadMealPlan() {
    try {
        const saved = localStorage.getItem('mealPlan');
        appState.mealPlan = saved ? JSON.parse(saved) : {};
    } catch (e) {
        appState.mealPlan = {};
    }
}

function saveMealPlan() {
    localStorage.setItem('mealPlan', JSON.stringify(appState.mealPlan));
}

function openMealPlanner() {
    const overlay = document.getElementById('meal-planner-overlay');
    if (overlay) overlay.classList.remove('hidden');
    renderMealPlannerGrid();
    synth.playDrawerSlide();
}

function closeMealPlanner() {
    const overlay = document.getElementById('meal-planner-overlay');
    if (overlay) overlay.classList.add('hidden');
    closeMealDayPicker();
}

function renderMealPlannerGrid() {
    const grid = document.getElementById('meal-planner-grid');
    if (!grid) return;
    grid.innerHTML = '';

    DAYS_OF_WEEK.forEach(day => {
        const meal = appState.mealPlan[day] || null;
        const col  = document.createElement('div');
        col.className = 'meal-planner-day-col';

        if (meal) {
            const title = escapeHtml(meal.meal_name || meal.title || 'Untitled');
            const time  = meal.cooking_time ? `<span class="mp-meal-time">⏱️ ${escapeHtml(meal.cooking_time)}</span>` : '';
            const desc  = meal.isAiStub && meal.description
                ? `<p class="mp-meal-desc">${escapeHtml(meal.description)}</p>` : '';
            const thumb = !meal.isAiStub && meal.saved_image_url
                ? `<img class="mp-meal-thumb" src="${meal.saved_image_url}" alt="${title}" onerror="this.style.display='none'">`
                : `<div class="mp-meal-emoji">${meal.isAiStub ? '✨' : '🍽️'}</div>`;

            col.innerHTML = `
                <div class="mp-day-label">${day.slice(0, 3)}</div>
                <div class="mp-meal-card">
                    ${thumb}
                    <div class="mp-meal-info">
                        <p class="mp-meal-title">${title}</p>
                        ${desc}${time}
                    </div>
                    <button class="mp-remove-btn" data-day="${day}" aria-label="Remove ${day} meal">✕</button>
                </div>
            `;
        } else {
            col.innerHTML = `
                <div class="mp-day-label">${day.slice(0, 3)}</div>
                <div class="mp-empty-slot">
                    <button class="mp-add-btn" data-day="${day}" aria-label="Add meal for ${day}">
                        <span class="mp-add-icon">+</span>
                        <span class="mp-add-text">Add meal</span>
                    </button>
                </div>
            `;
        }

        grid.appendChild(col);
    });

    grid.querySelectorAll('.mp-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.getAttribute('data-day');
            delete appState.mealPlan[day];
            saveMealPlan();
            renderMealPlannerGrid();
            synth.playDialClick();
        });
    });

    grid.querySelectorAll('.mp-add-btn').forEach(btn => {
        btn.addEventListener('click', () => openMealDayPicker(btn.getAttribute('data-day')));
    });
}

function openMealDayPicker(day) {
    const picker     = document.getElementById('meal-day-picker');
    const pickerTitle = document.getElementById('meal-day-picker-title');
    const pickerList = document.getElementById('meal-day-picker-list');
    if (!picker || !pickerList) return;

    if (pickerTitle) pickerTitle.textContent = `Add meal for ${day}`;
    picker.setAttribute('data-day', day);
    pickerList.innerHTML = '';

    if (appState.favorites.length === 0) {
        pickerList.innerHTML = '<p class="mp-picker-empty">Save recipes to your Recipe Box first! ❤️</p>';
    } else {
        appState.favorites.forEach(recipe => {
            const btn = document.createElement('button');
            btn.className = 'mp-picker-item';
            const thumb = recipe.saved_image_url
                ? `<img class="mp-picker-thumb" src="${recipe.saved_image_url}" alt="" onerror="this.style.display='none'">`
                : '<span class="mp-picker-emoji">🍽️</span>';
            btn.innerHTML = `${thumb}<span class="mp-picker-name">${escapeHtml(recipe.title)}</span>`;
            btn.addEventListener('click', () => {
                appState.mealPlan[day] = { ...recipe, meal_name: recipe.title };
                saveMealPlan();
                closeMealDayPicker();
                renderMealPlannerGrid();
                synth.playDialClick();
            });
            pickerList.appendChild(btn);
        });
    }

    picker.classList.remove('hidden');
}

function closeMealDayPicker() {
    const picker = document.getElementById('meal-day-picker');
    if (picker) picker.classList.add('hidden');
}

async function suggestMealPlanWithAI() {
    const btn = document.getElementById('meal-planner-suggest-btn');
    if (btn) { btn.textContent = '⏳ Thinking...'; btn.disabled = true; }

    try {
        const res = await fetch('/api/meal-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ingredients: appState.ingredients.join(', '),
                personality: appState.selectedPersonality
            })
        });

        if (!res.ok) throw new Error('API error');
        const data = await res.json();

        (data.plan || []).forEach(item => {
            if (item.day && item.meal_name) {
                appState.mealPlan[item.day] = {
                    meal_name:       item.meal_name,
                    description:     item.description || '',
                    cooking_time:    item.cooking_time || '',
                    key_ingredients: item.key_ingredients || [],
                    isAiStub:        true
                };
            }
        });

        saveMealPlan();
        renderMealPlannerGrid();
        showToast('Your AI meal plan is ready! ✨');
    } catch (err) {
        console.error('Meal plan suggestion failed:', err);
        showToast("Couldn't generate a plan right now. Try again!");
    } finally {
        if (btn) { btn.textContent = '✨ Suggest with AI'; btn.disabled = false; }
    }
}

function initMealPlannerEvents() {
    const openBtn    = document.getElementById('meal-planner-btn');
    const closeBtn   = document.getElementById('meal-planner-close');
    const overlay    = document.getElementById('meal-planner-overlay');
    const panel      = overlay ? overlay.querySelector('.meal-planner-panel') : null;
    const suggestBtn = document.getElementById('meal-planner-suggest-btn');
    const clearBtn   = document.getElementById('meal-planner-clear-btn');
    const picker        = document.getElementById('meal-day-picker');
    const pickerPanel   = picker ? picker.querySelector('.meal-day-picker-panel') : null;
    const pickerClose   = document.getElementById('meal-day-picker-close');

    if (openBtn)   openBtn.addEventListener('click', openMealPlanner);
    if (closeBtn)  closeBtn.addEventListener('click', closeMealPlanner);
    if (overlay)   overlay.addEventListener('click', (e) => {
        if (panel && !panel.contains(e.target)) closeMealPlanner();
    });
    if (suggestBtn) suggestBtn.addEventListener('click', suggestMealPlanWithAI);
    if (clearBtn)  clearBtn.addEventListener('click', () => {
        appState.mealPlan = {};
        saveMealPlan();
        renderMealPlannerGrid();
        synth.playDialClick();
    });
    if (pickerClose) pickerClose.addEventListener('click', closeMealDayPicker);
    if (picker)      picker.addEventListener('click', (e) => {
        if (pickerPanel && !pickerPanel.contains(e.target)) closeMealDayPicker();
    });
}


// Run on boot
// Silently warm up the Cloud Run backend on page load so the first recipe
// request doesn't hit a cold-start timeout (Cloud Run scales to zero when idle).
function warmUpBackend() {
    fetch('/api/health').catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    warmUpBackend();
    loadFavorites();
    loadMealPlan();
    initEvents();
    initVoiceInput();
    initShoppingListEvents();
    initMealPlannerEvents();
    renderIngredientsTags();
    initTheme();
    showState('input');
});
