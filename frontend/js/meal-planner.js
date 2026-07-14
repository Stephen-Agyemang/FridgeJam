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

// --- Meal Plan Preference Sheet ---

function openPlanPrefs() {
    // Reset to blank slate each open
    planPrefs.mood = null;
    planPrefs.cuisines.clear();
    document.querySelectorAll('#mp-mood-chips .mp-pref-chip, #mp-cuisine-chips .mp-pref-chip')
        .forEach(c => {
            c.classList.remove('mp-pref-selected');
            c.setAttribute('aria-pressed', 'false');
        });
    setPlanPrefsGenerating(false);

    // Build the learn note based on available data
    const learnNote = document.getElementById('mp-prefs-learn-note');
    if (learnNote) {
        const n = appState.favorites.length;
        let sessions = 0;
        try {
            const raw = localStorage.getItem('fridgejam_ingredient_log');
            sessions = raw ? JSON.parse(raw).length : 0;
        } catch (_) { /* ignore */ }

        if (n === 0 && sessions === 0) {
            learnNote.textContent = 'Save a recipe to your Recipe Box and we\'ll start learning your taste 💡';
        } else {
            const parts = [];
            if (n > 0) parts.push(`${n} saved recipe${n !== 1 ? 's' : ''}`);
            if (sessions > 0) parts.push(`${sessions} cooking session${sessions !== 1 ? 's' : ''}`);
            learnNote.textContent = `Learning from ${parts.join(' & ')} ❤️`;
        }
    }

    const overlay = document.getElementById('mp-prefs-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        synth.playDrawerSlide();
    }
}

function closePlanPrefs() {
    const overlay = document.getElementById('mp-prefs-overlay');
    if (overlay) overlay.classList.add('hidden');
    setPlanPrefsGenerating(false);
}

function setPlanPrefsGenerating(isGenerating) {
    const panel = document.querySelector('.mp-prefs-panel');
    const generateBtn = document.getElementById('mp-prefs-go');
    const cancelBtn = document.getElementById('mp-prefs-cancel');
    const suggestBtn = document.getElementById('meal-planner-suggest-btn');
    const loading = document.getElementById('mp-prefs-loading');
    const learnNote = document.getElementById('mp-prefs-learn-note');
    const chips = document.querySelectorAll('#mp-mood-chips .mp-pref-chip, #mp-cuisine-chips .mp-pref-chip');

    if (panel) {
        panel.classList.toggle('is-generating', isGenerating);
        panel.setAttribute('aria-busy', isGenerating ? 'true' : 'false');
    }
    if (generateBtn) {
        generateBtn.disabled = isGenerating;
        generateBtn.textContent = isGenerating ? 'Creating...' : MEAL_PLAN_GO_DEFAULT_TEXT;
    }
    if (cancelBtn) cancelBtn.disabled = isGenerating;
    if (suggestBtn) {
        suggestBtn.disabled = isGenerating;
        suggestBtn.textContent = isGenerating ? '⏳ Planning...' : '✨ Suggest with AI';
    }
    if (loading) loading.hidden = !isGenerating;
    if (learnNote) learnNote.hidden = isGenerating;
    chips.forEach(chip => { chip.disabled = isGenerating; });
}

function normalizeMealPlanDay(day) {
    const normalized = String(day || '').trim().toLowerCase();
    const match = DAYS_OF_WEEK.find(d => (
        d.toLowerCase() === normalized ||
        d.slice(0, 3).toLowerCase() === normalized.slice(0, 3)
    ));
    return match || null;
}

function isMealPlanSuggestion(meal) {
    return Boolean(meal && (
        meal.isAiStub ||
        (
            !meal.saved_image_url &&
            (
                Boolean(meal.description) ||
                (Array.isArray(meal.key_ingredients) && meal.key_ingredients.length > 0)
            )
        )
    ));
}

