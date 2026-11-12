import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReadinessExplain from './ReadinessExplain';
import { dashboardVerdict } from '../lib/dashboardModel';
import type { WorkHealthMetrics } from '../hooks/useWorkHealth';

const work = {
  adaptivePerformanceIndex: 70,
  cognitiveResilience: 35,
  workRhythmRecovery: 70,
  schedule: { durationHours: 2 },
} as unknown as WorkHealthMetrics;

const weekAhead = [2, 4.5, 0, 0, 5, 6, 5.5].map((meetingHours, i) => ({
  date: new Date(Date.UTC(2026, 5, 11 + i)).toISOString().slice(0, 10),
  meetingHours,
}));

describe('ReadinessExplain', () => {
  it('shows the week with its key sessions when there is a forecast', () => {
    render(<ReadinessExplain model={dashboardVerdict(work, null, weekAhead, '2026-06-11')} />);
    expect(screen.getByText('Your week')).toBeTruthy();
    expect(screen.getByText('Best days')).toBeTruthy(); // no training history
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getAllByText('hard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('long')).toHaveLength(1);
  });

  it('leaves the week out without a forecast', () => {
    render(<ReadinessExplain model={dashboardVerdict(work, null)} />);
    expect(screen.queryByText('Your week')).toBeNull();
    expect(screen.getByText('Your workday')).toBeTruthy();
  });

  it('shows body readings only when a provider reports them', () => {
    const model = dashboardVerdict(work, null);
    const { rerender } = render(<ReadinessExplain model={model} />);
    expect(screen.queryByText('Your body')).toBeNull();
    rerender(<ReadinessExplain model={model} body={{ recovery: 66, sleepPerformance: 88 }} />);
    expect(screen.getByText('Your body')).toBeTruthy();
    expect(screen.getByText('66%')).toBeTruthy();
  });
});
