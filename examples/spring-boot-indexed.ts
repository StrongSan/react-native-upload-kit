import { launchImageLibrary } from 'react-native-image-picker';
import { uploadMultipart } from 'react-native-upload-kit';

export async function pickAndUploadImages(accessToken: string) {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 5,
  });

  const assets = result.assets?.filter((asset) => asset.uri) ?? [];
  if (assets.length === 0) {
    return null;
  }

  return uploadMultipart<{ imageUrls: string[] }>('https://api.example.com/posts', {
    assets,
    fields: {
      title: 'New post',
    },
    fileFieldName: 'images',
    fileFieldStyle: 'indexed',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
