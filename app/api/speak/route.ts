// app/api/speak/route.ts
import { NextResponse } from 'next/server';
import { cleanEnvVar } from '@/lib/cleanEnvVar';

export async function POST() {
  const API_KEY = cleanEnvVar(process.env.NEXT_PUBLIC_HEYGEN_API_KEY!);
  const AVATAR_ID = cleanEnvVar(process.env.NEXT_PUBLIC_AVATAR_ID!);
  const VOICE_ID = cleanEnvVar(process.env.NEXT_PUBLIC_VOICE_ID!);


  const res = await fetch('https://api.heygen.com/v1/streaming.new', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      avatar_id: AVATAR_ID,
      voice: VOICE_ID
    })
  });
  
  const { room, token: lkToken } = JSON.parse(await res.text());
  const session = await res.json();
  const { session_id, url, access_token } = session;

  // Start the LiveKit stream
  await fetch('https://api.heygen.com/v1/streaming.start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ session_id })
  });

  return NextResponse.json({ session_id, url, sessionToken: access_token });
}
