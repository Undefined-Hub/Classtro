const SessionFeedback = require("../../models/SessionFeedback");
const Session = require("../../models/Session");
const { validateInput } = require("../../utils/validateInput");

jest.mock("../../models/SessionFeedback", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
}));

jest.mock("../../models/Session", () => ({
  findById: jest.fn(),
}));

jest.mock("../../utils/validateInput", () => ({
  validateInput: jest.fn((schema, value) => value),
}));

const {
  submitSessionFeedback,
  getSessionFeedback,
} = require("../../controllers/sessionFeedbackController");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("sessionFeedbackController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submitSessionFeedback returns 404 if session does not exist", async () => {
    Session.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = {
      params: { sessionId: "s404" },
      user: { id: "u1" },
      body: { rating: 5, description: "great" },
    };
    const res = createMockRes();

    await submitSessionFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Session not found" }),
    );
  });

  it("submitSessionFeedback returns 400 for active session", async () => {
    Session.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ isActive: true }),
    });

    const req = {
      params: { sessionId: "s1" },
      user: { id: "u1" },
      body: { rating: 4, description: "good" },
    };
    const res = createMockRes();

    await submitSessionFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Feedback can only be submitted for ended sessions" }),
    );
  });

  it("submitSessionFeedback creates feedback on valid payload", async () => {
    Session.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        isActive: false,
        roomId: "r1",
      }),
    });
    SessionFeedback.findOne.mockResolvedValueOnce(null);
    SessionFeedback.create.mockResolvedValueOnce({
      _id: "f1",
      rating: 5,
      submittedAt: new Date("2026-01-01"),
    });

    const req = {
      params: { sessionId: "s1" },
      user: { id: "u1" },
      body: { rating: 5, description: "awesome" },
    };
    const res = createMockRes();

    await submitSessionFeedback(req, res);

    expect(SessionFeedback.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("getSessionFeedback returns 403 for non-host", async () => {
    Session.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        teacherId: { toString: () => "teacher-1" },
      }),
    });

    const req = {
      params: { sessionId: "s1" },
      user: { id: "u2" },
    };
    const res = createMockRes();

    await getSessionFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("getSessionFeedback returns aggregated stats", async () => {
    Session.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        teacherId: { toString: () => "teacher-1" },
      }),
    });

    SessionFeedback.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { rating: 5 },
        { rating: 3 },
      ]),
    });

    const req = {
      params: { sessionId: "s1" },
      user: { id: "teacher-1" },
    };
    const res = createMockRes();

    await getSessionFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          statistics: expect.objectContaining({ totalFeedback: 2 }),
        }),
      }),
    );
  });

  it("returns 500 when validation throws", async () => {
    validateInput.mockImplementationOnce(() => {
      throw new Error("invalid");
    });

    const req = { params: { sessionId: "s1" }, user: { id: "u1" }, body: {} };
    const res = createMockRes();

    await submitSessionFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
