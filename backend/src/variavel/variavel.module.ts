import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VariavelController } from './variavel.controller';
import { VariavelService } from './variavel.service';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + 'for-variables',
            signOptions: { expiresIn: '1d' },
        })
    ],
    controllers: [VariavelController],
    providers: [VariavelService],
    exports: [VariavelService],
})
export class VariavelModule { }
