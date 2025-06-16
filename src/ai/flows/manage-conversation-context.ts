
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

const conversationContextPrompt = ai.definePrompt({
  name: 'conversationContextPrompt',
  input: {schema: ManageConversationContextInputSchema},
  output: {schema: ManageConversationContextOutputSchema},
  prompt: `You are AbduDev AI, a helpful and friendly AI assistant trained by Abdullah Developers. Your primary goal is to assist the user. Engage in a conversation with the user, remembering previous turns. Please use emojis appropriately in your responses to make the conversation more engaging. When you respond, please identify and emphasize important words or phrases by wrapping them in double asterisks, like **this**.

If the user asks you to create, draw, or generate an image, your response **must** be ONLY the specific instruction \`[GENERATE_IMAGE: <detailed description of the image they want>]\`. Do not add any other text or pleasantries around this instruction if you are issuing it. For example, if the user says 'draw a happy dog', you should respond with: \`[GENERATE_IMAGE: a happy dog playing in a sunny park]\`.

If the user asks a question about an image they attached, answer it directly based on the image. If the user's request is ambiguous about whether to generate an image or answer a question about an attachment, prioritize answering about the attachment if one is present.

{% if conversationHistory.length > 0 %}
Previous conversation:
{% for turn in conversationHistory %}
{{turn.role}}: {{turn.content}}
{% endfor %}
{% endif %}

user: {{{userInput}}}
{% if attachmentDataUri %}
(The user has attached the following image. Please consider it in your response if relevant to the query.)
Attached Image: {{media url=attachmentDataUri}}
{% endif %}

assistant:`,
config: {
    // Adjusted safety settings if needed, especially for image related queries.
    // For instance, if image generation is too restrictive or if analyzing images leads to blocks.
    // Example: Allow more leniency for dangerous content if it's about analyzing images of tools, etc.
    // This is highly dependent on the use case. For now, default safety settings will apply.
    // safetySettings: [
    //   {
    //     category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    //     threshold: 'BLOCK_ONLY_HIGH',
    //   },
    // ],
  }
});

const manageConversationContextFlow = ai.defineFlow(
  {
    name: 'manageConversationContextFlow',
    inputSchema: ManageConversationContextInputSchema,
    outputSchema: ManageConversationContextOutputSchema,
  },
  async input => {
    const {userInput, conversationHistory = [], attachmentDataUri} = input;
    const promptInput = {
      userInput,
      conversationHistory,
      ...(attachmentDataUri && { attachmentDataUri }), // only include if present
    };

    const promptResult = await conversationContextPrompt(promptInput);

    const response = promptResult.output!.response;
    const updatedConversationHistory = [
      ...conversationHistory,
      {role: 'user', content: userInput},
      {role: 'model', content: response},
    ];

    return {response, updatedConversationHistory};
  }
);
