const mongoose = require("mongoose");

const BroadcastAnalyticsSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    broadcastId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    // View tracking
    totalViews: {
      type: Number,
      default: 0,
    },
    viewedByUsers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: String,
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Reaction tracking
    reactionStats: {
      "👍": { type: Number, default: 0 },
      "❤️": { type: Number, default: 0 },
      "🎉": { type: Number, default: 0 },
      "✅": { type: Number, default: 0 },
    },

    reactionDetails: [
      {
        emoji: { type: String, required: true },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: String,
        reactedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // File tracking
    fileStats: [
      {
        fileId: String,
        fileName: String,
        type: String, // pdf, ppt, pptx, image
        downloads: { type: Number, default: 0 },
        downloadedBy: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            userName: String,
            downloadedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],

    // URL tracking
    urlStats: [
      {
        url: { type: String, required: true },
        clicks: { type: Number, default: 0 },
        clickedBy: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            userName: String,
            clickedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],

    // Engagement score (calculated from views + reactions)
    engagementScore: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Index for efficient queries
BroadcastAnalyticsSchema.index({ sessionId: 1, broadcastId: 1 });
BroadcastAnalyticsSchema.index({ sessionId: 1, createdAt: -1 });

// Pre-save hook to calculate engagement score
BroadcastAnalyticsSchema.pre("save", function (next) {
  // Engagement score = views + (total reactions * 2) + (total downloads * 1.5) + (total clicks * 1)
  const totalReactions = Object.values(this.reactionStats).reduce(
    (a, b) => a + b,
    0,
  );
  const totalDownloads = this.fileStats.reduce(
    (sum, file) => sum + file.downloads,
    0,
  );
  const totalClicks = this.urlStats.reduce((sum, url) => sum + url.clicks, 0);

  this.engagementScore =
    this.totalViews +
    totalReactions * 2 +
    totalDownloads * 1.5 +
    totalClicks * 1;

  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("BroadcastAnalytics", BroadcastAnalyticsSchema);
