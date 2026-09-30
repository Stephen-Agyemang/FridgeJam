"""Smoke tests for the FridgeJam API.

These exercise routing, request validation, and app wiring using paths that
run *before* any Gemini call, so they need no GEMINI_API_KEY and make no
network requests. They exist to catch import errors, broken routes, and
regressed validation on every push.
"""

from fastapi.testclient import TestClient

from main import app, _reconcile_have_flags

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


def test_substitute_requires_ingredient():
    # Blank ingredient -> 400 before any model call.
    resp = client.post("/api/substitute", json={"ingredient": "   "})
    assert resp.status_code == 400


def test_substitute_rejects_bad_payload():
    # Wrong types must fail pydantic validation.
    resp = client.post("/api/substitute", json={"ingredient": 5, "recipe_ingredients": "nope"})
    assert resp.status_code == 422


def _recipe(*items):
    return {"ingredients": [{"name": n, "is_user_ingredient": have} for n, have in items]}


def test_have_flags_keep_real_matches():
    # Plurals and descriptors still match what the user typed.
    recipe = _recipe(("Long-grain rice", True), ("Tinned diced tomatoes", True), ("Olive oil", False))
    assert _reconcile_have_flags(recipe, ["rice", "tomatoes"]) == 0
    assert [i["is_user_ingredient"] for i in recipe["ingredients"]] == [True, True, False]


def test_have_flags_flip_unlisted_items():
    # Planner-style leak: the user typed chicken only.
    recipe = _recipe(("Chicken breast", True), ("Cinnamon powder", True), ("Cucumber", True))
    assert _reconcile_have_flags(recipe, ["chicken"]) == 2
    assert [i["is_user_ingredient"] for i in recipe["ingredients"]] == [True, False, False]


def test_have_flags_respect_spelling_corrections():
    recipe = _recipe(("Broccoli florets", True))
    recipe["spelling_corrections"] = [{"original": "brocoly", "interpreted_as": "broccoli"}]
    assert _reconcile_have_flags(recipe, ["brocoly"]) == 0


def test_have_flags_dish_only_request_has_no_haves():
    recipe = _recipe(("Thyme", True), ("Scotch bonnet pepper", True))
    assert _reconcile_have_flags(recipe, []) == 2
