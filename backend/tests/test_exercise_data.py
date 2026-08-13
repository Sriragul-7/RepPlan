from app.services.exercise_data import (
    DATASET_RAW_BASE,
    equipment_compatible,
    transform_dataset,
    transform_exercise,
)


def sample_raw() -> dict:
    return {
        "id": "0001",
        "name": "3/4 sit-up",
        "category": "waist",
        "body_part": "waist",
        "equipment": "body weight",
        "instructions": {"en": "Lie flat.", "es": "..."},
        "instruction_steps": {"en": ["Lie flat."]},
        "muscle_group": "hip flexors",
        "secondary_muscles": ["hip flexors", "lower back"],
        "target": "abs",
        "media_id": "2gPfomN",
        "image": "images/0001-2gPfomN.jpg",
        "gif_url": "videos/0001-2gPfomN.gif",
        "attribution": "© Gym visual — https://gymvisual.com/",
        "created_at": "2026-03-18T12:31:32+00:00",
    }


def test_transform_maps_fields() -> None:
    row = transform_exercise(sample_raw())
    assert row["id"] == "0001"
    assert row["name"] == "3/4 sit-up"
    assert row["target_muscle"] == "abs"
    assert row["secondary_muscles"] == ["hip flexors", "lower back"]
    assert row["instructions_en"] == "Lie flat."


def test_media_urls_resolved_to_raw_base() -> None:
    row = transform_exercise(sample_raw())
    assert row["thumbnail_url"] == f"{DATASET_RAW_BASE}/images/0001-2gPfomN.jpg"
    assert row["gif_url"] == f"{DATASET_RAW_BASE}/videos/0001-2gPfomN.gif"


def test_media_resolution_never_resizes() -> None:
    """URLs reference the original distributed files; no size query params allowed."""
    row = transform_exercise(sample_raw())
    for url in (row["thumbnail_url"], row["gif_url"]):
        assert url == url.split("?")[0]
        assert "resize" not in url and "w=" not in url


def test_transform_dataset_skips_nonlist_secondary() -> None:
    raw = sample_raw()
    raw["secondary_muscles"] = "biceps"
    row = transform_exercise(raw)
    assert row["secondary_muscles"] == ["biceps"]


def test_equipment_matching() -> None:
    assert equipment_compatible("full gym", "barbell")
    assert equipment_compatible("home dumbbells", "dumbbell")
    assert not equipment_compatible("home dumbbells", "smith machine")
    assert equipment_compatible("bodyweight only", "body weight")
    assert not equipment_compatible("bodyweight only", "dumbbell")


def test_dataset_shape() -> None:
    raw = [sample_raw(), dict(sample_raw(), id="0002", name="x")]
    rows = transform_dataset(raw)
    assert len(rows) == 2
