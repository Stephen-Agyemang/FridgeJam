/* FridgeJam Meal Planner and taste learning */

// Preference state for the meal plan AI sheet (reset each time the sheet opens)
const planPrefs = { mood: null, cuisines: new Set() };
const MEAL_PLAN_GO_DEFAULT_TEXT = 'Create Week Schedule ✨';
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// --- Taste Learning ---

function trackIngredientUsage(ingredients) {
    if (!ingredients || ingredients.length === 0) return;
    try {
        const raw = localStorage.getItem('fridgejam_ingredient_log');
        const log = raw ? JSON.parse(raw) : [];
        log.unshift({ ingredients: [...ingredients], timestamp: Date.now() });
        localStorage.setItem('fridgejam_ingredient_log', JSON.stringify(log.slice(0, 30)));
    } catch (_) { /* ignore quota errors */ }
}

function buildTasteProfile() {
    const favorites = appState.favorites;
    const ingredientCounts = {};
    const culturalCounts = {};

    // Mine saved recipes — higher weight since these are dishes the user loved
    favorites.forEach(recipe => {
        (recipe.ingredients || []).forEach(ing => {
            const key = (ing.name || '').toLowerCase().trim();
            if (key.length > 2) {
                ingredientCounts[key] = (ingredientCounts[key] || 0) + 2;
            }
        });
        if (recipe.cultural_origin) {
            const origin = recipe.cultural_origin;
            culturalCounts[origin] = (culturalCounts[origin] || 0) + 1;
        }
    });

    // Mine ingredient cooking log — lower weight (not saved, just cooked)
    try {
        const raw = localStorage.getItem('fridgejam_ingredient_log');
        if (raw) {
            JSON.parse(raw).forEach(entry => {
                (entry.ingredients || []).forEach(ing => {
                    const key = ing.toLowerCase().trim();
                    if (key.length > 2) {
                        ingredientCounts[key] = (ingredientCounts[key] || 0) + 1;
                    }
                });
            });
        }
    } catch (_) { /* ignore */ }

    const topIngredients = Object.entries(ingredientCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ing]) => ing);

    const culturalAffinities = Object.entries(culturalCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([origin]) => origin);

    // Most recent saved dishes (newest first, max 8)
    const savedDishes = favorites
        .slice()
        .reverse()
        .slice(0, 8)
        .map(r => r.title)
        .filter(Boolean);

    return {
        top_ingredients:     topIngredients,
        cultural_affinities: culturalAffinities,
        saved_dishes:        savedDishes,
        cook_count:          favorites.length
    };
}
