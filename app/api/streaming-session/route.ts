//api/streaming-session/route.ts
import { NextResponse } from 'next/server';
import { HeygenEmotion } from '@/lib/heygenTypes';

export async function GET() {
  // Trim and verify API key
  let rawKey = process.env.HEYGEN_API_KEY || '';
  rawKey = rawKey.trim().replace(/^"+|"+$/g, ''); // removes surrounding double quotes only
  const apiKey = rawKey;
  console.log('[RAW ENV VALUE]', JSON.stringify(process.env.HEYGEN_API_KEY), 'length=', process.env.HEYGEN_API_KEY?.length);
  console.log('[CLEANED API KEY]', JSON.stringify(apiKey), 'length=', apiKey.length);


  console.log('[DEBUG] HEYGEN_API_KEY:', apiKey ? '***' + apiKey.slice(-4) : 'MISSING');
  if (!apiKey) {
    console.error('HEYGEN_API_KEY is missing');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const raw = process.env.HEYGEN_API_KEY;
  console.log('[RAW ENV VALUE]', JSON.stringify(raw), 'length=', raw?.length);


  try {
    // Log environment variables
    console.log('[DEBUG] Using AVATAR_ID:', process.env.NEXT_PUBLIC_AVATAR_ID);
    console.log('[DEBUG] Using VOICE_ID:', process.env.NEXT_PUBLIC_VOICE_ID);

    // 1) Get session token - NEW AUTH METHOD
    const tokenRes = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      //body: JSON.stringify({ key: apiKey }), // Send key in body
    });
    console.log('[DEBUG] create_token status:', tokenRes.status);

    // Handle non-JSON responses
    if (!tokenRes.headers.get('content-type')?.includes('application/json')) {
      const text = await tokenRes.text();
      console.error('Non-JSON token response:', text.substring(0, 200));
      return NextResponse.json({ 
        error: 'Invalid API response format',
        details: text.substring(0, 200) 
      }, { status: 500 });
    }
    
    const tokenClone = tokenRes.clone(); // Clone the response
    const tokenJson = await tokenRes.json(); // Read from original
    console.log('Token response:', tokenJson);
    console.log('[create_token]', tokenRes.status, tokenJson);
    console.log('[DEBUG] Token Response Status:', tokenRes.status);
    const tokenText = await tokenClone.text(); // Read from clone
    try {
      console.log('[DEBUG] Token Response JSON:', JSON.stringify(tokenJson, null, 2));
    } catch (e) {
      console.error('[DEBUG] Token Response NOT JSON:', tokenText.substring(0, 500));
      return NextResponse.json({ 
        error: 'Invalid API response format',
        details: tokenText.substring(0, 500) 
      }, { status: 500 });
    }
    
    if (!tokenRes.ok || !tokenJson.data?.token) {
      console.error('[create_token] error', tokenJson);
      return NextResponse.json({ 
        error: tokenJson.message || 'create_token failed',
        code: tokenJson.code
      }, { status: 500 });
    }
    
    const sessionToken = tokenJson.data.token;
    console.log('[DEBUG] Session token created (truncated):', sessionToken.slice(0, 20) + '...');

    // Add voice verification step
    const verifyVoiceRes = await fetch(`https://api.heygen.com/v1/voice.list?voice_id=${process.env.NEXT_PUBLIC_VOICE_ID}`, {
      headers: { 'X-Api-Key': apiKey }
    });

    if (!verifyVoiceRes.ok) {
      return NextResponse.json({ error: "Invalid voice configuration" }, { status: 400 });
    }

    const voiceData = await verifyVoiceRes.json();

    // 2) Create streaming session

    const newPayload = {
      avatar_id: process.env.NEXT_PUBLIC_AVATAR_ID,
      voice: {
        voice_id: process.env.NEXT_PUBLIC_VOICE_ID,
        emotion: "soothing",
        rate: 1,
      },
      quality: "high",
    }

    console.log('[DEBUG] Sending to streaming.new:', JSON.stringify(newPayload, null, 2));

    const newRes = await fetch('https://api.heygen.com/v1/streaming.new', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPayload),
    });

    // Handle HTML responses
    if (!newRes.headers.get('content-type')?.includes('application/json')) {
      const text = await newRes.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      return NextResponse.json({ 
        error: 'Invalid API response format',
        details: text.substring(0, 200) 
      }, { status: 500 });
    }

    console.log('[DEBUG] streaming.new HTTP status:', newRes.status);
    // Clone if you plan to read both .json() and .text()
    const newClone = newRes.clone();
    const newJson = await newRes.json();        // reads original
    console.log('[streaming.new]', newRes.status, newJson);
    console.log('[DEBUG] streaming.new Status:', newRes.status);
    const newText = await newClone.text();      // reads clone
    console.log('[DEBUG] streaming.new raw:', newText);

    try {
      console.log('[DEBUG] streaming.new Response:', JSON.stringify(newJson, null, 2));
    } catch (e) {
      console.error('[DEBUG] streaming.new Response NOT JSON:', newText.substring(0, 500));
      return NextResponse.json({ 
        error: 'Invalid API response format',
        details: newText.substring(0, 500) 
      }, { status: 500 });
    }
    
    if (!newRes.ok || !newJson.data) {
      console.error('[DEBUG] streaming.new failed:', newJson);
      return NextResponse.json({ 
        error: newJson.message || 'streaming.new failed',
        details: newJson 
      }, { status: newRes.status });
    }
    
    const { session_id, url, access_token } = newJson.data;
    console.log('[DEBUG] Session ID:', session_id);
    console.log('[DEBUG] Realtime Endpoint:', newJson.data.realtime_endpoint);

    // 3) Start session - SKIP THIS STEP - newer API might not need it
    /*
    const startPayload = { session_id };
    console.log('[DEBUG] Sending to streaming.start:', JSON.stringify(startPayload, null, 2));
    
    const startRes = await fetch('https://api.heygen.com/v1/streaming.start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(startPayload),
    });
    
    // Handle HTML responses
    console.log('[DEBUG] streaming.start Status:', startRes.status);
    const startText = await startRes.text();
    let startJson;
    try {
      startJson = JSON.parse(startText);
      console.log('[DEBUG] streaming.start Response:', JSON.stringify(startJson, null, 2));
    } catch (e) {
      console.error('[DEBUG] streaming.start Response NOT JSON:', startText.substring(0, 500));
      return NextResponse.json({ 
        error: 'Invalid API response format',
        details: startText.substring(0, 500) 
      }, { status: 500 });
    }
    
    if (!startRes.ok) {
      console.error('[DEBUG] streaming.start failed:', startJson);
      return NextResponse.json({ 
        error: startJson.message || 'streaming.start failed',
        details: startJson 
      }, { status: startRes.status });
    }
    */

    console.log('[DEBUG] Skipping streaming.start - session should be ready from streaming.new');

    return NextResponse.json({
      heygenEndpoint: newJson.data.realtime_endpoint,
      sessionToken: tokenJson.data.token,
      sessionId: newJson.data.session_id,
    });
    
  } catch (e) {
    console.error('[DEBUG] Unhandled error:', e);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: e instanceof Error ? e.message : String(e)
    }, { status: 500 });
  }
}