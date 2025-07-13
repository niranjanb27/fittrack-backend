const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Proper CORS configuration
app.use(
  cors({
    origin: "*", // Or use ['http://localhost:5173'] to restrict to specific domain
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

// ✅ BMI Calculation
app.post("/api/bmi", (req, res) => {
  const { height, weight } = req.body;
  if (!height || !weight) {
    return res.status(400).json({ error: "Height and weight are required." });
  }
  const heightM = height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  res.json({ bmi });
});

// ✅ AI Plan using Cohere
app.post("/api/plan", async (req, res) => {
  const { bmi, age, gender, goal, food } = req.body;
  const COHERE_API_KEY = process.env.COHERE_API_KEY;

  if (!COHERE_API_KEY) {
    return res.status(500).json({ plan: "Cohere API key not set in .env file." });
  }

  const prompt = `
Create a personalized fitness plan for a person with the following details:
- Age: ${age}
- Gender: ${gender}
- BMI: ${bmi}
- Goal: ${goal}
${food ? `- Food Type: ${food}` : ""}

Include two sections:
1. *Diet* (Monday to Saturday)
2. *Exercise* (Monday to Saturday)

Use 5 bullet points only. Bold the Tip(if any) Keep it practical.
`;

  try {
    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command",
        prompt: prompt,
        max_tokens: 900,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Cohere API Error:", errorText);
      return res.status(500).json({ plan: "Cohere API call failed." });
    }

    const data = await response.json();
    const planText = data.generations?.[0]?.text;

    if (planText) {
      res.json({ plan: planText.trim() });
    } else {
      console.error("❌ Cohere returned no plan:", data);
      res.status(500).json({ plan: "No plan generated." });
    }
  } catch (error) {
    console.error("❌ Fetch error:", error.message);
    res.status(500).json({ plan: "Server error: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ FitTrack backend running at http://localhost:${PORT}`);
});
