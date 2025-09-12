import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { Request, Response } from "express";

dotenv.config();

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json());

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
    res.json(JSON.parse(response.text!));
  } catch (error) {
    console.log(error);
  }
});

//Genearte Quiz

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

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
              i want the response in the json format.
              [
                {"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"},
              ]
              `,
            },
          ],
        },
      ],
    });

    function cleanJsonString(rawText: string): string {
      return rawText
        .replace(/```json/gi, "") // remove ```json
        .replace(/```/g, "") // remove ```
        .trim();
    }
    console.log("in the response of the api ", cleanJsonString(response.text!));
    const quiz = cleanJsonString(response.text!);
    const quizArray = JSON.parse(quiz);
    res.status(200).json({
      data: quizArray,
    });
  } catch (error) {
    console.log("in the error", error);
  }
});

//personal assistant for trainner

app.post("/api/personalAssistant", async (req: Request, res: Response) => {
  const {
    age,
    goal,
    currentHealth,
    currentWeight,
    height,
    weight,
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
      Activity level: ${activityLevel}, exercise level: ${exerciseLevel}, sleep level: ${sleepLevel}
      dietPlan will be vegetarian, vegan, or omnivore.
      The user has the following diet plan: ${dietPlan}
      
      Respond ONLY with a JSON object with these keys:
      1. workoutPlan: a list of workouts (array of objects with keys: name, sets, reps, rest)
      2. dietPlan: a list of foods with proper nutrition
      3. supplementPlan: a list of supplements

      Do NOT include any text outside the JSON object.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",

      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    function cleanJsonString(rawText: string): string {
      return rawText
        .replace(/```json/gi, "") // remove ```json
        .replace(/```/g, "") // remove ```
        .trim();
    }
    console.log("in the response of the api ", cleanJsonString(response.text!));
    const aiResponse = cleanJsonString(response.text!);
    const aiResponseObject = JSON.parse(aiResponse);

    res.status(200).json({
      data: aiResponseObject,
    });

    console.log("in the response of the api in the get ai", response);
  } catch (error) {
    console.log("in the eroor", error);
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
