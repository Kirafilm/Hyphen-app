/**
 * Optional image generation helper.
 * Not wired to any provider — configure LLM_API_URL / LLM_API_KEY if needed later.
 */
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(_options: GenerateImageOptions): Promise<GenerateImageResponse> {
  void _options;
  if (!ENV.llmApiUrl || !ENV.llmApiKey) {
    throw new Error("Image generation is not configured (set LLM_API_URL and LLM_API_KEY)");
  }
  throw new Error("Image generation provider is not implemented for Hyphen");
}
