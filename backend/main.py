"""FridgeJam — FastAPI server with Gemini AI and Imagen integration."""

import json
import os
import base64
from io import BytesIO
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded

try:
    from backend.prompts import SYSTEM_PROMPT, PERSONALITY_PROMPTS  # type: ignore
except ImportError:
    from prompts import SYSTEM_PROMPT, PERSONALITY_PROMPTS

load_dotenv()


def _get_client_ip(request: Request) -> str:
    """Read the real client IP, respecting Cloud Run's X-Forwarded-For header.

    Cloud Run sits behind GCP's load balancer, which always appends the verified
    client IP as the last entry in X-Forwarded-For.  Without this, every request
    would appear to come from the internal LB IP and share a single rate-limit bucket.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host or "unknown"


def _sanitize_line(value: str, max_len: int = 120) -> str:
    """Strip characters that could inject fake prompt sections via newlines."""
    return value.replace("\n", " ").replace("\r", " ").strip()[:max_len]


limiter = Limiter(key_func=_get_client_ip)
app = FastAPI(title="FridgeJam", docs_url=None, redoc_url=None)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_request: Request, _exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests — slow down, chef! Try again in a minute."},
    )


# Restrict to the production domain and Cloud Run service URLs only
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["fridgejam.web.app", "*.run.app", "localhost", "127.0.0.1"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fridgejam.web.app"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# --- Gemini client setup ---

# Primary model for text/recipe generation
RECIPE_MODEL = "gemini-2.5-flash"
# Faster model used for lower-stakes structured tasks (meal plan, jokes)
PLAN_MODEL = "gemini-2.0-flash"
# Primary model for image generation
IMAGE_MODEL = "imagen-4.0-generate-001"

def _create_client():
    """Create a fresh Gemini client for each request."""
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        return genai.Client(api_key=api_key)
    # Fallback to Vertex AI auto-detection if no key is configured
    return genai.Client(
        vertexai=True,
        project=os.getenv("GOOGLE_CLOUD_PROJECT"),
        location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
    )


# --- Models ---

class RecipeRequest(BaseModel):
    ingredients: str
    personality: str  # "budget", "grandma", "chef", or "chloe"
    dietary_restrictions: Optional[list[str]] = []
    expiring_soon: Optional[list[str]] = []
    recipe_hint: Optional[str] = None  # Specific dish name from meal planner "Cook this" flow


class ImageRequest(BaseModel):
    prompt: str


class JokeEvaluationRequest(BaseModel):
    joke: str
    personality: str


class MealPlanRequest(BaseModel):
    ingredients: Optional[str] = ""
    personality: str = "grandma"
    mood: Optional[str] = None                          # "light" | "bold" | "quick" | "diverse"
    cuisine_explore: Optional[list[str]] = []           # e.g. ["West African", "Asian"]
    taste_profile: Optional[dict] = None                # mined from user's saved recipes + cook history
    dietary_restrictions: Optional[list[str]] = []     # same restrictions as recipe endpoint — safety-critical


# --- Routes ---

@app.post("/api/recipe")
@limiter.limit("10/minute")
async def generate_recipe(request: Request, body: RecipeRequest):
    """Generate a personalized recipe based on user ingredients and selected chef personality."""
    
    # Strip triple-quotes to prevent prompt injection via the ingredients field
    ingredients_text = body.ingredients.strip().replace('"""', '').replace("'''", '')
    if len(ingredients_text) < 2:
        raise HTTPException(
            status_code=400,
            detail="Please list at least one ingredient so the chef can work their magic!",
        )

    if len(ingredients_text) > 2000:
        raise HTTPException(
            status_code=400,
            detail="The chef's counter is overflowing! Please limit your ingredients list to 2000 characters.",
        )

    # Sanitize and select personality prompt
    personality_key = body.personality.lower()
    if personality_key not in PERSONALITY_PROMPTS:
        personality_key = "grandma"  # Default fallback

    personality_instruction = PERSONALITY_PROMPTS[personality_key]

    # Build dietary restriction block — these are hard safety constraints
    RESTRICTION_RULES = {
        "halal": (
            "NO pork, pork derivatives (lard, gelatin from pork, etc.), or alcohol of any kind. "
            "All meat must be halal-compliant. No animal shortening or non-halal additives."
        ),
        "vegetarian": (
            "NO meat, poultry, or seafood of any kind. Dairy and eggs are permitted."
        ),
        "vegan": (
            "NO animal products whatsoever — no meat, poultry, seafood, dairy (milk, butter, cheese, cream, yogurt, ghee), "
            "eggs, honey, or any animal-derived ingredient."
        ),
        "gluten-free": (
            "NO wheat, barley, rye, spelt, kamut, triticale, or any ingredient derived from them "
            "(including flour, bread, pasta, soy sauce unless certified GF, beer, malt). "
            "Flag any ingredient with potential cross-contamination risk."
        ),
        "nut-free": (
            "NO nuts of any kind — no peanuts (also a legume but treated as a nut allergy), "
            "tree nuts (almonds, cashews, walnuts, pecans, pistachios, macadamia, brazil nuts, hazelnuts, pine nuts), "
            "nut oils, nut butters, or nut extracts. This is a life-threatening allergy risk."
        ),
        "dairy-free": (
            "NO milk, butter, cheese, cream, yogurt, ghee, lactose, whey, casein, or any dairy derivative."
        ),
        "kosher": (
            "NO pork or pork products. NO shellfish or non-kosher seafood. "
            "Do NOT mix meat and dairy in the same dish."
        ),
        "pescatarian": (
            "NO meat or poultry of any kind — no beef, pork, lamb, chicken, turkey, duck, or any land animal flesh. "
            "Fish and all seafood ARE permitted. Dairy and eggs are also permitted."
        ),
        "jain": (
            "This is a strict Jain vegetarian diet. NO meat, poultry, seafood, or eggs of any kind. "
            "NO root vegetables — absolutely no onion, garlic, potato, carrot, radish, beet, turnip, leek, "
            "spring onion, shallot, or any vegetable that grows underground, as harvesting them harms the organism. "
            "NO eggplant/brinjal (aubergine). Use only above-ground vegetables, legumes, grains, dairy, and nuts. "
            "If a user ingredient violates this, omit it completely and suggest a compliant substitute."
        ),
    }

    active_restrictions = [r.lower().strip() for r in (body.dietary_restrictions or []) if r.strip()]
    dietary_block = ""
    if active_restrictions:
        restriction_lines = []
        for r in active_restrictions:
            if r in RESTRICTION_RULES:
                restriction_lines.append(f"  - {r.upper()}: {RESTRICTION_RULES[r]}")
        if restriction_lines:
            dietary_block = (
                "\n\nHARD DIETARY RESTRICTIONS — NON-NEGOTIABLE SAFETY CONSTRAINTS:\n"
                "The user has declared the following dietary requirements. You MUST NOT violate any of them "
                "under any circumstances. These are not preferences — they may be life-threatening allergies "
                "or sincere religious obligations. If a user ingredient itself violates a restriction, "
                "omit it and note the substitution in the chef's intro.\n"
                + "\n".join(restriction_lines)
            )

    # Build expiry-first priority block
    # Cap to 20 items, sanitize each to prevent newline-based prompt injection
    expiring = [
        _sanitize_line(i, max_len=60)
        for i in (body.expiring_soon or [])[:20]
        if i.strip()
    ]
    expiry_block = ""
    if expiring:
        expiry_list = ", ".join(expiring)
        expiry_block = (
            f"\n\nEXPIRY-FIRST MODE — FOOD WASTE PRIORITY:\n"
            f"The following ingredients are expiring soon: {expiry_list}.\n"
            f"You MUST build the dish primarily around these ingredients — use them generously and as central components, "
            f"not as optional garnishes. This is the user's main reason for cooking right now."
        )

    # Build recipe hint block — used when user clicks "Cook this" on a meal planner AI stub
    hint_block = ""
    if body.recipe_hint and body.recipe_hint.strip():
        safe_hint = _sanitize_line(
            body.recipe_hint.replace('"""', '').replace("'''", ''), max_len=120
        )
        hint_block = (
            f"\n\nDISH TARGET — USER'S CHOSEN MEAL:\n"
            f"The user specifically wants to make: \"{safe_hint}\".\n"
            f"Build the recipe around this dish. Use the provided fridge ingredients as the base "
            f"and fill in any remaining standard ingredients needed to complete it."
        )

    # Construct complete LLM prompt
    full_prompt = f"""
{SYSTEM_PROMPT}

USER FRIDGE INGREDIENTS:
\"\"\"{ingredients_text}\"\"\"{dietary_block}{expiry_block}{hint_block}

PERSONALITY ASSIGNMENT:
{personality_instruction}

Create a single incredible dish that highlights these ingredients. Return ONLY the raw JSON output matching the schema.
"""

    try:
        client = _create_client()
        response = client.models.generate_content(
            model=RECIPE_MODEL,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0.75,
                response_mime_type="application/json",
            ),
        )

        response_text = response.text.strip()

        # Clean code fences if the model wrapped them despite JSON instructions
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

        recipe_data = json.loads(response_text)
        
        # Add personality identifier to the response
        recipe_data["selected_personality"] = personality_key
        
        return recipe_data

    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        raise HTTPException(
            status_code=500,
            detail="The chef got a bit confused in the kitchen. Let's try rearranging your ingredients!",
        )
    except Exception as e:
        print(f"Error generating recipe: {e}")
        raise HTTPException(
            status_code=500,
            detail="The stove wouldn't light! Let's give the kitchen a second to warm up, or check your ingredients list."
        )


