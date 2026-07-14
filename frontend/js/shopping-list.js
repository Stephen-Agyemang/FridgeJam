/* FridgeJam recipe shopping list */

function openShoppingList() {
    if (!appState.currentRecipe) return;

    const missingIngs = appState.currentRecipe.ingredients.filter(ing => !ing.is_user_ingredient);
    const modal = document.getElementById('shopping-list-modal');
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
    const modal = document.getElementById('shopping-list-modal');
    const panel = modal ? modal.querySelector('.shopping-list-panel') : null;
    const closeBtn = document.getElementById('shopping-list-close');
    const copyBtn = document.getElementById('shopping-list-copy-btn');
    const shopBtn = document.getElementById('recipe-shopping-btn');

    if (shopBtn) shopBtn.addEventListener('click', openShoppingList);
    if (closeBtn) closeBtn.addEventListener('click', closeShoppingList);
    if (modal) modal.addEventListener('click', (e) => {
        if (panel && !panel.contains(e.target)) closeShoppingList();
    });
    if (copyBtn) copyBtn.addEventListener('click', copyShoppingList);
}
