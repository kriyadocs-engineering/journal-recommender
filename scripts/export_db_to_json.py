#!/usr/bin/env python3
"""
Export all journal data from PostgreSQL database to JSON files.
"""

import json
import psycopg2
from pathlib import Path
from datetime import datetime

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'journal_recommender',
    'user': 'journal_user',
    'password': 'journal_pass_2024'
}

DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_FILE = DATA_DIR / "database_export.json"


def export_database():
    print("=" * 60)
    print("Database Export to JSON")
    print("=" * 60)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Export journals with all related data
    print("\n1. Exporting journals...")
    cur.execute("""
        SELECT
            j.id,
            j.source_id,
            j.title,
            j.publisher,
            j.country,
            j.open_access,
            j.coverage,
            j.scimago_rank,
            js.scope_text,
            jm.sjr,
            jm.sjr_quartile,
            jm.h_index,
            jm.total_docs_2024,
            jm.total_docs_3years,
            jm.citations_per_doc,
            jm.total_citations_3years
        FROM journals j
        LEFT JOIN journal_scopes js ON j.id = js.journal_id
        LEFT JOIN journal_metrics jm ON j.id = jm.journal_id
        ORDER BY j.id
    """)

    journals = []
    for row in cur.fetchall():
        journal_id = row[0]

        # Get ISSNs
        cur.execute("SELECT issn FROM journal_issn WHERE journal_id = %s", (journal_id,))
        issns = [r[0] for r in cur.fetchall()]

        # Get categories
        cur.execute("""
            SELECT c.name, jc.quartile
            FROM journal_categories jc
            JOIN categories c ON jc.category_id = c.id
            WHERE jc.journal_id = %s
        """, (journal_id,))
        categories = [{"name": r[0], "quartile": r[1]} for r in cur.fetchall()]

        # Get areas
        cur.execute("""
            SELECT sa.name
            FROM journal_areas ja
            JOIN subject_areas sa ON ja.area_id = sa.id
            WHERE ja.journal_id = %s
        """, (journal_id,))
        areas = [r[0] for r in cur.fetchall()]

        journal = {
            "id": row[0],
            "source_id": row[1],
            "title": row[2],
            "publisher": row[3],
            "country": row[4],
            "open_access": row[5],
            "coverage": row[6],
            "scimago_rank": row[7],
            "scope_text": row[8],
            "metrics": {
                "sjr": float(row[9]) if row[9] else None,
                "sjr_quartile": row[10],
                "h_index": row[11],
                "total_docs_2024": row[12],
                "total_docs_3years": row[13],
                "citations_per_doc": float(row[14]) if row[14] else None,
                "total_citations_3years": row[15]
            },
            "issns": issns,
            "categories": categories,
            "areas": areas
        }
        journals.append(journal)

    print(f"   Exported {len(journals)} journals")

    # Export subject areas
    print("\n2. Exporting subject areas...")
    cur.execute("SELECT id, name FROM subject_areas ORDER BY name")
    subject_areas = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]
    print(f"   Exported {len(subject_areas)} subject areas")

    # Export categories
    print("\n3. Exporting categories...")
    cur.execute("SELECT id, name FROM categories ORDER BY name")
    categories_list = [{"id": r[0], "name": r[1]} for r in cur.fetchall()]
    print(f"   Exported {len(categories_list)} categories")

    # Get statistics
    cur.execute("SELECT COUNT(*) FROM journals")
    total_journals = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM journal_scopes")
    journals_with_scope = cur.fetchone()[0]

    cur.execute("SELECT publisher, COUNT(*) FROM journals GROUP BY publisher ORDER BY COUNT(*) DESC")
    by_publisher = {r[0]: r[1] for r in cur.fetchall()}

    cur.close()
    conn.close()

    # Create export object
    export_data = {
        "exported_at": datetime.now().isoformat(),
        "statistics": {
            "total_journals": total_journals,
            "journals_with_scope": journals_with_scope,
            "by_publisher": by_publisher,
            "total_subject_areas": len(subject_areas),
            "total_categories": len(categories_list)
        },
        "subject_areas": subject_areas,
        "categories": categories_list,
        "journals": journals
    }

    # Save to JSON
    print("\n4. Saving to JSON...")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    file_size = OUTPUT_FILE.stat().st_size / 1024
    print(f"   Saved to: {OUTPUT_FILE}")
    print(f"   File size: {file_size:.1f} KB")

    # Summary
    print("\n" + "=" * 60)
    print("Export Summary")
    print("=" * 60)
    print(f"Total journals: {total_journals}")
    print(f"With scope: {journals_with_scope}")
    print(f"Publishers: {len(by_publisher)}")
    for pub, count in by_publisher.items():
        print(f"  - {pub}: {count}")
    print(f"\nSubject areas: {len(subject_areas)}")
    print(f"Categories: {len(categories_list)}")
    print("\n✓ Export completed!")


if __name__ == "__main__":
    export_database()
