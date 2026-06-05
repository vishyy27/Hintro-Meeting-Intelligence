"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeMeeting = exports.listMeetings = exports.getMeeting = exports.createMeeting = void 0;
const db_1 = __importDefault(require("../utils/db"));
const ai_service_1 = require("../services/ai.service");
/**
 * Creates a new meeting record.
 * Saves the meeting metadata and the initial transcript to the database.
 *
 * @param req - Express request containing title, meetingDate, and transcript.
 * @param res - Express response object.
 * @param next - Express next function.
 */
const createMeeting = async (req, res, next) => {
    try {
        const { title, meetingDate, transcript } = req.body;
        const userId = req.user.userId;
        if (!title || !meetingDate || !transcript) {
            return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Missing required fields' });
        }
        const meeting = await db_1.default.meeting.create({
            data: {
                title,
                meetingDate: new Date(meetingDate),
                transcript: JSON.stringify(transcript),
                userId,
            },
        });
        res.status(201).json(meeting);
    }
    catch (err) {
        next(err);
    }
};
exports.createMeeting = createMeeting;
/**
 * Retrieves a specific meeting by ID.
 * Includes all associated action items for the meeting.
 *
 * @param req - Express request containing the meeting ID in params.
 * @param res - Express response object.
 * @param next - Express next function.
 */
const getMeeting = async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const userId = req.user.userId;
        const meeting = await db_1.default.meeting.findUnique({
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
    }
    catch (err) {
        next(err);
    }
};
exports.getMeeting = getMeeting;
/**
 * Lists all meetings for the authenticated user with pagination.
 * Orders meetings by date descending.
 *
 * @param req - Express request containing page and limit in query.
 * @param res - Express response object.
 * @param next - Express next function.
 */
const listMeetings = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const meetings = await db_1.default.meeting.findMany({
            where: { userId },
            skip,
            take: limit,
            orderBy: { meetingDate: 'desc' },
        });
        res.json(meetings.map((m) => ({
            ...m,
            transcript: JSON.parse(m.transcript),
            analysis: m.analysis ? JSON.parse(m.analysis) : null,
        })));
    }
    catch (err) {
        next(err);
    }
};
exports.listMeetings = listMeetings;
/**
 * Analyzes a meeting transcript using the AI service.
 * Extracts a summary, decisions, and action items, and persists them.
 *
 * @param req - Express request containing meeting ID in params, optionally overriding transcript in body.
 * @param res - Express response object.
 * @param next - Express next function.
 */
const analyzeMeeting = async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const userId = req.user.userId;
        const meeting = await db_1.default.meeting.findUnique({ where: { id } });
        if (!meeting || meeting.userId !== userId) {
            return next({ status: 404, code: 'NOT_FOUND', message: 'Meeting not found' });
        }
        // Support overriding transcript via req.body, else use stored transcript
        const transcriptInput = Array.isArray(req.body) && req.body.length > 0
            ? req.body
            : JSON.parse(meeting.transcript);
        if (!Array.isArray(transcriptInput) || transcriptInput.length === 0) {
            return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Transcript is empty or invalid' });
        }
        const analysisResult = await (0, ai_service_1.analyzeTranscript)(transcriptInput);
        // Persist the analysis
        await db_1.default.meeting.update({
            where: { id },
            data: { analysis: JSON.stringify(analysisResult) },
        });
        // Persist extracted action items
        if (Array.isArray(analysisResult.actionItems)) {
            for (const item of analysisResult.actionItems) {
                await db_1.default.actionItem.create({
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
    }
    catch (err) {
        next(err);
    }
};
exports.analyzeMeeting = analyzeMeeting;
