'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, DollarSign, CheckCircle, Clock, AlertCircle,
  Loader2, Receipt, CreditCard, X, Check, RefreshCw,
  Filter, ChevronDown, ChevronUp, Minus, FileText,
  AlertTriangle, Calendar, BarChart3, Users2
} from "lucide-react";
import { API_URL } from '@/lib/api';
import HeaderEnterprise from '@/components/header';
import { getToken } from '@/lib/auth';

// ============================================================================
// TYPES
// ============================================================================

interface ContaReceber {
  id: string;
  vendaId: string;
  clienteId: string;
  cliente: {
    id: string;
    nomeRazaoSocial: string;
    nomeFantasia: string;
    documento: string;
  };
  numeroParcela: number;
  totalParcelas: number;
  valorAberto: number;
  valorParcela: number;
  valorPago: number | null;
  acrescimos: number | null;
  descontos: number | null;
  dataVencimento: string;
  dataPagamento: string | null;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
  formaPagamento: {
    id: number;
    nome: string;
    codigoSefaz: string;
  };
  formaPagamentoId: number;
  createdAt: string;
  updatedAt: string;
}

interface FormaPagamento {
  id: number;
  nome: string;
  codigoSefaz: string;
  ativo: boolean;
}

interface ResumoFinanceiro {
  totalAReceber: number;
  vencido: number;
  aVencer7Dias: number;
  totalContas: number;
}

// ============================================================================
// UTILS
// ============================================================================

