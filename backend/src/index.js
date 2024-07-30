const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const Review = require('./reviewModel'); // Ensure you have this model defined

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3001", // Change this to your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});



// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/live-reviews?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


// Middleware
app.use(cors());
app.use(express.json());

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Broadcast update
const broadcastUpdate = (eventType, data) => {
    io.emit('review-update', { eventType, data });
};

// Routes
app.post('/reviews', async (req, res) => {
    const { title, content } = req.body;
    const newReview = new Review({ title, content });
    await newReview.save();
    broadcastUpdate('add', newReview);
    res.status(201).send(newReview);
});

app.get('/reviews', async (req, res) => {
    const reviews = await Review.find().sort({ dateTime: -1 });
    res.send(reviews);
});

app.get('/reviews/:id', async (req, res) => {
    const review = await Review.findById(req.params.id);
    res.send(review);
});

app.put('/reviews/:id', async (req, res) => {
    const { title, content } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
    broadcastUpdate('edit', review);
    res.send(review);
});

app.delete('/reviews/:id', async (req, res) => {
    const review = await Review.findByIdAndDelete(req.params.id);
    broadcastUpdate('delete', review);
    res.status(204).send();
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
