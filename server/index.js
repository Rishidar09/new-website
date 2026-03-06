require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use((req, res, next) => {
    console.log(`[Request]: ${req.method} ${req.url}`);
    next();
});
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Attach io to req for use in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/holidays', require('./routes/holidays'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/offer-letters', require('./routes/offerLetters'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/drive', require('./routes/drive'));

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    socket.on('send_message', (data) => {
        // Broadcast to specific room (group or 1-1)
        io.to(data.roomId).emit('receive_message', data);
    });

    socket.on('send_meeting_chat', (data) => {
        socket.to(data.roomId).emit('receive_meeting_chat', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Test Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'IndusInnovate Server Running', database: 'Connected' });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
