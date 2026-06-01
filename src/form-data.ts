import { normalizeUploadAssets } from './asset';
import type { NormalizedUploadAsset, UploadAssetInput, UploadFields } from './types';

export type MultipartFileFieldStyle = 'repeat' | 'brackets' | 'indexed';

export type FormDataLike = {
  append(name: string, value: unknown, fileName?: string): void;
};

export type FormDataConstructorLike = new () => FormDataLike;

export type CreateMultipartFormDataOptions = {
  fields?: UploadFields;
  fileFieldName?: string;
  fileFieldStyle?: MultipartFileFieldStyle;
  formDataCtor?: FormDataConstructorLike;
  skipNullishFields?: boolean;
};

export function createMultipartFormData(
  assets: UploadAssetInput | readonly UploadAssetInput[],
  options: CreateMultipartFormDataOptions = {},
): FormDataLike {
  const FormDataCtor = options.formDataCtor ?? getGlobalFormDataCtor();
  const formData = new FormDataCtor();

  appendFields(formData, options.fields, options.skipNullishFields ?? true);

  const normalizedAssets = normalizeUploadAssets(assets);
  const fileFieldName = options.fileFieldName ?? 'file';
  const fileFieldStyle = options.fileFieldStyle ?? 'repeat';

  normalizedAssets.forEach((asset, index) => {
    formData.append(resolveFileFieldName(fileFieldName, index, fileFieldStyle), toMultipartFile(asset));
  });

  return formData;
}

export function resolveFileFieldName(
  fileFieldName: string,
  index: number,
  style: MultipartFileFieldStyle = 'repeat',
): string {
  if (style === 'indexed') {
    return `${fileFieldName}_${index}`;
  }

  if (style === 'brackets') {
    return `${fileFieldName}[]`;
  }

  return fileFieldName;
}

export function toMultipartFile(asset: NormalizedUploadAsset): { uri: string; name: string; type: string } {
  return {
    uri: asset.uri,
    name: asset.name,
    type: asset.type,
  };
}

function appendFields(formData: FormDataLike, fields: UploadFields | undefined, skipNullish: boolean): void {
  if (!fields) {
    return;
  }

  Object.entries(fields).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    values.forEach((item) => {
      if (skipNullish && (item === null || item === undefined)) {
        return;
      }

      formData.append(key, stringifyFieldValue(item));
    });
  });
}

function stringifyFieldValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function getGlobalFormDataCtor(): FormDataConstructorLike {
  const FormDataCtor = globalThis.FormData as unknown as FormDataConstructorLike | undefined;
  if (!FormDataCtor) {
    throw new Error('FormData is not available. Pass formDataCtor in non-React Native runtimes.');
  }

  return FormDataCtor;
}
