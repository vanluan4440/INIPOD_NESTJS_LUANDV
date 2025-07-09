export class AuthResponseDto {
    accessToken?: string;
    user: {
        id: string;
        email: string;
        name: string;
        avatar?: string;
        role: string;
    };
} 