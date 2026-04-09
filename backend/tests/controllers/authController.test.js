const bcrypt = require("bcrypt");
const User = require("../../models/User");
const otpService = require("../../services/otpService");
const { generateToken, verifyToken } = require("../../utils/jwtUtils");

jest.mock("../../services/emailService", () => ({
  verifyConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("../../services/otpService", () => ({
  generateAndSendOTP: jest.fn(),
  verifyOTP: jest.fn(),
  resendOTP: jest.fn(),
}));

jest.mock("../../utils/jwtUtils", () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
}));

jest.mock("../../models/User", () => {
  const UserMock = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(true),
  }));

  UserMock.findOne = jest.fn();
  UserMock.findById = jest.fn();
  UserMock.findOneAndUpdate = jest.fn();

  return UserMock;
});

const {
  loginUser,
  registerUser,
  refreshToken,
  verifyEmail,
} = require("../../controllers/authController");

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

describe("authController", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  });

  describe("registerUser", () => {
    it("returns 400 when required fields are missing", async () => {
      const req = { body: { email: "user@example.com" } };
      const res = createMockRes();

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "All fields are required.",
      });
    });

    it("returns 409 when user already exists", async () => {
      User.findOne.mockResolvedValueOnce({ id: "existing-user" });

      const req = {
        body: {
          name: "Harsh",
          username: "harsh123",
          email: "harsh@example.com",
          password: "Password@123",
        },
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ username: "harsh123" }, { email: "harsh@example.com" }],
      });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "Username or email already exists.",
      });
    });

    it("registers user and sends OTP successfully", async () => {
      User.findOne.mockResolvedValueOnce(null);
      bcrypt.hash.mockResolvedValueOnce("hashed-password");
      otpService.generateAndSendOTP.mockResolvedValueOnce({
        success: true,
        expiresIn: 10,
      });

      const req = {
        body: {
          name: "Harsh",
          username: "harsh123",
          email: "harsh@example.com",
          password: "Password@123",
        },
      };
      const res = createMockRes();

      await registerUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("Password@123", 10);
      expect(User).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Harsh",
          username: "harsh123",
          email: "harsh@example.com",
          password: "hashed-password",
          role: "UNKNOWN",
          emailVerified: false,
        }),
      );
      expect(otpService.generateAndSendOTP).toHaveBeenCalledWith(
        "harsh@example.com",
        "Harsh",
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          emailSent: true,
        }),
      );
    });
  });

  describe("loginUser", () => {
    it("returns 401 when credentials are invalid", async () => {
      User.findOne.mockResolvedValueOnce(null);

      const req = {
        body: { email: "invalid@example.com", password: "wrong-pass" },
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid email or password.",
      });
    });

    it("returns 403 and requires verification for unverified users", async () => {
      User.findOne.mockResolvedValueOnce({
        email: "harsh@example.com",
        name: "Harsh",
        password: "hashed-password",
        emailVerified: false,
      });
      bcrypt.compare.mockResolvedValueOnce(true);
      otpService.generateAndSendOTP.mockResolvedValueOnce({
        success: true,
        expiresIn: 10,
      });

      const req = {
        body: {
          email: "harsh@example.com",
          password: "Password@123",
        },
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requiresVerification: true,
          step: 1,
          emailSent: true,
          expiresIn: 10,
        }),
      );
    });

    it("returns access token and sets refresh cookie for valid credentials", async () => {
      const save = jest.fn().mockResolvedValue(true);

      User.findOne.mockResolvedValueOnce({
        id: "user-1",
        email: "harsh@example.com",
        name: "Harsh",
        username: "harsh123",
        password: "hashed-password",
        role: "STUDENT",
        profilePicture: "",
        emailVerified: true,
        save,
      });
      bcrypt.compare.mockResolvedValueOnce(true);
      generateToken
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const req = {
        body: {
          email: "harsh@example.com",
          password: "Password@123",
        },
      };
      const res = createMockRes();

      await loginUser(req, res);

      expect(generateToken).toHaveBeenNthCalledWith(
        1,
        { user: { id: "user-1" } },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );
      expect(generateToken).toHaveBeenNthCalledWith(
        2,
        { user: { id: "user-1" } },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );
      expect(save).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token",
        expect.objectContaining({ httpOnly: true, path: "/" }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successful",
          accessToken: "access-token",
          user: expect.objectContaining({
            id: "user-1",
            email: "harsh@example.com",
          }),
        }),
      );
    });
  });

  describe("refreshToken", () => {
    it("returns 401 if refresh token cookie is missing", async () => {
      const req = { cookies: {} };
      const res = createMockRes();

      await refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Refresh token not found",
      });
    });

    it("returns new access token for valid refresh token", async () => {
      verifyToken.mockReturnValueOnce({ user: { id: "user-1" } });
      User.findById.mockResolvedValueOnce({
        id: "user-1",
        refreshToken: "valid-refresh-token",
      });
      generateToken.mockReturnValueOnce("new-access-token");

      const req = {
        cookies: {
          refreshToken: "valid-refresh-token",
        },
      };
      const res = createMockRes();

      await refreshToken(req, res);

      expect(verifyToken).toHaveBeenCalledWith(
        "valid-refresh-token",
        process.env.JWT_REFRESH_SECRET,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: "new-access-token",
      });
    });
  });

  describe("verifyEmail", () => {
    it("returns 400 when email or otp is missing", async () => {
      const req = { body: { email: "harsh@example.com" } };
      const res = createMockRes();

      await verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email and OTP are required",
      });
    });

    it("marks user as verified when otp is valid", async () => {
      otpService.verifyOTP.mockResolvedValueOnce({
        success: true,
        message: "OTP verified successfully",
      });
      User.findOneAndUpdate.mockResolvedValueOnce({ id: "user-1" });

      const req = {
        body: {
          email: "harsh@example.com",
          otp: "123456",
        },
      };
      const res = createMockRes();

      await verifyEmail(req, res);

      expect(otpService.verifyOTP).toHaveBeenCalledWith(
        "harsh@example.com",
        "123456",
      );
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: "harsh@example.com" },
        { emailVerified: true },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OTP verified successfully",
      });
    });
  });
});