const R = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const diasAtraso = (dataVenc: string): number => {
  const hoje = new Date();
  const venc = new Date(dataVenc + 'T12:00:00');
  hoje.setHours(0, 0, 0, 0);
  venc.setHours(0, 0, 0, 0);
  return Math.floor((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
};

const isAtrasado = (conta: ContaReceber): boolean => {
  if (conta.status !== 'PENDENTE') return false;
  return diasAtraso(conta.dataVencimento) > 0;
};

const getStatusReal = (conta: ContaReceber): 'PAGO' | 'ATRASADO' | 'PENDENTE' | 'CANCELADO' | 'VENCE_HOJE' => {
  if (conta.status === 'PAGO') return 'PAGO';
  if (conta.status === 'CANCELADO') return 'CANCELADO';
  const dias = diasAtraso(conta.dataVencimento);
  if (dias > 0) return 'ATRASADO';
  if (dias === 0) return 'VENCE_HOJE';
  return 'PENDENTE';
};

// ============================================================================
// STATUS BADGE
// ============================================================================

const StatusBadge = ({ conta }: { conta: ContaReceber }) => {
  const status = getStatusReal(conta);
  const cfg = {
    PAGO: { label: 'PAGO', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
    ATRASADO: { label: 'ATRASADO', bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
    PENDENTE: { label: 'PENDENTE', bg: '#fffbeb', border: '#fde68a', text: '#d97706' },
    CANCELADO: { label: 'CANCELADO', bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' },
    VENCE_HOJE: { label: 'VENCE HOJE', bg: '#fef3c7', border: '#fcd34d', text: '#b45309' },
  }[status];

  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-sm border"
      style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.text }} />
      {cfg.label}
    </span>
  );
};

// ============================================================================
// LIQUIDAÇÃO MODAL
// ============================================================================

function ModalLiquidacao({
  conta,
  formasPagamento,
  onClose,
  onConfirmar,
}: {
  conta: ContaReceber;
  formasPagamento: FormaPagamento[];
  onClose: () => void;
  onConfirmar: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    valorPago: conta.valorAberto,
    acrescimos: 0,
    descontos: 0,
    dataPagamento: new Date().toISOString().split('T')[0],
    observacao: '',
    formaPagamentoId: conta.formaPagamento?.id || 1,
  });
  const [parcial, setParcial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const valorFinal = form.valorPago + form.acrescimos - form.descontos;
  const saldoRestante = conta.valorAberto - form.valorPago;
  const dias = diasAtraso(conta.dataVencimento);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleConfirmar = async () => {
    setErro('');
    if (form.valorPago <= 0) { setErro('O valor pago deve ser maior que zero.'); return; }
    if (form.valorPago > conta.valorAberto && !parcial) { setErro('Valor não pode exceder o saldo aberto.'); return; }
    if (form.descontos > conta.valorAberto) { setErro('Desconto não pode ser maior que o saldo aberto.'); return; }
    if (!form.dataPagamento) { setErro('Informe a data do pagamento.'); return; }

    try {
      setLoading(true);
      await onConfirmar({
        id: conta.id,
        valorPago: Number(form.valorPago),
        acrescimos: Number(form.acrescimos),
        descontos: Number(form.descontos),
        dataPagamento: form.dataPagamento,
        formaPagamentoId: Number(form.formaPagamentoId),
      });
      onClose();
    } catch (e: any) {
      setErro(e?.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[95vh]">

        {/* HEADER */}
        <div className="bg-[#1a2332] text-white px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-[#4a7fa5]" />
            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#4a7fa5]">
                Módulo Financeiro · Contas a Receber
              </div>
              <div className="text-[11px] font-black uppercase tracking-tight text-white leading-none">
                Liquidação de Título
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#4a7fa5] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* DADOS DO TÍTULO */}
        <div className="bg-[#f8fafd] border-b border-slate-200 px-5 py-3 flex-shrink-0">
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2">
              <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest">Cliente</p>
              <p className="text-xs font-black text-[#1a2332] uppercase leading-tight mt-0.5">
                {conta.cliente.nomeFantasia || conta.cliente.nomeRazaoSocial}
              </p>
              <p className="text-[9px] text-[#8a9ab2] font-mono mt-0.5">{conta.cliente.documento}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest">Vencimento</p>
              <p className={`text-xs font-black mt-0.5 ${dias > 0 ? 'text-red-600' : dias === 0 ? 'text-amber-600' : 'text-[#1a2332]'}`}>
                {fmtDate(conta.dataVencimento)}
              </p>
              {dias > 0 && (
                <p className="text-[9px] font-bold text-red-500 mt-0.5">{dias} dia(s) em atraso</p>
              )}
              {dias === 0 && (
                <p className="text-[9px] font-bold text-amber-500 mt-0.5">Vence hoje</p>
              )}
            </div>
            <div>
              <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest">Valor Original</p>
              <p className="text-xs font-black text-[#1a2332] mt-0.5">{R(conta.valorParcela)}</p>
              <p className="text-[9px] text-[#8a9ab2] mt-0.5">Parcela {conta.numeroParcela}/{conta.totalParcelas}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest">Saldo Aberto</p>
              <p className="text-sm font-black text-[#1a6eb5] mt-0.5">{R(conta.valorAberto)}</p>
            </div>
          </div>
        </div>

        {/* ALERTA ATRASO */}
        {dias > 0 && (
          <div className="bg-red-50 border-b border-red-200 px-5 py-2 flex items-center gap-2 flex-shrink-0">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
            <p className="text-[10px] font-bold text-red-700">
              Título vencido há <strong>{dias} dia(s)</strong>. Verifique a cobrança de juros/multa antes de liquidar.
            </p>
          </div>
        )}

        {/* FORMULÁRIO */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Tipo de liquidação */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <p className="text-[9px] font-black text-[#6b7a8d] uppercase tracking-widest">Tipo de Liquidação</p>
            <div className="flex gap-1">
              <button
                onClick={() => { setParcial(false); set('valorPago', conta.valorAberto); }}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wide rounded-sm border transition-colors ${
                  !parcial
                    ? 'bg-[#1a6eb5] border-[#1a6eb5] text-white'
                    : 'bg-white border-slate-300 text-[#6b7a8d] hover:border-[#1a6eb5] hover:text-[#1a6eb5]'
                }`}
              >
                Total
              </button>
              <button
                onClick={() => { setParcial(true); set('valorPago', 0); }}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wide rounded-sm border transition-colors ${
                  parcial
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-white border-slate-300 text-[#6b7a8d] hover:border-amber-500 hover:text-amber-600'
                }`}
              >
                Parcial
              </button>
            </div>
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Valor Pago */}
            <div>
              <label className="text-[9px] font-black text-[#6b7a8d] uppercase tracking-widest block mb-1">
                Valor Recebido *
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8a9ab2]">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={conta.valorAberto}
                  value={form.valorPago}
                  onChange={e => set('valorPago', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-sm text-xs font-bold text-[#1a2332] focus:outline-none focus:ring-1 focus:ring-[#1a6eb5] focus:border-[#1a6eb5]"
                />
              </div>
              <p className="text-[8px] text-[#8a9ab2] mt-0.5">Máx: {R(conta.valorAberto)}</p>
            </div>

            {/* Acréscimos */}
            <div>
              <label className="text-[9px] font-black text-[#6b7a8d] uppercase tracking-widest block mb-1">
                Acréscimos / Juros
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8a9ab2]">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.acrescimos}
                  onChange={e => set('acrescimos', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-sm text-xs font-bold text-[#1a2332] focus:outline-none focus:ring-1 focus:ring-[#1a6eb5] focus:border-[#1a6eb5]"
                />
              </div>
            </div>

            {/* Descontos */}
            <div>
              <label className="text-[9px] font-black text-[#6b7a8d] uppercase tracking-widest block mb-1">
                Descontos
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8a9ab2]">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.descontos}
                  onChange={e => set('descontos', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-sm text-xs font-bold text-[#1a2332] focus:outline-none focus:ring-1 focus:ring-[#1a6eb5] focus:border-[#1a6eb5]"
                />
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="text-[9px] font-black text-[#6b7a8d] uppercase tracking-widest block mb-1">
                Forma de Pagamento *
              </label>
              <select
                value={form.formaPagamentoId}
                onChange={e => set('formaPagamentoId', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs font-medium text-[#1a2332] focus:outline-none focus:ring-1 focus:ring-[#1a6eb5] focus:border-[#1a6eb5] bg-white"
              >
                {formasPagamento.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nome}{f.codigoSefaz ? ` (${f.codigoSefaz})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Pagamento */}
            <div>
              <label className="text-[9px] font-black text-[#6b7a8d] uppercase tracking-widest block mb-1">
                Data do Recebimento *
              </label>
              <input
                type="date"
                value={form.dataPagamento}
                onChange={e => set('dataPagamento', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs font-medium text-[#1a2332] focus:outline-none focus:ring-1 focus:ring-[#1a6eb5] focus:border-[#1a6eb5]"
              />
            </div>
          </div>

          {/* Observação */}
          <div className="mb-4">
            <label className="text-[9px] font-black text-[#6b7a8d] uppercase tracking-widest block mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Observações sobre o recebimento..."
              value={form.observacao}
              onChange={e => set('observacao', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-sm text-xs text-[#1a2332] placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#1a6eb5] focus:border-[#1a6eb5] resize-none"
            />
          </div>

          {/* RESUMO FINANCEIRO */}
          <div className="border border-slate-200 rounded-sm overflow-hidden">
            <div className="bg-[#1a2332] text-white px-4 py-1.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-[#4a7fa5]">
                Resumo do Lançamento
              </span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white">
              <div className="px-4 py-3 text-center">
                <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest">Valor Recebido</p>
                <p className="text-base font-black text-[#1a2332] mt-0.5">{R(form.valorPago)}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest">Total a Liquidar</p>
                <p className="text-base font-black text-[#1a6eb5] mt-0.5">{R(valorFinal)}</p>
                {(form.acrescimos > 0 || form.descontos > 0) && (
                  <p className="text-[8px] text-[#8a9ab2] mt-0.5">
                    {form.acrescimos > 0 && `+${R(form.acrescimos)} jrs`}
                    {form.acrescimos > 0 && form.descontos > 0 && ' · '}
                    {form.descontos > 0 && `-${R(form.descontos)} dsc`}
                  </p>
                )}
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest">Saldo Restante</p>
                <p className={`text-base font-black mt-0.5 ${saldoRestante > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {R(Math.max(saldoRestante, 0))}
                </p>
                {saldoRestante <= 0 && (
                  <p className="text-[8px] font-bold text-emerald-600 mt-0.5">Quitado</p>
                )}
                {saldoRestante > 0 && parcial && (
                  <p className="text-[8px] font-bold text-amber-600 mt-0.5">Restará em aberto</p>
                )}
              </div>
            </div>
          </div>

          {/* ERRO */}
          {erro && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              <p className="text-[10px] font-bold text-red-700">{erro}</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-[#f8fafd] border-t border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[9px] font-black uppercase tracking-widest border border-slate-300 text-[#6b7a8d] hover:border-slate-400 rounded-sm transition-colors"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            {parcial && (
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-sm">
                <AlertCircle className="h-3 w-3" />
                Liquidação parcial · saldo permanece aberto
              </div>
            )}
            <button
              onClick={handleConfirmar}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-[#1a6eb5] hover:bg-[#155d9e] disabled:opacity-50 text-white text-[9px] font-black uppercase tracking-widest rounded-sm transition-colors"
            >
              {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Check className="h-3.5 w-3.5" />
              }
              {parcial ? 'Confirmar Parcial' : 'Confirmar Liquidação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FinanceiroControle() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({ totalAReceber: 0, vencido: 0, aVencer7Dias: 0, totalContas: 0 });
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [modalConta, setModalConta] = useState<ContaReceber | null>(null);
  const [sortField, setSortField] = useState<string>('dataVencimento');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const token = useMemo(() => getToken(), []);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'TODOS'
        ? `${API_URL}/contas-receber`
        : `${API_URL}/contas-receber?status=${statusFilter}`;

      const [contasRes, resumoRes, formasRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/contas-receber/resumo`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/formas-pagamento`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [contasData, resumoData, formasData] = await Promise.all([
        contasRes.ok ? contasRes.json() : [],
        resumoRes.ok ? resumoRes.json() : { totalAReceber: 0, vencido: 0, aVencer7Dias: 0, totalContas: 0 },
        formasRes.ok ? formasRes.json() : [],
      ]);

      setContas(Array.isArray(contasData) ? contasData : []);
      setResumo(resumoData);
      setFormasPagamento((formasData as FormaPagamento[]).filter(f => f.ativo));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, token]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleLiquidar = async (data: any) => {
    const response = await fetch(`${API_URL}/contas-receber/${data.id}/liquidar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        valorPago: Number(data.valorPago),
        acrescimos: Number(data.acrescimos || 0),
        descontos: Number(data.descontos || 0),
        dataPagamento: data.dataPagamento,
        formaPagamentoId: Number(data.formaPagamentoId),
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Erro ao liquidar título');
    }
    await carregarDados();
  };

  const handleQuitarRapido = async (conta: ContaReceber) => {
    setConfirmando(conta.id);
    try {
      await handleLiquidar({
        id: conta.id,
        valorPago: conta.valorAberto,
        acrescimos: 0,
        descontos: 0,
        dataPagamento: new Date().toISOString().split('T')[0],
        formaPagamentoId: conta.formaPagamento?.id || 1,
      });
    } catch (e) {
      alert('Erro ao quitar. Use "Liquidar" para configurar os detalhes.');
    } finally {
      setConfirmando(null);
    }
  };

  const applySort = (f: string) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
  };

  const contasFiltradas = useMemo(() => {
    const s = search.toLowerCase();
    return contas
      .filter(c =>
        c.cliente.nomeRazaoSocial.toLowerCase().includes(s) ||
        c.cliente.documento.includes(search) ||
        (c.cliente.nomeFantasia || '').toLowerCase().includes(s)
      )
      .sort((a, b) => {
        let av: any, bv: any;
        if (sortField === 'dataVencimento') { av = a.dataVencimento; bv = b.dataVencimento; }
        else if (sortField === 'valorAberto') { av = a.valorAberto; bv = b.valorAberto; }
        else if (sortField === 'cliente') { av = a.cliente.nomeRazaoSocial; bv = b.cliente.nomeRazaoSocial; }
        else if (sortField === 'status') { av = getStatusReal(a); bv = getStatusReal(b); }
        else { av = a.dataVencimento; bv = b.dataVencimento; }
        if (av === bv) return 0;
        return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
      });
  }, [contas, search, sortField, sortDir]);

  // Agrupamento por status para contagem
  const countPendentes = contas.filter(c => c.status === 'PENDENTE' && !isAtrasado(c)).length;
  const countAtrasados = contas.filter(c => isAtrasado(c)).length;
  const countPagos = contas.filter(c => c.status === 'PAGO').length;

  const Th = ({ field, children, align = 'left' }: { field: string; children: React.ReactNode; align?: string }) => {
    const active = sortField === field;
    return (
      <th
        onClick={() => applySort(field)}
        className={`px-3 py-2.5 text-[9px] font-black uppercase tracking-widest cursor-pointer select-none whitespace-nowrap transition-colors text-${align}
          ${active ? 'text-[#1a6eb5]' : 'text-[#6b7a8d] hover:text-[#1a2332]'}`}
      >
        <span className={`inline-flex items-center gap-0.5 ${align === 'right' ? 'justify-end w-full' : ''}`}>
          {children}
          {active
            ? sortDir === 'asc' ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />
            : <Minus className="h-2.5 w-2.5 opacity-20" />}
        </span>
      </th>
    );
  };

  return (
    <div className="bg-[#eef1f6] min-h-screen">
      <HeaderEnterprise />

      {/* TOTVS TOP BAR */}
      <div className="bg-[#1a2332] text-white px-6 flex items-stretch border-b border-[#263344]">
        <div className="flex items-center gap-3 py-2.5 border-r border-[#263344] pr-5 mr-5">
          <Receipt className="h-4 w-4 text-[#4a7fa5]" />
          <div>
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#4a7fa5]">Módulo Financeiro</div>
            <div className="text-[11px] font-black uppercase tracking-tight text-white leading-none">
              Contas a Receber · Liquidações
            </div>
          </div>
        </div>
        {/* Quick stats */}
        <div className="flex items-center gap-5 py-2.5">
          {[
            { l: 'Pendentes', v: countPendentes, c: 'text-amber-400' },
            { l: 'Atrasados', v: countAtrasados, c: 'text-red-400' },
            { l: 'Pagos', v: countPagos, c: 'text-emerald-400' },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-1.5 border-r border-[#263344] pr-5">
              <span className="text-[8px] font-black uppercase tracking-widest text-[#4a7fa5]">{s.l}</span>
              <span className={`text-[11px] font-black ${s.c}`}>{s.v}</span>
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 py-2">
          <button
            onClick={carregarDados}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-[#3a5068] hover:border-[#4a7fa5] hover:bg-[#263344] rounded-sm transition-colors text-[#7a99b8]"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      <main className="p-4 max-w-[1600px] mx-auto">

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            {
              label: 'Total a Receber',
              value: R(resumo.totalAReceber),
              sub: `${resumo.totalContas} título(s) em aberto`,
              icon: <DollarSign className="h-4 w-4" />,
              dark: true,
            },
            {
              label: 'Vencido',
              value: R(resumo.vencido),
              sub: `${countAtrasados} título(s) em atraso`,
              icon: <AlertCircle className="h-4 w-4" />,
              warn: resumo.vencido > 0,
            },
            {
              label: 'A Vencer em 7 Dias',
              value: R(resumo.aVencer7Dias),
              sub: 'Atenção ao fluxo de caixa',
              icon: <Clock className="h-4 w-4" />,
            },
            {
              label: 'Títulos Cadastrados',
              value: String(contas.length),
              sub: `${countPagos} pago(s) · ${countPendentes} pendente(s)`,
              icon: <FileText className="h-4 w-4" />,
            },
          ].map(c => (
            <div key={c.label} className={`border rounded-sm px-4 py-3 flex flex-col gap-1 ${
              c.dark ? 'bg-[#1a2332] border-[#263344]'
              : c.warn ? 'bg-red-50 border-red-300'
              : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${
                  c.dark ? 'text-[#7a99b8]' : c.warn ? 'text-red-500' : 'text-[#6b7a8d]'
                }`}>{c.label}</span>
                <span className={c.dark ? 'text-[#4a7fa5]' : c.warn ? 'text-red-400' : 'text-[#9baab8]'}>{c.icon}</span>
              </div>
              <div className={`text-xl font-black tracking-tight leading-none ${
                c.dark ? 'text-white' : c.warn ? 'text-red-700' : 'text-[#1a2332]'
              }`}>{c.value}</div>
              <div className={`text-[10px] font-semibold ${
                c.dark ? 'text-[#4a7fa5]' : c.warn ? 'text-red-500' : 'text-[#8a9ab2]'
              }`}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* TABLE PANEL */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">

          {/* Table header bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8fafd] border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <Receipt className="h-3.5 w-3.5 text-[#4a7fa5]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#1a2332]">
                Títulos
              </span>
              <span className="text-[9px] font-bold text-[#8a9ab2] border border-slate-200 px-1.5 py-0.5 rounded-sm bg-white">
                {contasFiltradas.length} registro(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente ou CPF/CNPJ..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-7 pr-3 py-1.5 border border-slate-300 rounded-sm text-[10px] font-medium text-[#1a2332] placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#1a6eb5] w-52"
                />
              </div>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 border border-slate-300 rounded-sm text-[10px] font-black uppercase text-[#1a2332] bg-white focus:outline-none focus:ring-1 focus:ring-[#1a6eb5]"
              >
                <option value="TODOS">Todos</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="ATRASADO">Atrasados</option>
                <option value="PAGO">Pagos</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#1a6eb5]" />
                <span className="text-[10px] font-black text-[#8a9ab2] uppercase tracking-widest">Carregando...</span>
              </div>
            </div>
          ) : contasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Receipt className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum título encontrado</p>
              <p className="text-[10px] text-slate-300 mt-1">Ajuste os filtros e tente novamente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f8fafd] border-b border-slate-200">
                    <Th field="cliente" align="left">Cliente</Th>
                    <Th field="dataVencimento" align="left">Vencimento</Th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-[#6b7a8d] text-center">
                      Parcela
                    </th>
                    <Th field="valorAberto" align="right">Valor Original</Th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-[#6b7a8d] text-right">
                      Saldo Aberto
                    </th>
                    <Th field="status" align="center">Status</Th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-[#6b7a8d]">
                      Forma Pagto
                    </th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-[#6b7a8d] text-center">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contasFiltradas.map(conta => {
                    const atrasado = isAtrasado(conta);
                    const dias = diasAtraso(conta.dataVencimento);
                    const statusReal = getStatusReal(conta);
                    const isQuiting = confirmando === conta.id;

                    return (
                      <tr
                        key={conta.id}
                        className={`border-b border-slate-100 transition-colors hover:bg-[#f0f5fb] ${
                          atrasado ? 'bg-red-50/30' : ''
                        }`}
                      >
                        {/* Cliente */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-sm flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white"
                              style={{ backgroundColor: atrasado ? '#dc2626' : '#1a6eb5' }}
                            >
                              {conta.cliente.nomeRazaoSocial.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-[#1a2332] uppercase tracking-tight leading-none">
                                {conta.cliente.nomeFantasia || conta.cliente.nomeRazaoSocial}
                              </p>
                              <p className="text-[9px] font-mono text-[#8a9ab2] mt-0.5">
                                {conta.cliente.documento}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Vencimento */}
                        <td className="px-3 py-2.5">
                          <p className={`text-[11px] font-black leading-none ${atrasado ? 'text-red-600' : 'text-[#1a2332]'}`}>
                            {fmtDate(conta.dataVencimento)}
                          </p>
                          {atrasado && (
                            <p className="text-[9px] font-bold text-red-500 mt-0.5">{dias}d em atraso</p>
                          )}
                          {conta.dataPagamento && conta.status === 'PAGO' && (
                            <p className="text-[9px] font-semibold text-emerald-600 mt-0.5">
                              Pago em {fmtDate(conta.dataPagamento)}
                            </p>
                          )}
                        </td>

                        {/* Parcela */}
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-[10px] font-black text-[#6b7a8d] bg-slate-100 px-2 py-0.5 rounded-sm">
                            {conta.numeroParcela}/{conta.totalParcelas}
                          </span>
                        </td>

                        {/* Valor Original */}
                        <td className="px-3 py-2.5 text-right">
                          <p className="text-[11px] font-black text-[#1a2332]">{R(conta.valorParcela)}</p>
                        </td>

                        {/* Saldo Aberto */}
                        <td className="px-3 py-2.5 text-right">
                          <p className={`text-[12px] font-black ${
                            conta.valorAberto > 0 ? 'text-[#1a6eb5]' : 'text-emerald-600'
                          }`}>
                            {R(conta.valorAberto)}
                          </p>
                          {conta.valorPago != null && conta.valorPago > 0 && conta.valorAberto > 0 && (
                            <p className="text-[9px] font-semibold text-[#8a9ab2] mt-0.5">
                              Pg: {R(conta.valorPago)}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2.5 text-center">
                          <StatusBadge conta={conta} />
                        </td>

                        {/* Forma de Pagamento */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3 text-[#8a9ab2] flex-shrink-0" />
                            <span className="text-[10px] font-semibold text-[#6b7a8d]">
                              {conta.formaPagamento?.nome || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1 justify-center">
                            {conta.status === 'PENDENTE' && (
                              <>
                                {/* Liquidar completo */}
                                <button
                                  onClick={() => setModalConta(conta)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1a6eb5] hover:bg-[#155d9e] text-white text-[9px] font-black uppercase tracking-wide rounded-sm transition-colors"
                                >
                                  <DollarSign className="h-3 w-3" />
                                  Liquidar
                                </button>

                                {/* Quitar rápido */}
                                <button
                                  onClick={() => handleQuitarRapido(conta)}
                                  disabled={isQuiting}
                                  className="flex items-center gap-1 px-2 py-1.5 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-[9px] font-black uppercase tracking-wide rounded-sm transition-colors disabled:opacity-50"
                                  title="Quitar total com os dados atuais"
                                >
                                  {isQuiting
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Check className="h-3 w-3" />
                                  }
                                  Quitar
                                </button>
                              </>
                            )}

                            {conta.status === 'PAGO' && (
                              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1.5 rounded-sm">
                                <CheckCircle className="h-3 w-3" />
                                Liquidado
                              </span>
                            )}

                            {conta.status === 'CANCELADO' && (
                              <span className="text-[9px] font-black text-slate-400">Cancelado</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* FOOTER */}
          {contasFiltradas.length > 0 && (
            <div className="bg-[#1a2332] text-white px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#263344]">
              <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#4a7fa5] mr-1">
                Totais Filtrados
              </div>
              {[
                { l: 'Saldo Total Aberto', v: R(contasFiltradas.reduce((a, c) => a + c.valorAberto, 0)), c: 'text-white' },
                { l: 'Total Recebido', v: R(contasFiltradas.reduce((a, c) => a + (c.valorPago || 0), 0)), c: 'text-emerald-400' },
                {
                  l: 'Vencidos',
                  v: R(contasFiltradas.filter(c => isAtrasado(c)).reduce((a, c) => a + c.valorAberto, 0)),
                  c: 'text-red-400'
                },
                { l: 'Títulos', v: String(contasFiltradas.length), c: 'text-slate-300' },
              ].map(item => (
                <div key={item.l} className="flex flex-col">
                  <span className="text-[7px] font-black text-[#4a7fa5] uppercase tracking-widest">{item.l}</span>
                  <span className={`text-[11px] font-black ${item.c}`}>{item.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LEGENDA */}
        <div className="mt-3 bg-white border border-slate-200 rounded-sm px-4 py-2.5 flex items-center gap-6">
          <span className="text-[8px] font-black text-[#6b7a8d] uppercase tracking-widest mr-2">Legenda:</span>
          {[
            { c: '#d97706', l: 'Pendente' },
            { c: '#dc2626', l: 'Atrasado' },
            { c: '#b45309', l: 'Vence Hoje' },
            { c: '#16a34a', l: 'Pago' },
            { c: '#64748b', l: 'Cancelado' },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm flex-shrink-0" style={{ backgroundColor: s.c }} />
              <span className="text-[9px] font-semibold text-[#6b7a8d]">{s.l}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-3 text-[9px] font-bold text-[#8a9ab2]">
            <span><strong className="text-[#1a6eb5]">Liquidar</strong> — abre painel completo com acréscimos/descontos</span>
            <span><strong className="text-emerald-600">Quitar</strong> — liquida automaticamente pelo valor em aberto</span>
          </div>
        </div>
      </main>

      {/* MODAL */}
      {modalConta && (
        <ModalLiquidacao
          conta={modalConta}
          formasPagamento={formasPagamento}
          onClose={() => setModalConta(null)}
          onConfirmar={handleLiquidar}
        />
      )}
    </div>
  );
}