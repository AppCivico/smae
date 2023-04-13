import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TextoConfigController } from './texto-config.controller';
import { TextoConfigService } from './texto-config.service';

@Module({
    imports: [PrismaModule],
    controllers: [TextoConfigController],
    providers: [TextoConfigService],
})
export class TextoConfigModule {}
