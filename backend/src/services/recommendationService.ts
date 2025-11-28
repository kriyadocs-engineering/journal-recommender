import * as journalRepo from '../repositories/journalRepository.js';
import * as analysisRepo from '../repositories/analysisRepository.js';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface RecommendationFilters {
  sjrQuartile?: string[];
  sjrScore?: { min: number; max: number };
  hIndex?: { min: number; max: number };
  citationsPerDoc?: { min: number; max: number };
  openAccess?: boolean;
  publishers?: string[];
}

export interface ManuscriptInput {
  title: string;
  abstract: string;
  fileName?: string;
  fileType?: string;
  sessionId?: string;
  filters?: RecommendationFilters;
}

export interface RecommendationResult {
  id: string;
  manuscript: {
    id: string;
    title: string;
    abstract: string;
    fileName: string;
    fileType: string;
  };
  recommendations: Array<{
    rank: number;
    matchScore: number;
    journal: {
      id: string;
      title: string;
      publisher: string;
      sjr: number | null;
      sjrQuartile: string | null;
      hIndex: number | null;
      openAccess: boolean;
      scope: string | null;
    };
    matchReason: string;
    pros: string[];
    cons: string[];
  }>;
  suggestedKeywords: string[];
  analysisNotes: string;
  generatedAt: Date;
}

function extractKeywords(title: string, abstract: string): string[] {
  const text = `${title} ${abstract}`.toLowerCase();

  // Common academic terms to match against (expanded list)
  const academicTerms = [
    // Computer Science / AI
    'machine learning', 'artificial intelligence', 'deep learning', 'neural network',
    'optimization', 'algorithm', 'computational', 'numerical', 'computer',

    // Physics - General
    'physics', 'quantum', 'mechanics', 'dynamics', 'thermodynamics',
    'gravity', 'gravitation', 'gravitational', 'cosmology', 'cosmological',
    'relativity', 'relativistic', 'spacetime', 'space-time',
    'particles', 'particle', 'fields', 'field theory',
    'hamiltonian', 'lagrangian', 'renormalization', 'asymptotic',
    'string theory', 'gauge', 'symmetry', 'supersymmetry',
    'electromagnetism', 'electromagnetic', 'nuclear', 'atomic',
    'photon', 'electron', 'boson', 'fermion', 'quark', 'neutrino',
    'astrophysics', 'astronomy', 'stellar', 'galactic',

    // Mathematics
    'mathematical', 'algebra', 'geometry', 'topology', 'calculus',
    'differential', 'integral', 'equation', 'theorem', 'proof',

    // Chemistry
    'chemistry', 'molecular', 'chemical', 'synthesis', 'catalysis',
    'polymer', 'organic', 'inorganic', 'biochemistry', 'electrochemistry',

    // Biology / Life Sciences
    'biology', 'biological', 'genomics', 'proteomics', 'cellular',
    'genetics', 'evolution', 'ecology', 'microbiology', 'biotechnology',

    // Medicine / Health
    'medicine', 'clinical', 'therapeutic', 'diagnostic', 'pharmacological',
    'cancer', 'disease', 'treatment', 'drug', 'patient',

    // Economics / Business
    'economics', 'finance', 'market', 'investment', 'policy',
    'economic', 'financial', 'banking', 'monetary',

    // Engineering
    'engineering', 'mechanical', 'electrical', 'civil', 'materials',
    'nanotechnology', 'semiconductor', 'robotics', 'automation',

    // Environmental
    'environment', 'climate', 'sustainability', 'ecological', 'pollution',
    'renewable', 'energy', 'carbon', 'biodiversity',

    // Social Sciences
    'social', 'behavioral', 'psychological', 'cognitive', 'cultural',
    'sociology', 'anthropology', 'linguistics', 'education'
  ];

  const found = academicTerms.filter(term => text.includes(term));

  // Also extract potential key phrases (simple approach)
  const words = text.split(/\s+/).filter(w => w.length > 5);
  const commonWords = new Set([
    'about', 'which', 'their', 'would', 'could', 'should', 'there', 'where',
    'these', 'those', 'being', 'through', 'however', 'therefore', 'because',
    'between', 'within', 'without', 'during', 'before', 'after', 'above',
    'below', 'against', 'under', 'further', 'then', 'once', 'here', 'when',
    'always', 'often', 'never', 'while', 'since', 'until', 'although',
    'though', 'unless', 'whether', 'either', 'neither', 'both', 'each',
    'every', 'other', 'another', 'such', 'only', 'also', 'very', 'just',
    'still', 'already', 'even', 'well', 'back', 'much', 'many', 'most',
    'some', 'any', 'all', 'more', 'less', 'than', 'into', 'over', 'out',
    'have', 'has', 'had', 'been', 'were', 'are', 'was', 'is', 'will',
    'can', 'may', 'might', 'must', 'shall', 'need', 'used', 'using',
    'based', 'given', 'shown', 'found', 'known', 'called', 'considered',
    'obtained', 'presented', 'proposed', 'studied', 'discussed', 'described'
  ]);

  const uniqueWords = [...new Set(words)]
    .filter(w => !commonWords.has(w) && !/^\d+$/.test(w))
    .slice(0, 10);

  return [...new Set([...found, ...uniqueWords])].slice(0, 20);
}

