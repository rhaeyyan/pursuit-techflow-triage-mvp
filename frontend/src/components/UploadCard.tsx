import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, Download, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { downloadSampleCSV } from '../mockData';

interface UploadCardProps {
  onFileUpload: (file: File) => void;
  onLoadDemo: () => void;
  onClearQueue?: () => void;
  hasTickets?: boolean;
  isUploading: boolean;
  selectedFileName?: string | null;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  onFileUpload,
  onLoadDemo,
  onClearQueue,
  hasTickets = false,
  isUploading,
  selectedFileName,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

  const validateAndProcessFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setErrorMsg('Invalid file format. Please upload a valid CSV file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller file.`);
      return;
    }
    onFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  return (
    <div className="card" style={{ padding: '22px', marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-primary)',
            }}
          >
            <FileSpreadsheet style={{ color: 'var(--accent-primary)' }} size={20} />
            Ticket Ingestion & Batch Triage
          </h2>
          <p className="subtext" style={{ marginTop: '2px' }}>
            Upload CSV support tickets for automated classification & urgency scoring
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-accent"
            onClick={onLoadDemo}
            disabled={isUploading}
            title="Load benchmark Kaggle support tickets dataset"
          >
            <Sparkles size={14} />
            Load Demo Dataset
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={downloadSampleCSV}
            title="Download example CSV schema format"
          >
            <Download size={14} />
            Sample CSV
          </button>

          {hasTickets && onClearQueue && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onClearQueue}
              style={{ color: 'var(--critical-color)', borderColor: 'var(--critical-border)' }}
              title="Clear loaded tickets and return to empty upload state"
            >
              <Trash2 size={14} />
              Clear Queue
            </button>
          )}
        </div>
      </div>

      <div
        role="button"
        tabIndex={isUploading ? -1 : 0}
        aria-label="Upload CSV ticket file"
        aria-disabled={isUploading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (!isUploading && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        style={{
          border: isDragOver
            ? '2px dashed var(--accent-primary)'
            : '2px dashed var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '32px 20px',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.04)' : 'var(--bg-input)',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          style={{ display: 'none' }}
          disabled={isUploading}
        />

        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDragOver ? 'var(--accent-primary)' : 'var(--text-muted)',
            transition: 'all 0.2s ease',
          }}
        >
          {isUploading ? (
            <UploadCloud className="animate-spin" size={24} />
          ) : (
            <UploadCloud size={24} />
          )}
        </div>

        <div>
          <p
            style={{
              fontWeight: 600,
              fontSize: '0.925rem',
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            {isUploading ? (
              'Processing CSV with Triage Engine…'
            ) : selectedFileName ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--accent-emerald)',
                }}
              >
                <CheckCircle2 size={15} /> Selected: {selectedFileName}
              </span>
            ) : (
              'Drag & drop your CSV file here, or click to browse'
            )}
          </p>
          <p className="subtext" style={{ fontSize: '0.8rem' }}>
            Supports CSV files with{' '}
            <code
              style={{
                color: 'var(--accent-primary)',
                background: 'var(--bg-code)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.775rem',
              }}
            >
              ticket_id
            </code>
            ,{' '}
            <code
              style={{
                color: 'var(--accent-primary)',
                background: 'var(--bg-code)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.775rem',
              }}
            >
              subject
            </code>
            ,{' '}
            <code
              style={{
                color: 'var(--accent-primary)',
                background: 'var(--bg-code)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.775rem',
              }}
            >
              body
            </code>
          </p>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            marginTop: '12px',
            color: 'var(--critical-color)',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={15} />
          {errorMsg}
        </div>
      )}
    </div>
  );
};
