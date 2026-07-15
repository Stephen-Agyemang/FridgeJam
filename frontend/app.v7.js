/* FridgeJam app bootstrap */

// Run on boot
// Silently warm up the Cloud Run backend on page load so the first recipe
// request doesn't hit a cold-start timeout (Cloud Run scales to zero when idle).
function warmUpBackend() {
    fetch('/api/health').catch(() => {});
}

function runStartupStep(name, fn) {
    if (typeof fn !== 'function') {
        console.warn(`[FridgeJam] ${name} is not available during startup.`);
        return;
    }

    try {
        fn();
    } catch (err) {
        console.error(`[FridgeJam] ${name} failed during startup:`, err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const startupSteps = [
        'warmUpBackend',
        'loadFavorites',
        'loadMealPlan',
        'initAuthEvents',
        'initTheme',
        'initMealPlannerEvents',
        'initEvents',
        'initScanCameraEvents',
        'initVoiceInput',
        'initShoppingListEvents',
        'initEntertainmentZoneEvents',
        'renderIngredientsTags',
        'initAuth'
    ];

    startupSteps.forEach(name => runStartupStep(name, globalThis[name]));
    runStartupStep('showState', () => {
        if (typeof globalThis.showState === 'function') {
            globalThis.showState('input');
        }
    });
});
