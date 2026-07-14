/* FridgeJam Recipe Box drawer and persistence */

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
    queueCloudSync();
}

function removeRecipeFromFavorites(title) {
    appState.favorites = appState.favorites.filter(fav => fav.title !== title);
    localStorage.setItem('favorites', JSON.stringify(appState.favorites));
    updateFavoritesBadge();
    queueCloudSync();

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
            ${renderRecipeBoxSyncPrompt()}
            <div class="recipe-box-empty">
                <p>Your Recipe Box is empty!</p>
                <p class="empty-sub">Heart recipe cards to save them here. Sign in anytime to sync them across devices.</p>
            </div>
        `;
        bindRecipeBoxSyncPrompt();
        return;
    }

    // Sort favorites so newest is at the top
    const sorted = [...appState.favorites].sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));

    DOM.recipeBoxList.insertAdjacentHTML('beforeend', renderRecipeBoxSyncPrompt());
    bindRecipeBoxSyncPrompt();

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
