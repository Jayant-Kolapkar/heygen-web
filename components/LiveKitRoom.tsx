'use client';

import { LiveKitRoom } from '@livekit/components-react';

interface Props {
  token: string;
  serverUrl: string;
  participantName: string;
}

export default function Room({ token, serverUrl, participantName }: Props) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      data-lk-theme="default"
      style={{ height: '100vh' }}
    >
      <h2>Welcome {participantName} 👋</h2>
      <p>You're now connected to the LiveKit room!</p>
    </LiveKitRoom>
  );
}
