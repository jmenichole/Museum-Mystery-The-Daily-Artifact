
import { GoogleGenAI, Type } from "@google/genai";
import { Artifact } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ARTIFACT_LIST = [
  "The Poop Knife",
  "Kevin (The dumbest student)",
  "Carbon Monoxide Post",
  "EA's Pride and Accomplishment comment",
  "The Safe (Locked for years)",
  "Swamps of Dagobah",
  "Cbat (The sex playlist song)",
  "Streetlamp LeMoose",
  "The Jolly Rancher Story",
  "Double Dick Dude"
];

export const fetchDailyArtifact = async (): Promise<Artifact> => {
  // Use a date-based seed to ensure everyone gets the same daily artifact
  const today = new Date().toISOString().split('T')[0];
  const index = today.split('-').reduce((acc, val) => acc + parseInt(val), 0) % ARTIFACT_LIST.length;
  const artifactName = ARTIFACT_LIST[index];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a museum-style profile for the legendary Reddit artifact: "${artifactName}". Include a cryptic riddle that leads to identifying it and deep lore about its origin on Reddit. Also provide a plausible URL link to the original Reddit thread (e.g., reddit.com/r/.../comments/...).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          originalSubreddit: { type: Type.STRING },
          description: { type: Type.STRING },
          riddle: { type: Type.STRING },
          hint: { type: Type.STRING },
          lore: { type: Type.STRING },
          year: { type: Type.STRING },
          redditUrl: { type: Type.STRING, description: "URL to the original Reddit post" }
        },
        required: ["name", "originalSubreddit", "description", "riddle", "hint", "lore", "year", "redditUrl"]
      }
    }
  });

  const data = JSON.parse(response.text);
  
  // Also generate an image for this artifact
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A cinematic, museum-style exhibit display of a mysterious item called "${artifactName}" in a dark, high-end gallery with professional lighting and a brass plaque. The item looks iconic and legendary. High resolution, 4k.` }]
    }
  });

  let imageUrl = "";
  for (const part of imageResponse.candidates[0].content.parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  return {
    id: today,
    ...data,
    imageUrl: imageUrl || "https://picsum.photos/600/400"
  };
};
