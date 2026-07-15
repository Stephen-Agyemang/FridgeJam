function initLeaderboard() {
    if (leaderboardReady || !window.firebase) return;
    try {
        if (!initFirebaseServices() || !authDb) return;
        leaderboardDb = authDb;
        leaderboardReady = true;
    } catch (err) {
        console.warn("[FridgeJam] Leaderboard unavailable:", err);
        leaderboardReady = false;
    }
}

function renderLeaderboardRows(scores) {
    const list = document.getElementById('game-leaderboard-list');
    if (!list) return;

    if (!scores || scores.length === 0) {
        list.innerHTML = '<li class="leaderboard-muted">No scores yet. Be the first to catch something.</li>';
        return;
    }

    list.innerHTML = scores.map((entry, index) => `
        <li>
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${escapeHtml(entry.nickname || 'Chef')}</span>
            <strong>${Number(entry.score || 0)}</strong>
        </li>
    `).join('');
}

async function loadLeaderboard() {
    initLeaderboard();
    const list = document.getElementById('game-leaderboard-list');
    if (list) list.innerHTML = '<li class="leaderboard-muted">Loading top catches...</li>';

    if (!leaderboardReady || !leaderboardDb) {
        if (list) list.innerHTML = '<li class="leaderboard-muted">Leaderboard needs Firestore rules before it can load.</li>';
        return;
    }

    try {
        const snapshot = await leaderboardDb
            .collection('game_scores')
            .orderBy('score', 'desc')
            .limit(5)
            .get();
        const scores = snapshot.docs.map(doc => doc.data());
        renderLeaderboardRows(scores);
    } catch (err) {
        console.warn("[FridgeJam] Could not load leaderboard:", err);
        if (list) list.innerHTML = '<li class="leaderboard-muted">Leaderboard is locked until rules are published.</li>';
    }
}

function updateLeaderboardSubmitState() {
    const form = document.getElementById('leaderboard-submit-form');
    const input = document.getElementById('leaderboard-name-input');
    const note = document.getElementById('leaderboard-submit-note');
    if (!form) return;

    const canSubmit = gameRankedLocked && gameRankedScore > 0 && leaderboardSubmittedScore === 0;
    form.classList.toggle('hidden', !canSubmit);

    if (note) {
        note.textContent = gameRankedLocked
            ? `Your leaderboard score is ${gameRankedScore}. Recording stopped when you made your 5th miss, but you can keep playing for fun.`
            : `Leaderboard recording stops at your 5th missed ingredient. You can keep playing after that for fun.`;
    }

    if (input && canSubmit && !input.value.trim()) {
        input.value = localStorage.getItem('fridgejamLeaderboardName') || '';
    }
}

function sanitizeNickname(value) {
    return value
        .trim()
        .replace(/[^\w\s.-]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 18);
}

async function submitLeaderboardScore(e) {
    e.preventDefault();
    initLeaderboard();

    if (!leaderboardReady || !leaderboardDb) {
        showToast("Leaderboard is not ready yet. Check Firestore rules.");
        return;
    }

    if (!gameRankedLocked) {
        showToast("Leaderboard score locks after 5 missed ingredients.");
        return;
    }

    if (gameRankedScore <= 0) {
        showToast("Catch at least one ingredient before the 5th miss!");
        return;
    }

    const input = document.getElementById('leaderboard-name-input');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const nickname = sanitizeNickname(input ? input.value : '');

    if (nickname.length < 2) {
        showToast("Use at least 2 characters for your nickname.");
        return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
        await leaderboardDb.collection('game_scores').add({
            nickname,
            score: gameRankedScore,
            gameType: 'catch-ingredients',
            missesLimit: GAME_RANKED_MISS_LIMIT,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        leaderboardSubmittedScore = gameRankedScore;
        localStorage.setItem('fridgejamLeaderboardName', nickname);
        queueCloudSync();
        updateLeaderboardSubmitState();
        await loadLeaderboard();
        showToast("Score saved to the leaderboard! 🏆");
    } catch (err) {
        console.warn("[FridgeJam] Could not save leaderboard score:", err);
        showToast("Score could not be saved yet. Check Firestore rules.");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}
