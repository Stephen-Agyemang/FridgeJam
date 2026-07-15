/* FridgeJam recipe rendering */

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
