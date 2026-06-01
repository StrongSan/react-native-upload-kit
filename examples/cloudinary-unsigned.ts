import { launchImageLibrary } from 'react-native-image-picker';
import { uploadToCloudinaryUnsigned } from 'react-native-upload-kit';

export async function pickAndUploadToCloudinary() {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.9,
  });

  const asset = result.assets?.[0];
  if (!asset?.uri) {
    return null;
  }

  return uploadToCloudinaryUnsigned({
    cloudName: 'your-cloud-name',
    uploadPreset: 'your-unsigned-preset',
    asset,
    folder: 'mobile',
  });
}
