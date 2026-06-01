# Cloudinary Uploads

`react-native-upload-kit` supports unsigned and signed Cloudinary uploads.

## Unsigned Uploads

Unsigned uploads use an upload preset created in Cloudinary. This is convenient for public or low-risk upload flows, but the preset must be locked down in the Cloudinary dashboard.

```ts
import { uploadToCloudinaryUnsigned } from 'react-native-upload-kit';

const result = await uploadToCloudinaryUnsigned({
  cloudName: 'demo',
  uploadPreset: 'mobile_unsigned_upload',
  asset,
  folder: 'uploads',
});

console.log(result.secureUrl);
```

Recommended preset settings:

- Restrict allowed formats.
- Restrict folder or public ID patterns.
- Add moderation or manual review when user-generated content is public.
- Set upload transformations on the preset instead of trusting the client.

## Signed Uploads

Signed uploads are recommended when users upload private, paid, or privileged content.

The mobile app asks your backend for a signature. The backend signs the upload parameters with your Cloudinary API secret. The mobile app never sees the secret.

```ts
import { uploadToCloudinarySigned } from 'react-native-upload-kit';

const signed = await fetch('https://api.example.com/cloudinary/sign', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
}).then((response) => response.json());

const uploaded = await uploadToCloudinarySigned({
  cloudName: signed.cloudName,
  apiKey: signed.apiKey,
  timestamp: signed.timestamp,
  signature: signed.signature,
  asset,
  folder: signed.folder,
});
```

## Common Mistakes

- Do not put `api_secret` in React Native code.
- Do not set `Content-Type` manually for multipart requests unless your runtime explicitly requires it.
- Do not trust client-provided MIME type as your only validation.
- Do not rely on unsigned presets for sensitive user content.
