import React, { useState, useMemo, useEffect } from 'react';
import { TriagedTicket, FilterState, TriageResponse } from './types';
import { DEMO_TICKETS } from './mockData';
import { UploadCard } from './components/UploadCard';
import { StatSummary } from './components/StatSummary';
import { FilterBar } from './components/FilterBar';
import { TicketTable } from './components/TicketTable';
import { TrendBanner } from './components/TrendBanner';
import { Zap, AlertTriangle, RefreshCw, CheckCircle2, ShieldCheck, Sun, Moon, Github, Globe, Linkedin } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

function getInitialTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('techflow-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [tickets, setTickets] = useState<TriagedTicket[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const [filters, setFilters] = useState<FilterState>({
    urgencyFilter: 'all',
    categoryFilter: 'all',
    searchQuery: '',
  });

  // Health check backend status on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => {
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      })
      .catch(() => {
        setBackendStatus('offline');
      });
  }, []);

  // Update theme data attribute on <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('techflow-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Handle CSV File Upload to Backend Endpoint (/api/tickets/triage)
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/triage`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Server returned status code ${response.status}`);
      }

      const data: TriageResponse = await response.json();
      setTickets(data.tickets);
      setSuccessMessage(`Successfully triaged ${data.total_tickets} tickets from ${file.name}`);
      setBackendStatus('online');
    } catch (err: any) {
      console.warn('Backend API triage error:', err);
      setErrorMessage(`Upload failed: ${err.message || 'Could not connect to API server'}. Try loading the demo dataset instead.`);
      setBackendStatus('offline');
    } finally {
      setIsUploading(false);
    }
  };

  // Handler to load benchmark Kaggle demo dataset
  const handleLoadDemo = () => {
    setErrorMessage(null);
    setTickets(DEMO_TICKETS);
    setSelectedFileName('Demo Dataset (Kaggle Support Tickets)');
    setSuccessMessage('Loaded benchmark Kaggle support tickets dataset (10 tickets)');
  };

  // Handler to clear loaded queue tickets
  const handleClearQueue = () => {
    setTickets([]);
    setSelectedFileName(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    setFilters({
      urgencyFilter: 'all',
      categoryFilter: 'all',
      searchQuery: '',
    });
  };

  // Client-side multi-criteria filtering & search
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (filters.urgencyFilter !== 'all' && ticket.urgency.toLowerCase() !== filters.urgencyFilter) {
        return false;
      }
      if (
        filters.categoryFilter !== 'all' &&
        ticket.issue_type.toLowerCase() !== filters.categoryFilter.toLowerCase()
      ) {
        return false;
      }
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase().trim();
        const subjectMatch = ticket.subject.toLowerCase().includes(query);
        const bodyMatch = ticket.body.toLowerCase().includes(query);
        const idMatch = ticket.ticket_id.toLowerCase().includes(query);
        const customerMatch = ticket.customer_id?.toLowerCase().includes(query) ?? false;
        if (!subjectMatch && !bodyMatch && !idMatch && !customerMatch) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, filters]);

  const hasTickets = tickets.length > 0;

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-primary)',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: theme === 'dark'
                ? 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme === 'dark' ? '0 0 16px rgba(56, 189, 248, 0.3)' : '0 2px 8px rgba(59, 130, 246, 0.25)',
            }}
          >
            <Zap size={22} style={{ color: '#ffffff' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              TechFlow <span className="gradient-text">Support Queue</span>
            </h1>
            <p className="subtext" style={{ marginTop: '2px' }}>
              Automated Ticket Classification & Urgency Prioritization
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme Toggle */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Backend Status Badge with Tooltip */}
          <span className="tooltip-wrapper tooltip-bottom">
            <span
              className="badge"
              style={{
                background:
                  backendStatus === 'online'
                    ? 'var(--status-online-bg)'
                    : backendStatus === 'offline'
                    ? 'var(--status-offline-bg)'
                    : 'var(--status-checking-bg)',
                color:
                  backendStatus === 'online'
                    ? 'var(--status-online-text)'
                    : backendStatus === 'offline'
                    ? 'var(--status-offline-text)'
                    : 'var(--status-checking-text)',
                border: `1px solid ${
                  backendStatus === 'online'
                    ? 'var(--status-online-border)'
                    : backendStatus === 'offline'
                    ? 'var(--status-offline-border)'
                    : 'var(--status-checking-border)'
                }`,
                padding: '6px 14px',
                fontSize: '0.775rem',
                cursor: 'help',
              }}
            >
              {backendStatus === 'online' ? (
                <>
                  <ShieldCheck size={14} /> API Connected
                </>
              ) : backendStatus === 'offline' ? (
                <>
                  <AlertTriangle size={14} /> Standalone Mode
                </>
              ) : (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Connecting…
                </>
              )}
            </span>

            <span className="tooltip-content" style={{ width: '280px', right: 0, left: 'auto', transform: 'none' }}>
              {backendStatus === 'online' ? (
                <>
                  <strong>FastAPI Backend API Connected</strong><br />
                  Connected to <code>{API_BASE_URL}</code>. Powering automated CSV ingestion, keyword/pattern rule engine classification, and LLM triage fallback.
                </>
              ) : backendStatus === 'offline' ? (
                <>
                  <strong>Standalone Demo Mode</strong><br />
                  Backend API at <code>{API_BASE_URL}</code> is offline. Running in client mode. Launch <code>uvicorn main:app</code> to connect backend triage services.
                </>
              ) : (
                <>
                  <strong>Checking API Status…</strong><br />
                  Verifying connection to <code>{API_BASE_URL}/health</code>.
                </>
              )}
            </span>
          </span>
        </div>
      </header>

      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="toast-error fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.775rem' }}
            onClick={() => setErrorMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Toast Notification */}
      {successMessage && !errorMessage && (
        <div className="toast-success fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.775rem' }}
            onClick={() => setSuccessMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Drag & Drop CSV Upload Card */}
      <UploadCard
        onFileUpload={handleFileUpload}
        onLoadDemo={handleLoadDemo}
        onClearQueue={handleClearQueue}
        hasTickets={hasTickets}
        isUploading={isUploading}
        selectedFileName={selectedFileName}
      />

      {/* Only show triage results when tickets are loaded */}
      {hasTickets && (
        <>
          {/* Statistics Summary Banner */}
          <StatSummary
            tickets={tickets}
            activeUrgencyFilter={filters.urgencyFilter}
            onSelectUrgencyFilter={(urgency) => setFilters({ ...filters, urgencyFilter: urgency })}
          />

          {/* AI Complaint Spikes & Trend Banner */}
          <TrendBanner
            tickets={tickets}
            onSelectSearchQuery={(query) => setFilters({ ...filters, searchQuery: query })}
          />

          {/* Filter & Live Search Bar */}
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            totalFilteredCount={filteredTickets.length}
            totalUnfilteredCount={tickets.length}
          />

          {/* Prioritized Ticket Table */}
          <TicketTable
            tickets={filteredTickets}
            onResetFilters={() =>
              setFilters({
                urgencyFilter: 'all',
                categoryFilter: 'all',
                searchQuery: '',
              })
            }
          />
        </>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: '48px',
          paddingTop: '24px',
          paddingBottom: '32px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
        }}
      >
        <div>
          Built for <strong>Pursuit's AI-Native Fellowship (2026)</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="https://github.com/rhaeyyan/pursuit-techflow-triage-mvp"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Github size={15} /> GitHub Repository
          </a>

          <span style={{ color: 'var(--text-muted)' }}>•</span>

          <a
            href="https://rayankhan.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Globe size={15} /> rayankhan.io
          </a>

          <span style={{ color: 'var(--text-muted)' }}>•</span>

          <a
            href="https://www.linkedin.com/in/rayan-khan-3b90a2356/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Linkedin size={15} /> LinkedIn
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
