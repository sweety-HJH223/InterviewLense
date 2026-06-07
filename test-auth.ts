import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key present:', !!apiKey);

if (apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  model.generateContent('Hello')
    .then(() => console.log('Successfully connected to Gemini!'))
    .catch((err) => console.error('Connection failed:', err.message));
} else {
  console.error('No GEMINI_API_KEY found in process.env');
}
