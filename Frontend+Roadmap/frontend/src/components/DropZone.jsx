import React, { useRef, useState } from 'react';

/**
 * DropZone
 * ─────────────────────────────────────────────────────────────
 * Accepts PDF files only (backend requires pdfplumber-parseable PDFs).
 *
 * Props:
 *   onFile  : (File) => void   — called with the raw File object
 *   onReady : ()    => void    — called when a valid file is selected
 */
export default function DropZone({ onFile, onReady }) {
  const [dragging,  setDragging]  = useState(false);
  const [fileName,  setFileName]  = useState('');
  const [fileError, setFileError] = useState('');
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Please upload a PDF file.');
      setFileName('');
      return;
    }
    if (file.size === 0) {
      setFileError('File is empty.');
      setFileName('');
      return;
    }

    setFileError('');
    setFileName(file.name);
    onFile(file);
    onReady?.();
  };

  return (
    <div
      className={`drop-zone${dragging ? ' dragover' : ''}`}
      onDragOver={e  => { e.preventDefault(); setDragging(true);  }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
      <div className="dz-icon-ring">↑</div>
      <div className="dz-title">{fileName ? fileName : 'Drop your PDF here'}</div>
      <div className="dz-hint">
        {fileError
          ? <span style={{ color: '#ff6b6b' }}>{fileError}</span>
          : 'PDF only · click to browse'
        }
      </div>
      {fileName && <div className="file-badge">📄 {fileName}</div>}
    </div>
  );
}
