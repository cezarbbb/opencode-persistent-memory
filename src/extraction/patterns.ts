export const CORRECTION_PATTERNS: Array<{ pattern: RegExp; confidence: number }> = [
  { pattern: /don'?t\s+(do|use|write|run|call)\s+/i, confidence: 0.85 },
  { pattern: /stop\s+(doing|using|running|calling)\s+/i, confidence: 0.85 },
  { pattern: /no[,.]?\s+(that'?s?\s+)?(wrong|incorrect|not\s+right)/i, confidence: 0.8 },
  { pattern: /use\s+\w+\s+instead\s+of/i, confidence: 0.8 },
  { pattern: /never\s+(do|use|write|run)\s+/i, confidence: 0.85 },
  { pattern: /always\s+(do|use|write|run)\s+/i, confidence: 0.75 },
  { pattern: /wrong\s+approach|incorrect\s+(approach|way|method)/i, confidence: 0.8 },
  { pattern: /not\s+like\s+that/i, confidence: 0.7 },
  { pattern: /this\s+is\s+(wrong|incorrect|a\s+mistake)/i, confidence: 0.75 },
  { pattern: /i\s+(don'?t\s+)?want\s+(you\s+)?to\s+not/i, confidence: 0.7 },
]

export const REMEMBER_PATTERNS: Array<{ pattern: RegExp; confidence: number }> = [
  { pattern: /remember\s+(?:that\s+)?/i, confidence: 0.9 },
  { pattern: /keep\s+(?:in\s+mind\s+)?(?:that\s+)?/i, confidence: 0.8 },
  { pattern: /note\s+(?:that\s+|down\s+)?/i, confidence: 0.7 },
  { pattern: /don'?t\s+forget\s+(?:that\s+)?/i, confidence: 0.9 },
  { pattern: /save\s+(?:this|it|the\s+fact)\s+/i, confidence: 0.8 },
  { pattern: /make\s+(?:a\s+)?note\s+/i, confidence: 0.7 },
]

export const USER_PROFILE_PATTERNS: Array<{ pattern: RegExp; confidence: number }> = [
  { pattern: /i(?:'m| am)\s+a\s+[\w-]+\s*(engineer|developer|designer|manager|analyst|scientist|lead|architect)/i, confidence: 0.85 },
  { pattern: /my\s+(role|title|job|position)\s+is/i, confidence: 0.8 },
  { pattern: /i\s+have\s+\d+\s+years?\s+(of\s+)?experience/i, confidence: 0.8 },
  { pattern: /i\s+(specialize|specialise|focus)\s+in/i, confidence: 0.75 },
  { pattern: /my\s+(team|company|org)\s+(uses|builds|works\s+on)/i, confidence: 0.7 },
  { pattern: /we\s+(use|deploy|run)\s+(terraform|kubernetes|docker|k8s|aws|gcp|azure)/i, confidence: 0.65 },
]

export const CONFIRMATION_PATTERNS: Array<{ pattern: RegExp; confidence: number }> = [
  { pattern: /yes,?\s*(exactly|perfect|right|correct|that'?s?\s+it)/i, confidence: 0.8 },
  { pattern: /that'?s?\s+(exactly|perfect|right|correct)/i, confidence: 0.8 },
  { pattern: /good\s+(job|call|approach|choice)/i, confidence: 0.7 },
  { pattern: /keep\s+(doing|going|it\s+up)\s+like\s+this/i, confidence: 0.75 },
  { pattern: /this\s+(approach|way|method)\s+works?\s+(well|great|perfectly)/i, confidence: 0.75 },
]
