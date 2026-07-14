/* FridgeJam shared DOM references, app state, view state, and toast */

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
    selectedPersonality: 'grandma',
    currentRecipe: null,
    favorites: [],
    mealPlan: {},
    dietaryRestrictions: [],
    expiringIngredients: new Set(),
    planRecipeHint: null
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
        DOM.stateInput.classList.add('active');
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
