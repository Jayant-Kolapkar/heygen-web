// app/api/verify-env/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    HEYGEN_API_KEY: process.env.HEYGEN_API_KEY 
      ? `${process.env.HEYGEN_API_KEY.slice(0, 5)}...${process.env.HEYGEN_API_KEY.slice(-5)}` 
      : null,
    HEYGEN_API_KEY_LENGTH: process.env.HEYGEN_API_KEY?.length,
    AVATAR_ID: process.env.NEXT_PUBLIC_AVATAR_ID,
    VOICE_ID: process.env.NEXT_PUBLIC_VOICE_ID,
  });
}