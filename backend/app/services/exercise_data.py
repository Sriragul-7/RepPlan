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


# Short shape/initial words that read better fully uppercase (V-Up, JM Press).
_CAPS_WORDS = {"jm", "v", "s", "t"}


def format_exercise_name(name: str) -> str:
    """Title-case an exercise name for display, e.g. 'incline dumbbell press' ->
    'Incline Dumbbell Press'. Idempotent for already-formatted names."""
    if not name:
        return name

    def _cap(part: str) -> str:
        return part.upper() if part.lower() in _CAPS_WORDS else part.capitalize()

    return " ".join("-".join(_cap(part) for part in word.split("-")) for word in name.split())


# Curated canonical, everyday exercises. Exact-name matches are boosted hard so
# the classic go-to versions float to the top of searches and plan picks.
CANONICAL_MAINSTREAM: set[str] = {
    "barbell bench press",
    "dumbbell bench press",
    "barbell incline bench press",
    "dumbbell incline bench press",
    "barbell decline bench press",
    "barbell close-grip bench press",
    "push-up",
    "incline push-up",
    "diamond push-up",
    "barbell front squat",
    "barbell full squat",
    "barbell high bar squat",
    "barbell low bar squat",
    "barbell deadlift",
    "barbell sumo deadlift",
    "barbell romanian deadlift",
    "dumbbell deadlift",
    "dumbbell romanian deadlift",
    "dumbbell goblet squat",
    "dumbbell squat",
    "barbell seated overhead press",
    "dumbbell standing overhead press",
    "dumbbell seated shoulder press",
    "dumbbell arnold press",
    "barbell upright row",
    "barbell bent over row",
    "dumbbell bent over row",
    "barbell pendlay row",
    "seated cable row",
    "pull-up",
    "chin-up",
    "barbell curl",
    "dumbbell hammer curl",
    "barbell preacher curl",
    "dumbbell concentration curl",
    "cable triceps pushdown (v-bar)",
    "barbell lying triceps extension skull crusher",
    "barbell lunge",
    "dumbbell lunge",
    "walking lunge",
    "lever leg extension",
    "lever lying leg curl",
    "barbell glute bridge",
    "barbell standing calf raise",
    "barbell seated calf raise",
    "dumbbell standing calf raise",
    "dumbbell lateral raise",
    "dumbbell front raise",
    "barbell front raise",
    "russian twist",
    "hanging leg raise",
    "mountain climber",
    "dead bug",
    "dumbbell fly",
    "kettlebell swing",
}

# The definitive go-to versions of the most common lifts. These should always
# outrank even close mainstream variations (flat bench over decline/incline,
# standard deadlift over sumo, etc.).
PRIMARY_CANONICAL: set[str] = {
    "barbell bench press",
    "dumbbell bench press",
    "barbell front squat",
    "barbell full squat",
    "barbell deadlift",
    "barbell romanian deadlift",
    "barbell seated overhead press",
    "dumbbell seated shoulder press",
    "dumbbell lateral raise",
    "barbell bent over row",
    "dumbbell bent over row",
    "seated cable row",
    "pull-up",
    "chin-up",
    "barbell curl",
    "dumbbell hammer curl",
    "cable triceps pushdown (v-bar)",
    "barbell lunge",
    "dumbbell lunge",
    "lever leg extension",
    "lever lying leg curl",
    "barbell glute bridge",
    "barbell standing calf raise",
    "russian twist",
    "hanging leg raise",
    "dumbbell fly",
    "barbell shrug",
    "dumbbell shrug",
    "barbell wrist curl",
}

MAINSTREAM_KEYWORDS: dict[str, int] = {
    # Compounds everyone knows.
    "bench press": 6,
    "squat": 6,
    "deadlift": 6,
    "overhead press": 6,
    "shoulder press": 6,
    "bent over row": 6,
    "lateral raise": 6,
    "push-up": 6,
    "pull-up": 6,
    "chin-up": 6,
    "hip thrust": 6,
    "glute bridge": 6,
    "leg press": 6,
    "leg curl": 6,
    "leg extension": 6,
    "calf raise": 6,
    "triceps pushdown": 6,
    "lat pulldown": 6,
    "russian twist": 6,
    "face pull": 6,
    "goblet": 6,
    "thruster": 6,
    # Common variations / equipment.
    "dumbbell": 4,
    "barbell": 4,
    "cable": 3,
    "kettlebell": 4,
    "smith": 2,
    "machine": 2,
    "close-grip": 3,
    "wide-grip": 2,
    # Broad families.
    "curl": 4,
    "hammer curl": 5,
    "preacher curl": 5,
    "concentration curl": 5,
    "skull crusher": 5,
    "pushdown": 5,
    "extension": 3,
    "pulldown": 4,
    "row": 4,
    "fly": 4,
    "front raise": 5,
    "rear delt": 4,
    "crunch": 4,
    "plank": 4,
    "lunge": 5,
    "dip": 4,
    "farmer": 4,
    "carry": 2,
    "clean": 4,
    "snatch": 4,
    "shrug": 5,
    "upright row": 5,
    "pendlay": 5,
    "good morning": 5,
    "leg raise": 4,
    "hip abduction": 5,
    "hip adduction": 5,
    "wrist curl": 4,
    "reverse curl": 5,
    "cable crossover": 5,
}

