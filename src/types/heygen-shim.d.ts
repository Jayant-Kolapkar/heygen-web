//src/types/heygen-shim.d.ts
import type { StreamingAvatar } from '@heygen/streaming-avatar';

declare module '@heygen/streaming-avatar/lib/index.d.ts' {
  interface StreamingAvatar {
    startVoiceChat(opts?: {
      useSilencePrompt?: boolean;
      isInputAudioMuted?: boolean;
    }): Promise<void>;
  }
}