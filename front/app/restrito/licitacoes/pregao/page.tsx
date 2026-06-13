"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { API_URL }  from "@/lib/api";
import { getToken } from "@/lib/auth";
import HeaderEnterprise from "@/components/header";
import {
  AlertTriangle, TrendingUp, TrendingDown, Zap, Target,
  CheckCircle, XCircle, Save, RefreshCw, Trophy, ChevronDown, ChevronUp,
  Flag, ArrowLeft, Package,
} from "lucide-react";
import {
  LicitacaoRaw, LicitacaoCalculada, LoteCalculado,
  BRL, STATUS_LABELS,
} from "../licitacoes.types";

// ─────────────────────────────────────────────────────────────────────────────

interface LanceState {
  loteId: string;
  meuLance: string;
  lanceConcorrente: string;
  saving: boolean;
  savedAt: Date | null;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PregaoPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const urlId        = searchParams.get("id");

  const [licitacoes,   setLicitacoes]   = useState<LicitacaoRaw[]>([]);
  const [licitacaoId,  setLicitacaoId]  = useState<string>(urlId ?? "");
  const [calculada,    setCalculada]    = useState<LicitacaoCalculada | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [lances,       setLances]       = useState<Record<string, LanceState>>({});
  const [lotesAbertos, setLotesAbertos] = useState<Record<string, boolean>>({});
  const [autoSave,     setAutoSave]     = useState(true);

