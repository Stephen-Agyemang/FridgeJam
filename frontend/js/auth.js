/* FridgeJam account auth and cloud sync */

var auth = null;
var authDb = null;
var authReady = false;
var currentUser = null;
var phoneConfirmationResult = null;
var syncTimer = null;
var isApplyingCloudData = false;

function initFirebaseServices() {
    if (!window.firebase) return false;
    try {
        if (!firebase.apps.length) {
            const firebaseConfig = window.FRIDGEJAM_FIREBASE_CONFIG;
            if (!firebaseConfig || !firebaseConfig.projectId) {
                console.warn("[FridgeJam] Missing Firebase config. Create frontend/firebase-config.js from firebase-config.example.js.");
                return false;
            }
            firebase.initializeApp(firebaseConfig);
        }
        authDb = firebase.firestore ? firebase.firestore() : null;
        auth = firebase.auth ? firebase.auth() : null;
        return true;
    } catch (err) {
        console.warn("[FridgeJam] Firebase unavailable:", err);
        return false;
    }
}

function getLocalAppData() {
    return {
        favorites: appState.favorites || [],
        mealPlan: appState.mealPlan || {},
        preferences: {
            theme: localStorage.getItem('theme') || null,
            leaderboardName: localStorage.getItem('fridgejamLeaderboardName') || null
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
}

function mergeRecipes(localRecipes, cloudRecipes) {
    const byTitle = new Map();
    [...(cloudRecipes || []), ...(localRecipes || [])].forEach(recipe => {
        if (!recipe || !recipe.title) return;
        const key = recipe.title.toLowerCase();
        const existing = byTitle.get(key);
        if (!existing || new Date(recipe.saved_at || 0) > new Date(existing.saved_at || 0)) {
            byTitle.set(key, recipe);
        }
    });
    return Array.from(byTitle.values());
}

function mergeAppData(localData, cloudData) {
    const localPlan = localData.mealPlan || {};
    const cloudPlan = cloudData.mealPlan || {};
    return {
        favorites: mergeRecipes(localData.favorites, cloudData.favorites),
        mealPlan: Object.keys(localPlan).length ? localPlan : cloudPlan,
        preferences: {
            ...(cloudData.preferences || {}),
            ...(localData.preferences || {})
        }
    };
}

function applySyncedAppData(data) {
    isApplyingCloudData = true;
    appState.favorites = Array.isArray(data.favorites) ? data.favorites : [];
    appState.mealPlan = normalizeStoredMealPlan(data.mealPlan || {});
    localStorage.setItem('favorites', JSON.stringify(appState.favorites));
    localStorage.setItem('mealPlan', JSON.stringify(appState.mealPlan));

    const prefs = data.preferences || {};
    if (prefs.theme) localStorage.setItem('theme', prefs.theme);
    if (prefs.leaderboardName) localStorage.setItem('fridgejamLeaderboardName', prefs.leaderboardName);

    updateFavoritesBadge();
    renderMealPlannerGrid();
    initTheme();
    isApplyingCloudData = false;
}

function userAppDataRef() {
    if (!currentUser || !authDb) return null;
    return authDb.collection('users').doc(currentUser.uid).collection('private').doc('appData');
}

async function syncUserDataNow() {
    const ref = userAppDataRef();
    if (!ref || isApplyingCloudData) return;
    try {
        await ref.set(getLocalAppData(), { merge: true });
        showToast("Your Recipe Box is synced.");
    } catch (err) {
        console.warn("[FridgeJam] Sync failed:", err);
        showToast("Sync could not finish yet. Check Firebase rules.");
    }
}

function queueCloudSync() {
    if (!currentUser || !authDb || isApplyingCloudData) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncUserDataNow().catch(err => console.warn("[FridgeJam] Background sync failed:", err));
    }, 700);
}

async function loadAndMergeUserData() {
    const ref = userAppDataRef();
    if (!ref) return;
    try {
        const localData = getLocalAppData();
        const snap = await ref.get();
        const merged = snap.exists ? mergeAppData(localData, snap.data() || {}) : localData;
        applySyncedAppData(merged);
        await ref.set(getLocalAppData(), { merge: true });
    } catch (err) {
        console.warn("[FridgeJam] Could not load synced data:", err);
        showToast("Signed in, but cloud sync needs Firestore rules.");
    }
}

