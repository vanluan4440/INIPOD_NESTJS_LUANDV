import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetPokemonQueryDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    type1?: string;

    @IsOptional()
    @IsString()
    type2?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    generation?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    legendary?: boolean;
}

export class PokemonResponseDto {
    id: string;
    name: string;
    type1: string;
    type2?: string;
    total: number;
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
    generation: number;
    legendary: boolean;
    image: string;
    ytbUrl: string;
    isFavorite?: boolean;
}

export class PokemonListResponseDto {
    data: PokemonResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class FavoritePokemonDto {
    @IsString()
    pokemonId: string;
} 