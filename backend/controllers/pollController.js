const Poll = require("../models/Polls");
// Create a new poll
const createPoll = async (req, res) => {
    try {
        // Assume Poll is a Mongoose model
        const poll = new Poll(req.body);
        console.log("Creating poll with data:", req.body);
        await poll.save();
        console.log("Poll created:", poll._id);
        res.status(201).json(poll);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// List all polls for a specific session
const listPolls = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const polls = await Poll.find({ sessionId });
        res.json(polls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Update a poll by ID
const updatePoll = async (req, res) => {
    try {
        const poll = await Poll.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!poll) return res.status(404).json({ error: 'Poll not found' });
        res.json(poll);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get a poll by ID
const getPollById = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });
        res.json(poll);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a poll by ID
const deletePoll = async (req, res) => {
    try {
        const poll = await Poll.findByIdAndDelete(req.params.id);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });
        res.json({ message: 'Poll deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const getPollResults = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.pollId);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });
        // Assuming poll.results contains the results data
        res.json(poll.results);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }       
};

const endPoll = async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.pollId);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });
        poll.isActive = false;
        await poll.save();
        res.json({ message: 'Poll ended successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = {
    createPoll,
    listPolls,
    updatePoll,
    getPollById,
    deletePoll,
    getPollResults,
    endPoll
};