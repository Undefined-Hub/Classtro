const Session = require("../../models/Session");
const { fetchMultipleUrlMetadata } = require("../../utils/urlMetadata");

jest.mock("../../models/Session", () => ({
  findById: jest.fn(),
}));

jest.mock("../../models/BroadcastAnalytics", () => jest.fn());

jest.mock("../../utils/urlMetadata", () => ({
  fetchMultipleUrlMetadata: jest.fn(),
}));

jest.mock("../../socket", () => ({
  getSessionNamespace: jest.fn(() => ({
    to: jest.fn(() => ({ emit: jest.fn() })),
  })),
}));

const {
  addBroadcast,
  getBroadcasts,
  deleteBroadcast,
  addReaction,
} = require("../../controllers/broadcastController");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("broadcastController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("addBroadcast returns 400 for empty message", async () => {
    const req = { params: { sessionId: "s1" }, body: { message: "" }, query: {}, files: [] };
    const res = createMockRes();
    const next = jest.fn();

    await addBroadcast(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Message is required" });
  });

  it("addBroadcast returns 403 if requester is not host", async () => {
    Session.findById.mockResolvedValueOnce({
      teacherId: { toString: () => "teacher-1" },
    });

    const req = {
      params: { sessionId: "s1" },
      body: { message: "hello" },
      query: {},
      files: [],
      user: { id: "other-user" },
    };
    const res = createMockRes();
    const next = jest.fn();

    await addBroadcast(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("getBroadcasts returns sorted broadcasts", async () => {
    Session.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        broadcasts: [
          { _id: "b1", timestamp: new Date("2026-01-01") },
          { _id: "b2", timestamp: new Date("2026-01-02") },
        ],
      }),
    });

    const req = { params: { sessionId: "s1" } };
    const res = createMockRes();
    const next = jest.fn();

    await getBroadcasts(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 2,
        broadcasts: [expect.objectContaining({ _id: "b2" }), expect.objectContaining({ _id: "b1" })],
      }),
    );
  });

  it("deleteBroadcast returns 404 when broadcast not found", async () => {
    Session.findById.mockResolvedValueOnce({
      teacherId: { toString: () => "teacher-1" },
      broadcasts: [],
    });

    const req = {
      params: { sessionId: "s1", broadcastId: "missing" },
      user: { id: "teacher-1" },
    };
    const res = createMockRes();
    const next = jest.fn();

    await deleteBroadcast(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Broadcast not found" });
  });

  it("addReaction validates emoji", async () => {
    const req = {
      params: { sessionId: "s1", broadcastId: "b1" },
      body: { emoji: "🔥" },
      user: { id: "u1" },
    };
    const res = createMockRes();
    const next = jest.fn();

    await addReaction(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid emoji. Allowed: 👍, ❤️, 🎉, ✅" });
  });
});