@app.post("/api/scan")
@limiter.limit("10/minute")
async def scan_fridge(request: Request, file: UploadFile = File(...)):
    """Analyze a photo of the fridge to detect ingredients using Gemini 2.5 Flash."""
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty image file uploaded.")
            
        # Limit image upload size to 10MB to protect memory
        MAX_FILE_SIZE = 10 * 1024 * 1024
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image is too large! Please upload a photo smaller than 10MB.",
            )
            
        from PIL import Image, UnidentifiedImageError
        from io import BytesIO

        # Guard against decompression bomb attacks: a valid-looking PNG under 10MB
        # can decompress to gigabytes in memory and crash the server.
        Image.MAX_IMAGE_PIXELS = 20_000_000  # ~20 megapixels is more than enough

        try:
            image = Image.open(BytesIO(image_bytes))
        except UnidentifiedImageError:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file does not appear to be a valid image format. Please upload a JPEG or PNG photo.",
            )
        
        client = _create_client()
        prompt = (
            "You are a careful culinary ingredient scanner. Analyze this image of a fridge, pantry, or collection of food items. "
            "Identify ALL visible edible food ingredients with precision. "
            "Be especially thorough about spotting: nuts (peanuts, almonds, cashews, etc.), dairy products (milk, cheese, butter, cream), "
            "meat and seafood (including processed meats, fish sauce, anchovies), gluten-containing items (bread, flour, pasta, soy sauce), "
            "and any packaged goods whose labels are partially visible. "
            "Return ONLY a comma-separated list of specific raw ingredient names, all lowercase. "
            "Be specific — write 'peanut butter' not just 'spread', 'cow's milk' not just 'drink', 'wheat flour' not just 'flour' if visible. "
            "List between 2 and 12 ingredients. Do not include brand names, packaging descriptions, or non-food items. "
            "Do not include any formatting, markdown, or extra words — only the comma-separated ingredient list. "
            "If no food ingredients are visible, return an empty string."
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image, prompt]
        )
        
        text = response.text.strip() if response.text else ""
        # Split by comma and clean
        ingredients = [item.strip().lower() for item in text.split(",") if item.strip()]
        
        # Filter out anything that is too long (just in case)
        ingredients = [item for item in ingredients if len(item) < 30]
        
        return {"ingredients": ingredients}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error scanning fridge photo: {e}")
        raise HTTPException(
            status_code=500,
            detail="The scanner lens seems a bit foggy! Try checking the lighting and uploading again."
        )


