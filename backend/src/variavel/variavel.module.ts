import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VariavelController } from './variavel.controller';
import { VariavelService } from './variavel.service';

@Module({
    imports: [PrismaModule, JwtModule],
    controllers: [VariavelController],
    providers: [VariavelService]
})
export class VariavelModule { }
