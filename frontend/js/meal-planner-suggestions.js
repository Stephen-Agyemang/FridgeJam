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
