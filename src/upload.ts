import { createMultipartFormData, type CreateMultipartFormDataOptions, type FormDataLike } from './form-data';
import type { FetchLike, UploadAssetInput } from './types';
import { UploadHttpError, UploadKitError } from './types';

export type UploadMultipartOptions = Omit<CreateMultipartFormDataOptions, 'formDataCtor'> & {
  assets: UploadAssetInput | readonly UploadAssetInput[];
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  fetchImpl?: FetchLike;
  signal?: AbortSignal;
  parseResponse?: 'json' | 'text' | 'none';
  formDataCtor?: CreateMultipartFormDataOptions['formDataCtor'];
  keepContentTypeHeader?: boolean;
};

export type UploadMultipartResult<T = unknown> = {
  response: T;
  formData: FormDataLike;
};

export async function uploadMultipart<T = unknown>(
  url: string,
  options: UploadMultipartOptions,
): Promise<UploadMultipartResult<T>> {
  const fetchImpl = options.fetchImpl ?? getGlobalFetch();
  const formOptions: CreateMultipartFormDataOptions = {};
  if (options.fields) {
    formOptions.fields = options.fields;
  }
  if (options.fileFieldName) {
    formOptions.fileFieldName = options.fileFieldName;
  }
  if (options.fileFieldStyle) {
    formOptions.fileFieldStyle = options.fileFieldStyle;
  }
  if (options.formDataCtor) {
    formOptions.formDataCtor = options.formDataCtor;
  }
  if (options.skipNullishFields !== undefined) {
    formOptions.skipNullishFields = options.skipNullishFields;
  }

  const formData = createMultipartFormData(options.assets, formOptions);
  const headers = normalizeHeaders(options.headers, options.keepContentTypeHeader ?? false);
  const init: NonNullable<Parameters<FetchLike>[1]> = {
    method: options.method ?? 'POST',
    body: formData,
  };

  if (headers) {
    init.headers = headers;
  }

  if (options.signal) {
    init.signal = options.signal;
  }

  const response = await fetchImpl(url, init);

  if (!response.ok) {
    throw new UploadHttpError(response.status, response.statusText ?? '', await safeReadText(response));
  }

  const parseResponse = options.parseResponse ?? 'json';
  if (parseResponse === 'none') {
    return {
      response: undefined as T,
      formData,
    };
  }

  if (parseResponse === 'text') {
    return {
      response: (await response.text()) as T,
      formData,
    };
  }

  return {
    response: (await response.json()) as T,
    formData,
  };
}

export function normalizeHeaders(
  headers: Record<string, string> | undefined,
  keepContentTypeHeader = false,
): Record<string, string> | undefined {
  if (!headers) {
    return undefined;
  }

  const normalized: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (!keepContentTypeHeader && key.toLowerCase() === 'content-type') {
      return;
    }

    normalized[key] = value;
  });

  return normalized;
}

async function safeReadText(response: { text: () => Promise<string> }): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function getGlobalFetch(): FetchLike {
  const fetchImpl = globalThis.fetch as unknown as FetchLike | undefined;
  if (!fetchImpl) {
    throw new UploadKitError('fetch is not available. Pass fetchImpl to uploadMultipart.');
  }

  return fetchImpl;
}