function normalizeStoredMealPlan(plan) {
    const normalizedPlan = {};
    Object.entries(plan || {}).forEach(([day, meal]) => {
        const normalizedDay = normalizeMealPlanDay(day) || day;
        if (!meal || typeof meal !== 'object') return;
        normalizedPlan[normalizedDay] = {
            ...meal,
            isAiStub: isMealPlanSuggestion(meal)
        };
    });
    return normalizedPlan;
}

function loadMealPlan() {
    try {
        const saved = localStorage.getItem('mealPlan');
        appState.mealPlan = saved ? normalizeStoredMealPlan(JSON.parse(saved)) : {};
        if (saved) saveMealPlan();
    } catch (e) {
        appState.mealPlan = {};
    }
}

function saveMealPlan() {
    localStorage.setItem('mealPlan', JSON.stringify(appState.mealPlan));
    queueCloudSync();
}

function openMealPlanner() {
    const overlay = document.getElementById('meal-planner-overlay');
    if (overlay) overlay.classList.remove('hidden');
    renderMealPlannerGrid();
    synth.playDrawerSlide();
}

function closeMealPlanner() {
    const overlay = document.getElementById('meal-planner-overlay');
    if (overlay) overlay.classList.add('hidden');
    closeMealDayPicker();
}

function renderMealPlannerGrid() {
    const grid = document.getElementById('meal-planner-grid');
    if (!grid) return;
    grid.innerHTML = '';

    DAYS_OF_WEEK.forEach(day => {
        const meal = appState.mealPlan[day] || null;
        const col  = document.createElement('div');
        col.className = 'meal-planner-day-col';

        if (meal) {
            const isPlanSuggestion = isMealPlanSuggestion(meal);
            const title = escapeHtml(meal.meal_name || meal.title || 'Untitled');
            const time  = meal.cooking_time ? `<span class="mp-meal-time">⏱️ ${escapeHtml(meal.cooking_time)}</span>` : '';
            const desc  = isPlanSuggestion && meal.description
                ? `<p class="mp-meal-desc">${escapeHtml(meal.description)}</p>` : '';
            const thumb = !isPlanSuggestion && meal.saved_image_url
                ? `<img class="mp-meal-thumb" src="${meal.saved_image_url}" alt="${title}" onerror="this.style.display='none'">`
                : `<div class="mp-meal-emoji">${isPlanSuggestion ? '✨' : '🍽️'}</div>`;
            const cookBtn = isPlanSuggestion
                ? `<button class="mp-cook-btn" data-day="${day}">Cook this →</button>` : '';
            const cardClass = isPlanSuggestion ? 'mp-meal-card mp-ai-meal-card' : 'mp-meal-card';

            col.innerHTML = `
                <div class="mp-day-label">${day.slice(0, 3)}</div>
                <div class="${cardClass}" data-day="${day}">
                    ${thumb}
                    <div class="mp-meal-info">
                        <p class="mp-meal-title">${title}</p>
                        ${desc}${time}${cookBtn}
                    </div>
                    <button class="mp-remove-btn" data-day="${day}" aria-label="Remove ${day} meal">✕</button>
                </div>
            `;
        } else {
            col.innerHTML = `
                <div class="mp-day-label">${day.slice(0, 3)}</div>
                <div class="mp-empty-slot">
                    <button class="mp-add-btn" data-day="${day}" aria-label="Add meal for ${day}">
                        <span class="mp-add-icon">+</span>
                        <span class="mp-add-text">Add meal</span>
                    </button>
                </div>
            `;
        }

        grid.appendChild(col);
    });

    grid.querySelectorAll('.mp-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.getAttribute('data-day');
            delete appState.mealPlan[day];
            saveMealPlan();
            renderMealPlannerGrid();
            synth.playDialClick();
        });
    });

    grid.querySelectorAll('.mp-add-btn').forEach(btn => {
        btn.addEventListener('click', () => openMealDayPicker(btn.getAttribute('data-day')));
    });

    grid.querySelectorAll('.mp-cook-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const day = btn.getAttribute('data-day');
            const meal = appState.mealPlan[day];
            if (meal) showCookFromPlanConfirm(meal);
        });
    });

    grid.querySelectorAll('.mp-ai-meal-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const day = card.getAttribute('data-day');
            const meal = appState.mealPlan[day];
            if (meal) showCookFromPlanConfirm(meal);
        });
    });
}

