#!/usr/bin/env python3
"""
Create the final database format for the journal recommender application.
"""

import json
from pathlib import Path
from datetime import datetime

DATA_DIR = Path(__file__).parent.parent / "data"
INPUT_JSON = DATA_DIR / "world_scientific_journals_clean.json"
OUTPUT_JSON = DATA_DIR / "journals_database.json"
OUTPUT_FRONTEND = Path(__file__).parent.parent / "frontend" / "src" / "data" / "journals.json"

def create_database_entry(journal: dict) -> dict:
    """Create a clean database entry for the application."""
    return {
        "id": journal.get("source_id"),
        "title": journal.get("title"),
        "issn": journal.get("issn_list", []),
        "publisher": "World Scientific",
        "openAccess": journal.get("open_access", False),
        "metrics": {
            "sjr": journal.get("sjr"),
            "sjrQuartile": journal.get("sjr_quartile"),
            "hIndex": journal.get("h_index"),
            "totalDocs2024": journal.get("total_docs_2024"),
            "totalDocs3Years": journal.get("total_docs_3years"),
            "citationsPerDoc": journal.get("citations_per_doc"),
            "totalCitations3Years": journal.get("total_citations_3years"),
        },
        "scope": journal.get("scope", ""),
        "categories": journal.get("categories_parsed", []),
        "areas": journal.get("areas_list", []),
        "country": journal.get("country"),
        "coverage": journal.get("coverage"),
        "rank": journal.get("rank"),
    }


def main():
    print("Loading cleaned journal data...")
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        journals = json.load(f)

    print(f"Processing {len(journals)} journals...")
    database = [create_database_entry(j) for j in journals]

    # Sort by SJR rank
    database.sort(key=lambda x: x.get("rank", 99999))

    # Create metadata
    output = {
        "metadata": {
            "source": "Scimago Journal Rankings",
            "publisher": "World Scientific",
            "totalJournals": len(database),
            "lastUpdated": datetime.now().isoformat(),
            "version": "1.0",
        },
        "journals": database,
    }

    # Summary stats
    q1_count = sum(1 for j in database if j["metrics"].get("sjrQuartile") == "Q1")
    q2_count = sum(1 for j in database if j["metrics"].get("sjrQuartile") == "Q2")
    q3_count = sum(1 for j in database if j["metrics"].get("sjrQuartile") == "Q3")
    q4_count = sum(1 for j in database if j["metrics"].get("sjrQuartile") == "Q4")
    with_scope = sum(1 for j in database if j.get("scope"))
    open_access = sum(1 for j in database if j.get("openAccess"))

    print(f"\n=== Database Summary ===")
    print(f"Total journals: {len(database)}")
    print(f"With scope text: {with_scope}")
    print(f"Open access: {open_access}")
    print(f"By quartile: Q1={q1_count}, Q2={q2_count}, Q3={q3_count}, Q4={q4_count}")

    # Collect all unique areas
    all_areas = set()
    for j in database:
        all_areas.update(j.get("areas", []))
    print(f"Subject areas: {sorted(all_areas)}")

    # Save to data directory
    print(f"\nSaving to {OUTPUT_JSON}...")
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # Also save to frontend
    OUTPUT_FRONTEND.parent.mkdir(parents=True, exist_ok=True)
    print(f"Saving to {OUTPUT_FRONTEND}...")
    with open(OUTPUT_FRONTEND, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print("\n✓ Database created successfully!")


if __name__ == "__main__":
    main()
