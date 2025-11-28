import OpenAI from 'openai';
import { Journal, getAllJournals } from '../data/journals.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface JournalRecommendation {
  journal: Journal;
  matchScore: number;
  matchReasons: string[];
  scopeAlignment: string;
  strengthsForJournal: string[];
  potentialChallenges: string[];
}

export interface AnalysisResult {
  recommendations: JournalRecommendation[];
  analysisNotes: string;
  suggestedKeywords: string[];
}

// Build the prompt for LLM analysis
function buildAnalysisPrompt(title: string, abstract: string, journals: Journal[]): string {
  const journalDescriptions = journals.map(j =>
    `ID: ${j.id}
Name: ${j.name}
Scope: ${j.scope}
Subjects: ${j.subjects.join(', ')}
Impact Factor: ${j.impactFactor}
Open Access: ${j.openAccess ? 'Yes' : 'No'}
Acceptance Rate: ${j.acceptanceRate}%`
  ).join('\n\n');

  return `You are an expert academic advisor helping researchers find the most suitable journals for their manuscripts.

MANUSCRIPT INFORMATION:
Title: ${title}

Abstract: ${abstract}

AVAILABLE JOURNALS:
${journalDescriptions}

TASK:
Analyze the manuscript and recommend the top 5 most suitable journals from the list above. For each recommendation, provide:
1. A match score (0-100) based on how well the manuscript fits the journal's scope
2. 3-4 specific reasons why this journal is a good match
3. A brief explanation of how the manuscript aligns with the journal's scope
4. 2-3 strengths of the manuscript for this specific journal
5. 1-2 potential challenges or considerations

Also provide:
- Overall analysis notes (2-3 sentences summarizing your recommendation strategy)
- 5-6 keywords that describe the manuscript's main focus areas

RESPONSE FORMAT (JSON):
{
  "recommendations": [
    {
      "journalId": "j1",
      "matchScore": 85,
      "matchReasons": ["reason1", "reason2", "reason3"],
      "scopeAlignment": "explanation of scope alignment",
      "strengthsForJournal": ["strength1", "strength2"],
      "potentialChallenges": ["challenge1"]
    }
  ],
  "analysisNotes": "overall analysis summary",
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3"]
}

Respond ONLY with valid JSON.`;
}

export async function analyzeManuscript(
  title: string,
  abstract: string
): Promise<AnalysisResult> {
  const journals = getAllJournals();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert academic advisor specializing in journal selection for manuscript submissions. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: buildAnalysisPrompt(title, abstract, journals)
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const parsed = JSON.parse(content);

    // Map journal IDs to full journal objects
    const recommendations: JournalRecommendation[] = parsed.recommendations.map((rec: {
      journalId: string;
      matchScore: number;
      matchReasons: string[];
      scopeAlignment: string;
      strengthsForJournal: string[];
      potentialChallenges: string[];
    }) => {
      const journal = journals.find(j => j.id === rec.journalId);
      if (!journal) {
        throw new Error(`Journal not found: ${rec.journalId}`);
      }
      return {
        journal,
        matchScore: rec.matchScore,
        matchReasons: rec.matchReasons,
        scopeAlignment: rec.scopeAlignment,
        strengthsForJournal: rec.strengthsForJournal,
        potentialChallenges: rec.potentialChallenges
      };
    });

    return {
      recommendations,
      analysisNotes: parsed.analysisNotes,
      suggestedKeywords: parsed.suggestedKeywords
    };
  } catch (error) {
    console.error('LLM analysis error:', error);
    throw new Error('Failed to analyze manuscript with LLM');
  }
}

// Fallback analysis without LLM (keyword-based matching)
export function analyzeManuscriptFallback(
  title: string,
  abstract: string
): AnalysisResult {
  const journals = getAllJournals();
  const content = `${title} ${abstract}`.toLowerCase();

  // Simple keyword matching
  const scoredJournals = journals.map(journal => {
    let score = 30; // Base score

    // Check scope keywords
    const scopeWords = journal.scope.toLowerCase().split(/\s+/);
    scopeWords.forEach(word => {
      if (word.length > 4 && content.includes(word)) {
        score += 3;
      }
    });

    // Check subject keywords
    journal.subjects.forEach(subject => {
      if (content.includes(subject.toLowerCase())) {
        score += 10;
      }
    });

    // Cap score
    score = Math.min(score, 95);

    return {
      journal,
      score,
      matchReasons: [
        `Aligns with ${journal.subjects[0]} research focus`,
        journal.openAccess ? 'Open access increases visibility' : 'Established readership in the field',
        `Impact factor of ${journal.impactFactor} provides credibility`
      ],
      scopeAlignment: `Your manuscript's topic appears to align with ${journal.name}'s focus on ${journal.subjects.slice(0, 2).join(' and ').toLowerCase()}.`,
      strengthsForJournal: [
        'Clear research methodology',
        'Relevant subject matter'
      ],
      potentialChallenges: journal.acceptanceRate < 30
        ? ['Competitive acceptance rate']
        : []
    };
  });

  // Sort and take top 5
  const recommendations = scoredJournals
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => ({
      journal: item.journal,
      matchScore: item.score,
      matchReasons: item.matchReasons,
      scopeAlignment: item.scopeAlignment,
      strengthsForJournal: item.strengthsForJournal,
      potentialChallenges: item.potentialChallenges
    }));

  return {
    recommendations,
    analysisNotes: `Based on keyword analysis of your manuscript "${title}", we've identified journals that align with your research focus.`,
    suggestedKeywords: extractKeywords(content)
  };
}

function extractKeywords(content: string): string[] {
  const keywords: string[] = [];
  const keywordMap: { [key: string]: string } = {
    'molecular': 'molecular biology',
    'polymer': 'polymer science',
    'drug': 'drug delivery',
    'herbal': 'herbal medicine',
    'antioxidant': 'antioxidant activity',
    'clinical': 'clinical research',
    'cell': 'cellular studies',
    'gene': 'genetics',
    'protein': 'protein analysis',
    'extract': 'natural extracts'
  };

  Object.entries(keywordMap).forEach(([key, value]) => {
    if (content.includes(key)) {
      keywords.push(value);
    }
  });

  return keywords.slice(0, 6);
}
