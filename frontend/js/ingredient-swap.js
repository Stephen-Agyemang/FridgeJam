/* FridgeJam ingredient swap — "don't have it? use this instead" */

const SWAP_CHEF_NAMES = {
    budget: 'Tony',
    grandma: 'Grandma Marie',
    chef: 'Chef Pierre',
    chloe: 'Chloe'
};

// Cache substitutes per dish + ingredient so reopening a panel is instant
const swapCache = new Map();
let openSwapIndex = null;

function closeSwapPanel() {
    document.querySelectorAll('.swap-panel').forEach(p => p.remove());
    openSwapIndex = null;
}

function renderSwapPanel(panel, data, index) {
    const options = data.substitutes || [];
    panel.innerHTML = `
        ${data.chef_note ? `<p class="swap-chef-note">${escapeHtml(data.chef_note)}</p>` : ''}
        <div class="swap-options">
            ${options.map((opt, i) => `
                <div class="swap-option">
                    <div class="swap-option-head">
                        <span class="swap-option-name">${opt.amount ? `${escapeHtml(opt.amount)} ` : ''}${escapeHtml(opt.name)}</span>
                        ${opt.from_fridge ? '<span class="swap-fridge-tag">🧊 in your fridge</span>' : ''}
                    </div>
                    ${opt.why ? `<p class="swap-option-why">${escapeHtml(opt.why)}</p>` : ''}
                    ${opt.adjustment ? `<p class="swap-option-adjust">✏️ ${escapeHtml(opt.adjustment)}</p>` : ''}
                    <button type="button" class="swap-use-btn" data-action="use-swap" data-index="${index}" data-option="${i}">Use this</button>
                </div>
            `).join('')}
        </div>
    `;
}

async function openSwapPanel(index) {
    const recipe = appState.currentRecipe;
    if (!recipe || !recipe.ingredients[index]) return;

    const wrap = DOM.recipeIngredientsList.querySelector(`.ingredient-row-wrap[data-index="${index}"]`);
    if (!wrap) return;

    // Tapping the same swap button again closes its panel
    const alreadyOpen = !!wrap.querySelector('.swap-panel');
    closeSwapPanel();
    if (alreadyOpen) return;

    const ing = recipe.ingredients[index];
    const panel = document.createElement('div');
    panel.className = 'swap-panel';
    const chefName = SWAP_CHEF_NAMES[recipe.selected_personality] || 'The chef';
    panel.innerHTML = `<p class="swap-loading">${escapeHtml(chefName)} is checking the pantry…</p>`;
    wrap.appendChild(panel);
    openSwapIndex = index;

    const cacheKey = `${recipe.title}|${ing.name}`.toLowerCase();
    try {
        let data = swapCache.get(cacheKey);
        if (!data) {
            const res = await fetch('/api/substitute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredient: ing.name,
                    amount: ing.amount || '',
                    dish_title: recipe.title,
                    recipe_ingredients: recipe.ingredients
                        .filter((_, i) => i !== index)
                        .map(i => i.name),
                    fridge_ingredients: appState.ingredients,
                    dietary_restrictions: appState.dietaryRestrictions,
                    personality: recipe.selected_personality || appState.selectedPersonality
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Couldn't find a swap right now. Try again!");
            }
            data = await res.json();
            swapCache.set(cacheKey, data);
        }
        // Ignore stale responses if the user moved on to another row or recipe
        if (openSwapIndex !== index || appState.currentRecipe !== recipe || !panel.isConnected) return;
        renderSwapPanel(panel, data, index);
    } catch (err) {
        if (panel.isConnected) closeSwapPanel();
        showToast(err.message || "Couldn't find a swap right now. Try again!", true);
    }
}

// Keep a saved favorite in step with swaps made after it was hearted
function syncSwapToFavorites(recipe) {
    const fav = appState.favorites.find(f => f.title === recipe.title);
    if (!fav) return;
    fav.ingredients = recipe.ingredients.map(i => ({ ...i }));
    localStorage.setItem('favorites', JSON.stringify(appState.favorites));
    if (typeof queueCloudSync === 'function') queueCloudSync();
}

function applySwap(index, optionIndex) {
    const recipe = appState.currentRecipe;
    if (!recipe) return;
    const ing = recipe.ingredients[index];
    const data = swapCache.get(`${recipe.title}|${ing.name}`.toLowerCase());
    const option = data && data.substitutes[optionIndex];
    if (!option) return;

    // Keep the very first original if the user swaps a swap
    const original = ing.swapped_from || {
        name: ing.name,
        amount: ing.amount,
        is_user_ingredient: ing.is_user_ingredient
    };
    recipe.ingredients[index] = {
        name: option.name,
        amount: option.amount,
        is_user_ingredient: !!option.from_fridge,
        swapped_from: original,
        swap_note: option.adjustment || ''
    };

    closeSwapPanel();
    renderIngredientRows(recipe);
    syncSwapToFavorites(recipe);
    showToast(`Swapped ${original.name} → ${option.name}. Use it wherever the steps mention ${original.name}. 🔄`);
}

function undoSwap(index) {
    const recipe = appState.currentRecipe;
    if (!recipe) return;
    const ing = recipe.ingredients[index];
    if (!ing || !ing.swapped_from) return;

    recipe.ingredients[index] = { ...ing.swapped_from };
    closeSwapPanel();
    renderIngredientRows(recipe);
    syncSwapToFavorites(recipe);
    showToast(`Back to ${ing.swapped_from.name}.`);
}

function initIngredientSwapEvents() {
    if (!DOM.recipeIngredientsList) return;
    DOM.recipeIngredientsList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const index = Number(btn.dataset.index);
        if (btn.dataset.action === 'swap') openSwapPanel(index);
        else if (btn.dataset.action === 'use-swap') applySwap(index, Number(btn.dataset.option));
        else if (btn.dataset.action === 'undo-swap') undoSwap(index);
    });
}
