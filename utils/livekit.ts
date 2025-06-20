export async function getLiveKitConnectionDetails(roomName: string, participantName: string) {
  const res = await fetch('https://cloud-api.livekit.io/api/sandbox/connection-details', {
    method: 'POST',
    headers: {
      'X-Sandbox-ID': 'dynamic-network-1hvad5',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomName,
      participantName,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch LiveKit token');
  }

  return await res.json(); // { url, token }
}
