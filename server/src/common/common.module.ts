import { Global, Module } from '@nestjs/common';
import { EnvService } from './env.service.js';

@Global()
@Module({
  providers: [{ provide: EnvService, useFactory: () => new EnvService() }],
  exports: [EnvService],
})
export class CommonModule {}
