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
    ingredientsInputLabel: document.getElementById('ingredients-input-label'),
    dishTargetGroup: document.getElementById('dish-target-group'),
    dishTargetInput: document.getElementById('dish-target-input'),
    cookModeHelper: document.getElementById('cook-mode-helper'),
    cookModeButtons: document.querySelectorAll('.cook-mode-option'),
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
    recipeBoxList: document.getElementById('recipe-box-list'),

    // Cultural intelligence elements
    culturalOriginBadge: document.getElementById('cultural-origin-badge'),
    culturalOriginFlag: document.getElementById('cultural-origin-flag'),
    culturalOriginLabel: document.getElementById('cultural-origin-label'),
    missingCallout: document.getElementById('missing-ingredients-callout'),
    missingCalloutTitle: document.getElementById('missing-callout-title'),
    missingCalloutChips: document.getElementById('missing-callout-chips')
};

// Global App State
let appState = {
    ingredients: [],
    cookMode: 'leftovers',
    dishTarget: '',
    dishImageHint: '',
    selectedPersonality: 'grandma', // default selected
    currentRecipe: null,
    favorites: [],  // loaded dynamically from localStorage on boot
    mealPlan: {},   // loaded dynamically from localStorage on boot
    dietaryRestrictions: [],
    expiringIngredients: new Set(), // Expiry-First Mode: ingredients marked as expiring soon
    planRecipeHint: null  // Set when user clicks "Cook this" on a meal planner AI stub
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
    const dishLen = DOM.dishTargetInput ? DOM.dishTargetInput.value.trim().length : 0;
    
    // 1. Update character count text and class
    if (DOM.charCount) {
        DOM.charCount.textContent = `${len} / 1000`;
        DOM.charCount.classList.toggle('warning', len >= 800 && len < 950);
        DOM.charCount.classList.toggle('danger', len >= 950);
    }
    
    // 2. Enable/disable cook button (disabled below 5 characters)
    if (DOM.btnCook) {
        DOM.btnCook.disabled = appState.cookMode === 'dish' ? dishLen < 2 : len < 5;
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

    // Prune expiring set — remove any ingredient that's no longer in the list
    const lowerIngs = uniqueIngs.map(i => i.toLowerCase());
    for (const exp of appState.expiringIngredients) {
        if (!lowerIngs.includes(exp.toLowerCase())) {
            appState.expiringIngredients.delete(exp);
        }
    }

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
                jarContents.scrollTop = jarContents.scrollHeight;
            }
        });

        // Remove extra slips if any
        for (let j = appState.ingredients.length; j < existingSlips.length; j++) {
            existingSlips[j].remove();
        }

        // Keep newest item in view
        jarContents.scrollTop = jarContents.scrollHeight;
    }
}

// --- Pill Tags Render ---
function renderIngredientsTags() {
    DOM.ingredientsPool.innerHTML = '';
    const jarEmpty = document.getElementById('leftovers-jar-empty');

    if (appState.ingredients.length === 0) {
        const placeholder = appState.cookMode === 'dish'
            ? 'Optional: add anything you already have for this dish...'
            : 'Your cooking counter is empty...';
        DOM.ingredientsPool.innerHTML = `<span class="placeholder-tag">${placeholder}</span>`;
        if (jarEmpty) jarEmpty.classList.remove('hidden');
        return;
    }

    if (jarEmpty) jarEmpty.classList.add('hidden');

    const hasAny = appState.ingredients.length > 0;

    appState.ingredients.forEach((ing, index) => {
        const isExpiring = appState.expiringIngredients.has(ing);
        const tag = document.createElement('span');
        tag.className = `ingredient-tag${isExpiring ? ' expiring' : ''}`;
        tag.innerHTML = `
            <button class="btn-tag-expiry" type="button" title="${isExpiring ? 'Unmark as expiring' : 'Mark as expiring soon — chef will prioritize this'}" aria-label="${isExpiring ? 'Unmark expiring' : 'Mark expiring'}" aria-pressed="${isExpiring}">⚠️</button>
            ${escapeHtml(ing)}
            <button class="btn-tag-remove" type="button" aria-label="Remove ${escapeHtml(ing)}">&times;</button>
        `;

        tag.querySelector('.btn-tag-expiry').addEventListener('click', () => {
            toggleExpiringIngredient(ing);
        });

        tag.querySelector('.btn-tag-remove').addEventListener('click', () => {
            removeIngredient(index);
        });

        DOM.ingredientsPool.appendChild(tag);
    });

    // Show hint only when there are ingredients but none are flagged yet
    let hint = DOM.ingredientsPool.querySelector('.expiry-hint');
    if (!hint) {
        hint = document.createElement('p');
        hint.className = 'expiry-hint';
        hint.textContent = 'Tap ⚠️ on any ingredient to mark it as expiring soon — the chef will build the dish around it first.';
        DOM.ingredientsPool.appendChild(hint);
    }
    hint.classList.toggle('visible', hasAny && appState.expiringIngredients.size === 0);
}

