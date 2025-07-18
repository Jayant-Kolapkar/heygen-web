//components/AvatarVoice.tsx - Fixed manual mic control
'use client';

import { useEffect, useRef, useState } from 'react';
import StreamingAvatar, {
  StreamingEvents,
  TaskType,
  TaskMode,
  AvatarQuality,
  VoiceEmotion,
  STTProvider,
  VoiceChatTransport,
  ElevenLabsModel,
} from '@heygen/streaming-avatar';

interface Entry { 
  speaker: 'user' | 'avatar'; 
  text: string; 
  timestamp: number; 
}

// fetches the pre-generated LLM prompt summary
async function fetchSummary(): Promise<string> {
  const res = await fetch('/knowledge/summary.txt');
  if (!res.ok) throw new Error('Failed to load summary');
  return res.text();
}

// Check microphone access
async function checkMicrophoneAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('[Microphone] Access granted:', stream.getAudioTracks().length > 0);
    stream.getTracks().forEach(track => track.stop()); // Clean up
    return true;
  } catch (error) {
    console.error('[Microphone] Access denied:', error);
    return false;
  }
}

// Add retry utility
async function retryWithDelay<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

export default function AvatarVoice() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const [started, setStarted] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState('Click to Start Investor Chat');
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [currentUserInput, setCurrentUserInput] = useState('');
  const [currentAvatarSpeech, setCurrentAvatarSpeech] = useState('');
  const [microphoneAccess, setMicrophoneAccess] = useState<boolean | null>(null);
  const [voiceChatStarted, setVoiceChatStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const userSpeechBuffer = useRef('');
  const avatarSpeechBuffer = useRef('');

  // Initialize avatar and LLM prompt flow
  const startVoice = async () => {
    try {
      setStarted(true);
      setStatus('Checking microphone access...');

      const micAccess = await checkMicrophoneAccess();
      setMicrophoneAccess(micAccess);
      
      if (!micAccess) {
        setStatus('Microphone access denied. Please allow microphone access and try again.');
        return;
      }

      setStatus('Initializing...');

      const [token, summary] = await Promise.all([
        fetch('/api/get-access-token', { method: 'POST' }).then(r => r.text()),
        fetchSummary(),
      ]);
      console.log('[Token]', token);

      const knowledgeBase = `You are Eleanora, an AI startup analyst from Ideasouq. You've just reviewed the startup's pitch deck, public documents (like LinkedIn and press releases), and internal data shared via PDFs and clarification messages. Based on that, you now want to **ask the founder a limited set of follow-up questions** to ensure clarity on business fundamentals. Your tone is friendly, professional, and precise. Don't over-explain — focus on what you need to clarify. 

## Session Rules: 
- The entire conversation must **not exceed 5 minutes** in total. 
- Ask no more than **6 questions total**, including any follow-ups. Each question can be compound (i.e. ask two things together), but never long-winded. 
- Use clear, investor-style queries that assume some understanding of business metrics and terms. 
- Prioritize questions that reveal gaps in revenue model, product-market fit, traction, or team strength. 
- After receiving all answers, thank the founder and close the conversation briefly. 

## Introduction: 
Start by introducing yourself: "Hello! I'm Eleanora from Ideasouq. I've reviewed the details of your startup, including your pitch deck and online presence. Thank you for sharing that. I'd like to clarify a few things to complete your investor profile."

## Knowledge Summary: 
${summary}

Begin the conversation by introducing yourself and asking your first question about their revenue model. When you are finished asking all your questions, end the session by saying: "Thank you for your time. This concludes our conversation. Session complete." It is imperative that you end the session with these words.`;

      const avatar = new StreamingAvatar({ 
        token, 
        basePath: 'https://api.heygen.com' 
      });
      avatarRef.current = avatar;

      avatar.on(StreamingEvents.STREAM_READY, async (event) => {
        console.log('[STREAM_READY]', event);
        try {
          if (videoRef.current && event.detail) {
            videoRef.current.srcObject = event.detail;
            videoRef.current.muted = false;
            await videoRef.current.play().catch(console.error);
          }
          setIsStreamReady(true);
          setStatus('Stream ready. Waiting for video to stabilize...');

          setTimeout(async () => {
            try {
              setStatus('Starting voice chat...');
              console.log('[Voice Chat] Starting voice chat after stream stabilization');
              
              await retryWithDelay(async () => {
                return await avatar.startVoiceChat({
                  //@ts-ignore
                  useSilencePrompt: false,
                  isInputAudioMuted: true // ✅ Start with mic muted for manual control
                });
              }, 3, 1500);
              
              setVoiceChatStarted(true);
              setStatus("Voice chat ready. The avatar will begin speaking.");
              console.log('[Voice Chat] ✅ Successfully started');
              
              // ✅ AUTO-INITIATE CONVERSATION: Send a hidden trigger message
              // This simulates a user input to start the conversation flow
              setTimeout(async () => {
                try {
                  // Method 1: Use TaskType.TALK to trigger LLM response
                  await avatar.speak({
                    text: "Hello! Please state your role, and the name of your startup.", 
                    task_type: TaskType.TALK, 
                    taskMode: TaskMode.SYNC
                  });
                  
                  console.log('[Auto-Init] ✅ Conversation initiated successfully');
                } catch (error) {
                  console.error('[Auto-Init] Method 1 failed, trying fallback:', error);
                  
                  // Fallback: Use TaskType.REPEAT to make avatar speak the intro directly
                  try {
                    await avatar.speak({
                      text: "Hello! I'm Eleanora from Ideasouq. I've reviewed the details of your startup, including your pitch deck and online presence. Thank you for sharing that. I'd like to clarify a few things to complete your investor profile. Let's start with your revenue model - could you walk me through how you currently generate revenue and what your pricing strategy looks like?",
                      task_type: TaskType.REPEAT, // This makes avatar speak exactly this text
                      taskMode: TaskMode.SYNC
                    });
                    console.log('[Auto-Init] ✅ Fallback conversation initiated successfully');
                  } catch (fallbackError) {
                    console.error('[Auto-Init] All methods failed:', fallbackError);
                    setStatus(`Auto-init failed: ${fallbackError}. Please click "Start Listening" to begin.`);
                  }
                }
              }, 1000); // Small delay to ensure voice chat is fully ready
              //Trigger message over

            } catch (error) {
              console.error('[Voice Chat Start Error]', error);
              setStatus(`Voice chat error: ${error}`);
            }
          }, 2000);
          
        } catch (error) {
          console.error('[STREAM_READY Error]', error);
          setStatus(`Stream ready error: ${error}`);
        }
      });

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (event) => {
        console.log('[AVATAR_START_TALKING]', event);
        setIsAvatarSpeaking(true);
        setStatus('Eleanora is speaking...');
        setCurrentAvatarSpeech('');
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (event) => {
        console.log('[AVATAR_STOP_TALKING]', event);
        setIsAvatarSpeaking(false);
        setStatus('Your turn. Click "Start Listening" to respond.');
        
        // ✅ CRITICAL FIX: Force stop listening and mute mic after avatar stops talking
        // This prevents the SDK from auto-unmuting the mic
        if (avatarRef.current) {
          avatarRef.current.stopListening().catch(console.error);
          avatarRef.current.muteInputAudio?.();
          setIsListening(false);
          console.log('[AVATAR_STOP_TALKING] ✅ Forced mic mute and stop listening');
        }
      });

      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        const message = event.detail || event;
        const text = message?.text || message?.message || '';
        avatarSpeechBuffer.current += text;
        if (text) {
          setCurrentAvatarSpeech(avatarSpeechBuffer.current);
        }
      });

      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        const finalText = avatarSpeechBuffer.current.trim();
        if (finalText) {
          setEntries(prev => [...prev, { speaker: 'avatar', text: finalText, timestamp: Date.now() }]);
          setQuestionCount(prev => prev + 1);
          
          if (finalText.includes('Session complete')) {
            console.log('[Session End] Detected session end phrase');
            setStatus('Session ending...');
            setTimeout(() => endSession(), 12000);
          }
        }
        avatarSpeechBuffer.current = '';
        setCurrentAvatarSpeech('');
      });

      // ✅ CRITICAL FIX: Do NOT change mic state in USER_START/USER_STOP events
      // These events are for UI feedback only, not mic control
      avatar.on(StreamingEvents.USER_START, (event) => {
        console.log('[USER_START]', event);
        // ✅ Only update status, do NOT set isListening state here
        setStatus('Listening to you...');
        setCurrentUserInput('');
        // ❌ REMOVED: setIsListening(true); - This was causing auto-unmuting
      });

      avatar.on(StreamingEvents.USER_STOP, (event) => {
        console.log('[USER_STOP]', event);
        // ✅ Only update status, do NOT set isListening state here
        setStatus('Processing your response...');
        // ❌ REMOVED: setIsListening(false); - This was interfering with manual control
      });

      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        const message = event.detail || event;
        const text = message?.text || message?.message || '';
        userSpeechBuffer.current += text;
        if (text) {
          setCurrentUserInput(userSpeechBuffer.current);
        }
      });

      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        const finalText = userSpeechBuffer.current.trim();
        if (finalText) {
          setEntries(prev => [...prev, { speaker: 'user', text: finalText, timestamp: Date.now() }]);
        }
        userSpeechBuffer.current = '';
        setCurrentUserInput('');
      });

      // ✅ OPTIONAL: Auto-stop listening on silence to maintain manual control
      avatar.on(StreamingEvents.USER_SILENCE, (event) => {
        console.log('[USER_SILENCE]', event);
        if (isListening) {
          avatarRef.current?.stopListening().catch(console.error);
          avatarRef.current?.muteInputAudio?.();
          setIsListening(false);
          setStatus('Silence detected. Microphone muted.');
          console.log('[USER_SILENCE] ✅ Auto-stopped listening due to silence');
        }
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('[STREAM_DISCONNECTED]');
        setStatus('Stream disconnected');
        setIsStreamReady(false);
        setIsAvatarSpeaking(false);
        setIsListening(false);
        setVoiceChatStarted(false);
      });

      avatar.on('error', (error) => {
        console.error('[Avatar Error]', error);
        setStatus(`Avatar error: ${error}`);
      });

      setStatus('Creating avatar session...');
      
      const sessionResponse = await avatar.createStartAvatar({
        avatarName: 'Elenora_IT_Sitting_public',
        quality: AvatarQuality.High,
        voice: {
          voiceId: process.env.NEXT_PUBLIC_VOICE_ID!,
          rate: 1,
          emotion: VoiceEmotion.FRIENDLY,
          model: ElevenLabsModel.eleven_flash_v2_5,
        },
        language: 'en',
        voiceChatTransport: VoiceChatTransport.WEBSOCKET,
        sttSettings: { 
          provider: STTProvider.DEEPGRAM,
          confidence: 0.5,
        },
        knowledgeBase: knowledgeBase,
        disableIdleTimeout: true,
      });

      console.log('[Avatar Session Created]', sessionResponse);
      setStatus('Avatar session created, waiting for stream...');

    } catch (e) {
      console.error('[startVoice Error]', e);
      setStatus(`Error: ${e}`);
    }
  };

  const endSession = async () => {
    try {
      setSessionEnded(true);
      setStatus('Session completed. Thank you!');
      
      if (avatarRef.current) {
        await avatarRef.current.stopAvatar();
      }
      
      setIsStreamReady(false);
      setIsAvatarSpeaking(false);
      setIsListening(false);
      setVoiceChatStarted(false);
      
      console.log('[Session] Session ended successfully');
    } catch (error) {
      console.error('[Session End Error]', error);
    }
  };
  
  // ✅ FULLY MANUAL MIC CONTROL - This is the ONLY place that should control mic state
  const toggleMic = async () => {
    const avatar = avatarRef.current;
    if (!avatar || !isStreamReady || !voiceChatStarted || isAvatarSpeaking) {
      console.warn('[Mic Toggle] Not ready or avatar is speaking.');
      return;
    }
  
    try {
      if (isListening) {
        // --- STOP LISTENING ---
        await avatar.stopListening();
        avatar.muteInputAudio?.(); 
        setIsListening(false);
        setStatus('Microphone stopped.');
        console.log('[Mic] 🔴 Manually stopped listening and muted input.');
      } else {
        // --- START LISTENING ---
        avatar.unmuteInputAudio?.();
        await retryWithDelay(() => avatar.startListening(), 2, 1000);
        setIsListening(true);
        setStatus('Listening... speak now.');
        console.log('[Mic] 🟢 Manually unmuted input and started listening.');
      }
    } catch (error) {
      console.error('[Mic toggle error]', error);
      setStatus(`Mic error: ${error}`);
      setIsListening(false); 
    }
  };
  
  // Generate and download transcript
  const downloadTranscript = () => {
    const transcript = [];
    let currentQA = { id: 0, question: '', answer: '' };
    let qaIndex = 1;
    
    entries.forEach((entry, index) => {
      if (entry.speaker === 'avatar') {
        if (currentQA.question) {
          transcript.push({ ...currentQA });
          qaIndex++;
        }
        currentQA = {
          id: qaIndex,
          question: entry.text,
          answer: ''
        };
      } else if (entry.speaker === 'user') {
        currentQA.answer = entry.text;
      }
    });
    
    if (currentQA.question) {
      transcript.push(currentQA);
    }
    
    const jsonData = JSON.stringify(transcript, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investor_session_transcript_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Stop avatar from speaking/nodding
  const stopAvatar = async () => {
    if (!avatarRef.current || !isStreamReady) return;
    
    try {
      await avatarRef.current.interrupt();
      setIsAvatarSpeaking(false);
      setStatus('Avatar interrupted');
      console.log('[Manual] Avatar interrupted');
    } catch (error) {
      console.error('[Stop avatar error]', error);
    }
  };

  // Test microphone access
  const testMicrophone = async () => {
    setStatus('Testing microphone...');
    const access = await checkMicrophoneAccess();
    setMicrophoneAccess(access);
    setStatus(access ? 'Microphone access: ✅' : 'Microphone access: ❌');
  };

  // Connection health check
  const checkConnectionHealth = async () => {
    if (!avatarRef.current || !isStreamReady) {
      setStatus('❌ Not connected');
      return;
    }
    
    try {
      setStatus('🔍 Checking connection...');
      if (voiceChatStarted) {
        setStatus('✅ Connection healthy');
      } else {
        setStatus('⚠️ Voice chat not started');
      }
    } catch (error) {
      console.error('[Health check error]', error);
      setStatus(`❌ Connection issue: ${error}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avatarRef.current) {
        avatarRef.current.stopAvatar().catch(console.error);
      }
    };
  }, []);
  
  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-gray-900" />
      
      {!started ? (
        <div className="space-y-2">
          <button 
            onClick={startVoice} 
            className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Investor Chat
          </button>
          
          <button 
            onClick={testMicrophone}
            className="w-full py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Test Microphone Access
          </button>
          
          {microphoneAccess !== null && (
            <div className={`p-2 rounded text-sm ${microphoneAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Microphone: {microphoneAccess ? '✅ Access granted' : '❌ Access denied'}
            </div>
          )}
        </div>
      ) : (
        <>
          {!sessionEnded ? (
            <>
              <div className="flex space-x-2">
                <button
                  onClick={toggleMic}
                  disabled={isAvatarSpeaking || !isStreamReady || !voiceChatStarted}
                  className={`flex-1 py-3 text-white rounded ${
                    isAvatarSpeaking || !isStreamReady || !voiceChatStarted
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : isListening 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {isAvatarSpeaking
                    ? 'Avatar Speaking...'
                    : !isStreamReady
                      ? 'Initializing...'
                      : !voiceChatStarted
                        ? 'Voice Chat Starting...'
                        : isListening
                          ? '🔴 Stop Listening'
                          : '🟢 Start Listening'
                  }
                </button>
                
                <button
                  onClick={stopAvatar}
                  disabled={!isAvatarSpeaking || !isStreamReady}
                  className="px-4 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-500"
                >
                  ⏸️ Stop
                </button>
              </div>

              <p className="text-center font-semibold text-sm">{status}</p>

              {(currentAvatarSpeech || currentUserInput) && (
                <div className="bg-yellow-100 border border-yellow-300 p-3 rounded">
                  <p className="text-sm font-medium text-yellow-800">
                    {currentAvatarSpeech && (
                      <span><strong>Eleanora:</strong> {currentAvatarSpeech}</span>
                    )}
                    {currentUserInput && (
                      <span><strong>You:</strong> {currentUserInput}</span>
                    )}
                  </p>
                </div>
              )}

              <div className="h-48 overflow-y-auto bg-gray-800 p-3 rounded">
                {entries.length === 0 ? (
                  <p className="text-gray-400 text-sm">Waiting for conversation to start...</p>
                ) : (
                  entries.map((e, i) => (
                    <div key={i} className={`mb-2 p-2 rounded text-sm ${
                      e.speaker === 'avatar' 
                        ? 'bg-blue-900 text-white' 
                        : 'bg-green-900 text-white'
                    }`}>
                      <strong>{e.speaker === 'avatar' ? 'Eleanora:' : 'You:'}</strong> {e.text}
                    </div>
                  ))
                )}
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <div>Stream Ready: {isStreamReady ? '✅' : '❌'}</div>
                <div>Voice Chat Started: {voiceChatStarted ? '✅' : '❌'}</div>
                <div>Avatar Speaking: {isAvatarSpeaking ? '✅' : '❌'}</div>
                <div>Listening: {isListening ? '✅' : '❌'}</div>
                <div>Microphone Access: {microphoneAccess === null ? '❓' : microphoneAccess ? '✅' : '❌'}</div>
                <div>Total Entries: {entries.length}</div>
                <div>Question Count: {questionCount}</div>
              </div>

              <div className="flex space-x-2">
                <button onClick={() => console.log({ avatarRef, entries, status })} className="px-3 py-1 bg-gray-400 text-white rounded text-xs">Debug Log</button>
                <button onClick={testMicrophone} className="px-3 py-1 bg-purple-400 text-white rounded text-xs">Test Mic</button>
                <button onClick={checkConnectionHealth} className="px-3 py-1 bg-cyan-400 text-white rounded text-xs">Health Check</button>
                <button onClick={endSession} className="px-3 py-1 bg-red-500 text-white rounded text-xs">End Session</button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-100 border border-green-300 p-4 rounded">
                <h3 className="font-semibold text-green-800 mb-2">Session Completed!</h3>
                <p className="text-green-700 text-sm">Thank you for participating in the investor session.</p>
              </div>
              
              <button onClick={downloadTranscript} className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
                📥 Download Transcript (JSON)
              </button>
              
              <div className="text-xs text-gray-500">
                <div>Total Questions Asked: {questionCount}</div>
                <div>Total Responses: {entries.filter(e => e.speaker === 'user').length}</div>
                <div>Session Duration: {entries.length > 0 ? `${Math.round((entries[entries.length - 1].timestamp - entries[0].timestamp) / 1000)}s` : '0s'}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}