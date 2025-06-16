'use server';
/**
 * @fileOverview Generates text from a user-provided prompt using the Gemini API.
 *
 * - generateText - A function that takes a text prompt and returns a generated text response.
 * - GenerateTextFromPromptInput - The input type for the generateText function.
 * - GenerateTextFromPromptOutput - The return type for the generateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTextFromPromptInputSchema = z.object({
  prompt: z.string().describe('The text prompt to send to the Gemini API.'),
});
export type GenerateTextFromPromptInput = z.infer<typeof GenerateTextFromPromptInputSchema>;

const GenerateTextFromPromptOutputSchema = z.object({
  response: z.string().describe('The text response from the Gemini API.'),
});
export type GenerateTextFromPromptOutput = z.infer<typeof GenerateTextFromPromptOutputSchema>;

export async function generateText(input: GenerateTextFromPromptInput): Promise<GenerateTextFromPromptOutput> {
  return generateTextFromPromptFlow(input);
}

const generateTextFromPrompt = ai.definePrompt({
  name: 'generateTextFromPrompt',
  input: {schema: GenerateTextFromPromptInputSchema},
  output: {schema: GenerateTextFromPromptOutputSchema},
  prompt: `{{prompt}}`,
});

const generateTextFromPromptFlow = ai.defineFlow(
  {
    name: 'generateTextFromPromptFlow',
    inputSchema: GenerateTextFromPromptInputSchema,
    outputSchema: GenerateTextFromPromptOutputSchema,
  },
  async input => {
    const {text} = await generateTextFromPrompt(input);
    return {response: text!};
  }
);
