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
