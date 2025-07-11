import { Module } from '@nestjs/common';
import { GeoBuscaModule } from '../geo-busca/geo-busca.module';
import { BuscaGlobalController } from './busca-global.controller';
import { BuscaGlobalService } from './busca-global.service';

@Module({
    imports: [GeoBuscaModule],
    controllers: [BuscaGlobalController],
    providers: [BuscaGlobalService],
})
export class BuscaGlobalModule {}
