# 🍳 FridgeChef

Welcome to **FridgeChef**! An interactive, cozy web application built for the GDG Coding Jam (Track 4). FridgeChef transforms random leftovers in your fridge into mouth-watering, personalized recipes using Gemini AI. 

This repository features a fully responsive, state-of-the-art retro-cozy design, dynamic Sound Synthesizer, custom physics-based Leftovers Jar mini-game, and several high-fidelity modern upgrades:
- 🥗 **Chef Chloe (Nutritious/Fitness Coach)**: A brand new chef personality specialized in plant-based, keto-friendly, and protein-packed meals in a high-energy motivational voice.
- 📸 **Magical Fridge Photo Scanner (Multimodal Vision)**: Upload a photo of your fridge, analyze ingredients with `gemini-2.5-flash` in-memory, and watch them animate and drop into the Leftovers Jar as paper slips with realistic bubble sound effects!
- ⚡ **Accurate Nutrient & Calorie Metrics**: A premium indie macro tracker displaying Calories, Protein, Carbs, and Fat styled in colorful pastel capsule pills.
- 📄 **Beautiful Landscape PDF Exporters**: Populates a dedicated double-column print layout and downloads a print-ready A4 cookbook sheet using `html2pdf.js` with CORS cache-busting.
- 🎮 **Dynamic Game Progressive Difficulty**: Mini-game tracks elapsed time, recursively shrinking spawn intervals (down to `450ms`) and acceleration speeds across four difficulty stages (*Cozy 🥗*, *Simmering ⏱️*, *Spicy! 🌶️*, *CHEF MODE! ⚡🔥*).
- 💬 **Gemini Interactive Joke Reviewer**: After reading three puns, the chef prompts you to tell one back! It analyzes your joke via Gemini in real-time, giving funny laughs or blunt-but-playful reactions in your selected chef's voice with corresponding sound effects.

---

## 🚀 Quick Start (Local Setup)

Getting FridgeChef up and running locally is simple, and you have two ways to do it.

### Prerequisites
- **Python 3.11+**
- **Gemini API Key**: Grab a free key from [Google AI Studio](https://aistudio.google.com/).

### 1. Set Up Environment Variables
Navigate to the `backend/` directory, create a `.env` file based on `.env.example`, and add your key:
```bash
cd backend
cp .env.example .env
```
Open the `.env` file and insert your API key:
```env
GEMINI_API_KEY=your_api_key_here
```

---

### Option A: Lightning-Fast Launch (Using `uv`)
If you have `uv` installed (Astral's high-speed package manager), you can start the backend instantly. It will automatically resolve python versioning and dependencies.
```bash
# Run this from the repository root
cd backend
uv run uvicorn main:app --port 8001
```

### Option B: Standard Setup (Using `pip` & virtual environment)
If you prefer a standard Python setup, use a virtual environment and standard pip:
```bash
# From the repository root
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --port 8001
```

🎉 **Access the Web App:** Open [http://127.0.0.1:8001/](http://127.0.0.1:8001/) in your browser. 
*(Note: Because the backend mounts and serves the static `frontend/` folder directly at `/`, you run both the interface and the API from a single port—no complex local configurations or CORS issues!)*

---

## 🏗️ Architecture & Production Scalability

FridgeChef was engineered from the ground up to be **highly scalable, cost-efficient, and easy to deploy**:

1. **Single-Container Architecture**: The entire stack (FastAPI backend + static HTML/CSS/JS frontend) is served from a single port. The frontend makes relative calls to the API (e.g., `/api/recipe`), removing the need for separate frontend hosts or CORS configuration in production.
2. **Stateless Processing**: The Fridge Photo Scanner parses uploads completely in-memory using PIL and `BytesIO`, immediately passing them to Gemini. Since no temporary files are written to local disk storage, the backend is 100% stateless and horizontal-scaling friendly.
3. **Scale-to-Zero Compatibility**: Works out of the box with serverless container platforms like Google Cloud Run. You only pay for active CPU seconds when requests are running.

---

## ☁️ One-Click Cloud Deployment (Docker)

We have included a production-ready `Dockerfile` in the root directory. This makes cloud deployment straightforward.

### Deploying to Google Cloud Run (Recommended)
Google Cloud Run is the perfect host for FridgeChef since it natively supports container runtimes and scales to zero when no one is using it.

1. Ensure you have the [Google Cloud CLI](https://cloud.google.com/sdk/gcloud) installed and configured.
2. Run the following command from the root of the project:
   ```bash
   gcloud run deploy fridgechef \
     --source . \
     --env-vars-file backend/.env \
     --allow-unauthenticated \
     --region us-central1
   ```
3. That's it! Google Cloud will automatically build your container using Cloud Build, upload it, configure the `PORT`, inject your API keys, and give you a live production HTTPS URL.

### Running Docker Locally
If you want to test the production container locally:
```bash
# Build the container
docker build -t fridgechef .

# Run the container (injecting your API Key)
docker run -p 8080:8080 -e GEMINI_API_KEY="your_api_key_here" fridgechef
```
Then visit [http://localhost:8080/](http://localhost:8080/).

---

## 🎨 Design Systems & Cozy Touches
- **Typography**: Outfit (headings) + Lora (body) fonts loaded dynamically from Google Fonts.
- **Borders & Shadows**: Warm retro aesthetic utilizing crisp `2.5px` charcoal bold-borders (`#1E2022`) and soft, pillowy box-shadows (`4px 4px 0px`).
- **Accurate Calorie & Nutrient Pills**: Retro HSL-tinted macro capsules seamlessly displaying Calories, Protein, Carbs, and Fat.
- **Soundscape**: In-browser synthesizer that generates cute retro sound effects (bubbles, pops, clicks, sizzles) without external audio file dependencies.
- **Double-Column landscape Cookbook PDF**: A print-ready, CORS-resilient landscape blueprint that compiles your recipes onto a single sheet of paper using `html2pdf.js`.

---

## 🎮 Interactive Entertainment & AI Turing Challenges
FridgeChef keeps you entertained while your AI meal is cooking with two highly competitive and interactive games:
1. **Dynamic Skillet Game (Progressive Difficulty)**: Catch falling ingredients in your skillet! The game speeds up the longer you play—the spawning rate accelerates down to `450ms` and falling items speed up, progressing through **Cozy 🥗**, **Simmering ⏱️**, **Spicy! 🌶️**, and **CHEF MODE! ⚡🔥** stages.
2. **Gemini Joke Reviewer**: After reading three food puns, the chef challenges you to tell a joke back! It passes your joke to a Gemini API endpoint (`/api/evaluate-joke`) to evaluate it in real-time, giving funny laughs or blunt-but-playful reactions in your active chef's persona accompanied by custom synth beeps and click sounds.

