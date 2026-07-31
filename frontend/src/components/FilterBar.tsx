import React from 'react';
import { FilterState, UrgencyLevel, IssueType } from '../types';
import { Search, Filter, X, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updated: FilterState) => void;
  totalFilteredCount: number;
  totalUnfilteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  totalFilteredCount,
  totalUnfilteredCount,
}) => {
  const urgencyOptions: Array<{ id: 'all' | UrgencyLevel; label: string }> = [
    { id: 'all', label: 'All Urgencies' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  const categoryOptions: Array<{ id: 'all' | IssueType | string; label: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'technical', label: 'Technical' },
    { id: 'billing', label: 'Billing' },
    { id: 'account', label: 'Account Security' },
    { id: 'feature_request', label: 'Feature Request' },
    { id: 'general', label: 'General Inquiry' },
  ];

  const isFiltered =
    filters.urgencyFilter !== 'all' ||
    filters.categoryFilter !== 'all' ||
    filters.searchQuery.trim() !== '';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, categoryFilter: e.target.value });
  };

  const handleUrgencyClick = (urgency: 'all' | UrgencyLevel) => {
    onFilterChange({ ...filters, urgencyFilter: urgency });
  };

  const handleReset = () => {
    onFilterChange({
      urgencyFilter: 'all',
      categoryFilter: 'all',
      searchQuery: '',
    });
  };

  const getUrgencyDotColor = (id: string): string => {
    switch (id) {
      case 'critical': return 'var(--critical-color)';
      case 'high': return 'var(--high-color)';
      case 'medium': return 'var(--medium-color)';
      case 'low': return 'var(--low-color)';
      default: return 'transparent';
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: '18px 20px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Search + Category Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '240px' }}>
          <Search
            size={17}
            style={{
              position: 'absolute',
              left: '13px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tickets by subject, body, or ID…"
            style={{
              width: '100%',
              padding: '9px 36px 9px 40px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-focus)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-primary)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
          <Filter size={17} style={{ color: 'var(--text-muted)' }} />
          <select
            value={filters.categoryFilter}
            onChange={handleCategoryChange}
            style={{
              flex: 1,
              padding: '9px 12px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {isFiltered && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      {/* Urgency Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Urgency:
        </span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {urgencyOptions.map((option) => {
            const isActive = filters.urgencyFilter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleUrgencyClick(option.id)}
                style={{
                  background: isActive
                    ? 'var(--urgency-pill-active-bg)'
                    : 'var(--urgency-pill-inactive-bg)',
                  border: `1px solid ${isActive ? 'var(--urgency-pill-active-border)' : 'var(--urgency-pill-inactive-border)'}`,
                  color: isActive
                    ? 'var(--urgency-pill-active-text)'
                    : 'var(--urgency-pill-inactive-text)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '5px 13px',
                  fontSize: '0.775rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {option.id !== 'all' && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: getUrgencyDotColor(option.id),
                    }}
                  />
                )}
                {option.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing <strong>{totalFilteredCount}</strong> of <strong>{totalUnfilteredCount}</strong> tickets
        </div>
      </div>
    </div>
  );
};
