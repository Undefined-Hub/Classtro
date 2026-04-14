const Question = require("../../models/Question");
const QuestionUpvote = require("../../models/QuestionUpvote");
const Session = require("../../models/Session");
const User = require("../../models/User");

const emitMock = jest.fn();

jest.mock("../../socket", () => ({
  getSessionNamespace: jest.fn(() => ({
    to: jest.fn(() => ({ emit: emitMock })),
  })),
}));

jest.mock("../../models/Question", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  find: jest.fn(),
}));

jest.mock("../../models/QuestionUpvote", () => ({
  create: jest.fn(),
  deleteOne: jest.fn(),
}));

jest.mock("../../models/Session", () => ({
  findById: jest.fn(),
}));

jest.mock("../../models/User", () => ({
  findById: jest.fn(),
  find: jest.fn(),
}));

const {
  createQuestion,
  upvoteQuestion,
  markAnswered,
  getQuestionsBySession,
} = require("../../controllers/qnaController");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("qnaController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createQuestion returns 400 when required fields are missing", async () => {
    const req = { body: {}, user: { id: "u1" } };
    const res = createMockRes();

    await createQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "sessionId and text are required",
    });
  });

  it("createQuestion returns 404 when session does not exist", async () => {
    Session.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = { body: { sessionId: "s404", text: "Q?" }, user: { id: "u1" } };
    const res = createMockRes();

    await createQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Session not found" });
  });

  it("upvoteQuestion blocks teacher/admin roles", async () => {
    const req = { params: { id: "q1" }, user: { id: "t1", role: "TEACHER" } };
    const res = createMockRes();

    await upvoteQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Teachers cannot upvote questions",
    });
  });

  it("upvoteQuestion toggles off on duplicate key", async () => {
    Question.findById.mockResolvedValueOnce({
      _id: "q1",
      sessionId: "s1",
      isDeleted: false,
    });
    QuestionUpvote.create.mockRejectedValueOnce({ code: 11000 });
    Session.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({ code: "ABC123" }),
    });

    const req = { params: { id: "q1" }, user: { id: "u1", role: "STUDENT" } };
    const res = createMockRes();

    await upvoteQuestion(req, res);

    expect(QuestionUpvote.deleteOne).toHaveBeenCalledWith({
      questionId: "q1",
      participantId: "u1",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Upvote removed" });
  });

  it("markAnswered returns 403 for non-teacher", async () => {
    const req = { params: { id: "q1" }, user: { id: "u1", role: "STUDENT" } };
    const res = createMockRes();

    await markAnswered(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Not allowed" });
  });

  it("getQuestionsBySession returns sorted questions list", async () => {
    const leanMock = jest
      .fn()
      .mockResolvedValue([
        { _id: "q1", authorId: "u1", upvotes: 2, createdAt: new Date() },
      ]);
    const sortMock = jest.fn(() => ({ lean: leanMock }));
    Question.find.mockReturnValueOnce({ sort: sortMock });

    User.find.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue([{ _id: "u1", name: "Harsh" }]),
    });

    const req = { params: { sessionId: "s1" }, query: {} };
    const res = createMockRes();

    await getQuestionsBySession(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [expect.objectContaining({ authorName: "Harsh" })],
      }),
    );
  });
});
