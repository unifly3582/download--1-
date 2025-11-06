'use server';

/**
 * @fileOverview A data search flow that uses an LLM to interpret natural language queries and identify relevant data.
 *
 * - dataSearchWithLLM - A function that handles the data search process using natural language queries.
 * - DataSearchWithLLMInput - The input type for the dataSearchWithLLM function.
 * - DataSearchWithLLMOutput - The return type for the dataSearchWithLLM function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DataSearchWithLLMInputSchema = z.object({
  query: z.string().describe('The natural language search query.'),
});
export type DataSearchWithLLMInput = z.infer<typeof DataSearchWithLLMInputSchema>;

const DataSearchWithLLMOutputSchema = z.object({
  searchResult: z.string().describe('The search results based on the query.'),
});
export type DataSearchWithLLMOutput = z.infer<typeof DataSearchWithLLMOutputSchema>;

export async function dataSearchWithLLM(input: DataSearchWithLLMInput): Promise<DataSearchWithLLMOutput> {
  return dataSearchWithLLMFlow(input);
}

const dataSearchPrompt = ai.definePrompt({
  name: 'dataSearchPrompt',
  input: {schema: DataSearchWithLLMInputSchema},
  output: {schema: DataSearchWithLLMOutputSchema},
  prompt: `You are an assistant designed to help admins find specific data across all modules.

  Based on the user's query, identify the relevant data and provide the search results.

  Query: {{{query}}} `,
});

const dataSearchWithLLMFlow = ai.defineFlow(
  {
    name: 'dataSearchWithLLMFlow',
    inputSchema: DataSearchWithLLMInputSchema,
    outputSchema: DataSearchWithLLMOutputSchema,
  },
  async input => {
    const {output} = await dataSearchPrompt(input);
    return output!;
  }
);
