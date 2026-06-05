import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { logger } from '../utils/logger';

// Initialize Gemini
// Ensure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING },
          citations: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: { timestamp: { type: SchemaType.STRING } }
            }
          }
        }
      }
    },
    actionItems: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          task: { type: SchemaType.STRING },
          assignee: { type: SchemaType.STRING },
          citations: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: { timestamp: { type: SchemaType.STRING } }
            }
          }
        }
      }
    },
    decisions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING },
          citations: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: { timestamp: { type: SchemaType.STRING } }
            }
          }
        }
      }
    },
    followUpSuggestions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING },
          citations: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: { timestamp: { type: SchemaType.STRING } }
            }
          }
        }
      }
    }
  },
  required: ['summary', 'actionItems', 'decisions', 'followUpSuggestions']
};

export const analyzeTranscript = async (transcriptSegments: any[]) => {
  logger.info(`Starting AI analysis for ${transcriptSegments.length} segments`);
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.2
    }
  });

  const prompt = `
    Analyze the following meeting transcript and extract the summary, action items, decisions, and follow-up suggestions.
    Crucially, you MUST provide precise citations for every single generated insight. A citation is the exact "timestamp" of the transcript segment(s) that justify the insight.
    Do not invent attendees, do not invent action items, and do not hallucinate any information not explicitly present in the transcript.
    
    Transcript:
    ${JSON.stringify(transcriptSegments, null, 2)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    logger.info('AI analysis completed successfully');
    return JSON.parse(responseText);
  } catch (error) {
    logger.error('Error calling Gemini API:', error);
    throw new Error('AI Analysis Failed');
  }
};
