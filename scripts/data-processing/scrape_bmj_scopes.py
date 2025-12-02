#!/usr/bin/env python3
"""
Scrape journal scope/aims from Scimago journal pages for BMJ Publishing Group.
Uses the CSV data as base and enriches with scope text.
"""

import csv
import json
import time
import requests
from pathlib import Path
from bs4 import BeautifulSoup
from typing import Optional

# Paths
DATA_DIR = Path(__file__).parent.parent / "data"
INPUT_CSV = DATA_DIR / "bmj_journals.csv"
OUTPUT_JSON = DATA_DIR / "bmj_journals_with_scope.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

def parse_csv() -> list[dict]:
    """Parse the semicolon-delimited Scimago CSV."""
    journals = []

    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            journal = {
                'rank': int(row.get('Rank', 0)),
                'source_id': row.get('Sourceid', ''),
                'title': row.get('Title', '').strip('"'),
                'type': row.get('Type', ''),
                'issn': row.get('Issn', '').strip('"'),
                'publisher': row.get('Publisher', ''),
                'open_access': row.get('Open Access', '') == 'Yes',
                'sjr': row.get('SJR', '').replace(',', '.'),
                'sjr_quartile': row.get('SJR Best Quartile', ''),
                'h_index': int(row.get('H index', 0) or 0),
                'total_docs_2024': int(row.get('Total Docs. (2024)', 0) or 0),
                'total_docs_3years': int(row.get('Total Docs. (3years)', 0) or 0),
                'total_refs': int(row.get('Total Refs.', 0) or 0),
                'total_citations_3years': int(row.get('Total Citations (3years)', 0) or 0),
                'citable_docs_3years': int(row.get('Citable Docs. (3years)', 0) or 0),
                'citations_per_doc': row.get('Citations / Doc. (2years)', '').replace(',', '.'),
                'refs_per_doc': row.get('Ref. / Doc.', '').replace(',', '.'),
                'female_percent': row.get('%Female', '').replace(',', '.'),
                'country': row.get('Country', ''),
                'region': row.get('Region', ''),
                'coverage': row.get('Coverage', ''),
                'categories': row.get('Categories', '').strip('"'),
                'areas': row.get('Areas', '').strip('"'),
                'scope': None  # To be scraped
            }
            journals.append(journal)

    return journals


def get_journal_scope(source_id: str, title: str) -> Optional[str]:
    """Fetch scope text from Scimago journal page."""
    url = f"https://www.scimagojr.com/journalsearch.php?q={source_id}&tip=sid"

    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # First verify we got the correct journal by checking the title
        page_title = soup.find('h1', class_='jrnlname')
        if page_title:
            page_title_text = page_title.get_text(strip=True)
            # Basic check - title should be somewhat similar
            if title.lower()[:20] not in page_title_text.lower() and page_title_text.lower()[:20] not in title.lower():
                print(f"    Warning: Page title '{page_title_text[:50]}' may not match expected '{title[:50]}'")

        # Method 1: Find div with class "cuadrado fullwidth" containing h2 "Scope"
        # This is the most reliable method for SCImago pages
        for div in soup.find_all('div', class_='cuadrado'):
            h2 = div.find('h2')
            if h2 and 'Scope' in h2.get_text():
                # Get all text from div, then remove the h2 text
                full_text = div.get_text(strip=True)
                h2_text = h2.get_text(strip=True)
                scope_text = full_text.replace(h2_text, '', 1).strip()
                if len(scope_text) > 50:
                    return scope_text

        # Method 2: Look for h2 with "Scope" and get the parent div's text
        scope_header = soup.find('h2', string=lambda x: x and 'Scope' in str(x))
        if scope_header:
            parent = scope_header.find_parent('div')
            if parent:
                full_text = parent.get_text(strip=True)
                h2_text = scope_header.get_text(strip=True)
                scope_text = full_text.replace(h2_text, '', 1).strip()
                if len(scope_text) > 50:
                    return scope_text

        # Method 3: Look for div with journaldescription class
        scope_div = soup.find('div', class_='journaldescription')
        if scope_div:
            scope_text = scope_div.get_text(strip=True)
            if len(scope_text) > 50:
                return scope_text

        return None

    except Exception as e:
        print(f"Error fetching scope for {source_id}: {e}")
        return None


def scrape_all_scopes(journals: list[dict], delay: float = 1.0) -> list[dict]:
    """Scrape scope for all journals with rate limiting."""
    total = len(journals)

    for i, journal in enumerate(journals):
        print(f"[{i+1}/{total}] Fetching scope for: {journal['title'][:50]}...")

        scope = get_journal_scope(journal['source_id'], journal['title'])
        journal['scope'] = scope

        if scope:
            print(f"  ✓ Found scope ({len(scope)} chars)")
        else:
            print(f"  ✗ No scope found")

        # Rate limiting
        if i < total - 1:
            time.sleep(delay)

    return journals


def save_json(journals: list[dict], output_path: Path):
    """Save journals to JSON file."""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(journals, f, indent=2, ensure_ascii=False)
    print(f"\nSaved {len(journals)} journals to {output_path}")


def main():
    print("=" * 60)
    print("BMJ Publishing Group Journal Scope Scraper")
    print("=" * 60)

    # Parse CSV
    print("\n1. Parsing CSV...")
    journals = parse_csv()
    print(f"   Found {len(journals)} BMJ journals")

    # Scrape scopes
    print("\n2. Scraping journal scopes (this may take a few minutes)...")
    journals = scrape_all_scopes(journals, delay=1.5)

    # Summary
    with_scope = sum(1 for j in journals if j['scope'])
    print(f"\n3. Summary:")
    print(f"   Total journals: {len(journals)}")
    print(f"   With scope text: {with_scope}")
    print(f"   Missing scope: {len(journals) - with_scope}")

    # Save
    print("\n4. Saving to JSON...")
    save_json(journals, OUTPUT_JSON)

    print("\n✓ Done!")


if __name__ == "__main__":
    main()
