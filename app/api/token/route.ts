// app/api/token/route.ts
import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Missing API credentials' }, { status: 500 });
  }

  const roomName = 'demo-room';
  const participantName = 'jayant';

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
  });

  at.addGrant({ roomJoin: true, room: roomName });

  const token = await at.toJwt();
  console.log("🔐 typeof token:", typeof token);
  console.log("🔐 token preview:", token.slice(0, 30));

  return NextResponse.json({
    serverUrl: 'wss://heygen-web-qb1onebf.livekit.cloud',
    roomName,
    participantName,
    participantToken: token, // Must be a string, not {}
  });
}
