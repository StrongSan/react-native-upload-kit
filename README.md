# react-native-upload-kit

TypeScript utilities for safe image and multipart uploads in React Native.

`react-native-upload-kit` helps React Native apps turn image picker assets into predictable multipart requests for Cloudinary, Spring Boot, Express, NestJS, Rails, and other APIs. It focuses on the small upload details that often break on mobile: file names, MIME types, field names, `FormData`, and `Content-Type` handling.

## Features

- Normalize `react-native-image-picker` style assets into `{ uri, name, type }` files.
- Validate file size and MIME type before uploading.
- Build multipart `FormData` with repeated, bracketed, or indexed file fields.
- Upload to generic APIs without accidentally setting a broken multipart boundary.
- Upload to Cloudinary unsigned or signed upload endpoints.
- Works as plain TypeScript with no native module dependency.

## Installation

```sh
npm install react-native-upload-kit
```

This package does not choose images for you. Pair it with a picker such as `react-native-image-picker`, `expo-image-picker`, or your own file source.

## Quick Start

```ts
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadMultipart } from 'react-native-upload-kit';

const result = await launchImageLibrary({
  mediaType: 'photo',
  quality: 0.9,
});

const asset = result.assets?.[0];
if (!asset?.uri) {
  return;
}

const upload = await uploadMultipart<{ imageUrl: string }>('https://api.example.com/images', {
  assets: asset,
  fileFieldName: 'image',
  fields: {
    folder: 'profile',
  },
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

console.log(upload.response.imageUrl);
```

Do not set `Content-Type: multipart/form-data` yourself unless your runtime explicitly requires it. React Native needs to add the multipart boundary.

## Multiple Images

Some backends expect repeated fields:

```ts
createMultipartFormData(assets, {
  fileFieldName: 'images',
  fileFieldStyle: 'repeat',
});
```

Some expect bracket fields:

```ts
createMultipartFormData(assets, {
  fileFieldName: 'images',
  fileFieldStyle: 'brackets',
});
```

Some Spring multipart endpoints are easiest to bind with indexed fields:

```ts
createMultipartFormData(assets, {
  fileFieldName: 'images',
  fileFieldStyle: 'indexed',
});
```

That produces `images_0`, `images_1`, `images_2`, and so on.

## Cloudinary Unsigned Upload

```ts
import { uploadToCloudinaryUnsigned } from 'react-native-upload-kit';

const image = await uploadToCloudinaryUnsigned({
  cloudName: 'demo',
  uploadPreset: 'mobile_unsigned_upload',
  asset,
  folder: 'avatars',
  tags: ['mobile'],
});

console.log(image.secureUrl);
```

## Cloudinary Signed Upload

Never put your Cloudinary API secret in a mobile app. Generate the signature on your server, then pass the signed fields to the client:

```ts
import { uploadToCloudinarySigned } from 'react-native-upload-kit';

const signature = await fetch('https://api.example.com/cloudinary/sign', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
}).then((response) => response.json());

const image = await uploadToCloudinarySigned({
  cloudName: signature.cloudName,
  apiKey: signature.apiKey,
  timestamp: signature.timestamp,
  signature: signature.signature,
  asset,
  folder: 'orders',
});
```

See [docs/cloudinary.md](docs/cloudinary.md).

## API

### `normalizeUploadAsset(asset, options?)`

Converts a picker asset into a stable upload asset.

```ts
const file = normalizeUploadAsset({
  uri: 'file:///tmp/photo.jpg',
  fileName: 'photo.jpg',
  type: 'image/jpeg',
});
```

### `validateUploadAsset(asset, options?)`

Checks MIME type and file size.

```ts
const result = validateUploadAsset(asset, {
  maxBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/*'],
});
```

### `createMultipartFormData(assets, options?)`

Builds a React Native compatible `FormData`.

```ts
const formData = createMultipartFormData(assets, {
  fields: { title: 'New post' },
  fileFieldName: 'images',
  fileFieldStyle: 'indexed',
});
```

### `uploadMultipart(url, options)`

Sends a multipart request with `fetch`.

```ts
const { response } = await uploadMultipart('/api/upload', {
  assets,
  headers: { Authorization: `Bearer ${token}` },
});
```

### `uploadToCloudinaryUnsigned(options)`

Uploads a single asset to a Cloudinary unsigned upload preset.

### `uploadToCloudinarySigned(options)`

Uploads a single asset with a server-generated Cloudinary signature.

## Documentation

- [Cloudinary uploads](docs/cloudinary.md)
- [Spring Boot multipart APIs](docs/spring-boot.md)
- [Android and iOS troubleshooting](docs/android-ios.md)

## Status

This project is in early development. The public API is intentionally small while the package collects real-world upload cases from React Native apps.

## License

MIT
