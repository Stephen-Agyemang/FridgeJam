/* FridgeJam central event wiring */

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
                    synth.playDialClick();

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
                    synth.playDialClick();
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
