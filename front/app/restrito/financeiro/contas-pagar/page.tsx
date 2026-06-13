'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign, CheckCircle, Clock, AlertCircle,
  Calendar, X, Loader2, Eye, Filter,
  ChevronLeft, ChevronRight, Search,
  AlertTriangle, Plus, RefreshCw, TrendingUp,
  TrendingDown, BarChart3, Tag, Trash2,
  Edit2, CreditCard, Ban,
  RotateCcw, Receipt, Landmark,
  Repeat, ChevronDown,
  Layers, Building2, Hash, User, Paperclip,
  SplitSquareHorizontal, LayoutDashboard,
  ListFilter, Settings, Percent, Info,
} from 'lucide-react';
import HeaderEnterprise from '@/components/header';
import { getToken, getUserId } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type StatusContaPagar = 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO' | 'PARCIAL';
type FormaPagamento =
  | 'DINHEIRO' | 'PIX' | 'BOLETO' | 'TRANSFERENCIA'
  | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'CHEQUE';
type TipoRecorrencia =
  | 'DIARIA' | 'SEMANAL' | 'MENSAL' | 'BIMESTRAL'
  | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
type TipoDespesa =
  | 'INSUMO' | 'SALARIO' | 'SERVICO' | 'UTILIDADE'
  | 'MATERIAL' | 'RETIRADA' | 'IMPOSTO' | 'ALUGUEL'
  | 'MANUTENCAO' | 'TRANSPORTE' | 'OUTRO';

interface Categoria {
  id: string;
  nome: string;
  tipo: TipoDespesa;
  cor?: string;
  icone?: string;
  ativo: boolean;
}

interface Parcela {
  id: string;
  numero: number;
  valor: number;
  valor_pago: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: StatusContaPagar;
}

interface Pagamento {
  id: string;
  valor: number;
  valor_desconto: number;
  valor_juros: number;
  data_pagamento: string;
  forma_pagamento: FormaPagamento;
  conta_bancaria?: string;
  observacoes?: string;
  created_at: string;
}

interface ContaPagar {
  id: string;
  descricao: string;
  numero_documento?: string;
  beneficiario?: string;
  observacoes?: string;
  valor_total: number;
  valor_pago: number;
  valor_aberto: number;
  valor_desconto?: number;
  valor_juros?: number;
  data_vencimento: string;
  data_competencia?: string;
  data_pagamento?: string;
  status: StatusContaPagar;
  forma_pagamento?: FormaPagamento;
  centro_custo?: string;
  conta_bancaria?: string;
  numero_parcelas: number;
  parcela_atual?: number;
  conta_pai_id?: string;
  recorrente: boolean;
  tipo_recorrencia?: TipoRecorrencia;
  recorrencia_fim?: string;
  categoria?: Categoria;
  categoria_id?: string;
  parcelas?: Parcela[];
  pagamentos?: Pagamento[];
  created_at: string;
  anexo_url?: string;
}

