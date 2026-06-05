"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTranscript = void 0;
const generative_ai_1 = require("@google/generative-ai");
const logger_1 = require("../utils/logger");
// Initialize Gemini
// Ensure GEMINI_API_KEY is in your .env file
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');
const responseSchema = {
    type: generative_ai_1.SchemaType.OBJECT,
    properties: {
        summary: {
            type: generative_ai_1.SchemaType.ARRAY,
            items: {
                type: generative_ai_1.SchemaType.OBJECT,
                properties: {
                    text: { type: generative_ai_1.SchemaType.STRING },
                    citations: {
                        type: generative_ai_1.SchemaType.ARRAY,
                        items: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: { timestamp: { type: generative_ai_1.SchemaType.STRING } }
                        }
                    }
                }
            }
        },
        actionItems: {
            type: generative_ai_1.SchemaType.ARRAY,
            items: {
                type: generative_ai_1.SchemaType.OBJECT,
                properties: {
                    task: { type: generative_ai_1.SchemaType.STRING },
                    assignee: { type: generative_ai_1.SchemaType.STRING },
                    citations: {
                        type: generative_ai_1.SchemaType.ARRAY,
                        items: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: { timestamp: { type: generative_ai_1.SchemaType.STRING } }
                        }
                    }
                }
            }
        },
        decisions: {
            type: generative_ai_1.SchemaType.ARRAY,
            items: {
                type: generative_ai_1.SchemaType.OBJECT,
                properties: {
                    text: { type: generative_ai_1.SchemaType.STRING },
                    citations: {
                        type: generative_ai_1.SchemaType.ARRAY,
                        items: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: { timestamp: { type: generative_ai_1.SchemaType.STRING } }
                        }
                    }
                }
            }
        },
        followUpSuggestions: {
            type: generative_ai_1.SchemaType.ARRAY,
            items: {
                type: generative_ai_1.SchemaType.OBJECT,
                properties: {
                    text: { type: generative_ai_1.SchemaType.STRING },
                    citations: {
                        type: generative_ai_1.SchemaType.ARRAY,
                        items: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: { timestamp: { type: generative_ai_1.SchemaType.STRING } }
                        }
                    }
                }
            }
        }
    },
    required: ['summary', 'actionItems', 'decisions', 'followUpSuggestions']
};
const analyzeTranscript = async (transcriptSegments) => {
    logger_1.logger.info(`Starting AI analysis for ${transcriptSegments.length} segments`);
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
        logger_1.logger.info('AI analysis completed successfully');
        return JSON.parse(responseText);
    }
    catch (error) {
        logger_1.logger.error('Error calling Gemini API:', error);
        throw new Error('AI Analysis Failed');
    }
};
exports.analyzeTranscript = analyzeTranscript;
