import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConnectedAssistants from './ConnectedAssistants';

const json = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) });

describe('ConnectedAssistants', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lists tokens and shows a new one once', async () => {
    fetchMock
      .mockReturnValueOnce(
        json({ tokens: [{ id: 't1', label: 'Claude', created_at: '', last_used_at: null }] })
      )
      .mockReturnValueOnce(json({ token: 'pst_new', id: 't2' }))
      .mockReturnValueOnce(json({ tokens: [] }));
    render(<ConnectedAssistants />);
    await waitFor(() => expect(screen.getByText('Claude')).toBeTruthy());
    fireEvent.click(screen.getByText('New token'));
    await waitFor(() => expect(screen.getByText('pst_new')).toBeTruthy());
    expect(screen.getByText(/won’t be shown again/)).toBeTruthy();
  });

  it('says coming soon when tokens are not set up', async () => {
    fetchMock.mockReturnValueOnce(json({ tokens: [], available: false }));
    render(<ConnectedAssistants />);
    await waitFor(() => expect(screen.getByText('Coming soon.')).toBeTruthy());
  });

  it('revokes a token', async () => {
    fetchMock
      .mockReturnValueOnce(
        json({ tokens: [{ id: 't1', label: 'Claude', created_at: '', last_used_at: null }] })
      )
      .mockReturnValueOnce(json({ revoked: true }))
      .mockReturnValueOnce(json({ tokens: [] }));
    render(<ConnectedAssistants />);
    await waitFor(() => screen.getByText('Revoke'));
    fireEvent.click(screen.getByText('Revoke'));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/tokens?id=t1', { method: 'DELETE' })
    );
  });
});