function openMealDayPicker(day) {
    const picker     = document.getElementById('meal-day-picker');
    const pickerTitle = document.getElementById('meal-day-picker-title');
    const pickerList = document.getElementById('meal-day-picker-list');
    if (!picker || !pickerList) return;

    if (pickerTitle) pickerTitle.textContent = `Add meal for ${day}`;
    picker.setAttribute('data-day', day);
    pickerList.innerHTML = '';

    if (appState.favorites.length === 0) {
        pickerList.innerHTML = '<p class="mp-picker-empty">Save recipes to your Recipe Box first! ❤️</p>';
    } else {
        appState.favorites.forEach(recipe => {
            const btn = document.createElement('button');
            btn.className = 'mp-picker-item';
            const thumb = recipe.saved_image_url
                ? `<img class="mp-picker-thumb" src="${recipe.saved_image_url}" alt="" onerror="this.style.display='none'">`
                : '<span class="mp-picker-emoji">🍽️</span>';
            btn.innerHTML = `${thumb}<span class="mp-picker-name">${escapeHtml(recipe.title)}</span>`;
            btn.addEventListener('click', () => {
                appState.mealPlan[day] = { ...recipe, meal_name: recipe.title };
                saveMealPlan();
                closeMealDayPicker();
                renderMealPlannerGrid();
                synth.playDialClick();
            });
            pickerList.appendChild(btn);
        });
    }

    picker.classList.remove('hidden');
}

function closeMealDayPicker() {
    const picker = document.getElementById('meal-day-picker');
    if (picker) picker.classList.add('hidden');
}

async function suggestMealPlanWithAI() {
    setPlanPrefsGenerating(true);

    const tasteProfile = buildTasteProfile();

    try {
        const res = await fetch('/api/meal-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ingredients:          appState.ingredients.join(', '),
                personality:          appState.selectedPersonality,
                dietary_restrictions: appState.dietaryRestrictions,
                mood:                 planPrefs.mood,
                cuisine_explore:      [...planPrefs.cuisines],
                taste_profile:        tasteProfile
            })
        });

        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        let addedMeals = 0;

        (data.plan || []).forEach(item => {
            const day = normalizeMealPlanDay(item.day);
            if (day && item.meal_name) {
                appState.mealPlan[day] = {
                    meal_name:       item.meal_name,
                    description:     item.description || '',
                    cooking_time:    item.cooking_time || '',
                    key_ingredients: item.key_ingredients || [],
                    isAiStub:        true
                };
                addedMeals += 1;
            }
        });

        if (addedMeals === 0) {
            throw new Error('Meal plan response did not include usable days');
        }

        saveMealPlan();
        renderMealPlannerGrid();
        closePlanPrefs();
        showToast('Your AI meal plan is ready! ✨');
    } catch (err) {
        console.error('Meal plan suggestion failed:', err);
        showToast("Couldn't generate a plan right now. Try again!");
    } finally {
        setPlanPrefsGenerating(false);
    }
}

function showCookFromPlanConfirm(meal) {
    const banner = document.getElementById('mp-cook-confirm');
    const nameEl = document.getElementById('mp-cook-confirm-name');
    if (!banner || !nameEl) return;

    nameEl.textContent = meal.meal_name || meal.title || 'This dish';
    banner.classList.remove('hidden');
    synth.playDialClick();

    // Store pending meal for when user confirms
    banner._pendingMeal = meal;
}

function hideCookFromPlanConfirm() {
    const banner = document.getElementById('mp-cook-confirm');
    if (banner) {
        banner.classList.add('hidden');
        banner._pendingMeal = null;
    }
}

