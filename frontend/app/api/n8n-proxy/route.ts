import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const webhookUrl =
      body.webhook_url ||
      "https://shubham-288.app.n8n.cloud/webhook-test/voice-investigator";
    const voiceText = body.voice_text || "";

    const n8nRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voice_text: voiceText,
      }),
    });

    if (!n8nRes.ok) {
      const errText = await n8nRes.text();
      return NextResponse.json(
        {
          error: `n8n returned status ${n8nRes.status}`,
          details: errText,
        },
        { status: n8nRes.status }
      );
    }

    const data = await n8nRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to connect to n8n webhook" },
      { status: 502 }
    );
  }
}
