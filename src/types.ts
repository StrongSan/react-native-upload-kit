export type UploadPrimitive = string | number | boolean | null | undefined;

export type UploadFieldValue = UploadPrimitive | Date | UploadPrimitive[] | Date[];

export type UploadFields = Record<string, UploadFieldValue>;

export type UploadAssetInput = {
  uri?: string | null;
  name?: string | null;
  fileName?: string | null;
  type?: string | null;
  mimeType?: string | null;
  size?: number | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
};

export type NormalizedUploadAsset = {
  uri: string;
  name: string;
  type: string;
  size?: number;
  width?: number;
  height?: number;
};

export type ReactNativeUploadFile = {
  uri: string;
  name: string;
  type: string;
};

export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  statusText?: string;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

export class UploadKitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadKitError';
  }
}

export class UploadHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly responseText: string;

  constructor(status: number, statusText: string, responseText: string) {
    super(`Upload request failed with ${status}${statusText ? ` ${statusText}` : ''}`);
    this.name = 'UploadHttpError';
    this.status = status;
    this.statusText = statusText;
    this.responseText = responseText;
  }
}
