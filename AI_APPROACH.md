# AI Approach (`AI_APPROACH.md`)

This document details Hintro's AI integration strategy, prompt engineering, structured response generation, citation grounding, and hallucination mitigation.

---

## 1. LLM Provider Selection
We chose **Google Gemini API** (`gemini-2.5-flash` or `gemini-1.5-flash`) via the official `@google/generative-ai` SDK.
- **Rationale**: Flash models offer exceptionally low latency and high quality for summarization and feature extraction, making them perfect for real-time meeting intelligence workflows.

---

## 2. Prompt Design
To prevent output deviation, the LLM is instructed using a system instruction combined with a JSON response schema.

### System Instructions
The model is instructed to act as a precise Meeting Intelligence Assistant:
- It must summarize key discussion points.
- It must extract actionable items, assigning them to their respective owners.
- It must list major decisions made during the conversation.
- It must suggest future follow-ups.

---

## 3. Grounding & Citation Strategy
To satisfy the strict requirement of **no hallucinations** and **transparent sources**, the model must provide citations for every extracted item:
- **Citations Array**: Each summary statement, decision, and action item returned by the LLM contains a `citations` array.
- **Timestamp Ref**: The citations map directly to the `timestamp` field (formatted as `MM:SS`) of the matching transcript segment(s).
- **Rule Enforcement**: In the system prompt, the AI is instructed:
  > "Every extracted summary, action item, or decision must include a citations array referencing the exact timestamp(s) from which the insight was derived. If an item cannot be traced to a specific timestamp, do not include it."

---

## 4. Hallucination Prevention Approach
We implement two layers of defense:
1. **Instruction constraints**: The model is forbidden from inventing attendees, tasks, or decisions not present in the transcript.
2. **Strict schema enforcement**: The API forces structural conformity. If the AI attempts to output unstructured prose or omit citation arrays, the payload validation throws an error, prompting a clean fail instead of digesting false data.

---

## 5. Output Validation Strategy
Rather than relying on post-generation regex parsing (which is fragile and prone to JSON parsing errors), we leverage **Gemini's Structured Outputs**:
- We pass a JSON Schema definition (`responseSchema`) using Gemini's native `SchemaType` properties (e.g., `SchemaType.OBJECT`, `SchemaType.ARRAY`, `SchemaType.STRING`).
- This guarantees that the response returned by the API matches the TypeScript interfaces perfectly.
- On our backend, we parse the structured string using Zod to validate properties at runtime before database insertion.

---

## 6. Known Limitations
- **Large Transcripts**: Extremely long meetings (e.g., several hours) may exceed context token limits or require chunking strategies.
- **Cross-talk & Conversational Overlap**: When multiple speakers speak at the same timestamp, the LLM might struggle to attribute citations correctly.
- **Time Formatting**: If transcripts contain absolute wall-clock times (e.g., `10:30 AM`) instead of relative timestamps (`MM:SS`), the validation middleware will reject them unless they are converted beforehand.
