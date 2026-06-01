import { uploadMultipart, type UploadMultipartOptions } from './upload';
import type { FetchLike, UploadAssetInput, UploadFields } from './types';

export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';

export type CloudinaryUploadResponse = {
  secure_url?: string;
  url?: string;
  public_id?: string;
  resource_type?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  [key: string]: unknown;
};

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  raw: CloudinaryUploadResponse;
};

export type CloudinaryUnsignedUploadOptions = {
  cloudName: string;
  uploadPreset: string;
  asset: UploadAssetInput;
  resourceType?: CloudinaryResourceType;
  folder?: string;
  publicId?: string;
  tags?: readonly string[];
  context?: Record<string, string>;
  extraFields?: UploadFields;
  fetchImpl?: FetchLike;
  signal?: AbortSignal;
  formDataCtor?: UploadMultipartOptions['formDataCtor'];
};

export type CloudinarySignedUploadOptions = {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number | string;
  asset: UploadAssetInput;
  resourceType?: CloudinaryResourceType;
  folder?: string;
  publicId?: string;
  tags?: readonly string[];
  context?: Record<string, string>;
  extraFields?: UploadFields;
  fetchImpl?: FetchLike;
  signal?: AbortSignal;
  formDataCtor?: UploadMultipartOptions['formDataCtor'];
};

export async function uploadToCloudinaryUnsigned(
  options: CloudinaryUnsignedUploadOptions,
): Promise<CloudinaryUploadResult> {
  const fields: UploadFields = {
    upload_preset: options.uploadPreset,
    ...createCommonCloudinaryFields(options),
    ...options.extraFields,
  };

  const uploadOptions: UploadMultipartOptions = {
    assets: options.asset,
    fields,
    fileFieldName: 'file',
    parseResponse: 'json',
  };

  if (options.fetchImpl) {
    uploadOptions.fetchImpl = options.fetchImpl;
  }
  if (options.signal) {
    uploadOptions.signal = options.signal;
  }
  if (options.formDataCtor) {
    uploadOptions.formDataCtor = options.formDataCtor;
  }

  const result = await uploadMultipart<CloudinaryUploadResponse>(buildCloudinaryUploadUrl(options), uploadOptions);

  return normalizeCloudinaryResult(result.response);
}

export async function uploadToCloudinarySigned(
  options: CloudinarySignedUploadOptions,
): Promise<CloudinaryUploadResult> {
  const fields: UploadFields = {
    api_key: options.apiKey,
    signature: options.signature,
    timestamp: options.timestamp,
    ...createCommonCloudinaryFields(options),
    ...options.extraFields,
  };

  const uploadOptions: UploadMultipartOptions = {
    assets: options.asset,
    fields,
    fileFieldName: 'file',
    parseResponse: 'json',
  };

  if (options.fetchImpl) {
    uploadOptions.fetchImpl = options.fetchImpl;
  }
  if (options.signal) {
    uploadOptions.signal = options.signal;
  }
  if (options.formDataCtor) {
    uploadOptions.formDataCtor = options.formDataCtor;
  }

  const result = await uploadMultipart<CloudinaryUploadResponse>(buildCloudinaryUploadUrl(options), uploadOptions);

  return normalizeCloudinaryResult(result.response);
}

export function buildCloudinaryUploadUrl(options: {
  cloudName: string;
  resourceType?: CloudinaryResourceType;
}): string {
  const resourceType = options.resourceType ?? 'image';
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(options.cloudName)}/${resourceType}/upload`;
}

function createCommonCloudinaryFields(options: {
  folder?: string;
  publicId?: string;
  tags?: readonly string[];
  context?: Record<string, string>;
}): UploadFields {
  const fields: UploadFields = {};

  if (options.folder) {
    fields.folder = options.folder;
  }

  if (options.publicId) {
    fields.public_id = options.publicId;
  }

  if (options.tags && options.tags.length > 0) {
    fields.tags = options.tags.join(',');
  }

  if (options.context && Object.keys(options.context).length > 0) {
    fields.context = Object.entries(options.context)
      .map(([key, value]) => `${key}=${value}`)
      .join('|');
  }

  return fields;
}

function normalizeCloudinaryResult(response: CloudinaryUploadResponse): CloudinaryUploadResult {
  const secureUrl = response.secure_url ?? response.url;
  if (!secureUrl || !response.public_id) {
    throw new Error('Cloudinary response is missing secure_url/url or public_id.');
  }

  const result: CloudinaryUploadResult = {
    secureUrl,
    publicId: response.public_id,
    resourceType: response.resource_type ?? 'image',
    raw: response,
  };

  if (response.format) {
    result.format = response.format;
  }

  if (typeof response.width === 'number') {
    result.width = response.width;
  }

  if (typeof response.height === 'number') {
    result.height = response.height;
  }

  if (typeof response.bytes === 'number') {
    result.bytes = response.bytes;
  }

  return result;
}
