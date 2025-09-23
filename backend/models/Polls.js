const mongoose = require("mongoose");
const PollSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  question: { type: String, required: true },
  options: [
    {
      text: String,
      votes: { type: Number, default: 0 } // aggregate count
    }
  ],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
});

module.exports = mongoose.model("Polls", PollSchema);