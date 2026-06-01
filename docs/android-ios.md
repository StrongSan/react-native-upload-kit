# Android and iOS Troubleshooting

## `Network request failed`

Common causes:

- The API URL points to `localhost` from the device. Use your machine IP, emulator host alias, tunnel, or production API host.
- The server rejects large request bodies.
- TLS certificates are invalid or blocked by platform network security settings.
- The request set `Content-Type: multipart/form-data` manually and lost the boundary.

## `content://` and `file://`

React Native upload file objects usually look like this:

```ts
{
  uri: asset.uri,
  name: asset.fileName ?? 'upload.jpg',
  type: asset.type ?? 'image/jpeg',
}
```

Both `content://` and `file://` URIs can be valid depending on the picker and platform. This package keeps the URI unchanged and focuses on stable file metadata.

## Missing File Name

Some pickers return a URI but no file name. `normalizeUploadAsset` infers a name from the URI when possible and falls back to `upload.jpg`.

## Multiple Image Fields

If your backend receives only the last image, try indexed fields:

```ts
await uploadMultipart('/api/posts', {
  assets,
  fileFieldName: 'images',
  fileFieldStyle: 'indexed',
});
```

Then read `images_0`, `images_1`, and later fields on the backend.
