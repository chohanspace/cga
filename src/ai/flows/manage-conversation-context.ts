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
  userInput: z.string().describe('The user input.'),
  conversationHistory: z.array(z.object({role: z.enum(['user', 'model']), content: z.string()})).optional().describe('The previous turns of the conversation.'),
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

const conversationContextPrompt = ai.definePrompt({
  name: 'conversationContextPrompt',
  input: {schema: ManageConversationContextInputSchema},
  output: {schema: ManageConversationContextOutputSchema},
  prompt: `You are AbduDev AI, a helpful AI assistant trained by Abdullah Developers. Engage in a conversation with the user, remembering previous turns.

{% if conversationHistory %}
Previous conversation:
{% each conversationHistory %}
{{this.role}}: {{this.content}}
{% endeach %}
{% endif %}

user: {{{userInput}}}

assistant:`, // The model is trained to continue the 'assistant:' part.
});

const manageConversationContextFlow = ai.defineFlow(
  {
    name: 'manageConversationContextFlow',
    inputSchema: ManageConversationContextInputSchema,
    outputSchema: ManageConversationContextOutputSchema,
  },
  async input => {
    const {userInput, conversationHistory = []} = input;
    const promptResult = await conversationContextPrompt({
      ...input,
      conversationHistory,
    });

    const response = promptResult.output!.response;
    const updatedConversationHistory = [
      ...conversationHistory,
      {role: 'user', content: userInput},
      {role: 'model', content: response},
    ];

    return {response, updatedConversationHistory};
  }
);
