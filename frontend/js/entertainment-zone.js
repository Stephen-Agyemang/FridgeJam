function pickEntertain(choice) {
    entertainChoice = choice;
    const picker = document.getElementById('ez-picker');
    const jokesPanel = document.getElementById('ez-panel-jokes');
    const gamePanel  = document.getElementById('ez-panel-game');
    if (picker)     picker.classList.add('hidden');
    if (jokesPanel) jokesPanel.classList.add('hidden');
    if (gamePanel)  gamePanel.classList.add('hidden');

    if (choice === 'jokes') {
        jokeIndex = Math.floor(Math.random() * FOOD_JOKES.length);
        loadJoke(jokeIndex);
        if (jokesPanel) jokesPanel.classList.remove('hidden');
    } else {
        startMiniGame();
        if (gamePanel) gamePanel.classList.remove('hidden');
    }
}

function resetEntertainPicker() {
    stopMiniGame();
    entertainChoice = null;
    const picker = document.getElementById('ez-picker');
    const jokesPanel = document.getElementById('ez-panel-jokes');
    const gamePanel  = document.getElementById('ez-panel-game');
    if (jokesPanel) jokesPanel.classList.add('hidden');
    if (gamePanel)  gamePanel.classList.add('hidden');
    if (picker)     picker.classList.remove('hidden');
}
