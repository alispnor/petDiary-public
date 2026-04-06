/**
 * Mock de expo-av para desenvolvimento em container Docker.
 * Simula gravação e reprodução de áudio/vídeo.
 */

export class Audio {
  static async requestPermissionsAsync() {
    console.log('[MOCK] expo-av: Audio.requestPermissionsAsync');
    return { status: 'granted' as const, granted: true };
  }

  static async setAudioModeAsync(mode: Record<string, unknown>) {
    console.log('[MOCK] expo-av: Audio.setAudioModeAsync', mode);
  }
}

export class Sound {
  private isLoaded = false;

  async loadAsync(source: { uri: string }) {
    console.log('[MOCK] expo-av: Sound.loadAsync', source.uri);
    this.isLoaded = true;
  }

  async playAsync() {
    console.log('[MOCK] expo-av: Sound.playAsync');
  }

  async stopAsync() {
    console.log('[MOCK] expo-av: Sound.stopAsync');
  }

  async unloadAsync() {
    console.log('[MOCK] expo-av: Sound.unloadAsync');
    this.isLoaded = false;
  }
}

export class Video {
  static RESIZE_MODE_CONTAIN = 'contain';
  static RESIZE_MODE_COVER = 'cover';
}
