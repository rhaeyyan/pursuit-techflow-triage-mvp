import React from 'react';
import { TrendingUp, Filter } from 'lucide-react';
import { TriagedTicket } from '../types';

interface TrendCluster {
  topic: string;
  phrase: string;
  count: number;
  percentage: number;
}

interface TrendBannerProps {
  tickets: TriagedTicket[];
  onSelectSearchQuery?: (query: string) => void;
}

export const TrendBanner: React.FC<TrendBannerProps> = ({ tickets, onSelectSearchQuery }) => {
  if (!tickets || tickets.length < 3) return null;

  // Perform client-side n-gram trend extraction
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'is', 'are', 'was', 'were', 'our', 'my', 'your', 'we', 'you', 'it', 'this',
    'that', 'please', 'need', 'urgent', 'has', 'have', 'from', 'all', 'not'
  ]);

  const phraseCounts: Record<string, number> = {};

  tickets.forEach((t) => {
    const text = `${t.subject} ${t.body}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const cleanWords = words.filter((w) => !stopWords.has(w));

    for (let i = 0; i < cleanWords.length - 1; i++) {
      const bigram = `${cleanWords[i]} ${cleanWords[i + 1]}`;
      phraseCounts[bigram] = (phraseCounts[bigram] || 0) + 1;
    }
  });

  const total = tickets.length;
  const sortedClusters: TrendCluster[] = Object.entries(phraseCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([phrase, count]) => ({
      topic: phrase.replace(/\b\w/g, (c) => c.toUpperCase()),
      phrase,
      count,
      percentage: Math.round((count / total) * 100),
    }));

  if (sortedClusters.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: '20px',
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(234, 88, 12, 0.1)',
            color: '#ea580c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingUp size={18} />
        </div>
        <div>
          <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Emerging Complaint Spikes & Topic Clusters:
          </span>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            Automated n-gram trend extraction across {total} ingested tickets
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {sortedClusters.map((cluster, idx) => (
          <button
            key={idx}
            type="button"
            className="reason-tag"
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              borderColor: idx === 0 ? 'var(--critical-border)' : 'var(--border-subtle)',
              backgroundColor: idx === 0 ? 'var(--critical-bg)' : 'var(--bg-input)',
              color: idx === 0 ? 'var(--critical-color)' : 'var(--text-primary)',
              fontWeight: 600,
            }}
            onClick={() => onSelectSearchQuery && onSelectSearchQuery(cluster.phrase)}
            title={`Click to filter queue by "${cluster.phrase}"`}
          >
            <Filter size={11} /> {cluster.topic} ({cluster.percentage}%)
          </button>
        ))}
      </div>
    </div>
  );
};
