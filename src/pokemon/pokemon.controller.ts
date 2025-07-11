import {
    Controller,
    Get,
    Post,
    Param,
    UseGuards,
    Query,
    Body,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    Req
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PokemonService } from './pokemon.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetPokemonQueryDto, FavoritePokemonDto } from './dto/pokemon.dto';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('pokemons')
export class PokemonController {
    constructor(private readonly pokemonService: PokemonService) { }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async importPokemonFromCsv(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
                ],
            }),
        )
        file: Express.Multer.File
    ) {
        // Save file temporarily and import
        const fs = require('fs');
        const path = require('path');
        const tempPath = path.join(process.cwd(), 'temp', `${Date.now()}_pokemon.csv`);

        // Ensure temp directory exists
        const tempDir = path.dirname(tempPath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        fs.writeFileSync(tempPath, file.buffer);

        try {
            const result = await this.pokemonService.importPokemonFromCsv(tempPath);
            // Clean up temp file
            fs.unlinkSync(tempPath);
            return result;
        } catch (error) {
            // Clean up temp file on error
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            throw error;
        }
    }

    @Get()
    async getPokemonList(
        @Query() query: GetPokemonQueryDto,
        @Req() req: Request
    ) {
        const userId = (req.user as any)?.id;
        return this.pokemonService.getPokemonList(query, userId);
    }

    @Get('favorites')
    async getFavoritePokemon(
        @Query() query: GetPokemonQueryDto,
        @Req() req: Request
    ) {
        const userId = (req.user as any)?.id;
        return this.pokemonService.getFavoritePokemon(userId, query);
    }

    @Get(':id')
    async getPokemonById(
        @Param('id') id: string,
        @Req() req: Request
    ) {
        const userId = (req.user as any)?.id;
        return this.pokemonService.getPokemonById(id, userId);
    }

    @Post(':id/favorite')
    async toggleFavoritePokemon(
        @Param('id') pokemonId: string,
        @Req() req: Request
    ) {
        const userId = (req.user as any)?.id;
        return this.pokemonService.toggleFavoritePokemon(userId, pokemonId);
    }
}
