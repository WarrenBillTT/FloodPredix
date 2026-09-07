import express from "express";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "z-ai/glm-4.5-air:free";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Calculate fallback flood risk if AI is unavailable
 */
function calculateFloodRiskFallback(waterLevel, rainfall, humidity) {
  let riskScore = 0;

  // Water level factor (0-40 points)
  if (waterLevel < 0.05)
    riskScore += 40; // Danger zone
  else if (waterLevel < 0.1) riskScore += 20; // Caution zone

  // Rainfall factor (0-30 points)
  if (rainfall > 50) riskScore += 30;
  else if (rainfall > 25) riskScore += 15;

  // Humidity factor (0-30 points)
  if (humidity > 90) riskScore += 30;
  else if (humidity > 80) riskScore += 15;

  const riskLevel =
    riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";
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
      severity: riskLevel === "high" ? "critical" : "warning",
    },
    {
      title: "Urban Drainage Overflow",
      probability: rainfall > 30 ? 40 : 20,
      description:
        "High rainfall intensity may overwhelm city drainage in low-lying areas.",
      severity: "warning",
    },
    {
      title: "Rapid Water Recession",
      probability: 15,
      description:
        "Optimistic scenario if rainfall ceases abruptly within the next hour.",
      severity: "info",
    },
  ];

  return { riskLevel, confidence, probability24h, scenarios };
}

/**
 * GET /api/predictions/scenarios
 * Get AI-powered flood risk predictions and scenarios
 * Query params: waterLevel, rainfall, humidity, trends (optional JSON string)
 */
router.get("/scenarios", authenticate, async (req, res) => {
  try {
    const { waterLevel, rainfall, humidity, trends } = req.query;

    // Validate required parameters
    if (
      waterLevel === undefined ||
      rainfall === undefined ||
      humidity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: waterLevel, rainfall, humidity",
      });
    }

    const waterLevelNum = parseFloat(waterLevel);
    const rainfallNum = parseFloat(rainfall);
    const humidityNum = parseFloat(humidity);

    if (isNaN(waterLevelNum) || isNaN(rainfallNum) || isNaN(humidityNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parameter values. All must be numbers.",
      });
    }

    // Parse trends if provided
    let trendsArray = [];
    if (trends) {
      try {
        trendsArray = JSON.parse(trends);
      } catch (e) {
        console.warn("Failed to parse trends parameter:", e);
      }
    }

    // If no OpenRouter API key, use fallback
    if (!OPENROUTER_API_KEY) {
      console.log(
        "⚠️  OpenRouter API key not configured. Using fallback calculation.",
      );
      const fallback = calculateFloodRiskFallback(
        waterLevelNum,
        rainfallNum,
        humidityNum,
      );
      return res.json({
        success: true,
        data: fallback,
        source: "fallback",
      });
    }

    // Prepare AI prompt
    const systemPrompt = `You are a flood prediction AI assistant for FloodGuard monitoring system.
Analyze current water levels, rainfall, and humidity data to provide accurate flood risk assessments.

Current conditions:
- Water Level: ${waterLevelNum.toFixed(3)}m (${(waterLevelNum * 100).toFixed(
      1,
    )}cm)
- Rainfall: ${rainfallNum.toFixed(1)}mm
- Humidity: ${humidityNum.toFixed(1)}%

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

    // Call OpenRouter API
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": req.headers.origin || "http://localhost:5173",
          "X-Title": "FloodGuard Dashboard",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          `OpenRouter API error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`,
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "{}";

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const prediction = JSON.parse(jsonMatch[0]);

        // Validate response structure
        if (
          prediction.riskLevel &&
          typeof prediction.confidence === "number" &&
          typeof prediction.probability24h === "number" &&
          Array.isArray(prediction.scenarios)
        ) {
          return res.json({
            success: true,
            data: prediction,
            source: "ai",
          });
        }
      }

      // If AI response is invalid, use fallback
      console.warn("Invalid AI response format. Using fallback calculation.");
      const fallback = calculateFloodRiskFallback(
        waterLevelNum,
        rainfallNum,
        humidityNum,
      );
      return res.json({
        success: true,
        data: fallback,
        source: "fallback",
      });
    } catch (error) {
      console.error("OpenRouter API error:", error);
      // Use fallback on error
      const fallback = calculateFloodRiskFallback(
        waterLevelNum,
        rainfallNum,
        humidityNum,
      );
      return res.json({
        success: true,
        data: fallback,
        source: "fallback",
        warning: error.message,
      });
    }
  } catch (error) {
    console.error("Error in predictions/scenarios endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
