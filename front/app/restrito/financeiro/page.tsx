'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Download,
  Wallet,
  Calculator,
  AlertCircle,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Loader2
} from "lucide-react";
import HeaderEnterprise from "@/components/header";
import { API_URL } from "@/lib/api";
import { getToken } from '@/lib/auth';
import { format, isBefore, startOfDay, endOfDay, subDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para os dados
interface ContaReceber {
  id: string;
  clienteId: string;
  vendaId?: string;
  valorParcela: number;
  valorAberto: number;
  valorPago?: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: string;
  cliente?: {
    nomeRazaoSocial: string;
  };
  venda?: {
    numeroPedido?: string;
  };
}

interface Caixa {
  id: string;
  saldoAtual: number;
  ultimaAtualizacao: string;
}

interface ResumoFinanceiro {
  totalAReceber: number;
  vencido: number;
  aVencer7Dias: number;
  totalContas: number;
}

interface Movimentacao {
  id: string;
  descricao: string;
  tipo: 'RECEITA' | 'DESPESA' | 'COMISSÃO';
  valor: number;
  data: string;
  status: string;
  contaId?: string;
}

export default function GestaoFinanceiraSiderurgica() {
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalAReceber: 0,
    vencido: 0,
    aVencer7Dias: 0,
    totalContas: 0
  });

  const [comissoesDevidas, setComissoesDevidas] = useState(0);
  const [loadingComissoes, setLoadingComissoes] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  const token = getToken();

  // Função para carregar dados
  const fetchData = useCallback(async () => {
    if (!token) {
      setError('Token de autenticação não encontrado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Carregar contas a receber
      let url = `${API_URL}/contas-receber`;
      const params = new URLSearchParams();

      if (statusFilter !== 'TODOS') {
        params.append('status', statusFilter);
      }
      if (dataInicio) {
        params.append('dataInicio', dataInicio);
      }
      if (dataFim) {
        params.append('dataFim', dataFim);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const [contasRes, caixaRes, resumoRes] = await Promise.all([
        fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/caixa/PRINCIPAL`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/contas-receber/resumo`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!contasRes.ok) throw new Error('Erro ao buscar contas a receber');
      if (!caixaRes.ok && caixaRes.status !== 404) throw new Error('Erro ao buscar caixa');
      if (!resumoRes.ok) throw new Error('Erro ao buscar resumo financeiro');

      const contasData = await contasRes.json();
      const resumoData = await resumoRes.json();

      let caixaData = null;
      if (caixaRes.status !== 404) {
        caixaData = await caixaRes.json();
      }

      setContasReceber(contasData);
      setCaixa(caixaData);
      setResumo(resumoData);

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      setError('Erro ao carregar dados. Tente novamente mais tarde.');

      // Dados mockados para demonstração
      setResumo({
        totalAReceber: 54200,
        vencido: 4250,
        aVencer7Dias: 34500,
        totalContas: 12
      });
      setCaixa({
        id: 'PRINCIPAL',
        saldoAtual: 142508.32,
        ultimaAtualizacao: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, statusFilter, dataInicio, dataFim]);

  // Carregar dados ao montar
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Efeito inicial - atualize o useEffect existente
  useEffect(() => {
    carregarComissoesDevidas(); // Adicione esta linha
  }, []);

  // Função para liquidar conta
  const liquidarConta = async (contaId: string) => {
    if (!token) return;

    try {
      const valor = parseFloat(prompt('Digite o valor a receber:') || '0');
      if (valor <= 0) return;

      const response = await fetch(`${API_URL}/contas-receber/${contaId}/liquidar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valorPago: valor,
          dataPagamento: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Conta liquidada com sucesso!');
        fetchData(); // Recarregar dados
      } else {
        throw new Error('Erro ao liquidar conta');
      }
    } catch (error) {
      console.error('Erro ao liquidar conta:', error);
      alert('Erro ao liquidar conta. Tente novamente.');
    }
  };

  // Filtrar contas
  const filteredContas = contasReceber.filter(conta => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      conta.cliente?.nomeRazaoSocial?.toLowerCase().includes(searchLower) ||
      conta.venda?.numeroPedido?.toLowerCase().includes(searchLower) ||
      conta.id.toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  // Calcular total a pagar hoje
  const calcularTotalAPagarHoje = () => {
    const hoje = new Date();
    return contasReceber
      .filter(conta => {
        const vencimento = new Date(conta.dataVencimento);
        return format(vencimento, 'yyyy-MM-dd') === format(hoje, 'yyyy-MM-dd') &&
          conta.status === 'PENDENTE';
      })
      .reduce((total, conta) => total + conta.valorAberto, 0);
  };

  // Calcular comissões devidas (exemplo: 1.5% das vendas)
  // Função para calcular total de comissões devidas (status 'PREVISTA')
  const carregarComissoesDevidas = useCallback(async () => {
    try {
      setLoadingComissoes(true);
      const response = await fetch(`${API_URL}/comissoes?status=PREVISTA`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao carregar comissões');

      const data = await response.json();

      // Usando reduce para somar todas as comissões
      const total = data.reduce((acc: number, comissao: any) => {
        return acc + (comissao.valorComissao || 0);
      }, 0);

      setComissoesDevidas(total);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
      setComissoesDevidas(0);
    } finally {
      setLoadingComissoes(false);
    }
  }, []);

  // Gerar movimento recentes
  const gerarMovimentosRecentes = (): Movimentacao[] => {
    const hoje = new Date();
    return contasReceber.slice(0, 5).map(conta => ({
      id: conta.id,
      descricao: `Venda ${conta.venda?.numeroPedido || 'N/A'} - ${conta.cliente?.nomeRazaoSocial || 'Cliente'}`,
      tipo: 'RECEITA',
      valor: conta.valorParcela,
      data: conta.dataVencimento,
      status: conta.status,
      contaId: conta.id
    }));
  };

  // Formatar moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Formatar data
  const formatarData = (data: string) => {
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Status badge
  const getStatusBadge = (status: string, vencimento?: string) => {
    const hoje = new Date();
    const dataVencimento = vencimento ? new Date(vencimento) : null;

    if (status === 'PAGO') {
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">LIQUIDADO</Badge>;
    }

    if (status === 'CANCELADO') {
      return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">CANCELADO</Badge>;
    }

    if (dataVencimento && isBefore(dataVencimento, hoje)) {
      return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">ATRASADO</Badge>;
    }

    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">PENDENTE</Badge>;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-100 min-h-screen font-sans pb-10">
        <HeaderEnterprise />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Carregando dados financeiros...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen font-sans pb-10">
      <HeaderEnterprise />

      {/* HEADER FINANCEIRO */}
      <header className="bg-slate-900 text-white p-4 md:p-6 mb-4 md:mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">Tesouraria & Fluxo de Caixa</h1>
            <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-widest mt-1">
              Consolidação de Recebíveis, Comissões e Disponibilidade
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              className="flex-1 md:flex-none border-slate-700 text-white bg-slate-800 uppercase text-[10px] h-9"
              onClick={() => {
                // Exportar dados
                const dataStr = JSON.stringify(contasReceber, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                const exportFileDefaultName = `contas-receber-${format(new Date(), 'yyyy-MM-dd')}.json`;

                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar JSON
            </Button>
            <Button
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] h-9 px-6"
              onClick={fetchData}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6">
        {/* CARDS DE SUMÁRIO RÁPIDO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
            <CardContent className="p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase">Saldo em Conta</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">
                {caixa ? formatarMoeda(caixa.saldoAtual) : 'R$ 0,00'}
              </p>
              <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold mt-1">
                <Clock className="h-3 w-3" />
                {caixa ? `Atualizado: ${format(new Date(caixa.ultimaAtualizacao), 'dd/MM HH:mm')}` : 'Não disponível'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase">A Receber (7 dias)</p>
              <p className="text-2xl font-black text-emerald-600 tracking-tighter">
                {formatarMoeda(resumo.aVencer7Dias)}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                {resumo.totalContas} Título{resumo.totalContas !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase">A Pagar (Hoje)</p>
              <p className="text-2xl font-black text-rose-600 tracking-tighter">
                {formatarMoeda(calcularTotalAPagarHoje())}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                Despesas Operacionais
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-slate-800 text-white">
            <CardContent className="p-4">
              <p className="text-[10px] font-black text-blue-400 uppercase">Comissões Devidas</p>
              {loadingComissoes ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  <p className="text-xs text-slate-400">Calculando...</p>
                </div>
              ) : (
                <p className="text-2xl font-black tracking-tighter">
                  {formatarMoeda(comissoesDevidas)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FILTROS */}
        <Card className="mb-6 border-none shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Buscar</Label>
                <Input
                  placeholder="Cliente, Nº Pedido ou ID..."
                  className="h-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500">Status</Label>
                <select
                  className="h-9 px-3 rounded-md border border-slate-300 bg-white text-sm w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="TODOS">Todos</option>
                  <option value="PENDENTE">Pendentes</option>
                  <option value="ATRASADO">Atrasados</option>
                  <option value="PAGO">Pagos</option>
                  <option value="CANCELADO">Cancelados</option>
                </select>
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500">De</Label>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500">Até</Label>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                className="h-9"
                onClick={() => {
                  setStatusFilter('TODOS');
                  setDataInicio('');
                  setDataFim('');
                  setSearchTerm('');
                }}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          {/* EXTRATO DE MOVIMENTAÇÕES */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <Card className="shadow-sm border-none ring-1 ring-slate-200 overflow-hidden bg-white">
              <CardHeader className="py-3 px-4 border-b bg-slate-50/80 flex flex-row justify-between items-center">
                <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Contas a Receber
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {filteredContas.length} registros
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                {filteredContas.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500">Nenhuma conta encontrada</p>
                    <p className="text-sm text-slate-400 mt-1">Tente ajustar os filtros</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-100">
                      <TableRow>
                        <TableHead className="text-[9px] font-black uppercase">Vencimento</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Cliente / Descrição</TableHead>
                        <TableHead className="text-[9px] font-black uppercase">Valor (R$)</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-center">Status</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContas.map((conta) => (
                        <TableRow key={conta.id} className="hover:bg-slate-50 border-b">
                          <TableCell className="py-3">
                            <p className="text-[10px] font-bold text-slate-700">
                              {formatarData(conta.dataVencimento)}
                            </p>
                            <p className="text-[8px] text-slate-400 uppercase">
                              ID: {conta.id.substring(0, 8)}...
                            </p>
                          </TableCell>

                          <TableCell>
                            <p className="text-[10px] font-black text-slate-800">
                              {conta.cliente?.nomeRazaoSocial || 'Cliente não identificado'}
                            </p>
                            <p className="text-[9px] text-slate-500">
                              Venda: {conta.venda?.numeroPedido || 'N/A'}
                            </p>
                          </TableCell>

                          <TableCell>
                            <div>
                              <p className={`text-[11px] font-black ${conta.valorAberto > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                                {formatarMoeda(conta.valorAberto)}
                              </p>
                              {conta.valorPago && conta.valorPago > 0 && (
                                <p className="text-[9px] text-slate-500">
                                  Pago: {formatarMoeda(conta.valorPago)}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            {getStatusBadge(conta.status, conta.dataVencimento)}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              {conta.status === 'PENDENTE' || conta.status === 'ATRASADO' ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-emerald-600"
                                  title="Liquidar"
                                  onClick={() => liquidarConta(conta.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              ) : null}

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                title="Detalhes"
                                onClick={() => {
                                  // Aqui você pode implementar um modal com detalhes
                                  console.log('Detalhes da conta:', conta);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* ALERTAS DE INADIMPLÊNCIA */}
            {resumo.vencido > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 shadow-sm">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-rose-900 uppercase">Alerta de Inadimplência</p>
                  <p className="text-[11px] text-rose-700 mt-1 font-medium">
                    Existem <span className="font-black">{formatarMoeda(resumo.vencido)}</span> em títulos vencidos há mais de 5 dias.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[9px] h-7 border-rose-300 text-rose-700"
                      onClick={() => {
                        setStatusFilter('ATRASADO');
                        setDataInicio('');
                        setDataFim('');
                      }}
                    >
                      Ver Atrasados
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-[9px] h-7 p-0 text-rose-800 underline"
                    >
                      Gerar Relatório de Cobrança
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: ANALYTICS FINANCEIRO */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* RESUMO DETALHADO */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
              <CardHeader className="py-3 border-b bg-slate-50">
                <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-medium text-slate-600">Total a Receber</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatarMoeda(resumo.totalAReceber)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-medium text-rose-600">Vencidos</span>
                    <span className="text-sm font-bold text-rose-600">
                      {formatarMoeda(resumo.vencido)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-medium text-emerald-600">A Vencer (7 dias)</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatarMoeda(resumo.aVencer7Dias)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-[11px] font-bold text-slate-800">Total Contas</span>
                    <span className="text-sm font-black text-slate-900">
                      {resumo.totalContas}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CALCULADORA DE COMISSÕES */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
              <CardHeader className="py-3 border-b bg-blue-600 text-white">
                <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2">
                  <Calculator className="h-4 w-4" /> Fechamento de Comissões
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="p-3 bg-slate-50 rounded border border-dashed border-slate-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Vendas Mês</span>
                    <span className="text-sm font-black text-slate-800">R$ 580.400,00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Alíquota Média</span>
                    <span className="text-sm font-black text-blue-600">1.5%</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-slate-800 hover:bg-slate-900 text-[10px] font-black uppercase h-9"
                  onClick={() => {
                    // Implementar processamento de comissões
                    alert('Funcionalidade de processamento de comissões em desenvolvimento');
                  }}
                >
                  Processar Pagamentos
                </Button>
              </CardContent>
            </Card>

            {/* PROJEÇÃO MENSAL */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
              <CardHeader className="py-2 bg-slate-50 border-b text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Performance Mensal</span>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-around items-center mb-4">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Receitas</p>
                    <p className="text-lg font-black text-emerald-600">R$ 185k</p>
                  </div>
                  <div className="h-8 w-[1px] bg-slate-100" />
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Despesas</p>
                    <p className="text-lg font-black text-rose-600">R$ 92k</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: '67%' }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 text-center mt-2">
                  Margem: 50.3%
                </p>
              </CardContent>
            </Card>

            {/* ÚLTIMAS MOVIMENTAÇÕES */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
              <CardHeader className="py-3 border-b bg-slate-50">
                <CardTitle className="text-xs font-black text-slate-600 uppercase">
                  Últimas Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {gerarMovimentosRecentes().map((mov) => (
                  <div key={mov.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded">
                    <div>
                      <p className="text-[10px] font-medium text-slate-800 truncate max-w-[180px]">
                        {mov.descricao}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {formatarData(mov.data)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[11px] font-bold ${mov.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {mov.tipo === 'RECEITA' ? '+' : '-'} {formatarMoeda(mov.valor)}
                      </p>
                      {getStatusBadge(mov.status, mov.data)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}