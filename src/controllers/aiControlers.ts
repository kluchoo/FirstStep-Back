import axios from 'axios';
import { debug } from 'console';
import type { Request, Response } from 'express';

interface Message {
  role: string;
  content: string;
}

export const askAi = async (req: Request, res: Response) => {
  try {
    debug('Received request to ask AI:', req.body);
    // Pobierz wiadomości z ciała żądania
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ message: 'Messages must be an array of objects with role and content' });
    }

    // Sprawdź, czy każda wiadomość ma odpowiednią strukturę
    const isValidMessages = (messages as Message[]).every(
      (msg) => typeof msg.role === 'string' && typeof msg.content === 'string',
    );

    if (!isValidMessages) {
      return res
        .status(400)
        .json({ message: 'Each message must have a role and content as strings' });
    }

    // Połącz wiadomości w jeden prompt
    const prompt = (messages as Message[]).map(m => `${m.role}: ${m.content}`).join('\n');

    // Wyślij prompt do Ollamy
    const response = await axios.post('http://stepus:11434/api/generate', {
      model: 'stepus',
      prompt,
    });

    debug(response.data);

    // Pobierz odpowiedź od modelu
    const aiResponse = response.data;

    // Zwróć odpowiedź AI
    return res.status(200).json({ message: aiResponse });
  } catch (e: unknown) {
    console.error('Unexpected error:', e);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
