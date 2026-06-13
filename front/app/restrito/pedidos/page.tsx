'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  Search, CheckCircle, Printer, XCircle,
  Filter, MoreHorizontal, RefreshCcw, Download,
  Edit,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/api";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import HeaderEnterprise from "@/components/header";
import { getToken } from "@/lib/auth";

interface VendaItem {
  id: string;
  produtoId: string;
  produto?: {
    id: string;
    codigo: string;
    nome: string;
    descricao?: string;
    precoVenda: number;
    unidadeMedida: string;
  };
  quantidade: number;
  valorUnitario: number;
  valorDesconto: number;
  valorSubtotal: number;
}

interface Venda {
  id: string;
  numeroPedido: number;
  clienteId: string;
  vendedorId: string;
  cliente?: {
    id: string;
    nomeRazaoSocial: string;
    documento: string;
  };
  vendedor?: {
    id: string;
    nome: string;
  };
  statusVenda: string;
  status: string;
  valorTotal: number;
  valorProdutos: number;
  numeroNf?: string;
  createdAt: string;
  itens: VendaItem[];
}

interface VendasResponse {
  data: Venda[];
  total: number;
}

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  precoVenda: number;
  unidadeMedida: string;
  estoque?: Array<{
    quantidade: number;
    quantidadeReservada: number;
  }>;
}

