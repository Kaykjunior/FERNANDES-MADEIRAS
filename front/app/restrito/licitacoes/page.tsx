"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import { Input }  from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";
import HeaderEnterprise from "@/components/header";
import {
  Plus, Search, Trophy, TrendingUp, DollarSign, Target,
  Calendar, Edit, Trash2, Zap, CheckCircle, XCircle,
  FileText, BarChart2, ChevronRight, Clock,
} from "lucide-react";
import {
  DashboardData, LicitacaoRaw, BRL, STATUS_LABELS, STATUS_COLORS,
  StatusLicitacao,
} from "./licitacoes.types";

// ─────────────────────────────────────────────────────────────────────────────

const COLORS_PIE = ["#10b981", "#ef4444", "#64748b"];

const MONTHS_PT: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

const fmtMes = (key: string) => {
  const [, m] = key.split("-");
  return MONTHS_PT[m] ?? key;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardLicitacoesPage() {
  const router = useRouter();

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusLicitacao | "TODOS">("TODOS");

  // ── Carrega dados do dashboard ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = getToken();
        const res   = await fetch(`${API_URL}/licitacoes/_/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const licitacoesFiltradas = useMemo(() => {
    if (!data) return [];
    return data.licitacoes.filter((l) => {
      const matchSearch =
        !search ||
        l.nome.toLowerCase().includes(search.toLowerCase()) ||
        (l.numeroEdital ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (l.orgao ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filtroStatus === "TODOS" || l.status === filtroStatus;
      return matchSearch && matchStatus;
    });
  }, [data, search, filtroStatus]);

  const pieData = useMemo(() => {
    if (!data) return [];
    const { ganhas, perdidas, total } = data.resumo;
    const pendentes = total - ganhas - perdidas;
    return [
      { name: "Ganhas",   value: ganhas },
      { name: "Perdidas", value: perdidas },
      { name: "Pendentes", value: pendentes },
    ].filter((d) => d.value > 0);
  }, [data]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta licitação?")) return;
    const token = getToken();
    await fetch(`${API_URL}/licitacoes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setData((prev) =>
      prev
        ? {
            ...prev,
            licitacoes: prev.licitacoes.filter((l) => l.id !== id),
            resumo: { ...prev.resumo, total: prev.resumo.total - 1 },
          }
        : prev,
    );
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Carregando dashboard...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <HeaderEnterprise />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10 px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart2 className="h-5 w-5 text-blue-600" />
            <h1 className="text-base font-black text-slate-800 uppercase tracking-tight">
              Licitações
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm" variant="outline"
              className="h-8 text-xs font-bold uppercase border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => router.push("/licitacoes/pregao")}
            >
              <Zap className="h-3 w-3 mr-1" /> Modo Pregão
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs font-bold uppercase bg-blue-700 hover:bg-blue-800 text-white"
              onClick={() => router.push("/licitacoes/cadastro")}
            >
              <Plus className="h-3 w-3 mr-1" /> Nova Licitação
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

        {/* ── Cards de métricas ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              label: "Total",
              value: data?.resumo.total ?? 0,
              sub: "licitações",
              icon: <FileText className="h-4 w-4" />,
              color: "text-slate-700",
              bg: "bg-white",
            },
            {
              label: "Ganhas",
              value: data?.resumo.ganhas ?? 0,
              sub: "contratos fechados",
              icon: <Trophy className="h-4 w-4" />,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Taxa de Sucesso",
              value: `${(data?.resumo.taxaSucesso ?? 0).toFixed(1)}%`,
              sub: "win rate",
              icon: <Target className="h-4 w-4" />,
              color: "text-blue-700",
              bg: "bg-blue-50",
            },
            {
              label: "Valor Ganho",
              value: BRL(data?.resumo.valorGanho ?? 0),
              sub: "contratos assinados",
              icon: <DollarSign className="h-4 w-4" />,
              color: "text-emerald-700",
              bg: "bg-emerald-50",
            },
            {
              label: "Perdidas",
              value: data?.resumo.perdidas ?? 0,
              sub: "sem contrato",
              icon: <XCircle className="h-4 w-4" />,
              color: "text-red-600",
              bg: "bg-red-50",
            },
          ].map((m) => (
            <Card key={m.label} className={`${m.bg} border-slate-200 shadow-sm`}>
              <CardContent className="p-4">
                <div className={`${m.color} mb-2`}>{m.icon}</div>
                <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{m.label}</p>
                <p className="text-[10px] text-slate-400">{m.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Gráficos ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Evolução de ganhos */}
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="py-3 border-b bg-slate-50">
              <CardTitle className="text-xs font-black uppercase text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" /> Evolução de Ganhos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {(data?.evolucaoGanhos ?? []).length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-300 text-sm">
                  Nenhum ganho registrado ainda
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(data?.evolucaoGanhos ?? []).map((d) => ({ mes: fmtMes(d.mes), valor: d.valor }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pizza ganho vs perdido */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-3 border-b bg-slate-50">
              <CardTitle className="text-xs font-black uppercase text-slate-600 flex items-center gap-2">
                <BarChart2 className="h-3.5 w-3.5" /> Distribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {pieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-300 text-sm">
                  Sem dados
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData} cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      paddingAngle={4} dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Tabela de licitações ──────────────────────────────────────── */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-black uppercase text-slate-700">
                Todas as Licitações
              </span>
              <Badge variant="outline" className="text-[10px] bg-white">
                {licitacoesFiltradas.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* Filtro de status */}
              <div className="flex gap-1">
                {(["TODOS", "RASCUNHO", "ABERTA", "EM_PREGAO", "FINALIZADA"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFiltroStatus(s)}
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm border transition-all ${
                      filtroStatus === s
                        ? "bg-blue-700 text-white border-blue-700"
                        : "border-slate-200 text-slate-500 hover:border-blue-300"
                    }`}
                  >
                    {s === "TODOS" ? "Todos" : STATUS_LABELS[s as StatusLicitacao]}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Buscar..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-7 text-xs border-slate-200 w-40"
                />
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 h-9">
                <TableHead className="text-[9px] font-black uppercase text-slate-500 min-w-[220px]">Licitação</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-500">Órgão</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-500 text-center w-24">Status</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-500 text-center w-28">Encerramento</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-500 text-center w-24">Dias</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-500 text-center w-20">Resultado</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-500 text-right w-32">Valor</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {licitacoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-300 text-xs">
                    Nenhuma licitação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                licitacoesFiltradas.map((l) => {
                  const dias = l.diasRestantes;
                  const encerrou = dias < 0;
                  return (
                    <TableRow key={l.id} className="h-11 hover:bg-slate-50 border-b-slate-100 group">
                      <TableCell className="py-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[260px]">{l.nome}</p>
                          {l.numeroEdital && (
                            <p className="text-[10px] text-slate-400 font-mono">{l.numeroEdital}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-slate-500 max-w-[150px] truncate">
                        {l.orgao ?? "—"}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Badge
                          className={`text-[10px] font-bold px-2 border ${STATUS_COLORS[l.status]}`}
                        >
                          {STATUS_LABELS[l.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-center text-xs text-slate-500">
                        {new Date(l.dataEncerramento).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {l.status === "FINALIZADA" ? (
                          <span className="text-[10px] text-slate-400">Encerrada</span>
                        ) : encerrou ? (
                          <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">
                            Vencida
                          </Badge>
                        ) : dias <= 3 ? (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] flex items-center gap-1 justify-center">
                            <Clock className="h-2.5 w-2.5" /> {dias}d
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-500 font-bold">{dias}d</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {l.ganhou === true ? (
                          <div className="flex items-center justify-center gap-1">
                            <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-600">GANHOU</span>
                          </div>
                        ) : l.ganhou === false ? (
                          <span className="text-[10px] font-bold text-red-500">PERDEU</span>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs font-bold font-mono text-slate-800">
                        {l.valorContratado ? BRL(Number(l.valorContratado)) : "—"}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => router.push(`/licitacoes/cadastro?id=${l.id}`)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => router.push(`/licitacoes/pregao?id=${l.id}`)}
                          >
                            <Zap className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(l.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}