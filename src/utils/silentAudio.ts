// Silent Audio Utility for iOS WebAudio Mute Switch Workaround
// This creates a minimal silent audio file to force WebAudio onto the media channel

export const createSilentAudioBlob = (): string => {
  // Create a minimal WAV file with 1 second of silence
  const arrayBuffer = new ArrayBuffer(44 + 48000 * 2); // Header + 1 second at 48kHz 16-bit
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  const writeUint32 = (offset: number, value: number) => {
    view.setUint32(offset, value, true);
  };
  
  const writeUint16 = (offset: number, value: number) => {
    view.setUint16(offset, value, true);
  };
  
  writeString(0, 'RIFF');
  writeUint32(4, 36 + 48000 * 2); // File size - 8
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  writeUint32(16, 16); // Subchunk1Size
  writeUint16(20, 1); // AudioFormat (PCM)
  writeUint16(22, 1); // NumChannels (Mono)
  writeUint32(24, 48000); // SampleRate
  writeUint32(28, 48000 * 2); // ByteRate
  writeUint16(32, 2); // BlockAlign
  writeUint16(34, 16); // BitsPerSample
  writeString(36, 'data');
  writeUint32(40, 48000 * 2); // Subchunk2Size
  
  // Data is already zeros (silence)
  
  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

export const createSilentAudioDataURL = (): string => {
  // Minimal silent MP3 (about 1 second)
  return 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAAHNIYU1wAAADIFVuc3BlYWtlciAzLjAuMS4wAAAAAAAAAAAAAAA/+MsxAADwRmkQAP9AIQFPaRiQAUIgIgBAoFgAADgoOBkIERo9IRHAgIBAcCAYFB4xEQRVUfKwMGw8u8DjQUzRrZcK7Y/8AAA/+MsxAEDsQGkQAP9AIgB4OwQRRAKEoGGXAQFyACBcFAEB4lQxBIUK/V/IYqP/AA==';
};

export const setupSilentAudioForWebAudio = (): HTMLAudioElement | null => {
  try {
    const audio = new Audio();
    
    // Critical iOS attributes
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.setAttribute('x-webkit-airplay', 'allow');
    
    // Must be looped and silent
    audio.loop = true;
    audio.volume = 0;
    audio.muted = false; // Must be unmuted to establish media channel
    audio.preload = 'auto';
    
    // Use minimal silent audio
    audio.src = createSilentAudioDataURL();
    
    console.log('[SilentAudio] Created silent audio element for WebAudio channel forcing');
    
    return audio;
  } catch (error) {
    console.error('[SilentAudio] Failed to create silent audio:', error);
    return null;
  }
};

export const startSilentAudio = async (silentAudio: HTMLAudioElement): Promise<boolean> => {
  try {
    await silentAudio.play();
    console.log('[SilentAudio] Silent audio started - WebAudio should now use media channel');
    return true;
  } catch (error) {
    console.warn('[SilentAudio] Failed to start silent audio:', error);
    return false;
  }
};