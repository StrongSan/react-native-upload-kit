import { normalizeUploadAsset } from './asset';
import { isMimeTypeAllowed } from './mime';
import type { NormalizedUploadAsset, UploadAssetInput } from './types';

export type UploadValidationCode =
  | 'missing_uri'
  | 'unsupported_mime_type'
  | 'file_too_large'
  | 'invalid_size';

export type UploadValidationIssue = {
  code: UploadValidationCode;
  message: string;
};

export type UploadValidationOptions = {
  maxBytes?: number;
  allowedMimeTypes?: readonly string[];
};

export type UploadValidationResult = {
  ok: boolean;
  asset?: NormalizedUploadAsset;
  issues: UploadValidationIssue[];
};

export class UploadValidationError extends Error {
  readonly issues: UploadValidationIssue[];

  constructor(issues: UploadValidationIssue[]) {
    super(issues.map((issue) => issue.message).join('; '));
    this.name = 'UploadValidationError';
    this.issues = issues;
  }
}

export function validateUploadAsset(
  input: UploadAssetInput,
  options: UploadValidationOptions = {},
): UploadValidationResult {
  const issues: UploadValidationIssue[] = [];
  let asset: NormalizedUploadAsset | undefined;

  try {
    asset = normalizeUploadAsset(input);
  } catch {
    issues.push({
      code: 'missing_uri',
      message: 'Upload asset requires a uri.',
    });
  }

  if (asset) {
    if (typeof asset.size === 'number' && asset.size < 0) {
      issues.push({
        code: 'invalid_size',
        message: 'Upload asset size must be greater than or equal to 0.',
      });
    }

    if (typeof options.maxBytes === 'number' && typeof asset.size === 'number' && asset.size > options.maxBytes) {
      issues.push({
        code: 'file_too_large',
        message: `Upload asset exceeds the ${options.maxBytes} byte limit.`,
      });
    }

    if (options.allowedMimeTypes && !isMimeTypeAllowed(asset.type, options.allowedMimeTypes)) {
      issues.push({
        code: 'unsupported_mime_type',
        message: `Upload asset type "${asset.type}" is not allowed.`,
      });
    }
  }

  const result: UploadValidationResult = {
    ok: issues.length === 0,
    issues,
  };

  if (asset) {
    result.asset = asset;
  }

  return result;
}

export function assertValidUploadAsset(
  input: UploadAssetInput,
  options: UploadValidationOptions = {},
): NormalizedUploadAsset {
  const result = validateUploadAsset(input, options);
  if (!result.ok) {
    throw new UploadValidationError(result.issues);
  }

  return result.asset as NormalizedUploadAsset;
}