// Related terms mapping for better matching
const relatedTerms: { [key: string]: string[] } = {
  'gravity': ['gravitation', 'gravitational', 'gravitating'],
  'gravitation': ['gravity', 'gravitational', 'gravitating'],
  'gravitational': ['gravity', 'gravitation'],
  'quantum': ['quanta', 'quantization', 'quantized'],
  'particle': ['particles', 'particulate'],
  'particles': ['particle', 'particulate'],
  'field': ['fields', 'field theory'],
  'fields': ['field', 'field theory'],
  'cosmology': ['cosmological', 'cosmos', 'universe'],
  'cosmological': ['cosmology', 'cosmos'],
  'relativity': ['relativistic', 'einstein'],
  'relativistic': ['relativity'],
  'symmetry': ['symmetric', 'symmetries', 'supersymmetry'],
  'asymptotic': ['asymptotically', 'asymptotics'],
  'renormalization': ['renormalized', 'renormalizable'],
  'hamiltonian': ['hamilton', 'canonical'],
  'physics': ['physical', 'physicist'],
  'mathematical': ['mathematics', 'math'],
  'chemistry': ['chemical', 'chemist'],
  'chemical': ['chemistry'],
  'biology': ['biological', 'biologist'],
  'biological': ['biology'],
  'molecular': ['molecule', 'molecules'],
  'nuclear': ['nucleus', 'nuclei'],
  'atomic': ['atom', 'atoms'],
  'electron': ['electronic', 'electrons'],
  'photon': ['photons', 'photonic'],
};

function expandKeywordsWithRelated(keywords: string[]): string[] {
  const expanded = new Set<string>(keywords);
  for (const keyword of keywords) {
    const related = relatedTerms[keyword];
    if (related) {
      related.forEach(term => expanded.add(term));
    }
  }
  return Array.from(expanded);
}

