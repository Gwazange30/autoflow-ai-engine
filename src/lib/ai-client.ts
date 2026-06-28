import OpenAI from 'openai';

export const qwenClient = new OpenAI({
  apiKey: import.meta.env.VITE_DASHSCOPE_API_KEY || '',
  baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  dangerouslyAllowBrowser: true // Allowed for hackathon prototype
});

export const QWEN_MODEL = 'qwen-plus';

export async function generateWorkflowContent(prompt: string, type: 'invoice' | 'quotation') {
  try {
    const response = await qwenClient.chat.completions.create({
      model: QWEN_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an enterprise automation assistant. Generate a professional ${type} JSON object based on the user's description. Include fields like clientName, items (array of {description, quantity, price}), and totalAmount.`
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw error;
  }
}
