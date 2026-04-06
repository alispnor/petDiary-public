/**
 * Mock de expo-image-picker para desenvolvimento em container Docker.
 * Simula a captura de imagem retornando um URI fictício.
 */

export interface ImagePickerResult {
  canceled: boolean;
  assets?: Array<{
    uri: string;
    width: number;
    height: number;
    type?: 'image' | 'video';
    fileName?: string;
    fileSize?: number;
  }>;
}

export async function launchCameraAsync(): Promise<ImagePickerResult> {
  console.log('[MOCK] expo-image-picker: launchCameraAsync chamado');

  // Simula delay de câmera
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    canceled: false,
    assets: [
      {
        uri: 'file:///mock/captured-photo.jpg',
        width: 4032,
        height: 3024,
        type: 'image',
        fileName: 'captured-photo.jpg',
        fileSize: 2_500_000,
      },
    ],
  };
}

export async function requestCameraPermissionsAsync() {
  console.log('[MOCK] expo-image-picker: requestCameraPermissionsAsync');
  return { status: 'granted' as const, granted: true };
}
