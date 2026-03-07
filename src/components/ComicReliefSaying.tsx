'use client'

import React from 'react';

interface ComicReliefSayingProps {
  saying?: string;
  className?: string;
}

export default function ComicReliefSaying({ saying, className = '' }: ComicReliefSayingProps) {
  if (!saying) return null;

  return (
    <div className={`comic-relief-container ${className}`}>
      <div
        className="comic-relief-saying"
        style={{
          background: 'linear-gradient(135deg, rgba(232, 125, 58, 0.1), rgba(232, 125, 58, 0.05))',
          border: '2px solid rgba(232, 125, 58, 0.3)',
          borderRadius: '16px',
          padding: '16px 24px',
          margin: '16px auto',
          maxWidth: '600px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(232, 125, 58, 0.1)',
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '12px',
            width: '6px',
            height: '6px',
            backgroundColor: '#E87D3A',
            borderRadius: '50%',
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            width: '6px',
            height: '6px',
            backgroundColor: '#E87D3A',
            borderRadius: '50%',
            opacity: 0.6,
          }}
        />

        {/* Main saying text */}
        <div
          style={{
            color: '#E87D3A',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: "'Lora', serif",
            fontStyle: 'italic',
            letterSpacing: '0.5px',
            lineHeight: '1.4',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        >
          {saying}
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '11px',
            fontWeight: '500',
            marginTop: '8px',
            letterSpacing: '0.3px',
          }}
        >
          Movie Quote of the Day
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '20%',
            right: '20%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(232, 125, 58, 0.5), transparent)',
          }}
        />
      </div>
    </div>
  );
}

// Also export a version for use in other tabs if needed
export function ComicReliefSayingCompact({ saying }: ComicReliefSayingProps) {
  if (!saying) return null;

  return (
    <div
      className="comic-relief-compact"
      style={{
        backgroundColor: 'rgba(232, 125, 58, 0.08)',
        border: '1px solid rgba(232, 125, 58, 0.2)',
        borderRadius: '12px',
        padding: '12px 16px',
        margin: '8px 0',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: '#E87D3A',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Lora', serif",
          fontStyle: 'italic',
          letterSpacing: '0.3px',
        }}
      >
        {saying}
      </div>
    </div>
  );
}
