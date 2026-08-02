import React from 'react';
import { TriagedTicket } from '../types';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, Layers } from 'lucide-react';

interface StatSummaryProps {
  tickets: TriagedTicket[];
  activeUrgencyFilter?: string;
  onSelectUrgencyFilter?: (urgency: 'all' | 'critical' | 'high' | 'medium' | 'low') => void;
}

export const StatSummary: React.FC<StatSummaryProps> = ({
  tickets,
  activeUrgencyFilter = 'all',
  onSelectUrgencyFilter,
}) => {
  const total = tickets.length;
  const criticalCount = tickets.filter((t) => t.urgency === 'critical').length;
  const highCount = tickets.filter((t) => t.urgency === 'high').length;
  const mediumCount = tickets.filter((t) => t.urgency === 'medium').length;
  const lowCount = tickets.filter((t) => t.urgency === 'low').length;

  const getPercentage = (count: number) => {
    if (total === 0) return '0%';
    return `${Math.round((count / total) * 100)}%`;
  };

  const cards = [
    {
      id: 'all' as const,
      label: 'Total Tickets',
      count: total,
      pct: '100%',
      icon: <Layers size={20} style={{ color: 'var(--accent-primary)' }} />,
      borderColor: 'var(--border-primary)',
      accentColor: 'var(--accent-primary)',
      badgeClass: 'badge-category',
      isPulse: false,
    },
    {
      id: 'critical' as const,
      label: 'Critical Urgency',
      count: criticalCount,
      pct: getPercentage(criticalCount),
      icon: <ShieldAlert size={20} style={{ color: 'var(--critical-color)' }} />,
      borderColor: 'var(--critical-border)',
      accentColor: 'var(--critical-color)',
      badgeClass: 'badge-critical',
      isPulse: true,
    },
    {
      id: 'high' as const,
      label: 'High Urgency',
      count: highCount,
      pct: getPercentage(highCount),
      icon: <AlertTriangle size={20} style={{ color: 'var(--high-color)' }} />,
      borderColor: 'var(--high-border)',
      accentColor: 'var(--high-color)',
      badgeClass: 'badge-high',
      isPulse: false,
    },
    {
      id: 'medium' as const,
      label: 'Medium Urgency',
      count: mediumCount,
      pct: getPercentage(mediumCount),
      icon: <AlertCircle size={20} style={{ color: 'var(--medium-color)' }} />,
      borderColor: 'var(--medium-border)',
      accentColor: 'var(--medium-color)',
      badgeClass: 'badge-medium',
      isPulse: false,
    },
    {
      id: 'low' as const,
      label: 'Low Urgency',
      count: lowCount,
      pct: getPercentage(lowCount),
      icon: <Info size={20} style={{ color: 'var(--low-color)' }} />,
      borderColor: 'var(--low-border)',
      accentColor: 'var(--low-color)',
      badgeClass: 'badge-low',
      isPulse: false,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '24px',
      }}
    >
      {cards.map((card) => {
        const isSelected = activeUrgencyFilter === card.id;

        return (
          <div
            key={card.id}
            className="card"
            role={onSelectUrgencyFilter ? 'button' : undefined}
            tabIndex={onSelectUrgencyFilter ? 0 : undefined}
            aria-pressed={onSelectUrgencyFilter ? isSelected : undefined}
            aria-label={onSelectUrgencyFilter ? `Filter by ${card.label}: ${card.count} tickets` : undefined}
            onClick={() => onSelectUrgencyFilter && onSelectUrgencyFilter(card.id)}
            onKeyDown={(e) => {
              if (onSelectUrgencyFilter && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelectUrgencyFilter(card.id);
              }
            }}
            style={{
              padding: '16px 18px',
              cursor: onSelectUrgencyFilter ? 'pointer' : 'default',
              borderColor: isSelected ? 'var(--accent-primary)' : card.borderColor,
              boxShadow: isSelected
                ? '0 0 0 2px var(--accent-primary), var(--shadow-sm)'
                : 'var(--shadow-card)',
              transform: isSelected ? 'scale(1.02)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {card.isPulse && criticalCount > 0 && <span className="critical-pulse-dot" />}
                {card.label}
              </span>
              {card.icon}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  fontFamily: 'var(--font-family-heading)',
                  color:
                    card.id === 'critical' && criticalCount > 0
                      ? 'var(--critical-color)'
                      : 'var(--text-primary)',
                }}
              >
                {card.count}
              </span>
              <span className={`badge ${card.badgeClass}`}>{card.pct}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
