'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users2, TrendingUp, DollarSign, Percent, Download, Filter,
  Building2, Target, Loader2, Calendar, X, TrendingDown,
  ShoppingCart, XCircle, CheckCircle, AlertTriangle, BarChart3,
  ChevronDown, ChevronUp, Minus, FileText, RefreshCw
} from "lucide-react";
import HeaderEnterprise from "@/components/header";
import { API_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';

// ============================================================================
// TYPES
// ============================================================================

interface VendaItem {
  quantidade: number;
  valorUnitario: number;
  custoUnitario?: number;
  valorDesconto?: number;
  valorSubtotal?: number;
}

interface Venda {
  id: string;
  numeroPedido: number;
  vendedorId: string;
  statusVenda: string;
  valorTotal: number;
  valorProdutos: number;
  valorFrete: number;
  valorDesconto: number;
  itens?: VendaItem[];
  vendedor?: VendedorInfo;
}

interface VendedorInfo {
  id: string;
  nome: string;
  cargo: string;
  filial?: string;
}

interface Comissao {
  id: string;
  vendedorId: string;
  vendaId: string;
  baseCalculo: number;
  percentualAplicado: number;
  valorComissao: number;
  status: 'PREVISTA' | 'LIBERADA' | 'PAGA';
  vendedor?: VendedorInfo;
  venda: Venda;
}

interface DashboardResponse {
  periodo: { inicio: string; fim: string };
  totais: {
    previsto: number;
    liberado: number;
    pago: number;
    totalGeral: number;
    totalVendas: number;
  };
}

interface VendedorStats {
  vendedorId: string;
  vendedorNome: string;
  filial: string;
  cargo: string;
  totalVendas: number;
  vendasAprovadas: number;
  vendasCanceladas: number;
  vendasOrcamento: number;
  faturamento: number;
  valorCancelado: number;
  valorOrcamento: number;
  valorFrete: number;
  totalDesconto: number;
  percentualDesconto: number;
  totalUnidades: number;
  ticketMedio: number;
  valorComissao: number;
  comissoesPagas: number;
  comissoesPrevistas: number;
  comissoesLiberadas: number;
  percentualComissao: number;
  taxaCancelamento: number;
  statusMeta: 'otimo' | 'atencao' | 'critico';
}

interface Totais {
  faturamento: number;
  totalCancelado: number;
  totalDesconto: number;
  totalComissoes: number;
  totalUnidades: number;
  totalVendas: number;
  totalAprovadas: number;
  totalCanceladas: number;
  totalOrcamentos: number;
  taxaCancelamento: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const META = {
  DESCONTO_ALERTA: 5,
  DESCONTO_CRITICO: 10,
  CANCELAMENTO_ALERTA: 15,
  CANCELAMENTO_CRITICO: 30,
};

// ============================================================================
// UTILS
// ============================================================================

const R = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const Pct = (v: number | null | undefined) =>
  v == null ? '—' : `${v.toFixed(1)}%`;
const Num = (v: number) => v.toLocaleString('pt-BR');

const statusColor = (s: 'otimo' | 'atencao' | 'critico') =>
  s === 'otimo' ? '#16a34a' : s === 'atencao' ? '#d97706' : '#dc2626';

const calcStatus = (taxaCanc: number, pctDesc: number): 'otimo' | 'atencao' | 'critico' => {
  if (taxaCanc >= META.CANCELAMENTO_CRITICO || pctDesc >= META.DESCONTO_CRITICO) return 'critico';
  if (taxaCanc >= META.CANCELAMENTO_ALERTA || pctDesc >= META.DESCONTO_ALERTA) return 'atencao';
  return 'otimo';
};

const fmtDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

// ============================================================================
// KPI CARD
// ============================================================================

const KPI = ({
  label, value, sub, icon, dark, warn
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  dark?: boolean; warn?: boolean;
}) => (
  <div className={`
    border rounded-sm px-4 py-3 flex flex-col gap-1
    ${dark
      ? 'bg-[#1a2332] border-[#263344] text-white'
      : warn
        ? 'bg-red-50 border-red-300'
        : 'bg-white border-slate-200'}
  `}>
    <div className="flex items-center justify-between">
      <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${dark ? 'text-[#7a99b8]' : warn ? 'text-red-500' : 'text-[#6b7a8d]'
        }`}>
        {label}
      </span>
      <span className={dark ? 'text-[#4a7fa5]' : warn ? 'text-red-400' : 'text-[#9baab8]'}>
        {icon}
      </span>
    </div>
    <div className={`text-xl font-black tracking-tight leading-none ${dark ? 'text-white' : warn ? 'text-red-700' : 'text-[#1a2332]'
      }`}>
      {value}
    </div>
    {sub && (
      <div className={`text-[10px] font-semibold ${dark ? 'text-[#4a7fa5]' : warn ? 'text-red-500' : 'text-[#8a9ab2]'
        }`}>
        {sub}
      </div>
    )}
  </div>
);

// ============================================================================
// HORIZONTAL BAR
// ============================================================================

const HBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="h-[3px] w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{ width: `${Math.min((value / Math.max(max, 1)) * 100, 100)}%`, backgroundColor: color }}
    />
  </div>
);

// ============================================================================
// FILTER PANEL
// ============================================================================

const FiltroPanel = ({
  show, onClose, dataInicio, dataFim, setDataInicio, setDataFim, onAplicar
}: {
  show: boolean; onClose: () => void;
  dataInicio: string; dataFim: string;
  setDataInicio: (v: string) => void; setDataFim: (v: string) => void;
  onAplicar: () => void;
}) => {
  if (!show) return null;
  return (
    <div className="absolute right-0 top-10 bg-white shadow-2xl border border-slate-300 z-50 w-72 rounded-sm">
      <div className="bg-[#1a2332] text-white px-4 py-2.5 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest">Filtrar Período</span>
        <button onClick={onClose}>
          <X className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-[9px] font-black text-[#6b7a8d] uppercase tracking-widest block mb-1">
            Data Início
          </label>
          <input
            type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1a6eb5]"
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-[#6b7a8d] uppercase tracking-widest block mb-1">
            Data Fim
          </label>
          <input
            type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1a6eb5]"
          />
        </div>
        <button
          onClick={onAplicar}
          className="w-full bg-[#1a6eb5] hover:bg-[#155d9e] text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-sm transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// VENDOR ROW (EXPANDABLE)
// ============================================================================

const VendedorRow = ({
  v, maxFat, rank
}: {
  v: VendedorStats; maxFat: number; rank: number;
}) => {
  const [open, setOpen] = useState(false);
  const sc = statusColor(v.statusMeta);

  return (
    <>
      <TableRow
        className="border-b border-slate-100 hover:bg-[#f0f5fb] cursor-pointer group transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {/* Rank */}
        <TableCell className="py-2.5 px-3 w-8 text-center">
          <span className="text-[10px] font-black text-slate-300">#{rank}</span>
        </TableCell>

        {/* Vendedor */}
        <TableCell className="py-2.5 px-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-sm flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white"
              style={{ backgroundColor: '#1a6eb5' }}
            >
              {v.vendedorNome.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-black text-[#1a2332] uppercase tracking-tight leading-none">
                {v.vendedorNome}
              </p>
              <p className="text-[9px] font-semibold text-[#8a9ab2] uppercase mt-0.5 flex items-center gap-1">
                <Building2 className="h-2 w-2" />
                {v.filial || 'Matriz'}
                {v.cargo && <> · {v.cargo}</>}
              </p>
            </div>
          </div>
        </TableCell>

        {/* Pedidos */}
        <TableCell className="py-2.5 px-3 text-center">
          <div className="text-[11px] font-black text-[#1a2332]">{v.totalVendas}</div>
          <div className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
            {v.vendasAprovadas > 0 && (
              <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-px rounded-sm">
                {v.vendasAprovadas} APROV
              </span>
            )}
            {v.vendasCanceladas > 0 && (
              <span className="text-[8px] font-black text-red-700 bg-red-50 border border-red-200 px-1 py-px rounded-sm">
                {v.vendasCanceladas} CANC
              </span>
            )}
            {v.vendasOrcamento > 0 && (
              <span className="text-[8px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-1 py-px rounded-sm">
                {v.vendasOrcamento} ORC
              </span>
            )}
          </div>
        </TableCell>

        {/* Faturamento (apenas aprovado) */}
        <TableCell className="py-2.5 px-3 text-right">
          <div className="text-[12px] font-black text-[#1a2332]">{R(v.faturamento)}</div>
          <HBar value={v.faturamento} max={maxFat} color="#1a6eb5" />
          <div className="text-[9px] font-semibold text-[#8a9ab2] mt-0.5">
            {Num(v.totalUnidades)} un · TM {R(v.ticketMedio)}
          </div>
        </TableCell>

        {/* Cancelamentos */}
        <TableCell className="py-2.5 px-3 text-right">
          <div
            className="text-[11px] font-black"
            style={{ color: v.vendasCanceladas > 0 ? '#dc2626' : '#c8d4e0' }}
          >
            {v.vendasCanceladas > 0 ? R(v.valorCancelado) : '—'}
          </div>
          <div
            className="text-[9px] font-semibold mt-0.5"
            style={{ color: v.taxaCancelamento >= META.CANCELAMENTO_ALERTA ? '#dc2626' : '#8a9ab2' }}
          >
            {v.taxaCancelamento > 0 ? `${Pct(v.taxaCancelamento)} das vendas` : '—'}
          </div>
        </TableCell>

        {/* Descontos */}
        <TableCell className="py-2.5 px-3 text-right">
          <div
            className="text-[11px] font-black"
            style={{ color: v.percentualDesconto >= META.DESCONTO_ALERTA ? '#d97706' : v.totalDesconto > 0 ? '#1a2332' : '#c8d4e0' }}
          >
            {v.totalDesconto > 0 ? Pct(v.percentualDesconto) : '—'}
          </div>
          <div className="text-[9px] font-semibold text-[#8a9ab2] mt-0.5">
            {v.totalDesconto > 0 ? R(v.totalDesconto) : 'Sem desconto'}
          </div>
        </TableCell>

        {/* Comissão */}
        <TableCell className="py-2.5 px-3 text-right bg-[#f0f5fb]/40">
          <div className="text-[12px] font-black text-[#1a6eb5]">{R(v.valorComissao)}</div>
          <div className="text-[9px] font-semibold text-[#8a9ab2] mt-0.5">
            {Pct(v.percentualComissao)} s/ fat.
          </div>
          <div className="flex justify-end gap-1 mt-1 flex-wrap">
            {v.comissoesPagas > 0 && (
              <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-px rounded-sm">
                PG {R(v.comissoesPagas)}
              </span>
            )}
            {v.comissoesPrevistas > 0 && (
              <span className="text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1 py-px rounded-sm">
                PV {R(v.comissoesPrevistas)}
              </span>
            )}
            {v.comissoesLiberadas > 0 && (
              <span className="text-[8px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-1 py-px rounded-sm">
                LB {R(v.comissoesLiberadas)}
              </span>
            )}
          </div>
        </TableCell>

        {/* Status */}
        <TableCell className="py-2.5 px-3 text-center">
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[9px] font-black uppercase tracking-wide"
            style={{
              color: sc,
              backgroundColor: v.statusMeta === 'otimo' ? '#f0fdf4' : v.statusMeta === 'atencao' ? '#fffbeb' : '#fef2f2',
              borderColor: v.statusMeta === 'otimo' ? '#bbf7d0' : v.statusMeta === 'atencao' ? '#fde68a' : '#fecaca',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc }} />
            {v.statusMeta === 'otimo' ? 'Normal' : v.statusMeta === 'atencao' ? 'Atenção' : 'Crítico'}
          </div>
        </TableCell>

        {/* Expand */}
        <TableCell className="py-2.5 px-2 text-center w-8">
          <div className="text-slate-300 group-hover:text-slate-500 transition-colors">
            {open
              ? <ChevronUp className="h-3.5 w-3.5 mx-auto" />
              : <ChevronDown className="h-3.5 w-3.5 mx-auto" />}
          </div>
        </TableCell>
      </TableRow>

      {/* EXPANDED DETAIL */}
      {open && (
        <TableRow className="bg-[#f8fafd] border-b border-slate-200">
          <TableCell colSpan={9} className="py-3 px-4">
            <div className="border border-slate-200 rounded-sm overflow-hidden">
              <div className="bg-[#1a2332] text-white px-4 py-2 text-[9px] font-black uppercase tracking-widest">
                Detalhamento — {v.vendedorNome}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
                <div className="p-3">
                  <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest mb-2 pb-1.5 border-b border-slate-100">
                    Resumo de Pedidos
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { l: 'Total de Pedidos', v: `${Num(v.totalVendas)}` },
                      { l: 'Aprovados', v: `${v.vendasAprovadas}`, c: 'text-emerald-700' },
                      { l: 'Cancelados', v: `${v.vendasCanceladas}`, c: v.vendasCanceladas > 0 ? 'text-red-600' : 'text-slate-400' },
                      { l: 'Orçamentos', v: `${v.vendasOrcamento}`, c: 'text-blue-600' },
                      { l: 'Unidades (aprov.)', v: Num(v.totalUnidades) },
                    ].map(row => (
                      <div key={row.l} className="flex justify-between items-center">
                        <span className="text-[9px] text-[#8a9ab2] font-semibold">{row.l}</span>
                        <span className={`text-[9px] font-black ${row.c || 'text-[#1a2332]'}`}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest mb-2 pb-1.5 border-b border-slate-100">
                    Valores Financeiros
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { l: 'Faturamento (Aprov.)', v: R(v.faturamento), c: 'text-[#1a6eb5]' },
                      { l: 'Valor Cancelado', v: v.valorCancelado > 0 ? R(v.valorCancelado) : '—', c: v.valorCancelado > 0 ? 'text-red-600' : 'text-slate-400' },
                      { l: 'Em Orçamento', v: v.valorOrcamento > 0 ? R(v.valorOrcamento) : '—', c: 'text-blue-600' },
                      { l: 'Total Fretes', v: v.valorFrete > 0 ? R(v.valorFrete) : '—' },
                      { l: 'Ticket Médio', v: R(v.ticketMedio) },
                    ].map(row => (
                      <div key={row.l} className="flex justify-between items-center">
                        <span className="text-[9px] text-[#8a9ab2] font-semibold">{row.l}</span>
                        <span className={`text-[9px] font-black ${row.c || 'text-[#1a2332]'}`}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest mb-2 pb-1.5 border-b border-slate-100">
                    Indicadores
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { l: 'Desconto Total (R$)', v: R(v.totalDesconto) },
                      {
                        l: 'Desconto s/ Fat.', v: Pct(v.percentualDesconto),
                        c: v.percentualDesconto >= META.DESCONTO_CRITICO ? 'text-red-600' : v.percentualDesconto >= META.DESCONTO_ALERTA ? 'text-amber-600' : ''
                      },
                      {
                        l: 'Taxa Cancelamento', v: Pct(v.taxaCancelamento),
                        c: v.taxaCancelamento >= META.CANCELAMENTO_CRITICO ? 'text-red-600' : v.taxaCancelamento >= META.CANCELAMENTO_ALERTA ? 'text-amber-600' : ''
                      },
                      { l: '% Comissão s/ Fat.', v: Pct(v.percentualComissao) },
                    ].map(row => (
                      <div key={row.l} className="flex justify-between items-center">
                        <span className="text-[9px] text-[#8a9ab2] font-semibold">{row.l}</span>
                        <span className={`text-[9px] font-black ${row.c || 'text-[#1a2332]'}`}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest mb-2 pb-1.5 border-b border-slate-100">
                    Comissionamento
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { l: 'Total Comissão', v: R(v.valorComissao), c: 'text-[#1a6eb5]' },
                      { l: 'Pagas', v: v.comissoesPagas > 0 ? R(v.comissoesPagas) : '—', c: 'text-emerald-700' },
                      { l: 'Liberadas', v: v.comissoesLiberadas > 0 ? R(v.comissoesLiberadas) : '—', c: 'text-blue-600' },
                      { l: 'previsto', v: v.comissoesPrevistas > 0 ? R(v.comissoesPrevistas) : '—', c: 'text-amber-600' },
                    ].map(row => (
                      <div key={row.l} className="flex justify-between items-center">
                        <span className="text-[9px] text-[#8a9ab2] font-semibold">{row.l}</span>
                        <span className={`text-[9px] font-black ${row.c || 'text-[#1a2332]'}`}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MonitoramentoVendasComissoes() {
  const [loading, setLoading] = useState(true);
  const [vendedores, setVendedores] = useState<VendedorStats[]>([]);
  const [totais, setTotais] = useState<Totais | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [showFiltros, setShowFiltros] = useState(false);
  const [sortField, setSortField] = useState<keyof VendedorStats>('faturamento');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);

  const token = useMemo(() => getToken(), []);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, comRes, vendasRes] = await Promise.all([
        fetch(`${API_URL}/comissoes/dashboard?dataInicio=${dataInicio}&dataFim=${dataFim}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/comissoes/buscar?dataInicio=${dataInicio}&dataFim=${dataFim}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/vendas?dataInicio=${dataInicio}&dataFim=${dataFim}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const dash: DashboardResponse | null = dashRes.ok ? await dashRes.json() : null;
      const comissoes: Comissao[] = comRes.ok ? await comRes.json() : [];
      const vendasPayload = vendasRes.ok ? await vendasRes.json() : { data: [] };
      const vendas: Venda[] = vendasPayload?.data ?? [];

      setDashboardData(dash);
      processar(dash, comissoes, vendas);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, token]);

  const processar = (
    dash: DashboardResponse | null,
    comissoes: Comissao[],
    vendas: Venda[]
  ) => {
    const map = new Map<string, VendedorStats>();

    // Helper para criar entrada inicial
    const criarEntrada = (id: string, nome: string, filial: string, cargo: string): VendedorStats => ({
      vendedorId: id,
      vendedorNome: nome,
      filial,
      cargo,
      totalVendas: 0, vendasAprovadas: 0, vendasCanceladas: 0, vendasOrcamento: 0,
      faturamento: 0, valorCancelado: 0, valorOrcamento: 0, valorFrete: 0,
      totalDesconto: 0, percentualDesconto: 0,
      totalUnidades: 0, ticketMedio: 0,
      valorComissao: 0, comissoesPagas: 0, comissoesPrevistas: 0, comissoesLiberadas: 0,
      percentualComissao: 0, taxaCancelamento: 0, statusMeta: 'atencao',
    });

    // 1. Seed a partir das VENDAS (fonte primária — garante que todo vendedor com venda aparece)
    for (const v of vendas) {
      const id = v.vendedorId;
      if (!id) continue;
      if (!map.has(id)) {
        const nome = v.vendedor?.nome ?? 'Desconhecido';
        const filial = v.vendedor?.filial ?? 'Matriz';
        const cargo = v.vendedor?.cargo ?? '';
        map.set(id, criarEntrada(id, nome, filial, cargo));
      }
    }

    // 2. Seed a partir das COMISSÕES (garante vendedores com comissão mas sem venda no período)
    for (const c of comissoes) {
      const id = c.vendedor?.id ?? c.vendedorId;
      if (!map.has(id)) {
        map.set(id, criarEntrada(
          id,
          c.vendedor?.nome ?? 'Desconhecido',
          c.vendedor?.filial ?? 'Matriz',
          c.vendedor?.cargo ?? ''
        ));
      }
      const s = map.get(id)!;
      const val = Number(c.valorComissao) || 0;
      s.valorComissao += val;
      if (c.status === 'PAGA') s.comissoesPagas += val;
      if (c.status === 'PREVISTA') s.comissoesPrevistas += val;
      if (c.status === 'LIBERADA') s.comissoesLiberadas += val;
    }

    for (const v of vendas) {
      const id = v.vendedorId;
      if (!id || !map.has(id)) continue;
      const s = map.get(id)!;
      const status = (v.statusVenda ?? '').toUpperCase();

      s.totalVendas++;
      const descontoItens = (v.itens ?? []).reduce(
        (acc, item) => acc + (Number(item.valorDesconto) || 0),
        0
      );

      s.totalDesconto += descontoItens;


      s.valorFrete += Number(v.valorFrete) || 0;

      if (status === 'APROVADO') {
        s.vendasAprovadas++;
        s.faturamento += Number(v.valorTotal) || 0;
        if (v.itens) {
          for (const item of v.itens) {
            s.totalUnidades += Number(item.quantidade) || 0;
          }
        }
      } else if (status === 'CANCELADO') {
        s.vendasCanceladas++;
        s.valorCancelado += Number(v.valorTotal) || 0;
      } else if (status === 'ORCAMENTO') {
        s.vendasOrcamento++;
        s.valorOrcamento += Number(v.valorTotal) || 0;
      }
    }

    const result: VendedorStats[] = [];
    map.forEach(s => {
      s.ticketMedio = s.vendasAprovadas > 0 ? s.faturamento / s.vendasAprovadas : 0;
      s.percentualDesconto = s.faturamento > 0 ? (s.totalDesconto / s.faturamento) * 100 : 0;
      s.taxaCancelamento = s.totalVendas > 0 ? (s.vendasCanceladas / s.totalVendas) * 100 : 0;
      s.percentualComissao = s.faturamento > 0 ? (s.valorComissao / s.faturamento) * 100 : 0;
      s.statusMeta = calcStatus(s.taxaCancelamento, s.percentualDesconto);
      result.push(s);
    });

    setVendedores(result);

    const fat = result.reduce((a, v) => a + v.faturamento, 0);
    const canc = result.reduce((a, v) => a + v.valorCancelado, 0);
    const desc = result.reduce((a, v) => a + v.totalDesconto, 0);
    const com = result.reduce((a, v) => a + v.valorComissao, 0);
    const un = result.reduce((a, v) => a + v.totalUnidades, 0);
    const tv = result.reduce((a, v) => a + v.totalVendas, 0);
    const ta = result.reduce((a, v) => a + v.vendasAprovadas, 0);
    const tc = result.reduce((a, v) => a + v.vendasCanceladas, 0);
    const to = result.reduce((a, v) => a + v.vendasOrcamento, 0);

    setTotais({
      faturamento: fat,
      totalCancelado: canc,
      totalDesconto: desc,
      totalComissoes: com,
      totalUnidades: un,
      totalVendas: tv,
      totalAprovadas: ta,
      totalCanceladas: tc,
      totalOrcamentos: to,
      taxaCancelamento: tv > 0 ? (tc / tv) * 100 : 0,
    });
  };

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const sorted = useMemo(() =>
    [...vendedores].sort((a, b) => {
      const av = a[sortField] as any;
      const bv = b[sortField] as any;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
    }),
    [vendedores, sortField, sortDir]
  );

  const maxFat = useMemo(() =>
    Math.max(...vendedores.map(v => v.faturamento), 1),
    [vendedores]
  );

  const applySort = (f: keyof VendedorStats) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const exportar = async () => {
    try {
      const resp = await fetch(
        `${API_URL}/comissoes/relatorio?dataInicio=${dataInicio}&dataFim=${dataFim}&formato=pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `performance-${dataInicio}-${dataFim}.pdf`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) { console.error(e); }
  };

  const Th = ({
    field, children, align = 'left'
  }: {
    field: keyof VendedorStats; children: React.ReactNode; align?: string;
  }) => {
    const active = sortField === field;
    return (
      <TableHead
        onClick={() => applySort(field)}
        className={`
          text-[9px] font-black uppercase tracking-widest cursor-pointer select-none
          whitespace-nowrap transition-colors px-3
          ${active ? 'text-[#1a6eb5]' : 'text-[#6b7a8d] hover:text-[#1a2332]'}
          text-${align}
        `}
      >
        <span className={`inline-flex items-center gap-0.5 ${align === 'right' ? 'flex-row-reverse justify-end w-full' :
            align === 'center' ? 'justify-center w-full' : ''
          }`}>
          {children}
          {active
            ? sortDir === 'desc'
              ? <ChevronDown className="h-2.5 w-2.5" />
              : <ChevronUp className="h-2.5 w-2.5" />
            : <Minus className="h-2.5 w-2.5 opacity-20" />
          }
        </span>
      </TableHead>
    );
  };

  const periodoLabel = `${fmtDate(dataInicio)} a ${fmtDate(dataFim)}`;
  const totalCriticos = vendedores.filter(v => v.statusMeta === 'critico').length;
  const totalAtencao = vendedores.filter(v => v.statusMeta === 'atencao').length;

  return (
    <div className="bg-[#eef1f6] min-h-screen">
      <HeaderEnterprise />

      {/* TOP BAR - TOTVS style */}
      <div className="bg-[#1a2332] text-white px-6 flex items-stretch border-b border-[#263344]">
        <div className="flex items-center gap-3 py-2.5 border-r border-[#263344] pr-5 mr-5">
          <BarChart3 className="h-4 w-4 text-[#4a7fa5]" />
          <div>
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#4a7fa5]">
              Módulo Comercial
            </div>
            <div className="text-[11px] font-black uppercase tracking-tight text-white leading-none">
              Performance de Vendas & Comissões
            </div>
          </div>
        </div>
        <div className="flex items-center text-[9px] font-semibold text-[#4a7fa5] gap-1.5 py-2.5">
          <Calendar className="h-3 w-3" />
          Período:
          <span className="text-white font-black">{periodoLabel}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 py-2">
          <div className="relative">
            <button
              onClick={() => setShowFiltros(s => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-[#3a5068] hover:border-[#4a7fa5] hover:bg-[#263344] rounded-sm transition-colors text-[#7a99b8]"
            >
              <Filter className="h-3 w-3" /> Período
            </button>
            <FiltroPanel
              show={showFiltros} onClose={() => setShowFiltros(false)}
              dataInicio={dataInicio} dataFim={dataFim}
              setDataInicio={setDataInicio} setDataFim={setDataFim}
              onAplicar={() => { setShowFiltros(false); carregarDados(); }}
            />
          </div>
          <button
            onClick={carregarDados}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-[#3a5068] hover:border-[#4a7fa5] hover:bg-[#263344] rounded-sm transition-colors text-[#7a99b8]"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <button
            onClick={exportar}
            disabled={loading || vendedores.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest bg-[#1a6eb5] hover:bg-[#155d9e] rounded-sm transition-colors text-white disabled:opacity-40"
          >
            <Download className="h-3 w-3" /> Exportar Folha
          </button>
        </div>
      </div>

      <main className="p-4 max-w-[1800px] mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-[#1a6eb5]" />
              <span className="text-[10px] font-black text-[#8a9ab2] uppercase tracking-widest">
                Processando dados...
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* KPI GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
              <KPI
                label="Faturamento Aprovado"
                value={R(totais?.faturamento ?? 0)}
                sub={`${Num(totais?.totalAprovadas ?? 0)} venda(s) aprovada(s)`}
                icon={<TrendingUp className="h-4 w-4" />}
                dark
              />
              <KPI
                label="Pedidos no Período"
                value={Num(totais?.totalVendas ?? 0)}
                sub={`${Num(totais?.totalAprovadas ?? 0)} aprov · ${Num(totais?.totalCanceladas ?? 0)} canc · ${Num(totais?.totalOrcamentos ?? 0)} orc`}
                icon={<ShoppingCart className="h-4 w-4" />}
              />
              <KPI
                label="Valor Cancelado"
                value={R(totais?.totalCancelado ?? 0)}
                sub={`${Pct(totais?.taxaCancelamento ?? 0)} do total de vendas`}
                icon={<XCircle className="h-4 w-4" />}
                warn={(totais?.taxaCancelamento ?? 0) >= META.CANCELAMENTO_ALERTA}
              />
              <KPI
                label="Total de Descontos"
                value={R(totais?.totalDesconto ?? 0)}
                sub={
                  totais?.faturamento
                    ? `${Pct((totais.totalDesconto / totais.faturamento) * 100)} s/ faturamento`
                    : '—'
                }
                icon={<Percent className="h-4 w-4" />}
              />
              <KPI
                label="Total Comissões"
                value={R(totais?.totalComissoes ?? 0)}
                sub={`Pago: ${R(dashboardData?.totais?.pago ?? 0)}`}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <KPI
                label="Unidades Vendidas"
                value={Num(totais?.totalUnidades ?? 0)}
                sub={`TM: ${R(totais?.totalAprovadas ? (totais.faturamento / totais.totalAprovadas) : 0)}`}
                icon={<Target className="h-4 w-4" />}
              />
            </div>

            {/* ALERTS */}
            {(totalCriticos > 0 || totalAtencao > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {totalCriticos > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-sm text-[10px] font-bold text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    <strong>{totalCriticos}</strong> vendedor{totalCriticos > 1 ? 'es' : ''} em situação{' '}
                    <strong>crítica</strong> — desconto &gt;{META.DESCONTO_CRITICO}% ou cancelamento &gt;{META.CANCELAMENTO_CRITICO}%
                  </div>
                )}
                {totalAtencao > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-sm text-[10px] font-bold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    <strong>{totalAtencao}</strong> vendedor{totalAtencao > 1 ? 'es' : ''} em{' '}
                    <strong>atenção</strong> — revisar política de descontos e cancelamentos
                  </div>
                )}
              </div>
            )}

            {/* MAIN TABLE */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
              {/* Table title bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8fafd] border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Users2 className="h-3.5 w-3.5 text-[#4a7fa5]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1a2332]">
                    Desempenho por Vendedor
                  </span>
                  <span className="text-[9px] font-bold text-[#8a9ab2] border border-slate-200 px-1.5 py-0.5 rounded-sm bg-white">
                    {vendedores.length} vendedor{vendedores.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { s: 'otimo' as const, l: 'Normal', cnt: vendedores.filter(v => v.statusMeta === 'otimo').length },
                    { s: 'atencao' as const, l: 'Atenção', cnt: vendedores.filter(v => v.statusMeta === 'atencao').length },
                    { s: 'critico' as const, l: 'Crítico', cnt: vendedores.filter(v => v.statusMeta === 'critico').length },
                  ].filter(x => x.cnt > 0).map(x => (
                    <div key={x.s} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: statusColor(x.s) }} />
                      <span className="text-[9px] font-semibold text-[#6b7a8d]">{x.cnt} {x.l}</span>
                    </div>
                  ))}
                  <span className="text-[9px] text-[#c8d4e0] hidden sm:block">
                    · Clique em uma linha para ver detalhes
                  </span>
                </div>
              </div>

              {vendedores.length === 0 ? (
                <div className="py-16 text-center">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Nenhum dado encontrado
                  </p>
                  <p className="text-[10px] text-slate-300 mt-1">
                    Ajuste o período e tente novamente
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#f8fafd] border-b border-slate-200 hover:bg-[#f8fafd]">
                        <TableHead className="px-3 w-8 text-[9px] font-black text-[#6b7a8d] uppercase tracking-widest">
                          #
                        </TableHead>
                        <Th field="vendedorNome" align="left">Vendedor / Filial</Th>
                        <Th field="totalVendas" align="center">Pedidos</Th>
                        <Th field="faturamento" align="right">Faturamento</Th>
                        <Th field="valorCancelado" align="right">Cancelamentos</Th>
                        <Th field="percentualDesconto" align="right">Descontos</Th>
                        <Th field="valorComissao" align="right">Comissão</Th>
                        <Th field="statusMeta" align="center">Status</Th>
                        <TableHead className="w-8" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.map((v, i) => (
                        <VendedorRow
                          key={v.vendedorId}
                          v={v}
                          maxFat={maxFat}
                          rank={i + 1}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* FOOTER TOTALS */}
              {vendedores.length > 0 && totais && (
                <div className="bg-[#1a2332] text-white px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#263344]">
                  <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#4a7fa5] mr-1">
                    Totais do Período
                  </div>
                  {[
                    { l: 'Faturamento', v: R(totais.faturamento), c: 'text-white' },
                    { l: 'Cancelado', v: R(totais.totalCancelado), c: 'text-red-400' },
                    { l: 'Descontos', v: R(totais.totalDesconto), c: 'text-amber-400' },
                    { l: 'Comissões', v: R(totais.totalComissoes), c: 'text-[#4a9fd5]' },
                    { l: 'Unidades', v: Num(totais.totalUnidades), c: 'text-slate-300' },
                    {
                      l: 'Tx. Cancelamento',
                      v: Pct(totais.taxaCancelamento),
                      c: totais.taxaCancelamento >= META.CANCELAMENTO_ALERTA ? 'text-red-400' : 'text-slate-300'
                    },
                  ].map(item => (
                    <div key={item.l} className="flex flex-col">
                      <span className="text-[7px] font-black text-[#4a7fa5] uppercase tracking-widest">
                        {item.l}
                      </span>
                      <span className={`text-[11px] font-black ${item.c}`}>{item.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}