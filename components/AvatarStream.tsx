// components/AvatarStream.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import StreamingAvatar, {
  StreamingEvents,
  TaskType,
  AvatarQuality,
  VoiceEmotion,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";

interface QA { id: number; question: string; answer: string; }

const QUESTIONS = [
  "What is your startup's core product and who is your target market?",
  "What is your current monthly recurring revenue?",
  "What is your customer acquisition cost and lifetime value?",
  "Who are your main competitors and what is your competitive advantage?",
  "How much funding have you raised so far, and how will you use this investment?"
];

export default function AvatarStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<StreamingAvatar | null>(null);

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(-2);  // -2 = pre-start, -1 = intro, 0+ = questions
  const [status, setStatus] = useState("Click “Start Conversation” to begin");
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<QA[]>([]);

  // load saved answers
  useEffect(() => {
    const saved = localStorage.getItem("qa_pairs");
    if (saved) setAnswers(JSON.parse(saved));
  }, []);
  // persist answers
  useEffect(() => {
    localStorage.setItem("qa_pairs", JSON.stringify(answers));
  }, [answers]);

  const startConversation = async () => {
    // clear old answers
    localStorage.removeItem("qa_pairs");
    setAnswers([]);

    setStarted(true);
    setStatus("Fetching token…");
    const res = await fetch("/api/get-access-token", { method: "POST" });
    if (!res.ok) {
      setStatus("Token fetch failed");
      console.error(await res.text());
      return;
    }
    const token = await res.text();

    setStatus("Starting avatar…");
    const avatar = new StreamingAvatar({ token, basePath: "https://api.heygen.com" });
    avatarRef.current = avatar;

    avatar.on(StreamingEvents.STREAM_READY, (e) => {
      if (e.detail && videoRef.current) {
        videoRef.current.srcObject = e.detail;
        videoRef.current.play().catch(() => setStatus("Click to unmute"));
        setStatus("Connected");
      }
    });
    avatar.on(StreamingEvents.AVATAR_START_TALKING, () => setStatus("Speaking…"));
    avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => setStatus("Connected"));
    avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => setStatus("Disconnected"));

    await avatar.createStartAvatar({
      quality: AvatarQuality.High,
      avatarName: process.env.NEXT_PUBLIC_AVATAR_ID!,
      voice: {
        voiceId: process.env.NEXT_PUBLIC_VOICE_ID!,
        rate: 1,
        emotion: VoiceEmotion.FRIENDLY,
        model: ElevenLabsModel.eleven_flash_v2_5,
      },
      language: "en",
    });

    // start intro
    setStep(-1);
  };

  // speak intro or question on step change
  useEffect(() => {
    const avatar = avatarRef.current;
    if (!avatar || step < -1 || step > QUESTIONS.length) return;

    const text =
      step === -1
        ? "Hello, I'm Elenora, the analyst from Ideasouq. I'm here to ask you about your startup."
        : QUESTIONS[step];

    setTimeout(() => {
      avatar.speak({ text, taskType: TaskType.REPEAT }).catch(console.error);
      setStatus(text);
    }, 500);
  }, [step]);

  const submit = () => {
    if (step === -1) {
      setStep(0);
      return;
    }
    if (step >= 0 && step < QUESTIONS.length && answer.trim()) {
      setAnswers((prev) => [
        ...prev,
        { 
          id: prev.length + 1,
          question: QUESTIONS[step],
          answer: answer 
        }
      ]);
      setAnswer("");
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="relative max-w-lg mx-auto p-4">
      <video
        ref={videoRef}
        autoPlay playsInline muted={!started}
        className="rounded-xl w-full"
        onClick={() => {
          videoRef.current!.muted = false;
          setStatus("Connected");
        }}
      />

      {/* Pre-start overlay */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg text-lg"
            onClick={startConversation}
          >
            Start Conversation
          </button>
        </div>
      )}

      {/* Control area */}
      {started && (
        <div className="mt-4">
          {/* Question display */}
          {(step >= -1 && step < QUESTIONS.length) && (
            <p className="text-lg font-semibold">
              {step === -1
                ? "Introduction: Hello, I'm Elenora, the analyst from Ideasouq. I'm here to ask you about your startup."
                : QUESTIONS[step]}
            </p>
          )}
          {/* Status below in smaller font */}
          <p className="text-sm text-gray-400 mt-1">{status}</p>

          {/* Input / Button logic */}
          {step < -1 ? null :
           step === -1 || step < 0 ? (
            <button
              className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded"
              onClick={submit}
            >
              {step === -1 ? "Begin Questions" : "..."}
            </button>
          ) : step < QUESTIONS.length ? (
            <div className="mt-2 flex gap-2">
              <input
                className="flex-grow px-3 py-2 border rounded"
                placeholder="Type your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={submit}
              >
                Submit
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <h3 className="font-semibold">All done! Your responses:</h3>
              <ul className="list-disc ml-6">
                {answers.map((qa) => (
                  <li key={qa.id} className="mb-2">
                    <strong>{qa.question}</strong>
                    <p>{qa.answer}</p>
                  </li>
                ))}
              </ul>
              <button
                className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded"
                onClick={() => {
                  const blob = new Blob([
                    JSON.stringify(answers, null, 2)
                  ], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "responses.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download JSON
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
