/* FridgeJam scan and camera input */

// ── Fridge Photo Scanner ──────────────────────────────────────────────────
// Opens live camera modal (with torch on supported devices), falls back to
// file upload. After Gemini scans the image, shows a review step so the
// user can verify detected ingredients before they're added to the list.

let cameraStream = null;
let torchOn = false;

function closeCameraModal() {
    const modal = document.getElementById('camera-modal');
    if (modal) modal.classList.add('hidden');
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    torchOn = false;
}

async function openCameraModal() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-preview');
    const torchBtn = document.getElementById('camera-torch-btn');
    const title = document.querySelector('.camera-modal-title');
    const captureBtn = document.getElementById('camera-capture-btn');
    if (!modal || !video) return;

    if (title) title.textContent = appState.cookMode === 'dish' ? 'Scan Food Image' : 'Scan Your Fridge';
    if (captureBtn) captureBtn.textContent = appState.cookMode === 'dish' ? '📸 Capture Food' : '📸 Capture';
    modal.classList.remove('hidden');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });
        video.srcObject = cameraStream;

        // Enable torch button only if the device supports it
        const track = cameraStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
            torchBtn.classList.remove('hidden');
            torchBtn.onclick = async () => {
                torchOn = !torchOn;
                await track.applyConstraints({ advanced: [{ torch: torchOn }] });
                torchBtn.textContent = torchOn ? '🔦 Torch: On' : '🔦 Torch: Off';
                torchBtn.classList.toggle('torch-active', torchOn);
            };
        } else {
            torchBtn.classList.add('hidden');
        }
    } catch (_) {
        // Camera permission denied or unavailable — fall back to file upload
        closeCameraModal();
        DOM.fridgePhotoInput.click();
    }
}

function captureFrameFromCamera() {
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('camera-canvas');
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
}

async function runScan(fileOrBlob) {
    const isDishScan = appState.cookMode === 'dish';
    const scanOverlay = document.createElement('div');
    scanOverlay.className = 'scan-overlay';
    scanOverlay.innerHTML = `
        <div class="scan-overlay-content">
            <div class="scanner-laser"></div>
            <div class="scan-spinner">📸</div>
            <h3 style="font-family:var(--font-display);font-weight:700;margin-bottom:8px;">${isDishScan ? 'Reading food image...' : 'Scanning ingredients...'}</h3>
            <p style="font-family:var(--font-body);font-size:0.9rem;color:var(--text-secondary);">${isDishScan ? 'Gemini is figuring out what this dish looks like and how to recreate it...' : 'Gemini is carefully identifying everything it can see...'}</p>
        </div>`;
    document.body.appendChild(scanOverlay);

    try {
        const formData = new FormData();
        formData.append('file', fileOrBlob, isDishScan ? 'food.jpg' : 'fridge.jpg');
        const response = await fetch(isDishScan ? '/api/analyze-food-image' : '/api/scan', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Scan failed');
        const data = await response.json();
        document.body.removeChild(scanOverlay);

        if (isDishScan) {
            applyFoodImageAnalysis(data);
            return;
        }

        const detected = data.ingredients || [];
        if (detected.length > 0) {
            showScanReview(detected);
        } else {
            showToast("Couldn't spot any ingredients — try better lighting or a closer angle.");
        }
    } catch (err) {
        console.error('Scanning failed:', err);
        if (document.body.contains(scanOverlay)) document.body.removeChild(scanOverlay);
        showToast(isDishScan ? "The food scanner had a glitch. Please try another photo!" : "The fridge scanner had a glitch. Please try again!");
    }
}

function applyFoodImageAnalysis(data) {
    const dish = (data.detected_dish || '').trim();
    const styleNotes = (data.style_notes || '').trim();
    const recipeHint = (data.recipe_hint || '').trim();
    const visibleIngredients = Array.isArray(data.visible_ingredients) ? data.visible_ingredients : [];

    if (!dish && !recipeHint) {
        showToast("I couldn't confidently identify a dish from that image. Try a closer food photo.");
        return;
    }

    if (DOM.dishTargetInput && dish) {
        DOM.dishTargetInput.value = dish;
        appState.dishTarget = dish;
    }

    appState.dishImageHint = [recipeHint, styleNotes]
        .filter(Boolean)
        .join(' ');

    if (visibleIngredients.length > 0) {
        commitIngredientsToList(visibleIngredients, 'food image');
    }

    updateInputTextareaAndSync();
    showToast(dish ? `Looks like ${dish}. I can help you cook something like it. 🍽️` : "Food image read. I can help you cook something like it. 🍽️");
}

function showScanReview(ingredients) {
    const modal = document.getElementById('scan-review-modal');
    const list = document.getElementById('scan-review-list');
    if (!modal || !list) return;

    list.innerHTML = ingredients.map((ing, i) => `
        <label class="scan-review-item">
            <input type="checkbox" class="scan-review-check" data-ing="${escapeHtml(ing)}" checked>
            <span class="scan-review-ing">${escapeHtml(ing)}</span>
        </label>
    `).join('');

    modal.classList.remove('hidden');

    document.getElementById('scan-review-confirm').onclick = () => {
        const checked = [...list.querySelectorAll('.scan-review-check:checked')]
            .map(cb => cb.dataset.ing);
        modal.classList.add('hidden');
        commitIngredientsToList(checked, 'scan');
    };

    document.getElementById('scan-review-cancel').onclick = () => {
        modal.classList.add('hidden');
    };
}

function initScanCameraEvents() {
    if (DOM.btnScanPhoto) {
        DOM.btnScanPhoto.addEventListener('click', () => {
            if (synth && typeof synth.playDialClick === 'function') synth.playDialClick();
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                openCameraModal();
            } else {
                DOM.fridgePhotoInput.click();
            }
        });
    }

    const cameraCaptureBtn = document.getElementById('camera-capture-btn');
    if (cameraCaptureBtn) {
        cameraCaptureBtn.addEventListener('click', async () => {
            const blob = await captureFrameFromCamera();
            closeCameraModal();
            if (blob) runScan(blob);
        });
    }

    const cameraCloseBtn = document.getElementById('camera-close-btn');
    if (cameraCloseBtn) cameraCloseBtn.addEventListener('click', closeCameraModal);

    const cameraUploadFallback = document.getElementById('camera-upload-fallback');
    if (cameraUploadFallback) {
        cameraUploadFallback.addEventListener('click', () => {
            closeCameraModal();
            DOM.fridgePhotoInput.click();
        });
    }

    if (DOM.fridgePhotoInput) {
        DOM.fridgePhotoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            DOM.fridgePhotoInput.value = '';
            await runScan(file);
        });
    }
}
