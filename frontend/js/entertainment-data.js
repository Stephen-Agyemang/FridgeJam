/* FridgeJam Entertainment Zone */

// ─────────────────────────────────────────
//  ENTERTAINMENT ZONE — Jokes + Mini Game
// ─────────────────────────────────────────

const FOOD_JOKES = [
    { setup: "Why did the tomato turn red?", punchline: "Because it saw the salad dressing! 🥗", keywords: ["dressing", "saw", "salad"] },
    { setup: "What do you call a stolen yam?", punchline: "A hot potato! 🥔", keywords: ["hot potato", "potato", "hot"] },
    { setup: "Why did the baker stop making donuts?", punchline: "He was sick of the hole business! 🍩", keywords: ["hole", "whole"] },
    { setup: "What do you call cheese that isn't yours?", punchline: "Nacho cheese! 🧀", keywords: ["nacho", "not yours"] },
    { setup: "Why did the banana go to the doctor?", punchline: "Because it wasn't peeling well! 🍌", keywords: ["peel", "peeling", "feeling"] },
    { setup: "What did the ocean say to the pizza?", punchline: "Nothing, it just waved! 🌊🍕", keywords: ["waved", "wave"] },
    { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up! 🥚", keywords: ["crack", "cracking"] },
    { setup: "What do you call a fake noodle?", punchline: "An impasta! 🍝", keywords: ["impasta", "imposter"] },
    { setup: "Why did the cookie go to the doctor?", punchline: "It was feeling crummy! 🍪", keywords: ["crummy", "crumb", "feeling"] },
    { setup: "What did the lettuce say to the celery?", punchline: "Quit stalking me! 🥬", keywords: ["stalk", "stalking", "stalks"] },
    { setup: "Why did the grape stop in the middle of the road?", punchline: "Because it ran out of juice! 🍇", keywords: ["juice", "run out", "ran out"] },
    { setup: "What do you call a sad strawberry?", punchline: "A blueberry! 🍓", keywords: ["blue", "blueberry"] },
    { setup: "Why was the mushroom always invited to parties?", punchline: "Because he was a fun-gi! 🍄", keywords: ["fun-gi", "fungi", "fun guy"] },
    { setup: "What did the sushi say to the bee?", punchline: "Wasabi! 🍣", keywords: ["wasabi", "sushi", "bee"] },
    { setup: "Why did the student eat his homework?", punchline: "The teacher said it was a piece of cake! 🎂", keywords: ["cake", "piece of cake"] },
    { setup: "What do you call a sleeping pizza?", punchline: "A pi-zzz-a! 🍕", keywords: ["pi-zzz-a", "pizzza", "sleep", "zzz"] },
    { setup: "Why did the chef get arrested?", punchline: "Because he was caught beating an egg! 🥚", keywords: ["beating", "beat", "egg"] },
    { setup: "What's a potato's favourite TV show?", punchline: "Starch Trek! 🥔🚀", keywords: ["starch", "trek", "starch trek"] },
    { setup: "Why did the orange lose the race?", punchline: "It ran out of juice! 🍊", keywords: ["juice", "run out", "orange"] },
    { setup: "What did one plate say to the other?", punchline: "Lunch is on me! 🍽️", keywords: ["lunch is on me", "lunch", "on me"] }
];

let jokeIndex = 0;
let gameScore = 0;
let gameStreak = 0;
let gameMisses = 0;
let gameRankedScore = 0;
let gameRankedLocked = false;
let entertainChoice = null; // 'jokes' | 'game' | null
let pendingRecipeData = null; // store finished recipe until user clicks "See My Recipe"
let jokesViewedCount = 0;
let gameStartTime = 0;
let gameSpawnTimeout = null;
let leaderboardDb = null;
let leaderboardReady = false;
let leaderboardSubmittedScore = 0;

const GAME_ITEMS = ['🍅','🥕','🧅','🥦','🍋','🥚','🧄','🌽','🍄','🥑','🍇','🥝','🍓','🫑','🥒'];
const GAME_RANKED_MISS_LIMIT = 5;
