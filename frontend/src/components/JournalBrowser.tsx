import React, { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, ExternalLink, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import type { Journal } from '../types';
import { getJournals, getSubjectAreas, type JournalFilters } from '../services/api';

interface JournalBrowserProps {
  onSelectJournal?: (journal: Journal) => void;
}

const JournalBrowser: React.FC<JournalBrowserProps> = ({ onSelectJournal }) => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedQuartiles, setSelectedQuartiles] = useState<string[]>([]);
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  const fetchJournals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: JournalFilters = {
        search: searchQuery || undefined,
        areas: selectedAreas.length > 0 ? selectedAreas : undefined,
        quartile: selectedQuartiles.length > 0 ? selectedQuartiles : undefined,
        openAccess: openAccessOnly ? true : undefined,
        limit: pagination.limit,
        offset: pagination.offset
      };

      const result = await getJournals(filters);
      setJournals(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError('Failed to load journals. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedAreas, selectedQuartiles, openAccessOnly, pagination.limit, pagination.offset]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  useEffect(() => {
    getSubjectAreas().then(setAvailableAreas).catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, offset: 0 }));
    fetchJournals();
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    setPagination(p => ({
      ...p,
      offset: direction === 'next' ? p.offset + p.limit : Math.max(0, p.offset - p.limit)
    }));
  };

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
    setPagination(p => ({ ...p, offset: 0 }));
  };

  const toggleQuartile = (q: string) => {
    setSelectedQuartiles(prev =>
      prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]
    );
    setPagination(p => ({ ...p, offset: 0 }));
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Journal Browser</h2>
              <p className="text-sm text-gray-500">
                {pagination.total} World Scientific journals
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-violet-50 border-violet-200 text-violet-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {(selectedAreas.length > 0 || selectedQuartiles.length > 0 || openAccessOnly) && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full">
                {selectedAreas.length + selectedQuartiles.length + (openAccessOnly ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journals by name or scope..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            {/* Quartiles */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">SJR Quartile</label>
              <div className="flex gap-2">
                {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                  <button
                    key={q}
                    onClick={() => toggleQuartile(q)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedQuartiles.includes(q)
                        ? 'bg-violet-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Open Access */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openAccessOnly}
                  onChange={(e) => {
                    setOpenAccessOnly(e.target.checked);
                    setPagination(p => ({ ...p, offset: 0 }));
                  }}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700">Open Access only</span>
              </label>
            </div>

            {/* Subject Areas */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Subject Areas</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableAreas.map(area => (
                  <button
                    key={area}
                    onClick={() => toggleArea(area)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedAreas.includes(area)
                        ? 'bg-violet-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedAreas.length > 0 || selectedQuartiles.length > 0 || openAccessOnly) && (
              <button
                onClick={() => {
                  setSelectedAreas([]);
                  setSelectedQuartiles([]);
                  setOpenAccessOnly(false);
                  setPagination(p => ({ ...p, offset: 0 }));
                }}
                className="text-sm text-violet-600 hover:text-violet-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Journal List */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto mb-3" />
            Loading journals...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : journals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No journals found matching your criteria.</div>
        ) : (
          journals.map(journal => (
            <div
              key={journal.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onSelectJournal?.(journal)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{journal.name}</h3>
                    {journal.openAccess && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Open Access
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {journal.scope || 'No scope description available'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      journal.metrics.sjrQuartile === 'Q1' ? 'bg-emerald-100 text-emerald-700' :
                      journal.metrics.sjrQuartile === 'Q2' ? 'bg-blue-100 text-blue-700' :
                      journal.metrics.sjrQuartile === 'Q3' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {journal.metrics.sjrQuartile}
                    </span>
                    <span>H-Index: {journal.metrics.hIndex}</span>
                    <span>{journal.subjects.slice(0, 2).join(', ')}</span>
                  </div>
                </div>
                <a
                  href={journal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && journals.length > 0 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {pagination.offset + 1}-{Math.min(pagination.offset + journals.length, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange('prev')}
              disabled={pagination.offset === 0}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600 px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange('next')}
              disabled={!pagination.hasMore}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalBrowser;
