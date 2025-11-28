import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import type { RecommendationFilters } from '../services/api';
import { getPublishers } from '../services/api';

interface PreAnalysisFiltersProps {
  filters: RecommendationFilters;
  onFilterChange: (filters: RecommendationFilters) => void;
}

const quartileOptions = ['Q1', 'Q2', 'Q3', 'Q4'];

const PreAnalysisFilters: React.FC<PreAnalysisFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [publishers, setPublishers] = useState<string[]>([]);

  useEffect(() => {
    getPublishers().then(setPublishers);
  }, []);

  const hasActiveFilters = Object.values(filters).some(v =>
    v !== undefined && v !== null &&
    (Array.isArray(v) ? v.length > 0 : true)
  );

  const handleQuartileToggle = (quartile: string) => {
    const current = filters.sjrQuartile || [];
    const updated = current.includes(quartile)
      ? current.filter(q => q !== quartile)
      : [...current, quartile];
    onFilterChange({
      ...filters,
      sjrQuartile: updated.length > 0 ? updated : undefined
    });
  };

  const handlePublisherToggle = (publisher: string) => {
    const current = filters.publishers || [];
    const updated = current.includes(publisher)
      ? current.filter(p => p !== publisher)
      : [...current, publisher];
    onFilterChange({
      ...filters,
      publishers: updated.length > 0 ? updated : undefined
    });
  };

  const handleOpenAccessChange = (value: boolean | undefined) => {
    onFilterChange({
      ...filters,
      openAccess: value
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-700 text-sm">
            Advanced Filters
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
              Active
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
          {/* Description */}
          <p className="text-xs text-gray-500">
            Pre-filter journals before analysis to get recommendations only from journals matching your criteria.
          </p>

          {/* SJR Quartile */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              SJR Quartile
            </label>
            <div className="flex flex-wrap gap-2">
              {quartileOptions.map(q => (
                <button
                  key={q}
                  onClick={() => handleQuartileToggle(q)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    filters.sjrQuartile?.includes(q)
                      ? 'bg-violet-100 border-violet-300 text-violet-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Publishers */}
          {publishers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Publishers
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {publishers.map(p => (
                  <button
                    key={p}
                    onClick={() => handlePublisherToggle(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      filters.publishers?.includes(p)
                        ? 'bg-violet-100 border-violet-300 text-violet-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Open Access */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Open Access
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenAccessChange(undefined)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  filters.openAccess === undefined
                    ? 'bg-violet-100 border-violet-300 text-violet-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Any
              </button>
              <button
                onClick={() => handleOpenAccessChange(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  filters.openAccess === true
                    ? 'bg-violet-100 border-violet-300 text-violet-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleOpenAccessChange(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  filters.openAccess === false
                    ? 'bg-violet-100 border-violet-300 text-violet-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PreAnalysisFilters;