function updateAccountUI(user) {
    const btn = document.getElementById('account-btn');
    const btnIcon = document.getElementById('account-btn-icon');
    const btnText = document.getElementById('account-btn-text');
    const signedOut = document.getElementById('account-signed-out');
    const signedIn = document.getElementById('account-signed-in');
    const title = document.getElementById('account-modal-title');
    const subtitle = document.getElementById('account-modal-subtitle');
    const note = document.getElementById('account-modal-note');
    const name = document.getElementById('account-display-name');
    const email = document.getElementById('account-display-email');
    const avatar = document.getElementById('account-avatar');

    if (btn) btn.classList.toggle('account-signed-in', !!user);
    if (btnIcon) btnIcon.textContent = user ? '✅' : '👤';
    if (btnText) btnText.textContent = user ? 'Account' : 'Sign in to sync';
    if (signedOut) signedOut.classList.toggle('hidden', !!user);
    if (signedIn) signedIn.classList.toggle('hidden', !user);
    if (title) title.textContent = user ? 'Account sync' : 'Sign in to sync';
    if (subtitle) subtitle.textContent = user
        ? 'Your saved recipes, meal plan, and preferences can follow you across devices.'
        : 'Keep cooking as a guest, or sync your recipe box and meal plan across devices.';
    if (note) note.classList.toggle('hidden', !!user);
    if (name) name.textContent = user ? (user.displayName || 'FridgeJam cook') : '';
    if (email) email.textContent = user ? (user.email || user.phoneNumber || 'Sync is on') : '';
    if (avatar) avatar.textContent = user && user.displayName ? user.displayName.trim().charAt(0).toUpperCase() : '👤';
}

function openAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) modal.classList.add('hidden');
}

function renderRecipeBoxSyncPrompt() {
    if (currentUser) return '';
    return `
        <div class="recipe-box-sync-prompt">
            <div>
                <p class="recipe-box-sync-title">Save recipes across devices</p>
                <p class="recipe-box-sync-copy">Sign in once and FridgeJam will sync your Recipe Box and Meal Planner.</p>
            </div>
            <button type="button" class="recipe-box-sync-btn" id="recipe-box-sync-btn">Sign in to sync</button>
        </div>
    `;
}

function bindRecipeBoxSyncPrompt() {
    const btn = document.getElementById('recipe-box-sync-btn');
    if (btn) btn.addEventListener('click', openAccountModal);
}

async function signInWithProvider(providerName) {
    if (!authReady || !auth) {
        showToast("Firebase Auth is not configured yet.");
        return;
    }
    const provider = providerName === 'apple'
        ? new firebase.auth.OAuthProvider('apple.com')
        : new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        closeAccountModal();
    } catch (err) {
        console.warn(`[FridgeJam] ${providerName} sign-in failed:`, err);
        showToast("Sign-in could not finish. Check your Firebase Auth providers.");
    }
}

async function sendEmailMagicLink(e) {
    e.preventDefault();
    if (!authReady || !auth) {
        showToast("Firebase Auth is not configured yet.");
        return;
    }
    const input = document.getElementById('auth-email-input');
    const email = input ? input.value.trim() : '';
    if (!email) {
        showToast("Enter your email first.");
        return;
    }
    try {
        await auth.sendSignInLinkToEmail(email, {
            url: window.location.href.split('#')[0],
            handleCodeInApp: true
        });
        localStorage.setItem('fridgejamEmailForSignIn', email);
        showToast("Magic link sent. Check your email.");
    } catch (err) {
        console.warn("[FridgeJam] Email link failed:", err);
        showToast("Email link could not be sent. Check Firebase Auth settings.");
    }
}

async function finishEmailMagicLinkIfPresent() {
    if (!authReady || !auth || !auth.isSignInWithEmailLink(window.location.href)) return;
    let email = localStorage.getItem('fridgejamEmailForSignIn');
    if (!email) email = window.prompt('Confirm your email for FridgeJam sign-in');
    if (!email) return;
    try {
        await auth.signInWithEmailLink(email, window.location.href);
        localStorage.removeItem('fridgejamEmailForSignIn');
        window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
        console.warn("[FridgeJam] Email link sign-in failed:", err);
        showToast("Magic link sign-in could not finish.");
    }
}