interface DashboardData {
  resumo: {
    total_geral: number;
    total_pago: number;
    total_pendente: number;
    total_vencido: number;
    total_cancelado: number;
    taxa_inadimplencia: number;
  };
  mes_atual: {
    referencia: string;
    por_status: Array<{ status: string; total: number; quantidade: number }>;
  };
  por_categoria: Array<{
    categoria: string;
    cor?: string;
    total: number;
    pago: number;
    pendente: number;
    quantidade: number;
  }>;
  alertas: {
    proximos_vencer: ContaPagar[];
    vencidos_em_aberto: ContaPagar[];
    total_em_atraso: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusContaPagar, { label: string; color: string; icon: React.ReactNode }> = {
  PENDENTE:  { label: 'Pendente',  color: 'bg-amber-100 text-amber-800 border-amber-200',  icon: <Clock className="h-3 w-3" /> },
  PAGO:      { label: 'Pago',      color: 'bg-green-100 text-green-800 border-green-200',  icon: <CheckCircle className="h-3 w-3" /> },
  VENCIDO:   { label: 'Vencido',   color: 'bg-red-100 text-red-800 border-red-200',        icon: <AlertCircle className="h-3 w-3" /> },
  CANCELADO: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600 border-gray-200',     icon: <Ban className="h-3 w-3" /> },
  PARCIAL:   { label: 'Parcial',   color: 'bg-blue-100 text-blue-800 border-blue-200',     icon: <Layers className="h-3 w-3" /> },
};

const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  DINHEIRO:       'Dinheiro',
  PIX:            'PIX',
  BOLETO:         'Boleto',
  TRANSFERENCIA:  'Transferência',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO:  'Cartão de Débito',
  CHEQUE:         'Cheque',
};

const RECORRENCIA_LABELS: Record<TipoRecorrencia, string> = {
  DIARIA:     'Diária',
  SEMANAL:    'Semanal',
  MENSAL:     'Mensal',
  BIMESTRAL:  'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL:  'Semestral',
  ANUAL:      'Anual',
};

const TIPO_DESPESA_LABELS: Record<TipoDespesa, string> = {
  INSUMO: 'Insumo', SALARIO: 'Salário', SERVICO: 'Serviço',
  UTILIDADE: 'Utilidade', MATERIAL: 'Material', RETIRADA: 'Retirada',
  IMPOSTO: 'Imposto', ALUGUEL: 'Aluguel', MANUTENCAO: 'Manutenção',
  TRANSPORTE: 'Transporte', OUTRO: 'Outro',
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (d?: string) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

/** Distribui valorTotal em n parcelas (ajuste de centavos na última) */
function calcularParcelas(valorTotal: number, n: number, dataBase: string) {
  if (!valorTotal || !n || n < 1 || !dataBase) return [];
  const valorParcela = Math.floor((valorTotal / n) * 100) / 100;
  return Array.from({ length: n }, (_, i) => {
    const valor = i === n - 1
      ? +(valorTotal - valorParcela * (n - 1)).toFixed(2)
      : valorParcela;
    const dataVenc = addMonths(new Date(dataBase + 'T12:00:00'), i);
    return { numero: i + 1, valor, dataVencimento: format(dataVenc, 'dd/MM/yyyy') };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusContaPagar }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge className={`flex items-center gap-1 text-xs font-medium border ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL BASE
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ isOpen, onClose, title, children, size = 'md' }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh] px-4 pb-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white w-full ${widths[size]} rounded-xl shadow-2xl overflow-hidden flex flex-col`}
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: CRIAR / EDITAR CONTA
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  descricao: '', numero_documento: '', beneficiario: '',
  observacoes: '', valor_total: '', data_vencimento: '',
  data_competencia: '', forma_pagamento: '' as FormaPagamento | '',
  categoria_id: '', centro_custo: '', conta_bancaria: '',
  numero_parcelas: '1', recorrente: false,
  tipo_recorrencia: '' as TipoRecorrencia | '',
  recorrencia_fim: '', anexo_url: '',
};

function ModalConta({ isOpen, onClose, conta, categorias, onSaved }: {
  isOpen: boolean;
  onClose: () => void;
  conta?: ContaPagar | null;
  categorias: Categoria[];
  onSaved: () => void;
}) {
  const token   = getToken();
  const userId  = getUserId();
  const isEdit  = !!conta;

  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview das parcelas calculado de forma derivada (sem estado extra)
  const numParcelas = parseInt(form.numero_parcelas) || 1;
  const previewParcelas = !isEdit && numParcelas > 1 && form.valor_total && form.data_vencimento
    ? calcularParcelas(parseFloat(form.valor_total), numParcelas, form.data_vencimento)
    : [];

  // Popula formulário ao abrir
  useEffect(() => {
    if (!isOpen) return;
    if (conta) {
      setForm({
        descricao:        conta.descricao ?? '',
        numero_documento: conta.numero_documento ?? '',
        beneficiario:     conta.beneficiario ?? '',
        observacoes:      conta.observacoes ?? '',
        valor_total:      String(conta.valor_total),
        data_vencimento:  conta.data_vencimento?.slice(0, 10) ?? '',
        data_competencia: conta.data_competencia?.slice(0, 10) ?? '',
        forma_pagamento:  (conta.forma_pagamento ?? '') as FormaPagamento | '',
        categoria_id:     conta.categoria_id ?? '',
        centro_custo:     conta.centro_custo ?? '',
        conta_bancaria:   conta.conta_bancaria ?? '',
        numero_parcelas:  String(conta.numero_parcelas ?? 1),
        recorrente:       conta.recorrente ?? false,
        tipo_recorrencia: (conta.tipo_recorrencia ?? '') as TipoRecorrencia | '',
        recorrencia_fim:  conta.recorrencia_fim?.slice(0, 10) ?? '',
        anexo_url:        conta.anexo_url ?? '',
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
  }, [isOpen, conta]);

  const set = (key: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.descricao || !form.valor_total || !form.data_vencimento) {
      alert('Preencha os campos obrigatórios: Descrição, Valor e Data de Vencimento');
      return;
    }
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        descricao:        form.descricao,
        valor_total:      parseFloat(form.valor_total),
        data_vencimento:  form.data_vencimento,
        numero_parcelas:  parseInt(form.numero_parcelas) || 1,
        recorrente:       form.recorrente,
        usuario_id:       userId,
      };

      // Campos opcionais — só envia se preenchidos
      if (form.numero_documento) body.numero_documento = form.numero_documento;
      if (form.beneficiario)     body.beneficiario     = form.beneficiario;
      if (form.observacoes)      body.observacoes      = form.observacoes;
      if (form.data_competencia) body.data_competencia = form.data_competencia;
      if (form.forma_pagamento)  body.forma_pagamento  = form.forma_pagamento;
      if (form.categoria_id)     body.categoria_id     = form.categoria_id;
      if (form.centro_custo)     body.centro_custo     = form.centro_custo;
      if (form.conta_bancaria)   body.conta_bancaria   = form.conta_bancaria;
      if (form.anexo_url)        body.anexo_url        = form.anexo_url;

      if (form.recorrente && form.tipo_recorrencia)
        body.tipo_recorrencia = form.tipo_recorrencia;
      if (form.recorrente && form.recorrencia_fim)
        body.recorrencia_fim = form.recorrencia_fim;

      const url    = isEdit ? `${API_URL}/contas-pagar/${conta!.id}` : `${API_URL}/contas-pagar`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao salvar');
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro ao salvar'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
      size="lg"
    >
      <div className="p-5 space-y-5">

        {/* ── Identificação ────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Identificação</p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Descrição *</Label>
              <Input
                placeholder="Ex: Fornecedor de matéria-prima, Aluguel sala..."
                value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                className="border-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Nº Documento</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="NF, boleto, contrato..." value={form.numero_documento}
                    onChange={e => set('numero_documento', e.target.value)} className="border-gray-300 pl-9" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Beneficiário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Fornecedor / beneficiário" value={form.beneficiario}
                    onChange={e => set('beneficiario', e.target.value)} className="border-gray-300 pl-9" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Valores e Datas ───────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Valores e Datas</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Valor Total *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                <Input type="number" step="0.01" min="0" placeholder="0,00"
                  value={form.valor_total} onChange={e => set('valor_total', e.target.value)}
                  className="border-gray-300 pl-9" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Nº de Parcelas
                {!isEdit && numParcelas > 1 && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    ({numParcelas}x de {form.valor_total ? fmtCurrency(parseFloat(form.valor_total) / numParcelas) : '—'})
                  </span>
                )}
              </Label>
              <div className="relative">
                <SplitSquareHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="number" min="1" max="360" value={form.numero_parcelas}
                  onChange={e => set('numero_parcelas', e.target.value)}
                  className="border-gray-300 pl-9" disabled={isEdit} />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                {numParcelas > 1 ? 'Vencimento 1ª Parcela *' : 'Vencimento *'}
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="date" value={form.data_vencimento}
                  onChange={e => set('data_vencimento', e.target.value)}
                  className="border-gray-300 pl-9" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Competência</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="date" value={form.data_competencia}
                  onChange={e => set('data_competencia', e.target.value)}
                  className="border-gray-300 pl-9" />
              </div>
            </div>
          </div>

          {/* Preview das parcelas */}
          {previewParcelas.length > 0 && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-semibold text-blue-700">
                  Serão criadas {numParcelas} contas independentes:
                </p>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {previewParcelas.map(p => (
                  <div key={p.numero} className="flex items-center justify-between text-xs text-blue-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center text-[10px]">
                        {p.numero}
                      </span>
                      Parcela {p.numero}/{numParcelas}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600">{p.dataVencimento}</span>
                      <span className="font-bold">{fmtCurrency(p.valor)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-blue-500 mt-2">
                Cada parcela poderá ser paga e gerenciada individualmente.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* ── Classificação ────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Classificação</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Categoria</Label>
              <Select value={form.categoria_id || '_none'} onValueChange={v => set('categoria_id', v === '_none' ? '' : v)}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sem categoria</SelectItem>
                  {categorias.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        {c.cor && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.cor }} />}
                        {c.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Forma de Pagamento</Label>
              <Select value={form.forma_pagamento || '_none'} onValueChange={v => set('forma_pagamento', v === '_none' ? '' : v)}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Não definido</SelectItem>
                  {Object.entries(FORMA_PAGAMENTO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Centro de Custo</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Ex: Produção, Administrativo..." value={form.centro_custo}
                  onChange={e => set('centro_custo', e.target.value)} className="border-gray-300 pl-9" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Conta Bancária</Label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Banco / conta..." value={form.conta_bancaria}
                  onChange={e => set('conta_bancaria', e.target.value)} className="border-gray-300 pl-9" />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Recorrência ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recorrência</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => set('recorrente', !form.recorrente)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.recorrente ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.recorrente ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-600">{form.recorrente ? 'Ativo' : 'Inativo'}</span>
            </label>
          </div>

          {form.recorrente && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo de Recorrência *</Label>
                <Select value={form.tipo_recorrencia || '_none'} onValueChange={v => set('tipo_recorrencia', v === '_none' ? '' : v)}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECORRENCIA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Data Fim</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="date" value={form.recorrencia_fim}
                    onChange={e => set('recorrencia_fim', e.target.value)}
                    className="border-gray-300 pl-9" />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* ── Observações e Anexo ───────────────────────────────────── */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</Label>
            <Textarea rows={2} placeholder="Informações adicionais..."
              value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
              className="border-gray-300" />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">URL do Anexo</Label>
            <div className="relative">
              <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="https://..." value={form.anexo_url}
                onChange={e => set('anexo_url', e.target.value)} className="border-gray-300 pl-9" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
        <Button variant="outline" onClick={onClose} className="flex-1 border-gray-300">Cancelar</Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          {isSubmitting
            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            : isEdit ? <Edit2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {isEdit
            ? 'Salvar Alterações'
            : numParcelas > 1 ? `Criar ${numParcelas} Parcelas` : 'Criar Conta'}
        </Button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: REGISTRAR PAGAMENTO
// ─────────────────────────────────────────────────────────────────────────────

function ModalPagamento({ isOpen, onClose, conta, onSaved }: {
  isOpen: boolean;
  onClose: () => void;
  conta: ContaPagar | null;
  onSaved: () => void;
}) {
  const token  = getToken();
  const userId = getUserId();

  const [form, setForm] = useState({
    valor: '',
    data_pagamento: new Date().toISOString().slice(0, 10),
    forma_pagamento: '' as FormaPagamento | '',
    valor_desconto: '0',
    valor_juros: '0',
    conta_bancaria: '',
    observacoes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && conta) {
      setForm(prev => ({ ...prev, valor: String(conta.valor_aberto > 0 ? conta.valor_aberto : conta.valor_total) }));
    }
  }, [isOpen, conta]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const valorLiquido =
    (parseFloat(form.valor) || 0) +
    (parseFloat(form.valor_juros) || 0) -
    (parseFloat(form.valor_desconto) || 0);

  const handleSubmit = async () => {
    if (!form.valor || !form.forma_pagamento || !form.data_pagamento) {
      alert('Preencha valor, forma de pagamento e data');
      return;
    }
    setIsSubmitting(true);
    try {
      const body = {
        valor:           parseFloat(form.valor),
        data_pagamento:  form.data_pagamento,
        forma_pagamento: form.forma_pagamento,
        valor_desconto:  parseFloat(form.valor_desconto) || 0,
        valor_juros:     parseFloat(form.valor_juros)    || 0,
        conta_bancaria:  form.conta_bancaria || undefined,
        observacoes:     form.observacoes    || undefined,
        usuario_id:      userId,
      };

      const res = await fetch(`${API_URL}/contas-pagar/${conta!.id}/pagamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao registrar pagamento');
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!conta) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pagamento" size="md">
      <div className="p-5 space-y-4">
        {/* Info da conta */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">{conta.descricao}</p>
              {conta.numero_parcelas > 1 && conta.parcela_atual && (
                <p className="text-xs text-blue-600 mt-0.5">
                  Parcela {conta.parcela_atual}/{conta.numero_parcelas}
                </p>
              )}
            </div>
            <StatusBadge status={conta.status} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-gray-500">Valor em aberto</p>
              <p className="text-lg font-bold text-blue-700">{fmtCurrency(conta.valor_aberto)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Vencimento</p>
              <p className="text-sm font-medium text-gray-700">{fmtDate(conta.data_vencimento)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Valor do Pagamento *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
              <Input type="number" step="0.01" min="0"
                value={form.valor} onChange={e => set('valor', e.target.value)}
                className="border-gray-300 pl-9" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Data do Pagamento *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="date" value={form.data_pagamento}
                onChange={e => set('data_pagamento', e.target.value)}
                className="border-gray-300 pl-9" />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Forma de Pagamento *</Label>
          <Select value={form.forma_pagamento || '_none'} onValueChange={v => set('forma_pagamento', v === '_none' ? '' : v)}>
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FORMA_PAGAMENTO_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Desconto</Label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="number" step="0.01" min="0" placeholder="0,00"
                value={form.valor_desconto} onChange={e => set('valor_desconto', e.target.value)}
                className="border-gray-300 pl-9" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Juros / Multa</Label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="number" step="0.01" min="0" placeholder="0,00"
                value={form.valor_juros} onChange={e => set('valor_juros', e.target.value)}
                className="border-gray-300 pl-9" />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Conta Bancária</Label>
          <div className="relative">
            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Banco / conta utilizada"
              value={form.conta_bancaria} onChange={e => set('conta_bancaria', e.target.value)}
              className="border-gray-300 pl-9" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Observações</Label>
          <Textarea rows={2} placeholder="Notas sobre o pagamento..."
            value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
            className="border-gray-300" />
        </div>

        {/* Resumo */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Valor líquido a quitar:</span>
          <span className="text-lg font-bold text-gray-800">{fmtCurrency(valorLiquido)}</span>
        </div>
      </div>

      <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
        <Button variant="outline" onClick={onClose} className="flex-1 border-gray-300">Cancelar</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm">
          {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          Confirmar Pagamento
        </Button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: DETALHES DA CONTA
// ─────────────────────────────────────────────────────────────────────────────

function ModalDetalhes({ isOpen, onClose, contaId, onEstornar }: {
  isOpen: boolean;
  onClose: () => void;
  contaId: string | null;
  onEstornar: (contaId: string, pagamentoId: string) => void;
}) {
  const token = getToken();
  const [conta, setConta]   = useState<ContaPagar | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !contaId) return;
    setIsLoading(true);
    fetch(`${API_URL}/contas-pagar/${contaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setConta)
      .finally(() => setIsLoading(false));
  }, [isOpen, contaId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes da Conta" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : conta ? (
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800">{conta.descricao}</h3>
              {conta.beneficiario && <p className="text-sm text-gray-500 mt-0.5">{conta.beneficiario}</p>}
              {conta.numero_documento && (
                <p className="text-xs text-gray-400 mt-1">Doc: {conta.numero_documento}</p>
              )}
              {conta.numero_parcelas > 1 && conta.parcela_atual && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <SplitSquareHorizontal className="h-3 w-3" />
                  Parcela {conta.parcela_atual} de {conta.numero_parcelas}
                </p>
              )}
            </div>
            <StatusBadge status={conta.status} />
          </div>

          {/* Valores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-base font-bold text-gray-800">{fmtCurrency(conta.valor_total)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Pago</p>
              <p className="text-base font-bold text-green-700">{fmtCurrency(conta.valor_pago)}</p>
            </div>
            <div className={`border rounded-lg p-3 text-center ${conta.valor_aberto > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs text-gray-500 mb-1">Em Aberto</p>
              <p className={`text-base font-bold ${conta.valor_aberto > 0 ? 'text-red-700' : 'text-gray-500'}`}>
                {fmtCurrency(conta.valor_aberto)}
              </p>
            </div>
          </div>

          {/* Progress */}
          {conta.valor_total > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progresso do pagamento</span>
                <span>{((conta.valor_pago / conta.valor_total) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min((conta.valor_pago / conta.valor_total) * 100, 100)}%` }} />
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              { label: 'Vencimento', value: fmtDate(conta.data_vencimento), show: true },
              { label: 'Competência', value: fmtDate(conta.data_competencia), show: !!conta.data_competencia },
              { label: 'Categoria', value: conta.categoria?.nome, show: !!conta.categoria, color: conta.categoria?.cor },
              { label: 'Forma Pgto.', value: conta.forma_pagamento ? FORMA_PAGAMENTO_LABELS[conta.forma_pagamento] : null, show: !!conta.forma_pagamento },
              { label: 'Centro de Custo', value: conta.centro_custo, show: !!conta.centro_custo },
              { label: 'Conta Bancária', value: conta.conta_bancaria, show: !!conta.conta_bancaria },
            ].filter(r => r.show).map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-gray-500">{r.label}</span>
                <span className="font-medium text-gray-700 flex items-center gap-1">
                  {r.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />}
                  {r.value ?? '—'}
                </span>
              </div>
            ))}
            {conta.recorrente && (
              <div className="flex justify-between">
                <span className="text-gray-500">Recorrência</span>
                <span className="font-medium text-blue-600 flex items-center gap-1">
                  <Repeat className="h-3 w-3" />
                  {conta.tipo_recorrencia ? RECORRENCIA_LABELS[conta.tipo_recorrencia] : '—'}
                </span>
              </div>
            )}
          </div>

          {/* Histórico de pagamentos */}
          {conta.pagamentos && conta.pagamentos.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Histórico de Pagamentos</p>
                <div className="space-y-2">
                  {conta.pagamentos.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-md">
                      <div>
                        <p className="text-sm font-bold text-green-700">{fmtCurrency(p.valor)}</p>
                        <p className="text-xs text-gray-500">
                          {fmtDate(p.data_pagamento)} · {FORMA_PAGAMENTO_LABELS[p.forma_pagamento]}
                        </p>
                        {(p.valor_desconto > 0 || p.valor_juros > 0) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {p.valor_desconto > 0 && `Desconto: ${fmtCurrency(p.valor_desconto)} `}
                            {p.valor_juros > 0 && `Juros: ${fmtCurrency(p.valor_juros)}`}
                          </p>
                        )}
                      </div>
                      <button onClick={() => onEstornar(conta.id, p.id)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium">
                        <RotateCcw className="h-3 w-3" />
                        Estornar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {conta.observacoes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Observações</p>
                <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">{conta.observacoes}</p>
              </div>
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: CATEGORIAS
// ─────────────────────────────────────────────────────────────────────────────

function ModalCategorias({ isOpen, onClose, categorias, onSaved }: {
  isOpen: boolean;
  onClose: () => void;
  categorias: Categoria[];
  onSaved: () => void;
}) {
  const token = getToken();
  const [form, setForm]           = useState({ nome: '', tipo: 'OUTRO' as TipoDespesa, cor: '#3B82F6', icone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!form.nome) { alert('Informe o nome da categoria'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/contas-pagar/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erro ao criar categoria');
      setForm({ nome: '', tipo: 'OUTRO', cor: '#3B82F6', icone: '' });
      onSaved();
    } catch (err: unknown) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Categorias de Despesa" size="md">
      <div className="p-5 space-y-5">
        {/* Lista existente */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Categorias Cadastradas</p>
          {categorias.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Tag className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma categoria cadastrada</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categorias.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-md">
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: c.cor ?? '#9CA3AF' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">{c.nome}</p>
                    <p className="text-xs text-gray-400">{TIPO_DESPESA_LABELS[c.tipo]}</p>
                  </div>
                  <Badge className={`text-xs ${c.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Nova categoria */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Nova Categoria</p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome *</Label>
              <Input placeholder="Ex: Aluguel, Fornecedores..." value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="border-gray-300" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as TipoDespesa }))}>
                  <SelectTrigger className="border-gray-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_DESPESA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Cor</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.cor}
                    onChange={e => setForm(p => ({ ...p, cor: e.target.value }))}
                    className="w-10 h-9 rounded border border-gray-300 cursor-pointer" />
                  <Input value={form.cor} onChange={e => setForm(p => ({ ...p, cor: e.target.value }))}
                    className="border-gray-300 font-mono text-sm" maxLength={7} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
        <Button variant="outline" onClick={onClose} className="flex-1 border-gray-300">Fechar</Button>
        <Button onClick={handleCreate} disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
          {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Criar Categoria
        </Button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTA CARD
// ─────────────────────────────────────────────────────────────────────────────

function ContaCard({ conta, onPagar, onEditar, onDetalhes, onCancelar, onDelete }: {
  conta: ContaPagar;
  onPagar: (c: ContaPagar) => void;
  onEditar: (c: ContaPagar) => void;
  onDetalhes: (id: string) => void;
  onCancelar: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isVencida = conta.status === 'VENCIDO';
  const isPago    = conta.status === 'PAGO' || conta.status === 'CANCELADO';
  const diasVenc  = Math.ceil(
    (new Date(conta.data_vencimento + 'T12:00:00').getTime() - Date.now()) / 86_400_000,
  );

  const isParcela = conta.numero_parcelas > 1 && conta.parcela_atual != null;

  return (
    <div className={`bg-white border rounded-lg hover:shadow-md transition-all ${isVencida ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-gray-800 truncate">{conta.descricao}</h4>
              {isParcela && (
                <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  <SplitSquareHorizontal className="h-2.5 w-2.5" />
                  {conta.parcela_atual}/{conta.numero_parcelas}
                </span>
              )}
              {conta.recorrente && (
                <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                  <Repeat className="h-2.5 w-2.5" />
                  {conta.tipo_recorrencia ? RECORRENCIA_LABELS[conta.tipo_recorrencia] : 'Recorrente'}
                </span>
              )}
            </div>
            {conta.beneficiario && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{conta.beneficiario}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {conta.categoria && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  {conta.categoria.cor && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: conta.categoria.cor }} />}
                  {conta.categoria.nome}
                </span>
              )}
              {conta.numero_documento && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                  #{conta.numero_documento}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={conta.status} />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44">
                    <button onClick={() => { onDetalhes(conta.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Eye className="h-3.5 w-3.5 text-gray-400" /> Ver detalhes
                    </button>
                    {!isPago && (
                      <>
                        <button onClick={() => { onPagar(conta); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50">
                          <CreditCard className="h-3.5 w-3.5 text-green-500" /> Registrar pgto.
                        </button>
                        <button onClick={() => { onEditar(conta); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Edit2 className="h-3.5 w-3.5 text-gray-400" /> Editar
                        </button>
                        <button onClick={() => { onCancelar(conta.id); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50">
                          <Ban className="h-3.5 w-3.5 text-amber-500" /> Cancelar
                        </button>
                      </>
                    )}
                    <Separator className="my-1" />
                    <button onClick={() => { onDelete(conta.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" /> Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Valores e vencimento */}
        <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              {isParcela ? 'Valor da parcela' : 'Valor total'}
            </p>
            <p className="text-base font-bold text-gray-800">{fmtCurrency(conta.valor_total)}</p>
            {conta.valor_aberto > 0 && conta.valor_pago > 0 && (
              <p className="text-xs text-amber-600 mt-0.5">Aberto: {fmtCurrency(conta.valor_aberto)}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Vencimento</p>
            <p className={`text-sm font-semibold ${isVencida ? 'text-red-600' : diasVenc <= 7 ? 'text-amber-600' : 'text-gray-700'}`}>
              {fmtDate(conta.data_vencimento)}
            </p>
            {!isPago && diasVenc <= 7 && (
              <p className={`text-xs mt-0.5 ${diasVenc < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                {diasVenc < 0
                  ? `${Math.abs(diasVenc)} dia(s) em atraso`
                  : `Vence em ${diasVenc} dia(s)`}
              </p>
            )}
          </div>
        </div>

        {/* Barra de progresso (pagamento parcial) */}
        {conta.status === 'PARCIAL' && conta.valor_total > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Pago {((conta.valor_pago / conta.valor_total) * 100).toFixed(0)}%</span>
              <span>{fmtCurrency(conta.valor_pago)} de {fmtCurrency(conta.valor_total)}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(conta.valor_pago / conta.valor_total) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function ContasPagarPage() {
  const token = getToken();

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [view, setView]               = useState<'dashboard' | 'lista'>('dashboard');
  const [contas, setContas]           = useState<ContaPagar[]>([]);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalContas, setTotalContas] = useState(0);
  const [dashboard, setDashboard]     = useState<DashboardData | null>(null);
  const [categorias, setCategorias]   = useState<Categoria[]>([]);
  const [isLoading, setIsLoading]     = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    status: '', categoria_id: '', descricao: '', beneficiario: '',
    vencimento_de: '', vencimento_ate: '',
    apenas_vencidos: false, apenas_recorrentes: false,
    page: 1, limit: 15,
    order_by: 'data_vencimento', order_dir: 'ASC',
  });

  // Modais
  const [modalNova, setModalNova]           = useState(false);
  const [modalEdit, setModalEdit]           = useState<ContaPagar | null>(null);
  const [modalPagar, setModalPagar]         = useState<ContaPagar | null>(null);
  const [modalDetalhes, setModalDetalhes]   = useState<string | null>(null);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  // ── Loaders ─────────────────────────────────────────────────────────────────

  const carregarCategorias = useCallback(async () => {
    const res = await fetch(`${API_URL}/contas-pagar/categorias/listar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setCategorias(await res.json());
  }, [token]);

  const carregarContas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.status)           params.set('status',            filtros.status);
      if (filtros.categoria_id)     params.set('categoria_id',      filtros.categoria_id);
      if (filtros.descricao)        params.set('descricao',         filtros.descricao);
      if (filtros.beneficiario)     params.set('beneficiario',      filtros.beneficiario);
      if (filtros.vencimento_de)    params.set('vencimento_de',     filtros.vencimento_de);
      if (filtros.vencimento_ate)   params.set('vencimento_ate',    filtros.vencimento_ate);
      if (filtros.apenas_vencidos)  params.set('apenas_vencidos',   'true');
      if (filtros.apenas_recorrentes) params.set('apenas_recorrentes', 'true');
      params.set('page',      String(filtros.page));
      params.set('limit',     String(filtros.limit));
      params.set('order_by',  filtros.order_by);
      params.set('order_dir', filtros.order_dir);

      const res = await fetch(`${API_URL}/contas-pagar?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContas(data.data ?? []);
        setTotalPages(data.meta?.total_pages ?? 1);
        setTotalContas(data.meta?.total ?? 0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filtros, token]);

  const carregarDashboard = useCallback(async () => {
    const res = await fetch(`${API_URL}/contas-pagar/dashboard/resumo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setDashboard(await res.json());
  }, [token]);

  useEffect(() => { carregarCategorias(); carregarDashboard(); }, [carregarCategorias, carregarDashboard]);
  useEffect(() => { carregarContas(); }, [carregarContas]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleCancelar = async (id: string) => {
    if (!confirm('Deseja cancelar esta conta?')) return;
    await fetch(`${API_URL}/contas-pagar/${id}/cancelar`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    });
    carregarContas(); carregarDashboard();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta conta permanentemente?')) return;
    await fetch(`${API_URL}/contas-pagar/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    carregarContas(); carregarDashboard();
  };

  const handleEstornar = async (contaId: string, pagamentoId: string) => {
    if (!confirm('Deseja estornar este pagamento?')) return;
    await fetch(`${API_URL}/contas-pagar/${contaId}/pagamentos/${pagamentoId}/estornar`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    setModalDetalhes(null);
    carregarContas(); carregarDashboard();
  };

  const onSaved = () => { carregarContas(); carregarDashboard(); };

  const setFiltro = (key: string, value: string | boolean | number) =>
    setFiltros(prev => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));

  const limparFiltros = () =>
    setFiltros(prev => ({
      ...prev,
      status: '', categoria_id: '', descricao: '', beneficiario: '',
      vencimento_de: '', vencimento_ate: '',
      apenas_vencidos: false, apenas_recorrentes: false, page: 1,
    }));

  // ── Dashboard render ─────────────────────────────────────────────────────────

  const renderDashboard = () => {
    const d = dashboard;
    if (!d) return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Geral',  value: d.resumo.total_geral,    icon: <DollarSign className="h-6 w-6" />,  color: 'from-blue-50 to-blue-100 text-blue-600',   textColor: 'text-gray-800' },
            { label: 'Total Pago',   value: d.resumo.total_pago,     icon: <CheckCircle className="h-6 w-6" />, color: 'from-green-50 to-green-100 text-green-600', textColor: 'text-green-700' },
            { label: 'Pendente',     value: d.resumo.total_pendente, icon: <Clock className="h-6 w-6" />,       color: 'from-amber-50 to-amber-100 text-amber-600', textColor: 'text-amber-700' },
            { label: 'Vencido',      value: d.resumo.total_vencido,  icon: <AlertCircle className="h-6 w-6" />, color: 'from-red-50 to-red-100 text-red-600',       textColor: 'text-red-700' },
          ].map(({ label, value, icon, color, textColor }) => (
            <Card key={label} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{label}</p>
                    <p className={`text-xl font-bold ${textColor}`}>{fmtCurrency(value)}</p>
                  </div>
                  <div className={`p-2.5 bg-gradient-to-br ${color} rounded-lg`}>{icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumo do período */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Resumo — {d.mes_atual.referencia}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Taxa de Inadimplência</p>
                  <p className="text-2xl font-bold text-red-700">{d.resumo.taxa_inadimplencia}%</p>
                </div>
                {d.resumo.taxa_inadimplencia > 10
                  ? <TrendingDown className="h-8 w-8 text-red-400" />
                  : <TrendingUp   className="h-8 w-8 text-green-400" />
                }
              </div>
              {d.mes_atual.por_status.map(s => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <StatusBadge status={s.status as StatusContaPagar} />
                  <div className="text-right">
                    <span className="font-semibold text-gray-800">{fmtCurrency(s.total)}</span>
                    <span className="text-xs text-gray-400 ml-2">({s.quantidade})</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Por categoria */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Tag className="h-4 w-4 text-purple-600" />
                Por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {d.por_categoria.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sem dados no período</p>
              ) : (
                <div className="space-y-3">
                  {d.por_categoria.slice(0, 6).map(c => {
                    const pct = c.total > 0 ? (c.pago / c.total) * 100 : 0;
                    return (
                      <div key={c.categoria}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {c.cor && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.cor }} />}
                            <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{c.categoria}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{fmtCurrency(c.total)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {d.alertas.vencidos_em_aberto.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-semibold text-red-700">
                      {d.alertas.vencidos_em_aberto.length} conta(s) vencida(s)
                    </p>
                  </div>
                  <p className="text-lg font-bold text-red-700">{fmtCurrency(d.alertas.total_em_atraso)}</p>
                  <p className="text-xs text-red-500">Total em atraso</p>
                  <div className="mt-2 space-y-1">
                    {d.alertas.vencidos_em_aberto.slice(0, 3).map(c => (
                      <p key={c.id} className="text-xs text-red-600 truncate">
                        • {c.descricao} — {fmtCurrency(c.valor_aberto)}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {d.alertas.proximos_vencer.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <p className="text-xs font-semibold text-amber-700">
                      {d.alertas.proximos_vencer.length} vence(m) em 7 dias
                    </p>
                  </div>
                  <div className="space-y-1">
                    {d.alertas.proximos_vencer.slice(0, 4).map(c => (
                      <div key={c.id} className="flex items-center justify-between">
                        <p className="text-xs text-amber-700 truncate mr-2">• {c.descricao}</p>
                        <span className="text-xs font-semibold text-amber-800 flex-shrink-0">
                          {fmtDate(c.data_vencimento)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!d.alertas.vencidos_em_aberto.length && !d.alertas.proximos_vencer.length && (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <CheckCircle className="h-8 w-8 mb-2 text-green-400" />
                  <p className="text-sm font-medium text-green-600">Tudo em dia!</p>
                  <p className="text-xs text-gray-400 mt-1">Sem alertas no momento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ── Lista render ─────────────────────────────────────────────────────────────

  const renderLista = () => (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar descrição..." value={filtros.descricao}
              onChange={e => setFiltro('descricao', e.target.value)}
              className="pl-9 w-52 border-gray-300 text-sm" />
          </div>

          <Select value={filtros.status || '_all'} onValueChange={v => setFiltro('status', v === '_all' ? '' : v)}>
            <SelectTrigger className="w-36 border-gray-300 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtros.categoria_id || '_all'} onValueChange={v => setFiltro('categoria_id', v === '_all' ? '' : v)}>
            <SelectTrigger className="w-40 border-gray-300 text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas</SelectItem>
              {categorias.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md border transition-colors ${
              filtrosAbertos ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <ListFilter className="h-4 w-4" />
            Filtros
          </button>

          <button onClick={limparFiltros}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-md border border-gray-300 hover:border-gray-400 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            Limpar
          </button>
        </div>
        <p className="text-sm text-gray-500 hidden sm:block">{totalContas} conta(s) encontrada(s)</p>
      </div>

      {/* Filtros extras */}
      {filtrosAbertos && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Vencimento De</Label>
            <Input type="date" value={filtros.vencimento_de}
              onChange={e => setFiltro('vencimento_de', e.target.value)} className="border-gray-300 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Vencimento Até</Label>
            <Input type="date" value={filtros.vencimento_ate}
              onChange={e => setFiltro('vencimento_ate', e.target.value)} className="border-gray-300 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Beneficiário</Label>
            <Input placeholder="Nome do fornecedor..." value={filtros.beneficiario}
              onChange={e => setFiltro('beneficiario', e.target.value)} className="border-gray-300 text-sm" />
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filtros.apenas_vencidos}
                onChange={e => setFiltro('apenas_vencidos', e.target.checked)}
                className="rounded border-gray-300" />
              <span className="text-sm text-gray-600">Apenas vencidos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filtros.apenas_recorrentes}
                onChange={e => setFiltro('apenas_recorrentes', e.target.checked)}
                className="rounded border-gray-300" />
              <span className="text-sm text-gray-600">Apenas recorrentes</span>
            </label>
          </div>
        </div>
      )}

      {/* Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : contas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Receipt className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">Nenhuma conta encontrada</p>
          <p className="text-sm mt-1">Tente outros filtros ou cadastre uma nova conta</p>
          <Button onClick={() => setModalNova(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
            <Plus className="h-4 w-4 mr-2" /> Nova Conta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contas.map(c => (
            <ContaCard
              key={c.id}
              conta={c}
              onPagar={setModalPagar}
              onEditar={setModalEdit}
              onDetalhes={setModalDetalhes}
              onCancelar={handleCancelar}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">Página {filtros.page} de {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={filtros.page <= 1}
              onClick={() => setFiltro('page', filtros.page - 1)} className="border-gray-300">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(filtros.page - 2, totalPages - 4)) + i;
              return (
                <Button key={pg} size="sm"
                  variant={filtros.page === pg ? 'default' : 'outline'}
                  onClick={() => setFiltro('page', pg)}
                  className={filtros.page === pg ? 'bg-blue-600 text-white' : 'border-gray-300'}>
                  {pg}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={filtros.page >= totalPages}
              onClick={() => setFiltro('page', filtros.page + 1)} className="border-gray-300">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Render principal ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modais */}
      <ModalConta isOpen={modalNova}    onClose={() => setModalNova(false)}
        categorias={categorias} onSaved={onSaved} />
      <ModalConta isOpen={!!modalEdit}  onClose={() => setModalEdit(null)}
        conta={modalEdit} categorias={categorias} onSaved={onSaved} />
      <ModalPagamento isOpen={!!modalPagar}   onClose={() => setModalPagar(null)}
        conta={modalPagar} onSaved={onSaved} />
      <ModalDetalhes  isOpen={!!modalDetalhes} onClose={() => setModalDetalhes(null)}
        contaId={modalDetalhes} onEstornar={handleEstornar} />
      <ModalCategorias isOpen={modalCategorias} onClose={() => setModalCategorias(false)}
        categorias={categorias} onSaved={carregarCategorias} />

      <HeaderEnterprise />

      <main className="px-4 md:px-6 py-4 md:py-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-blue-600" />
              Contas a Pagar
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestão de despesas, pagamentos e vencimentos</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setModalCategorias(true)}
              className="border-gray-300 text-gray-600 hover:border-gray-400 text-sm" size="sm">
              <Settings className="h-4 w-4 mr-1.5" />
              Categorias
            </Button>
            <Button onClick={() => setModalNova(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 mb-6 w-fit shadow-sm">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
            { key: 'lista',     label: 'Contas',    icon: <Receipt className="h-4 w-4" /> },
          ].map(tab => (
            <button key={tab.key} onClick={() => setView(tab.key as 'dashboard' | 'lista')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                view === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {view === 'dashboard' ? renderDashboard() : renderLista()}
      </main>

      <footer className="mt-8 px-4 md:px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <Badge key={k} className={`text-xs border ${v.color}`}>{v.label}</Badge>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Sistema atualizado em {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </footer>
    </div>
  );
}