@app.post("/api/image")
@limiter.limit("10/minute")
async def generate_image(request: Request, body: ImageRequest):
    """Generate an image using Imagen 3. Returns base64 JPEG or success=False if not available."""
    
    prompt = body.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Image prompt cannot be empty")

    try:
        client = _create_client()
        
        print(f"[Imagen] Generating image with model={IMAGE_MODEL}, prompt={prompt[:80]}...")
        response = client.models.generate_images(
            model=IMAGE_MODEL,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="4:3",
                output_mime_type="image/jpeg"
            )
        )

        print(f"[Imagen] Response received. generated_images count: {len(response.generated_images) if response.generated_images else 0}")
        
        if not response.generated_images:
            raise ValueError("No images returned from Imagen API")

        # Get base64 encoded bytes
        img_obj = response.generated_images[0]
        print(f"[Imagen] Image object keys: {dir(img_obj)}")
        
        image_bytes = None
        if hasattr(img_obj, 'image') and img_obj.image and hasattr(img_obj.image, 'image_bytes'):
            image_bytes = img_obj.image.image_bytes
            print(f"[Imagen] image_bytes length: {len(image_bytes) if image_bytes else 'None'}")
        
        if not image_bytes:
            # Try alternate attribute path
            if hasattr(img_obj, 'image_bytes'):
                image_bytes = img_obj.image_bytes
                print(f"[Imagen] Alternate image_bytes length: {len(image_bytes) if image_bytes else 'None'}")
        
        if not image_bytes:
            raise ValueError(f"image_bytes is empty or None from Imagen response")
        
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        print(f"[Imagen] Successfully encoded image, base64 length: {len(encoded_image)}")
        
        return {
            "success": True,
            "image_url": f"data:image/jpeg;base64,{encoded_image}"
        }

    except Exception as e:
        # Gracefully handle if API key doesn't support Imagen, quota exceeded, or Vertex AI error
        print(f"[Imagen] Generation failed: {type(e).__name__}: {e}")
        return {
            "success": False,
            "error": "The chef's sketchbook is misplaced! We couldn't draw a picture of the dish, but the recipe is ready to cook.",
            "image_url": None
        }


