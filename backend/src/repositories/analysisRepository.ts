import { query, getClient } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

export interface Manuscript {
  id: string;
  title: string;
  abstract: string | null;
  file_name: string | null;
  file_type: string | null;
  user_session_id: string | null;
  created_at: Date;
}

export interface AnalysisResult {
  id: string;
  manuscript_id: string;
  suggested_keywords: string[];
  analysis_notes: string | null;
  created_at: Date;
}

export interface Recommendation {
  id: string;
  analysis_id: string;
  journal_id: string;
  match_score: number;
  rank: number;
  match_reason: string | null;
  pros: string[];
  cons: string[];
  journal?: any;
}

export async function createManuscript(data: {
  title: string;
  abstract?: string;
  fileName?: string;
  fileType?: string;
  sessionId?: string;
}): Promise<Manuscript> {
  const id = uuidv4();
  const result = await query<Manuscript>(
    `INSERT INTO manuscripts (id, title, abstract, file_name, file_type, user_session_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, data.title, data.abstract, data.fileName, data.fileType, data.sessionId]
  );
  return result.rows[0];
}

export async function createAnalysisResult(data: {
  manuscriptId: string;
  suggestedKeywords: string[];
  analysisNotes?: string;
}): Promise<AnalysisResult> {
  const id = uuidv4();
  const result = await query<AnalysisResult>(
    `INSERT INTO analysis_results (id, manuscript_id, suggested_keywords, analysis_notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, data.manuscriptId, data.suggestedKeywords, data.analysisNotes]
  );
  return result.rows[0];
}

export async function createRecommendations(
  analysisId: string,
  recommendations: Array<{
    journalId: string;
    matchScore: number;
    rank: number;
    matchReason?: string;
    pros?: string[];
    cons?: string[];
  }>
): Promise<Recommendation[]> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const results: Recommendation[] = [];
    for (const rec of recommendations) {
      const id = uuidv4();
      const result = await client.query<Recommendation>(
        `INSERT INTO recommendations (id, analysis_id, journal_id, match_score, rank, match_reason, pros, cons)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, analysisId, rec.journalId, rec.matchScore, rec.rank, rec.matchReason, rec.pros || [], rec.cons || []]
      );
      results.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getAnalysisWithRecommendations(analysisId: string): Promise<{
  analysis: AnalysisResult;
  manuscript: Manuscript;
  recommendations: Recommendation[];
} | null> {
  const analysisResult = await query<AnalysisResult & Manuscript>(
    `SELECT a.*, m.title as manuscript_title, m.abstract, m.file_name, m.file_type, m.created_at as manuscript_created_at
     FROM analysis_results a
     JOIN manuscripts m ON a.manuscript_id = m.id
     WHERE a.id = $1`,
    [analysisId]
  );

  if (analysisResult.rows.length === 0) return null;

  const row = analysisResult.rows[0];

  const recommendationsResult = await query(
    `SELECT r.*,
            j.title as journal_title, j.source_id, j.publisher, j.open_access, j.country,
            jm.sjr, jm.sjr_quartile, jm.h_index,
            js.scope_text
     FROM recommendations r
     JOIN journals j ON r.journal_id = j.id
     LEFT JOIN journal_metrics jm ON j.id = jm.journal_id
     LEFT JOIN journal_scopes js ON j.id = js.journal_id
     WHERE r.analysis_id = $1
     ORDER BY r.rank ASC`,
    [analysisId]
  );

  return {
    analysis: {
      id: row.id,
      manuscript_id: row.manuscript_id,
      suggested_keywords: row.suggested_keywords,
      analysis_notes: row.analysis_notes,
      created_at: row.created_at,
    },
    manuscript: {
      id: row.manuscript_id,
      title: row.manuscript_title,
      abstract: row.abstract,
      file_name: row.file_name,
      file_type: row.file_type,
      user_session_id: null,
      created_at: row.manuscript_created_at,
    },
    recommendations: recommendationsResult.rows.map(r => ({
      ...r,
      journal: {
        id: r.journal_id,
        title: r.journal_title,
        source_id: r.source_id,
        publisher: r.publisher,
        open_access: r.open_access,
        country: r.country,
        sjr: r.sjr,
        sjr_quartile: r.sjr_quartile,
        h_index: r.h_index,
        scope_text: r.scope_text,
      }
    })),
  };
}

export async function logSearch(data: {
  sessionId?: string;
  queryType: string;
  filters?: object;
  resultsCount: number;
}): Promise<void> {
  await query(
    `INSERT INTO search_history (user_session_id, query_type, search_filters, results_count)
     VALUES ($1, $2, $3, $4)`,
    [data.sessionId, data.queryType, JSON.stringify(data.filters || {}), data.resultsCount]
  );
}
