// src/ai/flows/generate-project-report.ts
'use server';

/**
 * @fileOverview Generates a project report from data.
 *
 * - generateProjectReport - Generates a comprehensive report from project data.
 * - GenerateProjectReportInput - The input type for the generateProjectReport function.
 * - GenerateProjectReportOutput - The return type for the generateProjectReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProjectReportInputSchema = z.object({
  projectData: z
    .string()
    .describe('The project data from Firebase as a JSON string.'),
});

export type GenerateProjectReportInput = z.infer<typeof GenerateProjectReportInputSchema>;

const ReportSectionSchema = z.object({
  title: z.string().describe('The title of the report section.'),
  content: z.string().describe('The content of the report section in plain text.'),
  icon: z.string().optional().describe('An appropriate icon name from lucide-react, e.g., "LineChart" or "Users".'),
});

const GenerateProjectReportOutputSchema = z.object({
  report: z.array(ReportSectionSchema).describe('The generated project report, broken down into sections.'),
});

export type GenerateProjectReportOutput = z.infer<typeof GenerateProjectReportOutputSchema>;

export async function generateProjectReport(input: GenerateProjectReportInput): Promise<GenerateProjectReportOutput> {
  return generateProjectReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProjectReportPrompt',
  input: {schema: GenerateProjectReportInputSchema},
  output: {schema: GenerateProjectReportOutputSchema},
  prompt: `You are an expert project analyst. Given the following project data in JSON format, generate a comprehensive report.

The report should include:
1.  A high-level summary of the entire project portfolio. Use the "FileText" icon.
2.  A breakdown of projects by category, including counts and key highlights. Use the "FolderTree" icon.
3.  An analysis of team distribution, identifying key contacts and their project load. Use the "Users" icon.
4.  An overview of the different Revit versions being used across projects. Use the "Library" icon.
5.  Any potential risks or inconsistencies you identify in the data (e.g., missing information, unusual data points). Use the "AlertTriangle" icon.

Format the report clearly with a title and content for each section. For each section, suggest an appropriate icon from the lucide-react library.

Project Data:
{{{projectData}}}
`,
});

const generateProjectReportFlow = ai.defineFlow(
  {
    name: 'generateProjectReportFlow',
    inputSchema: GenerateProjectReportInputSchema,
    outputSchema: GenerateProjectReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
