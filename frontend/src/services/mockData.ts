import type { Journal, JournalRecommendation, RecommendationReport, Manuscript } from '../types';

// Sample journals with Scimago metrics only
export const sampleJournals: Journal[] = [
  {
    id: 'j1',
    name: 'Journal of Molecular Biology',
    abbreviation: 'JMB',
    publisher: 'Elsevier',
    scope: 'Molecular biology, structural biology, biochemistry, molecular mechanisms of cellular processes, protein structure and function, nucleic acid biology, genomics and gene regulation.',
    subjects: ['Molecular Biology', 'Biochemistry', 'Structural Biology', 'Genomics'],
    openAccess: false,
    reviewTime: '6-8 weeks',
    acceptanceRate: 25,
    website: 'https://www.journals.elsevier.com/journal-of-molecular-biology',
    language: 'English',
    frequency: 'Bi-weekly',
    indexedIn: ['Web of Science', 'Scopus', 'PubMed', 'MEDLINE'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 2.456,
      hIndex: 312,
      citationsPerDoc: 5.47
    }
  },
  {
    id: 'j2',
    name: 'PLOS ONE',
    abbreviation: 'PLOS ONE',
    publisher: 'Public Library of Science',
    scope: 'Multidisciplinary research across all areas of science and medicine. Focus on methodological rigor and reproducibility rather than perceived impact.',
    subjects: ['Multidisciplinary', 'Biology', 'Medicine', 'Physical Sciences'],
    openAccess: true,
    reviewTime: '4-6 weeks',
    acceptanceRate: 55,
    website: 'https://journals.plos.org/plosone/',
    language: 'English',
    frequency: 'Daily',
    indexedIn: ['Web of Science', 'Scopus', 'PubMed', 'DOAJ'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 0.997,
      hIndex: 332,
      citationsPerDoc: 3.75
    }
  },
  {
    id: 'j3',
    name: 'Nature Communications',
    abbreviation: 'Nat Commun',
    publisher: 'Nature Publishing Group',
    scope: 'High-quality research across all areas of biological, physical, chemical and earth sciences. Emphasis on significant advances and broad interest.',
    subjects: ['Multidisciplinary', 'Natural Sciences', 'Life Sciences', 'Physical Sciences'],
    openAccess: true,
    reviewTime: '8-12 weeks',
    acceptanceRate: 15,
    website: 'https://www.nature.com/ncomms/',
    language: 'English',
    frequency: 'Daily',
    indexedIn: ['Web of Science', 'Scopus', 'PubMed', 'DOAJ'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 5.234,
      hIndex: 456,
      citationsPerDoc: 17.69
    }
  },
  {
    id: 'j4',
    name: 'Journal of Pharmaceutical Sciences',
    abbreviation: 'J Pharm Sci',
    publisher: 'Wiley',
    scope: 'Pharmaceutical sciences including drug discovery, drug delivery, pharmacokinetics, pharmacodynamics, formulation development, and pharmaceutical analysis.',
    subjects: ['Pharmaceutical Sciences', 'Drug Delivery', 'Pharmacology', 'Formulation'],
    openAccess: false,
    reviewTime: '4-8 weeks',
    acceptanceRate: 35,
    website: 'https://jpharmsci.org/',
    language: 'English',
    frequency: 'Monthly',
    indexedIn: ['Web of Science', 'Scopus', 'PubMed', 'MEDLINE'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 1.234,
      hIndex: 178,
      citationsPerDoc: 4.20
    }
  },
  {
    id: 'j5',
    name: 'Food Chemistry',
    abbreviation: 'Food Chem',
    publisher: 'Elsevier',
    scope: 'Chemical aspects of food science, food analysis, food composition, food processing, food safety, and functional foods. Antioxidants, bioactive compounds, and nutraceuticals.',
    subjects: ['Food Science', 'Chemistry', 'Nutrition', 'Food Safety'],
    openAccess: false,
    reviewTime: '6-10 weeks',
    acceptanceRate: 20,
    website: 'https://www.journals.elsevier.com/food-chemistry',
    language: 'English',
    frequency: 'Semi-monthly',
    indexedIn: ['Web of Science', 'Scopus', 'PubMed'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 2.089,
      hIndex: 267,
      citationsPerDoc: 9.23
    }
  },
  {
    id: 'j6',
    name: 'Journal of Ethnopharmacology',
    abbreviation: 'J Ethnopharmacol',
    publisher: 'Elsevier',
    scope: 'Traditional medicine, ethnopharmacology, medicinal plants, natural products, indigenous knowledge, phytotherapy, and ethnobotany research.',
    subjects: ['Ethnopharmacology', 'Traditional Medicine', 'Natural Products', 'Phytotherapy'],
    openAccess: false,
    reviewTime: '6-8 weeks',
    acceptanceRate: 30,
    website: 'https://www.journals.elsevier.com/journal-of-ethnopharmacology',
    language: 'English',
    frequency: 'Monthly',
    indexedIn: ['Web of Science', 'Scopus', 'PubMed', 'MEDLINE'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 1.134,
      hIndex: 189,
      citationsPerDoc: 5.20
    }
  },
  {
    id: 'j7',
    name: 'Phytomedicine',
    abbreviation: 'Phytomedicine',
    publisher: 'Elsevier',
    scope: 'Phytotherapy, herbal medicine, medicinal plants, clinical studies of plant-based treatments, phytochemistry, and pharmacological activities of natural products.',
    subjects: ['Phytotherapy', 'Herbal Medicine', 'Clinical Trials', 'Pharmacology'],
    openAccess: false,
    reviewTime: '5-7 weeks',
    acceptanceRate: 25,
    website: 'https://www.journals.elsevier.com/phytomedicine',
    language: 'English',
    frequency: 'Monthly',
    indexedIn: ['Web of Science', 'Scopus', 'PubMed'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 1.567,
      hIndex: 156,
      citationsPerDoc: 6.66
    }
  },
  {
    id: 'j8',
    name: 'Biomaterials',
    abbreviation: 'Biomaterials',
    publisher: 'Elsevier',
    scope: 'Biomaterials science, tissue engineering, drug delivery systems, nanomedicine, biomedical devices, regenerative medicine, and materials-biology interfaces.',
    subjects: ['Biomaterials', 'Tissue Engineering', 'Drug Delivery', 'Nanomedicine'],
    openAccess: false,
    reviewTime: '6-10 weeks',
    acceptanceRate: 18,
    website: 'https://www.journals.elsevier.com/biomaterials',
    language: 'English',
    frequency: 'Monthly',
    indexedIn: ['Web of Science', 'Scopus', 'PubMed', 'MEDLINE'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 4.112,
      hIndex: 356,
      citationsPerDoc: 15.30
    }
  },
  {
    id: 'j9',
    name: 'Polymer',
    abbreviation: 'Polymer',
    publisher: 'Elsevier',
    scope: 'Polymer science and engineering, polymer synthesis, polymer characterization, polymer physics, polymer processing, biopolymers, and advanced polymeric materials.',
    subjects: ['Polymer Science', 'Materials Science', 'Chemical Engineering', 'Biopolymers'],
    openAccess: false,
    reviewTime: '4-6 weeks',
    acceptanceRate: 40,
    website: 'https://www.journals.elsevier.com/polymer',
    language: 'English',
    frequency: 'Bi-weekly',
    indexedIn: ['Web of Science', 'Scopus'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 1.145,
      hIndex: 234,
      citationsPerDoc: 4.97
    }
  },
  {
    id: 'j10',
    name: 'European Journal of Pharmaceutics and Biopharmaceutics',
    abbreviation: 'Eur J Pharm Biopharm',
    publisher: 'Elsevier',
    scope: 'Pharmaceutical technology, biopharmaceutics, drug delivery, formulation science, pharmaceutical nanotechnology, and drug absorption studies.',
    subjects: ['Pharmaceutics', 'Biopharmaceutics', 'Drug Delivery', 'Nanotechnology'],
    openAccess: false,
    reviewTime: '5-8 weeks',
    acceptanceRate: 28,
    website: 'https://www.journals.elsevier.com/european-journal-of-pharmaceutics-and-biopharmaceutics',
    language: 'English',
    frequency: 'Monthly',
    indexedIn: ['Web of Science', 'Scopus', 'PubMed'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 1.419,
      hIndex: 167,
      citationsPerDoc: 5.59
    }
  },
  {
    id: 'j11',
    name: 'Journal of Clinical Microbiology',
    abbreviation: 'J Clin Microbiol',
    publisher: 'American Society for Microbiology',
    scope: 'Clinical microbiology, diagnostic methods, infectious diseases, antimicrobial susceptibility, clinical laboratory science, and pathogen detection.',
    subjects: ['Clinical Microbiology', 'Infectious Diseases', 'Diagnostics', 'Laboratory Medicine'],
    openAccess: false,
    reviewTime: '4-6 weeks',
    acceptanceRate: 35,
    website: 'https://journals.asm.org/journal/jcm',
    language: 'English',
    frequency: 'Monthly',
    indexedIn: ['Web of Science', 'Scopus', 'PubMed', 'MEDLINE'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 2.045,
      hIndex: 289,
      citationsPerDoc: 6.81
    }
  },
  {
    id: 'j12',
    name: 'Remote Sensing',
    abbreviation: 'Remote Sens',
    publisher: 'MDPI',
    scope: 'Remote sensing technology, satellite imagery, geospatial analysis, Earth observation, environmental monitoring, and sensor development.',
    subjects: ['Remote Sensing', 'Geosciences', 'Environmental Science', 'Technology'],
    openAccess: true,
    reviewTime: '3-5 weeks',
    acceptanceRate: 45,
    website: 'https://www.mdpi.com/journal/remotesensing',
    language: 'English',
    frequency: 'Semi-monthly',
    indexedIn: ['Web of Science', 'Scopus', 'DOAJ', 'Inspec'],
    metrics: {
      sjrQuartile: 'Q1',
      sjrScore: 1.355,
      hIndex: 134,
      citationsPerDoc: 5.35
    }
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate LLM analysis and journal matching
export async function analyzeManuscript(manuscript: Manuscript): Promise<RecommendationReport> {
  await delay(2000);

  const recommendations = generateMockRecommendations(manuscript);

  return {
    id: `report-${Date.now()}`,
    manuscript,
    recommendations,
    generatedAt: new Date(),
    analysisNotes: generateAnalysisNotes(manuscript),
    suggestedKeywords: extractKeywords(manuscript)
  };
}

function generateMockRecommendations(manuscript: Manuscript): JournalRecommendation[] {
  const title = manuscript.title.toLowerCase();
  const abstract = manuscript.abstract.toLowerCase();
  const content = `${title} ${abstract}`;

  const scoredJournals = sampleJournals.map(journal => {
    let score = Math.floor(Math.random() * 30) + 20;

    const subjectKeywords: { [key: string]: string[] } = {
      'Molecular Biology': ['molecular', 'gene', 'dna', 'rna', 'protein', 'cell', 'genomic'],
      'Biochemistry': ['biochem', 'enzyme', 'metabolism', 'protein', 'chemical'],
      'Pharmaceutical Sciences': ['drug', 'pharmaceutical', 'pharmacology', 'formulation', 'delivery'],
      'Food Science': ['food', 'nutrition', 'antioxidant', 'dietary', 'bioactive'],
      'Ethnopharmacology': ['herbal', 'traditional', 'plant', 'extract', 'medicinal', 'ethnopharm'],
      'Phytotherapy': ['phyto', 'herbal', 'plant', 'extract', 'therapeutic'],
      'Biomaterials': ['biomaterial', 'scaffold', 'tissue', 'implant', 'biocompatible'],
      'Polymer Science': ['polymer', 'electrospinning', 'nanofiber', 'vinyl', 'acetate'],
      'Clinical Microbiology': ['microbial', 'bacteria', 'infection', 'pathogen', 'clinical'],
      'Remote Sensing': ['remote', 'sensing', 'satellite', 'geospatial', 'imagery'],
      'Multidisciplinary': ['study', 'analysis', 'research', 'investigation']
    };

    journal.subjects.forEach(subject => {
      const keywords = subjectKeywords[subject] || [];
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          score += 8;
        }
      });
    });

    const scopeWords = journal.scope.toLowerCase().split(/\s+/);
    scopeWords.forEach(word => {
      if (word.length > 4 && content.includes(word)) {
        score += 3;
      }
    });

    score = Math.min(score, 98);

    return {
      journal,
      score,
      matchReasons: generateMatchReasons(journal),
      scopeAlignment: generateScopeAlignment(journal),
      strengthsForJournal: generateStrengths(),
      potentialChallenges: generateChallenges(journal)
    };
  });

  return scoredJournals
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(item => ({
      journal: item.journal,
      matchScore: item.score,
      matchReasons: item.matchReasons,
      scopeAlignment: item.scopeAlignment,
      strengthsForJournal: item.strengthsForJournal,
      potentialChallenges: item.potentialChallenges
    }));
}

