/**
 * Mock de expo-image-manipulator para desenvolvimento em container Docker.
 * Simula compressão/redimensionamento de imagem.
 */

export interface ManipulateResult {
  uri: string;
  width: number;
  height: number;
}

export interface Action {
  resize?: { width?: number; height?: number };
  rotate?: number;
  flip?: { vertical?: boolean; horizontal?: boolean };
  crop?: { originX: number; originY: number; width: number; height: number };
}

export interface SaveOptions {
  compress?: number;
  format?: 'jpeg' | 'png';
  base64?: boolean;
}

export async function manipulateAsync(
  uri: string,
  actions: Action[] = [],
  saveOptions: SaveOptions = {}
): Promise<ManipulateResult> {
  console.log('[MOCK] expo-image-manipulator: manipulateAsync', {
    uri,
    actions,
    saveOptions,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    uri: 'file:///mock/compressed-photo.jpg',
    width: 1024,
    height: 768,
  };
}
