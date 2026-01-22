let cachedMicrFontBase64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function loadMicrFontBase64(): Promise<string> {
  if (cachedMicrFontBase64) {
    return cachedMicrFontBase64;
  }

  if (typeof window === 'undefined') {
    throw new Error('MICR font must be loaded in the browser context.');
  }

  const fontUrl = new URL('/font/micrenc.ttf', window.location.origin).toString();
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(`فشل تحميل خط MICR من ${fontUrl}`);
  }

  const buffer = await response.arrayBuffer();
  cachedMicrFontBase64 = arrayBufferToBase64(buffer);
  return cachedMicrFontBase64;
}

/**
 * Add MICR font to jsPDF instance
 */
export async function addMICRFont(pdf: any) {
  const micrBase64 = await loadMicrFontBase64();
  pdf.addFileToVFS('MICR.ttf', micrBase64);
  pdf.addFont('MICR.ttf', 'MICR', 'normal', 'Identity-H');
}
