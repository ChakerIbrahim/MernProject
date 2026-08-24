/**
 * server.js
 * Main entry point for the Express API.
 * Configures global middleware, routes, error handling, and Socket.io.
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.resolve(__dirname, '../server.env'), override: true });
const { reportEnvironment } = require('./config/env.config');
const { formatErrorResponse } = require('./config/error-response');
reportEnvironment();
require('./config/mongoose.config');

const app = express();

const allowedOrigin = (process.env.CLIENT_ORIGIN || '')
    .split(',')[0]
    .trim();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({ crossOriginResourcePolicy: false })); // allow serving uploads to other origins
app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
        // Non-browser tools such as Postman do not send an Origin header.
        if (!origin || origin === allowedOrigin) {
            return callback(null, true);
        }
        return callback(new Error('Origin is not allowed by CORS'));
    }
}));
app.use('/uploads', express.static('uploads'));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'تم تجاوز عدد الطلبات المسموح به. حاول مرة أخرى لاحقاً.' }
});
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
    res.json({ message: "backend is healthy" });
});

require('./routes/auth.routes')(app);
require('./routes/admin.routes')(app);
require('./routes/tender.routes')(app);
require('./routes/proposal.routes')(app);
require('./routes/ai.routes')(app);
require('./routes/auction.routes')(app);
require('./routes/chat.routes')(app);

// Global error middleware must be last
// Catches all forwarded errors and formats them into a consistent JSON response.
// Does not return or throw; ends the request with an appropriate HTTP status.
app.use((err, req, res, next) => {
    const result = formatErrorResponse(err);
    if (result.shouldLog) console.error(err);
    return res.status(result.status).json(result.body);
});

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => console.log(`server is running on port ${PORT}`));

// Initialize Socket.io
const socket = require('./socket');
socket.init(server, allowedOrigin);
