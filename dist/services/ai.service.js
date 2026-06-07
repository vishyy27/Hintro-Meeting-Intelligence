"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTranscript = void 0;
const logger_1 = require("../utils/logger");
/**
 * Analyzes a meeting transcript using OpenRouter API with a specified LLM.
 * Returns structured JSON containing summary, action items, decisions, and follow-ups.
 *
 * @param transcriptSegments - Array of transcript segments to process.
 * @returns Structured AnalysisResult object.
 */
const analyzeTranscript = async (transcriptSegments) => {
    logger_1.logger.info(`Starting OpenRouter AI analysis for ${transcriptSegments.length} segments`);
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelName = process.env.AI_MODEL || 'google/gemma-4-31b-it:free';
    if (!apiKey) {
        logger_1.logger.error('OPENROUTER_API_KEY is not defined in environment variables');
        throw new Error('AI Analysis Configuration Error');
    }
    const prompt = `
    Analyze the following meeting transcript and extract:
    1. A list of summary points
    2. Action items (task and assignee)
    3. Decisions made
    4. Follow-up suggestions

    Crucially, you MUST provide precise citations for every single generated insight. A citation is the exact "timestamp" of the transcript segment(s) that justify the insight.
    Do not invent attendees, do not invent action items, and do not hallucinate any information not explicitly present in the transcript.

    Format your output as a JSON object matching this schema:
    {
      "summary": [
        { "text": "...", "citations": [{ "timestamp": "MM:SS" }] }
      ],
      "actionItems": [
        { "task": "...", "assignee": "...", "citations": [{ "timestamp": "MM:SS" }] }
      ],
      "decisions": [
        { "text": "...", "citations": [{ "timestamp": "MM:SS" }] }
      ],
      "followUpSuggestions": [
        { "text": "...", "citations": [{ "timestamp": "MM:SS" }] }
      ]
    }

    Transcript:
    ${JSON.stringify(transcriptSegments, null, 2)}
  `;
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://github.com/vishyy27/Hintro-Meeting-Intelligence',
                'X-Title': 'Hintro Meeting Intelligence',
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a precise Meeting Intelligence Assistant. You always output valid, parseable JSON matching the requested schema and containing accurate MM:SS citations grounded in the transcript.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API responded with status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('OpenRouter response did not contain content');
        }
        logger_1.logger.info('OpenRouter AI analysis completed successfully');
        return JSON.parse(content);
    }
    catch (error) {
        logger_1.logger.error('Error calling OpenRouter API:', error);
        throw new Error('AI Analysis Failed');
    }
};
exports.analyzeTranscript = analyzeTranscript;
