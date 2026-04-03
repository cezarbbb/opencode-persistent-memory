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
  { pattern: /不对|不要用|别用|错了|不应该/i, confidence: 0.85 },
  { pattern: /请用.*代替|用.*而不是/i, confidence: 0.8 },
  { pattern: /不要|不要这样|不行/i, confidence: 0.7 },
]

export const REMEMBER_PATTERNS: Array<{ pattern: RegExp; confidence: number }> = [
  { pattern: /remember\s+(?:that\s+)?/i, confidence: 0.9 },
  { pattern: /keep\s+(?:in\s+mind\s+)?(?:that\s+)?/i, confidence: 0.8 },
  { pattern: /note\s+(?:that\s+|down\s+)?/i, confidence: 0.7 },
  { pattern: /don'?t\s+forget\s+(?:that\s+)?/i, confidence: 0.9 },
  { pattern: /save\s+(?:this|it|the\s+fact)\s+/i, confidence: 0.8 },
  { pattern: /make\s+(?:a\s+)?note\s+/i, confidence: 0.7 },
  { pattern: /请?记住|请?记下|记住这个|别忘了|不要忘/i, confidence: 0.9 },
  { pattern: /记一下|帮我记|记得/i, confidence: 0.8 },
]

export const USER_PROFILE_PATTERNS: Array<{ pattern: RegExp; confidence: number }> = [
  { pattern: /i(?:'m| am)\s+a\s+[\w-]+\s*(engineer|developer|designer|manager|analyst|scientist|lead|architect)/i, confidence: 0.85 },
  { pattern: /my\s+(role|title|job|position)\s+is/i, confidence: 0.8 },
  { pattern: /i\s+have\s+\d+\s+years?\s+(of\s+)?experience/i, confidence: 0.8 },
  { pattern: /i\s+(specialize|specialise|focus)\s+in/i, confidence: 0.75 },
  { pattern: /my\s+(team|company|org)\s+(uses|builds|works\s+on)/i, confidence: 0.7 },
  { pattern: /we\s+(use|deploy|run)\s+(terraform|kubernetes|docker|k8s|aws|gcp|azure)/i, confidence: 0.65 },
  { pattern: /我[是为].*(工程师|开发者|架构师|经理|设计师|分析师)/, confidence: 0.85 },
  { pattern: /我的?(角色|职位|岗位|工作)[是为]/, confidence: 0.8 },
  { pattern: /我[有具]\d+年.*经验/, confidence: 0.8 },
  { pattern: /我.*擅长|我.*专注于/, confidence: 0.75 },
  { pattern: /我们.*(团队|公司).*(用|使用|开发|部署)/, confidence: 0.7 },
]

export const CONFIRMATION_PATTERNS: Array<{ pattern: RegExp; confidence: number }> = [
  { pattern: /yes,?\s*(exactly|perfect|right|correct|that'?s?\s+it)/i, confidence: 0.8 },
  { pattern: /that'?s?\s+(exactly|perfect|right|correct)/i, confidence: 0.8 },
  { pattern: /good\s+(job|call|approach|choice)/i, confidence: 0.7 },
  { pattern: /keep\s+(doing|going|it\s+up)\s+like\s+this/i, confidence: 0.75 },
  { pattern: /this\s+(approach|way|method)\s+works?\s+(well|great|perfectly)/i, confidence: 0.75 },
  { pattern: /对|没错|就是这样|很好|正确|好的可以/i, confidence: 0.7 },
  { pattern: /做得好|继续这样|这个方法[很挺]好/i, confidence: 0.75 },
]
