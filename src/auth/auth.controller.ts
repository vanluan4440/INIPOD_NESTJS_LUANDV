import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
        return this.authService.signUp(signUpDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
        return this.authService.signIn(signInDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@CurrentUser() user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
        };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@CurrentUser() user) {
        return this.authService.logout(user.id);
    }
}
