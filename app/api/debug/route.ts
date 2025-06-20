// app/api/debug/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    HEYGEN_API_KEY: process.env.HEYGEN_API_KEY 
      ? `${process.env.HEYGEN_API_KEY.substring(0, 5)}...${process.env.HEYGEN_API_KEY.substring(process.env.HEYGEN_API_KEY.length - 5)}` 
      : null,
    HEYGEN_API_KEY_LENGTH: process.env.HEYGEN_API_KEY?.length,
    NEXT_PUBLIC_AVATAR_ID: process.env.NEXT_PUBLIC_AVATAR_ID,
    NEXT_PUBLIC_VOICE_ID: process.env.NEXT_PUBLIC_VOICE_ID,
  });
}