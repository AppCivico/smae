import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, PessoaModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
