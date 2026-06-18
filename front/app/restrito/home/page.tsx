'use client';

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, ShoppingCart, Package, Users, BarChart3,
  AlertCircle, CheckCircle, Clock, Plus, FileText, Home, Mail,
  ArrowRight, Star, Calendar, RefreshCw, ChevronUp, ChevronDown,
  Target, Activity, DollarSign, AlertTriangle, Receipt, Ban,
  TrendingDown as TrendDown, CircleDollarSign, ArrowDownCircle,
  CalendarClock, ShieldAlert, PiggyBank,
} from 'lucide-react';
import HeaderEnterprise from '@/components/header';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getToken } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Produto {
  id: string;
  nome: string;
  preco_venda_base: string;
  categoria?: { nome: string };
  estoque?: Array<{ quantidade: number; quantidadeReservada: number }>;
}

interface Venda {
  id: string;
  numeroPedido?: number;
  valorTotal: number;
  statusVenda: string;
  status: string;
  cliente?: { nomeRazaoSocial: string };
  vendedor?: { nome: string };
  itens?: Array<{ quantidade: number; valorSubtotal: number }>;
  createdAt: string;
}

interface ContaPagar {
  id: string;
  descricao: string;
  beneficiario?: string;
  valor_total: number;
  valor_pago: number;
  valor_aberto: number;
  data_vencimento: string;
  status: string;
  categoria?: { nome: string; cor?: string };
}

interface ContasPagarDashboard {
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
  fluxo_mensal: Array<{
    mes: string;
    total_previsto: number;
    total_pago: number;
    total_quitado: number;
  }>;
  alertas: {
    proximos_vencer: ContaPagar[];
    vencidos_em_aberto: ContaPagar[];
    total_em_atraso: number;
  };
}

interface DashboardData {
  produtos: Produto[];
  vendas: Venda[];
  contasPagar: ContasPagarDashboard | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const ESTOQUE_CRITICO_THRESHOLD = 20;

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const CAT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

const STATUS_VENDA_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  APROVADO: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Aprovado' },
  CANCELADO: { color: 'text-red-700',     bg: 'bg-red-100',     label: 'Cancelado' },
  PENDENTE:  { color: 'text-amber-700',   bg: 'bg-amber-100',   label: 'Pendente'  },
};

const STATUS_CONTA_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PAGO:      { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Pago'      },
  PENDENTE:  { color: 'text-amber-700',   bg: 'bg-amber-50',   label: 'Pendente'  },
  PARCIAL:   { color: 'text-blue-700',    bg: 'bg-blue-50',    label: 'Parcial'   },
  VENCIDO:   { color: 'text-red-700',     bg: 'bg-red-50',     label: 'Vencido'   },
  CANCELADO: { color: 'text-slate-500',   bg: 'bg-slate-50',   label: 'Cancelado' },
};

