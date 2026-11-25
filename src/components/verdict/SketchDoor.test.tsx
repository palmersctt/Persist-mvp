import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SketchDoor from './SketchDoor';
import BodyChips from './BodyChips';

describe('SketchDoor', () => {
  it('scores the tapped hours', () => {
    const onDay = vi.fn();
    render(<SketchDoor date="2026-11-25" timezone="America/New_York" onDay={onDay} />);
    expect(screen.getByText('Score an open day')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('9a'));
    fireEvent.click(screen.getByLabelText('10a'));
    fireEvent.click(screen.getByLabelText('10a, booked')); // → heavy
    expect(screen.getByLabelText('10a, heavy')).toBeTruthy();
    fireEvent.click(screen.getByText('Score 2 booked hours'));
    expect(onDay.mock.calls[0][0].meetings.map((m: { category: string }) => m.category)).toEqual([
      'COLLABORATIVE',
      'HEAVY_MEETINGS',
    ]);
  });
});

describe('BodyChips', () => {
  it('selects and clears a chip', () => {
    const onChange = vi.fn();
    const { rerender } = render(<BodyChips value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Long' }));
    expect(onChange).toHaveBeenLastCalledWith({ trained: 'long' });
    rerender(<BodyChips value={{ trained: 'long' }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Long' }));
    expect(onChange).toHaveBeenLastCalledWith({ trained: undefined });
  });
});