function toggleExpiringIngredient(ing) {
    if (appState.expiringIngredients.has(ing)) {
        appState.expiringIngredients.delete(ing);
    } else {
        appState.expiringIngredients.add(ing);
        if (synth && typeof synth.playDialClick === 'function') synth.playDialClick();
    }
    renderIngredientsTags();
}

function removeIngredient(index) {
    const removed = appState.ingredients.splice(index, 1)[0];
    appState.expiringIngredients.delete(removed);
    DOM.ingredientsInput.value = appState.ingredients.join(', ');
    updateInputTextareaAndSync();
}

function commitIngredientsToList(ingredients, source) {
    let added = 0;
    let idx = 0;
    const sourceLabel = source === 'scan' ? 'scan' : source === 'food image' ? 'food image' : 'voice';

    function addNext() {
        if (idx >= ingredients.length) {
            if (added > 0) {
                showToast(`Added ${added} ingredient${added > 1 ? 's' : ''} from ${sourceLabel}`);
            }
            return;
        }

        const ing = cleanIngredientText(String(ingredients[idx] || ''));
        if (ing && !appState.ingredients.some(e => e.toLowerCase() === ing.toLowerCase())) {
            const cur = DOM.ingredientsInput.value.trim();
            DOM.ingredientsInput.value = cur === '' || cur.endsWith(',') ? cur + ing : `${cur}, ${ing}`;
            updateInputTextareaAndSync();
            if (synth && typeof synth.playBubble === 'function') synth.playBubble();
            added++;
        }

        idx++;
        setTimeout(addNext, 250);
    }

    addNext();
}

