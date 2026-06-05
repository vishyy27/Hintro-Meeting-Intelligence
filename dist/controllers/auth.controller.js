"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../utils/db"));
/**
 * Registers a new user.
 * Hashes the password and generates a JWT token upon successful registration.
 *
 * @param req - Express request object containing email, password, and name in body.
 * @param res - Express response object.
 * @param next - Express next function for error handling.
 */
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Email and password are required' });
        }
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return next({ status: 400, code: 'VALIDATION_ERROR', message: 'User already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await db_1.default.user.create({
            data: { email, password: hashedPassword, name }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        // responseInterceptor wraps this into { traceId, success: true, data: ... }
        res.json({ user: { id: user.id, email: user.email }, token });
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
/**
 * Authenticates a user and generates a JWT token.
 * Validates the email and password against the database.
 *
 * @param req - Express request object containing email and password in body.
 * @param res - Express response object.
 * @param next - Express next function for error handling.
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Email and password are required' });
        }
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return next({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid) {
            return next({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
        res.json({ user: { id: user.id, email: user.email }, token });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
