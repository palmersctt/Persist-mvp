import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AssistantDoor from './AssistantDoor';

const DATE = '2026-11-25';
const TZ = 'America/New_York';

describe('AssistantDoor', () => {
  const paste = (text: string) =>
    fireEvent.change(screen.getByLabelText("Your assistant's reply"), { target: { value: text } });

  it('scores a valid pasted reply', () => {
    const onDay = vi.fn();
    render(<AssistantDoor date={DATE} timezone={TZ} onDay={onDay} />);
    paste(
      '```json\n' +
        JSON.stringify({
          version: 1,
          date: DATE,
          timezone: TZ,
          meetings: [
            {
              start: `${DATE}T09:00:00-05:00`,
              end: `${DATE}T10:00:00-05:00`,
              category: 'COLLABORATIVE',
            },
          ],
        }) +
        '\n```'
    );
    fireEvent.click(screen.getByText('Get my verdict'));
    expect(onDay).toHaveBeenCalledTimes(1);
    expect(onDay.mock.calls[0][0].meetings).toHaveLength(1);
  });

  it('explains what to fix', () => {
    const onDay = vi.fn();
    render(<AssistantDoor date={DATE} timezone={TZ} onDay={onDay} />);
    paste(
      JSON.stringify({
        version: 1,
        date: DATE,
        timezone: TZ,
        meetings: [{ start: `${DATE}T09:00`, end: `${DATE}T10:00` }],
      })
    );
    fireEvent.click(screen.getByText('Get my verdict'));
    expect(onDay).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/without a time zone/);
  });

  it('switches assistants', () => {
    render(<AssistantDoor date={DATE} timezone={TZ} onDay={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'ChatGPT' }));
    expect(screen.getByRole('tab', { name: 'ChatGPT' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/ChatGPT with your calendar connected/)).toBeTruthy();
  });
});
