import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

if (!process.env.AI_API_KEY) {
  throw new Error('AI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY!);

const openrouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    })
  : null;

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const withTimeout = <T>(promise: Promise<T>): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out after 15 minutes')), FIFTEEN_MINUTES)
    )
  ]);
};

const extractPrompt = (input: any): string => {
  if (typeof input === 'string') return input;
  return input?.parts?.[0]?.text ?? JSON.stringify(input);
};

const generateViaOpenRouter = async (prompt: string) => {
  if (!openrouter) throw new Error('OpenRouter not configured — OPENROUTER_API_KEY is missing');
  
  const response = await openrouter.chat.completions.create({
    model: 'arcee-ai/trinity-large-preview:free',
    messages: [{ role: 'user', content: prompt }],
  });

  if (!response?.choices || response.choices.length === 0) {
    throw new Error('OpenRouter returned empty response');
  }

  const text = response.choices[0]?.message?.content || '';

  if (!text) {
    throw new Error('OpenRouter returned empty content');
  }

  return {
    response: { text: () => text },
  };
};

const generateViaGemini = async (args: any[]) => {
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  return await withTimeout(geminiModel.generateContent(...(args as [any])));
};

type Provider = 'gemini' | 'openrouter';

let currentProvider: Provider = 'openrouter';
let lastSwitchTime: number = Date.now();
const STAY_DURATION = 50 * 60 * 1000;

export const gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

const originalGenerate = gemini.generateContent.bind(gemini);

gemini.generateContent = async (...args: Parameters<typeof originalGenerate>) => {
  const prompt = extractPrompt(args[0]);

  const now = Date.now();
  if (now - lastSwitchTime >= STAY_DURATION) {
    console.log('30 minutes passed, switching back to openrouter...');
    currentProvider = 'openrouter';
    lastSwitchTime = now;
  }

  // If OpenRouter is not configured, always use Gemini
  const providers: Provider[] = !openrouter
    ? ['gemini']
    : currentProvider === 'gemini'
      ? ['gemini', 'openrouter']
      : ['openrouter', 'gemini'];

  for (const provider of providers) {
    try {
      if (provider === 'gemini') {
        console.log('Using Gemini...');
        const result = await generateViaGemini(args);
        currentProvider = 'gemini';
        lastSwitchTime = Date.now();
        return result;
      } else {
        console.log('Using OpenRouter...');
        const result = await withTimeout(generateViaOpenRouter(prompt));
        currentProvider = 'openrouter';
        lastSwitchTime = Date.now();
        return result as any;
      }
    } catch (error: any) {
      console.log(`${provider} failed (${error?.status ?? error?.code ?? error?.message}), trying next...`);
      continue;
    }
  }

  throw new Error('All AI providers failed. Please try again later.');
};

export default gemini;