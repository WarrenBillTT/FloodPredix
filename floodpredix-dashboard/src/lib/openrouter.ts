const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-4o";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Send a chat completion request to OpenRouter API
 */
export async function chatCompletion(
  messages: ChatMessage[]
): Promise<ChatCompletionResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "FloodGuard Dashboard",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error?.message || `OpenRouter API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get flood risk prediction with structured output
 */
export async function getFloodRiskPrediction(
  waterLevel: number,
  rainfall: number,
  humidity: number,
  trends?: Array<{ time: string; level: number }>
): Promise<{
  riskLevel: "high" | "medium" | "low";
  confidence: number;
  probability24h: number;
  scenarios: Array<{
    title: string;
    probability: number;
    description: string;
    severity: "critical" | "warning" | "info";
  }>;
}> {
  const systemPrompt = `You are a flood prediction AI assistant for FloodGuard monitoring system. 
Analyze current water levels, rainfall, and humidity data to provide accurate flood risk assessments.

Current conditions:
- Water Level: ${waterLevel.toFixed(3)}m (${(waterLevel * 100).toFixed(1)}cm)
- Rainfall: ${rainfall.toFixed(1)}mm
- Humidity: ${humidity.toFixed(1)}%

Risk thresholds:
- Danger: Water level < 5cm
- Caution: Water level 5-10cm  
- Safe: Water level > 10cm

Return a JSON object with:
{
  "riskLevel": "high" | "medium" | "low",
  "confidence": number (0-100),
  "probability24h": number (0-100),
  "scenarios": [
    {
      "title": string,
      "probability": number (0-100),
      "description": string,
      "severity": "critical" | "warning" | "info"
    }
  ]
}`;

  const userPrompt = `Based on the current conditions, provide a flood risk assessment. 
Include 3 potential scenarios with their probabilities.`;

  try {
    const response = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const content = response.choices[0]?.message?.content || "{}";
    
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback to calculated values if AI response is invalid
    return calculateFloodRiskFallback(waterLevel, rainfall, humidity);
  } catch (error) {
    console.error("OpenRouter API error:", error);
    // Fallback to calculated values
    return calculateFloodRiskFallback(waterLevel, rainfall, humidity);
  }
}

/**
 * Fallback flood risk calculation if AI is unavailable
 */
function calculateFloodRiskFallback(
  waterLevel: number,
  rainfall: number,
  humidity: number
): {
  riskLevel: "high" | "medium" | "low";
  confidence: number;
  probability24h: number;
  scenarios: Array<{
    title: string;
    probability: number;
    description: string;
    severity: "critical" | "warning" | "info";
  }>;
} {
  let riskScore = 0;

  // Water level factor (0-40 points)
  if (waterLevel < 0.05) riskScore += 40; // Danger zone
  else if (waterLevel < 0.1) riskScore += 20; // Caution zone

  // Rainfall factor (0-30 points)
  if (rainfall > 50) riskScore += 30;
  else if (rainfall > 25) riskScore += 15;

  // Humidity factor (0-30 points)
  if (humidity > 90) riskScore += 30;
  else if (humidity > 80) riskScore += 15;

  const riskLevel = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";
  const confidence = Math.min(95, 60 + riskScore);
  const probability24h = Math.min(95, riskScore + (rainfall > 30 ? 20 : 0));

  // Generate default scenarios
  const scenarios = [
    {
      title: "River Bank Breach",
      probability: riskLevel === "high" ? 75 : riskLevel === "medium" ? 40 : 15,
      description:
        riskLevel === "high"
          ? "Water levels predicted to exceed embankment capacity. Immediate evacuation prep advised."
          : "Potential overflow if conditions worsen.",
      severity: riskLevel === "high" ? ("critical" as const) : ("warning" as const),
    },
    {
      title: "Urban Drainage Overflow",
      probability: rainfall > 30 ? 40 : 20,
      description:
        "High rainfall intensity may overwhelm city drainage in low-lying areas.",
      severity: "warning" as const,
    },
    {
      title: "Rapid Water Recession",
      probability: 15,
      description:
        "Optimistic scenario if rainfall ceases abruptly within the next hour.",
      severity: "info" as const,
    },
  ];

  return { riskLevel, confidence, probability24h, scenarios };
}

