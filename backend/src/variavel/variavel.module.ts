import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VariavelController } from './variavel.controller';
import { VariavelService } from './variavel.service';

@Module({
    imports: [PrismaModule],
    controllers: [VariavelController],
    providers: [VariavelService]
})
export class VariavelModule { }
