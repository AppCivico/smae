import { Logger } from '@nestjs/common';
import { SmaeConfigService } from 'src/common/services/smae-config.service';

export async function resolveBaseUrl(logger: Logger, smaeConfigService: SmaeConfigService): Promise<string> {
    try {
        const rawUrl = await smaeConfigService.getConfigWithDefault('URL_LOGIN_SMAE', 'http://smae-frontend/');
        const parsedUrl = new URL(rawUrl);
        const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.port ? ':' + parsedUrl.port : ''}`;
        logger.log(`URL base inicializada: ${baseUrl}`);
        return baseUrl;
    } catch (error) {
        logger.error(`Falha ao inicializar a URL base: ${error.message}`);
        return 'http://smae-frontend/';
    }
}
