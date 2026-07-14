/* FridgeJam app bootstrap */

// Run on boot
// Silently warm up the Cloud Run backend on page load so the first recipe
// request doesn't hit a cold-start timeout (Cloud Run scales to zero when idle).
function warmUpBackend() {
    fetch('/api/health').catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    warmUpBackend();
    loadFavorites();
    loadMealPlan();
    initEvents();
    initScanCameraEvents();
    initVoiceInput();
    initShoppingListEvents();
    initMealPlannerEvents();
    initEntertainmentZoneEvents();
    initAuthEvents();
    renderIngredientsTags();
    initTheme();
    initAuth();
    showState('input');
});
