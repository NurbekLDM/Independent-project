export type NormalizationPreset = "social" | "formal" | "search";

export type AiModelId = "gpt-4o" | "gpt-4o-mini" | "gpt-3.5-turbo" | "claude-3-haiku" | "local";

export interface AiModelInfo {
  id: AiModelId;
  label: string;
  provider: string;
  requiresKey: boolean;
}

export const AVAILABLE_MODELS: AiModelInfo[] = [
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI", requiresKey: true },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", requiresKey: true },
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "OpenAI", requiresKey: true },
  { id: "claude-3-haiku", label: "Claude 3 Haiku", provider: "Anthropic", requiresKey: true },
  { id: "local", label: "Local (Rule-based)", provider: "Built-in", requiresKey: false },
];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface NormalizationResult {
  originalText: string;
  cleanedText: string;
  normalizedText: string;
  slangMap: Array<{ original: string; replacement: string }>;
  tokenCount: number;
  languageConfidence: number;
  preset: NormalizationPreset;
}

export interface SavedTextRecord {
  id: string;
  originalText: string;
  cleanedText: string;
  normalizedText: string;
  slangMap: Array<{ original: string; replacement: string }>;
  tokenCount: number;
  languageConfidence: number;
  rating: number | null;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}
