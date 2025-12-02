#!/usr/bin/env python3
"""
Scrape BMJ Publishing Group journals from SCImago and import into database.
"""

import sys
import json
import time
import requests
import psycopg2
import re
from bs4 import BeautifulSoup
from typing import Optional, Dict, List

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

# Database connection
DATABASE_URL = "postgresql://journal_user:journal_pass_2024@localhost:5433/journal_recommender"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
}

# Known BMJ journal source IDs from SCImago
BMJ_JOURNALS = [
    {"source_id": "51748", "title": "BMJ"},
    {"source_id": "19800188003", "title": "BMJ Open"},
    {"source_id": "16637", "title": "Gut"},
    {"source_id": "28549", "title": "Thorax"},
    {"source_id": "18050", "title": "Journal of Neurology, Neurosurgery and Psychiatry"},
    {"source_id": "12951", "title": "British Journal of Sports Medicine"},
    {"source_id": "16912", "title": "Heart"},
    {"source_id": "17387", "title": "Journal of Epidemiology and Community Health"},
    {"source_id": "17562", "title": "Journal of Medical Genetics"},
    {"source_id": "12937", "title": "British Journal of Ophthalmology"},
    {"source_id": "21100244622", "title": "BMJ Quality and Safety"},
    {"source_id": "11400", "title": "Archives of Disease in Childhood"},
    {"source_id": "21177", "title": "Occupational and Environmental Medicine"},
    {"source_id": "17292", "title": "Journal of Clinical Pathology"},
    {"source_id": "28497", "title": "Tobacco Control"},
    {"source_id": "21100199502", "title": "Archives of Disease in Childhood: Fetal and Neonatal Edition"},
    {"source_id": "21100786498", "title": "Journal for ImmunoTherapy of Cancer"},
    {"source_id": "25222", "title": "Regional Anesthesia and Pain Medicine"},
    {"source_id": "26968", "title": "Sexually Transmitted Infections"},
    {"source_id": "14618", "title": "Emergency Medicine Journal"},
    {"source_id": "21100932737", "title": "BMJ Open Quality"},
    {"source_id": "21101041869", "title": "BMJ Open Science"},
    {"source_id": "21101056543", "title": "BMJ Neurology Open"},
    {"source_id": "21100198730", "title": "Annals of the Rheumatic Diseases"},
    {"source_id": "21100903112", "title": "BMJ Global Health"},
    {"source_id": "15413", "title": "Evidence-Based Mental Health"},
    {"source_id": "15412", "title": "Evidence-Based Nursing"},
    {"source_id": "21100207866", "title": "Injury Prevention"},
    {"source_id": "21100199820", "title": "Postgraduate Medical Journal"},
    {"source_id": "21100830702", "title": "BMJ Open Respiratory Research"},
    {"source_id": "21100199503", "title": "Veterinary Record"},
    {"source_id": "21100867637", "title": "BMJ Supportive and Palliative Care"},
    {"source_id": "21100843200", "title": "BMJ Open Diabetes Research and Care"},
    {"source_id": "17991", "title": "Journal of Medical Ethics"},
    {"source_id": "21101018659", "title": "BMJ Open Gastroenterology"},
    {"source_id": "21101041865", "title": "BMJ Open Sport and Exercise Medicine"},
    {"source_id": "21100779553", "title": "BMJ Innovations"},
    {"source_id": "21100867638", "title": "RMD Open"},
    {"source_id": "21100898604", "title": "ESMO Open"},
    {"source_id": "21100799048", "title": "BMJ Sexual and Reproductive Health"},
    {"source_id": "28001", "title": "Practical Neurology"},
    {"source_id": "21100930040", "title": "BMJ Leader"},
    {"source_id": "21101042022", "title": "BMJ Nutrition, Prevention and Health"},
    {"source_id": "21100889409", "title": "BMJ Evidence-Based Medicine"},
    {"source_id": "21100255000", "title": "BMJ Case Reports"},
    {"source_id": "19900193333", "title": "BMJ Military Health"},
]


