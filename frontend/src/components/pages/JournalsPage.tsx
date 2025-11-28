import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  ExternalLink,
  Star,
  TrendingUp,
  Unlock,
  Lock,
  ChevronDown
} from 'lucide-react';

interface Journal {
  id: string;
  name: string;
  publisher: string;
  sjrQuartile: string;
  sjrScore: number;
  hIndex: number;
  openAccess: boolean;
  subjects: string[];
  website: string;
}

const JournalsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuartile, setSelectedQuartile] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - in real app, fetch from API
  useEffect(() => {
    // Simulating API call
    setTimeout(() => {
      setJournals([
        {
          id: '1',
          name: 'Nature',
          publisher: 'Springer Nature',
          sjrQuartile: 'Q1',
          sjrScore: 15.21,
          hIndex: 1186,
          openAccess: false,
          subjects: ['Multidisciplinary', 'Science'],
          website: 'https://www.nature.com'
        },
        {
          id: '2',
          name: 'Physical Review D',
          publisher: 'American Physical Society',
          sjrQuartile: 'Q1',
          sjrScore: 1.89,
          hIndex: 245,
          openAccess: false,
          subjects: ['Physics', 'Astronomy'],
          website: 'https://journals.aps.org/prd/'
        },
        {
          id: '3',
          name: 'PLOS ONE',
          publisher: 'Public Library of Science',
          sjrQuartile: 'Q1',
          sjrScore: 0.99,
          hIndex: 332,
          openAccess: true,
          subjects: ['Multidisciplinary', 'Science'],
          website: 'https://journals.plos.org/plosone/'
        },
        {
          id: '4',
          name: 'IEEE Transactions on Pattern Analysis',
          publisher: 'IEEE',
          sjrQuartile: 'Q1',
          sjrScore: 8.33,
          hIndex: 382,
          openAccess: false,
          subjects: ['Computer Science', 'AI'],
          website: 'https://ieeexplore.ieee.org/'
        },
        {
          id: '5',
          name: 'Journal of Machine Learning Research',
          publisher: 'MIT Press',
          sjrQuartile: 'Q1',
          sjrScore: 3.45,
          hIndex: 186,
          openAccess: true,
          subjects: ['Machine Learning', 'Computer Science'],
          website: 'https://jmlr.org/'
        },
        {
          id: '6',
          name: 'Cell',
          publisher: 'Elsevier',
          sjrQuartile: 'Q1',
          sjrScore: 22.34,
          hIndex: 798,
          openAccess: false,
          subjects: ['Biology', 'Biochemistry'],
          website: 'https://www.cell.com/'
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredJournals = journals.filter(j => {
    const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          j.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          j.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesQuartile = selectedQuartile === 'all' || j.sjrQuartile === selectedQuartile;
    return matchesSearch && matchesQuartile;
  });

  const getQuartileColor = (quartile: string) => {
    switch (quartile) {
      case 'Q1': return 'bg-emerald-100 text-emerald-700';
      case 'Q2': return 'bg-blue-100 text-blue-700';
      case 'Q3': return 'bg-amber-100 text-amber-700';
      case 'Q4': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Journals</h1>
          <p className="text-sm text-gray-500">Browse and explore academic journals</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search journals by name, publisher, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                showFilters ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">SJR Quartile</label>
                <div className="flex gap-2">
                  {['all', 'Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuartile(q)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedQuartile === q
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {q === 'all' ? 'All' : q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredJournals.length}</span> journals
        </p>
      </div>

      {/* Journals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredJournals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJournals.map((journal) => (
            <div
              key={journal.id}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow card-hover"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{journal.name}</h3>
                  <p className="text-sm text-gray-500">{journal.publisher}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ml-2 ${getQuartileColor(journal.sjrQuartile)}`}>
                  {journal.sjrQuartile}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {journal.subjects.map((subject, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-full"
                  >
                    {subject}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">SJR: <strong>{journal.sjrScore.toFixed(2)}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">H-Index: <strong>{journal.hIndex}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${journal.openAccess ? 'text-green-600' : 'text-gray-500'}`}>
                  {journal.openAccess ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {journal.openAccess ? 'Open Access' : 'Subscription'}
                </span>
                <a
                  href={journal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  Visit
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No journals found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default JournalsPage;