function calculateMatchScore(journal: journalRepo.Journal, keywords: string[]): number {
  let score = 0;
  const scope = (journal.scope_text || '').toLowerCase();
  const title = journal.title.toLowerCase();
  const areas = (journal.areas || []).map(a => a.toLowerCase()).join(' ');
  const searchText = `${scope} ${title} ${areas}`;

  // Expand keywords with related terms for better matching
  const expandedKeywords = expandKeywordsWithRelated(keywords);

  // Keyword matching (max 50 points)
  let keywordMatches = 0;
  for (const keyword of expandedKeywords) {
    if (searchText.includes(keyword)) {
      keywordMatches++;
    }
  }
  // Use original keyword count for scoring ratio
  score += Math.min((keywordMatches / Math.max(keywords.length, 1)) * 50, 50);

  // SJR bonus (max 20 points)
  if (journal.sjr_quartile === 'Q1') score += 20;
  else if (journal.sjr_quartile === 'Q2') score += 15;
  else if (journal.sjr_quartile === 'Q3') score += 10;
  else if (journal.sjr_quartile === 'Q4') score += 5;

  // H-index bonus (max 15 points)
  if (journal.h_index) {
    if (journal.h_index >= 100) score += 15;
    else if (journal.h_index >= 50) score += 10;
    else if (journal.h_index >= 20) score += 5;
  }

  // Scope completeness (max 15 points)
  if (journal.scope_text && journal.scope_text.length > 200) score += 15;
  else if (journal.scope_text && journal.scope_text.length > 100) score += 10;
  else if (journal.scope_text) score += 5;

  return Math.min(Math.round(score), 100);
}

function generateMatchReason(journal: journalRepo.Journal, keywords: string[]): string {
  const scope = (journal.scope_text || '').toLowerCase();
  const title = journal.title.toLowerCase();
  const areas = (journal.areas || []).map(a => a.toLowerCase()).join(' ');
  const searchText = `${scope} ${title} ${areas}`;

  // Check both direct keywords and their related terms
  const expandedKeywords = expandKeywordsWithRelated(keywords);
  const matchedKeywords = keywords.filter(kw => {
    if (searchText.includes(kw)) return true;
    // Also check if any related term matches
    const related = relatedTerms[kw];
    if (related) {
      return related.some(term => searchText.includes(term));
    }
    return false;
  });

  if (matchedKeywords.length > 0) {
    return `Strong alignment with your research topics: ${matchedKeywords.slice(0, 3).join(', ')}. ` +
      `This ${journal.sjr_quartile || ''} journal focuses on ${journal.areas?.slice(0, 2).join(' and ') || 'related fields'}.`;
  }

  return `This journal covers topics in ${journal.areas?.slice(0, 2).join(' and ') || 'your field'} ` +
    `and may be suitable for your manuscript based on the subject area alignment.`;
}

function generatePros(journal: journalRepo.Journal): string[] {
  const pros: string[] = [];

  if (journal.sjr_quartile === 'Q1') {
    pros.push('Top-tier journal (Q1) with high impact');
  } else if (journal.sjr_quartile === 'Q2') {
    pros.push('Well-regarded journal (Q2) with good visibility');
  }

  if (journal.h_index && journal.h_index >= 50) {
    pros.push(`Strong H-Index (${journal.h_index}) indicating established reputation`);
  }

  if (journal.open_access) {
    pros.push('Open access increases discoverability and citations');
  }

  if (journal.scope_text && journal.scope_text.length > 200) {
    pros.push('Well-defined scope matching your research area');
  }

  const citationsPerDoc = Number(journal.citations_per_doc) || 0;
  if (citationsPerDoc > 3) {
    pros.push(`Good citation rate (${citationsPerDoc.toFixed(1)} per doc)`);
  }

  return pros.slice(0, 4);
}

function generateCons(journal: journalRepo.Journal): string[] {
  const cons: string[] = [];

  if (journal.sjr_quartile === 'Q3' || journal.sjr_quartile === 'Q4') {
    cons.push('Lower quartile may have less visibility');
  }

  if (!journal.open_access) {
    cons.push('Subscription-based may limit readership');
  }

  if (journal.h_index && journal.h_index < 20) {
    cons.push('Relatively newer or smaller journal');
  }

  return cons.slice(0, 2);
}