function setCookMode(mode) {
    const nextMode = mode === 'dish' ? 'dish' : 'leftovers';
    appState.cookMode = nextMode;
    if (nextMode !== 'dish') {
        appState.dishImageHint = '';
    }

    DOM.cookModeButtons.forEach(btn => {
        const isActive = btn.dataset.cookMode === nextMode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (DOM.dishTargetGroup) {
        DOM.dishTargetGroup.classList.toggle('hidden', nextMode !== 'dish');
    }

    if (DOM.ingredientsInputLabel) {
        DOM.ingredientsInputLabel.textContent = nextMode === 'dish'
            ? 'Anything you already have?'
            : "What's in your fridge?";
    }

    const scanIcon = document.querySelector('#btn-scan-photo .btn-scan-icon');
    const scanText = document.querySelector('#btn-scan-photo .btn-scan-text');
    const voiceText = document.getElementById('voice-btn-text');
    if (scanIcon) scanIcon.textContent = '📸';
    if (scanText) scanText.textContent = nextMode === 'dish' ? 'Scan Food' : 'Scan Fridge';
    if (DOM.btnScanPhoto) DOM.btnScanPhoto.setAttribute('aria-label', nextMode === 'dish' ? 'Scan food image' : 'Scan fridge photo');
    const voiceBtn = document.getElementById('btn-voice-input');
    if (voiceBtn) voiceBtn.setAttribute('aria-label', nextMode === 'dish' ? 'Speak dish name' : 'Speak ingredients');
    if (voiceText && !isListening) voiceText.textContent = nextMode === 'dish' ? 'Say dish' : 'Speak';

    if (DOM.ingredientsInput) {
        DOM.ingredientsInput.placeholder = nextMode === 'dish'
            ? 'Optional: eggs, spinach, half an onion...'
            : 'I have two eggs, some spinach, and half an onion...';
    }

    if (DOM.cookModeHelper) {
        DOM.cookModeHelper.textContent = nextMode === 'dish'
            ? 'Name the food you want, then add anything already in your kitchen.'
            : 'Tell us what ingredients are sitting in your fridge or pantry right now.';
    }

    if (DOM.btnCook) {
        const label = DOM.btnCook.querySelector('span:first-child');
        if (label) label.textContent = nextMode === 'dish' ? 'Cook This Dish' : "Let's Cook";
    }

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
    const isPlannerCook = Boolean(appState.planRecipeHint);
    const isDishMode = appState.cookMode === 'dish' && !isPlannerCook;
    const dishTarget = DOM.dishTargetInput ? DOM.dishTargetInput.value.trim() : '';
    appState.dishTarget = dishTarget;

    if (!isDishMode && appState.ingredients.length === 0) {
        showToast("Add some ingredients first before lighting the stove!");
        return;
    }

    if (isDishMode && dishTarget.length < 2) {
        showToast("Tell the chef what dish you want to cook first!");
        return;
    }

    // Log this session's ingredients so buildTasteProfile() can learn from it
    if (appState.ingredients.length > 0) {
        trackIngredientUsage(appState.ingredients);
    }

    // 1. Synthesize burner click sound
    synth.playDialClick();

    // 2. Trigger physical leftovers jar shake animation & slip scatter!
    const jarContainer = document.getElementById('leftovers-jar-container');
    const jarContents = document.getElementById('leftovers-jar-contents');
    if (jarContainer && appState.ingredients.length > 0) {
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
    const dishModeHint = isDishMode
        ? [dishTarget, appState.dishImageHint ? `Image notes: ${appState.dishImageHint}` : '']
            .filter(Boolean)
            .join('. ')
        : undefined;
    const recipeHint = appState.planRecipeHint || dishModeHint;
    
    try {
        // Step 1: Generate Recipe JSON from Gemini
        // Retry once on 5xx / network failure to survive Cloud Run cold-start timeouts.
        const recipePayload = JSON.stringify({
            ingredients: ingredientsPayload,
            personality: appState.selectedPersonality,
            dietary_restrictions: appState.dietaryRestrictions,
            expiring_soon: [...appState.expiringIngredients],
            recipe_hint: recipeHint || undefined
        });
        appState.planRecipeHint = null;
        let recipeResponse = null;
        // Retry up to 4× with exponential backoff (2s, 4s, 8s). A cold Cloud Run
        // container (scaled to zero when idle) can take 10-20s to wake up, which
        // reads as a 5xx or a dropped connection — retry both so the first cook
        // after a pause recovers on its own instead of showing a stove error.
        const RECIPE_MAX_ATTEMPTS = 4;
        for (let attempt = 0; attempt < RECIPE_MAX_ATTEMPTS; attempt++) {
            try {
                recipeResponse = await fetch('/api/recipe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: recipePayload
                });
                if (recipeResponse.ok || recipeResponse.status < 500) break;
            } catch (_networkErr) {
                recipeResponse = null;
                if (attempt === RECIPE_MAX_ATTEMPTS - 1) {
                    throw new Error("The kitchen connection dropped! Check your internet and try again.");
                }
            }
            if (attempt < RECIPE_MAX_ATTEMPTS - 1) {
                await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
            }
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

        // Let the user know if the chef auto-corrected any typos
        const corrections = recipeData.spelling_corrections;
        if (Array.isArray(corrections) && corrections.length > 0) {
            const fixes = corrections
                .map(c => `"${c.original}" → ${c.interpreted_as}`)
                .join(', ');
            showToast(`Chef spotted a few typos and kept cooking: ${fixes} 👨‍🍳`);
        }

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

// ─────────────────────────────────────────────
// FEATURE: Step-by-Step Cooking Timers
// ─────────────────────────────────────────────

const activeTimers = {};

function parseStepDuration(text) {
    // "X to Y hours/minutes/seconds" → take midpoint. "X hours/minutes/seconds" → exact.
    const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:to\s*(\d+(?:\.\d+)?)\s*)?hours?/i);
    if (hourMatch) {
        const lo = parseFloat(hourMatch[1]);
        const hi = hourMatch[2] ? parseFloat(hourMatch[2]) : lo;
        return Math.round(((lo + hi) / 2) * 3600);
    }
    const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:to\s*(\d+(?:\.\d+)?)\s*)?min(?:utes?)?/i);
    if (minMatch) {
        const lo = parseFloat(minMatch[1]);
        const hi = minMatch[2] ? parseFloat(minMatch[2]) : lo;
        return Math.round(((lo + hi) / 2) * 60);
    }
    const secMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:to\s*(\d+(?:\.\d+)?)\s*)?secs?(?:onds?)?/i);
    if (secMatch) {
        const lo = parseFloat(secMatch[1]);
        const hi = secMatch[2] ? parseFloat(secMatch[2]) : lo;
        return Math.round((lo + hi) / 2);
    }
    return null;
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
}

