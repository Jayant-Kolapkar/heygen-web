// app/api/get-access-token/route.ts

const HEYGEN_API_KEY = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;

export async function POST() {
  try {
    if (!HEYGEN_API_KEY) {
      throw new Error("API key is missing from .env");
    }
    const res = await fetch(`https://api.heygen.com/v1/streaming.create_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": HEYGEN_API_KEY,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("create_token failed:", text);
      return new Response(text, { status: res.status });
    }

    const { data } = await res.json();

    return new Response(data.token, {
      status: 200,
    });
  } catch (err) {
    console.error("Error retrieving access token:", err);
    return new Response("Failed to retrieve access token", {
      status: 500,
    });
  }
}
