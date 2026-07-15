/* FridgeJam theme toggle */

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem('theme');
    } catch (err) {
        console.warn('[FridgeJam] Theme preference could not be read:', err);
    }

    const systemPrefersDark = window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;

    const setDarkTheme = (isDark) => {
        if (isDark) {
            document.body.classList.add('dark-theme');
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.setAttribute('data-theme', 'light');
        }
        updateThemeToggleUI(isDark);
    };

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        setDarkTheme(true);
    } else {
        setDarkTheme(false);
    }

    themeToggle.addEventListener('click', () => {
        const isDark = !document.body.classList.contains('dark-theme');
        setDarkTheme(isDark);
        try {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        } catch (err) {
            console.warn('[FridgeJam] Theme preference could not be saved:', err);
        }
        queueCloudSync();
        synth.playDialClick();
    });
}

function updateThemeToggleUI(isDark) {
    const toggleIcon = document.querySelector('#theme-toggle .toggle-icon');
    const toggleText = document.querySelector('#theme-toggle .toggle-text');
    if (toggleIcon) toggleIcon.textContent = isDark ? '☀️' : '🌙';
    if (toggleText) toggleText.textContent = isDark ? 'Morning Sun' : 'Twilight Hearth';

    const dividerSun = document.querySelector('.recipe-box-divider-sun');
    if (dividerSun) {
        dividerSun.textContent = isDark ? '🌙' : '☀️';
    }
}
