import { Request, Response, NextFunction } from 'express';
import * as aiService from '../../src/services/ai.service';

jest.mock('../../src/utils/db', () => ({
  __esModule: true,
  default: require('jest-mock-extended').mockDeep(),
}));
jest.mock('../../src/services/ai.service');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import { analyzeMeeting } from '../../src/controllers/meeting.controller';
import prisma from '../../src/utils/db';

const prismaMock = prisma as any;

describe('Meeting Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      params: { id: 'meeting-123' },
      user: { userId: 'user-456' },
      body: [],
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('analyzeMeeting', () => {
    it('should successfully analyze a meeting and create action items', async () => {
      const mockMeeting = {
        id: 'meeting-123',
        userId: 'user-456',
        title: 'Sync',
        meetingDate: new Date(),
        createdAt: new Date(),
        transcript: JSON.stringify([{ speaker: 'A', text: 'Task', timestamp: '00:00' }]),
        analysis: null,
      };

      const mockAnalysisResult = {
        summary: [{ text: 'Sum', citations: [] }],
        actionItems: [{ task: 'Do something', assignee: 'A', citations: [] }],
        decisions: [],
        followUpSuggestions: [],
      };

      prismaMock.meeting.findUnique.mockResolvedValue(mockMeeting);
      jest.spyOn(aiService, 'analyzeTranscript').mockResolvedValue(mockAnalysisResult);
      prismaMock.meeting.update.mockResolvedValue(mockMeeting);
      prismaMock.actionItem.create.mockResolvedValue({} as any);

      await analyzeMeeting(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.meeting.findUnique).toHaveBeenCalledWith({ where: { id: 'meeting-123' } });
      expect(aiService.analyzeTranscript).toHaveBeenCalled();
      expect(prismaMock.meeting.update).toHaveBeenCalledWith({
        where: { id: 'meeting-123' },
        data: { analysis: JSON.stringify(mockAnalysisResult) },
      });
      expect(prismaMock.actionItem.create).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith(mockAnalysisResult);
    });

    it('should return 404 if meeting not found or unauthorized', async () => {
      prismaMock.meeting.findUnique.mockResolvedValue(null);

      await analyzeMeeting(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        status: 404,
        message: 'Meeting not found',
      }));
    });
  });
});
