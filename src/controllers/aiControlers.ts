import axios from 'axios';
import { debug } from 'console';
import type { Request, Response } from 'express';

export const askAi = async (req: Request, res: Response) => {
  try {
    // Pobierz wiadomości z ciała żądania
    const messages = req.header('Message');
    if (!messages) {
      return res.status(400).json({ message: 'Messages are required' });
    }

    const userMessage = messages;

    // Wyślij prompt do Ollamy
    const response = await axios.post<{ data: string }>('http://localhost:11434/api/chat', {
      model: 'stepus',
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });
    debug(response.data);
    // Pobierz odpowiedź od modelu
    const aiResponse = response.data;

    // Zwróć odpowiedź AI
    return res.status(200).json({ message: aiResponse });
  } catch (error) {
    console.error('Error communicating with Ollama:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
