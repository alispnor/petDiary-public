import api from '../services/api';
import {
  launchCameraAsync,
  requestCameraPermissionsAsync,
} from '../mocks/expoImagePicker';
import { manipulateAsync } from '../mocks/expoImageManipulator';
import type { PresignedUrlResponse, DocumentProcessResponse } from '../types';

/**
 * Fluxo completo de captura e upload de documento veterinário.
 *
 * 1. Solicita permissão e captura foto via câmera
 * 2. Comprime a imagem para otimizar upload
 * 3. Solicita URL pré-assinada ao backend
 * 4. Faz upload direto para o storage (S3/GCS)
 * 5. Notifica a API para processamento via IA
 */
export async function handleDocumentCapture(
  petId: string
): Promise<DocumentProcessResponse> {
  // 1. Permissão + Captura
  const permission = await requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Permissão de câmera negada');
  }

  const pickerResult = await launchCameraAsync();
  if (pickerResult.canceled || !pickerResult.assets?.length) {
    throw new Error('Captura cancelada pelo usuário');
  }

  const originalUri = pickerResult.assets[0].uri;
  console.log('[handleDocumentCapture] Foto capturada:', originalUri);

  // 2. Compressão
  const compressed = await manipulateAsync(
    originalUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: 'jpeg' }
  );
  console.log('[handleDocumentCapture] Imagem comprimida:', compressed.uri);

  // 3. Solicitar URL pré-assinada
  const { data: presigned } = await api.post<PresignedUrlResponse>(
    '/api/v1/uploads/generate-presigned-url/',
    {
      petId,
      contentType: 'image/jpeg',
      fileName: `doc-${Date.now()}.jpg`,
    }
  );
  console.log('[handleDocumentCapture] URL pré-assinada obtida:', presigned.fileKey);

  // 4. Upload direto para storage via PUT na URL pré-assinada
  // Em produção, usaria fetch/axios com o arquivo real
  await api.put(presigned.uploadUrl, 'mock-binary-data', {
    headers: {
      'Content-Type': 'image/jpeg',
    },
  });
  console.log('[handleDocumentCapture] Upload concluído');

  // 5. Notificar API para processamento IA
  const { data: processResult } = await api.post<DocumentProcessResponse>(
    '/api/v1/ai/process-document/',
    {
      petId,
      fileKey: presigned.fileKey,
      documentType: 'veterinary',
    }
  );
  console.log('[handleDocumentCapture] Processamento iniciado:', processResult.id);

  return processResult;
}
