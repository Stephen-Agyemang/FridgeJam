"""FridgeChef — FastAPI server with Gemini AI and Imagen integration."""

import json
import os
import base64
from io import BytesIO
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types
from pydantic import BaseModel

try:
    from backend.prompts import SYSTEM_PROMPT, PERSONALITY_PROMPTS
except ImportError:
    from prompts import SYSTEM_PROMPT, PERSONALITY_PROMPTS

load_dotenv()

app = FastAPI(title="FridgeChef")

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Gemini client setup ---

# Primary model for text/recipe generation
RECIPE_MODEL = "gemini-2.5-flash"
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
    personality: str  # "budget", "grandma", or "chef"


class ImageRequest(BaseModel):
    prompt: str


class JokeEvaluationRequest(BaseModel):
    joke: str
    personality: str


# --- Routes ---

@app.post("/api/recipe")
async def generate_recipe(request: RecipeRequest):
    """Generate a personalized recipe based on user ingredients and selected chef personality."""
    
    ingredients_text = request.ingredients.strip()
    if len(ingredients_text) < 2:
        raise HTTPException(
            status_code=400,
            detail="Please list at least one ingredient so the chef can work their magic!",
        )

    # Sanitize and select personality prompt
    personality_key = request.personality.lower()
    if personality_key not in PERSONALITY_PROMPTS:
        personality_key = "grandma"  # Default fallback
    
    personality_instruction = PERSONALITY_PROMPTS[personality_key]
    
    # Construct complete LLM prompt
    full_prompt = f"""
{SYSTEM_PROMPT}

USER FRIDGE INGREDIENTS:
\"\"\"{ingredients_text}\"\"\"

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
async def scan_fridge(file: UploadFile = File(...)):
    """Analyze a photo of the fridge to detect ingredients using Gemini 2.5 Flash."""
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty image file uploaded.")
            
        from PIL import Image
        from io import BytesIO
        
        image = Image.open(BytesIO(image_bytes))
        
        client = _create_client()
        prompt = (
            "Analyze this image of a fridge or ingredients. Identify the edible food ingredients visible. "
            "Return ONLY a comma-separated list of 2 to 8 raw ingredients, all lowercase (e.g. eggs, spinach, onion, cheese). "
            "Do not include any formatting, markdown, punctuation (except commas), or extra words. If no ingredients are found, return an empty string."
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
        
    except Exception as e:
        print(f"Error scanning fridge photo: {e}")
        raise HTTPException(
            status_code=500,
            detail="The scanner lens seems a bit foggy! Try checking the lighting and uploading again."
        )


@app.post("/api/image")
async def generate_image(request: ImageRequest):
    """Generate an image using Imagen 3. Returns base64 JPEG or success=False if not available."""
    
    prompt = request.prompt.strip()
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
async def evaluate_joke(request: JokeEvaluationRequest):
    """Evaluate a user's joke and react in the chef's voice (funny laugh or blunt-but-caring feedback)."""
    joke_text = request.joke.strip()
    if not joke_text:
        raise HTTPException(status_code=400, detail="Chef, please type something before telling your joke!")

    personality_key = request.personality.lower()
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
