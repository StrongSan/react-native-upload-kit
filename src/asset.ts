import { extensionFromMimeType, inferMimeType } from './mime';
import type { NormalizedUploadAsset, ReactNativeUploadFile, UploadAssetInput } from './types';
import { UploadKitError } from './types';

export type NormalizeUploadAssetOptions = {
  defaultMimeType?: string;
  fallbackName?: string;
};

export function normalizeUploadAsset(
  asset: UploadAssetInput,
  options: NormalizeUploadAssetOptions = {},
): NormalizedUploadAsset {
  const uri = asset.uri?.trim();
  if (!uri) {
    throw new UploadKitError('Upload asset requires a uri.');
  }

  const defaultMimeType = options.defaultMimeType ?? 'image/jpeg';
  const rawName = asset.fileName ?? asset.name ?? getFileNameFromUri(uri);
  const type = normalizeMimeType(asset.type ?? asset.mimeType ?? inferMimeType(rawName ?? uri, defaultMimeType));
  const name = normalizeFileName(rawName, type, options.fallbackName ?? 'upload');

  const normalized: NormalizedUploadAsset = {
    uri,
    name,
    type,
  };

  const size = asset.fileSize ?? asset.size;
  if (typeof size === 'number' && Number.isFinite(size) && size >= 0) {
    normalized.size = size;
  }

  if (typeof asset.width === 'number' && Number.isFinite(asset.width) && asset.width > 0) {
    normalized.width = asset.width;
  }

  if (typeof asset.height === 'number' && Number.isFinite(asset.height) && asset.height > 0) {
    normalized.height = asset.height;
  }

  return normalized;
}

export function normalizeUploadAssets(
  assets: UploadAssetInput | readonly UploadAssetInput[],
  options: NormalizeUploadAssetOptions = {},
): NormalizedUploadAsset[] {
  const list = Array.isArray(assets) ? assets : [assets];
  return list.map((asset) => normalizeUploadAsset(asset, options));
}

export function toReactNativeUploadFile(asset: UploadAssetInput): ReactNativeUploadFile {
  const normalized = normalizeUploadAsset(asset);
  return {
    uri: normalized.uri,
    name: normalized.name,
    type: normalized.type,
  };
}

function normalizeMimeType(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return trimmed || 'application/octet-stream';
}

function normalizeFileName(rawName: string | null | undefined, mimeType: string, fallbackName: string): string {
  const extension = extensionFromMimeType(mimeType, 'jpg');
  const candidate = rawName?.trim() || `${fallbackName}.${extension}`;
  const sanitized = candidate
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  if (!sanitized) {
    return `${fallbackName}.${extension}`;
  }

  if (/\.[a-z0-9]+$/i.test(sanitized)) {
    return sanitized;
  }

  return `${sanitized}.${extension}`;
}

function getFileNameFromUri(uri: string): string | null {
  const withoutQuery = uri.split(/[?#]/, 1)[0] ?? '';
  const lastSegment = withoutQuery.split('/').filter(Boolean).pop();
  if (!lastSegment) {
    return null;
  }

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}