export default function GerenciamentoVendas() {
  const token = getToken();
  const router = useRouter();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  useEffect(() => {
    carregarVendas();
  }, []);

  const carregarVendas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/vendas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      
      const responseData: VendasResponse = await res.json();
      
      // Acessar a propriedade 'data' que contém o array de vendas
      const vendasArray = Array.isArray(responseData) ? responseData : (responseData.data || []);
      
      setVendas(vendasArray);
    } catch (e) {
      console.error("Erro ao carregar vendas", e);
    } finally {
      setLoading(false);
    }
  };
  const handleAprovar = async (id: string) => {
    if (!confirm("Deseja aprovar esta venda?")) return;
    try {
      const res = await fetch(`${API_URL}/vendas/${id}/aprovar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (res.ok) {
        carregarVendas();
      } else {
        alert("Erro ao aprovar venda");
      }
    } catch (e) { 
      console.error("Erro ao aprovar:", e);
      alert("Erro ao aprovar"); 
    }
  };

  const handleCancelarVenda = async (id: string) => {
    if (!confirm("Deseja cancelar esta venda?")) return;
    try {
      const res = await fetch(`${API_URL}/vendas/${id}/cancelar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ motivo: "Cancelamento manual" })
      });
      if (res.ok) {
        carregarVendas();
      } else {
        alert("Erro ao cancelar venda");
      }
    } catch (e) { 
      console.error("Erro ao cancelar:", e);
      alert("Erro ao Cancelar"); 
    }
  };

  const handleImprimir = (id: string) => {
    window.open(`${API_URL}/vendas/documentos/${id}/comprovante`, '_blank');
  };

  // Garantir que vendas é um array antes de filtrar
  const vendasArray = Array.isArray(vendas) ? vendas : [];
  
  const vendasFiltradas = vendasArray.filter(v =>
    v.cliente?.nomeRazaoSocial?.toLowerCase().includes(filtro.toLowerCase()) ||
    v.cliente?.documento?.includes(filtro) ||
    v.numeroPedido?.toString().includes(filtro)
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'ORCAMENTO': 'bg-blue-100 text-blue-700 border-blue-200',
      'APROVADO': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'CANCELADO': 'bg-rose-100 text-rose-700 border-rose-200',
      'FATURADO': 'bg-amber-100 text-amber-700 border-amber-200',
      'EM_SEPARACAO': 'bg-purple-100 text-purple-700 border-purple-200',
      'ENVIADO': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'ENTREGUE': 'bg-green-100 text-green-700 border-green-200'
    };
    return (
      <Badge variant="outline" className={`${styles[status] || 'bg-slate-100 text-slate-700'} font-black text-[10px] uppercase`}>
        {status}
      </Badge>
    );
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataString;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      <HeaderEnterprise />

      <div className="bg-white border-b border-slate-300 sticky top-16 z-30 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-black text-slate-700 uppercase tracking-tighter">Gerenciamento de Vendas</h1>
          <div className="h-6 w-[1px] bg-slate-200 mx-2" />
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Localizar cliente, documento ou pedido..."
              className="h-8 w-80 text-xs pl-8 bg-slate-50 border-slate-300 rounded-none focus-visible:ring-slate-400"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carregarVendas} className="h-8 border-slate-300 text-slate-600 font-bold text-[10px] uppercase">
            <RefreshCcw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Button size="sm" className="h-8 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase rounded-none">
            <Filter className="h-3 w-3 mr-2" /> Filtros Avançados
          </Button>
        </div>
      </div>

      <main className="p-4 max-w-[1800px] mx-auto">
        <Card className="rounded-none border-slate-300 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[180px] text-[10px] font-black uppercase">Data/Hora</TableHead>
                    <TableHead className="min-w-[250px] text-[10px] font-black uppercase">Cliente</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Vendedor</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right">Valor Total</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">NF-e</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                          <span>Carregando vendas...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : vendasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-slate-400">
                        Nenhuma venda encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendasFiltradas.map((venda) => (
                      <TableRow key={venda.id} className="hover:bg-slate-50 border-b border-slate-200 group">
                        <TableCell className="text-[11px] font-mono text-slate-500">
                          {formatarData(venda.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-700 uppercase">
                              {venda.cliente?.nomeRazaoSocial || 'Cliente não identificado'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {venda.cliente?.documento || 'Sem documento'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(venda.statusVenda)}</TableCell>
                        <TableCell className="text-[11px] font-bold text-slate-600 uppercase">
                          {venda.vendedor?.nome || 'Não atribuído'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-[11px] font-black text-slate-800">
                            {formatarMoeda(venda.valorTotal)}
                          </span>
                          <div className="text-[9px] text-slate-500">
                            Pedido #{venda.numeroPedido} • {venda.itens?.length || 0} itens
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {venda.numeroNf ? (
                            <Badge variant="outline" className="text-[9px] font-mono bg-slate-50 border-slate-300">
                              NF: {venda.numeroNf}
                            </Badge>
                          ) : (
                            <span className="text-[9px] text-slate-300 uppercase font-bold">Não emitida</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-none border-slate-300">
                              <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400">
                                Ações
                              </DropdownMenuLabel>
                              
                              <DropdownMenuItem onClick={() => handleImprimir(venda.id)} className="text-xs font-bold cursor-pointer">
                                <Printer className="h-3.5 w-3.5 mr-2" /> Imprimir Comprovante
                              </DropdownMenuItem>
                              
                              {venda.statusVenda === 'ORCAMENTO' && (
                                <>
                                  <DropdownMenuItem onClick={() => router.push(`/restrito/pedidos/${venda.id}`)} className="text-xs font-bold text-blue-600 cursor-pointer">
                                    <Edit className="h-3.5 w-3.5 mr-2" /> Editar Itens
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleAprovar(venda.id)} className="text-xs font-bold text-emerald-600 cursor-pointer">
                                    <CheckCircle className="h-3.5 w-3.5 mr-2" /> Aprovar Venda
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {venda.statusVenda !== 'CANCELADO' && venda.statusVenda !== 'ENTREGUE' && (
                                <DropdownMenuItem onClick={() => handleCancelarVenda(venda.id)} className="text-xs font-bold text-rose-600 cursor-pointer">
                                  <XCircle className="h-3.5 w-3.5 mr-2" /> Cancelar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 bg-slate-800 p-3 flex justify-between items-center text-white">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase">Total de Registros</span>
              <span className="text-sm font-black">{vendasFiltradas.length}</span>
            </div>
            <div className="flex flex-col border-l border-slate-600 pl-6">
              <span className="text-[9px] font-black text-slate-400 uppercase">Soma dos Pedidos</span>
              <span className="text-sm font-black">
                {vendasFiltradas.reduce((acc, v) => acc + v.valorTotal, 0).toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          </div>
          <Button variant="outline" className="h-8 bg-transparent border-slate-600 text-white text-[10px] font-bold uppercase hover:bg-slate-700">
            <Download className="h-3 w-3 mr-2" /> Exportar CSV
          </Button>
        </div>
      </main>
    </div>
  );
}