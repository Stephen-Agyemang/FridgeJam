/* FridgeJam cooking step timers */

const activeTimers = {};

function parseStepDuration(text) {
    // "X to Y hours/minutes/seconds" → take midpoint. "X hours/minutes/seconds" → exact.
    const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:to\s*(\d+(?:\.\d+)?)\s*)?hours?/i);
    if (hourMatch) {
        const lo = parseFloat(hourMatch[1]);
        const hi = hourMatch[2] ? parseFloat(hourMatch[2]) : lo;
        return Math.round(((lo + hi) / 2) * 3600);
    }
    const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:to\s*(\d+(?:\.\d+)?)\s*)?min(?:utes?)?/i);
    if (minMatch) {
        const lo = parseFloat(minMatch[1]);
        const hi = minMatch[2] ? parseFloat(minMatch[2]) : lo;
        return Math.round(((lo + hi) / 2) * 60);
    }
    const secMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:to\s*(\d+(?:\.\d+)?)\s*)?secs?(?:onds?)?/i);
    if (secMatch) {
        const lo = parseFloat(secMatch[1]);
        const hi = secMatch[2] ? parseFloat(secMatch[2]) : lo;
        return Math.round((lo + hi) / 2);
    }
    return null;
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
}

function formatCountdown(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function clearAllTimers() {
    Object.values(activeTimers).forEach(id => clearInterval(id));
    Object.keys(activeTimers).forEach(k => delete activeTimers[k]);
}

async function startStepTimer(btn, totalSeconds, stepIdx, stepText) {
    // Tap again while running → cancel
    if (activeTimers[stepIdx]) {
        clearInterval(activeTimers[stepIdx]);
        delete activeTimers[stepIdx];
        btn.textContent = `⏱ ${formatDuration(totalSeconds)}`;
        btn.classList.remove('timer-running', 'timer-done');
        return;
    }

    // Ask for notification permission on first use (non-blocking)
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    let remaining = totalSeconds;
    btn.textContent = `⏹ ${formatCountdown(remaining)}`;
    btn.classList.add('timer-running');

    activeTimers[stepIdx] = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(activeTimers[stepIdx]);
            delete activeTimers[stepIdx];
            btn.textContent = '✅ Done!';
            btn.classList.remove('timer-running');
            btn.classList.add('timer-done');

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('FridgeJam — Timer Done!', {
                    body: stepText.length > 80 ? stepText.slice(0, 77) + '…' : stepText,
                    icon: '/favicon.ico'
                });
            }
            if (synth && typeof synth.playBubble === 'function') synth.playBubble();

            // Auto-reset button after 4 seconds
            setTimeout(() => {
                btn.textContent = `⏱ ${formatDuration(totalSeconds)}`;
                btn.classList.remove('timer-done');
            }, 4000);
        } else {
            btn.textContent = `⏹ ${formatCountdown(remaining)}`;
        }
    }, 1000);
}

