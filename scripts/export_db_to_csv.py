#!/usr/bin/env python3
"""
Export all journal data from PostgreSQL database to CSV files.
"""

import csv
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

DATA_DIR = Path(__file__).parent.parent / "data" / "csv_export"


def export_database():
    print("=" * 60)
    print("Database Export to CSV")
    print("=" * 60)

    # Create export directory
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # 1. Export main journals table with all data flattened
    print("\n1. Exporting journals (complete)...")
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
            jm.total_citations_3years,
            (SELECT string_agg(issn, '; ') FROM journal_issn WHERE journal_id = j.id) as issns,
            (SELECT string_agg(sa.name, '; ') FROM journal_areas ja JOIN subject_areas sa ON ja.area_id = sa.id WHERE ja.journal_id = j.id) as areas,
            (SELECT string_agg(c.name || ' (' || COALESCE(jc.quartile, 'N/A') || ')', '; ') FROM journal_categories jc JOIN categories c ON jc.category_id = c.id WHERE jc.journal_id = j.id) as categories
        FROM journals j
        LEFT JOIN journal_scopes js ON j.id = js.journal_id
        LEFT JOIN journal_metrics jm ON j.id = jm.journal_id
        ORDER BY j.publisher, j.title
    """)

    journals_file = DATA_DIR / "journals_complete.csv"
    with open(journals_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'id', 'source_id', 'title', 'publisher', 'country', 'open_access',
            'coverage', 'scimago_rank', 'scope_text', 'sjr', 'sjr_quartile',
            'h_index', 'total_docs_2024', 'total_docs_3years', 'citations_per_doc',
            'total_citations_3years', 'issns', 'areas', 'categories'
        ])
        rows = cur.fetchall()
        writer.writerows(rows)
    print(f"   Exported {len(rows)} journals to journals_complete.csv")

    # 2. Export journals basic info (simpler version)
    print("\n2. Exporting journals (basic)...")
    cur.execute("""
        SELECT
            j.source_id,
            j.title,
            j.publisher,
            jm.sjr_quartile,
            jm.sjr,
            jm.h_index,
            jm.citations_per_doc,
            j.open_access,
            j.country,
            j.coverage
        FROM journals j
        LEFT JOIN journal_metrics jm ON j.id = jm.journal_id
        ORDER BY j.publisher, jm.sjr DESC NULLS LAST
    """)

    basic_file = DATA_DIR / "journals_basic.csv"
    with open(basic_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'source_id', 'title', 'publisher', 'sjr_quartile', 'sjr',
            'h_index', 'citations_per_doc', 'open_access', 'country', 'coverage'
        ])
        rows = cur.fetchall()
        writer.writerows(rows)
    print(f"   Exported {len(rows)} journals to journals_basic.csv")

    # 3. Export scopes separately (for text analysis)
    print("\n3. Exporting journal scopes...")
    cur.execute("""
        SELECT
            j.source_id,
            j.title,
            j.publisher,
            js.scope_text
        FROM journals j
        JOIN journal_scopes js ON j.id = js.journal_id
        WHERE js.scope_text IS NOT NULL AND js.scope_text != ''
        ORDER BY j.publisher, j.title
    """)

    scopes_file = DATA_DIR / "journal_scopes.csv"
    with open(scopes_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['source_id', 'title', 'publisher', 'scope_text'])
        rows = cur.fetchall()
        writer.writerows(rows)
    print(f"   Exported {len(rows)} scopes to journal_scopes.csv")

    # 4. Export subject areas
    print("\n4. Exporting subject areas...")
    cur.execute("SELECT id, name FROM subject_areas ORDER BY name")

    areas_file = DATA_DIR / "subject_areas.csv"
    with open(areas_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'name'])
        rows = cur.fetchall()
        writer.writerows(rows)
    print(f"   Exported {len(rows)} subject areas to subject_areas.csv")

    # 5. Export categories
    print("\n5. Exporting categories...")
    cur.execute("SELECT id, name FROM categories ORDER BY name")

    categories_file = DATA_DIR / "categories.csv"
    with open(categories_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'name'])
        rows = cur.fetchall()
        writer.writerows(rows)
    print(f"   Exported {len(rows)} categories to categories.csv")

    # 6. Export by publisher (separate files)
    print("\n6. Exporting by publisher...")
    cur.execute("SELECT DISTINCT publisher FROM journals WHERE publisher IS NOT NULL ORDER BY publisher")
    publishers = [r[0] for r in cur.fetchall()]

    for publisher in publishers:
        cur.execute("""
            SELECT
                j.source_id,
                j.title,
                jm.sjr_quartile,
                jm.sjr,
                jm.h_index,
                jm.citations_per_doc,
                j.open_access,
                js.scope_text
            FROM journals j
            LEFT JOIN journal_metrics jm ON j.id = jm.journal_id
            LEFT JOIN journal_scopes js ON j.id = js.journal_id
            WHERE j.publisher = %s
            ORDER BY jm.sjr DESC NULLS LAST
        """, (publisher,))

        safe_name = publisher.lower().replace(' ', '_').replace(',', '')
        pub_file = DATA_DIR / f"journals_{safe_name}.csv"
        with open(pub_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'source_id', 'title', 'sjr_quartile', 'sjr', 'h_index',
                'citations_per_doc', 'open_access', 'scope_text'
            ])
            rows = cur.fetchall()
            writer.writerows(rows)
        print(f"   Exported {len(rows)} {publisher} journals")

    # 7. Summary statistics
    print("\n7. Exporting statistics...")
    cur.execute("""
        SELECT
            publisher,
            COUNT(*) as total,
            COUNT(CASE WHEN jm.sjr_quartile = 'Q1' THEN 1 END) as q1,
            COUNT(CASE WHEN jm.sjr_quartile = 'Q2' THEN 1 END) as q2,
            COUNT(CASE WHEN jm.sjr_quartile = 'Q3' THEN 1 END) as q3,
            COUNT(CASE WHEN jm.sjr_quartile = 'Q4' THEN 1 END) as q4,
            COUNT(js.scope_text) as with_scope,
            COUNT(CASE WHEN j.open_access THEN 1 END) as open_access,
            ROUND(AVG(jm.sjr)::numeric, 3) as avg_sjr,
            ROUND(AVG(jm.h_index)::numeric, 1) as avg_h_index
        FROM journals j
        LEFT JOIN journal_metrics jm ON j.id = jm.journal_id
        LEFT JOIN journal_scopes js ON j.id = js.journal_id
        GROUP BY publisher
        ORDER BY total DESC
    """)

    stats_file = DATA_DIR / "statistics_by_publisher.csv"
    with open(stats_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'publisher', 'total', 'q1', 'q2', 'q3', 'q4',
            'with_scope', 'open_access', 'avg_sjr', 'avg_h_index'
        ])
        rows = cur.fetchall()
        writer.writerows(rows)
    print(f"   Exported statistics to statistics_by_publisher.csv")

    cur.close()
    conn.close()

    # List all files
    print("\n" + "=" * 60)
    print("Export Complete!")
    print("=" * 60)
    print(f"\nFiles saved to: {DATA_DIR}")
    print("\nGenerated files:")
    for f in sorted(DATA_DIR.glob("*.csv")):
        size = f.stat().st_size / 1024
        print(f"  - {f.name} ({size:.1f} KB)")

    print(f"\nExported at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    export_database()
