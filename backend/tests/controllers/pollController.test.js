const Poll = require("../../models/Polls");

jest.mock("../../models/Polls", () => {
  const PollMock = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: "poll-1",
    save: jest.fn().mockResolvedValue(true),
  }));

  PollMock.find = jest.fn();
  PollMock.findById = jest.fn();
  PollMock.findByIdAndUpdate = jest.fn();
  PollMock.findByIdAndDelete = jest.fn();

  return PollMock;
});

const {
  createPoll,
  listPolls,
  updatePoll,
  getPollById,
  deletePoll,
  getPollResults,
  endPoll,
} = require("../../controllers/pollController");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("pollController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createPoll returns 201 for valid payload", async () => {
    const req = { body: { sessionId: "s1", question: "Q1" } };
    const res = createMockRes();

    await createPoll(req, res);

    expect(Poll).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  it("listPolls returns polls for session", async () => {
    Poll.find.mockResolvedValueOnce([{ _id: "p1" }, { _id: "p2" }]);

    const req = { params: { sessionId: "session-1" } };
    const res = createMockRes();

    await listPolls(req, res);

    expect(Poll.find).toHaveBeenCalledWith({ sessionId: "session-1" });
    expect(res.json).toHaveBeenCalledWith([{ _id: "p1" }, { _id: "p2" }]);
  });

  it("updatePoll returns 404 when poll is missing", async () => {
    Poll.findByIdAndUpdate.mockResolvedValueOnce(null);

    const req = { params: { id: "missing" }, body: { question: "updated" } };
    const res = createMockRes();

    await updatePoll(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Poll not found" });
  });

  it("getPollById returns poll results", async () => {
    Poll.findById.mockResolvedValueOnce({ _id: "p1" });

    const req = { params: { id: "p1" } };
    const res = createMockRes();

    await getPollById(req, res);

    expect(res.json).toHaveBeenCalledWith({ _id: "p1" });
  });

  it("deletePoll returns success message", async () => {
    Poll.findByIdAndDelete.mockResolvedValueOnce({ _id: "p1" });

    const req = { params: { id: "p1" } };
    const res = createMockRes();

    await deletePoll(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "Poll deleted successfully",
    });
  });

  it("getPollResults returns 404 when poll not found", async () => {
    Poll.findById.mockResolvedValueOnce(null);

    const req = { params: { pollId: "p404" } };
    const res = createMockRes();

    await getPollResults(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Poll not found" });
  });

  it("endPoll deactivates poll", async () => {
    const save = jest.fn().mockResolvedValueOnce(true);
    Poll.findById.mockResolvedValueOnce({ _id: "p1", isActive: true, save });

    const req = { params: { pollId: "p1" } };
    const res = createMockRes();

    await endPoll(req, res);

    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Poll ended successfully",
    });
  });
});
