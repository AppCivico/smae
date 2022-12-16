import { Controller, Get } from '@nestjs/common';
import { IsPublic } from './auth/decorators/is-public.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    @IsPublic()
    @Get('/ping')
    async ping() {
        return 'pong';
    }

    @IsPublic()
    @Get('/texto-tos')
    async textos() {
        const textoConfig = await this.prisma.textoConfig.findFirstOrThrow({ where: { id: 1 } });
        return {
            bemvindo_email: textoConfig.bemvindo_email,
            tos: textoConfig.tos,
        };
    }



}