function formatCountdown(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function clearAllTimers() {
    Object.values(activeTimers).forEach(id => clearInterval(id));
    Object.keys(activeTimers).forEach(k => delete activeTimers[k]);
}

async function startStepTimer(btn, totalSeconds, stepIdx, stepText) {
    // Tap again while running → cancel
    if (activeTimers[stepIdx]) {
        clearInterval(activeTimers[stepIdx]);
        delete activeTimers[stepIdx];
        btn.textContent = `⏱ ${formatDuration(totalSeconds)}`;
        btn.classList.remove('timer-running', 'timer-done');
        return;
    }

    // Ask for notification permission on first use (non-blocking)
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    let remaining = totalSeconds;
    btn.textContent = `⏹ ${formatCountdown(remaining)}`;
    btn.classList.add('timer-running');

    activeTimers[stepIdx] = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(activeTimers[stepIdx]);
            delete activeTimers[stepIdx];
            btn.textContent = '✅ Done!';
            btn.classList.remove('timer-running');
            btn.classList.add('timer-done');

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('FridgeJam — Timer Done!', {
                    body: stepText.length > 80 ? stepText.slice(0, 77) + '…' : stepText,
                    icon: '/favicon.ico'
                });
            }
            if (synth && typeof synth.playBubble === 'function') synth.playBubble();

            // Auto-reset button after 4 seconds
            setTimeout(() => {
                btn.textContent = `⏱ ${formatDuration(totalSeconds)}`;
                btn.classList.remove('timer-done');
            }, 4000);
        } else {
            btn.textContent = `⏹ ${formatCountdown(remaining)}`;
        }
    }, 1000);
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

    // 3b. Cultural Origin Badge
    const culturalOriginMap = {
        'west african':     '🌍',
        'east african':     '🌍',
        'north african':    '🌍',
        'central african':  '🌍',
        'african':          '🌍',
        'ghanaian':         '🇬🇭',
        'nigerian':         '🇳🇬',
        'ethiopian':        '🇪🇹',
        'senegalese':       '🇸🇳',
        'kenyan':           '🇰🇪',
        'ugandan':          '🇺🇬',
        'ivorian':          '🇨🇮',
        'moroccan':         '🇲🇦',
        'egyptian':         '🇪🇬',
        'south asian':      '🌏',
        'east asian':       '🌏',
        'southeast asian':  '🌏',
        'asian':            '🌏',
        'japanese':         '🇯🇵',
        'chinese':          '🇨🇳',
        'korean':           '🇰🇷',
        'indian':           '🇮🇳',
        'thai':             '🇹🇭',
        'vietnamese':       '🇻🇳',
        'filipino':         '🇵🇭',
        'indonesian':       '🇮🇩',
        'middle eastern':   '🌙',
        'lebanese':         '🇱🇧',
        'turkish':          '🇹🇷',
        'persian':          '🇮🇷',
        'latin american':   '🌎',
        'mexican':          '🇲🇽',
        'caribbean':        '🌴',
        'jamaican':         '🇯🇲',
        'mediterranean':    '🫒',
        'italian':          '🇮🇹',
        'french':           '🇫🇷',
        'greek':            '🇬🇷',
    };

    if (DOM.culturalOriginBadge && recipe.cultural_origin) {
        const originKey = recipe.cultural_origin.toLowerCase();
        let flag = '🌐';
        for (const [key, emoji] of Object.entries(culturalOriginMap)) {
            if (originKey.includes(key)) { flag = emoji; break; }
        }
        DOM.culturalOriginFlag.textContent = flag;
        DOM.culturalOriginLabel.textContent = recipe.cultural_origin;
        DOM.culturalOriginBadge.classList.remove('hidden');
    } else if (DOM.culturalOriginBadge) {
        DOM.culturalOriginBadge.classList.add('hidden');
    }

    // 3c. Missing ingredients callout
    const missing = recipe.missing_for_authentic;
    if (DOM.missingCallout && missing && missing.length > 0) {
        const dishName = recipe.traditional_dish_name || recipe.title;
        DOM.missingCalloutTitle.textContent = `To complete a full ${dishName}, add:`;
        DOM.missingCalloutChips.innerHTML = missing
            .map(item => `<span class="missing-chip">${escapeHtml(item)}</span>`)
            .join('');
        DOM.missingCallout.classList.remove('hidden');
    } else if (DOM.missingCallout) {
        DOM.missingCallout.classList.add('hidden');
    }

    // 3d. Nutrition Facts Card (with smart unit parsing and safe backwards-compatible fallback)
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
            const safeNum = v => String(v || "-").replace(/[<>"'&]/g, '');
            if (DOM.nutrCalories) DOM.nutrCalories.innerHTML = `🔥 <strong>${safeNum(calVal)}</strong>`;
            if (DOM.nutrProtein) DOM.nutrProtein.innerHTML = `🥩 <strong>${safeNum(recipe.nutrition.protein)}</strong> Prot`;
            if (DOM.nutrCarbs)   DOM.nutrCarbs.innerHTML   = `🍞 <strong>${safeNum(recipe.nutrition.carbs)}</strong> Carbs`;
            if (DOM.nutrFat)     DOM.nutrFat.innerHTML     = `🧈 <strong>${safeNum(recipe.nutrition.fat)}</strong> Fat`;
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

    // 5. Preparation Steps (with inline cooking timers)
    clearAllTimers();
    if (DOM.recipeStepsList) {
        DOM.recipeStepsList.innerHTML = '';
        recipe.steps.forEach((step, idx) => {
            const li = document.createElement('li');
            const duration = parseStepDuration(step);
            li.innerHTML = `<span class="step-text">${escapeHtml(step)}</span>`;
            if (duration) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'step-timer-btn';
                btn.dataset.duration = duration;
                btn.textContent = `⏱ ${formatDuration(duration)}`;
                btn.addEventListener('click', () => startStepTimer(btn, duration, idx, step));
                li.appendChild(btn);
            }
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

    if (DOM.dishTargetInput) {
        DOM.dishTargetInput.addEventListener('input', () => {
            appState.dishTarget = DOM.dishTargetInput.value.trim();
            appState.dishImageHint = '';
            updateInputTextareaAndSync();
        });
    }

    DOM.cookModeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (synth && typeof synth.playDialClick === 'function') synth.playDialClick();
            setCookMode(btn.dataset.cookMode);
        });
    });
    setCookMode(appState.cookMode);

    // ── Fridge Photo Scanner ──────────────────────────────────────────────────
    // Opens live camera modal (with torch on supported devices), falls back to
    // file upload. After Gemini scans the image, shows a review step so the
    // user can verify detected ingredients before they're added to the list.

    let cameraStream = null;
    let torchOn = false;

    function closeCameraModal() {
        const modal = document.getElementById('camera-modal');
        if (modal) modal.classList.add('hidden');
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
        torchOn = false;
    }

    async function openCameraModal() {
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-preview');
        const torchBtn = document.getElementById('camera-torch-btn');
        const title = document.querySelector('.camera-modal-title');
        const captureBtn = document.getElementById('camera-capture-btn');
        if (!modal || !video) return;

        if (title) title.textContent = appState.cookMode === 'dish' ? 'Scan Food Image' : 'Scan Your Fridge';
        if (captureBtn) captureBtn.textContent = appState.cookMode === 'dish' ? '📸 Capture Food' : '📸 Capture';
        modal.classList.remove('hidden');

        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            video.srcObject = cameraStream;

            // Enable torch button only if the device supports it
            const track = cameraStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            if (capabilities.torch) {
                torchBtn.classList.remove('hidden');
                torchBtn.onclick = async () => {
                    torchOn = !torchOn;
                    await track.applyConstraints({ advanced: [{ torch: torchOn }] });
                    torchBtn.textContent = torchOn ? '🔦 Torch: On' : '🔦 Torch: Off';
                    torchBtn.classList.toggle('torch-active', torchOn);
                };
            } else {
                torchBtn.classList.add('hidden');
            }
        } catch (_) {
            // Camera permission denied or unavailable — fall back to file upload
            closeCameraModal();
            DOM.fridgePhotoInput.click();
        }
    }

    function captureFrameFromCamera() {
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('camera-canvas');
        if (!video || !canvas) return null;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    }

    async function runScan(fileOrBlob) {
        const isDishScan = appState.cookMode === 'dish';
        const scanOverlay = document.createElement('div');
        scanOverlay.className = 'scan-overlay';
        scanOverlay.innerHTML = `
            <div class="scan-overlay-content">
                <div class="scanner-laser"></div>
                <div class="scan-spinner">📸</div>
                <h3 style="font-family:var(--font-display);font-weight:700;margin-bottom:8px;">${isDishScan ? 'Reading food image...' : 'Scanning ingredients...'}</h3>
                <p style="font-family:var(--font-body);font-size:0.9rem;color:var(--text-secondary);">${isDishScan ? 'Gemini is figuring out what this dish looks like and how to recreate it...' : 'Gemini is carefully identifying everything it can see...'}</p>
            </div>`;
        document.body.appendChild(scanOverlay);

        try {
            const formData = new FormData();
            formData.append('file', fileOrBlob, isDishScan ? 'food.jpg' : 'fridge.jpg');
            const response = await fetch(isDishScan ? '/api/analyze-food-image' : '/api/scan', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Scan failed');
            const data = await response.json();
            document.body.removeChild(scanOverlay);

            if (isDishScan) {
                applyFoodImageAnalysis(data);
                return;
            }

            const detected = data.ingredients || [];
            if (detected.length > 0) {
                showScanReview(detected);
            } else {
                showToast("Couldn't spot any ingredients — try better lighting or a closer angle.");
            }
        } catch (err) {
            console.error('Scanning failed:', err);
            if (document.body.contains(scanOverlay)) document.body.removeChild(scanOverlay);
            showToast(isDishScan ? "The food scanner had a glitch. Please try another photo!" : "The fridge scanner had a glitch. Please try again!");
        }
    }

    function applyFoodImageAnalysis(data) {
        const dish = (data.detected_dish || '').trim();
        const styleNotes = (data.style_notes || '').trim();
        const recipeHint = (data.recipe_hint || '').trim();
        const visibleIngredients = Array.isArray(data.visible_ingredients) ? data.visible_ingredients : [];

        if (!dish && !recipeHint) {
            showToast("I couldn't confidently identify a dish from that image. Try a closer food photo.");
            return;
        }

        if (DOM.dishTargetInput && dish) {
            DOM.dishTargetInput.value = dish;
            appState.dishTarget = dish;
        }

        appState.dishImageHint = [recipeHint, styleNotes]
            .filter(Boolean)
            .join(' ');

        if (visibleIngredients.length > 0) {
            commitIngredientsToList(visibleIngredients, 'food image');
        }

        updateInputTextareaAndSync();
        showToast(dish ? `Looks like ${dish}. I can help you cook something like it. 🍽️` : "Food image read. I can help you cook something like it. 🍽️");
    }

    function showScanReview(ingredients) {
        const modal = document.getElementById('scan-review-modal');
        const list = document.getElementById('scan-review-list');
        if (!modal || !list) return;

        list.innerHTML = ingredients.map((ing, i) => `
            <label class="scan-review-item">
                <input type="checkbox" class="scan-review-check" data-ing="${escapeHtml(ing)}" checked>
                <span class="scan-review-ing">${escapeHtml(ing)}</span>
            </label>
        `).join('');

        modal.classList.remove('hidden');

        document.getElementById('scan-review-confirm').onclick = () => {
            const checked = [...list.querySelectorAll('.scan-review-check:checked')]
                .map(cb => cb.dataset.ing);
            modal.classList.add('hidden');
            commitIngredientsToList(checked, 'scan');
        };

        document.getElementById('scan-review-cancel').onclick = () => {
            modal.classList.add('hidden');
        };
    }

    function commitIngredientsToList(ingredients, source) {
        let added = 0;
        let idx = 0;
        function addNext() {
            if (idx >= ingredients.length) {
                if (added > 0) {
                    const sourceLabel = source === 'scan' ? 'scan' : source === 'food image' ? 'food image' : 'voice';
                    const label = `Added ${added} ingredient${added > 1 ? 's' : ''} from ${sourceLabel}`;
                    showToast(label);
                }
                return;
            }
            const ing = ingredients[idx];
            if (!appState.ingredients.some(e => e.toLowerCase() === ing.toLowerCase())) {
                const cur = DOM.ingredientsInput.value.trim();
                DOM.ingredientsInput.value = cur === '' || cur.endsWith(',') ? cur + ing : `${cur}, ${ing}`;
                updateInputTextareaAndSync();
                if (synth && typeof synth.playBubble === 'function') synth.playBubble();
                added++;
            }
            idx++;
            setTimeout(addNext, 350);
        }
        addNext();
    }

    // Wire up camera button
    if (DOM.btnScanPhoto) {
        DOM.btnScanPhoto.addEventListener('click', () => {
            if (synth && typeof synth.playDialClick === 'function') synth.playDialClick();
            // Try live camera first; openCameraModal falls back to file picker if unavailable
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                openCameraModal();
            } else {
                DOM.fridgePhotoInput.click();
            }
        });
    }

    // Camera modal controls
    const cameraCaptureBtn = document.getElementById('camera-capture-btn');
    if (cameraCaptureBtn) {
        cameraCaptureBtn.addEventListener('click', async () => {
            const blob = await captureFrameFromCamera();
            closeCameraModal();
            if (blob) runScan(blob);
        });
    }
    const cameraCloseBtn = document.getElementById('camera-close-btn');
    if (cameraCloseBtn) cameraCloseBtn.addEventListener('click', closeCameraModal);

    const cameraUploadFallback = document.getElementById('camera-upload-fallback');
    if (cameraUploadFallback) {
        cameraUploadFallback.addEventListener('click', () => {
            closeCameraModal();
            DOM.fridgePhotoInput.click();
        });
    }

    // File upload fallback (existing hidden input)
    if (DOM.fridgePhotoInput) {
        DOM.fridgePhotoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            DOM.fridgePhotoInput.value = '';
            await runScan(file);
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

    const leaderboardForm = document.getElementById('leaderboard-submit-form');
    if (leaderboardForm) {
        leaderboardForm.addEventListener('submit', submitLeaderboardScore);
    }

    const leaderboardRefreshBtn = document.getElementById('leaderboard-refresh-btn');
    if (leaderboardRefreshBtn) {
        leaderboardRefreshBtn.addEventListener('click', loadLeaderboard);
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
                    showToast(currentUser
                        ? "Recipe added and synced to your Recipe Box."
                        : "Recipe saved on this device. Sign in to sync it.");
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
            clearAllTimers();
            appState.ingredients = [];
            appState.expiringIngredients.clear();
            appState.currentRecipe = null;
            appState.planRecipeHint = null;
            appState.dishTarget = '';
            appState.dishImageHint = '';
            DOM.ingredientsInput.value = '';
            if (DOM.dishTargetInput) DOM.dishTargetInput.value = '';
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

    // Dietary restriction chip toggles
    document.querySelectorAll('.dietary-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const restriction = chip.dataset.restriction;
            const active = appState.dietaryRestrictions.includes(restriction);
            if (active) {
                appState.dietaryRestrictions = appState.dietaryRestrictions.filter(r => r !== restriction);
                chip.classList.remove('dietary-chip-active');
                chip.setAttribute('aria-pressed', 'false');
            } else {
                appState.dietaryRestrictions.push(restriction);
                chip.classList.add('dietary-chip-active');
                chip.setAttribute('aria-pressed', 'true');
            }
        });
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
    initAuthEvents();
    renderIngredientsTags();
    initTheme();
    initAuth();
    showState('input');
});
