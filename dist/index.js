"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const meeting_routes_1 = __importDefault(require("./routes/meeting.routes"));
const actionItem_routes_1 = __importDefault(require("./routes/actionItem.routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const traceability_1 = require("./middlewares/traceability");
const responseInterceptor_1 = require("./middlewares/responseInterceptor");
const reminder_job_1 = require("./jobs/reminder.job");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("./swagger.json"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(traceability_1.traceabilityMiddleware);
app.use(responseInterceptor_1.responseInterceptor);
// Swagger API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
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
        deployedUrl: 'https://hintro-backend.onrender.com',
        externalIntegration: 'Discord Webhook',
        features: ['Authentication', 'AI Analysis', 'Reminder Scheduler'],
    });
});
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/meetings', meeting_routes_1.default);
app.use('/api/action-items', actionItem_routes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Start the background cron job for overdue alerts
    (0, reminder_job_1.initReminderJob)();
});
