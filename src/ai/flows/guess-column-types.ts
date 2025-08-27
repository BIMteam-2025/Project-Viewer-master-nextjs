// src/ai/flows/guess-column-types.ts
'use server';

/**
 * @fileOverview Guesses the column types in a CSV file.
 *
 * - guessColumnTypes - Guesses the column types in a CSV file.
 * - GuessColumnTypesInput - The input type for the guessColumnTypes function.
 * - GuessColumnTypesOutput - The return type for the guessColumnTypes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GuessColumnTypesInputSchema = z.object({
  csvData: z
    .string()
    .describe('The data from the CSV file as a string.'),
});

export type GuessColumnTypesInput = z.infer<typeof GuessColumnTypesInputSchema>;

const GuessColumnTypesOutputSchema = z.object({
  columnTypes: z.array(
    z.enum(['string', 'number', 'boolean', 'date'])
  ).describe('An array of the guessed column types for the CSV data.')
});

export type GuessColumnTypesOutput = z.infer<typeof GuessColumnTypesOutputSchema>;

export async function guessColumnTypes(input: GuessColumnTypesInput): Promise<GuessColumnTypesOutput> {
  return guessColumnTypesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'guessColumnTypesPrompt',
  input: {schema: GuessColumnTypesInputSchema},
  output: {schema: GuessColumnTypesOutputSchema},
  prompt: `You are an expert data analyst. Given the following CSV data, determine the type of each column. Possible types are string, number, boolean, and date. Return a JSON array of the column types. CSV Data: {{{csvData}}}`,
});

const guessColumnTypesFlow = ai.defineFlow(
  {
    name: 'guessColumnTypesFlow',
    inputSchema: GuessColumnTypesInputSchema,
    outputSchema: GuessColumnTypesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
