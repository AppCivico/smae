import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoaController } from './pessoa.controller';
import { PessoaService } from './pessoa.service';

@Module({
    imports: [PrismaModule],
    controllers: [PessoaController],
    providers: [PessoaService],
    exports: [PessoaService],
})
export class PessoaModule {}
