function resetEntertainZone() {
    stopMiniGame();
    entertainChoice = null;
    pendingRecipeData = null;
    jokesViewedCount = 0; // Reset joke interaction count

    const ez         = document.getElementById('entertain-zone');
    const picker     = document.getElementById('ez-picker');
    const jokesPanel = document.getElementById('ez-panel-jokes');
    const gamePanel  = document.getElementById('ez-panel-game');
    const banner     = document.getElementById('ready-banner');
    const reminder   = document.getElementById('ready-reminder');

    if (ez)         ez.style.opacity = '1';
    if (picker)     picker.classList.remove('hidden');
    if (jokesPanel) jokesPanel.classList.add('hidden');
    if (gamePanel)  gamePanel.classList.add('hidden');
    if (banner)     banner.classList.add('hidden');
    if (reminder)   reminder.remove();
}

// ── Ready Banner ──
function showReadyBanner(onSeeRecipe) {
    // Dim the entertainment zone slightly — still usable
    const ez = document.getElementById('entertain-zone');
    if (ez) ez.style.opacity = '0.5';

    const banner = document.getElementById('ready-banner');
    if (!banner) return;

    banner.classList.remove('hidden');

    // "See My Recipe" — navigate immediately
    const seeBtn = document.getElementById('ready-see-btn');
    if (seeBtn) {
        seeBtn.onclick = () => {
            resetEntertainZone();
            onSeeRecipe();
        };
    }

    // "Keep Playing" — dismiss the banner, restore zone brightness, save callback
    const keepBtn = document.getElementById('ready-keep-btn');
    if (keepBtn) {
        keepBtn.onclick = () => {
            banner.classList.add('hidden');
            if (ez) ez.style.opacity = '1';

            // Show a subtle sticky reminder in the zone header
            showReadyReminder(onSeeRecipe);
        };
    }

    synth.playDinnerBell();
}

// Small persistent reminder bar that stays after "Keep Playing"
function showReadyReminder(onSeeRecipe) {
    // Remove any existing reminder
    const existing = document.getElementById('ready-reminder');
    if (existing) existing.remove();

    // Insert the reminder as a SIBLING after entertain-zone, not inside it
    // This avoids overflow:hidden clipping issues inside the zone
    const stove = document.querySelector('.stove-station');
    if (!stove) return;

    const reminder = document.createElement('div');
    reminder.id = 'ready-reminder';
    reminder.className = 'ready-reminder';
    reminder.innerHTML = `
        <span>🍽️ Your dish is ready whenever you are!</span>
        <button class="ready-reminder-btn" id="ready-reminder-btn">View Recipe →</button>
    `;

    // Append at the end of stove-station (after entertain-zone)
    stove.appendChild(reminder);

    const btn = document.getElementById('ready-reminder-btn');
    if (btn) {
        btn.onclick = () => {
            resetEntertainZone();
            onSeeRecipe();
        };
    }
}
