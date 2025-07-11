import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetPokemonQueryDto, PokemonResponseDto, PokemonListResponseDto } from './dto/pokemon.dto';
import * as csv from 'csv-parser';
import * as fs from 'fs';
import { Request } from 'express';

@Injectable()
export class PokemonService {
    constructor(private readonly prisma: PrismaService) { }

    async importPokemonFromCsv(filePath: string): Promise<{ success: boolean; count: number }> {
        try {
            const results: any[] = [];

            return new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', async () => {
                        try {
                            const pokemonData = results.map((row) => ({
                                name: row.Name || row.name,
                                type1: row.Type1 || row.type1,
                                type2: row.Type2 || row.type2 || null,
                                total: parseInt(row.Total || row.total) || 0,
                                hp: parseInt(row.HP || row.hp) || 0,
                                attack: parseInt(row.Attack || row.attack) || 0,
                                defense: parseInt(row.Defense || row.defense) || 0,
                                spAttack: parseInt(row.SpAtk || row['Sp. Atk'] || row.spAttack) || 0,
                                spDefense: parseInt(row.SpDef || row['Sp. Def'] || row.spDefense) || 0,
                                speed: parseInt(row.Speed || row.speed) || 0,
                                generation: parseInt(row.Generation || row.generation) || 1,
                                legendary: (row.Legendary || row.legendary || '').toLowerCase() === 'true',
                                image: row.Image || row.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${row['#'] || row.id || 1}.png`,
                                ytbUrl: row.YtbUrl || row.ytbUrl || 'https://youtu.be/uBYORdr_TY8'
                            }));

                            // Clear existing data and insert new data
                            await this.prisma.pokemon.deleteMany();
                            await this.prisma.userPokemon.deleteMany();

                            const createdPokemon = await this.prisma.pokemon.createMany({
                                data: pokemonData,
                                skipDuplicates: true
                            });

                            resolve({ success: true, count: createdPokemon.count });
                        } catch (error) {
                            reject(error);
                        }
                    })
                    .on('error', reject);
            });
        } catch (error) {
            throw new BadRequestException('Failed to import Pokémon from CSV file');
        }
    }

    async getPokemonList(query: GetPokemonQueryDto, userId?: string): Promise<PokemonListResponseDto> {
        const { page = 1, limit = 10, search, type1, type2, generation, legendary } = query;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { type1: { contains: search, mode: 'insensitive' } },
                { type2: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (type1) {
            where.type1 = { equals: type1, mode: 'insensitive' };
        }

        if (type2) {
            where.type2 = { equals: type2, mode: 'insensitive' };
        }

        if (generation) {
            where.generation = generation;
        }

        if (legendary !== undefined) {
            where.legendary = legendary;
        }

        // Get total count
        const total = await this.prisma.pokemon.count({ where });

        // Get Pokémon with favorite status
        const pokemons = await this.prisma.pokemon.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
            include: {
                favoritedBy: userId ? {
                    where: { userId }
                } : false
            }
        });

        // Transform data to include favorite status
        const data: PokemonResponseDto[] = pokemons.map(pokemon => ({
            id: pokemon.id,
            name: pokemon.name,
            type1: pokemon.type1,
            type2: pokemon.type2,
            total: pokemon.total,
            hp: pokemon.hp,
            attack: pokemon.attack,
            defense: pokemon.defense,
            spAttack: pokemon.spAttack,
            spDefense: pokemon.spDefense,
            speed: pokemon.speed,
            generation: pokemon.generation,
            legendary: pokemon.legendary,
            image: pokemon.image,
            ytbUrl: pokemon.ytbUrl,
            isFavorite: userId ? pokemon.favoritedBy.length > 0 : undefined
        }));

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getPokemonById(id: string, userId?: string): Promise<PokemonResponseDto> {
        const pokemon = await this.prisma.pokemon.findUnique({
            where: { id },
            include: {
                favoritedBy: userId ? {
                    where: { userId }
                } : false
            }
        });

        if (!pokemon) {
            throw new NotFoundException('Pokémon not found');
        }

        return {
            id: pokemon.id,
            name: pokemon.name,
            type1: pokemon.type1,
            type2: pokemon.type2,
            total: pokemon.total,
            hp: pokemon.hp,
            attack: pokemon.attack,
            defense: pokemon.defense,
            spAttack: pokemon.spAttack,
            spDefense: pokemon.spDefense,
            speed: pokemon.speed,
            generation: pokemon.generation,
            legendary: pokemon.legendary,
            image: pokemon.image,
            ytbUrl: pokemon.ytbUrl,
            isFavorite: userId ? pokemon.favoritedBy.length > 0 : undefined
        };
    }

    async toggleFavoritePokemon(userId: string, pokemonId: string): Promise<{ isFavorite: boolean }> {
        // Check if Pokémon exists
        const pokemon = await this.prisma.pokemon.findUnique({
            where: { id: pokemonId }
        });

        if (!pokemon) {
            throw new NotFoundException('Pokémon not found');
        }

        // Check if already favorited
        const existingFavorite = await this.prisma.userPokemon.findUnique({
            where: {
                userId_pokemonId: {
                    userId,
                    pokemonId
                }
            }
        });

        if (existingFavorite) {
            // Remove from favorites
            await this.prisma.userPokemon.delete({
                where: {
                    userId_pokemonId: {
                        userId,
                        pokemonId
                    }
                }
            });
            return { isFavorite: false };
        } else {
            // Add to favorites
            await this.prisma.userPokemon.create({
                data: {
                    userId,
                    pokemonId
                }
            });
            return { isFavorite: true };
        }
    }

    async getFavoritePokemon(userId: string, query: GetPokemonQueryDto): Promise<PokemonListResponseDto> {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        // Get total count of favorite Pokémon
        const total = await this.prisma.userPokemon.count({
            where: { userId }
        });

        // Get favorite Pokémon with details
        const favoritePokemon = await this.prisma.userPokemon.findMany({
            where: { userId },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                pokemon: true
            }
        });

        const data: PokemonResponseDto[] = favoritePokemon.map(fp => ({
            id: fp.pokemon.id,
            name: fp.pokemon.name,
            type1: fp.pokemon.type1,
            type2: fp.pokemon.type2,
            total: fp.pokemon.total,
            hp: fp.pokemon.hp,
            attack: fp.pokemon.attack,
            defense: fp.pokemon.defense,
            spAttack: fp.pokemon.spAttack,
            spDefense: fp.pokemon.spDefense,
            speed: fp.pokemon.speed,
            generation: fp.pokemon.generation,
            legendary: fp.pokemon.legendary,
            image: fp.pokemon.image,
            ytbUrl: fp.pokemon.ytbUrl,
            isFavorite: true
        }));

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
}
