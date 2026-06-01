import { describe, expect, it, vi } from 'vitest';
import {
  buildCloudinaryUploadUrl,
  createMultipartFormData,
  normalizeHeaders,
  normalizeUploadAsset,
  resolveFileFieldName,
  uploadMultipart,
  uploadToCloudinaryUnsigned,
  validateUploadAsset,
} from '..';

class MockFormData {
  entries: Array<{ name: string; value: unknown; fileName?: string }> = [];

  append(name: string, value: unknown, fileName?: string): void {
    if (fileName !== undefined) {
      this.entries.push({ name, value, fileName });
      return;
    }

    this.entries.push({ name, value });
  }
}

describe('normalizeUploadAsset', () => {
  it('normalizes a react-native-image-picker style asset', () => {
    const asset = normalizeUploadAsset({
      uri: 'file:///tmp/photo.png',
      fileName: 'photo.png',
      type: 'image/png',
      fileSize: 2048,
      width: 300,
      height: 200,
    });

    expect(asset).toEqual({
      uri: 'file:///tmp/photo.png',
      name: 'photo.png',
      type: 'image/png',
      size: 2048,
      width: 300,
      height: 200,
    });
  });

  it('infers file name and mime type from a uri', () => {
    const asset = normalizeUploadAsset({
      uri: 'content://media/external/images/12345.webp?token=abc',
    });

    expect(asset.name).toBe('12345.webp');
    expect(asset.type).toBe('image/webp');
  });

  it('adds a safe fallback extension when the file name has no extension', () => {
    const asset = normalizeUploadAsset({
      uri: 'file:///tmp/raw-upload',
      type: 'image/jpeg',
    });

    expect(asset.name).toBe('raw-upload.jpg');
  });
});

describe('validateUploadAsset', () => {
  it('reports unsupported mime types and size limits', () => {
    const result = validateUploadAsset(
      {
        uri: 'file:///tmp/video.mp4',
        fileName: 'video.mp4',
        type: 'video/mp4',
        fileSize: 10_000,
      },
      {
        maxBytes: 1_000,
        allowedMimeTypes: ['image/*'],
      },
    );

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(['file_too_large', 'unsupported_mime_type']);
  });
});

describe('createMultipartFormData', () => {
  it('builds indexed file fields for Spring-style multipart APIs', () => {
    const formData = createMultipartFormData(
      [
        { uri: 'file:///tmp/a.jpg', fileName: 'a.jpg', type: 'image/jpeg' },
        { uri: 'file:///tmp/b.png', fileName: 'b.png', type: 'image/png' },
      ],
      {
        fields: {
          title: 'Example',
          published: true,
          skipped: undefined,
        },
        fileFieldName: 'images',
        fileFieldStyle: 'indexed',
        formDataCtor: MockFormData,
      },
    ) as MockFormData;

    expect(formData.entries).toEqual([
      { name: 'title', value: 'Example' },
      { name: 'published', value: 'true' },
      {
        name: 'images_0',
        value: { uri: 'file:///tmp/a.jpg', name: 'a.jpg', type: 'image/jpeg' },
      },
      {
        name: 'images_1',
        value: { uri: 'file:///tmp/b.png', name: 'b.png', type: 'image/png' },
      },
    ]);
  });

  it('supports repeat and bracket file field names', () => {
    expect(resolveFileFieldName('images', 0, 'repeat')).toBe('images');
    expect(resolveFileFieldName('images', 0, 'brackets')).toBe('images[]');
    expect(resolveFileFieldName('images', 2, 'indexed')).toBe('images_2');
  });
});

describe('uploadMultipart', () => {
  it('does not forward Content-Type unless explicitly requested', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => '',
    }));

    const result = await uploadMultipart<{ ok: boolean }>('https://api.example.test/upload', {
      assets: { uri: 'file:///tmp/a.jpg', fileName: 'a.jpg', type: 'image/jpeg' },
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'multipart/form-data',
      },
      fetchImpl,
      formDataCtor: MockFormData,
    });

    expect(result.response.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example.test/upload',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
        },
      }),
    );
  });

  it('normalizes headers independently', () => {
    expect(
      normalizeHeaders({
        Accept: 'application/json',
        'content-type': 'multipart/form-data',
      }),
    ).toEqual({
      Accept: 'application/json',
    });
  });
});

describe('cloudinary helpers', () => {
  it('builds cloudinary upload urls', () => {
    expect(buildCloudinaryUploadUrl({ cloudName: 'demo', resourceType: 'image' })).toBe(
      'https://api.cloudinary.com/v1_1/demo/image/upload',
    );
  });

  it('uploads with unsigned preset fields', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        public_id: 'sample',
        resource_type: 'image',
        format: 'jpg',
        width: 100,
        height: 100,
        bytes: 2048,
      }),
      text: async () => '',
    }));

    const result = await uploadToCloudinaryUnsigned({
      cloudName: 'demo',
      uploadPreset: 'unsigned-demo',
      asset: { uri: 'file:///tmp/sample.jpg', fileName: 'sample.jpg', type: 'image/jpeg' },
      folder: 'uploads',
      tags: ['react-native', 'test'],
      fetchImpl,
      formDataCtor: MockFormData,
    });

    expect(result.secureUrl).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg');
    expect(result.publicId).toBe('sample');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/demo/image/upload',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });
});
