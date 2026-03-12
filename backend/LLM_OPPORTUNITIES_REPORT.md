# Relatório de Oportunidades para LLM (1B parâmetros) no SMAE

## Sumário Executivo

O SMAE (Sistema de Monitoramento e Avaliação Estratégica) é uma plataforma complexa de governança pública que gerencia planos municipais, projetos, transferências de recursos, indicadores e relatórios. Uma LLM de 1B parâmetros pode agregar valor significativo em áreas específicas que envolvem processamento de linguagem natural, classificação e geração assistida, sem necessidade de processamento massivo de dados estruturados.

---

## 1. Visão Geral do Sistema

### Domínios Principais identificados no Schema:

| Domínio | Descrição | Volume de Dados |
|---------|-----------|-----------------|
| **PDM/Planos Setoriais** | Metas, iniciativas, atividades, indicadores | Alto |
| **Projetos (PP/MDO)** | Gestão de projetos e obras | Alto |
| **Transferências Voluntárias** | Repasse de recursos entre entes | Médio |
| **Variáveis e Indicadores** | Dados quantitativos e categóricos | Muito Alto |
| **Orçamento** | Planejado, realizado, empenhos | Alto |
| **Workflows** | Processos de aprovação e tramitação | Médio |
| **Relatórios** | Geração de documentos e análises | Alto |
| **Notas/Comunicados** | Registro de comunicações internas | Médio |

---

## 2. Oportunidades de Alto Valor para LLM 1B

### 2.1 Sumarização e Análise de Textos Governamentais

**Contexto:** O sistema possui diversos campos textuais que acumulam informações ao longo do tempo:
- Análises qualitativas de metas (`MetaCicloFisicoAnalise.informacoes_complementares`)
- Detalhamentos de riscos (`MetaCicloFisicoRisco.detalhamento`, `ponto_de_atencao`)
- Fechamentos e comentários (`MetaCicloFisicoFechamento.comentario`)
- Notas e comunicações (`Nota.nota`)

