"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { API_URL }   from "@/lib/api";
import { getToken }  from "@/lib/auth";
import HeaderEnterprise from "@/components/header";
import {
  Plus, Trash2, Save, Search, Package, X, ChevronDown, ChevronUp,
  Truck, DollarSign, AlertTriangle, CheckCircle, ArrowRight, Calculator,
  FileText, Building2, Calendar,
} from "lucide-react";
import {
  Produto, LoteFormState, ItemFormState, BRL, LicitacaoRaw,
} from "../licitacoes.types";

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários de cálculo (isolados para reutilização)
// ─────────────────────────────────────────────────────────────────────────────

/** Peso total de um item */
const pesoItem = (it: ItemFormState): number =>
  it.quantidade * Number(it.produto?.peso_unitario_kg ?? 0);

/** Peso total de todos os itens de todos os lotes */
const calcPesoTotal = (lotes: LoteFormState[]): number =>
  lotes.flatMap((l) => l.itens).reduce((s, it) => s + pesoItem(it), 0);

/** Custo base de um item sem rateio */
const custoBase = (it: ItemFormState): number =>
  it.quantidade * Number(it.produto?.preco_venda_base ?? 0);

interface ResultadoItem {
  ratioFrete: number;
  ratioCustoAdic: number;
  custoFinalTotal: number;
  custoUnitarioFinal: number;
  margemEstimada: number;
  lanceIdealUnit: number;
}

function calcItem(
  it: ItemFormState,
  pesoTotalGeral: number,
  freteTotal: number,
  custoAdicional: number,
  margemMinima: number,
): ResultadoItem {
  const peso   = pesoItem(it);
  const propor = pesoTotalGeral > 0 ? peso / pesoTotalGeral : 0;
  const ratioFrete    = propor * freteTotal;
  const ratioCustoAdic = propor * custoAdicional;
  const custoFinalTotal = custoBase(it) + ratioFrete + ratioCustoAdic;
  const custoUnitFin   = it.quantidade > 0 ? custoFinalTotal / it.quantidade : 0;
  const precoRef        = it.precoReferencia;
  const margemEst = precoRef > 0 ? ((precoRef - custoUnitFin) / precoRef) * 100 : 0;
  const lanceIdealUnit  = custoUnitFin * (1 + margemMinima / 100);
  return { ratioFrete, ratioCustoAdic, custoFinalTotal, custoUnitarioFinal: custoUnitFin, margemEstimada: margemEst, lanceIdealUnit };
}

// ─────────────────────────────────────────────────────────────────────────────

const newLote = (numero: number): LoteFormState => ({
  tempId: crypto.randomUUID(), numero, descricao: `Lote ${numero}`, itens: [],
});

const newItem = (prod?: Produto): ItemFormState => ({
  tempId: crypto.randomUUID(), produtoId: prod?.id ?? "", produto: prod ?? null,
  quantidade: 1, precoReferencia: Number(prod?.preco_venda_base ?? 0),
});

// ─────────────────────────────────────────────────────────────────────────────

