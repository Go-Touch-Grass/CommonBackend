import { Request, Response } from 'express';
import { AzureOpenAI } from "openai";

// Initialize Azure OpenAI client
const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_KEY!,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
    apiVersion: "2024-02-15-preview",
});

export const createChatCompletion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ message: 'Messages array is required' });
            return;
        }

        const response = await client.chat.completions.create({
            messages,
            temperature: 0.7,
            max_tokens: 800,
            model: "", // model is specified via deployment
        });

        const completion = response.choices[0].message;
        res.json({ 
            message: completion.content,
            role: completion.role
        });

    } catch (error) {
        console.error('Error in chat completion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const streamChatCompletion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ message: 'Messages array is required' });
            return;
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await client.chat.completions.create({
            messages,
            temperature: 0.7,
            model: "", // model is specified via deployment
            stream: true,
        });

        for await (const event of stream) {
            const choice = event.choices[0];
            if (choice && choice.delta && choice.delta.content) {
                res.write(`data: ${JSON.stringify({
                    content: choice.delta.content,
                    role: choice.delta.role || 'assistant'
                })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Error in streaming chat completion:', error);
        res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
        res.end();
    }
};