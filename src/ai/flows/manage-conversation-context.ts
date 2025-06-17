
'use server';

/**
 * @fileOverview Manages the conversational context for the AI assistant.
 *
 * - manageConversationContext - A function that manages the conversation context.
 * - ManageConversationContextInput - The input type for the manageConversationContext function.
 * - ManageConversationContextOutput - The return type for the manageConversationContext function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ManageConversationContextInputSchema = z.object({
  userInput: z.string().describe('The user input text.'),
  conversationHistory: z.array(z.object({role: z.enum(['user', 'model']), content: z.string()})).optional().describe('The previous turns of the conversation.'),
  attachmentDataUri: z.string().optional().describe("An optional attached image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ManageConversationContextInput = z.infer<typeof ManageConversationContextInputSchema>;

const ManageConversationContextOutputSchema = z.object({
  response: z.string().describe('The AI response to the user input.'),
  updatedConversationHistory: z.array(z.object({role: z.enum(['user', 'model']), content: z.string()})).describe('The updated conversation history including the user input and AI response.'),
});
export type ManageConversationContextOutput = z.infer<typeof ManageConversationContextOutputSchema>;

export async function manageConversationContext(input: ManageConversationContextInput): Promise<ManageConversationContextOutput> {
  return manageConversationContextFlow(input);
}

const ModelResponseSchema = z.object({
  response: z.string().describe('The AI response to the user input.'),
});

const manageConversationContextFlow = ai.defineFlow(
  {
    name: 'manageConversationContextFlow',
    inputSchema: ManageConversationContextInputSchema,
    outputSchema: ManageConversationContextOutputSchema,
  },
  async (input) => {
    const { userInput, conversationHistory = [], attachmentDataUri } = input;

    const parts: Array<{ text: string } | { media: { url: string } }> = [];

    parts.push({
      text: `You are Harium AI, a helpful and friendly AI assistant. You are powered and trained by Abdullah Developers. Your primary goal is to assist the user.
Engage in a conversation with the user, remembering previous turns.
When you respond, please identify and emphasize important words or phrases by wrapping them in double asterisks, like **this**.
Please use emojis appropriately in your responses to make the conversation more engaging.

When providing code snippets (HTML, CSS, JavaScript, etc.), **always** wrap them in triple backticks, specifying the language if possible. For example:
\`\`\`html
<div>Hello</div>
\`\`\`
or
\`\`\`javascript
console.log('world');
\`\`\`

If the user asks you to create, draw, or generate an image, your response **must** be ONLY the specific instruction \`[GENERATE_IMAGE: <detailed description of the image they want>]\`. Do not add any other text or pleasantries around this instruction if you are issuing it. For example, if the user says 'draw a happy dog', you should respond with: \`[GENERATE_IMAGE: a happy dog playing in a sunny park]\`.

If the user asks about the owner or information related to "Abdullah Developers", you **must** respond with: "Abdullah Developers is a large company with a net worth of 1.5 million PKR and is owned by Abdullah Chohan, who is 16 years old." Do not deviate from this exact phrasing for this specific query.

If the user asks a question about an image they attached, answer it directly based on the image. If the user's request is ambiguous about whether to generate an image or answer a question about an attachment, prioritize answering about the attachment if one is present.`
    });

    if (conversationHistory.length > 0) {
      const historyText = conversationHistory
        .map(turn => `${turn.role}: ${turn.content}`)
        .join('\n');
      parts.push({ text: `\n\nPrevious conversation:\n${historyText}` });
    }

    parts.push({ text: `\n\nuser: ${userInput}` });

    if (attachmentDataUri) {
      parts.push({ text: "\n(The user has attached the following image. Please consider it in your response if relevant to the query.)\nAttached Image:" });
      parts.push({ media: { url: attachmentDataUri } });
    }

    parts.push({ text: "\n\nassistant:" });

    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: parts,
      output: { schema: ModelResponseSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }
    });

    const aiResponseMessage = output!.response;

    const updatedConversationHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: userInput },
      { role: 'model' as const, content: aiResponseMessage },
    ];

    return { response: aiResponseMessage, updatedConversationHistory };
  }
);
