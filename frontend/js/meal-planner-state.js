function normalizeMealPlanDay(day) {
    const normalized = String(day || '').trim().toLowerCase();
    const match = DAYS_OF_WEEK.find(d => (
        d.toLowerCase() === normalized ||
        d.slice(0, 3).toLowerCase() === normalized.slice(0, 3)
    ));
    return match || null;
}

function isMealPlanSuggestion(meal) {
    return Boolean(meal && (
        meal.isAiStub ||
        (
            !meal.saved_image_url &&
            (
                Boolean(meal.description) ||
                (Array.isArray(meal.key_ingredients) && meal.key_ingredients.length > 0)
            )
        )
    ));
}

function normalizeStoredMealPlan(plan) {
    const normalizedPlan = {};
    Object.entries(plan || {}).forEach(([day, meal]) => {
        const normalizedDay = normalizeMealPlanDay(day) || day;
        if (!meal || typeof meal !== 'object') return;
        normalizedPlan[normalizedDay] = {
            ...meal,
            isAiStub: isMealPlanSuggestion(meal)
        };
    });
    return normalizedPlan;
}

function loadMealPlan() {
    try {
        const saved = localStorage.getItem('mealPlan');
        appState.mealPlan = saved ? normalizeStoredMealPlan(JSON.parse(saved)) : {};
        if (saved) saveMealPlan();
    } catch (e) {
        appState.mealPlan = {};
    }
}

function saveMealPlan() {
    localStorage.setItem('mealPlan', JSON.stringify(appState.mealPlan));
    queueCloudSync();
}

function openMealPlanner() {
    const overlay = document.getElementById('meal-planner-overlay');
    if (overlay) overlay.classList.remove('hidden');
    renderMealPlannerGrid();
    synth.playDrawerSlide();
}

function closeMealPlanner() {
    const overlay = document.getElementById('meal-planner-overlay');
    if (overlay) overlay.classList.add('hidden');
    closeMealDayPicker();
}

function renderMealPlannerGrid() {
    const grid = document.getElementById('meal-planner-grid');
    if (!grid) return;
    grid.innerHTML = '';

    DAYS_OF_WEEK.forEach(day => {
        const meal = appState.mealPlan[day] || null;
        const col  = document.createElement('div');
        col.className = 'meal-planner-day-col';

        if (meal) {
            const isPlanSuggestion = isMealPlanSuggestion(meal);
            const title = escapeHtml(meal.meal_name || meal.title || 'Untitled');
            const time  = meal.cooking_time ? `<span class="mp-meal-time">⏱️ ${escapeHtml(meal.cooking_time)}</span>` : '';
            const desc  = isPlanSuggestion && meal.description
                ? `<p class="mp-meal-desc">${escapeHtml(meal.description)}</p>` : '';
            const thumb = !isPlanSuggestion && meal.saved_image_url
                ? `<img class="mp-meal-thumb" src="${meal.saved_image_url}" alt="${title}" onerror="this.style.display='none'">`
                : `<div class="mp-meal-emoji">${isPlanSuggestion ? '✨' : '🍽️'}</div>`;
            const cookBtn = isPlanSuggestion
                ? `<button class="mp-cook-btn" data-day="${day}">Cook this →</button>` : '';
            const cardClass = isPlanSuggestion ? 'mp-meal-card mp-ai-meal-card' : 'mp-meal-card';

            col.innerHTML = `
                <div class="mp-day-label">${day.slice(0, 3)}</div>
                <div class="${cardClass}" data-day="${day}">
                    ${thumb}
                    <div class="mp-meal-info">
                        <p class="mp-meal-title">${title}</p>
                        ${desc}${time}${cookBtn}
                    </div>
                    <button class="mp-remove-btn" data-day="${day}" aria-label="Remove ${day} meal">✕</button>
                </div>
            `;
        } else {
            col.innerHTML = `
                <div class="mp-day-label">${day.slice(0, 3)}</div>
                <div class="mp-empty-slot">
                    <button class="mp-add-btn" data-day="${day}" aria-label="Add meal for ${day}">
                        <span class="mp-add-icon">+</span>
                        <span class="mp-add-text">Add meal</span>
                    </button>
                </div>
            `;
        }

        grid.appendChild(col);
    });

    grid.querySelectorAll('.mp-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.getAttribute('data-day');
            delete appState.mealPlan[day];
            saveMealPlan();
            renderMealPlannerGrid();
            synth.playDialClick();
        });
    });

    grid.querySelectorAll('.mp-add-btn').forEach(btn => {
        btn.addEventListener('click', () => openMealDayPicker(btn.getAttribute('data-day')));
    });

    grid.querySelectorAll('.mp-cook-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const day = btn.getAttribute('data-day');
            const meal = appState.mealPlan[day];
            if (meal) showCookFromPlanConfirm(meal);
        });
    });

    grid.querySelectorAll('.mp-ai-meal-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const day = card.getAttribute('data-day');
            const meal = appState.mealPlan[day];
            if (meal) showCookFromPlanConfirm(meal);
        });
    });
}

function openMealDayPicker(day) {
    const picker     = document.getElementById('meal-day-picker');
    const pickerTitle = document.getElementById('meal-day-picker-title');
    const pickerList = document.getElementById('meal-day-picker-list');
    if (!picker || !pickerList) return;

    if (pickerTitle) pickerTitle.textContent = `Add meal for ${day}`;
    picker.setAttribute('data-day', day);
    pickerList.innerHTML = '';

    if (appState.favorites.length === 0) {
        pickerList.innerHTML = '<p class="mp-picker-empty">Save recipes to your Recipe Box first! ❤️</p>';
    } else {
        appState.favorites.forEach(recipe => {
            const btn = document.createElement('button');
            btn.className = 'mp-picker-item';
            const thumb = recipe.saved_image_url
                ? `<img class="mp-picker-thumb" src="${recipe.saved_image_url}" alt="" onerror="this.style.display='none'">`
                : '<span class="mp-picker-emoji">🍽️</span>';
            btn.innerHTML = `${thumb}<span class="mp-picker-name">${escapeHtml(recipe.title)}</span>`;
            btn.addEventListener('click', () => {
                appState.mealPlan[day] = { ...recipe, meal_name: recipe.title };
                saveMealPlan();
                closeMealDayPicker();
                renderMealPlannerGrid();
                synth.playDialClick();
            });
            pickerList.appendChild(btn);
        });
    }

    picker.classList.remove('hidden');
}

function closeMealDayPicker() {
    const picker = document.getElementById('meal-day-picker');
    if (picker) picker.classList.add('hidden');
}
