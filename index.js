const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
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
  const { bmi, age, gender, goal } = req.body;
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

Include two sections:
1.  Diet Plan (simple and balanced)
2.  Exercise Plan (easy and suitable for beginners)

Use bullet points. Keep it practical.
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
        max_tokens: 1200,
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
