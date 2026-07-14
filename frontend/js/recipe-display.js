/* FridgeJam recipe rendering, cooking timers, and PDF export */

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

// --- Render Recipe Details ---
function renderRecipeScreen(recipe, imageResult) {
    // 0. Reset Polaroid image and fallback presentation states
    DOM.dishPhotoImg.src = '';
    DOM.dishPhotoImg.classList.add('hidden');
    if (DOM.dishPhotoFallback) DOM.dishPhotoFallback.style.display = 'flex'; // explicit flex, not empty string

    // 1. Chef Badge & Emoji Fallback mapping
    const chefBadges = {
        budget: { emoji: "🍳", text: "Plated by Thrifty Chef Tony" },
        grandma: { emoji: "👵", text: "Plated by Grandma Marie" },
        chef: { emoji: "👨‍🍳", text: "Plated by Chef Pierre" },
        chloe: { emoji: "🥗", text: "Plated by Healthy Chef Chloe" }
    };
    
    const badgeInfo = chefBadges[recipe.selected_personality] || chefBadges.grandma;
    DOM.recipeChefBadge.innerHTML = `<span class="badge-emoji">${badgeInfo.emoji}</span> ${badgeInfo.text}`;
    
    // Set fallback dish icon based on title keywords
    const foodEmojis = ["🍲", "🍳", "🥗", "🥘", "🍕", "🍝", "🥙", "🥪", "🍰"];
    let selectedFallbackEmoji = "🍲";
    const titleLower = recipe.title.toLowerCase();
    
    if (titleLower.includes("egg") || titleLower.includes("scramble") || titleLower.includes("frittata") || titleLower.includes("omelet")) {
        selectedFallbackEmoji = "🍳";
    } else if (titleLower.includes("salad") || titleLower.includes("spinach") || titleLower.includes("greens")) {
        selectedFallbackEmoji = "🥗";
    } else if (titleLower.includes("fry") || titleLower.includes("curry") || titleLower.includes("skillet") || titleLower.includes("sauté")) {
        selectedFallbackEmoji = "🥘";
    } else if (titleLower.includes("pasta") || titleLower.includes("noodle") || titleLower.includes("spaghetti")) {
        selectedFallbackEmoji = "🍝";
    } else if (titleLower.includes("sandwich") || titleLower.includes("toast") || titleLower.includes("wrap")) {
        selectedFallbackEmoji = "🥪";
    } else {
        // Random pick
        selectedFallbackEmoji = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
    }
    DOM.fallbackEmoji.textContent = selectedFallbackEmoji;

    // 2. Set Dish Photo or Fallback
    if (imageResult && imageResult.success && imageResult.image_url) {
        console.log('[FridgeJam] Setting dish photo src, data length:', imageResult.image_url.length);
        DOM.dishPhotoImg.src = imageResult.image_url;
        DOM.dishPhotoImg.alt = recipe.title;
        DOM.dishPhotoImg.onload = () => console.log('[FridgeJam] Dish photo loaded successfully!');
        DOM.dishPhotoImg.onerror = () => {
            console.error('[FridgeJam] Dish photo FAILED to load — showing fallback');
            DOM.dishPhotoImg.classList.add('hidden');
            if (DOM.dishPhotoFallback) DOM.dishPhotoFallback.style.display = 'flex';
        };
        DOM.dishPhotoImg.classList.remove('hidden');
        if (DOM.dishPhotoFallback) DOM.dishPhotoFallback.style.display = 'none';
    } else {
        // Fallback to a gorgeous, themed public culinary photograph matching the dish title keywords
        const foodPhotos = [
            {
                category: "egg",
                keys: ["egg", "scramble", "frittata", "omelet", "breakfast", "benedict", "shakshuka", "quiche", "yolk", "whites", "sunny-side"],
                url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "salad",
                keys: ["salad", "spinach", "green", "cucumber", "veggie", "vegetable", "lettuce", "kale", "slaw", "caesar", "avocado"],
                url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "pasta",
                keys: ["pasta", "noodle", "spaghetti", "macaroni", "penne", "fettuccine", "lasagna", "ravioli", "carbonara", "bolognese", "pesto"],
                url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "soup",
                keys: ["soup", "stew", "broth", "chowder", "ramen", "pho", "minestrone", "bisque", "gumbo"],
                url: "https://images.unsplash.com/photo-1547592165-e1d17f57655c?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "sandwich",
                keys: ["sandwich", "toast", "wrap", "panini", "sourdough", "croissant", "bagel", "bruschetta"],
                url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "pancake",
                keys: ["pancake", "waffle", "oat", "oatmeal", "porridge", "french toast", "crepe"],
                url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "dessert",
                keys: ["cake", "cookie", "sweet", "chocolate", "dessert", "pastry", "pie", "brownie", "muffin", "tart", "ice cream"],
                url: "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "chicken",
                keys: ["chicken", "turkey", "poultry", "wing", "breast", "drumstick", "nugget"],
                url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "beef",
                keys: ["beef", "steak", "meat", "pork", "rib", "lamb", "chop", "ham", "bacon", "sausage", "meatball"],
                url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "fish",
                keys: ["fish", "salmon", "shrimp", "seafood", "prawn", "crab", "lobster", "tuna", "cod", "trout", "scallop"],
                url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "rice",
                keys: ["rice", "grain", "quinoa", "fried rice", "risotto", "paella", "pilaf"],
                url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "potato",
                keys: ["potato", "fry", "wedges", "hash brown", "tater", "sweet potato", "gnocchi"],
                url: "https://images.unsplash.com/photo-1518013006361-71899c437b3b?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "pizza",
                keys: ["pizza", "flatbread", "mozzarella", "cheese", "calzone"],
                url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "taco",
                keys: ["taco", "nacho", "fajita", "mexican", "burrito", "salsa", "guacamole"],
                url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "burger",
                keys: ["burger", "hamburger", "cheeseburger", "slider"],
                url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "smoothie",
                keys: ["smoothie", "yogurt", "fruit", "berry", "banana", "apple", "mango", "peach", "citrus", "orange", "lemon"],
                url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80"
            },
            {
                category: "curry",
                keys: ["curry", "masala", "paneer", "chana", "lentil", "dhal", "dal", "turmeric", "naan", "spiced"],
                url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80"
            }
        ];

        // Intelligent Scoring Matcher
        let bestCategory = null;
        let highestScore = -1;

        const promptLower = (recipe.image_prompt || recipe.imagePrompt || "").toLowerCase();
        const ingredientsText = (recipe.ingredients || []).map(i => (i.name || "").toLowerCase()).join(" ");

        for (const photo of foodPhotos) {
            let score = 0;
            
            // Check matches in title (high weight)
            for (const key of photo.keys) {
                if (titleLower.includes(key)) {
                    score += 10;
                }
            }

            // Check matches in ingredients (medium weight)
            for (const key of photo.keys) {
                if (ingredientsText.includes(key)) {
                    score += 5;
                }
            }

            // Check matches in image prompt (low weight)
            for (const key of photo.keys) {
                if (promptLower.includes(key)) {
                    score += 2;
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestCategory = photo;
            }
        }

        // Default to a gorgeous general culinary spread if no matches found
        let selectedUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
        if (bestCategory && highestScore > 0) {
            selectedUrl = bestCategory.url;
        }

        DOM.dishPhotoImg.src = selectedUrl;
        DOM.dishPhotoImg.alt = recipe.title;
        DOM.dishPhotoImg.classList.remove('hidden');
        if (DOM.dishPhotoFallback) DOM.dishPhotoFallback.style.display = 'none';
    }

    // 3. Stats & Header
    if (DOM.recipeStatTime) DOM.recipeStatTime.textContent = recipe.cooking_time || "20 mins";
    if (DOM.recipeStatDifficulty) DOM.recipeStatDifficulty.textContent = recipe.difficulty || "Easy";
    if (DOM.recipeTitle) DOM.recipeTitle.textContent = recipe.title;
    if (DOM.recipeIntro) DOM.recipeIntro.textContent = `A custom creation in the voice of ${badgeInfo.text.replace("Plated by ", "")}`;
    if (DOM.recipeNarrativeText) DOM.recipeNarrativeText.textContent = recipe.personality_intro;

    // 3b. Cultural Origin Badge
    const culturalOriginMap = {
        'west african':     '🌍',
        'east african':     '🌍',
        'north african':    '🌍',
        'central african':  '🌍',
        'african':          '🌍',
        'ghanaian':         '🇬🇭',
        'nigerian':         '🇳🇬',
        'ethiopian':        '🇪🇹',
        'senegalese':       '🇸🇳',
        'kenyan':           '🇰🇪',
        'ugandan':          '🇺🇬',
        'ivorian':          '🇨🇮',
        'moroccan':         '🇲🇦',
        'egyptian':         '🇪🇬',
        'south asian':      '🌏',
        'east asian':       '🌏',
        'southeast asian':  '🌏',
        'asian':            '🌏',
        'japanese':         '🇯🇵',
        'chinese':          '🇨🇳',
        'korean':           '🇰🇷',
        'indian':           '🇮🇳',
        'thai':             '🇹🇭',
        'vietnamese':       '🇻🇳',
        'filipino':         '🇵🇭',
        'indonesian':       '🇮🇩',
        'middle eastern':   '🌙',
        'lebanese':         '🇱🇧',
        'turkish':          '🇹🇷',
        'persian':          '🇮🇷',
        'latin american':   '🌎',
        'mexican':          '🇲🇽',
        'caribbean':        '🌴',
        'jamaican':         '🇯🇲',
        'mediterranean':    '🫒',
        'italian':          '🇮🇹',
        'french':           '🇫🇷',
        'greek':            '🇬🇷',
    };

    if (DOM.culturalOriginBadge && recipe.cultural_origin) {
        const originKey = recipe.cultural_origin.toLowerCase();
        let flag = '🌐';
        for (const [key, emoji] of Object.entries(culturalOriginMap)) {
            if (originKey.includes(key)) { flag = emoji; break; }
        }
        DOM.culturalOriginFlag.textContent = flag;
        DOM.culturalOriginLabel.textContent = recipe.cultural_origin;
        DOM.culturalOriginBadge.classList.remove('hidden');
    } else if (DOM.culturalOriginBadge) {
        DOM.culturalOriginBadge.classList.add('hidden');
    }

    // 3c. Missing ingredients callout
    const missing = recipe.missing_for_authentic;
    if (DOM.missingCallout && missing && missing.length > 0) {
        const dishName = recipe.traditional_dish_name || recipe.title;
        DOM.missingCalloutTitle.textContent = `To complete a full ${dishName}, add:`;
        DOM.missingCalloutChips.innerHTML = missing
            .map(item => `<span class="missing-chip">${escapeHtml(item)}</span>`)
            .join('');
        DOM.missingCallout.classList.remove('hidden');
    } else if (DOM.missingCallout) {
        DOM.missingCallout.classList.add('hidden');
    }

    // 3d. Nutrition Facts Card (with smart unit parsing and safe backwards-compatible fallback)
    if (DOM.recipeNutritionCard) {
        if (recipe.nutrition) {
            let calVal = recipe.nutrition.calories;
            if (calVal) {
                const calStr = String(calVal).trim();
                if (!calStr.toLowerCase().includes('kcal')) {
                    calVal = `${calStr} kcal`;
                } else {
                    calVal = calStr;
                }
            } else {
                calVal = "-";
            }
            const safeNum = v => String(v || "-").replace(/[<>"'&]/g, '');
            if (DOM.nutrCalories) DOM.nutrCalories.innerHTML = `🔥 <strong>${safeNum(calVal)}</strong>`;
            if (DOM.nutrProtein) DOM.nutrProtein.innerHTML = `🥩 <strong>${safeNum(recipe.nutrition.protein)}</strong> Prot`;
            if (DOM.nutrCarbs)   DOM.nutrCarbs.innerHTML   = `🍞 <strong>${safeNum(recipe.nutrition.carbs)}</strong> Carbs`;
            if (DOM.nutrFat)     DOM.nutrFat.innerHTML     = `🧈 <strong>${safeNum(recipe.nutrition.fat)}</strong> Fat`;
            DOM.recipeNutritionCard.style.display = 'flex';
        } else {
            DOM.recipeNutritionCard.style.display = 'none';
        }
    }

    // Set Heart Icon depending on favorites status
    if (DOM.recipeHeartBtn) {
        const heartIcon = DOM.recipeHeartBtn.querySelector('.heart-icon');
        if (heartIcon) {
            const isFavorited = appState.favorites.some(fav => fav.title === recipe.title);
            heartIcon.textContent = isFavorited ? '❤️' : '🤍';
        }
    }

    // 4. Ingredients Rows Pills
    if (DOM.recipeIngredientsList) {
        DOM.recipeIngredientsList.innerHTML = '';
        recipe.ingredients.forEach(ing => {
            const div = document.createElement('div');
            div.className = `ingredient-row-pill ${ing.is_user_ingredient ? 'have-style' : 'need-style'}`;
            
            const svg = ing.is_user_ingredient 
                ? `<svg class="status-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#B5D3B8" stroke="#25283D" stroke-width="2"/>
                    <path d="M8 12L11 15L16 9" stroke="#25283D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                   </svg>`
                : `<svg class="status-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="#25283D" stroke-width="2" stroke-dasharray="3 3"/>
                    <path d="M12 8V16M8 12H16" stroke="#25283D" stroke-width="2" stroke-linecap="round"/>
                   </svg>`;
                   
            const amountName = ing.amount ? `${escapeHtml(ing.amount)} ${escapeHtml(ing.name)}` : escapeHtml(ing.name);
            const badgeClass = ing.is_user_ingredient ? 'badge-have' : 'badge-need';
            const badgeText = ing.is_user_ingredient ? 'have' : 'need';
            
            div.innerHTML = `
                <div class="row-left">
                    ${svg}
                    <span>${amountName}</span>
                </div>
                <span class="row-badge ${badgeClass}">${badgeText}</span>
            `;
            DOM.recipeIngredientsList.appendChild(div);
        });
    }

    // 5. Preparation Steps (with inline cooking timers)
    clearAllTimers();
    if (DOM.recipeStepsList) {
        DOM.recipeStepsList.innerHTML = '';
        recipe.steps.forEach((step, idx) => {
            const li = document.createElement('li');
            const duration = parseStepDuration(step);
            li.innerHTML = `<span class="step-text">${escapeHtml(step)}</span>`;
            if (duration) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'step-timer-btn';
                btn.dataset.duration = duration;
                btn.textContent = `⏱ ${formatDuration(duration)}`;
                btn.addEventListener('click', () => startStepTimer(btn, duration, idx, step));
                li.appendChild(btn);
            }
            DOM.recipeStepsList.appendChild(li);
        });
    }

    // 6. Chef's Secret Tip
    if (DOM.recipeTipText) {
        DOM.recipeTipText.textContent = recipe.chef_tip;
    }
    if (DOM.recipeTipHeaderTitle) {
        const chefTipTitles = {
            budget: "Tony's Frugal Tip",
            grandma: "Grandma's Secret Tip",
            chef: "Pierre's Master Tip",
            chloe: "Chloe's Fitness Tip"
        };
        DOM.recipeTipHeaderTitle.textContent = chefTipTitles[recipe.selected_personality] || "Chef's Secret Tip";
    }
}

// --- Share Integration ---
function downloadRecipeAsPDF() {
    if (!appState.currentRecipe) return;
    const r = appState.currentRecipe;
    
    // Explicit permission check
    const confirmDownload = confirm(`Chef, would you like to save "${r.title}" as a beautiful, print-ready PDF cookbook card?`);
    if (!confirmDownload) {
        showToast("PDF download canceled.");
        return;
    }
    
    showToast("Preparing your print-ready PDF cookbook card... 🍳");
    if (synth && typeof synth.playDialClick === 'function') {
        synth.playDialClick();
    }

    // 1. Grab all PDF template elements
    const pdfTemplate = document.getElementById('recipe-pdf-template');
    const pdfTitle = document.getElementById('pdf-recipe-title');
    const pdfByline = document.getElementById('pdf-recipe-byline');
    const pdfPhoto = document.getElementById('pdf-dish-photo');
    const pdfNarrative = document.getElementById('pdf-narrative-text');
    const pdfTipHeader = document.getElementById('pdf-tip-header-title');
    const pdfTipText = document.getElementById('pdf-tip-text');
    const pdfTime = document.getElementById('pdf-stat-time');
    const pdfDifficulty = document.getElementById('pdf-stat-difficulty');
    const pdfIngredients = document.getElementById('pdf-ingredients-list');
    const pdfSteps = document.getElementById('pdf-steps-list');
    const pdfCal = document.getElementById('pdf-nutr-calories');
    const pdfProt = document.getElementById('pdf-nutr-protein');
    const pdfCarb = document.getElementById('pdf-nutr-carbs');
    const pdfFat = document.getElementById('pdf-nutr-fat');
    const pdfNutrBox = document.getElementById('pdf-nutrition-row-box');

    if (!pdfTemplate) {
        console.error("PDF printable template element not found!");
        showToast("PDF failed. Copying recipe text to clipboard instead!");
        copyRecipeToClipboard();
        return;
    }

    // 2. Populate the template with current recipe data
    if (pdfTitle) pdfTitle.textContent = r.title;
    
    const chefBadges = {
        budget: { emoji: "🥄", text: "Plated by Thrifty Chef Tony" },
        grandma: { emoji: "👵", text: "Plated by Grandma Marie" },
        chef: { emoji: "🍽️", text: "Plated by Chef Pierre" },
        chloe: { emoji: "🥗", text: "Plated by Healthy Chef Chloe" }
    };
    const badgeInfo = chefBadges[r.selected_personality] || chefBadges.grandma;
    if (pdfByline) pdfByline.innerHTML = `<span class="badge-emoji">${badgeInfo.emoji}</span> ${badgeInfo.text}`;
    
    // Set accurate image
    if (pdfPhoto) {
        let currentImgSrc = DOM.dishPhotoImg ? DOM.dishPhotoImg.getAttribute('src') : null;
        if (!currentImgSrc || (!currentImgSrc.startsWith('http') && !currentImgSrc.startsWith('data:image'))) {
            currentImgSrc = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
        }
        // Cache bust remote Unsplash image URLs to prevent tainted canvas CORS errors
        if (currentImgSrc.startsWith('http') && !currentImgSrc.includes('data:image')) {
            const cleanUrl = currentImgSrc.split('&cb=')[0].split('?cb=')[0];
            const cleanSeparator = cleanUrl.includes('?') ? '&' : '?';
            currentImgSrc = `${cleanUrl}${cleanSeparator}cb=${new Date().getTime()}`;
        }
        pdfPhoto.src = currentImgSrc;
    }

    if (pdfNarrative) {
        const intro = r.personality_intro || '';
        pdfNarrative.textContent = intro.length > 220 ? intro.substring(0, 217) + '...' : intro;
    }

    const chefTipTitles = {
        budget: "Tony's Frugal Tip",
        grandma: "Grandma's Secret Tip",
        chef: "Pierre's Master Tip",
        chloe: "Chloe's Fitness Tip"
    };
    if (pdfTipHeader) pdfTipHeader.textContent = `💡 ${chefTipTitles[r.selected_personality] || "Chef's Secret Tip"}`;
    if (pdfTipText) {
        const tip = r.chef_tip || '';
        pdfTipText.textContent = tip.length > 180 ? tip.substring(0, 177) + '...' : tip;
    }
    
    if (pdfTime) pdfTime.textContent = `⏱️ ${r.cooking_time || "20 mins"}`;
    if (pdfDifficulty) pdfDifficulty.textContent = `⭐️ ${r.difficulty || "Easy"}`;

    // Populate Ingredients
    if (pdfIngredients) {
        pdfIngredients.innerHTML = '';
        r.ingredients.forEach(ing => {
            const li = document.createElement('li');
            const origin = ing.is_user_ingredient ? "(in fridge)" : "(needed)";
            li.textContent = ing.amount ? `${ing.amount} ${ing.name} ${origin}` : `${ing.name} ${origin}`;
            pdfIngredients.appendChild(li);
        });
    }

    // Populate Steps
    if (pdfSteps) {
        pdfSteps.innerHTML = '';
        r.steps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            pdfSteps.appendChild(li);
        });
    }

    // Populate Nutrition (with safe fallback)
    if (r.nutrition) {
        let calVal = r.nutrition.calories;
        if (calVal) {
            const calStr = String(calVal).trim();
            calVal = calStr.toLowerCase().includes('kcal') ? calStr : `${calStr} kcal`;
        } else {
            calVal = "-";
        }
        if (pdfCal) pdfCal.innerHTML = `🔥 <strong>${calVal}</strong>`;
        if (pdfProt) pdfProt.innerHTML = `🥩 <strong>${r.nutrition.protein || "-"}</strong> Prot`;
        if (pdfCarb) pdfCarb.innerHTML = `🍞 <strong>${r.nutrition.carbs || "-"}</strong> Carbs`;
        if (pdfFat) pdfFat.innerHTML = `🧈 <strong>${r.nutrition.fat || "-"}</strong> Fat`;
        if (pdfNutrBox) pdfNutrBox.style.display = 'flex';
    } else {
        if (pdfNutrBox) pdfNutrBox.style.display = 'none';
    }

    // 3a. Auto-shrink list font size if the right column overflows the available card height
    const pdfCardBody = pdfTemplate.querySelector('.pdf-card-body');
    const pdfRightColumn = pdfTemplate.querySelector('.pdf-right-column');
    const pdfLists = pdfTemplate.querySelectorAll('.pdf-ingredients-list, .pdf-steps-list');
    if (pdfCardBody && pdfRightColumn && pdfLists.length) {
        let fontSizeRem = 0.65;
        const minFontRem = 0.44;
        // Compare right column's natural scroll height against card body's available height.
        // Using pdfRightColumn.scrollHeight (not cardBody) so left column height doesn't cause
        // the loop to shrink right column fonts unnecessarily.
        while (pdfRightColumn.scrollHeight > pdfCardBody.clientHeight + 2 && fontSizeRem > minFontRem) {
            fontSizeRem = Math.round((fontSizeRem - 0.02) * 100) / 100;
            pdfLists.forEach(l => {
                l.style.fontSize = `${fontSizeRem}rem`;
                l.style.lineHeight = fontSizeRem < 0.56 ? '1.1' : '1.2';
            });
        }
    }

    // 3. Configuration options with strict scroll reset coordinates for html2canvas
    const opt = {
        margin:       [0.15, 0.15, 0.15, 0.15],
        filename:     `${r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            backgroundColor: '#FAF7F0',
            scrollY: 0,
            scrollX: 0
        },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    
    // 4. Helper to trigger generation
    const executePDFGeneration = () => {
        const resetListStyles = () => {
            pdfTemplate.querySelectorAll('.pdf-ingredients-list, .pdf-steps-list').forEach(l => {
                l.style.fontSize = '';
                l.style.lineHeight = '';
            });
        };
        html2pdf().set(opt).from(pdfTemplate).save()
            .then(() => {
                resetListStyles();
                showToast("Recipe card saved successfully! 🍳✨");
            })
            .catch(err => {
                resetListStyles();
                console.error("PDF generation failed:", err);
                showToast("PDF failed. Copying recipe text instead!");
                copyRecipeToClipboard();
            });
    };

    // 5. Defer generation if photo is still loading to prevent blank image slots
    if (pdfPhoto && pdfPhoto.src && !pdfPhoto.complete) {
        pdfPhoto.onload = executePDFGeneration;
        pdfPhoto.onerror = executePDFGeneration; // fallback even if image fails
    } else {
        executePDFGeneration();
    }
}

function copyRecipeToClipboard() {
    if (!appState.currentRecipe) return;
    
    const r = appState.currentRecipe;
    
    // Construct rich text string representation
    let formattedText = `🍳 FridgeJam Recipe: ${r.title}\n`;
    formattedText += `⏱️ Time: ${r.cooking_time} | 📈 Level: ${r.difficulty}\n\n`;
    formattedText += `"${r.personality_intro}"\n\n`;
    formattedText += `📋 INGREDIENTS:\n`;
    r.ingredients.forEach(ing => {
        const origin = ing.is_user_ingredient ? "[User]" : "[Pantry]";
        formattedText += `- ${ing.name} (${ing.amount}) ${origin}\n`;
    });
    formattedText += `\n🔥 STEPS:\n`;
    r.steps.forEach((step, idx) => {
        formattedText += `${idx + 1}. ${step}\n`;
    });
    formattedText += `\n✨ CHEF'S TIP:\n"${r.chef_tip}"\n\n`;
    formattedText += `Plated with love via FridgeJam. Keep cooking zero waste!`;

    navigator.clipboard.writeText(formattedText)
        .then(() => showToast("Recipe copied to clipboard! Share it with friends!"))
        .catch(() => showToast("Couldn't copy. Copy it from the screen!"));
}

// --- Helper Functions ---
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
