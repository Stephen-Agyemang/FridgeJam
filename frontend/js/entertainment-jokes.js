function loadJoke(index) {
    jokesViewedCount++;
    
    const setup     = document.getElementById('joke-setup');
    const punchline = document.getElementById('joke-punchline');
    const nextBtn   = document.getElementById('joke-next-btn');
    const userJokeContainer = document.getElementById('user-joke-container');
    const userJokePrompt = document.getElementById('user-joke-prompt');
    const userJokeInput = document.getElementById('user-joke-input');
    const submitBtn = document.getElementById('btn-submit-user-joke');
    const guessContainer = document.getElementById('joke-guess-container');
    const guessInput = document.getElementById('joke-guess-input');
    
    // Wire up submit button event listener exactly once
    if (submitBtn && !submitBtn.dataset.bound) {
        submitBtn.dataset.bound = "true";
        submitBtn.onclick = submitUserJoke;
    }
    
    // If they viewed at least 3 jokes, prompt them to tell their own joke
    if (jokesViewedCount >= 3) {
        if (setup) setup.textContent = "";
        if (punchline) punchline.classList.add('hidden');
        if (guessContainer) guessContainer.style.display = 'none';
        if (nextBtn) nextBtn.classList.add('hidden');
        
        if (userJokeContainer) {
            userJokeContainer.classList.remove('hidden');
            if (userJokeInput) userJokeInput.value = "";
            
            const chefPromptNames = {
                budget: "Alright friend, Tony's clean out of jokes! Now it's your turn. Tell me a food joke of your own! 🎤",
                grandma: "Sweetheart, grandma has told you all her best puns! Now you must tell me one of yours! 👵🎤",
                chef: "Pierre has plated his best puns! Now it is your turn. Show me your culinary comedy! 👨‍🍳🎤",
                chloe: "Boom! Clean jokes complete! Your turn to supply the positive energy. Drop a food joke on me! 🥗🎤"
            };
            const activePersonality = appState.selectedPersonality || 'grandma';
            if (userJokePrompt) {
                userJokePrompt.textContent = chefPromptNames[activePersonality] || chefPromptNames.grandma;
            }
        }
        return;
    }
    
    if (userJokeContainer) userJokeContainer.classList.add('hidden');
    
    const joke = FOOD_JOKES[index % FOOD_JOKES.length];
    if (setup)     setup.textContent = joke.setup;
    if (punchline) { punchline.textContent = joke.punchline; punchline.classList.add('hidden'); }
    if (guessContainer) {
        guessContainer.style.display = 'flex';
        if (guessInput) guessInput.value = "";
    }
    if (nextBtn)   nextBtn.classList.add('hidden');
}

