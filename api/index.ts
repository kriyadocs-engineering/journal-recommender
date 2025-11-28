import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import pg from 'pg';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  return pool.query(text, params);
}

async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Journal repository functions
interface JournalFilters {
  sjrQuartile?: string[];
  areas?: string[];
  openAccess?: boolean;
  minSjr?: number;
  maxSjr?: number;
  minHIndex?: number;
  maxHIndex?: number;
  minCitationsPerDoc?: number;
  maxCitationsPerDoc?: number;
  publishers?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

interface Journal {
  id: string;
  source_id: string;
  title: string;
  publisher: string;
  issn: string | null;
  eissn: string | null;
  sjr: number | null;
  sjr_quartile: string | null;
  h_index: number | null;
  total_docs: number | null;
  total_refs: number | null;
  citations_per_doc: number | null;
  country: string | null;
  areas: string[] | null;
  categories: string[] | null;
  open_access: boolean;
  scope_text: string | null;
}

async function getAllJournals(filters: JournalFilters = {}): Promise<Journal[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.sjrQuartile && filters.sjrQuartile.length > 0) {
    conditions.push(`sjr_quartile = ANY($${paramIndex})`);
    params.push(filters.sjrQuartile);
    paramIndex++;
  }

  if (filters.openAccess !== undefined) {
    conditions.push(`open_access = $${paramIndex}`);
    params.push(filters.openAccess);
    paramIndex++;
  }

  if (filters.minSjr !== undefined) {
    conditions.push(`sjr >= $${paramIndex}`);
    params.push(filters.minSjr);
    paramIndex++;
  }

  if (filters.maxSjr !== undefined) {
    conditions.push(`sjr <= $${paramIndex}`);
    params.push(filters.maxSjr);
    paramIndex++;
  }

  if (filters.minHIndex !== undefined) {
    conditions.push(`h_index >= $${paramIndex}`);
    params.push(filters.minHIndex);
    paramIndex++;
  }

  if (filters.publishers && filters.publishers.length > 0) {
    conditions.push(`publisher = ANY($${paramIndex})`);
    params.push(filters.publishers);
    paramIndex++;
  }

  if (filters.search) {
    conditions.push(`(title ILIKE $${paramIndex} OR scope_text ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const result = await query<Journal>(
    `SELECT * FROM journals ${whereClause} ORDER BY sjr DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return result.rows;
}

async function getJournalCount(filters: JournalFilters = {}): Promise<number> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.sjrQuartile && filters.sjrQuartile.length > 0) {
    conditions.push(`sjr_quartile = ANY($${paramIndex})`);
    params.push(filters.sjrQuartile);
    paramIndex++;
  }

  if (filters.openAccess !== undefined) {
    conditions.push(`open_access = $${paramIndex}`);
    params.push(filters.openAccess);
    paramIndex++;
  }

