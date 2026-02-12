
import { GoogleGenAI, Type } from "@google/genai";
import { Artifact } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchDailyArtifact = async (): Promise<Artifact> => {
  // Fetch real Reddit posts from r/all
  const redditResponse = await fetch('https://www.reddit.com/r/all/hot.json?limit=50');
  if (!redditResponse.ok) {
    throw new Error('Failed to fetch Reddit posts');
  }
  const redditData = await redditResponse.json();
  const posts = redditData.data.children
    .map((child: any) => ({
      title: child.data.title,
      subreddit: child.data.subreddit,
      score: child.data.score,
      url: `https://reddit.com${child.data.permalink}`,
      created_utc: child.data.created_utc,
      permalink: child.data.permalink
    }))
    .sort((a: { permalink: string }, b: { permalink: string }) => a.permalink.localeCompare(b.permalink));

  // Use a date-based seed to ensure everyone gets the same daily artifact
  const today = new Date().toISOString().split('T')[0]!;
  const index = today.split('-').reduce((acc, val) => acc + parseInt(val), 0) % posts.length;
  const post = posts[index];

  if (!post) {
    throw new Error('No post found');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a museum-style profile for this Reddit post. Title: "${post.title}". Subreddit: r/${post.subreddit}. Score: ${post.score}. Use this real Reddit post data to generate a cryptic riddle that leads to identifying the post, and deep lore about its origin on Reddit. Include the actual Reddit URL: ${post.url}. Make it sound legendary and mysterious.`,
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

  const text = response.text;
  if (!text) throw new Error('No response text from Gemini');

  const data = JSON.parse(text);

  // Also generate an image for this artifact
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A cinematic, museum-style exhibit display of the Reddit post titled "${post.title}" in a dark, high-end gallery with professional lighting and a brass plaque. The item looks iconic and legendary. High resolution, 4k.` }]
    }
  });

  let imageUrl = "";
  const candidate = imageResponse.candidates?.[0];
  if (candidate && candidate.content && candidate.content.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  return {
    id: today,
    ...data,
    imageUrl: imageUrl || "https://picsum.photos/600/400"
  };
};
