const Room = require("../../models/Room");
const Session = require("../../models/Session");
const Participant = require("../../models/Participant");
const { validateInput } = require("../../utils/validateInput");

jest.mock("../../models/Room", () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
}));

jest.mock("../../models/Session", () => ({
  find: jest.fn(),
  deleteMany: jest.fn(),
}));

jest.mock("../../models/Participant", () => ({
  deleteMany: jest.fn(),
}));

jest.mock("../../utils/validateInput", () => ({
  validateInput: jest.fn((schema, value) => value),
}));

const {
  createRoom,
  listRooms,
  getRoomById,
  updateRoom,
  hardDeleteRoom,
} = require("../../controllers/roomController");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("roomController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createRoom creates room for authenticated teacher", async () => {
    Room.create.mockResolvedValueOnce({ _id: "r1", name: "Math" });

    const req = {
      user: { id: "teacher-1" },
      body: { name: "Math", defaultMaxStudents: 100 },
    };
    const res = createMockRes();
    const next = jest.fn();

    await createRoom(req, res, next);

    expect(Room.create).toHaveBeenCalledWith(
      expect.objectContaining({ teacherId: "teacher-1", name: "Math" }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  it("listRooms returns pagination payload", async () => {
    Room.countDocuments.mockResolvedValueOnce(2);
    Room.find.mockReturnValueOnce({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([{ _id: "r1" }, { _id: "r2" }]),
    });

    const req = { user: { id: "teacher-1" }, query: { page: 1, limit: 10 } };
    const res = createMockRes();
    const next = jest.fn();

    await listRooms(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: expect.objectContaining({ totalItems: 2 }),
        rooms: [{ _id: "r1" }, { _id: "r2" }],
      }),
    );
  });

  it("getRoomById sends 404 to error middleware when room is missing", async () => {
    Room.findById.mockResolvedValueOnce(null);

    const req = { params: { roomId: "missing" } };
    const res = createMockRes();
    const next = jest.fn();

    await getRoomById(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(404);
  });

  it("updateRoom sends 404 when room is not owned", async () => {
    Room.findOneAndUpdate.mockResolvedValueOnce(null);

    const req = {
      params: { roomId: "r1" },
      body: { name: "Updated" },
      user: { id: "teacher-1" },
    };
    const res = createMockRes();
    const next = jest.fn();

    await updateRoom(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("hardDeleteRoom deletes sessions, participants, and room", async () => {
    Session.deleteMany.mockResolvedValueOnce({});
    Participant.deleteMany.mockResolvedValueOnce({});
    Room.findOneAndDelete.mockResolvedValueOnce({ _id: "r1" });

    const req = {
      params: { roomId: "r1" },
      user: { id: "teacher-1" },
    };
    const res = createMockRes();
    const next = jest.fn();

    await hardDeleteRoom(req, res, next);

    expect(Session.deleteMany).toHaveBeenCalledWith({ roomId: "r1" });
    expect(Participant.deleteMany).toHaveBeenCalledWith({ roomId: "r1" });
    expect(res.json).toHaveBeenCalledWith({
      message: "Room permanently deleted",
    });
  });

  it("passes validation failures to next", async () => {
    validateInput.mockImplementationOnce(() => {
      throw new Error("validation");
    });

    const req = { user: { id: "teacher-1" }, body: {} };
    const res = createMockRes();
    const next = jest.fn();

    await createRoom(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
