/**
 * Optional voice transcription helper (disabled — no external STT provider configured).
 */
export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
};

export type WhisperSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};

export type WhisperResponse = {
  task: "transcribe";
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
};

export type TranscriptionResponse = WhisperResponse;

export type TranscriptionError = {
  error: string;
  code:
    | "FILE_TOO_LARGE"
    | "INVALID_FORMAT"
    | "TRANSCRIPTION_FAILED"
    | "UPLOAD_FAILED"
    | "SERVICE_ERROR";
  details?: string;
};

export async function transcribeAudio(
  _options: TranscribeOptions,
): Promise<TranscriptionResponse | TranscriptionError> {
  void _options;
  return {
    error: "Voice transcription is not configured",
    code: "SERVICE_ERROR",
    details: "No speech-to-text provider is set for Hyphen",
  };
}
