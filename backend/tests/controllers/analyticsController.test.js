const SessionAnalytics = require("../../models/SessionAnalytics");
const analyticsBuilder = require("../../services/analyticsBuilder");
const { validateInput } = require("../../utils/validateInput");

jest.mock("../../models/SessionAnalytics", () => ({
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
}));

jest.mock("../../services/analyticsBuilder", () => ({
  buildAnalytics: jest.fn(),
  buildFrontendAnalytics: jest.fn(),
  formatStoredAnalytics: jest.fn(),
  generateParticipantStats: jest.fn(),
  generateFeedbackStats: jest.fn(),
}));

jest.mock("../../utils/validateInput", () => ({
  validateInput: jest.fn((schema, value) => value),
}));

const {
  generateAnalytics,
  getAnalytics,
  deleteAnalytics,
  getParticipantStatsTest,
  getFrontendAnalytics,
} = require("../../controllers/analyticsController");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("analyticsController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generateAnalytics stores generated data", async () => {
    analyticsBuilder.buildAnalytics.mockResolvedValueOnce({ sections: {} });

    const req = { params: { sessionId: "s1" }, body: {} };
    const res = createMockRes();
    const next = jest.fn();

    await generateAnalytics(req, res, next);

    expect(analyticsBuilder.buildAnalytics).toHaveBeenCalledWith(
      "s1",
      expect.objectContaining({ participants: true, feedback: true }),
    );
    expect(SessionAnalytics.findOneAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("getAnalytics returns 404 when cache is missing", async () => {
    const query = {
      populate: jest.fn().mockReturnThis(),
    };
    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(Promise.resolve(null));
    SessionAnalytics.findOne.mockReturnValueOnce(query);

    const req = { params: { sessionId: "s404" } };
    const res = createMockRes();
    const next = jest.fn();

    await getAnalytics(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Analytics not generated yet" }),
    );
  });

  it("deleteAnalytics returns success when analytics exists", async () => {
    SessionAnalytics.findOneAndDelete.mockResolvedValueOnce({ _id: "a1" });

    const req = { params: { sessionId: "s1" } };
    const res = createMockRes();
    const next = jest.fn();

    await deleteAnalytics(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  it("getParticipantStatsTest returns participant stats", async () => {
    analyticsBuilder.generateParticipantStats.mockResolvedValueOnce({ total: 5 });

    const req = { params: { sessionId: "s1" } };
    const res = createMockRes();
    const next = jest.fn();

    await getParticipantStatsTest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 5 } });
  });

  it("getFrontendAnalytics returns not-generated state when no cache", async () => {
    const query = {
      populate: jest.fn().mockReturnThis(),
    };
    query.populate
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(Promise.resolve(null));
    SessionAnalytics.findOne.mockReturnValueOnce(query);

    const req = { params: { sessionId: "s1" } };
    const res = createMockRes();
    const next = jest.fn();

    await getFrontendAnalytics(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ generated: false, data: null }),
    );
  });

  it("handles validation errors as 400", async () => {
    validateInput.mockImplementationOnce(() => {
      const err = new Error("bad");
      err.name = "ValidationError";
      throw err;
    });

    const req = { params: { sessionId: "s1" }, body: {} };
    const res = createMockRes();
    const next = jest.fn();

    await generateAnalytics(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
