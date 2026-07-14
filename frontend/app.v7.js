/* FridgeJam — Premium Frontend Logic & State Machine */

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
// ─────────────────────────────────────────────
// FEATURE: Step-by-Step Cooking Timers
// ─────────────────────────────────────────────

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
    initScanCameraEvents();
    initVoiceInput();
    initShoppingListEvents();
    initMealPlannerEvents();
    initEntertainmentZoneEvents();
    initAuthEvents();
    renderIngredientsTags();
    initTheme();
    initAuth();
    showState('input');
});
