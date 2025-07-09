import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class SignUpDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    avatar?: string;
} 