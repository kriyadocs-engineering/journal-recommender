#!/usr/bin/env python3
"""
Clean scraped scope data to extract just the relevant journal description.
"""

import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
INPUT_JSON = DATA_DIR / "world_scientific_journals_with_scope.json"
OUTPUT_JSON = DATA_DIR / "world_scientific_journals_clean.json"

def extract_scope_description(raw_scope: str, title: str) -> str:
    """Extract just the scope/aims text from the raw scraped content."""
    if not raw_scope:
        return ""

    # Look for "Scope" marker and extract text after it
    scope_markers = ['Scope', 'Aims and Scope', 'About']

    for marker in scope_markers:
        if marker in raw_scope:
            # Get text after the marker
            idx = raw_scope.index(marker)
            text = raw_scope[idx + len(marker):]

            # Clean up the text
            text = text.strip()

            # Remove common trailing navigation items
            end_markers = ['Join the conversation', 'Enter Journal', 'Related journals',
                           'Homepage', 'How to publish', 'Contact', 'Quartiles']
            for end in end_markers:
                if end in text:
                    text = text[:text.index(end)]

            # Clean whitespace
            text = re.sub(r'\s+', ' ', text).strip()

            if len(text) > 50:  # Meaningful content
                return text

    # Fallback: try to find descriptive sentences
    sentences = re.split(r'(?<=[.!?])\s+', raw_scope)
    descriptive = []

    for sent in sentences:
        sent = sent.strip()
        # Skip navigation/metadata-like sentences
        if any(skip in sent.lower() for skip in ['click', 'login', 'subscribe', 'issn', 'homepage']):
            continue
        # Keep sentences that describe the journal
        if any(word in sent.lower() for word in ['publishes', 'journal', 'research', 'scope', 'covers', 'dedicated', 'focuses']):
            descriptive.append(sent)

    if descriptive:
        return ' '.join(descriptive[:5])  # First 5 relevant sentences

    return ""


def clean_journal_data(journals: list[dict]) -> list[dict]:
    """Clean and normalize all journal data."""
    for journal in journals:
        # Extract clean scope
        raw_scope = journal.get('scope', '')
        journal['scope_raw'] = raw_scope
        journal['scope'] = extract_scope_description(raw_scope, journal.get('title', ''))

        # Parse categories into structured format
        categories_str = journal.get('categories', '')
        if categories_str:
            # Format: "Applied Mathematics (Q1); Modeling and Simulation (Q1)"
            categories = []
            for cat in categories_str.split(';'):
                cat = cat.strip()
                match = re.match(r'(.+?)\s*\((Q[1-4])\)', cat)
                if match:
                    categories.append({
                        'name': match.group(1).strip(),
                        'quartile': match.group(2)
                    })
                elif cat:
                    categories.append({'name': cat, 'quartile': None})
            journal['categories_parsed'] = categories

        # Parse areas
        areas_str = journal.get('areas', '')
        if areas_str:
            journal['areas_list'] = [a.strip() for a in areas_str.split(';') if a.strip()]

        # Parse ISSN
        issn_str = journal.get('issn', '')
        if issn_str:
            journal['issn_list'] = [i.strip() for i in issn_str.split(',') if i.strip()]

        # Convert numeric strings to floats
        for field in ['sjr', 'citations_per_doc', 'refs_per_doc', 'female_percent']:
            val = journal.get(field, '')
            if isinstance(val, str) and val:
                try:
                    journal[field] = float(val)
                except ValueError:
                    journal[field] = None

    return journals


def main():
    print("Loading raw data...")
    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        journals = json.load(f)

    print(f"Processing {len(journals)} journals...")
    journals = clean_journal_data(journals)

    # Summary
    with_scope = sum(1 for j in journals if j.get('scope'))
    print(f"Journals with clean scope: {with_scope}")

    # Show sample
    print("\n--- Sample cleaned scope ---")
    for j in journals[:3]:
        print(f"\nTitle: {j['title']}")
        print(f"Scope: {j['scope'][:200]}..." if j['scope'] else "Scope: (none)")

    # Save
    print(f"\nSaving to {OUTPUT_JSON}...")
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(journals, f, indent=2, ensure_ascii=False)

    print("✓ Done!")


if __name__ == "__main__":
    main()
