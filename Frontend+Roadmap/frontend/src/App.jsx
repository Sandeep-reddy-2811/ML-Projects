import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Header        from './components/Header';
import TabNav        from './components/TabNav';
import Hero          from './components/Hero';
import UploadPanel   from './components/UploadPanel';
import LoadingPanel  from './components/LoadingPanel';
import SkillGapPanel from './components/SkillGapPanel';
import { analyzeProfile, checkHealth } from './services/backendApi';
import { SAMPLE_RESULT } from './data/sampleData';

export default function App() {
  const [activeTab,     setActiveTab]     = useState('upload');
  const [isLoading,     setIsLoading]     = useState(false);
  const [results,       setResults]       = useState(null);
  const [loaderStatus,  setLoaderStatus]  = useState('');
  const [loaderSub,     setLoaderSub]     = useState('');
  const [streamLog,     setStreamLog]     = useState([]);
  const [backendOnline, setBackendOnline] = useState(null);

  const resultsUnlocked = !!results;

  useEffect(() => {
    checkHealth().then(ok => setBackendOnline(ok));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, isLoading]);

  // ── Analyze — receives PDF files AND/OR plain text ─────────
  const handleAnalyze = async ({ resumeFile, jdFile, resumeText, jdText }) => {
    setIsLoading(true);
    setStreamLog([]);
    try {
      const data = await analyzeProfile(
        resumeFile  || null,
        jdFile      || null,
        resumeText  || '',
        jdText      || '',
        (s, b) => { setLoaderStatus(s); setLoaderSub(b); },
        (line)  => setStreamLog(prev => [...prev, line])
      );
      setResults(data);
      setActiveTab('results');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSample    = () => { setResults(SAMPLE_RESULT); setActiveTab('results'); };
  const handleReset     = () => { setResults(null); setActiveTab('upload'); };
  const handleTabSwitch = (tab) => {
    if (tab === 'results' && !resultsUnlocked) return;
    setActiveTab(tab);
  };

  return (
    <div className="app-shell">
      <Header />

      {backendOnline === false && (
        <div style={{
          background:   'rgba(255,107,107,0.08)',
          border:       '1px solid rgba(255,107,107,0.25)',
          borderRadius: 10,
          padding:      '10px 16px',
          fontSize:     12,
          color:        '#ffaaaa',
          marginBottom: 12,
          display:      'flex',
          alignItems:   'center',
          gap:          10,
        }}>
          <span>⚠</span>
          <span>
            Backend offline — make sure Django is running on{' '}
            <code style={{ fontFamily: 'Fira Code, monospace', fontSize: 11 }}>
              {process.env.REACT_APP_API_URL || 'http://localhost:8000'}
            </code>
            . You can still load sample data.
          </span>
        </div>
      )}

      {!isLoading && (
        <TabNav
          activeTab={activeTab}
          onSwitch={handleTabSwitch}
          resultsUnlocked={resultsUnlocked}
        />
      )}

      {!isLoading && activeTab === 'upload' && (
        <>
          <Hero />
          <UploadPanel onAnalyze={handleAnalyze} onSample={handleSample} />
        </>
      )}

      {isLoading && (
        <LoadingPanel
          status={loaderStatus}
          sub={loaderSub}
          streamLog={streamLog}
        />
      )}

      {!isLoading && activeTab === 'results' && results && (
        <SkillGapPanel data={results} onReset={handleReset} />
      )}
    </div>
  );
}