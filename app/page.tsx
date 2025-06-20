'use client';

import { useEffect, useState } from 'react';
import AvatarStream from '@/components/AvatarStream';

export default function Page() {
  const [session, setSession] = useState<{
    heygenEndpoint: string;
    sessionToken: string;
    sessionId: string;
  }|null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[PAGE] Fetching streaming session');
    fetch('/api/streaming-session')
      .then(async res => {
        console.log(`[PAGE] API response status: ${res.status}`);
        const data = await res.json();
        console.log('[PAGE] API response data:', data);
        return data;
      })
      .then(data => {
        if (data.heygenEndpoint && data.sessionToken && data.sessionId) {
          console.log('[PAGE] Valid session received');
          setSession({
            heygenEndpoint: data.heygenEndpoint,
            sessionToken: data.sessionToken,
            sessionId: data.sessionId
          });
        } else {
          console.error('[PAGE] Invalid Heygen session:', data);
          setError(data.error || 'Invalid session configuration');
        }
      })
      .catch(error => {
        console.error('[PAGE] Fetch error:', error);
        setError(error.message);
      });
  }, []);

  if (error) {
    return (
      <div className="text-center mt-10 text-red-500 p-4 border border-red-200 bg-red-50 rounded-lg max-w-md mx-auto">
        <h2 className="text-xl font-bold">Connection Error</h2>
        <p className="mt-2">{error}</p>
        <p className="text-sm mt-4">Check browser console and server logs for details</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center mt-10 text-gray-600">
        <p>🔄 Starting Heygen session...</p>
        <div className="mt-4 inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <AvatarStream
        heygenEndpoint={session.heygenEndpoint}
        sessionToken={session.sessionToken}
        sessionId={session.sessionId}
      />
    </main>
  );
}