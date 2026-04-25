import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const WORD_LIMIT = 60;

const PROMPT = (desc: string) =>
  `Rewrite this data science project description to exactly 50 tokens, ` +
  `preserving all important information (problem statement, performance metrics, ` +
  `stakeholders, challenges, methods used). Be concise and direct. Return only the rewritten description, no preamble.\n\n${desc}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { description } = req.body as { description?: string };

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ message: 'description is required' });
  }

  const wordCount = description.trim().split(/\s+/).length;
  if (wordCount <= WORD_LIMIT) {
    return res.status(400).json({ message: `Description is already within the ${WORD_LIMIT}-word limit` });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'OpenAI API key not configured' });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: PROMPT(description) }],
      max_tokens: 120,
      temperature: 0.3,
    });
    const rewritten = completion.choices[0].message.content?.trim() ?? '';
    return res.status(200).json({ rewritten });
  } catch (err) {
    console.error('OpenAI rewrite error:', err);
    return res.status(500).json({ message: 'Failed to rewrite description' });
  }
}
