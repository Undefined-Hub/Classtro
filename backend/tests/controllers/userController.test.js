const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const { validateInput } = require("../../utils/validateInput");

jest.mock("../../models/User", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("../../utils/validateInput", () => ({
  validateInput: jest.fn((schema, value) => value),
}));

const {
  getUserProfile,
  updateUserProfile,
  changePassword,
} = require("../../controllers/userController");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("userController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getUserProfile returns 404 when user not found", async () => {
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = { params: { id: "u404" } };
    const res = createMockRes();

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User not found" }),
    );
  });

  it("updateUserProfile returns 400 when no update fields are provided", async () => {
    const req = { params: { id: "u1" }, body: {} };
    const res = createMockRes();

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "At least one field (name, username, or profilePicture) is required",
      }),
    );
  });

  it("updateUserProfile returns 409 when username is already taken", async () => {
    User.findById.mockResolvedValueOnce({ _id: "u1" });
    User.findOne.mockResolvedValueOnce({ _id: "u2" });

    const req = {
      params: { id: "u1" },
      body: { username: "takenName" },
    };
    const res = createMockRes();

    await updateUserProfile(req, res);

    expect(User.findOne).toHaveBeenCalledWith({
      username: "takenName",
      _id: { $ne: "u1" },
    });
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("changePassword returns 400 when current password is incorrect", async () => {
    User.findById.mockResolvedValueOnce({
      _id: "u1",
      authProvider: "LOCAL",
      password: "old-hash",
    });
    bcrypt.compare.mockResolvedValueOnce(false);

    const req = {
      params: { id: "u1" },
      body: {
        currentPassword: "wrong",
        newPassword: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      },
    };
    const res = createMockRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Current password is incorrect" }),
    );
  });

  it("changePassword hashes and updates password on success", async () => {
    User.findById.mockResolvedValueOnce({
      _id: "u1",
      authProvider: "LOCAL",
      password: "old-hash",
    });
    bcrypt.compare.mockResolvedValueOnce(true);
    bcrypt.hash.mockResolvedValueOnce("new-hash");
    User.findByIdAndUpdate.mockResolvedValueOnce({ _id: "u1" });

    const req = {
      params: { id: "u1" },
      body: {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      },
    };
    const res = createMockRes();

    await changePassword(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("NewPassword123!", 12);
    expect(User.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("handles unexpected errors with 500", async () => {
    validateInput.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const req = { params: { id: "u1" } };
    const res = createMockRes();

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Internal server error",
      }),
    );
  });
});