function ensureRecaptchaVerifier() {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('auth-recaptcha', {
            size: 'invisible'
        });
    }
    return window.recaptchaVerifier;
}

async function sendPhoneCode(e) {
    e.preventDefault();
    if (!authReady || !auth) {
        showToast("Firebase Auth is not configured yet.");
        return;
    }
    const input = document.getElementById('auth-phone-input');
    const phoneNumber = input ? input.value.trim() : '';
    if (!phoneNumber.startsWith('+')) {
        showToast("Use international format, like +1 555 123 4567.");
        return;
    }
    try {
        phoneConfirmationResult = await auth.signInWithPhoneNumber(phoneNumber, ensureRecaptchaVerifier());
        const codeRow = document.getElementById('auth-phone-code-row');
        if (codeRow) codeRow.classList.remove('hidden');
        showToast("Verification code sent.");
    } catch (err) {
        console.warn("[FridgeJam] Phone sign-in failed:", err);
        showToast("Phone sign-in could not start. Check Firebase phone auth.");
    }
}

async function confirmPhoneCode() {
    const input = document.getElementById('auth-phone-code-input');
    const code = input ? input.value.trim() : '';
    if (!phoneConfirmationResult || !code) {
        showToast("Enter the verification code first.");
        return;
    }
    try {
        await phoneConfirmationResult.confirm(code);
        phoneConfirmationResult = null;
        closeAccountModal();
    } catch (err) {
        console.warn("[FridgeJam] Phone code verification failed:", err);
        showToast("That code did not work.");
    }
}

function handlePasskeyRequest() {
    if (!window.PublicKeyCredential) {
        showToast("This browser does not support passkeys yet.");
        return;
    }
    showToast("Passkeys need a WebAuthn server step. Add one after Firebase sign-in is stable.");
}

function initAuth() {
    authReady = initFirebaseServices() && !!auth;
    updateAccountUI(null);
    if (!authReady) return;

    finishEmailMagicLinkIfPresent();
    auth.onAuthStateChanged(async user => {
        currentUser = user;
        updateAccountUI(user);
        if (user) {
            await loadAndMergeUserData();
            showToast("Signed in. Sync is on.");
        }
    });
}

function initAuthEvents() {
    const accountBtn = document.getElementById('account-btn');
    const closeBtn = document.getElementById('account-modal-close');
    const modal = document.getElementById('account-modal');
    const panel = modal ? modal.querySelector('.account-modal-panel') : null;

    if (accountBtn) accountBtn.addEventListener('click', openAccountModal);
    if (closeBtn) closeBtn.addEventListener('click', closeAccountModal);
    if (modal) modal.addEventListener('click', e => {
        if (panel && !panel.contains(e.target)) closeAccountModal();
    });

    const googleBtn = document.getElementById('auth-google-btn');
    const appleBtn = document.getElementById('auth-apple-btn');
    const passkeyBtn = document.getElementById('auth-passkey-btn');
    const guestBtn = document.getElementById('auth-guest-btn');
    const emailForm = document.getElementById('auth-email-form');
    const phoneForm = document.getElementById('auth-phone-form');
    const phoneConfirm = document.getElementById('auth-phone-confirm');
    const syncNow = document.getElementById('auth-sync-now-btn');
    const signOut = document.getElementById('auth-signout-btn');

    if (googleBtn) googleBtn.addEventListener('click', () => signInWithProvider('google'));
    if (appleBtn) appleBtn.addEventListener('click', () => signInWithProvider('apple'));
    if (passkeyBtn) passkeyBtn.addEventListener('click', handlePasskeyRequest);
    if (guestBtn) guestBtn.addEventListener('click', closeAccountModal);
    if (emailForm) emailForm.addEventListener('submit', sendEmailMagicLink);
    if (phoneForm) phoneForm.addEventListener('submit', sendPhoneCode);
    if (phoneConfirm) phoneConfirm.addEventListener('click', confirmPhoneCode);
    if (syncNow) syncNow.addEventListener('click', syncUserDataNow);
    if (signOut) signOut.addEventListener('click', async () => {
        if (auth) await auth.signOut();
        closeAccountModal();
        showToast("Signed out. Guest data stays on this device.");
    });
}
