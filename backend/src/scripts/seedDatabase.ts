import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://journal_user:journal_pass_2024@localhost:5432/journal_recommender',
});

interface JournalData {
  id: string;
  title: string;
  issn: string[];
  publisher: string;
  openAccess: boolean;
  metrics: {
    sjr: number | null;
    sjrQuartile: string | null;
    hIndex: number | null;
    totalDocs2024: number | null;
    totalDocs3Years: number | null;
    citationsPerDoc: number | null;
    totalCitations3Years: number | null;
  };
  scope: string;
  categories: Array<{ name: string; quartile: string }>;
  areas: string[];
  country: string;
  coverage: string;
  rank: number;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  const client = await pool.connect();

  try {
    // Load journal data
    const dataPath = join(__dirname, '../../..', 'data', 'journals_database.json');
    console.log(`📂 Loading data from: ${dataPath}`);

    const rawData = readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);
    const journals: JournalData[] = data.journals;

    console.log(`📊 Found ${journals.length} journals to import`);

    await client.query('BEGIN');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await client.query('DELETE FROM recommendations');
    await client.query('DELETE FROM analysis_results');
    await client.query('DELETE FROM manuscripts');
    await client.query('DELETE FROM search_history');
    await client.query('DELETE FROM journal_categories');
    await client.query('DELETE FROM journal_areas');
    await client.query('DELETE FROM journal_scopes');
    await client.query('DELETE FROM journal_metrics');
    await client.query('DELETE FROM journal_issn');
    await client.query('DELETE FROM journals');
    await client.query('DELETE FROM categories');
    await client.query('DELETE FROM subject_areas');

    // Collect unique areas and categories
    const uniqueAreas = new Set<string>();
    const uniqueCategories = new Set<string>();

    journals.forEach(j => {
      j.areas?.forEach(a => uniqueAreas.add(a));
      j.categories?.forEach(c => uniqueCategories.add(c.name));
    });

    // Insert subject areas
    console.log(`📚 Inserting ${uniqueAreas.size} subject areas...`);
    const areaMap = new Map<string, string>();
    for (const area of uniqueAreas) {
      const result = await client.query(
        'INSERT INTO subject_areas (name) VALUES ($1) RETURNING id',
        [area]
      );
      areaMap.set(area, result.rows[0].id);
    }

    // Insert categories
    console.log(`📑 Inserting ${uniqueCategories.size} categories...`);
    const categoryMap = new Map<string, string>();
    for (const category of uniqueCategories) {
      const result = await client.query(
        'INSERT INTO categories (name) VALUES ($1) RETURNING id',
        [category]
      );
      categoryMap.set(category, result.rows[0].id);
    }

    // Insert journals
    console.log(`📰 Inserting ${journals.length} journals...`);
    let insertedCount = 0;

    for (const journal of journals) {
      // Insert journal
      const journalResult = await client.query(
        `INSERT INTO journals (source_id, title, publisher, country, open_access, coverage, scimago_rank)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          journal.id,
          journal.title,
          journal.publisher,
          journal.country,
          journal.openAccess,
          journal.coverage,
          journal.rank
        ]
      );
      const journalId = journalResult.rows[0].id;

      // Insert ISSNs
      for (const issn of journal.issn || []) {
        await client.query(
          'INSERT INTO journal_issn (journal_id, issn) VALUES ($1, $2)',
          [journalId, issn]
        );
      }

      // Insert metrics (convert empty strings to null)
      const toNum = (v: any) => (v === '' || v === null || v === undefined || isNaN(v)) ? null : Number(v);
      await client.query(
        `INSERT INTO journal_metrics (journal_id, sjr, sjr_quartile, h_index, total_docs_2024, total_docs_3years, citations_per_doc, total_citations_3years)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          journalId,
          toNum(journal.metrics.sjr),
          journal.metrics.sjrQuartile || null,
          toNum(journal.metrics.hIndex),
          toNum(journal.metrics.totalDocs2024),
          toNum(journal.metrics.totalDocs3Years),
          toNum(journal.metrics.citationsPerDoc),
          toNum(journal.metrics.totalCitations3Years)
        ]
      );

      // Insert scope
      if (journal.scope) {
        await client.query(
          'INSERT INTO journal_scopes (journal_id, scope_text) VALUES ($1, $2)',
          [journalId, journal.scope]
        );
      }

      // Insert area relationships
      for (const area of journal.areas || []) {
        const areaId = areaMap.get(area);
        if (areaId) {
          await client.query(
            'INSERT INTO journal_areas (journal_id, area_id) VALUES ($1, $2)',
            [journalId, areaId]
          );
        }
      }

      // Insert category relationships
      for (const cat of journal.categories || []) {
        const categoryId = categoryMap.get(cat.name);
        if (categoryId) {
          await client.query(
            'INSERT INTO journal_categories (journal_id, category_id, quartile) VALUES ($1, $2, $3)',
            [journalId, categoryId, cat.quartile]
          );
        }
      }

      insertedCount++;
      if (insertedCount % 20 === 0) {
        console.log(`  Progress: ${insertedCount}/${journals.length}`);
      }
    }

    await client.query('COMMIT');

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`   - Journals: ${insertedCount}`);
    console.log(`   - Subject Areas: ${uniqueAreas.size}`);
    console.log(`   - Categories: ${uniqueCategories.size}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().catch(console.error);