  // Modal finalizar
  const [showFinalizar,   setShowFinalizar]   = useState(false);
  const [finalizando,     setFinalizando]     = useState(false);
  const [resultGanhou,    setResultGanhou]    = useState<boolean | null>(null);
  const [valorContratado, setValorContratado] = useState("");
  const [obsFinalizacao,  setObsFinalizacao]  = useState("");

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Lista de licitações ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const token = getToken();
      const res   = await fetch(`${API_URL}/licitacoes`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data: LicitacaoRaw[] = await res.json();
      setLicitacoes(data.filter((l) => l.status !== "CANCELADA"));
    })();
  }, []);

  // Se vier ?id= na URL, aplica automaticamente
  useEffect(() => { if (urlId) setLicitacaoId(urlId); }, [urlId]);

  // ── Carrega cálculos ─────────────────────────────────────────────────────
  const carregarCalculos = useCallback(async (id?: string) => {
    const alvo = id ?? licitacaoId;
    if (!alvo) return;
    try {
      setLoading(true);
      const token = getToken();
      const res   = await fetch(`${API_URL}/licitacoes/${alvo}/calcular`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data: LicitacaoCalculada = await res.json();
      setCalculada(data);

      const initLances: Record<string, LanceState>  = {};
      const initAbertos: Record<string, boolean>    = {};
      data.lotesCalculados.forEach((lote, i) => {
        initLances[lote.loteId] = {
          loteId: lote.loteId,
          meuLance: lote.meuLance?.toString() ?? "",
          lanceConcorrente: lote.lanceConcorrente?.toString() ?? "",
          saving: false, savedAt: null, error: null,
        };
        initAbertos[lote.loteId] = i === 0;
      });
      setLances(initLances);
      setLotesAbertos(initAbertos);
    } finally {
      setLoading(false);
    }
  }, [licitacaoId]);

  useEffect(() => { if (licitacaoId) carregarCalculos(licitacaoId); else setCalculada(null); }, [licitacaoId]);

  // ── Atualiza lance + auto-save com debounce ──────────────────────────────
  const handleLanceChange = useCallback(
    (loteId: string, field: "meuLance" | "lanceConcorrente", value: string) => {
      setLances((prev) => ({ ...prev, [loteId]: { ...prev[loteId], [field]: value, error: null } }));
      if (!autoSave) return;
      if (debounceTimers.current[loteId]) clearTimeout(debounceTimers.current[loteId]);
      debounceTimers.current[loteId] = setTimeout(() => salvarLance(loteId), 800);
    }, [autoSave],
  );

  const salvarLance = useCallback(async (loteId: string) => {
    setLances((prev) => {
      const lance = prev[loteId];
      if (!lance) return prev;

      const doSave = async () => {
        try {
          const token = getToken();
          const res   = await fetch(`${API_URL}/licitacoes/lotes/${loteId}/lance`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              meuLance:         lance.meuLance         ? Number(lance.meuLance)         : null,
              lanceConcorrente: lance.lanceConcorrente  ? Number(lance.lanceConcorrente)  : null,
            }),
          });
          if (!res.ok) throw new Error("Falha ao salvar");

          setLances((p) => ({ ...p, [loteId]: { ...p[loteId], saving: false, savedAt: new Date(), error: null } }));

          // Sincroniza calculada localmente
          const meuN = lance.meuLance         ? Number(lance.meuLance)         : null;
          const conN = lance.lanceConcorrente  ? Number(lance.lanceConcorrente)  : null;

          setCalculada((calc) => {
            if (!calc) return calc;
            return {
              ...calc,
              lotesCalculados: calc.lotesCalculados.map((l) =>
                l.loteId === loteId
                  ? {
                      ...l, meuLance: meuN, lanceConcorrente: conN,
                      lucroMeuLance: meuN !== null ? meuN - l.custoTotalLote : null,
                      diferencaConcorrente: meuN !== null && conN !== null ? meuN - conN : null,
                      abaixoMinimo: meuN !== null && meuN < l.lanceIdealLote,
                      alertaConcorrente: meuN !== null && conN !== null && meuN > conN,
                    }
                  : l,
              ),
            };
          });
        } catch {
          setLances((p) => ({ ...p, [loteId]: { ...p[loteId], saving: false, error: "Erro ao salvar" } }));
        }
      };

      doSave();
      return { ...prev, [loteId]: { ...prev[loteId], saving: true } };
    });
  }, []);

  // ── Resultado do lote ────────────────────────────────────────────────────
  const marcarGanhouLote = useCallback(async (loteId: string, ganhou: boolean) => {
    const token = getToken();
    await fetch(`${API_URL}/licitacoes/lotes/${loteId}/lance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ganhouLote: ganhou }),
    });
    setCalculada((prev) => prev ? {
      ...prev,
      lotesCalculados: prev.lotesCalculados.map((l) => l.loteId === loteId ? { ...l, ganhouLote: ganhou } : l),
    } : prev);
  }, []);

  // ── Iniciar pregão ───────────────────────────────────────────────────────
  const iniciarPregao = async () => {
    if (!licitacaoId) return;
    const token = getToken();
    await fetch(`${API_URL}/licitacoes/${licitacaoId}/iniciar-pregao`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}` },
    });
    await carregarCalculos();
  };

  // ── Finalizar licitação ──────────────────────────────────────────────────
  const handleFinalizar = async () => {
    if (resultGanhou === null) { alert("Informe o resultado."); return; }
    try {
      setFinalizando(true);
      const token = getToken();
      const res   = await fetch(`${API_URL}/licitacoes/${licitacaoId}/finalizar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ganhou: resultGanhou,
          valorContratado: valorContratado ? Number(valorContratado) : null,
          observacoes: obsFinalizacao,
        }),
      });
      if (!res.ok) throw new Error();
      setShowFinalizar(false);
      await carregarCalculos();
    } finally {
      setFinalizando(false);
    }
  };

  // ── Indicadores em tempo real ────────────────────────────────────────────
  const calcTempoReal = (lote: LoteCalculado, lance: LanceState) => {
    const meu   = lance.meuLance        ? Number(lance.meuLance)        : null;
    const conc  = lance.lanceConcorrente ? Number(lance.lanceConcorrente) : null;
    const lucro = meu !== null ? meu - lote.custoTotalLote : null;
    return {
      lucro,
      margemReal:   meu && meu > 0 ? ((meu - lote.custoTotalLote) / meu) * 100 : null,
      diferenca:    meu !== null && conc !== null ? meu - conc : null,
      abaixoMinimo: meu !== null && meu < lote.lanceIdealLote,
      alertaPerder: meu !== null && conc !== null && meu > conc,
      prejuizo:     lucro !== null && lucro < 0,
    };
  };

  // ── Totais globais ───────────────────────────────────────────────────────
  const totais = useMemo(() => {
    if (!calculada) return { totalLance: 0, totalLucro: 0, alertas: 0 };
    return calculada.lotesCalculados.reduce(
      (acc, lote) => {
        const lance = lances[lote.loteId];
        const meu   = lance?.meuLance ? Number(lance.meuLance) : 0;
        const ind   = lance ? calcTempoReal(lote, lance) : null;
        return {
          totalLance: acc.totalLance + meu,
          totalLucro: acc.totalLucro + meu - lote.custoTotalLote,
          alertas:    acc.alertas + (ind?.alertaPerder || ind?.abaixoMinimo ? 1 : 0),
        };
      },
      { totalLance: 0, totalLucro: 0, alertas: 0 },
    );
  }, [calculada, lances]);

  const licitacaoAtual = calculada?.licitacao;
  const jaFinalizada   = licitacaoAtual?.status === "FINALIZADA";

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <HeaderEnterprise />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-[#0f1117] border-b border-white/10 sticky top-0 z-20 px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/licitacoes/dashboard")} className="text-white/40 hover:text-white/70">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-white font-black uppercase text-sm tracking-wider">Modo Pregão</span>
            {licitacaoAtual && (
              <Badge className="bg-white/10 text-white/80 border-white/20 text-xs max-w-xs truncate">
                {licitacaoAtual.nome}
              </Badge>
            )}
            {totais.alertas > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] font-black animate-pulse flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {totais.alertas} alerta{totais.alertas > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer select-none">
              <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} className="accent-emerald-400" />
              Auto-salvar
            </label>
            {licitacaoAtual && licitacaoAtual.status !== "EM_PREGAO" && !jaFinalizada && (
              <Button size="sm" className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black uppercase" onClick={iniciarPregao}>
                <Zap className="h-3 w-3 mr-1" /> Iniciar Pregão
              </Button>
            )}
            {licitacaoAtual && !jaFinalizada && (
              <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-emerald-500/50 text-emerald-400 hover:bg-emerald-950 uppercase" onClick={() => setShowFinalizar(true)}>
                <Flag className="h-3 w-3 mr-1" /> Finalizar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">

        {/* ── Seletor ──────────────────────────────────────────────────── */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">Selecionar Licitação</label>
            <Select value={licitacaoId} onValueChange={setLicitacaoId}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white h-10 text-sm font-bold">
                <SelectValue placeholder="Escolha uma licitação para operar..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20">
                {licitacoes.map((l) => (
                  <SelectItem key={l.id} value={l.id} className="text-white/80 focus:bg-white/10">
                    <span className="font-bold">{l.nome}</span>
                    <span className="ml-2 text-white/40 text-xs">— {STATUS_LABELS[l.status]}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {loading && (
          <div className="text-center py-16 text-white/30">
            <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin" />
            <p className="text-sm font-bold uppercase">Calculando rateios e margens...</p>
          </div>
        )}

        {!loading && !calculada && (
          <div className="text-center py-20 text-white/20">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold uppercase">Selecione uma licitação acima para começar</p>
          </div>
        )}

        {calculada && !loading && (
          <>
            {/* ── Totais ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Custo Total",      value: BRL(calculada.custoTotalGeral),   sub: `${calculada.pesoTotalGeral.toFixed(2)} kg`,     color: "text-slate-300", bg: "bg-white/5" },
                { label: "Meu Lance Total",  value: BRL(totais.totalLance),           sub: `${calculada.lotesCalculados.length} lote(s)`,   color: "text-blue-300",  bg: "bg-blue-500/10" },
                { label: "Lucro Estimado",   value: BRL(totais.totalLucro),           sub: totais.totalLucro >= 0 ? "Positivo" : "Prejuízo", color: totais.totalLucro >= 0 ? "text-emerald-400" : "text-red-400", bg: totais.totalLucro >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
                { label: "Ref. Total",       value: BRL(calculada.valorReferencialGeral), sub: `Margem média ${calculada.margemMediaGeral.toFixed(1)}%`, color: "text-amber-300", bg: "bg-amber-500/10" },
              ].map((m) => (
                <Card key={m.label} className={`${m.bg} border-white/10`}>
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-white/40 uppercase">{m.label}</p>
                    <p className={`text-xl font-black ${m.color} mt-1`}>{m.value}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{m.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ── Lotes ───────────────────────────────────────────────── */}
            <div className="space-y-3">
              {calculada.lotesCalculados.map((lote) => {
                const lance = lances[lote.loteId];
                if (!lance) return null;
                const ind    = calcTempoReal(lote, lance);
                const aberto = lotesAbertos[lote.loteId];

                return (
                  <Card key={lote.loteId} className={`border transition-all duration-150 ${
                    ind.alertaPerder  ? "border-red-500/60 bg-red-950/30"
                    : ind.abaixoMinimo ? "border-amber-500/50 bg-amber-950/20"
                    : lote.ganhouLote === true  ? "border-emerald-500/40 bg-emerald-950/20"
                    : lote.ganhouLote === false ? "border-white/5 bg-slate-900/40"
                    : "border-white/10 bg-white/5"
                  }`}>
                    {/* Header do lote */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer select-none"
                      onClick={() => setLotesAbertos((p) => ({ ...p, [lote.loteId]: !aberto }))}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-white/15 text-white font-black text-[10px] px-2">LOTE {lote.numero}</Badge>
                        <span className="text-white font-bold text-sm">{lote.descricao}</span>

                        {ind.alertaPerder && (
                          <Badge className="bg-red-500 text-white text-[10px] font-black animate-pulse flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> LANCE MAIOR QUE CONCORRENTE
                          </Badge>
                        )}
                        {ind.abaixoMinimo && !ind.alertaPerder && (
                          <Badge className="bg-amber-500 text-black text-[10px] font-black flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> ABAIXO DO MÍNIMO
                          </Badge>
                        )}
                        {ind.prejuizo && <Badge className="bg-red-800 text-red-200 text-[10px] font-black">PREJUÍZO</Badge>}
                        {lote.ganhouLote === true  && <Badge className="bg-emerald-500 text-white text-[10px] font-black flex items-center gap-1"><Trophy className="h-3 w-3" /> GANHOU</Badge>}
                        {lote.ganhouLote === false && <Badge className="bg-slate-600 text-slate-300 text-[10px] font-black">PERDEU</Badge>}
                      </div>

                      <div className="flex items-center gap-4 ml-2">
                        {ind.lucro !== null && (
                          <div className="text-right">
                            <p className="text-[10px] text-white/30 uppercase">Lucro</p>
                            <p className={`text-sm font-black ${ind.lucro >= 0 ? "text-emerald-400" : "text-red-400"}`}>{BRL(ind.lucro)}</p>
                          </div>
                        )}
                        {aberto ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
                      </div>
                    </div>

                    {aberto && (
                      <CardContent className="px-4 pb-4 pt-0 space-y-4">
                        {/* Grid de lances */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Custo */}
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Custo do Lote</p>
                            <p className="text-2xl font-black text-slate-200">{BRL(lote.custoTotalLote)}</p>
                            <p className="text-[10px] text-white/30 mt-1">Peso: {lote.pesoTotalLote.toFixed(2)} kg</p>
                            <p className="text-[10px] text-white/30">Margem média: {lote.margemMediaLote.toFixed(1)}%</p>
                          </div>

                          {/* Meu lance */}
                          <div className={`rounded-xl p-4 border-2 transition-all ${
                            ind.prejuizo ? "border-red-500 bg-red-950/40"
                            : ind.abaixoMinimo ? "border-amber-500 bg-amber-950/30"
                            : "border-blue-500/60 bg-blue-950/20"
                          }`}>
                            <p className="text-[10px] font-bold text-white/60 uppercase mb-2 flex items-center gap-1">
                              <Target className="h-3 w-3" /> Meu Lance
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-white/30 text-sm">R$</span>
                              <input
                                type="number" min={0} step={0.01}
                                value={lance.meuLance}
                                onChange={(e) => handleLanceChange(lote.loteId, "meuLance", e.target.value)}
                                className="flex-1 bg-white/10 border border-white/20 rounded-lg text-white text-2xl font-black h-12 text-center focus:outline-none focus:border-blue-400 transition-colors"
                                placeholder="0,00"
                                disabled={jaFinalizada}
                              />
                            </div>
                            {ind.margemReal !== null && (
                              <p className={`text-xs font-bold mt-2 ${ind.margemReal < 0 ? "text-red-400" : "text-emerald-400"}`}>
                                Margem real: {ind.margemReal.toFixed(2)}%
                              </p>
                            )}
                            <div className="mt-1 h-4">
                              {lance.saving && <p className="text-[10px] text-white/30 flex items-center gap-1"><RefreshCw className="h-2.5 w-2.5 animate-spin" /> Salvando...</p>}
                              {lance.error  && <p className="text-[10px] text-red-400 flex items-center gap-1"><XCircle className="h-2.5 w-2.5" /> {lance.error}</p>}
                              {lance.savedAt && !lance.saving && !lance.error && (
                                <p className="text-[10px] text-emerald-400/50 flex items-center gap-1">
                                  <CheckCircle className="h-2.5 w-2.5" /> Salvo {lance.savedAt.toLocaleTimeString("pt-BR")}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Concorrente */}
                          <div className={`rounded-xl p-4 border-2 transition-all ${
                            ind.alertaPerder ? "border-red-500 bg-red-950/30" : "border-white/10 bg-white/5"
                          }`}>
                            <p className="text-[10px] font-bold text-white/60 uppercase mb-2 flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Lance Concorrente
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-white/30 text-sm">R$</span>
                              <input
                                type="number" min={0} step={0.01}
                                value={lance.lanceConcorrente}
                                onChange={(e) => handleLanceChange(lote.loteId, "lanceConcorrente", e.target.value)}
                                className="flex-1 bg-white/10 border border-white/20 rounded-lg text-white text-2xl font-black h-12 text-center focus:outline-none focus:border-red-400 transition-colors"
                                placeholder="0,00"
                                disabled={jaFinalizada}
                              />
                            </div>
                            {ind.diferenca !== null && (
                              <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${ind.alertaPerder ? "text-red-400" : "text-emerald-400"}`}>
                                {ind.alertaPerder
                                  ? <><TrendingUp className="h-3 w-3" /> {BRL(Math.abs(ind.diferenca))} acima do concorrente</>
                                  : <><TrendingDown className="h-3 w-3" /> {BRL(Math.abs(ind.diferenca))} abaixo do concorrente</>
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Lance ideal */}
                        <div className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                          <Target className="h-5 w-5 text-amber-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-amber-300/60 uppercase">Lance Ideal Sugerido</p>
                            <p className="text-xl font-black text-amber-300">{BRL(lote.lanceIdealLote)}</p>
                            <p className="text-[10px] text-amber-200/40">
                              custo {BRL(lote.custoTotalLote)} + {calculada.licitacao.margemMinimaPercent}% margem
                            </p>
                          </div>
                          {!jaFinalizada && (
                            <Button
                              size="sm" variant="outline"
                              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20 text-xs font-bold flex-shrink-0"
                              onClick={() => handleLanceChange(lote.loteId, "meuLance", lote.lanceIdealLote.toFixed(2))}
                            >
                              Usar ideal
                            </Button>
                          )}
                        </div>

                        {/* Tabela de itens */}
                        <div className="rounded-xl overflow-hidden border border-white/10">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-white/10 bg-white/5">
                                {["Produto", "Qtd", "Custo Unit.", "Custo Total", "Lance Ideal Un", "Ref. Edital"].map((h, i) => (
                                  <TableHead key={h} className={`text-[9px] font-black uppercase text-white/30 ${i > 1 ? "text-right" : i === 1 ? "text-center w-14" : ""}`}>{h}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {lote.itensCalculados.map((item) => (
                                <TableRow key={item.itemId} className="border-white/5 hover:bg-white/5">
                                  <TableCell className="py-2 text-xs font-bold text-white/70">
                                    {item.nomeProduto}
                                    <p className="text-[10px] font-normal text-white/30">{item.pesoPorUnidade.toFixed(3)} kg/un</p>
                                  </TableCell>
                                  <TableCell className="py-2 text-center text-xs text-white/50">{item.quantidade}</TableCell>
                                  <TableCell className="py-2 text-right text-xs font-mono text-white/60">{BRL(item.custoUnitarioFinal)}</TableCell>
                                  <TableCell className="py-2 text-right text-xs font-mono font-bold text-white/70">{BRL(item.custoFinalTotal)}</TableCell>
                                  <TableCell className="py-2 text-right text-xs font-mono text-amber-300/70">{BRL(item.lanceIdealUnitario)}</TableCell>
                                  <TableCell className="py-2 text-right text-xs font-mono text-blue-300/70">{BRL(item.precoReferencia)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Resultado do lote */}
                        {!jaFinalizada && (
                          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                            <span className="text-[10px] text-white/30 uppercase font-bold mr-1">Resultado:</span>
                            <Button
                              size="sm"
                              className={`h-7 text-xs font-bold ${lote.ganhouLote === true ? "bg-emerald-600 text-white" : "bg-white/5 text-white/50 hover:bg-emerald-600 hover:text-white border border-white/10"}`}
                              onClick={() => marcarGanhouLote(lote.loteId, true)}
                            >
                              <Trophy className="h-3 w-3 mr-1" /> Ganhei
                            </Button>
                            <Button
                              size="sm"
                              className={`h-7 text-xs font-bold ${lote.ganhouLote === false ? "bg-slate-600 text-slate-300" : "bg-white/5 text-white/50 hover:bg-slate-700 hover:text-white border border-white/10"}`}
                              onClick={() => marcarGanhouLote(lote.loteId, false)}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Perdi
                            </Button>
                            {!autoSave && (
                              <Button size="sm" variant="outline"
                                className="ml-auto h-7 text-xs font-bold border-blue-500/50 text-blue-400 hover:bg-blue-950"
                                disabled={lance.saving}
                                onClick={() => salvarLance(lote.loteId)}
                              >
                                <Save className="h-3 w-3 mr-1" />{lance.saving ? "Salvando..." : "Salvar"}
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Modal Finalizar ───────────────────────────────────────────────── */}
      <Dialog open={showFinalizar} onOpenChange={setShowFinalizar}>
        <DialogContent className="bg-slate-900 border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase flex items-center gap-2">
              <Flag className="h-4 w-4 text-emerald-400" /> Finalizar Licitação
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase mb-2">Resultado Final</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Ganhamos", icon: <Trophy className="h-4 w-4 mx-auto mb-1" />, value: true,  activeClass: "border-emerald-500 bg-emerald-600 text-white" },
                  { label: "Perdemos", icon: <XCircle className="h-4 w-4 mx-auto mb-1" />, value: false, activeClass: "border-red-500 bg-red-800 text-white" },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setResultGanhou(opt.value)}
                    className={`py-3 rounded-xl border-2 font-black text-sm transition-all ${
                      resultGanhou === opt.value ? opt.activeClass : "border-white/10 text-white/40 hover:border-white/30"
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {resultGanhou === true && (
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase mb-1 block">Valor Contratado (R$)</label>
                <input
                  type="number" min={0} step={0.01}
                  value={valorContratado}
                  onChange={(e) => setValorContratado(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-white/10 border border-white/20 rounded-lg text-white text-lg font-bold h-11 px-3 focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-white/50 uppercase mb-1 block">Observações (opcional)</label>
              <textarea
                value={obsFinalizacao}
                onChange={(e) => setObsFinalizacao(e.target.value)}
                rows={2}
                placeholder="Notas sobre o resultado..."
                className="w-full bg-white/10 border border-white/20 rounded-lg text-white text-sm p-3 focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 border-white/20 text-white/50 hover:bg-white/10" onClick={() => setShowFinalizar(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                disabled={resultGanhou === null || finalizando}
                onClick={handleFinalizar}
              >
                {finalizando
                  ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
                  : <><Flag className="h-4 w-4 mr-2" /> Confirmar</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}