export async function generateRecommendations(input: ManuscriptInput): Promise<RecommendationResult> {
  // Create manuscript record
  const manuscript = await analysisRepo.createManuscript({
    title: input.title,
    abstract: input.abstract,
    fileName: input.fileName,
    fileType: input.fileType,
    sessionId: input.sessionId,
  });

  // Extract keywords
  const keywords = extractKeywords(input.title, input.abstract);

  // Build journal filters from input
  const journalFilters: journalRepo.JournalFilters = {
    limit: 300, // Get more journals to ensure good matches after filtering
  };

  // Apply user filters
  if (input.filters) {
    if (input.filters.sjrQuartile && input.filters.sjrQuartile.length > 0) {
      journalFilters.sjrQuartile = input.filters.sjrQuartile;
    }
    if (input.filters.sjrScore) {
      journalFilters.minSjr = input.filters.sjrScore.min;
      journalFilters.maxSjr = input.filters.sjrScore.max;
    }
    if (input.filters.hIndex) {
      journalFilters.minHIndex = input.filters.hIndex.min;
      journalFilters.maxHIndex = input.filters.hIndex.max;
    }
    if (input.filters.citationsPerDoc) {
      journalFilters.minCitationsPerDoc = input.filters.citationsPerDoc.min;
      journalFilters.maxCitationsPerDoc = input.filters.citationsPerDoc.max;
    }
    if (input.filters.openAccess !== undefined) {
      journalFilters.openAccess = input.filters.openAccess;
    }
    if (input.filters.publishers && input.filters.publishers.length > 0) {
      journalFilters.publishers = input.filters.publishers;
    }
  }

  // Get journals matching filters
  const allJournals = await journalRepo.getAllJournals(journalFilters);

  // Score and rank journals
  const scoredJournals = allJournals
    .map(journal => ({
      journal,
      score: calculateMatchScore(journal, keywords),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Create analysis result
  const filterDescription = input.filters ?
    Object.entries(input.filters)
      .filter(([_, v]) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true))
      .map(([k, _]) => k)
      .join(', ') : null;

  const analysisNotes = `Analysis based on ${keywords.length} extracted keywords from your manuscript. ` +
    `Evaluated ${allJournals.length} journals` +
    (filterDescription ? ` matching your filters (${filterDescription}).` : '.');

  const analysis = await analysisRepo.createAnalysisResult({
    manuscriptId: manuscript.id,
    suggestedKeywords: keywords,
    analysisNotes,
  });

  // Create recommendations
  const recommendationData = scoredJournals.map((item, index) => ({
    journalId: item.journal.id,
    matchScore: item.score,
    rank: index + 1,
    matchReason: generateMatchReason(item.journal, keywords),
    pros: generatePros(item.journal),
    cons: generateCons(item.journal),
  }));

  await analysisRepo.createRecommendations(analysis.id, recommendationData);

  // Log search
  await analysisRepo.logSearch({
    sessionId: input.sessionId,
    queryType: input.fileName ? 'file_upload' : 'text_input',
    filters: { keywords },
    resultsCount: scoredJournals.length,
  });

  // Return formatted result
  return {
    id: analysis.id,
    manuscript: {
      id: manuscript.id,
      title: input.title,
      abstract: input.abstract,
      fileName: input.fileName || 'text-input',
      fileType: input.fileType || 'text',
    },
    recommendations: scoredJournals.map((item, index) => ({
      rank: index + 1,
      matchScore: item.score,
      journal: {
        id: item.journal.id,
        source_id: item.journal.source_id,
        title: item.journal.title,
        publisher: item.journal.publisher,
        sjr: item.journal.sjr,
        sjr_quartile: item.journal.sjr_quartile,
        h_index: item.journal.h_index,
        citations_per_doc: item.journal.citations_per_doc,
        open_access: item.journal.open_access,
        scope_text: item.journal.scope_text,
        areas: item.journal.areas,
      },
      matchReason: recommendationData[index].matchReason!,
      pros: recommendationData[index].pros!,
      cons: recommendationData[index].cons!,
    })),
    suggestedKeywords: keywords,
    analysisNotes,
    generatedAt: new Date(),
  };
}
