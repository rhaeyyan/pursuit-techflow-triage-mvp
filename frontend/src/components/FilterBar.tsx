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
  const urgencyOptions: Array<{ id: 'all' | UrgencyLevel; label: string; badgeClass: string }> = [
    { id: 'all', label: 'All Urgencies', badgeClass: 'badge-category' },
    { id: 'critical', label: 'Critical', badgeClass: 'badge-critical' },
    { id: 'high', label: 'High', badgeClass: 'badge-high' },
    { id: 'medium', label: 'Medium', badgeClass: 'badge-medium' },
    { id: 'low', label: 'Low', badgeClass: 'badge-low' },
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

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Real-time search bar */}
        <div style={{ position: 'relative', flex: '1 1 320px', minWidth: '260px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tickets by subject, body, or ID..."
            style={{
              width: '100%',
              padding: '10px 38px 10px 42px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-glass)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category dropdown filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
          <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={filters.categoryFilter}
            onChange={handleCategoryChange}
            style={{
              flex: 1,
              padding: '10px 14px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-glass)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset filters button */}
        {isFiltered && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
          >
            <RotateCcw size={14} />
            Reset Filters
          </button>
        )}
      </div>

      {/* Urgency Filter Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Urgency Filter:
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {urgencyOptions.map((option) => {
            const isActive = filters.urgencyFilter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleUrgencyClick(option.id)}
                style={{
                  background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                  border: isActive
                    ? '1px solid var(--accent-cyan)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {option.id !== 'all' && (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor:
                        option.id === 'critical'
                          ? 'var(--critical-color)'
                          : option.id === 'high'
                          ? 'var(--high-color)'
                          : option.id === 'medium'
                          ? 'var(--medium-color)'
                          : 'var(--low-color)',
                    }}
                  />
                )}
                {option.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Showing <strong>{totalFilteredCount}</strong> of <strong>{totalUnfilteredCount}</strong> tickets
        </div>
      </div>
    </div>
  );
};