  if (filters.search) {
    conditions.push(`(title ILIKE $${paramIndex} OR scope_text ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM journals ${whereClause}`,
    params
  );

  return parseInt(result.rows[0].count, 10);
}

async function getJournalById(id: string): Promise<Journal | null> {
  const result = await query<Journal>('SELECT * FROM journals WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function getSubjectAreas(): Promise<string[]> {
  const result = await query<{ area: string }>(
    `SELECT DISTINCT unnest(areas) as area FROM journals WHERE areas IS NOT NULL ORDER BY area`
  );
  return result.rows.map(r => r.area);
}

async function getPublishers(): Promise<string[]> {
  const result = await query<{ publisher: string }>(
    `SELECT DISTINCT publisher FROM journals WHERE publisher IS NOT NULL ORDER BY publisher`
  );
  return result.rows.map(r => r.publisher);
}

async function getJournalStats() {
  const result = await query(`
    SELECT
      COUNT(*) as total_journals,
      COUNT(DISTINCT publisher) as total_publishers,
      COUNT(*) FILTER (WHERE open_access = true) as open_access_count,
      AVG(sjr) as avg_sjr,
      AVG(h_index) as avg_h_index
    FROM journals
  `);
  return result.rows[0];
}

// Recommendation service
function extractKeywords(title: string, abstract: string): string[] {
  const text = `${title} ${abstract}`.toLowerCase();
  const academicTerms = [
    'machine learning', 'artificial intelligence', 'deep learning', 'neural network',
    'physics', 'quantum', 'chemistry', 'biology', 'medicine', 'clinical',
    'molecular', 'polymer', 'drug', 'cancer', 'genetics', 'ecology',
    'economics', 'finance', 'engineering', 'nanotechnology', 'environment',
    'climate', 'sustainability', 'renewable', 'energy'
  ];

  const found = academicTerms.filter(term => text.includes(term));
  return found.slice(0, 20);
}

function calculateMatchScore(journal: Journal, keywords: string[]): number {
  let score = 0;
  const scope = (journal.scope_text || '').toLowerCase();
  const title = journal.title.toLowerCase();
  const searchText = `${scope} ${title}`;

  let keywordMatches = 0;
  for (const keyword of keywords) {
    if (searchText.includes(keyword)) {
      keywordMatches++;
    }
  }
  score += Math.min((keywordMatches / Math.max(keywords.length, 1)) * 50, 50);

  if (journal.sjr_quartile === 'Q1') score += 20;
  else if (journal.sjr_quartile === 'Q2') score += 15;
  else if (journal.sjr_quartile === 'Q3') score += 10;

  if (journal.h_index) {
    if (journal.h_index >= 100) score += 15;
    else if (journal.h_index >= 50) score += 10;
  }

  if (journal.scope_text && journal.scope_text.length > 200) score += 15;

  return Math.min(Math.round(score), 100);
}

// Express app
const app = express();

app.use(cors());
app.use(express.json());

// Configure multer for memory storage (Vercel compatible)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Health check
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: dbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Get all journals
app.get('/api/journals', async (req, res) => {
  try {
    const filters: JournalFilters = {
      sjrQuartile: req.query.quartile ? (req.query.quartile as string).split(',') : undefined,
      openAccess: req.query.openAccess ? req.query.openAccess === 'true' : undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const [journals, total] = await Promise.all([
      getAllJournals(filters),
      getJournalCount(filters)
    ]);

    res.json({
      success: true,
      data: journals,
      pagination: { total, limit: filters.limit, offset: filters.offset }
    });
  } catch (error) {
    console.error('Error fetching journals:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch journals' });
  }
});

// Get single journal
app.get('/api/journals/:id', async (req, res) => {
  try {
    const journal = await getJournalById(req.params.id);
    if (!journal) {
      return res.status(404).json({ success: false, error: 'Journal not found' });
    }
    res.json({ success: true, data: journal });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch journal' });
  }
});

// Get areas
app.get('/api/areas', async (req, res) => {
  try {
    const areas = await getSubjectAreas();
    res.json({ success: true, data: areas });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch areas' });
  }
});

// Get publishers
app.get('/api/publishers', async (req, res) => {
  try {
    const publishers = await getPublishers();
    res.json({ success: true, data: publishers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch publishers' });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getJournalStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Analyze text (title + abstract)
app.post('/api/analyze/text', async (req, res) => {
  try {
    const { title, abstract, filters } = req.body;

    if (!title || !abstract) {
      return res.status(400).json({ success: false, error: 'Title and abstract are required' });
    }

    const keywords = extractKeywords(title, abstract);

    const journalFilters: JournalFilters = { limit: 300 };
    if (filters?.sjrQuartile) journalFilters.sjrQuartile = filters.sjrQuartile;
    if (filters?.openAccess !== undefined) journalFilters.openAccess = filters.openAccess;
    if (filters?.publishers) journalFilters.publishers = filters.publishers;

    const allJournals = await getAllJournals(journalFilters);

    const scoredJournals = allJournals
      .map(journal => ({ journal, score: calculateMatchScore(journal, keywords) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        id: uuidv4(),
        manuscript: { title, abstract },
        recommendations: scoredJournals.map((item, index) => ({
          rank: index + 1,
          matchScore: item.score,
          journal: item.journal,
          matchReason: `Matches ${keywords.slice(0, 3).join(', ')} keywords`,
          pros: item.journal.sjr_quartile === 'Q1' ? ['Top-tier journal'] : ['Good visibility'],
          cons: !item.journal.open_access ? ['Not open access'] : []
        })),
        suggestedKeywords: keywords,
        analysisNotes: `Found ${scoredJournals.length} matching journals based on ${keywords.length} keywords.`,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze manuscript' });
  }
});

export default app;
