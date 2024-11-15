import { Request, Response } from 'express';
import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_KEY!,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
    apiVersion: "2024-02-15-preview",
});

const BASE_SYSTEM_PROMPT = `You are an NPC (Non-Player Character) in a retro-style game. You represent locations and landmarks in the real world.

LOCATION DESCRIPTION:
{{LOCATION_DESCRIPTION}}

CRITICAL RULES:
- ALWAYS respond in valid JSON format with 'npc_response' and 'available_options'
- Respond with ONLY the JSON object
- NO markdown formatting
- NO code blocks
- NO backtick json prefix or suffix
- NO additional formatting or wrapping
- NEVER respond with plain text
- Keep all responses under 50 words
- Track conversation depth internally
- After 15 exchanges, start wrapping up
- At 20 exchanges, only provide farewell options
  
RESPONSE FORMAT - EXACTLY LIKE THIS:
{
  "npc_response": "Your response here",
  "available_options": [
    {
      "id": 1,
      "text": "Option text",
      "type": "dialogue/shop/farewell"
    }
  ]
}

INITIALIZATION:
- First response must provide these 4 options:
1. "Tell me about yourself!" (type: dialogue)
2. "What are your opening hours?" (type: dialogue)
3. "What can I do here?" (type: dialogue)
4. "Show me shop vouchers" (type: shop)

REMEMBER:
- EVERY message in our conversation MUST be in JSON format
- This includes YOUR responses AND my responses
- Return ONLY the JSON object
- NO markdown, NO code blocks
- ALWAYS include 1-4 options
- Base ALL knowledge on the location description
- Keep responses professional and direct`;

const createSystemPrompt = (locationDescription: string): string => {
    return BASE_SYSTEM_PROMPT.replace('{{LOCATION_DESCRIPTION}}', locationDescription);
};

// Helper function to format user messages
const formatUserMessage = (content: string): string => {
    return JSON.stringify({
        user_message: content
    });
};

export const createChatCompletion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messages, locationDescription } = req.body;

        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ message: 'Messages array is required' });
            return;
        }

        if (!locationDescription) {
            res.status(400).json({ message: 'Location description is required' });
            return;
        }

        // Format the conversation history to maintain JSON structure
        const formattedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.role === 'user' ? formatUserMessage(msg.content) : msg.content
        }));

        const systemPrompt = createSystemPrompt(locationDescription);
        const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...formattedMessages
        ];

        const response = await client.chat.completions.create({
            messages: fullMessages,
            model: "gpt-4o",
            temperature: 0.7
        });

        let content = response.choices[0].message.content;
        
        // Ensure the response is valid JSON
        try {
            // Parse and stringify to validate and format
            const jsonResponse = JSON.parse(content || "{}");
            content = JSON.stringify(jsonResponse);
        } catch (e) {
            console.error('Invalid JSON response:', e);
            console.log(content);
            console.log(fullMessages);
            // Fallback response if JSON is invalid
            content = JSON.stringify({
                npc_response: content,
                available_options: [
                    {
                        id: 1,
                        text: "Tell me something about yourself!",
                        type: "dialogue"
                    },
                    {
                        id: 2,
                        text: "Show me shop vouchers",
                        type: "shop"
                    }
                ]
            });
        }

        res.json({
            message: content,
            role: 'assistant'
        });

    } catch (error) {
        console.error('Error in chat completion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};