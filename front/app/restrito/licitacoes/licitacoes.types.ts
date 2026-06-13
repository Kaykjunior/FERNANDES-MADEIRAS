// ─────────────────────────────────────────────────────────────────────────────
// licitacoes.types.ts  — tipos compartilhados entre as páginas de licitações
// ─────────────────────────────────────────────────────────────────────────────

export type StatusLicitacao =
  | 'RASCUNHO'
  | 'ABERTA'
  | 'EM_PREGAO'
  | 'FINALIZADA'
  | 'CANCELADA';

export interface Produto {
  id: string;
  nome: string;
  codigo_sku: string | null;
  preco_venda_base: string;
  peso_unitario_kg: string;
  unidade_comercial: string;
  categoria?: { id: number; nome: string };
}

// ── Entidades brutas (vêm do backend) ────────────────────────────────────────

export interface LicitacaoItemRaw {
  id: string;
  loteId: string;
  produtoId: string;
  produto: Produto;
  quantidade: number;
  precoReferencia: number;
}

export interface LicitacaoLoteRaw {
  id: string;
  licitacaoId: string;
  numero: number;
  descricao: string | null;
  meuLance: number | null;
  lanceConcorrente: number | null;
  ganhouLote: boolean | null;
  itens: LicitacaoItemRaw[];
}

export interface LicitacaoRaw {
  id: string;
  nome: string;
  numeroEdital: string | null;
  orgao: string | null;
  dataAbertura: string;
  dataEncerramento: string;
  status: StatusLicitacao;
  freteTotal: number;
  custoAdicional: number;
  margemMinimaPercent: number;
  ganhou: boolean | null;
  valorContratado: number | null;
  observacoes: string | null;
  lotes: LicitacaoLoteRaw[];
  createdAt: string;
  updatedAt: string;
}

// ── Tipos calculados (GET /licitacoes/:id/calcular) ───────────────────────────

export interface ItemCalculado {
  itemId: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  pesoPorUnidade: number;
  pesoTotal: number;
  precoReferencia: number;
  precoVendaBase: number;
  custoBase: number;
  ratioFrete: number;
  ratioCustoAdic: number;
  custoFinalTotal: number;
  custoUnitarioFinal: number;
  margemEstimadaPercent: number;
  lanceIdealUnitario: number;
  valorReferenciaTotal: number;
}

export interface LoteCalculado {
  loteId: string;
  numero: number;
  descricao: string;
  meuLance: number | null;
  lanceConcorrente: number | null;
  ganhouLote: boolean | null;
  itensCalculados: ItemCalculado[];
  pesoTotalLote: number;
  custoTotalLote: number;
  valorReferencialLote: number;
  margemMediaLote: number;
  lanceIdealLote: number;
  lucroMeuLance: number | null;
  diferencaConcorrente: number | null;
  abaixoMinimo: boolean;
  alertaConcorrente: boolean;
}

export interface LicitacaoCalculada {
  licitacao: LicitacaoRaw;
  lotesCalculados: LoteCalculado[];
  pesoTotalGeral: number;
  custoTotalGeral: number;
  valorReferencialGeral: number;
  margemMediaGeral: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardData {
  resumo: {
    total: number;
    ganhas: number;
    perdidas: number;
    taxaSucesso: number;
    valorGanho: number;
  };
  licitacoes: (LicitacaoRaw & { diasRestantes: number })[];
  evolucaoGanhos: { mes: string; valor: number }[];
}

// ── Formulário de cadastro (estado local) ─────────────────────────────────────

export interface ItemFormState {
  tempId: string;
  produtoId: string;
  produto: Produto | null;
  quantidade: number;
  precoReferencia: number;
}

export interface LoteFormState {
  tempId: string;
  numero: number;
  descricao: string;
  itens: ItemFormState[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

export const STATUS_LABELS: Record<StatusLicitacao, string> = {
  RASCUNHO:   'Rascunho',
  ABERTA:     'Aberta',
  EM_PREGAO:  'Em Pregão',
  FINALIZADA: 'Finalizada',
  CANCELADA:  'Cancelada',
};

export const STATUS_COLORS: Record<StatusLicitacao, string> = {
  RASCUNHO:   'bg-slate-100 text-slate-600 border-slate-200',
  ABERTA:     'bg-blue-50 text-blue-700 border-blue-200',
  EM_PREGAO:  'bg-amber-50 text-amber-700 border-amber-200',
  FINALIZADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADA:  'bg-red-50 text-red-600 border-red-200',
};