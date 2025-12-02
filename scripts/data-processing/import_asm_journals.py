#!/usr/bin/env python3
"""
Import ASM journals with scope into the PostgreSQL database.
"""

import json
import re
import psycopg2
from pathlib import Path

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'journal_recommender',
    'user': 'journal_user',
    'password': 'journal_pass_2024'
}

DATA_DIR = Path(__file__).parent.parent / "data"
INPUT_JSON = DATA_DIR / "asm_journals_with_scope.json"


def parse_issn(issn_str: str) -> list[str]:
    """Parse ISSN string into list of ISSNs."""
    if not issn_str:
        return []
    # Split by comma and clean up
    issns = [i.strip() for i in issn_str.split(',')]
    return [i for i in issns if i]


def parse_categories(categories_str: str) -> list[tuple[str, str]]:
    """Parse categories string into list of (name, quartile) tuples."""
    if not categories_str:
        return []

    result = []
    # Format: "Category Name (Q1); Another Category (Q2)"
    parts = categories_str.split(';')
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Extract quartile from parentheses
        match = re.match(r'^(.+?)\s*\(([Q][1-4])\)$', part)
        if match:
            name, quartile = match.groups()
            result.append((name.strip(), quartile))
        else:
            # No quartile specified
            result.append((part, None))

    return result


def parse_areas(areas_str: str) -> list[str]:
    """Parse areas string into list of area names."""
    if not areas_str:
        return []
    # Split by semicolon and clean up
    areas = [a.strip() for a in areas_str.split(';')]
    return [a for a in areas if a]


def safe_float(val: str) -> float:
    """Convert string to float safely."""
    if not val:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def safe_int(val) -> int:
    """Convert to int safely."""
    if not val:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def main():
    print("=" * 60)
    print("ASM Journals Database Import")
    print("=" * 60)

    # Load JSON data
    print("\n1. Loading JSON data...")
    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        journals = json.load(f)
    print(f"   Loaded {len(journals)} journals")

    # Connect to database
    print("\n2. Connecting to database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    print("   Connected!")

    # Import journals
    print("\n3. Importing journals...")
    imported = 0
    skipped = 0

    for j in journals:
        source_id = j.get('source_id')
        if not source_id:
            skipped += 1
            continue

        try:
            # Insert journal
            cur.execute("""
                INSERT INTO journals (source_id, title, publisher, country, open_access, coverage, scimago_rank)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (source_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    publisher = EXCLUDED.publisher,
                    country = EXCLUDED.country,
                    open_access = EXCLUDED.open_access,
                    coverage = EXCLUDED.coverage,
                    scimago_rank = EXCLUDED.scimago_rank
                RETURNING id
            """, (
                source_id,
                j.get('title'),
                'American Society for Microbiology',
                j.get('country'),
                j.get('open_access', False),
                j.get('coverage'),
                safe_int(j.get('rank'))
            ))
            journal_id = cur.fetchone()[0]

            # Insert scope
            scope_text = j.get('scope')
            if scope_text:
                cur.execute("""
                    INSERT INTO journal_scopes (journal_id, scope_text)
                    VALUES (%s, %s)
                    ON CONFLICT (journal_id) DO UPDATE SET scope_text = EXCLUDED.scope_text
                """, (journal_id, scope_text))

            # Insert metrics
            cur.execute("""
                INSERT INTO journal_metrics (journal_id, sjr, sjr_quartile, h_index, total_docs_2024,
                    total_docs_3years, citations_per_doc, total_citations_3years)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (journal_id) DO UPDATE SET
                    sjr = EXCLUDED.sjr,
                    sjr_quartile = EXCLUDED.sjr_quartile,
                    h_index = EXCLUDED.h_index,
                    total_docs_2024 = EXCLUDED.total_docs_2024,
                    total_docs_3years = EXCLUDED.total_docs_3years,
                    citations_per_doc = EXCLUDED.citations_per_doc,
                    total_citations_3years = EXCLUDED.total_citations_3years
            """, (
                journal_id,
                safe_float(j.get('sjr')),
                j.get('sjr_quartile'),
                safe_int(j.get('h_index')),
                safe_int(j.get('total_docs_2024')),
                safe_int(j.get('total_docs_3years')),
                safe_float(j.get('citations_per_doc')),
                safe_int(j.get('total_citations_3years'))
            ))

            # Insert ISSNs
            issns = parse_issn(j.get('issn', ''))
            for issn in issns:
                cur.execute("""
                    INSERT INTO journal_issn (journal_id, issn)
                    VALUES (%s, %s)
                    ON CONFLICT (journal_id, issn) DO NOTHING
                """, (journal_id, issn))

            # Insert categories
            categories = parse_categories(j.get('categories', ''))
            for cat_name, quartile in categories:
                # Get or create category
                cur.execute("""
                    INSERT INTO categories (name) VALUES (%s)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (cat_name,))
                cat_id = cur.fetchone()[0]

                # Link journal to category
                cur.execute("""
                    INSERT INTO journal_categories (journal_id, category_id, quartile)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (journal_id, category_id) DO UPDATE SET quartile = EXCLUDED.quartile
                """, (journal_id, cat_id, quartile))

            # Insert areas
            areas = parse_areas(j.get('areas', ''))
            for area_name in areas:
                # Get or create area
                cur.execute("""
                    INSERT INTO subject_areas (name) VALUES (%s)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (area_name,))
                area_id = cur.fetchone()[0]

                # Link journal to area
                cur.execute("""
                    INSERT INTO journal_areas (journal_id, area_id)
                    VALUES (%s, %s)
                    ON CONFLICT (journal_id, area_id) DO NOTHING
                """, (journal_id, area_id))

            conn.commit()  # Commit after each successful journal import
            imported += 1
            if imported % 5 == 0:
                print(f"   Imported {imported} journals...")

        except Exception as e:
            print(f"   Error importing {j.get('title', 'Unknown')}: {e}")
            skipped += 1
            conn.rollback()
            continue

    # Summary
    print(f"\n4. Summary:")
    print(f"   Imported: {imported}")
    print(f"   Skipped: {skipped}")

    # Verify import
    cur.execute("SELECT COUNT(*) FROM journals WHERE publisher = 'American Society for Microbiology'")
    asm_count = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) FROM journals j
        JOIN journal_scopes js ON j.id = js.journal_id
        WHERE j.publisher = 'American Society for Microbiology'
    """)
    asm_with_scope = cur.fetchone()[0]

    print(f"\n5. Database verification:")
    print(f"   ASM journals in DB: {asm_count}")
    print(f"   ASM journals with scope: {asm_with_scope}")

    cur.close()
    conn.close()

    print("\n✓ Import completed!")


if __name__ == "__main__":
    main()
