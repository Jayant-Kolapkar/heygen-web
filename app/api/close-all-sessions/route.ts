import { NextResponse } from 'next/server';

export async function POST() {
  const apiKey = process.env.HEYGEN_API_KEY?.trim().replace(/^"+|"+$/g, '');
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
  }

  try {
    console.log('[DEBUG] Attempting to close all active sessions...');

    // First, try to get a session token
    const tokenRes = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!tokenRes.ok) {
      const error = await tokenRes.json();
      return NextResponse.json({ 
        error: 'Failed to create token for session cleanup',
        details: error
      }, { status: 500 });
    }

    const tokenData = await tokenRes.json();
    const sessionToken = tokenData.data.token;

    // Try to list active sessions (this might not work with all API keys)
    try {
      const listRes = await fetch('https://api.heygen.com/v1/streaming.list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (listRes.ok) {
        const sessions = await listRes.json();
        console.log('[DEBUG] Active sessions:', sessions);

        // Close each active session
        if (sessions.data && sessions.data.length > 0) {
          const closePromises = sessions.data.map(async (session: any) => {
            try {
              const closeRes = await fetch('https://api.heygen.com/v1/streaming.stop', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${sessionToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ session_id: session.session_id }),
              });

              const result = await closeRes.json();
              return { session_id: session.session_id, result, success: closeRes.ok };
            } catch (error) {
              return { session_id: session.session_id, error: String(error), success: false };
            }
          });

          const results = await Promise.all(closePromises);
          console.log('[DEBUG] Session closure results:', results);

          return NextResponse.json({
            message: 'Session cleanup completed',
            closed_sessions: results.filter(r => r.success).length,
            failed_sessions: results.filter(r => !r.success).length,
            details: results
          });
        } else {
          return NextResponse.json({
            message: 'No active sessions found',
            closed_sessions: 0
          });
        }
      } else {
        // If listing doesn't work, try a different approach
        console.log('[DEBUG] Could not list sessions, trying alternative cleanup...');
        
        return NextResponse.json({
          message: 'Sessions cleanup attempted - wait 10-15 minutes for automatic timeout',
          note: 'Direct session listing not available with current API key'
        });
      }
    } catch (error) {
      console.error('[DEBUG] Error during session cleanup:', error);
      return NextResponse.json({
        message: 'Sessions will timeout automatically in 10-15 minutes',
        error: String(error)
      });
    }

  } catch (error) {
    console.error('[DEBUG] Session cleanup failed:', error);
    return NextResponse.json({ 
      error: 'Session cleanup failed',
      details: String(error)
    }, { status: 500 });
  }
} 