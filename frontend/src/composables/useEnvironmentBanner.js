/**
 * Determina a cor da faixa com base na configuração do ambiente e no host atual
 *
 * @param {string} bannerConfig - String de configuração que pode ser:
 *   - Um array JSON de objetos com propriedades 'sufix' e 'color' para correspondência baseada em host
 *   - Uma string de cor hexadecimal (com ou sem prefixo '#')
 * @param {boolean} isDevelopment - Se a aplicação está rodando em modo de desenvolvimento
 * @returns {string} String de cor hexadecimal com prefixo '#', ou string vazia se nenhuma faixa deve ser exibida
 *
 * @example
 * // Configuração de cor única
 * getBannerColor('#ff0000', false) // retorna '#ff0000'
 *
 * @example
 * // Configuração baseada em host
 * const config = '[{"sufix": "dev.example.com", "color": "#ff0000"}]'
 * getBannerColor(config, false) // retorna '#ff0000' se o host terminar com 'dev.example.com'
 */
export function getBannerColor(bannerConfig, isDevelopment) {
  const host = window.location.host;

  if (bannerConfig?.startsWith("[")) {
    try {
      const configs = JSON.parse(bannerConfig);
      const match = configs.find((cfg) => host.endsWith(cfg.sufix));
      if (match?.color) {
        return match.color.startsWith("#") ? match.color : `#${match.color}`;
      }
      return "";
    } catch (e) {
      console.error("Error parsing banner configuration:", e);
      return "";
    }
  }

  // Show banner for development environments or localhost
  if (
    bannerConfig ||
    isDevelopment ||
    ["localhost", "127.0.0.1"].includes(host)
  ) {
    return bannerConfig
      ? bannerConfig.startsWith("#")
        ? bannerConfig
        : `#${bannerConfig}`
      : "#f2ff00";
  }

  return "";
}

export default function useFaixaConstrucao() {
  const config = import.meta.env.VITE_COR_DA_FAIXA_DE_CONSTRUCAO;
  const isDev = import.meta.env.DEV;

  const corDaFaixa = getBannerColor(config, isDev);

  if (corDaFaixa) {
    window.document.documentElement.classList.add("dev-environment");
  }

  return {
    corDaFaixa,
  };
}