**Valor Proposto:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ANTES: Coordenador lê 50+ análises mensais manualmente         │
│  DEPOIS: LLM gera resumo executivo com destaque para riscos    │
│                                                                 │
│  ANTES: Usuário escreve análise do zero                         │
│  DEPOIS: LLM sugere baseado em dados históricos similares      │
└─────────────────────────────────────────────────────────────────┘
```

**Implementação Sugerida:**
- Endpoint: `POST /api/llm/analise/sumarizar`
- Input: Ciclo ID + Meta ID + contexto
- Output: Resumo estruturado + sentimento + riscos identificados

---

### 2.2 Classificação Automática de Transferências de Recursos

**Contexto:** O módulo de transferências voluntárias (`Transferencia`, `DistribuicaoRecurso`) processa repasses que precisam ser classificados por área temática, tipo de intervenção e prioridade.

**Modelo de Valor:**
| Campo Atual | Uso de LLM | Economia |
|-------------|-----------|----------|
| `Transferencia.objeto` | Classificação automática em áreas temáticas | 70% do tempo de triagem |
| `Transferencia.detalhamento` | Extração de entidades (orgãos, valores, prazos) | 50% do tempo de cadastro |
| Anexos (PDF) | Resumo automático para análise prévia | 60% do tempo de revisão |

**Exemplo de Fluxo:**
```typescript
// Serviço sugerido: TransferenciaClassificacaoService
async classificarTransferencia(dto: CreateTransferenciaDto) {
  const sugestoes = await this.llmService.analisar({
    texto: dto.objeto + ' ' + dto.detalhamento,
    tarefa: 'classificar_area_tematica',
    opcoes: await this.areaTematicaService.findAll()
  });
  
  return {
    area_tematica_sugerida: sugestoes.classificacao,
    confianca: sugestoes.score,
    palavras_chave: sugestoes.entidades
  };
}
```

---

### 2.3 Assistente de Preenchimento de Indicadores e Variáveis

**Contexto:** O sistema gerencia milhares de variáveis (`Variavel`, `Indicador`) com descrições, metodologias e justificativas. Muitas são similares entre si.

**Oportunidades:**

1. **Sugestão de Metodologia:**
   - Baseado em variáveis similares já cadastradas
   - Sugere descrição e fonte de dados
   
2. **Validação de Consistência:**
   - Verifica se a justificativa de alteração de valor é coerente com o contexto
   - Alerta sobre valores atípicos comparados ao histórico

3. **Geração de Análise Qualitativa:**
   ```
   Input: Série de valores + contexto da meta
   Output: "A variável apresentou crescimento de 15% no trimestre, 
            consistente com a inauguração da unidade prevista no 
            cronograma. Recomenda-se manter o acompanhamento mensal."
   ```

---

### 2.4 Geração e Revisão de Relatórios Automatizados

**Contexto:** O módulo de relatórios (`Relatorio`, `reports/*`) gera diversos documentos em Excel/PDF. Uma LLM pode enriquecer significativamente este processo.

**Casos de Uso:**

| Relatório | Função da LLM | Valor |
|-----------|--------------|-------|
| Monitoramento Mensal | Gerar texto introdutório contextualizado | Padronização + velocidade |
| Indicadores | Explicar variações em linguagem natural | Clareza para gestores |
| Projetos | Resumir status de múltiplos projetos | Visão consolidada |
| Tribunal de Contas | Verificar conformidade textual | Redução de retrabalho |

**Implementação:**
```typescript
// RelatorioService com LLM
async gerarRelatorio(dto: CreateReportDto) {
  const dados = await this.coletarDados(dto);
  
  // Gera narrativa explicativa
  const narrativa = await this.llmService.gerarNarrativa({
    tipo: dto.fonte,
    dados: dados.resumo,
    tom: 'formal_governamental'
  });
  
  // Insere no documento gerado
  return this.pdfService.gerar({
    dados: dados.detalhados,
    narrativa: narrativa.texto,
    graficos: dados.visualizacoes
  });
}
```

---

### 2.5 Análise de Sentimento em Notas e Comunicações

**Contexto:** O sistema possui notas (`Nota`, `NotaEnderecamento`) usadas para comunicação entre órgãos sobre projetos e transferências.

**Aplicação:**
- **Priorização Inteligente:** Classificar urgência baseada no conteúdo, não apenas no título
- **Roteamento Automático:** Sugerir destinatários baseado no histórico de comunicações similares
- **Alerta de Conflitos:** Detectar tom negativo ou discordância que requer mediação

**Exemplo:**
```typescript
interface AnaliseNota {
  nota_id: number;
  sentimento: 'positivo' | 'neutro' | 'negativo' | 'urgente';
  topicos: string[];        // Extraídos do texto
  acoes_sugeridas: string[]; // Baseado em padrões históricos
  orgaos_envolvidos: number[]; // Entidades mencionadas
}
```

---

### 2.6 Validação e Melhoria de Descrições de Projetos

**Contexto:** Projetos (`Projeto`) possuem campos textuais importantes: `objeto`, `objetivo`, `publico_alvo`, `principais_etapas`.

**Funções da LLM:**
1. **Padronização:** Sugerir formatação consistente com diretrizes de governança
2. **Completude:** Verificar se todos os elementos obrigatórios estão presentes
3. **Clareza:** Identificar jargões ou ambiguidades
4. **Coerência:** Verificar alinhamento entre objetivo, objeto e etapas

**API Sugerida:**
```typescript
POST /api/llm/validacao/projeto
{
  "projeto_id": 123,
  "campos": ["objeto", "objetivo"],
  "diretrizes": "pdm_2024_2027"
}

Response:
{
  "pontuacao_clareza": 8.5,
  "sugestoes": [
    {
      "campo": "objeto",
      "tipo": "ambiguidade",
      "trecho": "melhorar a cidade",
      "sugestao": "especificar a região ou ação concreta"
    }
  ]
}
```

---

### 2.7 Assistente para Configuração de Workflows

**Contexto:** O sistema possui workflows configuráveis (`Workflow`, `WorkflowFase`, `WorkflowTarefa`) para tramitação de processos.

**Valor:**
- **Geração de Descrições:** Criar descrições claras de tarefas baseadas no tipo de workflow
- **Validação de Fluxo:** Identificar possíveis gargalos ou loops na configuração
- **Sugestão de Responsáveis:** Recomendar perfis de acesso baseados em workflows similares

---

## 3. Análise de Viabilidade Técnica

### 3.1 Modelos 1B Parametros - Capacidades Esperadas

| Capacidade | Adequação | Observação |
|------------|-----------|------------|
| Sumarização de textos curtos (<500 tokens) | ✅ Excelente | Ideal para análises qualitativas |
| Classificação de texto | ✅ Excelente | Áreas temáticas, tipos de nota |
| Extração de entidades | ✅ Boa | Orgãos, valores, datas em textos |
| Geração de texto estruturado | ✅ Boa | Narrativas de relatórios simples |
| Tradução/parafraseamento | ✅ Boa | Padronização de descrições |
| Análise de sentimento | ⚠️ Regular | Requer fine-tuning com dados do domínio |
| Raciocínio complexo | ❌ Limitada | Não adequado para cálculos orçamentários |

### 3.2 Requisitos de Infraestrutura

```
Opção 1: Modelo Local (on-premise)
├── GPU: 4-8GB VRAM (RTX 3060 ou superior)
├── RAM: 16GB+ recomendado
├── Latência: 50-200ms por inferência
└── Custo: Hardware inicial + manutenção

Opção 2: API Externa (OpenAI, Anthropic, etc.)
├── Custo por token: ~$0.0015/1K tokens
├── Latência: 200-500ms + rede
├── Escalabilidade: Automática
└── Segurança: Dados saem da infraestrutura

Opção 3: Modelo Híbrido (recomendado)
├── Tarefas críticas: Local
├── Tarefas genéricas: API externa
└── Fallback: Regra-based quando LLM indisponível
```

### 3.3 Pontos de Integração no Código Existente

```
src/
├── mf/metas/           # Análise qualitativa, sugestões
├── bloco-nota/nota/    # Classificação, priorização
├── casa-civil/         # Classificação de transferências
│   ├── transferencia/
│   └── demanda/
├── pp/projeto/         # Validação de descrições
├── reports/            # Geração de narrativas
├── variavel/           # Sugestão de metodologias
└── workflow/           # Configuração assistida
```

---

## 4. Priorização de Implementação

### Fase 1: Quick Wins (1-2 meses)

1. **Sumarização de Análises Qualitativas**
   - Baixo risco, alto valor percebido
   - Dados já estruturados no `MetaCicloFisicoAnalise`
   - Fácil rollback se necessário

2. **Classificação de Transferências**
   - Processo existente pode ser aprimorado
   - ROI mensurável em tempo de triagem

### Fase 2: Valor Estratégico (3-4 meses)

3. **Assistente de Relatórios**
   - Impacto direto na produtividade
   - Requer integração com geradores de PDF/Excel

4. **Validação de Descrições de Projetos**
   - Melhora qualidade dos dados do sistema
   - Previne retrabalho futuro

### Fase 3: Diferenciação (6+ meses)

5. **Análise Preditiva de Riscos**
   - Combina dados históricos + texto
   - Requer acumulação de dados de treinamento

6. **Chatbot de Suporte ao Usuário**
   - Baseado na documentação do sistema
   - Integração com privilégios de acesso

---

## 5. Considerações de Segurança e Governança

### 5.1 Dados Sensíveis

| Categoria | Restrição | Solução |
|-----------|-----------|---------|
| Orçamento detalhado | Alta | Não enviar para APIs externas |
| Dados de parlamentares | Média | Anonimização antes de processar |
| Análises qualitativas | Média | Modelo local ou pseudonimização |
| Descrições de projetos | Baixa | Pode usar API externa |

### 5.2 Rastreabilidade

```typescript
// Tabela sugerida para auditoria
model LLMInteracao {
  id              Int      @id @default(autoincrement())
  pessoa_id       Int
  endpoint        String   // qual funcionalidade
  tipo_operacao   String   // sumarizar, classificar, etc
  input_tokens    Int
  output_tokens   Int
  tempo_ms        Int
  custo_estimado  Decimal?
  cache_hit       Boolean  // se usou cache
  criado_em       DateTime @default(now())
}
```

---

## 6. Métricas de Sucesso

| Indicador | Baseline | Meta | Como Medir |
|-----------|----------|------|------------|
| Tempo de análise de ciclo | 4 horas | 1 hora | Tempo entre abertura e fechamento |
| Taxa de aceitação de sugestões | - | >70% | Logs de interação |
| Erros em relatórios | 15% | <5% | Retrabalho identificado |
| Satisfação dos usuários | - | >4.0/5 | Pesquisa NPS |
| Custo por processamento | - | <$0.10 | Monitoramento de tokens |

---

## 7. Conclusão

Uma LLM de 1B parâmetros pode agregar **valor significativo e mensurável** ao SMAE, especialmente em áreas que envolvem:

1. **Processamento de linguagem natural** em análises e comunicações
2. **Classificação e categorização** de transferências e demandas
3. **Geração assistida** de textos para relatórios e descrições
4. **Validação e padronização** de conteúdo inserido no sistema

A chave para o sucesso está em:
- Começar com casos de uso de **baixo risco e alto valor**
- Manter **fallbacks baseados em regras** para garantir continuidade
- Implementar **monitoramento rigoroso** de custos e qualidade
- Respeitar as **restrições de segurança** de dados governamentais

---

**Próximos Passos Recomendados:**
1. Prova de conceito com sumarização de análises qualitativas
2. Benchmark de modelos 1B (TinyLlama, Phi-2, Qwen-1.8B)
3. Definição de arquitetura de integração
4. Levantamento de dados para fine-tuning no domínio público
