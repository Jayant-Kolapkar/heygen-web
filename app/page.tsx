'use client';

import { useState } from 'react';
import AvatarStream from '@/components/AvatarStream';       // your text‐Q&A
import AvatarVoice from '@/components/AvatarVoice';         // new voice‐Q&A
import { ToggleGroup, ToggleGroupItem } from '@radix-ui/react-toggle-group';

export default function Page() {
  const [mode, setMode] = useState<'text'|'voice'>('text');

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-gray-900 text-white p-6">
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(val) => setMode(val as any)}
        className="bg-zinc-700 rounded-lg p-1 mb-6"
      >
        <ToggleGroupItem value="text" className="px-4 py-2 data-[state=on]:bg-zinc-800 rounded">
          Text Mode
        </ToggleGroupItem>
        <ToggleGroupItem value="voice" className="px-4 py-2 data-[state=on]:bg-zinc-800 rounded">
          Voice Mode
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === 'text' ? (
        <AvatarStream />
      ) : (
        <AvatarVoice />
      )}
    </main>
  );
}
