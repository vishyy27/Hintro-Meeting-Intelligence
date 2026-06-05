import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/db';
import { analyzeTranscript } from '../services/ai.service';

/**
 * Creates a new meeting record.
 * Saves the meeting metadata and the initial transcript to the database.
 *
 * @param req - Express request containing title, meetingDate, and transcript.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export const createMeeting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, meetingDate, transcript } = req.body;
    const userId = req.user!.userId;

    if (!title || !meetingDate || !transcript) {
      return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Missing required fields' });
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        meetingDate: new Date(meetingDate),
        transcript: JSON.stringify(transcript),
        userId,
      },
    });

    res.status(201).json(meeting);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves a specific meeting by ID.
 * Includes all associated action items for the meeting.
 *
 * @param req - Express request containing the meeting ID in params.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export const getMeeting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: { actionItems: true },
    });

    if (!meeting || meeting.userId !== userId) {
      return next({ status: 404, code: 'NOT_FOUND', message: 'Meeting not found' });
    }

    res.json({
      ...meeting,
      transcript: JSON.parse(meeting.transcript),
      analysis: meeting.analysis ? JSON.parse(meeting.analysis) : null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Lists all meetings for the authenticated user with pagination.
 * Orders meetings by date descending.
 *
 * @param req - Express request containing page and limit in query.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export const listMeetings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const meetings = await prisma.meeting.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { meetingDate: 'desc' },
    });

    res.json(
      meetings.map((m) => ({
        ...m,
        transcript: JSON.parse(m.transcript),
        analysis: m.analysis ? JSON.parse(m.analysis) : null,
      }))
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Analyzes a meeting transcript using the AI service.
 * Extracts a summary, decisions, and action items, and persists them.
 *
 * @param req - Express request containing meeting ID in params, optionally overriding transcript in body.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export const analyzeMeeting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;

    const meeting = await prisma.meeting.findUnique({ where: { id } });

    if (!meeting || meeting.userId !== userId) {
      return next({ status: 404, code: 'NOT_FOUND', message: 'Meeting not found' });
    }

    // Support overriding transcript via req.body, else use stored transcript
    const transcriptInput =
      Array.isArray(req.body) && req.body.length > 0
        ? req.body
        : JSON.parse(meeting.transcript);

    if (!Array.isArray(transcriptInput) || transcriptInput.length === 0) {
      return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Transcript is empty or invalid' });
    }

    const analysisResult = await analyzeTranscript(transcriptInput);

    // Persist the analysis
    await prisma.meeting.update({
      where: { id },
      data: { analysis: JSON.stringify(analysisResult) },
    });

    // Persist extracted action items
    if (Array.isArray(analysisResult.actionItems)) {
      for (const item of analysisResult.actionItems) {
        await prisma.actionItem.create({
          data: {
            task: item.task,
            assignee: item.assignee || 'Unassigned',
            citations: JSON.stringify(item.citations ?? []),
            meetingId: meeting.id,
            userId,
          },
        });
      }
    }

    res.json(analysisResult);
  } catch (err) {
    next(err);
  }
};
