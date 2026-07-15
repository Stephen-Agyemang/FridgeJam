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
