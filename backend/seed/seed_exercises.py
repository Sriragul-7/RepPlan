"""One-time seed script for the `exercises` table.

Usage:
    python -m seed.seed_exercises                # fetch + upsert into Supabase
    python -m seed.seed_exercises --dump-to data/exercises.seeded.json
    python -m seed.seed_exercises --source data/exercises.json --dump-to ...

Media is kept at its distributed 180x180 resolution (never upscaled/cropped)
and attributed in-app as required by the Gym visual license.
"""

import argparse
import json
from pathlib import Path

from app.config.settings import settings
from app.db import get_db
from app.services.exercise_data import DATASET_JSON_URL, fetch_dataset, transform_dataset

BATCH_SIZE = 200


def upsert_exercises(rows: list[dict]) -> int:
    db = get_db()
    inserted = 0
    for start in range(0, len(rows), BATCH_SIZE):
        batch = rows[start : start + BATCH_SIZE]
        data, _ = db.table("exercises").upsert(batch, on_conflict="id").execute()
        inserted += len(data)
    return inserted


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the exercises table.")
    parser.add_argument("--source", default=DATASET_JSON_URL, help="URL or local file path of exercises.json")
    parser.add_argument("--dump-to", type=Path, help="also write transformed rows to this JSON file")
    args = parser.parse_args()

    source = args.source
    if source.startswith("http"):
        print(f"Fetching dataset from {source} ...")
        raw = fetch_dataset()
    else:
        print(f"Reading dataset from {source} ...")
        raw = json.loads(Path(source).read_text())

    rows = transform_dataset(raw)
    print(f"Transformed {len(rows)} exercises")

    if args.dump_to:
        args.dump_to.parent.mkdir(parents=True, exist_ok=True)
        args.dump_to.write_text(json.dumps(rows, indent=2))
        print(f"Dumped to {args.dump_to}")

    if not args.dump_to or settings.supabase_url:
        if not settings.supabase_url:
            print("SUPABASE_URL not set — skipping database upsert.")
        else:
            count = upsert_exercises(rows)
            print(f"Upserted {count} rows into exercises")


if __name__ == "__main__":
    main()