function initMealPlannerEvents() {
    const openBtn    = document.getElementById('meal-planner-btn');
    const closeBtn   = document.getElementById('meal-planner-close');
    const overlay    = document.getElementById('meal-planner-overlay');
    const panel      = overlay ? overlay.querySelector('.meal-planner-panel') : null;
    const suggestBtn = document.getElementById('meal-planner-suggest-btn');
    const clearBtn   = document.getElementById('meal-planner-clear-btn');
    const picker        = document.getElementById('meal-day-picker');
    const pickerPanel   = picker ? picker.querySelector('.meal-day-picker-panel') : null;
    const pickerClose   = document.getElementById('meal-day-picker-close');

    if (openBtn)   openBtn.addEventListener('click', openMealPlanner);
    if (closeBtn)  closeBtn.addEventListener('click', closeMealPlanner);
    if (overlay)   overlay.addEventListener('click', (e) => {
        if (panel && !panel.contains(e.target)) closeMealPlanner();
    });
    // "Suggest with AI" opens the preference sheet first
    if (suggestBtn) suggestBtn.addEventListener('click', openPlanPrefs);

    // Preference sheet: mood chips (single-select)
    document.querySelectorAll('#mp-mood-chips .mp-pref-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const mood = chip.getAttribute('data-mood');
            planPrefs.mood = planPrefs.mood === mood ? null : mood;
            document.querySelectorAll('#mp-mood-chips .mp-pref-chip')
                .forEach(c => {
                    const selected = c.getAttribute('data-mood') === planPrefs.mood;
                    c.classList.toggle('mp-pref-selected', selected);
                    c.setAttribute('aria-pressed', selected ? 'true' : 'false');
                });
            synth.playDialClick();
        });
    });

    // Preference sheet: cuisine chips (multi-select)
    document.querySelectorAll('#mp-cuisine-chips .mp-pref-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cuisine = chip.getAttribute('data-cuisine');
            if (planPrefs.cuisines.has(cuisine)) {
                planPrefs.cuisines.delete(cuisine);
                chip.classList.remove('mp-pref-selected');
                chip.setAttribute('aria-pressed', 'false');
            } else {
                planPrefs.cuisines.add(cuisine);
                chip.classList.add('mp-pref-selected');
                chip.setAttribute('aria-pressed', 'true');
            }
            synth.playDialClick();
        });
    });

    // Preference sheet: cancel + generate
    const prefsCancel   = document.getElementById('mp-prefs-cancel');
    const prefsGenerate = document.getElementById('mp-prefs-go');
    if (prefsCancel)   prefsCancel.addEventListener('click', closePlanPrefs);
    if (prefsGenerate) prefsGenerate.addEventListener('click', suggestMealPlanWithAI);

    if (clearBtn)  clearBtn.addEventListener('click', () => {
        appState.mealPlan = {};
        saveMealPlan();
        renderMealPlannerGrid();
        synth.playDialClick();
    });
    if (pickerClose) pickerClose.addEventListener('click', closeMealDayPicker);
    if (picker)      picker.addEventListener('click', (e) => {
        if (pickerPanel && !pickerPanel.contains(e.target)) closeMealDayPicker();
    });

    const confirmYes = document.getElementById('mp-cook-confirm-yes');
    const confirmNo  = document.getElementById('mp-cook-confirm-no');

    if (confirmNo) confirmNo.addEventListener('click', hideCookFromPlanConfirm);

    if (confirmYes) confirmYes.addEventListener('click', () => {
        const banner = document.getElementById('mp-cook-confirm');
        const meal = banner ? banner._pendingMeal : null;
        if (!meal) { hideCookFromPlanConfirm(); return; }

        // Pre-fill ingredients from key_ingredients, falling back to an empty list
        const keyIngs = (meal.key_ingredients || []).filter(Boolean);
        if (keyIngs.length > 0) {
            appState.ingredients = keyIngs;
            DOM.ingredientsInput.value = keyIngs.join(', ');
            renderIngredientsTags();
        }

        // Store the meal name so the backend can target this exact dish
        appState.planRecipeHint = meal.meal_name || meal.title || null;

        hideCookFromPlanConfirm();
        closeMealPlanner();
        startCooking();
    });
}
