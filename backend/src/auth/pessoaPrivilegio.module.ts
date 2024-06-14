import { Module, NestModule } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoaPrivilegioService } from './pessoaPrivilegio.service';

@Module({
    imports: [PrismaModule],
    providers: [PessoaPrivilegioService],
    exports: [PessoaPrivilegioService],
})
export class PessoaPrivilegioModule implements NestModule {
    configure() {}
}
