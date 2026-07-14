/* FridgeJam voice ingredient input */

let voiceRecognition = null;
let isListening = false;

function initVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = document.getElementById('btn-voice-input');

    if (!SpeechRecognition) {
        if (btn) btn.style.display = 'none';
        return;
    }

    voiceRecognition = new SpeechRecognition();
    voiceRecognition.continuous = false;
    voiceRecognition.interimResults = true;
    voiceRecognition.lang = 'en-US';

    voiceRecognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (const result of event.results) {
            if (result.isFinal) final += result[0].transcript;
            else interim += result[0].transcript;
        }

        const text = document.getElementById('voice-btn-text');
        if (text && (interim || final)) {
            text.textContent = interim || final;
        }

        if (final.trim()) {
            voiceRecognition._finalTranscript = final.trim();
        }
    };

    voiceRecognition.onend = () => {
        isListening = false;
        updateVoiceBtnState(false);
        const transcript = voiceRecognition._finalTranscript;
        voiceRecognition._finalTranscript = null;
        if (transcript) {
            if (appState.cookMode === 'dish') {
                applyDishVoiceTranscript(transcript);
            } else {
                showVoiceConfirm(transcript);
            }
        }
    };

    voiceRecognition.onerror = (event) => {
        isListening = false;
        updateVoiceBtnState(false);
        if (event.error === 'not-allowed') {
            showToast('Microphone access denied — please allow it in your browser settings.');
        } else if (event.error !== 'no-speech') {
            showToast('Microphone issue — please try again.');
        }
    };

    if (btn) {
        btn.addEventListener('click', async () => {
            if (isListening) {
                voiceRecognition.stop();
            } else {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    voiceRecognition.start();
                    isListening = true;
                    updateVoiceBtnState(true);
                    synth.playDialClick();
                } catch (e) {
                    showToast('Microphone access denied — please allow it in your browser settings.');
                }
            }
        });
    }
}

function applyDishVoiceTranscript(transcript) {
    const dish = cleanIngredientText(transcript).replace(/[.!?]$/, '').trim();
    if (!dish || dish.length < 2) {
        showToast("I didn't catch the dish name. Try saying it again.");
        return;
    }

    if (DOM.dishTargetInput) {
        DOM.dishTargetInput.value = dish;
        appState.dishTarget = dish;
    }
    appState.dishImageHint = '';
    updateInputTextareaAndSync();
    showToast(`Got it — ${dish}. 🍽️`);
}

function showVoiceConfirm(transcript) {
    const raw = transcript.split(/,|and\b|\bwith\b/i)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 1);

    const modal = document.getElementById('voice-confirm-modal');
    const list = document.getElementById('voice-confirm-list');
    if (!modal || !list || raw.length === 0) return;

    list.innerHTML = raw.map(ing => `
        <label class="voice-confirm-item">
            <input type="checkbox" class="voice-confirm-check" data-ing="${escapeHtml(ing)}" checked>
            <span class="voice-confirm-ing">${escapeHtml(ing)}</span>
        </label>
    `).join('');

    modal.classList.remove('hidden');

    document.getElementById('voice-confirm-add').onclick = () => {
        const checked = [...list.querySelectorAll('.voice-confirm-check:checked')]
            .map(cb => cb.dataset.ing);
        modal.classList.add('hidden');
        commitIngredientsToList(checked, 'voice');
    };

    document.getElementById('voice-confirm-cancel').onclick = () => {
        modal.classList.add('hidden');
    };
}

function updateVoiceBtnState(listening) {
    const btn = document.getElementById('btn-voice-input');
    const text = document.getElementById('voice-btn-text');
    if (!btn) return;
    btn.classList.toggle('listening', listening);
    if (text) text.textContent = listening ? 'Listening...' : (appState.cookMode === 'dish' ? 'Say dish' : 'Speak');
}