const QUICK_ACTIONS = [
  { icon: Plus,     label: 'Nova Venda', color: 'bg-emerald-500', href: '/restrito/comercial/vendas'    },
  { icon: FileText, label: 'Relatórios', color: 'bg-blue-500',    href: '/restrito/financeiro'          },
  { icon: Package,  label: 'Estoque',    color: 'bg-amber-500',   href: '/restrito/produtos/estoque'    },
  { icon: Users,    label: 'Clientes',   color: 'bg-purple-500',  href: '/restrito/entidades'           },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate()     === now.getDate()  &&
    d.getMonth()    === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function diasParaVencer(dateStr: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dateStr);
  venc.setHours(0, 0, 0, 0);
  return Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOK — DATA FETCHING
// ─────────────────────────────────────────────────────────────────────────────

function useDashboardData(token: string | null) {
  const [data, setData] = useState<DashboardData>({ produtos: [], vendas: [], contasPagar: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    if (!token) {
      setError('Sem autenticação');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const headers = { Authorization: `Bearer ${token}` };

      const [pRes, vRes, cpRes] = await Promise.all([
        fetch(`${API_URL}/produtos`,                         { headers }),
        fetch(`${API_URL}/vendas`,                           { headers }),
        fetch(`${API_URL}/contas-pagar/dashboard/resumo`,    { headers }),
      ]);

      const produtos: Produto[]               = pRes.ok  ? await pRes.json()  : [];
      const vendasRaw                                     = vRes.ok  ? await vRes.json()  : { data: [] };
      const vendas: Venda[]                   = Array.isArray(vendasRaw)      ? vendasRaw
                                              : Array.isArray(vendasRaw.data) ? vendasRaw.data : [];
      const contasPagar: ContasPagarDashboard | null      = cpRes.ok ? await cpRes.json() : null;

      setData({
        produtos: Array.isArray(produtos) ? produtos : [],
        vendas,
        contasPagar,
      });
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
      setError('Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, lastUpdate, fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOK — COMPUTED DASHBOARD METRICS
// ─────────────────────────────────────────────────────────────────────────────

function useDashboardMetrics(data: DashboardData) {
  const cp = data.contasPagar;

  // ── Vendas ──────────────────────────────────────────────────────────────────
  const vendasAtivas   = data.vendas.filter(v => v.statusVenda !== 'CANCELADO');
  const vendasHoje     = vendasAtivas.filter(v => isToday(v.createdAt));
  const vendasMes      = vendasAtivas.filter(v => isThisMonth(v.createdAt));

  const totalHoje  = vendasHoje.reduce((s, v) => s + (v.valorTotal || 0), 0);
  const totalMes   = vendasMes.reduce((s, v)  => s + (v.valorTotal || 0), 0);
  const ticketMedio = vendasMes.length ? totalMes / vendasMes.length : 0;

  const canceladasHoje = data.vendas.filter(
    v => v.statusVenda === 'CANCELADO' && isToday(v.createdAt)
  );

  const topVendas = [...vendasMes]
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 5);

  // ── Estoque ─────────────────────────────────────────────────────────────────
  const produtosComEstoque     = data.produtos.filter(p => p.estoque?.length);
  const produtosBaixoEstoque   = produtosComEstoque.filter(
    p => (p.estoque![0].quantidade || 0) < ESTOQUE_CRITICO_THRESHOLD
  );

  // ── Status de vendas hoje (para tabela de status) ──────────────────────────
  const statusCount = data.vendas
    .filter(v => isToday(v.createdAt))
    .reduce<Record<string, number>>((acc, v) => {
      acc[v.statusVenda] = (acc[v.statusVenda] || 0) + 1;
      return acc;
    }, {});

  // ── Chart: vendas por hora (hoje) ──────────────────────────────────────────
  const vendasPorHora = vendasHoje.reduce<Record<number, number>>((acc, v) => {
    const h = new Date(v.createdAt).getHours();
    acc[h] = (acc[h] || 0) + v.valorTotal;
    return acc;
  }, {});

  const horaChartData = Array.from({ length: new Date().getHours() + 1 }, (_, h) => ({
    hora:  `${String(h).padStart(2, '0')}h`,
    valor: vendasPorHora[h] || 0,
  }));

  // ── Chart: vendas por dia do mês ────────────────────────────────────────────
  const diaChartData = Object.entries(
    vendasMes.reduce<Record<string, number>>((acc, v) => {
      const d = format(new Date(v.createdAt), 'dd/MM');
      acc[d] = (acc[d] || 0) + v.valorTotal;
      return acc;
    }, {})
  )
    .map(([dia, valor]) => ({ dia, valor }))
    .sort((a, b) => a.dia.localeCompare(b.dia));

  // ── Pie: distribuição por categoria de produto ─────────────────────────────
  const pieData = Object.entries(
    data.produtos.reduce<Record<string, number>>((acc, p) => {
      const cat = p.categoria?.nome || 'Outros';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // ── Contas a pagar ──────────────────────────────────────────────────────────
  const totalVencidoAlerta = cp?.alertas.total_em_atraso ?? 0;
  const proximosVencer     = cp?.alertas.proximos_vencer        ?? [];
  const vencidosAberto     = cp?.alertas.vencidos_em_aberto     ?? [];
  const despesasMes        = cp?.mes_atual.por_status.reduce((s, r) => s + r.total, 0) ?? 0;
  const resultadoMes       = totalMes - despesasMes;

  return {
    // vendas
    vendasHoje, vendasMes, totalHoje, totalMes, ticketMedio,
    canceladasHoje, topVendas, statusCount,
    // estoque
    produtosComEstoque, produtosBaixoEstoque,
    // charts
    horaChartData, diaChartData, pieData,
    // contas a pagar
    totalVencidoAlerta, proximosVencer, vencidosAberto, despesasMes, resultadoMes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOK — CLOCK / GREETING
// ─────────────────────────────────────────────────────────────────────────────

function useClock() {
  const [greeting, setGreeting]     = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(format(now, "EEEE, d 'de' MMMM • HH:mm", { locale: ptBR }));
      setGreeting(getGreeting(now.getHours()));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return { greeting, currentTime };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── KpiCard ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  accent: string;
  bg: string;
  alert?: boolean;
}

function KpiCard({ title, value, subtitle, icon, trend, accent, bg, alert }: KpiCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${bg} border ${alert ? 'border-red-200' : 'border-white/60'} shadow-sm hover:shadow-md transition-all duration-200`}>
      {alert && (
        <div className="absolute top-0 right-0 w-2 h-full bg-red-400 rounded-r-2xl opacity-60" />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${accent} shadow-sm`}>{icon}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend.value >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {trend.value >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-2xl font-bold leading-none ${alert ? 'text-red-700' : 'text-slate-800'}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// ── CustomTooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── LoadingScreen ─────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <HeaderEnterprise />
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-500 font-medium">Carregando painel...</p>
        </div>
      </div>
    </div>
  );
}

// ── ErrorBanner ───────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-amber-700 text-sm">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      {message} — exibindo dados disponíveis.
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── DashboardHeader ──────────────────────────────────────────────────────────

interface DashboardHeaderProps {
  greeting: string;
  currentTime: string;
  lastUpdate: Date;
  vencidosCount: number;
  onRefresh: () => void;
}

function DashboardHeader({ greeting, currentTime, lastUpdate, vencidosCount, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {greeting}, <span className="text-green-600">Fernandes Madeira! 👋</span>
        </h1>
        <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
          <Clock className="h-3.5 w-3.5" /> {currentTime}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {vencidosCount > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <ShieldAlert className="h-3.5 w-3.5" />
            {vencidosCount} conta{vencidosCount > 1 ? 's' : ''} vencida{vencidosCount > 1 ? 's' : ''}
          </div>
        )}
        <span className="text-xs text-slate-400">Atualizado às {format(lastUpdate, 'HH:mm')}</span>
        <Button size="sm" variant="outline" onClick={onRefresh} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
        <Button size="sm" className="gap-2">
          <Calendar className="h-3.5 w-3.5" /> Agenda
        </Button>
      </div>
    </div>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: string }) {
  return (
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
      {icon} {children}
    </p>
  );
}

// ── VendasKpis ────────────────────────────────────────────────────────────────

interface VendasKpisProps {
  totalHoje: number;
  vendasHoje: Venda[];
  totalMes: number;
  vendasMes: Venda[];
  ticketMedio: number;
  produtosBaixoEstoque: Produto[];
  totalProdutos: number;
}

function VendasKpis({
  totalHoje, vendasHoje, totalMes, vendasMes,
  ticketMedio, produtosBaixoEstoque, totalProdutos,
}: VendasKpisProps) {
  return (
    <div>
      <SectionLabel icon={<TrendingUp className="h-3.5 w-3.5" />}>Receitas & Vendas</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Vendas Hoje"
          value={fmt(totalHoje)}
          subtitle={`${vendasHoje.length} pedido${vendasHoje.length !== 1 ? 's' : ''} aprovado${vendasHoje.length !== 1 ? 's' : ''}`}
          icon={<DollarSign className="h-5 w-5 text-emerald-700" />}
          accent="bg-emerald-100"
          bg="bg-gradient-to-br from-emerald-50 to-white"
        />
        <KpiCard
          title="Vendas no Mês"
          value={fmt(totalMes)}
          subtitle={`${vendasMes.length} pedidos`}
          icon={<TrendingUp className="h-5 w-5 text-blue-700" />}
          accent="bg-blue-100"
          bg="bg-gradient-to-br from-blue-50 to-white"
        />
        <KpiCard
          title="Ticket Médio"
          value={fmt(ticketMedio)}
          subtitle="Média do mês"
          icon={<Target className="h-5 w-5 text-purple-700" />}
          accent="bg-purple-100"
          bg="bg-gradient-to-br from-purple-50 to-white"
        />
        <KpiCard
          title="Produtos Críticos"
          value={String(produtosBaixoEstoque.length)}
          subtitle={`de ${totalProdutos} produtos`}
          icon={<Package className="h-5 w-5 text-amber-700" />}
          accent="bg-amber-100"
          bg="bg-gradient-to-br from-amber-50 to-white"
        />
      </div>
    </div>
  );
}

// ── ContasPagarKpis ───────────────────────────────────────────────────────────

interface ContasPagarKpisProps {
  cp: ContasPagarDashboard;
  vencidosAberto: ContaPagar[];
  proximosVencer: ContaPagar[];
  resultadoMes: number;
}

function ContasPagarKpis({ cp, vencidosAberto, proximosVencer, resultadoMes }: ContasPagarKpisProps) {
  return (
    <div>
      <SectionLabel icon={<ArrowDownCircle className="h-3.5 w-3.5" />}>Despesas & Contas a Pagar</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total a Pagar"
          value={fmt(cp.resumo.total_pendente + cp.resumo.total_vencido)}
          subtitle="Pendentes + Vencidas"
          icon={<Receipt className="h-5 w-5 text-orange-700" />}
          accent="bg-orange-100"
          bg="bg-gradient-to-br from-orange-50 to-white"
        />
        <KpiCard
          title="Pago no Mês"
          value={fmt(cp.resumo.total_pago)}
          subtitle="Contas quitadas"
          icon={<CheckCircle className="h-5 w-5 text-emerald-700" />}
          accent="bg-emerald-100"
          bg="bg-gradient-to-br from-emerald-50 to-white"
        />
        <KpiCard
          title="Em Atraso"
          value={fmt(cp.resumo.total_vencido)}
          subtitle={`${vencidosAberto.length} conta${vencidosAberto.length !== 1 ? 's' : ''} vencida${vencidosAberto.length !== 1 ? 's' : ''}`}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          accent="bg-red-100"
          bg="bg-gradient-to-br from-red-50 to-white"
          alert={vencidosAberto.length > 0}
        />
        <KpiCard
          title="Próx. 7 dias"
          value={fmt(proximosVencer.reduce((s, c) => s + c.valor_aberto, 0))}
          subtitle={`${proximosVencer.length} conta${proximosVencer.length !== 1 ? 's' : ''} a vencer`}
          icon={<CalendarClock className="h-5 w-5 text-amber-700" />}
          accent="bg-amber-100"
          bg="bg-gradient-to-br from-amber-50 to-white"
        />
        <KpiCard
          title="Resultado Mês"
          value={fmt(Math.abs(resultadoMes))}
          subtitle={resultadoMes >= 0 ? '↑ Saldo positivo' : '↓ Saldo negativo'}
          icon={
            resultadoMes >= 0
              ? <PiggyBank className="h-5 w-5 text-emerald-700" />
              : <TrendDown  className="h-5 w-5 text-red-700" />
          }
          accent={resultadoMes >= 0 ? 'bg-emerald-100' : 'bg-red-100'}
          bg={resultadoMes >= 0 ? 'bg-gradient-to-br from-emerald-50 to-white' : 'bg-gradient-to-br from-red-50 to-white'}
          alert={resultadoMes < 0}
        />
      </div>
    </div>
  );
}

// ── AlertasContasPagar ────────────────────────────────────────────────────────

interface AlertasContasPagarProps {
  vencidosAberto: ContaPagar[];
  proximosVencer: ContaPagar[];
  totalVencidoAlerta: number;
}

function AlertasContasPagar({ vencidosAberto, proximosVencer, totalVencidoAlerta }: AlertasContasPagarProps) {
  if (!vencidosAberto.length && !proximosVencer.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {vencidosAberto.length > 0 && (
        <AlertaVencidas contas={vencidosAberto} total={totalVencidoAlerta} />
      )}
      {proximosVencer.length > 0 && (
        <AlertaProximas contas={proximosVencer} />
      )}
    </div>
  );
}

function AlertaVencidas({ contas, total }: { contas: ContaPagar[]; total: number }) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
      <div className="bg-red-50 border-b border-red-100 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <Ban className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-800 text-sm">Contas Vencidas</p>
            <p className="text-xs text-red-600">Requerem pagamento imediato</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-red-700">{fmt(total)}</p>
          <p className="text-xs text-red-500">{contas.length} conta{contas.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
        {contas.slice(0, 6).map(c => {
          const dias = Math.abs(diasParaVencer(c.data_vencimento));
          return (
            <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50/60 border border-red-100 hover:bg-red-50 transition-colors">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{c.descricao}</p>
                <p className="text-xs text-slate-500">
                  {c.beneficiario || 'Sem beneficiário'} • Venceu há {dias} dia{dias !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-red-700">{fmt(c.valor_aberto)}</p>
                {c.categoria && <span className="text-xs text-slate-400">{c.categoria.nome}</span>}
              </div>
            </div>
          );
        })}
        {contas.length > 6 && (
          <p className="text-xs text-center text-slate-400 pt-1">+{contas.length - 6} contas vencidas</p>
        )}
      </div>

      <div className="px-5 py-3 border-t border-red-100 bg-red-50/40">
        <a href="/restrito/financeiro/contas-pagar?status=VENCIDO"
          className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1">
          Ver todas as contas vencidas <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function AlertaProximas({ contas }: { contas: ContaPagar[] }) {
  const total = contas.reduce((s, c) => s + c.valor_aberto, 0);

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="bg-amber-50 border-b border-amber-100 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <CalendarClock className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-800 text-sm">Vencimentos Próximos</p>
            <p className="text-xs text-amber-600">Nos próximos 7 dias</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-amber-700">{fmt(total)}</p>
          <p className="text-xs text-amber-500">{contas.length} conta{contas.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
        {contas.slice(0, 6).map(c => {
          const dias    = diasParaVencer(c.data_vencimento);
          const urgente = dias <= 1;
          const urgLabel = dias === 0 ? 'Hoje!' : dias === 1 ? 'Amanhã' : `Em ${dias} dias`;

          return (
            <div key={c.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${urgente ? 'bg-orange-50 border-orange-100' : 'bg-amber-50/50 border-amber-100'}`}>
              <div className={`p-2 rounded-lg flex-shrink-0 ${urgente ? 'bg-orange-100' : 'bg-amber-100'}`}>
                <Clock className={`h-3.5 w-3.5 ${urgente ? 'text-orange-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{c.descricao}</p>
                <p className="text-xs text-slate-500">
                  {c.beneficiario || 'Sem beneficiário'} • {format(new Date(c.data_vencimento), 'dd/MM/yyyy')}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-amber-700">{fmt(c.valor_aberto)}</p>
                <span className={`text-xs font-semibold ${urgente ? 'text-orange-600' : 'text-amber-600'}`}>
                  {urgLabel}
                </span>
              </div>
            </div>
          );
        })}
        {contas.length > 6 && (
          <p className="text-xs text-center text-slate-400 pt-1">+{contas.length - 6} contas próximas</p>
        )}
      </div>

      <div className="px-5 py-3 border-t border-amber-100 bg-amber-50/40">
        <a href="/restrito/financeiro/contas-pagar?filtro=proximos_vencer"
          className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1">
          Gerenciar vencimentos <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

// ── ChartsVendas ──────────────────────────────────────────────────────────────

interface ChartsVendasProps {
  horaChartData: { hora: string; valor: number }[];
  diaChartData:  { dia:  string; valor: number }[];
  pieData:       { name: string; value: number }[];
  totalHoje:     number;
  totalMes:      number;
  statusCount:   Record<string, number>;
  canceladasHoje: Venda[];
  produtosComEstoque: Produto[];
  produtosBaixoEstoque: Produto[];
  totalProdutos: number;
  cp: ContasPagarDashboard | null;
  resultadoMes: number;
}

function ChartsVendas({
  horaChartData, diaChartData, pieData,
  totalHoje, totalMes, statusCount,
  canceladasHoje, produtosComEstoque, produtosBaixoEstoque, totalProdutos,
  cp, resultadoMes,
}: ChartsVendasProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Vendas hoje + Mix produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vendas por hora */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Vendas de Hoje</h3>
              <p className="text-xs text-slate-500">Faturamento por hora (apenas aprovadas)</p>
            </div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 font-semibold">
              {fmt(totalHoje)}
            </Badge>
          </div>

          {horaChartData.every(d => d.valor === 0) ? (
            <EmptyState icon={<Activity className="h-8 w-8 mb-2 opacity-40" />} label="Nenhuma venda hoje ainda" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={horaChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="valor" name="Valor"
                  stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#colorVendas)"
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Mix de produtos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800">Mix de Produtos</h3>
          <p className="text-xs text-slate-500 mb-4">Distribuição por categoria</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Faturamento do mês + Status + Resumo operacional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Faturamento do mês */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Faturamento do Mês</h3>
              <p className="text-xs text-slate-500">{format(new Date(), 'MMMM yyyy', { locale: ptBR })}</p>
            </div>
            <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 font-semibold">
              {fmt(totalMes)}
            </Badge>
          </div>

          {diaChartData.length === 0 ? (
            <EmptyState icon={<BarChart3 className="h-8 w-8 mb-2 opacity-40" />} label="Nenhuma venda este mês" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={diaChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" name="Valor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status + Resumo */}
        <div className="space-y-4">
          <StatusVendasHoje statusCount={statusCount} />
          <ResumoOperacional
            canceladasHoje={canceladasHoje}
            produtosComEstoque={produtosComEstoque}
            produtosBaixoEstoque={produtosBaixoEstoque}
            totalProdutos={totalProdutos}
            cp={cp}
            resultadoMes={resultadoMes}
          />
        </div>
      </div>
    </div>
  );
}

// ── StatusVendasHoje ──────────────────────────────────────────────────────────

function StatusVendasHoje({ statusCount }: { statusCount: Record<string, number> }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-bold text-slate-800 mb-3">Status de Hoje (Vendas)</h3>
      <div className="space-y-2">
        {Object.keys(statusCount).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-2">Sem movimentação hoje</p>
        ) : (
          Object.entries(statusCount).map(([status, count]) => {
            const s = STATUS_VENDA_CONFIG[status] ?? { color: 'text-slate-700', bg: 'bg-slate-100', label: status };
            return (
              <div key={status} className={`flex items-center justify-between p-2.5 rounded-lg ${s.bg}`}>
                <span className={`text-sm font-medium ${s.color}`}>{s.label}</span>
                <span className={`text-lg font-bold ${s.color}`}>{count}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── ResumoOperacional ─────────────────────────────────────────────────────────

interface ResumoOperacionalProps {
  canceladasHoje: Venda[];
  produtosComEstoque: Produto[];
  produtosBaixoEstoque: Produto[];
  totalProdutos: number;
  cp: ContasPagarDashboard | null;
  resultadoMes: number;
}

function ResumoOperacional({
  canceladasHoje, produtosComEstoque, produtosBaixoEstoque, totalProdutos, cp, resultadoMes,
}: ResumoOperacionalProps) {
  const rows = [
    { label: 'Pedidos cancelados hoje',   value: canceladasHoje.length,       alert: canceladasHoje.length > 0 },
    { label: 'Produtos no catálogo',       value: totalProdutos,               alert: false },
    { label: 'Com estoque registrado',     value: produtosComEstoque.length,   alert: false },
    { label: `Estoque crítico (<${ESTOQUE_CRITICO_THRESHOLD}un)`, value: produtosBaixoEstoque.length, alert: produtosBaixoEstoque.length > 0 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-bold text-slate-800 mb-3">Resumo Operacional</h3>
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between items-center">
            <span className="text-xs text-slate-500">{r.label}</span>
            <span className={`font-bold text-sm ${r.alert ? 'text-red-600' : 'text-slate-600'}`}>{r.value}</span>
          </div>
        ))}

        {cp && (
          <>
            <div className="border-t border-slate-100 pt-2 mt-1" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Contas a pagar (mês)</span>
              <span className="font-bold text-sm text-orange-600">{fmt(cp.resumo.total_pendente)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Resultado operacional</span>
              <span className={`font-bold text-sm ${resultadoMes >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {resultadoMes >= 0 ? '+' : ''}{fmt(resultadoMes)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── DonutContasPagar ──────────────────────────────────────────────────────────

function DonutContasPagar({ cp }: { cp: ContasPagarDashboard }) {
  const slices = [
    { name: 'Pago',     value: cp.resumo.total_pago,     color: '#10b981', bg: 'bg-emerald-500' },
    { name: 'Pendente', value: cp.resumo.total_pendente, color: '#f59e0b', bg: 'bg-amber-400'   },
    { name: 'Vencido',  value: cp.resumo.total_vencido,  color: '#ef4444', bg: 'bg-red-500'     },
  ].filter(s => s.value > 0);

  const totalGeral   = cp.resumo.total_pago + cp.resumo.total_pendente + cp.resumo.total_vencido;
  const pctPago      = totalGeral > 0 ? Math.round((cp.resumo.total_pago / cp.resumo.total_geral) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-bold text-slate-800">Contas a Pagar — Mês Atual</h3>
      <p className="text-xs text-slate-500 mb-4">Referência: {cp.mes_atual.referencia}</p>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Donut chart */}
        <div className="relative flex-shrink-0 w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} cx="50%" cy="50%" innerRadius={58} outerRadius={80}
                dataKey="value" paddingAngle={3} cornerRadius={4}>
                {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v: number | undefined) => fmt(v ?? 0)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-lg font-bold text-slate-800 leading-none">{fmt(totalGeral)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{pctPago}% pago</p>
          </div>
        </div>

        {/* Legend with progress bars */}
        <div className="flex-1 w-full space-y-4">
          {slices.map(({ name, value, color, bg }) => {
            const pct = totalGeral > 0 ? Math.round((value / totalGeral) * 100) : 0;
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-sm text-slate-600">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{pct}%</span>
                    <span className="text-sm font-bold" style={{ color }}>{fmt(value)}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${bg}`} style={{ width: `${pct}%`, transition: 'width .6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── DespesasPorCategoria ──────────────────────────────────────────────────────

function DespesasPorCategoria({ cp }: { cp: ContasPagarDashboard }) {
  const total = cp.por_categoria.reduce((s, c) => s + c.total, 0);

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800">Despesas por Categoria</h3>
          <p className="text-xs text-slate-500">Mês atual — distribuição de gastos</p>
        </div>
        <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50 font-semibold">
          {fmt(total)}
        </Badge>
      </div>

      {cp.por_categoria.length === 0 ? (
        <EmptyState icon={<BarChart3 className="h-8 w-8 mb-2 opacity-40" />} label="Sem despesas categorizadas este mês" />
      ) : (
        <div className="space-y-3">
          {cp.por_categoria.slice(0, 6).map((cat, i) => {
            const pct   = cat.total > 0 ? (cat.pago / cat.total) * 100 : 0;
            const color = cat.cor || CAT_COLORS[i % CAT_COLORS.length];
            return (
              <div key={cat.categoria}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-sm font-medium text-slate-700">{cat.categoria}</span>
                    <span className="text-xs text-slate-400">({cat.quantidade})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      <span className="text-emerald-600 font-semibold">{fmt(cat.pago)}</span> pago
                    </span>
                    <span className="font-bold text-slate-700">{fmt(cat.total)}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                </div>
                {cat.pendente > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5 text-right">{fmt(cat.pendente)} pendente</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SaudeFinanceira ───────────────────────────────────────────────────────────

function SaudeFinanceira({ cp }: { cp: ContasPagarDashboard }) {
  const { taxa_inadimplencia, total_geral, total_pago, total_vencido, total_pendente } = cp.resumo;

  const inadColor = taxa_inadimplencia > 10 ? 'text-red-600'
    : taxa_inadimplencia > 5 ? 'text-amber-600' : 'text-emerald-600';
  const barColor  = taxa_inadimplencia > 10 ? 'bg-red-500'
    : taxa_inadimplencia > 5 ? 'bg-amber-500' : 'bg-emerald-500';

  const items = [
    { label: 'Total geral (em aberto)', value: fmt(total_geral), className: 'text-slate-700' },
    { label: 'Total quitado',           value: fmt(total_pago),  className: 'text-emerald-700' },
    { label: 'Total vencido',           value: fmt(total_vencido), className: total_vencido > 0 ? 'text-red-600' : 'text-slate-400' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-bold text-slate-800 mb-3">Saúde Financeira</h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Taxa de Inadimplência</span>
            <span className={`font-bold ${inadColor}`}>{taxa_inadimplencia.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(taxa_inadimplencia, 100)}%` }} />
          </div>
        </div>
        {items.map(({ label, value, className }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-slate-500">{label}</span>
            <span className={`font-bold text-sm ${className}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── StatusContasMes ───────────────────────────────────────────────────────────

function StatusContasMes({ cp }: { cp: ContasPagarDashboard }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-bold text-slate-800 mb-1">Status — Mês Atual</h3>
      <p className="text-xs text-slate-400 mb-3">{cp.mes_atual.referencia}</p>
      <div className="space-y-2">
        {cp.mes_atual.por_status.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-2">Sem contas este mês</p>
        ) : (
          cp.mes_atual.por_status.map(s => {
            const c = STATUS_CONTA_CONFIG[s.status] ?? { color: 'text-slate-700', bg: 'bg-slate-100', label: s.status };
            return (
              <div key={s.status} className={`flex items-center justify-between p-2.5 rounded-lg ${c.bg}`}>
                <div>
                  <span className={`text-sm font-medium ${c.color}`}>{c.label}</span>
                  <span className="text-xs text-slate-400 ml-1.5">({s.quantidade})</span>
                </div>
                <span className={`text-sm font-bold ${c.color}`}>{fmt(s.total)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── AcessoRapido ──────────────────────────────────────────────────────────────

function AcessoRapido() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-4 w-4 text-amber-500" />
        <h3 className="font-bold text-slate-800">Acesso Rápido</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map(({ icon: Icon, label, color, href }) => (
          <a key={label} href={href}
            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <div className={`${color} p-2.5 rounded-xl mb-2 group-hover:scale-110 transition-transform`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-700 text-center">{label}</span>
          </a>
        ))}
      </div>

      <a href="/restrito/financeiro/contas-pagar"
        className="mt-3 flex items-center justify-between p-3 rounded-xl border border-orange-100 bg-orange-50 hover:bg-orange-100 transition-colors group">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-200 rounded-lg">
            <Receipt className="h-3.5 w-3.5 text-orange-700" />
          </div>
          <span className="text-xs font-semibold text-orange-800">Contas a Pagar</span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-orange-500 group-hover:translate-x-0.5 transition-transform" />
      </a>
    </div>
  );
}

// ── TopVendas ─────────────────────────────────────────────────────────────────

function TopVendas({ vendas }: { vendas: Venda[] }) {
  const rankColors = [
    'bg-amber-100 text-amber-700',
    'bg-slate-200 text-slate-600',
    'bg-orange-100 text-orange-700',
  ];

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <h3 className="font-bold text-slate-800">Maiores Vendas do Mês</h3>
        </div>
        <a href="/restrito/comercial/vendas" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
          Ver todas <ArrowRight className="h-3 w-3" />
        </a>
      </div>

      {vendas.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-8 w-8 mb-2 opacity-40" />} label="Nenhuma venda este mês" />
      ) : (
        <div className="space-y-2">
          {vendas.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankColors[i] ?? 'bg-slate-100 text-slate-500'}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {v.cliente?.nomeRazaoSocial || 'Cliente não identificado'}
                </p>
                <p className="text-xs text-slate-500">
                  Pedido #{v.numeroPedido} • {format(new Date(v.createdAt), 'dd/MM HH:mm')}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-800">{fmt(v.valorTotal)}</p>
                <Badge variant={v.statusVenda === 'APROVADO' ? 'default' : 'secondary'} className="text-xs mt-0.5">
                  {v.statusVenda}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── EstoqueCritico ────────────────────────────────────────────────────────────

function EstoqueCritico({ produtos }: { produtos: Produto[] }) {
  if (!produtos.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <Package className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Alerta de Estoque Crítico</h3>
            <p className="text-xs text-slate-500">Produtos com menos de {ESTOQUE_CRITICO_THRESHOLD} unidades disponíveis</p>
          </div>
        </div>
        <Badge className="bg-red-500 hover:bg-red-500">{produtos.length} itens</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {produtos.slice(0, 8).map(p => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <Package className="h-4 w-4 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800 truncate">{p.nome}</p>
              <p className="text-xs text-red-600">{p.estoque![0].quantidade || 0} un. disponíveis</p>
            </div>
          </div>
        ))}
      </div>

      {produtos.length > 8 && (
        <p className="text-xs text-slate-500 mt-3 text-center">
          +{produtos.length - 8} outros produtos com estoque crítico
        </p>
      )}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
      {icon}
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardBI() {
  const token                                    = getToken();
  const { greeting, currentTime }                = useClock();
  const { data, isLoading, error, lastUpdate, fetchData } = useDashboardData(token);
  const metrics                                  = useDashboardMetrics(data);

  const cp = data.contasPagar;

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100">
      <HeaderEnterprise />

      <main className="container mx-auto px-4 py-6 max-w-7xl space-y-6">

        {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
        <DashboardHeader
          greeting={greeting}
          currentTime={currentTime}
          lastUpdate={lastUpdate}
          vencidosCount={metrics.vencidosAberto.length}
          onRefresh={fetchData}
        />

        {error && <ErrorBanner message={error} />}

        {/* ── KPIs de Vendas ────────────────────────────────────────────── */}
        <VendasKpis
          totalHoje={metrics.totalHoje}
          vendasHoje={metrics.vendasHoje}
          totalMes={metrics.totalMes}
          vendasMes={metrics.vendasMes}
          ticketMedio={metrics.ticketMedio}
          produtosBaixoEstoque={metrics.produtosBaixoEstoque}
          totalProdutos={data.produtos.length}
        />

        {/* ── Gráficos de Vendas ────────────────────────────────────────── */}
        <ChartsVendas
          horaChartData={metrics.horaChartData}
          diaChartData={metrics.diaChartData}
          pieData={metrics.pieData}
          totalHoje={metrics.totalHoje}
          totalMes={metrics.totalMes}
          statusCount={metrics.statusCount}
          canceladasHoje={metrics.canceladasHoje}
          produtosComEstoque={metrics.produtosComEstoque}
          produtosBaixoEstoque={metrics.produtosBaixoEstoque}
          totalProdutos={data.produtos.length}
          cp={cp}
          resultadoMes={metrics.resultadoMes}
        />

        {/* ── KPIs de Contas a Pagar ────────────────────────────────────── */}
        {cp && (
          <ContasPagarKpis
            cp={cp}
            vencidosAberto={metrics.vencidosAberto}
            proximosVencer={metrics.proximosVencer}
            resultadoMes={metrics.resultadoMes}
          />
        )}

        {/* ── Alertas de Contas (vencidas + próximas) ───────────────────── */}
        {cp && (
          <AlertasContasPagar
            vencidosAberto={metrics.vencidosAberto}
            proximosVencer={metrics.proximosVencer}
            totalVencidoAlerta={metrics.totalVencidoAlerta}
          />
        )}

        {/* ── Donut — Status contas do mês ──────────────────────────────── */}
        {cp && <DonutContasPagar cp={cp} />}

        {/* ── Despesas por Categoria + Status + Saúde Financeira ───────── */}
        {cp && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <DespesasPorCategoria cp={cp} />
            <div className="space-y-4">
              <StatusContasMes cp={cp} />
              <SaudeFinanceira  cp={cp} />
            </div>
          </div>
        )}

        {/* ── Acesso Rápido + Top Vendas ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AcessoRapido />
          <TopVendas vendas={metrics.topVendas} />
        </div>

        {/* ── Alerta de Estoque Crítico ─────────────────────────────────── */}
        <EstoqueCritico produtos={metrics.produtosBaixoEstoque} />

      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-8 border-t border-slate-200 bg-white/50">
        <div className="container mx-auto px-4 py-4 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-slate-900 text-sm">Fernandes Madeiras</span>
            <span className="text-xs text-slate-500">• Painel de Gestão</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <button onClick={fetchData} className="hover:text-slate-800 transition-colors">Atualizar dados</button>
            <a href="#" className="hover:text-slate-800 transition-colors">Suporte</a>
            <a href="#" className="hover:text-slate-800 flex items-center gap-1 transition-colors">
              <Mail className="h-3 w-3" /> Contato
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}