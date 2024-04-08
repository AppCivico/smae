import { Module } from '@nestjs/common';
import { BlocoNotaModule } from './bloco-nota/bloco-nota.module';
import { TipoNotaModule } from './tipo-nota/tipo-nota.module';
import { NotaModule } from './nota/nota.module';

@Module({
    imports: [BlocoNotaModule, TipoNotaModule, NotaModule],
})
export class BlocoNotasModule {}
