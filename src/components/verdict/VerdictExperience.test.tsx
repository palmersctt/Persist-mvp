import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));
vi.mock('../../lib/trackEvent', () => ({ trackEvent: vi.fn() }));

import VerdictExperience from './VerdictExperience';

describe('Get your verdict', () => {
  it('scores an example: reveal, then card, why and receipt', () => {
    render(<VerdictExperience />);
    expect(screen.getByText(/Get your/)).toBeTruthy();

    fireEvent.click(screen.getByText('Short sleep, light calendar'));
    expect(screen.getByText('Reading your day')).toBeTruthy();
    expect(screen.getByText('2 meetings, 1.5 hours')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Skip to your verdict'));
    expect(screen.getByText('Today’s verdict')).toBeTruthy();
    expect(screen.getAllByText(/Survival/).length).toBeGreaterThan(0);
    expect(screen.getByText('Receipt')).toBeTruthy();
    expect(screen.getByText(/Your day was never uploaded/)).toBeTruthy();
    expect(screen.getByText('Your workday')).toBeTruthy(); // the real why panel
    expect(screen.getByText('Get this every morning')).toBeTruthy();
  });

  it('goes back to choose another day', () => {
    render(<VerdictExperience />);
    fireEvent.click(screen.getByText('Eight back-to-backs'));
    fireEvent.click(screen.getByLabelText('Skip to your verdict'));
    fireEvent.click(screen.getByText('Score another day'));
    expect(screen.getByText('Try an example')).toBeTruthy();
  });
});
