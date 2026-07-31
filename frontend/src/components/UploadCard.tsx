import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { downloadSampleCSV } from '../mockData';

interface UploadCardProps {
  onFileUpload: (file: File) => void;
  onLoadDemo: () => void;
  isUploading: boolean;
  selectedFileName?: string | null;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  onFileUpload,
  onLoadDemo,
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

  const validateAndProcessFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setErrorMsg('Invalid file format. Please upload a valid CSV file.');
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
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet style={{ color: 'var(--accent-cyan)' }} size={22} />
            Ticket Ingestion & Batch Triage
          </h2>
          <p className="subtext">
            Upload custom CSV support tickets for automated AI classification & urgency scoring
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-accent"
            onClick={onLoadDemo}
            disabled={isUploading}
            title="Instantly load benchmark Kaggle support tickets dataset"
          >
            <Sparkles size={16} />
            Load Demo Dataset (Kaggle Support Tickets)
          </button>
          
          <button
            type="button"
            className="btn-secondary"
            onClick={downloadSampleCSV}
            title="Download example CSV schema format"
          >
            <Download size={16} />
            Download Sample CSV
          </button>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragOver
            ? '2px dashed var(--accent-cyan)'
            : '2px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '36px 20px',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragOver ? 'rgba(6, 182, 212, 0.08)' : 'rgba(15, 23, 42, 0.4)',
          transition: 'all 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
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
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: isDragOver ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDragOver ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
          }}
        >
          {isUploading ? (
            <UploadCloud className="animate-spin" size={28} />
          ) : (
            <UploadCloud size={28} />
          )}
        </div>

        <div>
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {isUploading ? (
              'Processing CSV with Gemma 4 E2B AI Engine...'
            ) : selectedFileName ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
                <CheckCircle2 size={16} /> Selected: {selectedFileName}
              </span>
            ) : (
              'Drag & drop your CSV file here, or click to browse'
            )}
          </p>
          <p className="subtext">
            Supports CSV files containing <code style={{ color: 'var(--accent-cyan)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>ticket_id</code>, <code style={{ color: 'var(--accent-cyan)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>subject</code>, <code style={{ color: 'var(--accent-cyan)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>body</code>
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ marginTop: '12px', color: 'var(--critical-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}
    </div>
  );
};
