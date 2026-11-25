// Share a rendered card as a PNG: the native share sheet on phones, a
// download elsewhere.
import { toPng } from 'html-to-image';

export async function shareCard(el: HTMLElement): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const dataUrl = await toPng(el, { pixelRatio: 3, quality: 1, skipFonts: true });
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], 'persist-verdict.png', { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'persist-verdict.png';
  a.click();
  return 'downloaded';
}
