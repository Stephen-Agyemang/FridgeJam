/* FridgeJam input workbench, ingredient jar, cook mode, and chef picker */

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
