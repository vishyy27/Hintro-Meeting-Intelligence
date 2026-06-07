import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import meetingRoutes from './routes/meeting.routes';
import actionItemRoutes from './routes/actionItem.routes';
import { errorHandler } from './middlewares/errorHandler';
import { traceabilityMiddleware } from './middlewares/traceability';
import { responseInterceptor } from './middlewares/responseInterceptor';
import { initReminderJob } from './jobs/reminder.job';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

const app = express();

app.use(cors());
app.use(express.json());

app.use(traceabilityMiddleware);
app.use(responseInterceptor);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Public Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Candidate Evaluation Endpoint
app.get('/api/evaluation', (req, res) => {
  res.json({
    candidateName: 'D Vishwanath',
    email: 'dvishwas108@gmail.com',
    repositoryUrl: 'https://github.com/vishyy27/Hintro-Meeting-Intelligence',
    deployedUrl: 'https://hintro-meeting-intelligence-hh41.onrender.com',
    externalIntegration: 'Slack Webhook',
    features: [
      'JWT Authentication',
      'Meeting Management with Pagination',
      'AI Meeting Analysis with Citation Grounding',
      'Action Item Management',
      'Overdue Detection',
      'Scheduled Reminder Job (node-cron)',
      'Slack Webhook Integration',
      'Swagger/OpenAPI Documentation',
      'Input Validation (Zod)',
      'Structured Logging with Trace IDs'
    ],
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/action-items', actionItemRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Start the background cron job for overdue alerts
  initReminderJob();
});