function generateMatchReasons(journal: Journal): string[] {
  const reasons: string[] = [];

  if (journal.openAccess) {
    reasons.push('Open access journal increases visibility and citations');
  }

  if (journal.metrics.hIndex > 200) {
    reasons.push(`High H-Index (${journal.metrics.hIndex}) indicates strong citation impact`);
  }

  if (journal.acceptanceRate > 40) {
    reasons.push('Higher acceptance rate improves publication chances');
  }

  if (journal.metrics.sjrQuartile === 'Q1') {
    reasons.push('Q1 ranked journal in its category');
  }

  journal.subjects.slice(0, 2).forEach(subject => {
    reasons.push(`Strong alignment with ${subject} focus area`);
  });

  return reasons.slice(0, 4);
}

function generateScopeAlignment(journal: Journal): string {
  return `Your manuscript's focus aligns well with ${journal.name}'s emphasis on ${journal.subjects[0].toLowerCase()} research.`;
}

function generateStrengths(): string[] {
  return [
    'Clear research objectives and methodology',
    'Novel approach to the research problem',
    'Comprehensive experimental design'
  ];
}

function generateChallenges(journal: Journal): string[] {
  const challenges: string[] = [];

  if (journal.acceptanceRate < 25) {
    challenges.push('Competitive acceptance rate may require multiple revision rounds');
  }

  if (journal.metrics.hIndex > 300) {
    challenges.push('High-impact journals expect groundbreaking findings');
  }

  if (!journal.openAccess) {
    challenges.push('Article processing charges may apply for open access option');
  }

  return challenges.slice(0, 2);
}

function generateAnalysisNotes(manuscript: Manuscript): string {
  return `Based on the analysis of your manuscript "${manuscript.title}", we've identified journals that align with your research focus. The recommendations consider scope alignment, SJR quartile, H-Index, open access options, and typical review timelines.`;
}

function extractKeywords(manuscript: Manuscript): string[] {
  const content = `${manuscript.title} ${manuscript.abstract}`.toLowerCase();
  const keywords: string[] = [];

  if (content.includes('extract')) keywords.push('extraction');
  if (content.includes('antioxidant')) keywords.push('antioxidant activity');
  if (content.includes('polymer')) keywords.push('polymer science');
  if (content.includes('cell')) keywords.push('cellular studies');
  if (content.includes('clinical')) keywords.push('clinical research');
  if (content.includes('drug')) keywords.push('drug delivery');

  return [...new Set(keywords)].slice(0, 6);
}
