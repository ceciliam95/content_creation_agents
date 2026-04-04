import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { NextResponse } from "next/server";

import {
  DIALOGUE_TTS_OUTPUT_FORMAT,
  createDialogueAudioFilename,
} from "@/lib/dialogue-tts";
import { getTaskProviderConfig } from "@/lib/task-provider-config";

export const runtime = "nodejs";

type DialogueTtsRequest = {
  text?: string;
  voiceId?: string;
  filename?: string;
};

export async function POST(request: Request) {
  const { text, voiceId, filename }: DialogueTtsRequest = await request.json();
  const trimmedText = text?.trim();
  const trimmedVoiceId = voiceId?.trim();

  if (!trimmedText) {
    return NextResponse.json({ error: "Dialogue text is required." }, { status: 400 });
  }

  if (!trimmedVoiceId) {
    return NextResponse.json({ error: "Voice ID is required." }, { status: 400 });
  }

  let providerConfig;

  try {
    providerConfig = getTaskProviderConfig("dialogue_tts");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Missing TTS provider configuration.";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const elevenlabs = new ElevenLabsClient({
      apiKey: providerConfig.apiKey,
      baseUrl: providerConfig.baseUrl,
    });

    const audioStream = await elevenlabs.textToSpeech.convert(trimmedVoiceId, {
      text: trimmedText,
      modelId: providerConfig.model,
      outputFormat: DIALOGUE_TTS_OUTPUT_FORMAT,
    });

    const audioBuffer = await new Response(audioStream).arrayBuffer();
    const downloadName =
      filename?.trim() || createDialogueAudioFilename("voiceover");

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "X-Dialogue-Tts-Filename": downloadName,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "TTS generation failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
