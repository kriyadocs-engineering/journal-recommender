// Journal metrics (available from Scimago)
export interface JournalMetrics {
  sjrQuartile: string; // e.g., "Q1", "Q2", "Q3", "Q4"
  sjrScore: number;    // SJR score (e.g., 0.5, 1.2)
  hIndex: number;      // H-Index
  citationsPerDoc: number; // Citations per document
}

// Journal types
export interface Journal {
  id: string;
  name: string;
  abbreviation: string;
  publisher: string;
  scope: string;
  subjects: string[];
  openAccess: boolean;
  reviewTime: string; // e.g., "4-6 weeks"
  acceptanceRate: number; // percentage
  website: string;
  language: string;
  frequency: string; // e.g., "Monthly", "Semi-monthly"
  indexedIn: string[]; // e.g., ["Web of Science", "Scopus", "DOAJ"]
  metrics: JournalMetrics;
}

// Manuscript types
export interface Manuscript {
  id: string;
  title: string;
  abstract: string;
  fileName: string;
  fileType: 'doc' | 'docx' | 'pdf';
  uploadedAt: Date;
  keywords?: string[];
}

// Recommendation types
export interface JournalRecommendation {
  journal: Journal;
  matchScore: number; // 0-100
  matchReasons: string[];
  scopeAlignment: string;
  strengthsForJournal: string[];
  potentialChallenges: string[];
}

export interface RecommendationReport {
  id: string;
  manuscript: Manuscript;
  recommendations: JournalRecommendation[];
  generatedAt: Date;
  analysisNotes: string;
  suggestedKeywords: string[];
}

// Filter types (only available metrics from Scimago)
export interface MetricFilter {
  sjrQuartile: string[] | null; // ["Q1", "Q2", etc.]
  sjrScore: { min: number; max: number } | null; // SJR score range
  hIndex: { min: number; max: number } | null;
  citationsPerDoc: { min: number; max: number } | null; // Citations per doc range
  openAccess: boolean | null;
  indexedIn: string[] | null;
  publisher: string[] | null;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Upload state
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';

export interface UploadState {
  status: UploadStatus;
  progress: number;
  file?: File;
  error?: string;
}

// Analysis step for progress display
export interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  description?: string;
}
