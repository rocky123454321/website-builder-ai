import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.AI_API_KEY) {
  throw new Error('AI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY!);

export const gemini = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

export default gemini;