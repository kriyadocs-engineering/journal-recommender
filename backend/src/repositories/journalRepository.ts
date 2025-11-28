import { query, getClient } from '../database/connection.js';

export interface Journal {
  id: string;
  source_id: string;
  title: string;
  publisher: string;
  country: string;
  open_access: boolean;
  coverage: string;
  scimago_rank: number;
  sjr: number | null;
  sjr_quartile: string | null;
  h_index: number | null;
  total_docs_2024: number | null;
  total_docs_3years: number | null;
  citations_per_doc: number | null;
  total_citations_3years: number | null;
  scope_text: string | null;
  issns: string[];
  areas: string[];
  categories: Array<{ name: string; quartile: string }>;
}

export interface JournalFilters {
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

export async function getAllJournals(filters: JournalFilters = {}): Promise<Journal[]> {
  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (filters.sjrQuartile && filters.sjrQuartile.length > 0) {
    whereConditions.push(`sjr_quartile = ANY($${paramIndex})`);
    params.push(filters.sjrQuartile);
    paramIndex++;
  }

  if (filters.openAccess !== undefined) {
    whereConditions.push(`open_access = $${paramIndex}`);
    params.push(filters.openAccess);
    paramIndex++;
  }

  if (filters.minSjr !== undefined) {
    whereConditions.push(`sjr >= $${paramIndex}`);
    params.push(filters.minSjr);
    paramIndex++;
  }

  if (filters.maxSjr !== undefined) {
    whereConditions.push(`sjr <= $${paramIndex}`);
    params.push(filters.maxSjr);
    paramIndex++;
  }

  if (filters.minHIndex !== undefined) {
    whereConditions.push(`h_index >= $${paramIndex}`);
    params.push(filters.minHIndex);
    paramIndex++;
  }

  if (filters.maxHIndex !== undefined) {
    whereConditions.push(`h_index <= $${paramIndex}`);
    params.push(filters.maxHIndex);
    paramIndex++;
  }

  if (filters.minCitationsPerDoc !== undefined) {
    whereConditions.push(`citations_per_doc >= $${paramIndex}`);
    params.push(filters.minCitationsPerDoc);
    paramIndex++;
  }

  if (filters.maxCitationsPerDoc !== undefined) {
    whereConditions.push(`citations_per_doc <= $${paramIndex}`);
    params.push(filters.maxCitationsPerDoc);
    paramIndex++;
  }

  if (filters.publishers && filters.publishers.length > 0) {
    whereConditions.push(`publisher = ANY($${paramIndex})`);
    params.push(filters.publishers);
    paramIndex++;
  }

  if (filters.search) {
    whereConditions.push(`(title ILIKE $${paramIndex} OR scope_text ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.areas && filters.areas.length > 0) {
    whereConditions.push(`areas && $${paramIndex}`);
    params.push(filters.areas);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  const sql = `
    SELECT * FROM v_journals_full
    ${whereClause}
    ORDER BY scimago_rank ASC NULLS LAST
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const result = await query<Journal>(sql, params);
  return result.rows;
}

export async function getJournalById(id: string): Promise<Journal | null> {
  const result = await query<Journal>(
    'SELECT * FROM v_journals_full WHERE id = $1 OR source_id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getJournalCount(filters: JournalFilters = {}): Promise<number> {
  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (filters.sjrQuartile && filters.sjrQuartile.length > 0) {
    whereConditions.push(`sjr_quartile = ANY($${paramIndex})`);
    params.push(filters.sjrQuartile);
    paramIndex++;
  }

  if (filters.openAccess !== undefined) {
    whereConditions.push(`open_access = $${paramIndex}`);
    params.push(filters.openAccess);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM v_journals_full ${whereClause}`,
    params
  );
  return parseInt(result.rows[0].count, 10);
}

export async function searchJournalsByScope(searchText: string, limit: number = 20): Promise<Journal[]> {
  const result = await query<Journal>(
    `SELECT *,
            ts_rank(to_tsvector('english', COALESCE(scope_text, '') || ' ' || title),
                    plainto_tsquery('english', $1)) as relevance
     FROM v_journals_full
     WHERE to_tsvector('english', COALESCE(scope_text, '') || ' ' || title) @@ plainto_tsquery('english', $1)
     ORDER BY relevance DESC, scimago_rank ASC
     LIMIT $2`,
    [searchText, limit]
  );
  return result.rows;
}

export async function getSubjectAreas(): Promise<string[]> {
  const result = await query<{ name: string }>('SELECT name FROM subject_areas ORDER BY name');
  return result.rows.map(r => r.name);
}

export async function getCategories(): Promise<string[]> {
  const result = await query<{ name: string }>('SELECT DISTINCT name FROM categories ORDER BY name');
  return result.rows.map(r => r.name);
}

export async function getPublishers(): Promise<string[]> {
  const result = await query<{ publisher: string }>(
    'SELECT DISTINCT publisher FROM journals WHERE publisher IS NOT NULL ORDER BY publisher'
  );
  return result.rows.map(r => r.publisher);
}

export async function getJournalStats(): Promise<{
  total: number;
  byQuartile: Record<string, number>;
  openAccess: number;
  withScope: number;
}> {
  const totalResult = await query<{ count: string }>('SELECT COUNT(*) FROM journals');
  const quartileResult = await query<{ sjr_quartile: string; count: string }>(
    `SELECT sjr_quartile, COUNT(*) FROM journal_metrics
     WHERE sjr_quartile IS NOT NULL
     GROUP BY sjr_quartile`
  );
  const oaResult = await query<{ count: string }>(
    'SELECT COUNT(*) FROM journals WHERE open_access = true'
  );
  const scopeResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM journal_scopes WHERE scope_text IS NOT NULL AND scope_text != ''`
  );

  const byQuartile: Record<string, number> = {};
  quartileResult.rows.forEach(r => {
    byQuartile[r.sjr_quartile] = parseInt(r.count, 10);
  });

  return {
    total: parseInt(totalResult.rows[0].count, 10),
    byQuartile,
    openAccess: parseInt(oaResult.rows[0].count, 10),
    withScope: parseInt(scopeResult.rows[0].count, 10),
  };
}
