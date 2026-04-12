import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { PinLoginDto } from './dto/pin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async pinLogin(dto: PinLoginDto) {
    const staff = await this.prisma.staffUser.findFirst({
      where: { id: dto.staffId, isActive: true },
      include: { branch: { select: { id: true, name: true } } },
    });

    if (!staff) {
      throw new NotFoundException('Staff user not found');
    }

    const valid = await bcrypt.compare(dto.pin, staff.pinHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const payload = { sub: staff.id, role: staff.role, branchId: staff.branchId };
    const token = this.jwt.sign(payload);

    return {
      token,
      user: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        branch: staff.branch,
      },
    };
  }

  /** Returns all staff for login screen (no pins exposed) */
  async listStaff(branchId: string) {
    return this.prisma.staffUser.findMany({
      where: { branchId, isActive: true },
      select: { id: true, name: true, role: true },
    });
  }
}