def fetch_journal_details(source_id: str, title: str) -> Dict:
    """Fetch detailed info for a single journal from SCImago."""
    url = f"https://www.scimagojr.com/journalsearch.php?q={source_id}&tip=sid"

    details = {
        'source_id': source_id,
        'title': title,
        'publisher': 'BMJ Publishing Group',
        'scope': None,
        'sjr': None,
        'sjr_quartile': None,
        'h_index': None,
        'country': 'United Kingdom',
        'open_access': False,
    }

    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Method 1: Look for h2 with "Scope" and get following content
        scope_header = soup.find('h2', string=re.compile(r'^Scope', re.I))
        if scope_header:
            # Get the next sibling text or paragraph
            next_elem = scope_header.find_next_sibling()
            if next_elem:
                scope_text = next_elem.get_text(strip=True)
                if len(scope_text) > 30:
                    details['scope'] = scope_text
            else:
                # Try getting text from parent's next section
                parent = scope_header.parent
                if parent:
                    scope_text = ""
                    for sibling in scope_header.next_siblings:
                        if hasattr(sibling, 'get_text'):
                            text = sibling.get_text(strip=True)
                            if text:
                                scope_text += text + " "
                        elif isinstance(sibling, str) and sibling.strip():
                            scope_text += sibling.strip() + " "
                    if len(scope_text) > 30:
                        details['scope'] = scope_text.strip()

        # Method 2: Look for journaldescription class
        if not details['scope']:
            scope_div = soup.find('div', class_='journaldescription')
            if scope_div:
                details['scope'] = scope_div.get_text(strip=True)

        # Method 3: Look for any substantial paragraph after journal title
        if not details['scope']:
            # Find the main content area
            for p in soup.find_all('p'):
                text = p.get_text(strip=True)
                # Look for scope-like content
                if len(text) > 100 and any(word in text.lower() for word in
                    ['publishes', 'covers', 'aims', 'journal', 'research', 'clinical', 'medicine']):
                    if title.split()[0].lower() in text.lower() or 'bmj' in text.lower():
                        details['scope'] = text
                        break

        # Get H-index from specific cell
        h_elem = soup.find('div', class_='hindexnumber')
        if h_elem:
            try:
                details['h_index'] = int(h_elem.get_text(strip=True))
            except:
                pass

        # Get SJR from cell
        cells = soup.find_all('div', class_='cellcontent')
        for cell in cells:
            text = cell.get_text(strip=True)
            if re.match(r'^\d+[,\.]\d+$', text):
                try:
                    sjr_val = float(text.replace(',', '.'))
                    if sjr_val < 50:  # SJR is typically < 50
                        details['sjr'] = sjr_val
                        break
                except:
                    pass

        # Get quartile
        for q in ['Q1', 'Q2', 'Q3', 'Q4']:
            q_elem = soup.find(string=re.compile(rf'\b{q}\b'))
            if q_elem:
                details['sjr_quartile'] = q
                break

        # Check for open access
        if soup.find(string=re.compile(r'Open Access', re.I)):
            details['open_access'] = True

        return details

    except Exception as e:
        print(f"  Error: {e}", flush=True)
        return details


def insert_journal_to_db(conn, journal: Dict) -> Optional[str]:
    """Insert journal and related data into database."""
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM journals WHERE source_id = %s", (journal['source_id'],))
        existing = cursor.fetchone()

        if existing:
            journal_id = existing[0]
            cursor.execute("""
                UPDATE journals SET
                    title = %s, publisher = %s, country = %s, open_access = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (journal['title'], journal['publisher'], journal.get('country'),
                  journal.get('open_access', False), journal_id))
        else:
            cursor.execute("""
                INSERT INTO journals (source_id, title, publisher, country, open_access)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (journal['source_id'], journal['title'], journal['publisher'],
                  journal.get('country'), journal.get('open_access', False)))
            journal_id = cursor.fetchone()[0]

        if journal.get('scope'):
            cursor.execute("""
                INSERT INTO journal_scopes (journal_id, scope_text)
                VALUES (%s, %s)
                ON CONFLICT (journal_id) DO UPDATE SET scope_text = EXCLUDED.scope_text
            """, (journal_id, journal['scope']))

        cursor.execute("""
            INSERT INTO journal_metrics (journal_id, sjr, sjr_quartile, h_index)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (journal_id) DO UPDATE SET
                sjr = COALESCE(EXCLUDED.sjr, journal_metrics.sjr),
                sjr_quartile = COALESCE(EXCLUDED.sjr_quartile, journal_metrics.sjr_quartile),
                h_index = COALESCE(EXCLUDED.h_index, journal_metrics.h_index),
                updated_at = CURRENT_TIMESTAMP
        """, (journal_id, journal.get('sjr'), journal.get('sjr_quartile'), journal.get('h_index')))

        conn.commit()
        return str(journal_id)

    except Exception as e:
        conn.rollback()
        print(f"  DB Error: {e}", flush=True)
        return None


def main():
    print("=" * 60, flush=True)
    print("BMJ Publishing Group Journal Scraper", flush=True)
    print("=" * 60, flush=True)

    print("\nConnecting to database...", flush=True)
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("  Connected!", flush=True)
    except Exception as e:
        print(f"  Failed: {e}", flush=True)
        return

    journals = BMJ_JOURNALS
    print(f"\n1. Processing {len(journals)} BMJ journals...", flush=True)

    success_count = 0
    scope_count = 0

    for i, journal in enumerate(journals):
        print(f"\n[{i+1}/{len(journals)}] {journal['title'][:45]}...", flush=True)

        details = fetch_journal_details(journal['source_id'], journal['title'])

        if details.get('scope'):
            scope_count += 1
            preview = details['scope'][:70].replace('\n', ' ') + "..."
            print(f"  Scope: {preview}", flush=True)
        else:
            print(f"  No scope found", flush=True)

        journal_id = insert_journal_to_db(conn, details)
        if journal_id:
            success_count += 1
            print(f"  Saved (Q: {details.get('sjr_quartile', 'N/A')}, H: {details.get('h_index', 'N/A')})", flush=True)

        time.sleep(1.5)

    print("\n" + "=" * 60, flush=True)
    print(f"Summary: {success_count}/{len(journals)} imported, {scope_count} with scope", flush=True)
    print("=" * 60, flush=True)

    conn.close()
    print("\nDone!", flush=True)


if __name__ == "__main__":
    main()
