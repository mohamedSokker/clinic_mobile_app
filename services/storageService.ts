import api from '@/lib/api';
import * as FileSystem from 'expo-file-system/legacy';

export async function uploadFile(
  localUri: string,
  path: string,
  fileName: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    const formData: any = new FormData();
    formData.append('file', {
      uri: localUri,
      name: fileName,
      type: mimeType,
    });

    const response = await api.post('/upload-service/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // The backend returns a relative path like /uploads/filename
    // We combine it with the API base URL to get a full CDN-like link
    const baseUrl = api.defaults.baseURL || '';
    return `${baseUrl}${response.data.url}`;
  } catch (err: any) {
    console.error('Backend Upload Error:', err?.response?.data || err.message);
    throw new Error('Failed to upload file to server');
  }
}

export async function uploadProfilePhoto(userId: string, localUri: string): Promise<string> {
  const fileName = `profile_${userId}_${Date.now()}.jpg`;
  return uploadFile(localUri, `profile-photos`, fileName, 'image/jpeg');
}

export async function uploadAnalysisFile(
  patientId: string,
  labId: string,
  localUri: string,
  fileType: 'pdf' | 'image',
  fileName: string
): Promise<string> {
  const mimeType = fileType === 'pdf' ? 'application/pdf' : 'image/jpeg';
  const safeFileName = `${labId}_${patientId}_${Date.now()}_${fileName}`;
  return uploadFile(localUri, `analysis/${patientId}`, safeFileName, mimeType);
}

export async function deleteFile(downloadURL: string): Promise<void> {
  // Local deletion logic can be added here if needed
  console.log('File deletion requested for local storage:', downloadURL);
}
