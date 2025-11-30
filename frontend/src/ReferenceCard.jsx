import React from 'react';
import './ReferenceCard.css';

export default function ReferenceCard({ reference }) {
  if (!reference || !reference.sacredText) {
    return null;
  }

  const { sacredText, meaning, application, summary } = reference;

  return (
    <div className="reference-card">
      <div className="reference-section sacred-text-section">
        <div className="section-header">
          <span className="section-icon">📖</span>
          <h4>Sacred Text</h4>
        </div>
        <blockquote className="sacred-quote">
          "{sacredText.quote}"
        </blockquote>
        <p className="source-reference">
          — {sacredText.source.fullReference}
        </p>
      </div>

      {meaning && (
        <div className="reference-section meaning-section">
          <div className="section-header">
            <span className="section-icon">💡</span>
            <h4>Meaning</h4>
          </div>
          <p className="section-content">{meaning}</p>
        </div>
      )}

      {application && (
        <div className="reference-section application-section">
          <div className="section-header">
            <span className="section-icon">🎯</span>
            <h4>Application</h4>
          </div>
          <p className="section-content">{application}</p>
        </div>
      )}

      {summary && (
        <div className="reference-section summary-section">
          <div className="section-header">
            <span className="section-icon">📝</span>
            <h4>Summary</h4>
          </div>
          <p className="section-content summary-text">{summary}</p>
        </div>
      )}
    </div>
  );
}
