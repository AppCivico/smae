import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PainelEstrategicoController } from './painel-estrategico.controller';
import { PainelEstrategicoService } from './painel-estrategico.service';
import { ProjetoModule } from '../../pp/projeto/projeto.module';
import { MetaModule } from '../../meta/meta.module';
import { JwtModule } from '@nestjs/jwt';
import { GeoLocModule } from '../../geo-loc/geo-loc.module';

@Module({
    imports: [PrismaModule,
            forwardRef(() => ProjetoModule),
            forwardRef(() => MetaModule),
            forwardRef(() => GeoLocModule),JwtModule.register({
        secret: process.env.SESSION_JWT_SECRET + ':pagination',
        signOptions: { expiresIn: '1d' },
    })],
    controllers: [PainelEstrategicoController],
    providers: [PainelEstrategicoService],
    exports: [PainelEstrategicoService],
})
export class PainelEstrategicoModule {}