# Equipment considered "real gym" gets a small popularity bump so obscure
# band/ball variants trail the standard barbell/dumbbell/machine versions.
_LOADED_EQUIPMENT = {
    "barbell",
    "dumbbell",
    "ez barbell",
    "olympic barbell",
    "kettlebell",
    "cable",
    "smith machine",
    "leverage machine",
    "machine",
    "trap bar",
    "sled machine",
    "weighted",
}
_LIGHT_EQUIPMENT = {
    "band",
    "resistance band",
    "stability ball",
    "medicine ball",
    "roller",
    "bosu ball",
    "assisted",
    "rope",
    "wheel roller",
}
_VARIANT_MARKERS = (
    "(male)",
    "(female)",
    "v. 2",
    "v. 3",
    "v. 4",
    "with arm blaster",
    "on exercise ball",
    "on stability ball",
    "on bosu ball",
    "sitted",
)
# Obscure, single-sided, or gimmick variants are pushed below the standard lift.
_OBSCURE_MARKERS = (
    "one arm",
    "one-arm",
    "single leg",
    "single-leg",
    "alternate",
    "alternating",
    "cross body",
    "cross-body",
    "reverse grip",
    "reverse-grip",
    "palms in",
    "palms out",
    "with towel",
    "with throw",
    "with leg raised",
    "with stork",
    "with bowling",
    "on knee",
    "jump",
    "turkish",
    "windmill",
    "sprint",
    "skip",
    "kick",
)


def popularity_score(exercise: dict) -> int:
    """Score how mainstream/recognizable an exercise is (higher = more common)."""
    name = (exercise.get("name") or "").lower().strip()
    score = 0

    if name in PRIMARY_CANONICAL:
        score += 25
    elif name in CANONICAL_MAINSTREAM:
        score += 18
    for keyword, weight in MAINSTREAM_KEYWORDS.items():
        if keyword in name:
            score += weight

    equipment = (exercise.get("equipment") or "").lower().strip()
    if equipment in _LOADED_EQUIPMENT:
        score += 3
    elif equipment in _LIGHT_EQUIPMENT:
        score += 1

    if any(marker in name for marker in _VARIANT_MARKERS):
        score -= 1
    if any(marker in name for marker in _OBSCURE_MARKERS):
        score -= 4

    return score


def sort_by_popularity(exercises: list[dict]) -> list[dict]:
    """Return a copy sorted so the most mainstream exercises come first."""
    return sorted(exercises, key=lambda e: -popularity_score(e))


def transform_exercise(raw: dict) -> dict:
    """Map one dataset record onto the `exercises` table shape.

    Accepts both the upstream dataset naming (target / image / instructions.en)
    and the local curated dump naming (target_muscle / thumbnail_url /
    instructions_en) so the seed produces complete rows either way.
    """
    image = raw.get("image") or raw.get("thumbnail_url") or ""
    gif = raw.get("gif_url") or ""

    def resolve(path: str) -> str | None:
        if not path:
            return None
        if path.startswith("http"):
            return path
        return f"{DATASET_RAW_BASE}/{path.lstrip('/')}"

    secondary = raw.get("secondary_muscles") or []
    if not isinstance(secondary, list):
        secondary = [secondary]

    target = raw.get("target_muscle") or raw.get("target") or ""
    instructions = raw.get("instructions_en")
    if not instructions:
        instructions = (raw.get("instructions") or {}).get("en", "")

    return {
        "id": raw["id"],
        "name": format_exercise_name(raw.get("name", "")),
        "category": raw.get("category") or raw.get("body_part") or "",
        "body_part": raw.get("body_part") or raw.get("category") or "",
        "equipment": raw.get("equipment", ""),
        "target_muscle": target,
        "secondary_muscles": [m for m in secondary if m],
        "instructions_en": instructions or "",
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
        return [{**row, "name": format_exercise_name(row.get("name", ""))} for row in data]
    return transform_dataset(data)
