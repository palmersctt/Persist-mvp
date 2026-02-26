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
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 140, 0, 0.05))',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '16px',
          padding: '16px 24px',
          margin: '16px auto',
          maxWidth: '600px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(255, 215, 0, 0.1)',
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
            backgroundColor: '#FFD700',
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
            backgroundColor: '#FFD700',
            borderRadius: '50%',
            opacity: 0.6,
          }}
        />

        {/* Main saying text */}
        <div
          style={{
            color: '#FFD700',
            fontSize: '17px',
            fontWeight: '500',
            fontFamily: 'var(--font-lora), Georgia, serif',
            fontStyle: 'italic',
            letterSpacing: '0.01em',
            lineHeight: '1.5',
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
          🎬 Movie Quote of the Day
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '20%',
            right: '20%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.5), transparent)',
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
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '12px',
        padding: '12px 16px',
        margin: '8px 0',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: '#FFD700',
          fontSize: '15px',
          fontWeight: '500',
          fontFamily: 'var(--font-lora), Georgia, serif',
          fontStyle: 'italic',
          letterSpacing: '0.01em',
          lineHeight: '1.5',
        }}
      >
        {saying}
      </div>
    </div>
  );
}