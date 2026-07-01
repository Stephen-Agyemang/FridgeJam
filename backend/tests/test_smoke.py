"""Smoke tests for the FridgeJam API.

These exercise routing, request validation, and app wiring using paths that
run *before* any Gemini call, so they need no GEMINI_API_KEY and make no
network requests. They exist to catch import errors, broken routes, and
regressed validation on every push.
"""

from fastapi.testclient import TestClient

from main import app

# base_url uses an allowed host so requests pass TrustedHostMiddleware.
client = TestClient(app, base_url="http://localhost")


def test_health_ok():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "cooking"


def test_recipe_requires_personality():
    # 'personality' is required; omitting it must fail pydantic validation.
    resp = client.post("/api/recipe", json={"ingredients": "eggs"})
    assert resp.status_code == 422


def test_recipe_rejects_empty_input():
    # No ingredients and no dish hint -> 400 before any model call.
    resp = client.post("/api/recipe", json={"ingredients": "", "personality": "grandma"})
    assert resp.status_code == 400


def test_image_requires_prompt():
    # Blank prompt -> 400 before any model call.
    resp = client.post("/api/image", json={"prompt": "   "})
    assert resp.status_code == 400
