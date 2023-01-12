import { Module } from '@nestjs/common';
import { TextoConfigService } from './texto-config.service';
import { TextoConfigController } from './texto-config.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TextoConfigController],
    providers: [TextoConfigService]
})
export class TextoConfigModule { }
