import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Tag,
  Eye,
  Trash2,
  RefreshCw,
  Filter
} from 'lucide-react';

interface ManuscriptItem {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  matchedJournals: number;
  bestMatch: string;
  bestMatchScore: number;
  createdAt: Date;
  status: 'analyzed' | 'draft' | 'submitted';
}

interface MyManuscriptsProps {
  onNavigate: (page: string) => void;
}

const MyManuscripts: React.FC<MyManuscriptsProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data
  const manuscripts: ManuscriptItem[] = [
    {
      id: '1',
      title: 'Quantum Gravity and the Holographic Principle: A New Perspective',
      abstract: 'This paper explores the relationship between quantum gravity theories and holographic principles...',
      keywords: ['quantum gravity', 'holography', 'string theory'],
      matchedJournals: 8,
      bestMatch: 'Physical Review D',
      bestMatchScore: 87,
      createdAt: new Date('2024-01-15'),
      status: 'analyzed'
    },
    {
      id: '2',
      title: 'Machine Learning Applications in Drug Discovery',
      abstract: 'We present a novel machine learning approach for predicting drug-target interactions...',
      keywords: ['machine learning', 'drug discovery', 'AI'],
      matchedJournals: 12,
      bestMatch: 'Nature Machine Intelligence',
      bestMatchScore: 92,
      createdAt: new Date('2024-01-10'),
      status: 'submitted'
    },
    {
      id: '3',
      title: 'Climate Change Impact on Coastal Ecosystems',
      abstract: 'This study examines the effects of rising sea levels on coastal biodiversity...',
      keywords: ['climate change', 'ecology', 'biodiversity'],
      matchedJournals: 6,
      bestMatch: 'Nature Climate Change',
      bestMatchScore: 78,
      createdAt: new Date('2024-01-05'),
      status: 'draft'
    },
  ];

  const filteredManuscripts = manuscripts.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || m.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Analyzed</span>;
      case 'submitted':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Submitted</span>;
      case 'draft':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Draft</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Manuscripts</h1>
            <p className="text-sm text-gray-500">{manuscripts.length} manuscripts total</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('scope-matcher')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search manuscripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="analyzed">Analyzed</option>
              <option value="submitted">Submitted</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Manuscripts List */}
      <div className="space-y-4">
        {filteredManuscripts.length > 0 ? (
          filteredManuscripts.map((manuscript) => (
            <div
              key={manuscript.id}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(manuscript.status)}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {manuscript.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {manuscript.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {manuscript.abstract}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {manuscript.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-full flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      <strong className="text-gray-900">{manuscript.matchedJournals}</strong> journals matched
                    </span>
                    <span className="text-gray-600">
                      Best: <strong className="text-violet-600">{manuscript.bestMatch}</strong> ({manuscript.bestMatchScore}%)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No manuscripts found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search terms' : 'Start by analyzing a new manuscript'}
            </p>
            <button
              onClick={() => onNavigate('scope-matcher')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Analyze Manuscript</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyManuscripts;
