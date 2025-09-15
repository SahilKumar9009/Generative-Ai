import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json());

/**
 * Helpers
 */
function getText(response: any): string {
  return response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function cleanJsonString(rawText: string): string {
  return rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Flashcard Generator
 */
app.post("/api/flashCard", async (req: Request, res: Response) => {
  const { notes } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Turn these notes into 5 Q&A flashcards. 
              Format as JSON array: [{"question": "...", "answer": "..."}].
              Notes: ${notes}`,
            },
          ],
        },
      ],
    });

    const raw = getText(response);
    const flashcards = JSON.parse(cleanJsonString(raw));

    res.json(flashcards);
  } catch (error) {
    console.error("Flashcard error:", error);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

/**
 * Chat context
 */
let conversation = [
  { role: "system", content: "You are a helpful assistant." },
];

async function chatInput(userInput: string) {
  conversation.push({ role: "user", content: userInput });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: conversation,
  });

  console.log("in the rewponse from the gemini", response);
  return getText(response);
}

app.post("/api/context", async (req: Request, res: Response) => {
  const { prompt } = req.body;
  try {
    const responseFromAi = await chatInput(prompt);
    console.log("in the response from ai", responseFromAi);
    res.json({ response: responseFromAi });
  } catch (error) {
    console.error("Context error:", error);
    res.status(500).json({ error: "Failed to process context" });
  }
});

/**
 * Quiz Generator
 */
app.post("/api/quiz", async (req: Request, res: Response) => {
  const { topic } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate 5 multiple choice questions about ${topic}
              Each question should have 4 options and one correct answer.
              Format strictly as JSON:
              [
                {"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"}
              ]`,
            },
          ],
        },
      ],
    });

    const quiz = cleanJsonString(getText(response));
    const quizArray = JSON.parse(quiz);

    res.status(200).json({ data: quizArray });
  } catch (error) {
    console.error("Quiz error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

/**
 * Personal Assistant
 */
app.post("/api/personalAssistant", async (req: Request, res: Response) => {
  const {
    age,
    goal,
    currentHealth,
    currentWeight,
    height,
    activityLevel,
    exerciseLevel,
    sleepLevel,
    dietPlan,
  } = req.body;

  try {
    const prompt = `
      You are a personal trainer.
      The user is ${age} years old, with a goal to ${goal}.
      Current health: ${currentHealth}, weight: ${currentWeight} lbs, height: ${height} inches.
      Activity level: ${activityLevel}, exercise level: ${exerciseLevel}, sleep level: ${sleepLevel}.
      Diet plan: ${dietPlan}.
      
      Respond ONLY with a JSON object with these keys:
      1. workoutPlan: a list of workouts (array of objects with keys: name, sets, reps, rest)
      2. dietPlan: a list of foods with proper nutrition
      3. supplementPlan: a list of supplements
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const aiResponse = cleanJsonString(getText(response));
    const aiResponseObject = JSON.parse(aiResponse);

    res.status(200).json({ data: aiResponseObject });
  } catch (error) {
    console.error("PersonalAssistant error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate personal assistant plan" });
  }
});

/**
 * Meme Generator (returns base64 image)
 */
app.post("/api/meme", async (req: Request, res: Response) => {
  const { prompt } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-pro-vision", // image-capable model
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate a meme based on: ${prompt}` }],
        },
      ],
    });

    const imageBase64 =
      response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image generated" });
    }

    res.json({ image: imageBase64 });
  } catch (error) {
    console.error("Meme error:", error);
    res.status(500).json({ error: "Failed to generate meme" });
  }
});

/**
 * Server
 */
app.listen(4001, () => {
  console.log("✅ Server is running on port 4001");
});
