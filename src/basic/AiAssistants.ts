import { GoogleGenAI } from "@google/genai";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
import dotenv from "dotenv";
import prompt from "prompt-sync";
import express from "express";
dotenv.config();

const app = express();
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const context = [
  {
    role: "system",
    content:
      "You are a helpful assistant that answers questions based on the provided context.",
  },
  {
    role: "user",
    content: "hello how are you",
  },
];

async function run() {
  console.log("Hello World");

  while (true) {
    try {
      const input = prompt({
        sigint: true,
      });
      const userInput = input("");

      context.push({
        role: "user",
        content: userInput,
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: context
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            role: msg.role === "assistant" ? "model" : msg.role,
            parts: [{ text: msg.content }],
          })),
      });

      const responseMessage = response.text;

      context.push({
        role: "assistant",
        content: `${responseMessage}`,
      });

      console.log(response.text);
    } catch (error) {
      console.log("in the error", error);
    }
  }
}

// run();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/api/generate", (req, res) => {
  const { prompt } = req.body;
  ai.models
    .generateContent({
      model: "gemini-2.0-flash-001",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are  a story writer which Geneartes Stories based on the prompt ${prompt}`,
            },
          ],
        },
      ],
    })
    .then((response) => {
      res.send(response.text);
    });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
