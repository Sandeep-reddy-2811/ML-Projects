import React from 'react';

const styles = {
  panel:   { textAlign: 'center', padding: 'clamp(48px,10vw,80px) 24px', animation: 'fadeIn 0.3s ease' },
  spinner: { width: 50, height: 50, border: '1.5px solid rgba(255,255,255,0.1)', borderTopColor: '#63ebaf', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 22px', boxShadow: '0 0 18px rgba(99,235,175,0.15)' },
  status:  { fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(18px,3vw,22px)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6, color: '#eceef3' },
  sub:     { fontSize: 13, color: '#8a93a8' },
  log:     { marginTop: 16, background: '#13161d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px', maxHeight: 180, overflowY: 'auto', textAlign: 'left' },
  line:    { fontFamily: "'Fira Code', monospace", fontSize: 11, color: '#8a93a8', lineHeight: 2, display: 'flex', alignItems: 'flex-start', gap: 7 },
  lineAct: { fontFamily: "'Fira Code', monospace", fontSize: 11, color: '#63ebaf', lineHeight: 2, display: 'flex', alignItems: 'flex-start', gap: 7 },
  dot:     { width: 4, height: 4, borderRadius: '50%', background: 'currentColor', flexShrink: 0, marginTop: 8 },
};

export default function LoadingPanel({ status, sub, streamLog }) {
  return (
    <div style={styles.panel}>
      <div style={styles.spinner} />
      <div style={styles.status}>{status || 'Analyzing...'}</div>
      <div style={styles.sub}>{sub || 'Please wait'}</div>

      {streamLog && streamLog.length > 0 && (
        <div style={styles.log}>
          {streamLog.map((line, i) => (
            <div key={i} style={i === streamLog.length - 1 ? styles.lineAct : styles.line}>
              <span style={styles.dot} />
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
