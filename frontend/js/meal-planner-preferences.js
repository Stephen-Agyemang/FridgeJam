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
