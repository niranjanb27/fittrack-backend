const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = "AIzaSyAl_DEx8k7ap0s9kKNwb8g7b1RefAmuau0";
const prompt = "Give a simple healthy diet plan for a 25-year-old male";

(async () => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/text-bison-001:generateText?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        temperature: 0.7,
      }),
    }
  );

  const raw = await response.text();
  console.log("🔍 Raw response:\n", raw);
})();
