import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.model';
import { LoginRequest, LoginResponse } from '../types';

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
  private static JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { username, password } = credentials;

    // Find user
    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is disabled');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Get user with details (branch and permissions)
    const userWithDetails = await UserModel.findByIdWithDetails(user.id);
    if (!userWithDetails) {
      throw new Error('Failed to fetch user details');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        branchId: user.branchId,
        branchNumber: userWithDetails.branch?.branchNumber,
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    return {
      token,
      user: userWithDetails,
    };
  }

  static async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}

