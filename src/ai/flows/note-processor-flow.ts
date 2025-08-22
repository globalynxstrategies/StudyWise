'use server';
/**
 * @fileOverview AI flow for processing notes.
 *
 * - processNote - A function that summarizes or generates questions from note content.
 * - NoteProcessorInput - The input type for the processNote function.
 * - NoteProcessorOutput - The return type for the processNote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NoteProcessorInputSchema = z.object({
  noteContent: z.string().describe('The content of the note to be processed.'),
  action: z.enum(['summarize', 'generate_questions']).describe("The action to perform on the note content."),
});
export type NoteProcessorInput = z.infer<typeof NoteProcessorInputSchema>;

const NoteProcessorOutputSchema = z.object({
  processedContent: z.string().describe('The processed content, either a summary or a list of questions in markdown format.'),
});
export type NoteProcessorOutput = z.infer<typeof NoteProcessorOutputSchema>;

export async function processNote(input: NoteProcessorInput): Promise<NoteProcessorOutput> {
  return noteProcessorFlow(input);
}

const summarizePrompt = ai.definePrompt({
    name: 'summarizeNotePrompt',
    input: { schema: NoteProcessorInputSchema },
    output: { schema: NoteProcessorOutputSchema },
    prompt: `You are an expert academic assistant. Your task is to summarize the following note content concisely. 
    Focus on the key points and main ideas. Format the output as clean markdown.
  
    Note Content:
    {{{noteContent}}}
    `,
});

const generateQuestionsPrompt = ai.definePrompt({
    name: 'generateQuestionsPrompt',
    input: { schema: NoteProcessorInputSchema },
    output: { schema: NoteProcessorOutputSchema },
    prompt: `You are an expert study guide creator. Your task is to generate 5-10 practice questions based on the following note content.
    These questions should help a student test their understanding of the material. Include a mix of question types if possible (e.g., definitions, concepts, analysis).
    Format the output as a numbered list in clean markdown.
  
    Note Content:
    {{{noteContent}}}
    `,
});

const noteProcessorFlow = ai.defineFlow(
  {
    name: 'noteProcessorFlow',
    inputSchema: NoteProcessorInputSchema,
    outputSchema: NoteProcessorOutputSchema,
  },
  async (input) => {
    if (input.action === 'summarize') {
      const { output } = await summarizePrompt(input);
      return output!;
    } else {
      const { output } = await generateQuestionsPrompt(input);
      return output!;
    }
  }
);
