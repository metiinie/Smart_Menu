import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { PinLoginDto } from './dto/pin-login.dto';
import { LoginDto } from './dto/login.dto';

const ACCESS_TOKEN_TTL  = '15m';
const REFRESH_TOKEN_TTL = '7d';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    console.log(`[AuthService] Attempting login for email: ${dto.email}`);
    const user = await this.prisma.withRetry(() =>
      this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
        include: { branch: { select: { id: true, name: true } } },
      }),
    );
    console.log(`[AuthService] User found: ${!!user}, HasPassword: ${!!user?.passwordHash}`);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const basePayload = { 
      sub: user.id, 
      role: user.role, 
      branchId: user.branchId, 
      restaurantId: user.restaurantId 
    };
    
    const { accessToken, refreshToken } = this.generateTokenPair(basePayload);

    return {
      token: accessToken,       // backward-compat alias
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        restaurantId: user.restaurantId,
        branch: user.branch,
      },
    };
  }

  async pinLogin(dto: PinLoginDto) {

    const staff = await this.prisma.withRetry(() =>
      this.prisma.user.findFirst({
        where: { id: dto.staffId, isActive: true },
        include: { branch: { select: { id: true, name: true } } },
      }),
    );

    if (!staff) {
      throw new NotFoundException('Staff user not found');
    }

    if (!staff.pinHash) {
      throw new UnauthorizedException('PIN login not configured for this user');
    }

    const valid = await bcrypt.compare(dto.pin, staff.pinHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const basePayload = { sub: staff.id, role: staff.role, branchId: staff.branchId, restaurantId: staff.restaurantId };
    const { accessToken, refreshToken } = this.generateTokenPair(basePayload);

    return {
      token: accessToken,       // backward-compat alias
      accessToken,
      refreshToken,
      user: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        // Include branchId at BOTH levels so every consumer can resolve it consistently:
        //   user.branchId        — direct field
        //   user.branch.id       — nested (for UI that already used this pattern)
        branchId: staff.branchId,
        restaurantId: staff.restaurantId,
        branch: staff.branch,
      },
    };
  }

  /** Returns all active staff for the login screen (no PINs or sensitive data exposed). */
  async listStaff(branchId?: string) {
    const normalizedBranchId = branchId?.trim();
    const staffForBranch = await this.prisma.withRetry(() =>
      this.prisma.user.findMany({
        where: {
          isActive: true,
          ...(normalizedBranchId ? { branchId: normalizedBranchId } : {}),
        },
        select: { id: true, name: true, role: true },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
      }),
    );

    // Recovery path: if client sends a stale branchId, avoid blank login screen.
    if (normalizedBranchId && staffForBranch.length === 0) {
      return this.prisma.withRetry(() =>
        this.prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true, role: true },
          orderBy: [{ role: 'asc' }, { name: 'asc' }],
        }),
      );
    }

    return staffForBranch;
  }

  async getDefaultBranch() {
    return this.prisma.withRetry(() =>
      this.prisma.branch.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true },
      }),
    );
  }

  // ── Token helpers ────────────────────────────────────────────────────────

  private generateTokenPair(basePayload: Record<string, unknown>) {
    const accessToken  = this.jwt.sign(
      { ...basePayload, type: 'access' },
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    const refreshToken = this.jwt.sign(
      { sub: basePayload.sub, type: 'refresh' },
      { expiresIn: REFRESH_TOKEN_TTL },
    );
    return { accessToken, refreshToken };
  }

  /**
   * Verify a refresh token, confirm the user is still active,
   * and issue a fresh token pair (sliding expiration).
   */
  async refreshSession(refreshToken: string) {
    let decoded: any;
    try {
      decoded = this.jwt.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Token is not a refresh token');
    }

    const user = await this.prisma.withRetry(() =>
      this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { branch: { select: { id: true, name: true } } },
      }),
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const basePayload = {
      sub: user.id,
      role: user.role,
      branchId: user.branchId,
      restaurantId: user.restaurantId,
    };

    const tokens = this.generateTokenPair(basePayload);

    return {
      token: tokens.accessToken,  // backward-compat alias
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        restaurantId: user.restaurantId,
        branch: user.branch,
      },
    };
  }
}