export default function CadastroLicitacaoPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("id");

  // ── Formulário principal ─────────────────────────────────────────────────
  const [nome,        setNome]        = useState("");
  const [numeroEdital, setNumeroEdital] = useState("");
  const [orgao,       setOrgao]       = useState("");
  const [dataAbertura,    setDataAbertura]    = useState("");
  const [dataEncerramento, setDataEncerramento] = useState("");
  const [freteTotal,      setFreteTotal]      = useState(0);
  const [custoAdicional,  setCustoAdicional]  = useState(0);
  const [margemMinima,    setMargemMinima]    = useState(10);
  const [observacoes,     setObservacoes]     = useState("");

  // ── Lotes ────────────────────────────────────────────────────────────────
  const [lotes, setLotes]   = useState<LoteFormState[]>([newLote(1)]);
  const [loteAberto, setLoteAberto] = useState<string | null>(null);

  // ── Modal produto ────────────────────────────────────────────────────────
  const [produtoModal, setProdutoModal]   = useState<{ loteId: string } | null>(null);
  const [produtos,     setProdutos]       = useState<Produto[]>([]);
  const [loadingProds, setLoadingProds]   = useState(false);
  const [searchProd,   setSearchProd]     = useState("");

  // ── Estado geral ─────────────────────────────────────────────────────────
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(!!editId);
  const [showCalc, setShowCalc] = useState(false);

  // ── Carrega para edição ──────────────────────────────────────────────────
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/licitacoes/${editId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data: LicitacaoRaw = await res.json();
        setNome(data.nome ?? "");
        setNumeroEdital(data.numeroEdital ?? "");
        setOrgao(data.orgao ?? "");
        setDataAbertura(data.dataAbertura?.slice(0, 10) ?? "");
        setDataEncerramento(data.dataEncerramento?.slice(0, 10) ?? "");
        setFreteTotal(Number(data.freteTotal ?? 0));
        setCustoAdicional(Number(data.custoAdicional ?? 0));
        setMargemMinima(Number(data.margemMinimaPercent ?? 10));
        setObservacoes(data.observacoes ?? "");
        setLotes(
          data.lotes.map((l) => ({
            tempId: l.id,
            numero: l.numero,
            descricao: l.descricao ?? `Lote ${l.numero}`,
            itens: l.itens.map((i) => ({
              tempId: i.id,
              produtoId: i.produtoId,
              produto: i.produto ?? null,
              quantidade: Number(i.quantidade),
              precoReferencia: Number(i.precoReferencia),
            })),
          }))
        );
        if (data.lotes.length > 0) setLoteAberto(data.lotes[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  // ── Carrega produtos ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoadingProds(true);
        const token = getToken();
        const res   = await fetch(`${API_URL}/produtos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        setProdutos(await res.json());
      } finally {
        setLoadingProds(false);
      }
    })();
  }, []);

  // ── Cálculos em tempo real ────────────────────────────────────────────────
  const pesoTotalGeral = useMemo(() => calcPesoTotal(lotes), [lotes]);
  const custoTotalGeral = useMemo(
    () =>
      lotes.flatMap((l) => l.itens).reduce((s, it) => {
        const r = calcItem(it, pesoTotalGeral, freteTotal, custoAdicional, margemMinima);
        return s + r.custoFinalTotal;
      }, 0),
    [lotes, pesoTotalGeral, freteTotal, custoAdicional, margemMinima],
  );
  const valorRefTotal = useMemo(
    () =>
      lotes.flatMap((l) => l.itens).reduce(
        (s, it) => s + it.quantidade * it.precoReferencia, 0,
      ),
    [lotes],
  );
  const custoBaseTotalGeral = useMemo(
    () => lotes.flatMap((l) => l.itens).reduce((s, it) => s + custoBase(it), 0),
    [lotes],
  );

  // ── Lotes: helpers ───────────────────────────────────────────────────────
  const addLote = () => {
    const novo = newLote(lotes.length + 1);
    setLotes([...lotes, novo]);
    setLoteAberto(novo.tempId);
  };

  const removeLote = (id: string) => {
    setLotes((prev) => {
      const next = prev.filter((l) => l.tempId !== id).map((l, i) => ({
        ...l, numero: i + 1, descricao: l.descricao === `Lote ${l.numero}` ? `Lote ${i + 1}` : l.descricao,
      }));
      return next;
    });
  };

  const updateLoteDesc = (id: string, desc: string) =>
    setLotes((prev) => prev.map((l) => l.tempId === id ? { ...l, descricao: desc } : l));

  // ── Itens: helpers ───────────────────────────────────────────────────────
  const addItem = (loteId: string, produto: Produto) => {
    setLotes((prev) =>
      prev.map((l) =>
        l.tempId === loteId
          ? { ...l, itens: [...l.itens, newItem(produto)] }
          : l,
      ),
    );
    setProdutoModal(null);
    setSearchProd("");
  };

  const removeItem = (loteId: string, itemId: string) =>
    setLotes((prev) =>
      prev.map((l) =>
        l.tempId === loteId
          ? { ...l, itens: l.itens.filter((i) => i.tempId !== itemId) }
          : l,
      ),
    );

  const updateItem = (
    loteId: string,
    itemId: string,
    field: "quantidade" | "precoReferencia",
    value: number,
  ) =>
    setLotes((prev) =>
      prev.map((l) =>
        l.tempId === loteId
          ? {
              ...l,
              itens: l.itens.map((i) =>
                i.tempId === itemId ? { ...i, [field]: Math.max(0, value) } : i,
              ),
            }
          : l,
      ),
    );

  // ── Produtos filtrados no modal ──────────────────────────────────────────
  const produtosFiltrados = useMemo(() => {
    if (!searchProd) return produtos;
    const t = searchProd.toLowerCase();
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(t) ||
        (p.codigo_sku && p.codigo_sku.toLowerCase().includes(t)),
    );
  }, [produtos, searchProd]);

  // ── Salvar ───────────────────────────────────────────────────────────────
  const handleSalvar = async () => {
    if (!nome.trim()) { alert("Informe o nome da licitação."); return; }
    if (!dataAbertura || !dataEncerramento) { alert("Informe as datas."); return; }
    if (lotes.every((l) => l.itens.length === 0)) {
      alert("Adicione pelo menos um item em algum lote."); return;
    }

    try {
      setSaving(true);
      const token = getToken();
      const payload = {
        nome, numeroEdital, orgao, dataAbertura, dataEncerramento,
        freteTotal, custoAdicional, margemMinimaPercent: margemMinima, observacoes,
        lotes: lotes.map((l) => ({
          numero: l.numero, descricao: l.descricao,
          itens: l.itens.map((i) => ({
            produtoId:      i.produtoId,
            quantidade:     i.quantidade,
            precoReferencia: i.precoReferencia,
          })),
        })),
      };

      const method = editId ? "PUT" : "POST";
      const url    = editId ? `${API_URL}/licitacoes/${editId}` : `${API_URL}/licitacoes`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao salvar");
      }

      alert(editId ? "Licitação atualizada!" : "Licitação cadastrada!");
      router.push("/licitacoes/dashboard");
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Carregando licitação...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <HeaderEnterprise />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10 px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <h1 className="text-base font-black text-slate-800 uppercase tracking-tight">
              {editId ? "Editar Licitação" : "Nova Licitação"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              className="text-xs font-bold uppercase h-8"
              onClick={() => setShowCalc(!showCalc)}
            >
              <Calculator className="h-3 w-3 mr-1" />
              {showCalc ? "Ocultar" : "Ver"} Cálculos
            </Button>
            <Button
              size="sm" disabled={saving}
              onClick={handleSalvar}
              className="h-8 text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="h-3 w-3 mr-1" />
              {saving ? "Salvando..." : "Salvar Licitação"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">

        {/* ── Card de dados gerais ──────────────────────────────────────── */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="py-3 bg-slate-800 text-white rounded-t-lg">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" /> Dados da Licitação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                Nome / Identificação *
              </label>
              <Input
                value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Fornecimento de postes — Prefeitura de Curvelo"
                className="h-9 text-sm border-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                Número do Edital
              </label>
              <Input
                value={numeroEdital} onChange={(e) => setNumeroEdital(e.target.value)}
                placeholder="Ex: PE-001/2025"
                className="h-9 text-sm border-slate-200"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                Órgão Comprador
              </label>
              <Input
                value={orgao} onChange={(e) => setOrgao(e.target.value)}
                placeholder="Ex: Prefeitura Municipal de Curvelo"
                className="h-9 text-sm border-slate-200"
              />
            </div>
            <div />
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Data de Abertura *
              </label>
              <Input
                type="date" value={dataAbertura}
                onChange={(e) => setDataAbertura(e.target.value)}
                className="h-9 text-sm border-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Data de Encerramento *
              </label>
              <Input
                type="date" value={dataEncerramento}
                onChange={(e) => setDataEncerramento(e.target.value)}
                className="h-9 text-sm border-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                <Truck className="h-3 w-3" /> Frete Total (R$)
              </label>
              <Input
                type="number" min={0} value={freteTotal || ""}
                onChange={(e) => setFreteTotal(Number(e.target.value))}
                placeholder="0,00"
                className="h-9 text-sm border-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Custo Adicional (R$)
              </label>
              <Input
                type="number" min={0} value={custoAdicional || ""}
                onChange={(e) => setCustoAdicional(Number(e.target.value))}
                placeholder="0,00"
                className="h-9 text-sm border-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                Margem Mínima (%)
              </label>
              <Input
                type="number" min={0} max={100} value={margemMinima}
                onChange={(e) => setMargemMinima(Number(e.target.value))}
                className="h-9 text-sm border-slate-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Painel de cálculos ───────────────────────────────────────── */}
        {showCalc && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Peso Total Geral",   value: `${pesoTotalGeral.toFixed(2)} kg`, icon: "⚖️" },
              { label: "Custo Base (s/ rateio)", value: BRL(custoBaseTotalGeral), icon: "📦" },
              { label: "Custo Final (c/ rateio)", value: BRL(custoTotalGeral), icon: "💰" },
              { label: "Valor Referencial",  value: BRL(valorRefTotal), icon: "🎯" },
            ].map((m) => (
              <Card key={m.label} className="border-blue-100 bg-blue-50">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <div className="text-[10px] font-bold text-blue-600 uppercase">{m.label}</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{m.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Lotes ───────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-slate-700 flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-500" /> Lotes ({lotes.length})
            </h2>
            <Button size="sm" onClick={addLote}
              className="h-8 text-xs font-bold uppercase bg-blue-700 hover:bg-blue-800 text-white">
              <Plus className="h-3 w-3 mr-1" /> Adicionar Lote
            </Button>
          </div>

          {lotes.map((lote) => {
            const aberto = loteAberto === lote.tempId;
            const loteRateio = lote.itens.reduce((s, it) => {
              const r = calcItem(it, pesoTotalGeral, freteTotal, custoAdicional, margemMinima);
              return s + r.custoFinalTotal;
            }, 0);

            return (
              <Card key={lote.tempId} className="border-slate-200 shadow-sm overflow-hidden">
                {/* Header do lote */}
                <div
                  className="flex items-center justify-between p-3 bg-slate-50 border-b cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => setLoteAberto(aberto ? null : lote.tempId)}
                >
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-600 text-white text-[10px] font-black px-2 rounded-sm">
                      LOTE {lote.numero}
                    </Badge>
                    <Input
                      value={lote.descricao}
                      onChange={(e) => { e.stopPropagation(); updateLoteDesc(lote.tempId, e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 text-xs font-bold border-slate-200 w-48 bg-white"
                    />
                    <span className="text-[10px] text-slate-500">
                      {lote.itens.length} iten(s) · {BRL(loteRateio)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); removeLote(lote.tempId); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {aberto ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {aberto && (
                  <CardContent className="p-3">
                    {/* Botão adicionar produto */}
                    <Button
                      size="sm" variant="outline"
                      className="h-7 text-xs font-bold uppercase border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 mb-3"
                      onClick={() => setProdutoModal({ loteId: lote.tempId })}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Adicionar Produto
                    </Button>

                    {lote.itens.length === 0 ? (
                      <div className="text-center py-8 text-slate-300">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs font-bold uppercase">Nenhum produto neste lote</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-100 h-8">
                            <TableHead className="text-[9px] font-black uppercase text-slate-500 min-w-[200px]">Produto</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-slate-500 w-24 text-center">Qtd</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-slate-500 w-28 text-right">Preço Ref. (un)</TableHead>
                            {showCalc && <>
                              <TableHead className="text-[9px] font-black uppercase text-blue-600 w-24 text-right bg-blue-50/30">Custo c/ Rateio</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-emerald-600 w-24 text-right bg-emerald-50/30">Margem %</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-amber-600 w-28 text-right bg-amber-50/20">Lance Ideal (un)</TableHead>
                            </>}
                            <TableHead className="w-8" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lote.itens.map((item) => {
                            const calc = calcItem(item, pesoTotalGeral, freteTotal, custoAdicional, margemMinima);
                            const margemNeg = calc.margemEstimada < 0;
                            const margemBaixa = calc.margemEstimada < margemMinima && calc.margemEstimada >= 0;

                            return (
                              <TableRow key={item.tempId} className="h-10 hover:bg-slate-50">
                                <TableCell className="py-1">
                                  <div>
                                    <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{item.produto?.nome ?? "—"}</p>
                                    <p className="text-[10px] font-mono text-slate-400">
                                      {item.produto?.codigo_sku ?? "—"} · {item.produto?.peso_unitario_kg} kg/un
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="py-1 px-1">
                                  <Input
                                    type="number" min={0.001} step={0.001}
                                    value={item.quantidade || ""}
                                    onChange={(e) => updateItem(lote.tempId, item.tempId, "quantidade", Number(e.target.value))}
                                    className="h-7 text-center text-xs font-bold border-slate-200 w-20"
                                  />
                                </TableCell>
                                <TableCell className="py-1 px-1">
                                  <Input
                                    type="number" min={0} step={0.01}
                                    value={item.precoReferencia || ""}
                                    onChange={(e) => updateItem(lote.tempId, item.tempId, "precoReferencia", Number(e.target.value))}
                                    className="h-7 text-right text-xs font-bold border-slate-200 w-24"
                                  />
                                </TableCell>
                                {showCalc && <>
                                  <TableCell className="py-1 text-right">
                                    <span className="text-xs font-bold text-blue-700">{BRL(calc.custoFinalTotal)}</span>
                                    <p className="text-[9px] text-slate-400">{BRL(calc.custoUnitarioFinal)}/un</p>
                                  </TableCell>
                                  <TableCell className="py-1 text-right">
                                    <span className={`text-xs font-black ${margemNeg ? "text-red-600" : margemBaixa ? "text-amber-600" : "text-emerald-600"}`}>
                                      {calc.margemEstimada.toFixed(1)}%
                                    </span>
                                    {(margemNeg || margemBaixa) && <AlertTriangle className="h-3 w-3 text-amber-500 inline ml-1" />}
                                  </TableCell>
                                  <TableCell className="py-1 text-right">
                                    <span className="text-xs font-bold text-amber-700">{BRL(calc.lanceIdealUnit)}</span>
                                  </TableCell>
                                </>}
                                <TableCell className="py-1 text-center">
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => removeItem(lote.tempId, item.tempId)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Modal de busca de produto ──────────────────────────────────── */}
      <Dialog open={!!produtoModal} onOpenChange={() => { setProdutoModal(null); setSearchProd(""); }}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogHeader className="p-4 border-b bg-slate-50">
            <DialogTitle className="text-sm font-black uppercase text-slate-700">
              Selecionar Produto
            </DialogTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                className="pl-9 border-slate-200"
                value={searchProd}
                onChange={(e) => setSearchProd(e.target.value)}
                autoFocus
              />
              {searchProd && (
                <button onClick={() => setSearchProd("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="h-80 bg-white">
            {loadingProds ? (
              <div className="p-8 text-center text-xs text-slate-400">Carregando...</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow className="h-8">
                    <TableHead className="text-[9px] font-black uppercase text-slate-500">SKU</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-slate-500">Produto</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-slate-500 text-right">Peso (kg/un)</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-slate-500 text-right">Preço Base</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados.map((p) => (
                    <TableRow
                      key={p.id}
                      className="h-9 cursor-pointer hover:bg-blue-50 group"
                      onClick={() => produtoModal && addItem(produtoModal.loteId, p)}
                    >
                      <TableCell className="py-1 font-mono text-[10px] text-slate-500">{p.codigo_sku ?? "—"}</TableCell>
                      <TableCell className="py-1 text-xs font-bold text-slate-700">{p.nome}</TableCell>
                      <TableCell className="py-1 text-right text-xs font-mono text-slate-600">{Number(p.peso_unitario_kg).toFixed(3)}</TableCell>
                      <TableCell className="py-1 text-right text-xs font-bold text-slate-800">{BRL(Number(p.preco_venda_base))}</TableCell>
                      <TableCell className="py-1 text-center">
                        <Plus className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-600" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}