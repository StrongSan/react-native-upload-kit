const MIME_BY_EXTENSION: Record<string, string> = {
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

export function getFileExtension(value: string): string | null {
  const withoutQuery = value.split(/[?#]/, 1)[0] ?? '';
  const match = /\.([a-z0-9]+)$/i.exec(withoutQuery);
  return match?.[1]?.toLowerCase() ?? null;
}

export function inferMimeType(value: string, fallback = 'application/octet-stream'): string {
  const extension = getFileExtension(value);
  if (!extension) {
    return fallback;
  }

  return MIME_BY_EXTENSION[extension] ?? fallback;
}

export function extensionFromMimeType(mimeType: string, fallback = 'bin'): string {
  return EXTENSION_BY_MIME[mimeType.toLowerCase()] ?? fallback;
}

export function isMimeTypeAllowed(mimeType: string, allowed: readonly string[]): boolean {
  const normalized = mimeType.toLowerCase();
  return allowed.some((entry) => {
    const pattern = entry.toLowerCase();
    if (pattern.endsWith('/*')) {
      return normalized.startsWith(pattern.slice(0, -1));
    }
    return normalized === pattern;
  });
}
