/* FridgeJam recipe sharing and PDF export */

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
