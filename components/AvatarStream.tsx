// components/AvatarStream.tsx
'use client';

import { cleanEnvVar } from '@/lib/cleanEnvVar';
import { HeygenEmotion } from '@/lib/heygenTypes';
import { useEffect, useRef } from 'react';
import StreamingAvatar, { 
  StreamingEvents, 
  TaskType, 
  AvatarQuality,
  VoiceEmotion 
} from '@heygen/streaming-avatar';


export type AvatarStreamProps = {
  heygenEndpoint: string;
  sessionToken: string;
  sessionId: string;
};

export default function AvatarStream({ heygenEndpoint, sessionToken, sessionId, }: AvatarStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<StreamingAvatar | null>(null);

  useEffect(() => {
    console.log('[CLIENT] Initializing AvatarStream with:', {
      heygenEndpoint,
      sessionId,
      sessionToken: sessionToken.slice(0, 10) + '...'
    });

    const config = {
      token: sessionToken,
      connection: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ]
      }
    };

    console.log('[CLIENT] Creating StreamingAvatar instance');
    const avatar = new StreamingAvatar({
      token: sessionToken,
      basePath: heygenEndpoint,      // use realtime_endpoint here
    });
    avatarRef.current = avatar;

    avatar.on(StreamingEvents.STREAM_READY, (evt) => {
      console.log('[CLIENT] STREAM_READY event:', evt);
      if (evt.detail.stream && videoRef.current) {
        console.log('[CLIENT] Setting video source');
        videoRef.current.srcObject = evt.detail.stream;
        
        // Move speak logic here since AVATAR_READY isn't available
        console.log('[CLIENT] Avatar should be ready now');
        const speakText = 'Hello Jayant! Welcome to our streaming experience.';
        console.log('[CLIENT] Speaking:', speakText);
        avatar.speak({
          text: speakText,
          taskType: TaskType.TALK,
        }).catch(err => {
          console.error('[CLIENT] Speak error:', err);
        });
      }
    });

    avatar.on(StreamingEvents.STREAM_DISCONNECTED, (evt) => {
      console.error('[CLIENT] STREAM_DISCONNECTED:', evt);
    });

    // Generic error handling (not using ERROR event)
    const handleError = (error: Error) => {
      console.error('[CLIENT] Avatar error:', error);
    };

    const avatarConfig = {
      avatarName: cleanEnvVar(process.env.NEXT_PUBLIC_AVATAR_ID),
      voice: {
        voiceId: cleanEnvVar(process.env.NEXT_PUBLIC_VOICE_ID),
        emotion: VoiceEmotion.SOOTHING,
        rate: 1,
      },
      quality: AvatarQuality.High,
    };

    console.log('[CLIENT] Creating avatar with config:', avatarConfig);

    // Use enum values for emotions :cite[1]
    avatar.createStartAvatar(avatarConfig)
      .then(() => {
        console.log('[CLIENT] Avatar created successfully');
        const speakText = 'Hello Jayant! Welcome to our streaming experience.';
        console.log('[CLIENT] Speaking:', speakText);
        avatar.speak({
          text: speakText,
          taskType: TaskType.TALK,
        });
      })
      .catch(error => {
        console.error('[CLIENT] Avatar initialization failed:', error);
      });

    return () => {
      console.log('[CLIENT] Cleaning up avatar');
      avatar.stopAvatar();
    };
  }, [heygenEndpoint, sessionToken, sessionId]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="rounded-2xl shadow-lg w-full max-w-md"
        onError={(e) => console.error('[CLIENT] Video error:', e)}
      />
      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
        Status: Streaming
      </div>
    </div>
  );
}