function initEntertainmentZoneEvents() {
    const leaderboardForm = document.getElementById('leaderboard-submit-form');
    if (leaderboardForm) {
        leaderboardForm.addEventListener('submit', submitLeaderboardScore);
    }

    const leaderboardRefreshBtn = document.getElementById('leaderboard-refresh-btn');
    if (leaderboardRefreshBtn) {
        leaderboardRefreshBtn.addEventListener('click', loadLeaderboard);
    }
}