function submitJokeGuess() {
    const inputEl = document.getElementById('joke-guess-input');
    const punchlineEl = document.getElementById('joke-punchline');
    const guessContainer = document.getElementById('joke-guess-container');
    const nextBtn = document.getElementById('joke-next-btn');
    const setupEl = document.getElementById('joke-setup');
    
    if (!inputEl) return;
    const guessText = inputEl.value.trim().toLowerCase();
    if (guessText.length < 2) {
        showToast("Guess something first! 🧠");
        return;
    }
    
    const joke = FOOD_JOKES[jokeIndex % FOOD_JOKES.length];
    const keywords = joke.keywords || [];
    
    // Check if guess matches any keyword or is extremely close
    const isCorrect = keywords.some(k => guessText.includes(k.toLowerCase())) || 
                      guessText.includes(joke.punchline.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    const activePersonality = appState.selectedPersonality || 'grandma';
    let reactionText = "";
    
    if (isCorrect) {
        if (synth && typeof synth.playSuccessBeep === 'function') {
            synth.playSuccessBeep();
            setTimeout(() => synth.playSuccessBeep(), 150);
        }
        
        const correctReactions = {
            budget: `Boom! Spot on! You saved those brain calories: "${joke.punchline}" 💰`,
            grandma: `Oh sweetheart, you got it! Grandma is so proud of you: "${joke.punchline}" 👵❤️`,
            chef: `Magnifique! Absolute culinary perfection! You guessed it: "${joke.punchline}" 👨‍🍳✨`,
            chloe: `BOOM! Clean pun power! Spot on guess: "${joke.punchline}"! Keep that energy up! 🥗💪`
        };
        reactionText = correctReactions[activePersonality] || correctReactions.grandma;
    } else {
        if (synth && typeof synth.playDialClick === 'function') {
            synth.playDialClick();
        }
        
        const incorrectReactions = {
            budget: `Nice try, but that guess is worth about two cents! The real answer is: "${joke.punchline}" 🧀`,
            grandma: `Oh bless your sweet heart, that's not quite it honey, but I love the creative thinking! The real answer is: "${joke.punchline}" 👵☕`,
            chef: `Mon dieu... that guess is like a flat, overcooked soufflé. Tasteless! The real gourmet punchline is: "${joke.punchline}" 🥖`,
            chloe: `Oof, missed the rep on that guess! Push harder next time. The real punchline is: "${joke.punchline}"! 🥗⚡`
        };
        reactionText = incorrectReactions[activePersonality] || incorrectReactions.grandma;
    }
    
    if (setupEl) setupEl.textContent = reactionText;
    if (guessContainer) guessContainer.style.display = 'none';
    if (nextBtn) nextBtn.classList.remove('hidden');
}

function revealPunchline() {
    const joke = FOOD_JOKES[jokeIndex % FOOD_JOKES.length];
    const setupEl = document.getElementById('joke-setup');
    const guessContainer = document.getElementById('joke-guess-container');
    const nextBtn = document.getElementById('joke-next-btn');
    
    if (synth && typeof synth.playDialClick === 'function') {
        synth.playDialClick();
    }
    
    const activePersonality = appState.selectedPersonality || 'grandma';
    const giveUpMessages = {
        budget: `Smart, save that cognitive energy! The answer is: "${joke.punchline}"`,
        grandma: `No worries, my darling! Here is the punchline: "${joke.punchline}"`,
        chef: `Ah, the mystery is solved! The gourmet punchline is: "${joke.punchline}"`,
        chloe: `Resting on this set? Totally fine! The answer is: "${joke.punchline}"`
    };
    
    if (setupEl) setupEl.textContent = giveUpMessages[activePersonality] || giveUpMessages.grandma;
    if (guessContainer) guessContainer.style.display = 'none';
    if (nextBtn) nextBtn.classList.remove('hidden');
}

function nextJoke() {
    jokeIndex = (jokeIndex + 1) % FOOD_JOKES.length;
    loadJoke(jokeIndex);
}

function submitUserJoke() {
    const inputEl = document.getElementById('user-joke-input');
    const promptEl = document.getElementById('user-joke-prompt');
    
    if (!inputEl) return;
    const jokeText = inputEl.value.trim();
    if (jokeText.length < 3) {
        showToast("Tell me a little more than that, chef! 🍳");
        return;
    }
    
    showToast("Chef is taste-testing your joke... 🤔");
    if (promptEl) promptEl.textContent = "Listening carefully...";
    
    const activePersonality = appState.selectedPersonality || 'grandma';
    
    fetch('/api/evaluate-joke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joke: jokeText, personality: activePersonality })
    })
    .then(res => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
    })
    .then(data => {
        displayJokeFeedback(data.is_funny, data.reaction);
    })
    .catch(err => {
        console.log("[FridgeJam] Backend joke evaluate failed, using local evaluator...", err);
        const data = evaluateUserJokeLocally(jokeText, activePersonality);
        displayJokeFeedback(data.is_funny, data.reaction);
    });
}

function evaluateUserJokeLocally(jokeText, personality) {
    const isFoodRelated = /tomato|egg|lettuce|fridge|banana|pear|cheese|pizza|coffee|cookie|bean|bread|potato|carrot|broccoli|kitchen|cook|eat|bake|fry|pot|pan|onion|garlic|soup|chef/i.test(jokeText);
    const isFunny = isFoodRelated && jokeText.length > 8;
    let reaction = "";
    
    if (personality === 'chef') {
        reaction = isFunny 
            ? `*Hon hon hon!* Magnifique! A delicious pun, my friend! I give it three Michelin stars!` 
            : `Mon dieu... that joke is like overcooked soufflé. Flat and tasteless, but I admire your courage!`;
    } else if (personality === 'budget') {
        reaction = isFunny 
            ? `Haha! That joke is rich! I love a pun that doesn't cost a dime!` 
            : `Oof, I've seen cheaper store-brand processed cheese than that joke. Let's keep scanning leftovers, buddy!`;
    } else if (personality === 'chloe') {
        reaction = isFunny 
            ? `BOOM! Clean pun power! That's the exact positive vibe we need! Keep it up!` 
            : `Alright, that punchline ran out of steam! No worries, push hard on the next rep!`;
    } else {
        reaction = isFunny 
            ? `Oh sweetheart, haha! That is absolutely darling! You've warmed this old grandma's heart!` 
            : `Oh bless your sweet heart... that joke was a bit dry, like my last loaf of cornbread. Stick to cooking, honey!`;
    }
    return { is_funny: isFunny, reaction: reaction };
}

function displayJokeFeedback(isFunny, reactionText) {
    const setupEl = document.getElementById('joke-setup');
    const containerEl = document.getElementById('user-joke-container');
    const nextBtn = document.getElementById('joke-next-btn');
    
    if (containerEl) containerEl.classList.add('hidden');
    if (setupEl) setupEl.textContent = reactionText;
    
    if (synth && typeof synth.playSuccessBeep === 'function') {
        if (isFunny) {
            synth.playSuccessBeep();
            setTimeout(() => synth.playSuccessBeep(), 150);
        } else {
            synth.playDialClick();
        }
    }
    
    if (nextBtn) {
        nextBtn.textContent = "Tell more jokes →";
        nextBtn.classList.remove('hidden');
        nextBtn.onclick = () => {
            jokesViewedCount = 0; // reset joke count
            nextJoke(); // load a new standard joke
            nextBtn.onclick = null; // clear override
            nextBtn.textContent = "Next joke →";
        };
    }
}