@app.post("/api/evaluate-joke")
@limiter.limit("20/minute")
async def evaluate_joke(request: Request, body: JokeEvaluationRequest):
    """Evaluate a user's joke and react in the chef's voice (funny laugh or blunt-but-caring feedback)."""
    joke_text = _sanitize_line(body.joke, max_len=500)
    if not joke_text:
        raise HTTPException(status_code=400, detail="Chef, please type something before telling your joke!")

    personality_key = body.personality.lower()
    chef_names = {
        "budget": "Thrifty Chef Tony",
        "grandma": "Grandma Marie",
        "chef": "Chef Pierre",
        "chloe": "Healthy Chef Chloe"
    }
    chef_name = chef_names.get(personality_key, "Grandma Marie")

    prompt = f"""
You are playing the role of {chef_name}, a friendly AI cooking character.
The user is playing a mini-game waiting for their food, and has decided to tell you a food joke:
"{joke_text}"

Evaluate their joke. If it is actually a funny food pun/joke, react with genuine amusement and laugh (e.g. "Haha!", "That's a good one!", "Oh my, that's hilarious!").
If it is NOT funny, or doesn't make sense, or is gibberish, let them know BLUNTLY but in a warm, caring, or playful way that won't hurt their feelings (e.g. "Aha, sweetheart... stick to cooking!", "Pierre is not amused, but I admire the courage!", "Tony has seen cheaper cheese than that joke, but nice try!").

Keep your response extremely short (1 to 3 sentences maximum) and stay 100% in your character's voice.
Return a simple JSON matching this schema:
{{
  "is_funny": true or false,
  "reaction": "your chef-persona response text here"
}}
"""

    try:
        client = _create_client()
        response = client.models.generate_content(
            model=RECIPE_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        data = json.loads(response.text.strip())
        return data
    except Exception as e:
        print(f"Error evaluating joke: {e}")
        # Graceful fallback response in case Gemini API is down
        return {
            "is_funny": True,
            "reaction": "Haha! That's a tasty attempt, sweetheart! Keep practicing!"
        }


@app.post("/api/meal-plan")
@limiter.limit("5/minute")
async def generate_meal_plan(request: Request, body: MealPlanRequest):  # noqa: ARG001 — required by slowapi
    """Generate a 7-day meal plan suggestion using Gemini."""
    ingredients_hint = body.ingredients.strip() if body.ingredients else ""
    personality_key = body.personality.lower()
    chef_names = {
        "budget": "Thrifty Chef Tony",
        "grandma": "Grandma Marie",
        "chef": "Chef Pierre",
        "chloe": "Healthy Chef Chloe"
    }
    chef_name = chef_names.get(personality_key, "Grandma Marie")
    ingredients_section = f"\nAvailable fridge ingredients to incorporate: {ingredients_hint}" if ingredients_hint else ""

    # Dietary restrictions — same safety-critical rules as the recipe endpoint
    PLAN_RESTRICTION_RULES = {
        "halal":        "NO pork, pork derivatives, lard, gelatin from pork, or alcohol in any meal.",
        "vegetarian":   "NO meat, poultry, or seafood in any meal. Dairy and eggs are permitted.",
        "vegan":        "NO animal products in any meal — no meat, poultry, seafood, dairy, eggs, honey, or any animal-derived ingredient.",
        "gluten-free":  "NO wheat, barley, rye, or any gluten-containing ingredient in any meal. Flag cross-contamination risks.",
        "nut-free":     "ABSOLUTELY NO nuts or nut-derived ingredients in any meal — no peanuts, tree nuts, nut oils, nut butters. LIFE-THREATENING ALLERGY.",
        "dairy-free":   "NO milk, butter, cheese, cream, yogurt, ghee, lactose, whey, casein, or any dairy derivative in any meal.",
        "kosher":       "NO pork or shellfish in any meal. Do NOT mix meat and dairy.",
        "pescatarian":  "NO meat or poultry in any meal. Fish and seafood are permitted.",
        "jain":         "NO meat, poultry, seafood, eggs, or root vegetables (onion, garlic, potato, carrot, radish, beet, turnip, leek, shallot) in any meal. NO eggplant.",
    }
    active_plan_restrictions = [r.lower().strip() for r in (body.dietary_restrictions or []) if r.strip()]
    plan_dietary_block = ""
    if active_plan_restrictions:
        rules = [f"  - {r.upper()}: {PLAN_RESTRICTION_RULES[r]}" for r in active_plan_restrictions if r in PLAN_RESTRICTION_RULES]
        if rules:
            plan_dietary_block = (
                "\n\nHARD DIETARY CONSTRAINTS — APPLY TO EVERY SINGLE DAY OF THE PLAN:\n"
                "The user has declared the following dietary requirements. EVERY meal in the 7-day plan "
                "MUST comply with ALL of these. These are not preferences — they may be life-threatening "
                "allergies or sincere religious obligations. Do not suggest any dish that violates them.\n"
                + "\n".join(rules)
            )

    # Mood directive — shapes the overall tone of the entire week
    MOOD_INSTRUCTIONS = {
        "light":   "Keep the week LIGHT & FRESH — prioritize salads, lean proteins, steamed vegetables, broths, and dishes under 500 kcal. Nothing heavy or greasy.",
        "bold":    "Make it BOLD & HEARTY — rich stews, roasted meats, comforting pasta, braised dishes, and full-flavored crowd-pleasers. Go all in.",
        "quick":   "SPEED is the priority — every single meal must be achievable in 30 minutes or under. One-pan, minimal prep, weeknight-friendly only.",
        "diverse": "EXPLORE THE WORLD this week — each day should showcase a different global culinary tradition. Actively represent underrepresented cuisines: West African, East African, South Asian, Southeast Asian, Caribbean, Latin American, Middle Eastern, etc. Span continents, not just 'international'.",
    }
    mood_block = ""
    if body.mood and body.mood in MOOD_INSTRUCTIONS:
        mood_block = f"\n\nMOOD DIRECTIVE — THIS OVERRIDES GENERIC DEFAULTS:\n{MOOD_INSTRUCTIONS[body.mood]}"

    # Cuisine exploration — user picked specific cuisines to discover
    # Cap to 8 items and sanitize each to prevent newline injection
    cuisine_block = ""
    if body.cuisine_explore:
        safe_cuisines = [
            _sanitize_line(c, max_len=40)
            for c in (body.cuisine_explore or [])[:8]
            if c.strip()
        ]
        if safe_cuisines:
            cuisines = ", ".join(safe_cuisines)
            cuisine_block = (
                f"\n\nCUISINE EXPLORATION — USER REQUEST:\n"
                f"The user specifically wants to discover: {cuisines}.\n"
                f"You MUST include at least 2–3 days drawing authentically from this list. "
                f"Use real dish names, authentic techniques, and correct cultural flavor profiles — do not westernize."
            )

    # Taste profile — learned from the user's cooking history and saved recipes
    # Sanitize every string value before embedding in the prompt
    profile_block = ""
    if body.taste_profile and isinstance(body.taste_profile, dict):
        def _clean_list(lst, limit, max_item_len=50):
            return [
                _sanitize_line(str(x), max_len=max_item_len)
                for x in (lst or [])[:limit]
                if str(x).strip()
            ]

        top_ings     = _clean_list(body.taste_profile.get("top_ingredients", []),   limit=10)
        saved_dishes = _clean_list(body.taste_profile.get("saved_dishes", []),      limit=8)
        affinities   = _clean_list(body.taste_profile.get("cultural_affinities", []), limit=6)

        if top_ings or saved_dishes or affinities:
            profile_block = "\n\nUSER TASTE PROFILE (learned from their cooking history — use this to personalize):"
            if top_ings:
                profile_block += f"\n- Ingredients they cook with most: {', '.join(top_ings)}"
            if affinities:
                profile_block += f"\n- Cuisines they gravitate toward: {', '.join(affinities)}"
            if saved_dishes:
                profile_block += f"\n- Dishes they've loved and saved: {', '.join(saved_dishes)}"
            profile_block += (
                "\n\nUse this profile to make the plan feel personally tailored — build on flavor profiles, "
                "ingredients, and cuisines the user already enjoys, while keeping enough variety that the week feels exciting, not repetitive."
            )

    prompt = f"""You are {chef_name}, a friendly and knowledgeable AI cooking character with deep expertise in global cuisines.

Generate a personalized, varied 7-day home meal plan.{ingredients_section}{plan_dietary_block}{mood_block}{cuisine_block}{profile_block}

Return ONLY a JSON array with exactly 7 objects, one per day of the week, in this exact format:
[
  {{
    "day": "Monday",
    "meal_name": "Dish Name (use authentic cultural name where applicable)",
    "description": "One warm, enticing sentence about this dish in the chef's voice.",
    "cooking_time": "25 mins",
    "key_ingredients": ["ingredient1", "ingredient2", "ingredient3"]
  }}
]

Rules:
- Vary proteins, cooking styles, and cultural origins across the 7 days — no repeated cuisines back-to-back.
- If the user requested diverse cuisines, honor that — each day can be a passport stamp.
- Use real, recognizable dish names (e.g. "Jollof Rice", "Pad Thai", "Shakshuka", "Lentil Dahl") not generic descriptions.
- Keep descriptions warm and in the chef's voice.
- Return ONLY the raw JSON array, no markdown, no wrapper text."""

    try:
        client = _create_client()
        response = client.models.generate_content(
            model=PLAN_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.85,
                response_mime_type="application/json",
            ),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
        plan = json.loads(text)
        return {"plan": plan}
    except Exception as e:
        print(f"Error generating meal plan: {e}")
        raise HTTPException(
            status_code=500,
            detail="The planner's notepad is full! Give the kitchen a moment and try again."
        )


@app.get("/api/health")
async def health():
    """Health check."""
    return {"status": "cooking"}


# Mount frontend static files (served at root)
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print(f"Warning: Frontend path not found at {frontend_path}")
