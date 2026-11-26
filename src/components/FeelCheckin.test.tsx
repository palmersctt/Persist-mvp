import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeelCheckin from './FeelCheckin';

describe('FeelCheckin', () => {
  it('offers the five ratings', () => {
    render(<FeelCheckin rating={undefined} onRate={() => {}} />);
    expect(screen.getByText('How did today actually feel?')).toBeTruthy();
    const chips = screen.getAllByRole('radio');
    expect(chips.map((c) => c.textContent)).toEqual(['Drained', 'Heavy', 'OK', 'Good', 'Great']);
    expect(chips.every((c) => c.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  it('saves the tapped rating', () => {
    const onRate = vi.fn();
    render(<FeelCheckin rating={undefined} onRate={onRate} />);
    fireEvent.click(screen.getByText('Good'));
    expect(onRate).toHaveBeenCalledWith(4);
  });

  it('shows the saved rating as selected', () => {
    render(<FeelCheckin rating={2} onRate={() => {}} />);
    expect(screen.getByText('Heavy').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Great').getAttribute('aria-checked')).toBe('false');
  });

  it('can ask about yesterday and carry extra controls', () => {
    render(
      <FeelCheckin rating={undefined} onRate={() => {}} question="How did yesterday actually feel?">
        <button type="button">Back to today</button>
      </FeelCheckin>
    );
    expect(screen.getByText('How did yesterday actually feel?')).toBeTruthy();
    expect(screen.getByText('Back to today')).toBeTruthy();
  });
});
