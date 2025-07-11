import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
        const { email, password, name, avatar } = signUpDto;

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                avatar,
            },
        });


        if (!user) {
            throw new InternalServerErrorException('Failed to create user');
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
            },
        };
    }

    async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
        const { email, password } = signInDto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isActive: true },
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT token
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
            },
        };
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.isActive) {
            return null;
        }

        return user;
    }

    async logout(userId: string) {
        return await this.prisma.user.update({
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
            },
            where: { id: userId },
            data: { isActive: false },
        });
    }
}
