import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, HelpCircle } from 'lucide-react';
import type { MetricFilter } from '../types';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterPanelProps {
  filters: MetricFilter;
  onFilterChange: (filters: MetricFilter) => void;
  availableIndexes: string[];
  availablePublishers: string[];
  isMobile?: boolean;
}

// Tooltip component - positioned below and aligned left to expand into panel
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="group relative inline-flex items-center">
      {children}
      <div className="absolute left-0 top-full mt-2 z-50 hidden group-hover:block w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-normal break-words">
        {text}
        <div className="absolute left-1 bottom-full border-4 border-transparent border-b-gray-900" />
      </div>
    </div>
  );
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  availableIndexes,
  availablePublishers
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['sjrQuartile', 'hIndex', 'openAccess'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const clearAllFilters = () => {
    onFilterChange({
      sjrQuartile: null,
      sjrScore: null,
      hIndex: null,
      citationsPerDoc: null,
      openAccess: null,
      indexedIn: null,
      publisher: null
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null);

  const sjrOptions: FilterOption[] = [
    { id: 'Q1', label: 'Q1 (Top 25%)', count: 12 },
    { id: 'Q2', label: 'Q2 (25-50%)', count: 8 },
    { id: 'Q3', label: 'Q3 (50-75%)', count: 4 },
    { id: 'Q4', label: 'Q4 (Bottom 25%)', count: 2 }
  ];

  const handleSjrChange = (sjrValue: string) => {
    const currentSjr = filters.sjrQuartile || [];
    const newSjr = currentSjr.includes(sjrValue)
      ? currentSjr.filter(s => s !== sjrValue)
      : [...currentSjr, sjrValue];
    onFilterChange({
      ...filters,
      sjrQuartile: newSjr.length > 0 ? newSjr : null
    });
  };

  const handleIndexChange = (indexValue: string) => {
    const currentIndexes = filters.indexedIn || [];
    const newIndexes = currentIndexes.includes(indexValue)
      ? currentIndexes.filter(i => i !== indexValue)
      : [...currentIndexes, indexValue];
    onFilterChange({
      ...filters,
      indexedIn: newIndexes.length > 0 ? newIndexes : null
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 sticky top-20 flex flex-col max-h-[calc(100vh-120px)]">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-violet-600" />
          <h3 className="font-semibold text-gray-900">FILTERS</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* SJR Quartile */}
        <div className="border-b border-gray-100 pb-4">
          <button
            onClick={() => toggleSection('sjrQuartile')}
            className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <div className="flex items-center gap-1">
              <span>SJR Quartile</span>
              <Tooltip text="SCImago Journal Rank (SJR) measures journal prestige based on weighted citations. Q1 = top 25% (most prestigious), Q2 = 25-50%, Q3 = 50-75%, Q4 = bottom 25%.">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-violet-500 cursor-help" />
              </Tooltip>
            </div>
            {expandedSections.has('sjrQuartile') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('sjrQuartile') && (
            <div className="mt-2 space-y-2">
              {sjrOptions.map((option) => (
                <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.sjrQuartile?.includes(option.id) || false}
                    onChange={() => handleSjrChange(option.id)}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-600">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* H-Index */}
        <div className="border-b border-gray-100 pb-4">
          <button
            onClick={() => toggleSection('hIndex')}
            className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <div className="flex items-center gap-1">
              <span>H-Index</span>
              <Tooltip text="The H-Index measures both productivity and citation impact. A journal has an H-Index of h if it has published h papers that have each been cited at least h times.">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-violet-500 cursor-help" />
              </Tooltip>
            </div>
            {expandedSections.has('hIndex') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('hIndex') && (
            <div className="mt-2 space-y-2">
              {[
                { label: '> 100', min: 100, max: 1000 },
                { label: '50 - 100', min: 50, max: 100 },
                { label: '20 - 50', min: 20, max: 50 },
                { label: '< 20', min: 0, max: 20 }
              ].map((range) => (
                <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      filters.hIndex?.min === range.min &&
                      filters.hIndex?.max === range.max
                    }
                    onChange={() => {
                      const current = filters.hIndex;
                      if (current && current.min === range.min && current.max === range.max) {
                        onFilterChange({ ...filters, hIndex: null });
                      } else {
                        onFilterChange({ ...filters, hIndex: { min: range.min, max: range.max } });
                      }
                    }}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-600">{range.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* SJR Score */}
        <div className="border-b border-gray-100 pb-4">
          <button
            onClick={() => toggleSection('sjrScore')}
            className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <div className="flex items-center gap-1">
              <span>SJR Score</span>
              <Tooltip text="The numeric SJR (SCImago Journal Rank) score. Higher values indicate greater journal prestige. Top journals typically have SJR > 3.0.">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-violet-500 cursor-help" />
              </Tooltip>
            </div>
            {expandedSections.has('sjrScore') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('sjrScore') && (
            <div className="mt-2 space-y-2">
              {[
                { label: '> 3.0 (Elite)', min: 3.0, max: 100 },
                { label: '1.0 - 3.0 (High)', min: 1.0, max: 3.0 },
                { label: '0.5 - 1.0 (Medium)', min: 0.5, max: 1.0 },
                { label: '< 0.5 (Lower)', min: 0, max: 0.5 }
              ].map((range) => (
                <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      filters.sjrScore?.min === range.min &&
                      filters.sjrScore?.max === range.max
                    }
                    onChange={() => {
                      const current = filters.sjrScore;
                      if (current && current.min === range.min && current.max === range.max) {
                        onFilterChange({ ...filters, sjrScore: null });
                      } else {
                        onFilterChange({ ...filters, sjrScore: { min: range.min, max: range.max } });
                      }
                    }}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-600">{range.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Citations per Doc */}
        <div className="border-b border-gray-100 pb-4">
          <button
            onClick={() => toggleSection('citationsPerDoc')}
            className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <div className="flex items-center gap-1">
              <span>Citations per Doc</span>
              <Tooltip text="Average number of citations received per document over 2 years. Higher values indicate greater research impact and visibility.">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-violet-500 cursor-help" />
              </Tooltip>
            </div>
            {expandedSections.has('citationsPerDoc') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('citationsPerDoc') && (
            <div className="mt-2 space-y-2">
              {[
                { label: '> 5.0 (High impact)', min: 5.0, max: 1000 },
                { label: '2.0 - 5.0 (Good)', min: 2.0, max: 5.0 },
                { label: '1.0 - 2.0 (Moderate)', min: 1.0, max: 2.0 },
                { label: '< 1.0 (Lower)', min: 0, max: 1.0 }
              ].map((range) => (
                <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      filters.citationsPerDoc?.min === range.min &&
                      filters.citationsPerDoc?.max === range.max
                    }
                    onChange={() => {
                      const current = filters.citationsPerDoc;
                      if (current && current.min === range.min && current.max === range.max) {
                        onFilterChange({ ...filters, citationsPerDoc: null });
                      } else {
                        onFilterChange({ ...filters, citationsPerDoc: { min: range.min, max: range.max } });
                      }
                    }}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-600">{range.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Indexed In */}
        <div className="border-b border-gray-100 pb-4">
          <button
            onClick={() => toggleSection('indexedIn')}
            className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <div className="flex items-center gap-1">
              <span>Indexed In</span>
              <Tooltip text="Academic databases where the journal is indexed. Being indexed in major databases indicates quality and discoverability.">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-violet-500 cursor-help" />
              </Tooltip>
            </div>
            {expandedSections.has('indexedIn') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('indexedIn') && (
            <div className="mt-2 space-y-2">
              {availableIndexes.map((index) => (
                <label key={index} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.indexedIn?.includes(index) || false}
                    onChange={() => handleIndexChange(index)}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-600">{index}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Open Access */}
        <div className="border-b border-gray-100 pb-4">
          <button
            onClick={() => toggleSection('openAccess')}
            className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <div className="flex items-center gap-1">
              <span>Access Type</span>
              <Tooltip text="Open Access journals make articles freely available to everyone. Subscription journals require payment or institutional access.">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-violet-500 cursor-help" />
              </Tooltip>
            </div>
            {expandedSections.has('openAccess') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('openAccess') && (
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.openAccess === true}
                  onChange={() =>
                    onFilterChange({
                      ...filters,
                      openAccess: filters.openAccess === true ? null : true
                    })
                  }
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-600">Open Access</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.openAccess === false}
                  onChange={() =>
                    onFilterChange({
                      ...filters,
                      openAccess: filters.openAccess === false ? null : false
                    })
                  }
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-600">Subscription</span>
              </label>
            </div>
          )}
        </div>

        {/* Publisher */}
        <div>
          <button
            onClick={() => toggleSection('publisher')}
            className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <div className="flex items-center gap-1">
              <span>Publisher</span>
              <Tooltip text="The organization that publishes the journal. Major publishers often have well-established peer review processes.">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-violet-500 cursor-help" />
              </Tooltip>
            </div>
            {expandedSections.has('publisher') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('publisher') && (
            <div className="mt-2 space-y-2">
              {availablePublishers.map((publisher) => (
                <label key={publisher} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.publisher?.includes(publisher) || false}
                    onChange={() => {
                      const current = filters.publisher || [];
                      const newPublishers = current.includes(publisher)
                        ? current.filter(p => p !== publisher)
                        : [...current, publisher];
                      onFilterChange({
                        ...filters,
                        publisher: newPublishers.length > 0 ? newPublishers : null
                      });
                    }}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-600">{publisher}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
