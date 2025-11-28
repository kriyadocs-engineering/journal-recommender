#!/usr/bin/env python3
"""
Import journal data from JSON export file into PostgreSQL database.
Use this to restore/seed the database from the exported JSON.
"""

import json
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
INPUT_FILE = DATA_DIR / "database_export.json"


def import_database():
    print("=" * 60)
    print("Database Import from JSON")
    print("=" * 60)

    # Load JSON
    print("\n1. Loading JSON file...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"   Exported at: {data['exported_at']}")
    print(f"   Total journals: {data['statistics']['total_journals']}")

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Clear existing data (optional - comment out if you want to merge)
    print("\n2. Clearing existing data...")
    cur.execute("TRUNCATE journals, journal_scopes, journal_metrics, journal_issn, journal_categories, journal_areas, categories, subject_areas RESTART IDENTITY CASCADE")
    conn.commit()
    print("   Done")

    # Import subject areas
    print("\n3. Importing subject areas...")
    for area in data['subject_areas']:
        cur.execute(
            "INSERT INTO subject_areas (id, name) VALUES (%s, %s) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name",
            (area['id'], area['name'])
        )
    # Reset sequence
    cur.execute("SELECT setval('subject_areas_id_seq', (SELECT MAX(id) FROM subject_areas))")
    conn.commit()
    print(f"   Imported {len(data['subject_areas'])} subject areas")

    # Import categories
    print("\n4. Importing categories...")
    for cat in data['categories']:
        cur.execute(
            "INSERT INTO categories (id, name) VALUES (%s, %s) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name",
            (cat['id'], cat['name'])
        )
    # Reset sequence
    cur.execute("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))")
    conn.commit()
    print(f"   Imported {len(data['categories'])} categories")

    # Import journals
    print("\n5. Importing journals...")
    imported = 0
    for j in data['journals']:
        try:
            # Insert journal
            cur.execute("""
                INSERT INTO journals (id, source_id, title, publisher, country, open_access, coverage, scimago_rank)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    source_id = EXCLUDED.source_id,
                    title = EXCLUDED.title,
                    publisher = EXCLUDED.publisher,
                    country = EXCLUDED.country,
                    open_access = EXCLUDED.open_access,
                    coverage = EXCLUDED.coverage,
                    scimago_rank = EXCLUDED.scimago_rank
            """, (
                j['id'],
                j['source_id'],
                j['title'],
                j['publisher'],
                j['country'],
                j['open_access'],
                j['coverage'],
                j['scimago_rank']
            ))

            # Insert scope
            if j.get('scope_text'):
                cur.execute("""
                    INSERT INTO journal_scopes (journal_id, scope_text)
                    VALUES (%s, %s)
                    ON CONFLICT (journal_id) DO UPDATE SET scope_text = EXCLUDED.scope_text
                """, (j['id'], j['scope_text']))

            # Insert metrics
            m = j.get('metrics', {})
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
                j['id'],
                m.get('sjr'),
                m.get('sjr_quartile'),
                m.get('h_index'),
                m.get('total_docs_2024'),
                m.get('total_docs_3years'),
                m.get('citations_per_doc'),
                m.get('total_citations_3years')
            ))

            # Insert ISSNs
            for issn in j.get('issns', []):
                cur.execute("""
                    INSERT INTO journal_issn (journal_id, issn)
                    VALUES (%s, %s)
                    ON CONFLICT (journal_id, issn) DO NOTHING
                """, (j['id'], issn))

            # Insert category links
            for cat in j.get('categories', []):
                cur.execute("SELECT id FROM categories WHERE name = %s", (cat['name'],))
                result = cur.fetchone()
                if result:
                    cur.execute("""
                        INSERT INTO journal_categories (journal_id, category_id, quartile)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (journal_id, category_id) DO UPDATE SET quartile = EXCLUDED.quartile
                    """, (j['id'], result[0], cat.get('quartile')))

            # Insert area links
            for area_name in j.get('areas', []):
                cur.execute("SELECT id FROM subject_areas WHERE name = %s", (area_name,))
                result = cur.fetchone()
                if result:
                    cur.execute("""
                        INSERT INTO journal_areas (journal_id, area_id)
                        VALUES (%s, %s)
                        ON CONFLICT (journal_id, area_id) DO NOTHING
                    """, (j['id'], result[0]))

            imported += 1
            if imported % 50 == 0:
                print(f"   Imported {imported} journals...")

        except Exception as e:
            print(f"   Error importing journal {j.get('title', 'Unknown')}: {e}")
            continue

    # Reset journal sequence
    cur.execute("SELECT setval('journals_id_seq', (SELECT MAX(id) FROM journals))")
    conn.commit()

    print(f"   Imported {imported} journals total")

    # Verify
    print("\n6. Verifying import...")
    cur.execute("SELECT COUNT(*) FROM journals")
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM journal_scopes")
    with_scope = cur.fetchone()[0]

    print(f"   Journals in DB: {total}")
    print(f"   With scope: {with_scope}")

    cur.close()
    conn.close()

    print("\n✓ Import completed!")


if __name__ == "__main__":
    import_database()
