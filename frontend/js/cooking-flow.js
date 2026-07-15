/* FridgeJam cooking progress and recipe generation flow */

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
