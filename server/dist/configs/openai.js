import OpenAI from 'openai';
if (!process.env.AI_API_KEY) {
    throw new Error('AI_API_KEY environment variable is required');
}
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.AI_API_KEY,
});
export default openai;
//done
