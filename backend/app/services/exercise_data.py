"""Exercise dataset loading, normalization and equipment mapping.

The dataset (https://github.com/hasaneyldrm/exercises-dataset) ships relative
media paths. We resolve them to raw.githubusercontent URLs. Media is kept at
its distributed 180x180 resolution — never resized/cropped.
"""

import json
import re
from pathlib import Path

import httpx

DATASET_REPO = "https://github.com/hasaneyldrm/exercises-dataset"
DATASET_RAW_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main"
DATASET_JSON_URL = f"{DATASET_RAW_BASE}/data/exercises.json"

# Media attribution line, required by the media license (© Gym visual).
MEDIA_ATTRIBUTION = "Exercise media © Gym visual"

EQUIPMENT_GROUPS: dict[str, set[str]] = {
    # "home dumbbells" covers a realistic home setup.
    "home dumbbells": {
        "body weight",
        "dumbbell",
        "band",
        "resistance band",
        "kettlebell",
        "stability ball",
        "medicine ball",
        "roller",
        "ez barbell",
        "barbell",
        "trap bar",
        "hammer",
        "bosu ball",
        "wheel roller",
        "rope",
        "weighted",
    },
    # "bodyweight only" — no loaded equipment at all.
    "bodyweight only": {
        "body weight",
        "band",
        "resistance band",
        "rope",
        "wheel roller",
        "stability ball",
        "medicine ball",
    },
}


def allowed_equipment(equipment_access: str) -> set[str] | None:
    """Return the equipment set for an access level. None = everything (full gym)."""
    key = equipment_access.strip().lower()
    if key in ("full gym", "full_gym", "gym"):
        return None
    return EQUIPMENT_GROUPS.get(key, set(EQUIPMENT_GROUPS["home dumbbells"]))


def equipment_compatible(equipment_access: str, equipment: str) -> bool:
    allowed = allowed_equipment(equipment_access)
    if allowed is None:
        return True
    return equipment.strip().lower() in allowed


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def transform_exercise(raw: dict) -> dict:
    """Map one dataset record onto the `exercises` table shape."""
    image = raw.get("image", "")
    gif = raw.get("gif_url", "")

    def resolve(path: str) -> str | None:
        if not path:
            return None
        if path.startswith("http"):
            return path
        return f"{DATASET_RAW_BASE}/{path.lstrip('/')}"

    secondary = raw.get("secondary_muscles") or []
    if not isinstance(secondary, list):
        secondary = [secondary]

    return {
        "id": raw["id"],
        "name": raw.get("name", ""),
        "category": raw.get("category") or raw.get("body_part") or "",
        "body_part": raw.get("body_part") or raw.get("category") or "",
        "equipment": raw.get("equipment", ""),
        "target_muscle": raw.get("target", ""),
        "secondary_muscles": [m for m in secondary if m],
        "instructions_en": (raw.get("instructions") or {}).get("en", ""),
        "thumbnail_url": resolve(image),
        "gif_url": resolve(gif),
        "slug": _slugify(raw.get("name", "")),
    }


def transform_dataset(raw_list: list[dict]) -> list[dict]:
    return [transform_exercise(r) for r in raw_list]


def fetch_dataset(client: httpx.Client | None = None) -> list[dict]:
    """Download and parse the raw exercises.json."""
    own = client is None
    client = client or httpx.Client(timeout=60)
    try:
        resp = client.get(DATASET_JSON_URL)
        resp.raise_for_status()
        return resp.json()
    finally:
        if own:
            client.close()


def load_from_file(path: str | Path) -> list[dict]:
    """Load transformed exercises from a local JSON dump."""
    data = json.loads(Path(path).read_text())
    if data and isinstance(data[0], dict) and "target_muscle" in data[0]:
        return data
    return transform_dataset(data)
