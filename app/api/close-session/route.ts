import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, sessionToken } = await request.json();
    
    if (!sessionId || !sessionToken) {
      return NextResponse.json({ error: 'Missing sessionId or sessionToken' }, { status: 400 });
    }

    console.log('[DEBUG] Closing session:', sessionId);

    const response = await fetch('https://api.heygen.com/v1/streaming.stop', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    const result = await response.json();
    console.log('[DEBUG] Close session result:', result);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[DEBUG] Error closing session:', error);
    return NextResponse.json({ error: 'Failed to close session' }, { status: 500 });
  }
} 