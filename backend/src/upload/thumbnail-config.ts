import { TipoUpload } from './entities/tipo-upload';

export interface ThumbnailTypeConfig {
    /** Default width in pixels */
    defaultWidth: number;
    /** Default height in pixels */
    defaultHeight: number;
    /** Default WebP quality (1-100) */
    defaultQuality: number;
    /** sharp resize fit mode */
    fit: 'inside' | 'cover';
    /** Whether SVG input is allowed for this type */
    allowSvg: boolean;
    /** SmaeConfig keys for overriding width, height, quality */
    configKeys: {
        width: string;
        height: string;
        quality: string;
    };
}

export const THUMBNAIL_TYPES: Record<string, ThumbnailTypeConfig> = {
    [TipoUpload.ICONE_TAG]: {
        defaultWidth: 256,
        defaultHeight: 256,
        defaultQuality: 80,
        fit: 'inside',
        allowSvg: true,
        configKeys: {
            width: 'THUMB_ICONE_TAG_WIDTH',
            height: 'THUMB_ICONE_TAG_HEIGHT',
            quality: 'THUMB_ICONE_TAG_QUALITY',
        },
    },
    [TipoUpload.ICONE_PORTFOLIO]: {
        defaultWidth: 512,
        defaultHeight: 512,
        defaultQuality: 80,
        fit: 'inside',
        allowSvg: true,
        configKeys: {
            width: 'THUMB_ICONE_PORTFOLIO_WIDTH',
            height: 'THUMB_ICONE_PORTFOLIO_HEIGHT',
            quality: 'THUMB_ICONE_PORTFOLIO_QUALITY',
        },
    },
    [TipoUpload.LOGO_PDM]: {
        defaultWidth: 512,
        defaultHeight: 512,
        defaultQuality: 80,
        fit: 'inside',
        allowSvg: true,
        configKeys: {
            width: 'THUMB_LOGO_PDM_WIDTH',
            height: 'THUMB_LOGO_PDM_HEIGHT',
            quality: 'THUMB_LOGO_PDM_QUALITY',
        },
    },
    [TipoUpload.FOTO_PARLAMENTAR]: {
        defaultWidth: 768,
        defaultHeight: 768,
        defaultQuality: 80,
        fit: 'cover',
        allowSvg: false,
        configKeys: {
            width: 'THUMB_FOTO_PARLAMENTAR_WIDTH',
            height: 'THUMB_FOTO_PARLAMENTAR_HEIGHT',
            quality: 'THUMB_FOTO_PARLAMENTAR_QUALITY',
        },
    },
};

export function isThumbnailType(tipo: string): boolean {
    return tipo in THUMBNAIL_TYPES;
}
