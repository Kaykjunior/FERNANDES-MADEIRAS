'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Search,
  Tag,
  Layers,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Package,
} from "lucide-react";
import HeaderEnterprise from '@/components/header';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';

// --- TIPAGEM ---
interface Categoria {
  id: number;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  codigo_sku: string | null;
  categoria: Categoria | null;
  preco_venda_base: string;
  unidade_comercial: string;
  ativo: boolean;
}

interface TabelaPrecoItem {
  id: string;
  produtoId: string;
  preco: string | number;
  ativo: boolean;
  produto: Produto;
}

interface TabelaPreco {
  id: string;
  nome: string;
  tipo: string | null;
  descricao: string | null;
  ativo: boolean;
  padrao: boolean;
  itens?: TabelaPrecoItem[];
}

const TIPOS_TABELA = [
  { value: 'TRATADA', label: 'Madeira Tratada' },
  { value: 'IN_NATURA', label: 'In Natura' },
  { value: 'ESPECIAL', label: 'Especial' },
  { value: 'OUTRA', label: 'Outra' },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Componente de notificação simples
function Notification({ type, message, onClose }: {
  type: 'success' | 'error' | 'info',
  message: string,
  onClose: () => void
}) {
  const bgColor = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }[type];

  const textColor = {
    success: 'text-emerald-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  }[type];

  const Icon = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle
  }[type];

  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md border ${bgColor} shadow-lg max-w-sm`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${textColor}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function CadastroTabelaPreco() {
  const token = getToken();

  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [tabelaSelecionada, setTabelaSelecionada] = useState<TabelaPreco | null>(null);

  const [loadingTabelas, setLoadingTabelas] = useState(true);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  // Estado local dos itens (produtoId -> { preco, ativo, selecionado })
  const [precosLocais, setPrecosLocais] = useState<Record<string, { preco: string; ativo: boolean; selecionado: boolean }>>({});

  // Formulário de nova tabela
  const [novaTabela, setNovaTabela] = useState({ nome: '', tipo: 'TRATADA', descricao: '', padrao: false });
  const [criandoTabela, setCriandoTabela] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => setNotification({ type, message });

  // --- FETCHERS ---
  const fetchTabelas = async () => {
    try {
      setLoadingTabelas(true);
      const res = await fetch(`${API_URL}/tabelas-preco`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setTabelas(await res.json());
    } catch {
      showNotification('error', 'Erro ao carregar tabelas de preços');
    } finally {
      setLoadingTabelas(false);
    }
  };

  const fetchProdutos = async () => {
    try {
      setLoadingProdutos(true);
      const res = await fetch(`${API_URL}/produtos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setProdutos(await res.json());
    } catch {
      showNotification('error', 'Erro ao carregar produtos');
    } finally {
      setLoadingProdutos(false);
    }
  };

  const fetchDetalheTabela = async (id: string) => {
    try {
      setLoadingDetalhe(true);
      const res = await fetch(`${API_URL}/tabelas-preco/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data: TabelaPreco = await res.json();
      setTabelaSelecionada(data);

      // Monta o estado local de preços a partir dos itens existentes
      const novosPrecos: Record<string, { preco: string; ativo: boolean; selecionado: boolean }> = {};
      (data.itens || []).forEach((item) => {
        novosPrecos[item.produtoId] = {
          preco: String(item.preco),
          ativo: item.ativo,
          selecionado: true,
        };
      });
      setPrecosLocais(novosPrecos);
    } catch {
      showNotification('error', 'Erro ao carregar detalhes da tabela');
    } finally {
      setLoadingDetalhe(false);
    }
  };

  useEffect(() => {
    fetchTabelas();
    fetchProdutos();
  }, []);

  // --- AÇÕES ---
  const handleCriarTabela = async () => {
    if (!novaTabela.nome.trim()) {
      showNotification('error', 'Informe o nome da tabela de preços');
      return;
    }
    try {
      setCriandoTabela(true);
      const res = await fetch(`${API_URL}/tabelas-preco`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome: novaTabela.nome,
          tipo: novaTabela.tipo,
          descricao: novaTabela.descricao || undefined,
          padrao: novaTabela.padrao,
          ativo: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao criar tabela');
      }
      const criada: TabelaPreco = await res.json();
      showNotification('success', 'Tabela de preços criada com sucesso!');
      setNovaTabela({ nome: '', tipo: 'TRATADA', descricao: '', padrao: false });
      await fetchTabelas();
      setTabelaSelecionada(criada);
      setPrecosLocais({});
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao criar tabela');
    } finally {
      setCriandoTabela(false);
    }
  };

  const handleTogglePadrao = async (tabela: TabelaPreco) => {
    try {
      const res = await fetch(`${API_URL}/tabelas-preco/${tabela.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ padrao: !tabela.padrao }),
      });
      if (!res.ok) throw new Error();
      await fetchTabelas();
      showNotification('success', `Tabela "${tabela.nome}" definida como padrão.`);
    } catch {
      showNotification('error', 'Erro ao definir tabela padrão');
    }
  };

  const handleToggleAtivo = async (tabela: TabelaPreco) => {
    try {
      const res = await fetch(`${API_URL}/tabelas-preco/${tabela.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ativo: !tabela.ativo }),
      });
      if (!res.ok) throw new Error();
      await fetchTabelas();
    } catch {
      showNotification('error', 'Erro ao atualizar status da tabela');
    }
  };

  const handleExcluirTabela = async (tabela: TabelaPreco) => {
    if (!confirm(`Tem certeza que deseja excluir a tabela "${tabela.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`${API_URL}/tabelas-preco/${tabela.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      showNotification('success', 'Tabela de preços excluída.');
      if (tabelaSelecionada?.id === tabela.id) {
        setTabelaSelecionada(null);
        setPrecosLocais({});
      }
      await fetchTabelas();
    } catch {
      showNotification('error', 'Erro ao excluir tabela');
    }
  };

  const handlePrecoChange = (produtoId: string, value: string) => {
    setPrecosLocais((prev) => ({
      ...prev,
      [produtoId]: {
        preco: value,
        ativo: prev[produtoId]?.ativo ?? true,
        selecionado: prev[produtoId]?.selecionado ?? true,
      },
    }));
  };

  const handleToggleSelecionado = (produto: Produto) => {
    setPrecosLocais((prev) => {
      const atual = prev[produto.id];
      if (atual?.selecionado) {
        // Remove (deseleciona) o produto da tabela
        const { [produto.id]: _, ...resto } = prev;
        return resto;
      }
      return {
        ...prev,
        [produto.id]: {
          preco: atual?.preco || produto.preco_venda_base || '0',
          ativo: true,
          selecionado: true,
        },
      };
    });
  };

  const handleSalvarPrecos = async () => {
    if (!tabelaSelecionada) return;

    const itens = Object.entries(precosLocais)
      .filter(([, val]) => val.selecionado)
      .map(([produtoId, val]) => ({
        produtoId,
        preco: Number(String(val.preco).replace(',', '.')) || 0,
        ativo: val.ativo,
      }));

    if (itens.some((i) => i.preco <= 0)) {
      showNotification('error', 'Todos os produtos selecionados precisam de um preço maior que zero.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`${API_URL}/tabelas-preco/${tabelaSelecionada.id}/itens`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itens }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao salvar preços');
      }
      showNotification('success', 'Tabela de preços atualizada com sucesso!');
      await fetchDetalheTabela(tabelaSelecionada.id);
      await fetchTabelas();
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao salvar preços');
    } finally {
      setIsSaving(false);
    }
  };

  // --- FILTROS ---
  const produtosFiltrados = useMemo(() => {
    if (!searchTerm) return produtos;
    const termo = searchTerm.toLowerCase();
    return produtos.filter((p) =>
      p.nome.toLowerCase().includes(termo) ||
      (p.codigo_sku && p.codigo_sku.toLowerCase().includes(termo))
    );
  }, [produtos, searchTerm]);

  const totalSelecionados = Object.values(precosLocais).filter((v) => v.selecionado).length;

  return (
    <div className="bg-slate-100 min-h-screen font-sans pb-20">
      <HeaderEnterprise />

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" /> Tabelas de Preços
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Crie tabelas (Tratada, In Natura, Especial...) e defina o preço de cada produto em cada tabela
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-6">

        {/* SEÇÃO: NOVA TABELA */}
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" /> Nova Tabela de Preços
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1 md:col-span-1">
              <Label className="text-[10px] uppercase font-black text-slate-400">Nome *</Label>
              <Input
                placeholder="Ex: Tratada Rei Madeiras"
                className="h-10 font-bold"
                value={novaTabela.nome}
                onChange={(e) => setNovaTabela((prev) => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400">Tipo</Label>
              <select
                className="w-full p-2 bg-white border border-slate-200 rounded text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none h-10"
                value={novaTabela.tipo}
                onChange={(e) => setNovaTabela((prev) => ({ ...prev, tipo: e.target.value }))}
              >
                {TIPOS_TABELA.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label className="text-[10px] uppercase font-black text-slate-400">Descrição</Label>
              <Input
                placeholder="Opcional"
                className="h-10"
                value={novaTabela.descricao}
                onChange={(e) => setNovaTabela((prev) => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer h-10">
                <input
                  type="checkbox"
                  className="text-blue-600 rounded"
                  checked={novaTabela.padrao}
                  onChange={(e) => setNovaTabela((prev) => ({ ...prev, padrao: e.target.checked }))}
                />
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Padrão</span>
              </label>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs h-10 flex-1"
                onClick={handleCriarTabela}
                disabled={criandoTabela}
              >
                {criandoTabela ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-4">
          {/* LISTA DE TABELAS */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="border-none shadow-sm ring-1 ring-slate-200 h-full">
              <CardHeader className="bg-slate-50 border-b py-3">
                <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Tabelas Cadastradas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {loadingTabelas ? (
                  <div className="p-8 text-center text-xs text-slate-400 uppercase">Carregando...</div>
                ) : tabelas.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 uppercase">Nenhuma tabela cadastrada</div>
                ) : (
                  <div className="space-y-1.5">
                    {tabelas.map((tabela) => (
                      <div
                        key={tabela.id}
                        className={`p-3 rounded-md border cursor-pointer transition-all ${tabelaSelecionada?.id === tabela.id
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        onClick={() => fetchDetalheTabela(tabela.id)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-slate-800 truncate">{tabela.nome}</p>
                              {tabela.padrao && (
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                              )}
                            </div>
                            {tabela.tipo && (
                              <p className="text-[10px] font-mono text-slate-400">{tabela.tipo}</p>
                            )}
                          </div>
                          <Badge className={tabela.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                            {tabela.ativo ? 'ATIVA' : 'INATIVA'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
                          <button
                            className="text-[10px] font-bold uppercase text-amber-600 hover:text-amber-700"
                            onClick={(e) => { e.stopPropagation(); handleTogglePadrao(tabela); }}
                          >
                            {tabela.padrao ? 'Padrão' : 'Tornar Padrão'}
                          </button>
                          <button
                            className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-700"
                            onClick={(e) => { e.stopPropagation(); handleToggleAtivo(tabela); }}
                          >
                            {tabela.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            className="text-[10px] font-bold uppercase text-red-500 hover:text-red-700 ml-auto"
                            onClick={(e) => { e.stopPropagation(); handleExcluirTabela(tabela); }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* GESTÃO DE PRODUTOS DA TABELA SELECIONADA */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="border-none shadow-sm ring-1 ring-slate-200 h-full flex flex-col">
              <CardHeader className="bg-slate-50 border-b py-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {tabelaSelecionada ? `Produtos · ${tabelaSelecionada.nome}` : 'Selecione uma tabela'}
                </CardTitle>
                {tabelaSelecionada && (
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                    {totalSelecionados} produto(s) na tabela
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                {!tabelaSelecionada ? (
                  <div className="p-12 text-center text-slate-300">
                    <Layers className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold uppercase">Selecione uma tabela de preços ao lado</p>
                    <p className="text-[11px] mt-1">Depois marque os produtos e defina o preço de cada um nesta tabela</p>
                  </div>
                ) : loadingDetalhe || loadingProdutos ? (
                  <div className="p-12 text-center text-xs text-slate-400 uppercase">Carregando produtos...</div>
                ) : (
                  <>
                    <div className="p-3 border-b bg-white sticky top-0 z-10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Buscar produto por nome ou SKU..."
                          className="pl-9 h-9 text-xs"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <ScrollArea className="flex-1 max-h-[480px]">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                          <TableRow className="h-8 hover:bg-slate-50">
                            <TableHead className="w-[40px] text-[10px] font-black text-slate-500 uppercase text-center">Incl.</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase">Produto</TableHead>
                            <TableHead className="w-[90px] text-[10px] font-black text-slate-500 uppercase text-center">Un</TableHead>
                            <TableHead className="w-[120px] text-[10px] font-black text-slate-500 uppercase text-right">Preço Base</TableHead>
                            <TableHead className="w-[150px] text-[10px] font-black text-blue-700 uppercase text-right bg-blue-50/30">Preço na Tabela</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {produtosFiltrados.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center text-xs text-slate-400 uppercase">
                                Nenhum produto encontrado
                              </TableCell>
                            </TableRow>
                          ) : (
                            produtosFiltrados.map((produto) => {
                              const item = precosLocais[produto.id];
                              const selecionado = !!item?.selecionado;
                              return (
                                <TableRow key={produto.id} className={`h-10 border-b-slate-100 ${selecionado ? 'bg-blue-50/30' : ''}`}>
                                  <TableCell className="text-center">
                                    <input
                                      type="checkbox"
                                      className="text-blue-600 rounded h-4 w-4"
                                      checked={selecionado}
                                      onChange={() => handleToggleSelecionado(produto)}
                                    />
                                  </TableCell>
                                  <TableCell className="py-1">
                                    <div className="flex flex-col">
                                      <span className="text-[11px] font-bold text-slate-700">{produto.nome}</span>
                                      <span className="text-[9px] font-mono text-slate-400">{produto.codigo_sku || '---'}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-[10px] text-center font-medium text-slate-500">{produto.unidade_comercial}</TableCell>
                                  <TableCell className="text-[11px] text-right font-medium text-slate-500 font-mono">
                                    {formatNumber(parseFloat(produto.preco_venda_base) || 0)}
                                  </TableCell>
                                  <TableCell className="p-1 bg-blue-50/10">
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">R$</span>
                                      <Input
                                        type="text"
                                        disabled={!selecionado}
                                        placeholder="0,00"
                                        className="h-7 text-right text-xs font-bold pl-7 border-slate-200 focus:border-blue-500 disabled:bg-slate-50"
                                        value={item?.preco ?? ''}
                                        onChange={(e) => handlePrecoChange(produto.id, e.target.value)}
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    <div className="p-3 border-t bg-slate-50 flex justify-end">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs"
                        onClick={handleSalvarPrecos}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar Tabela de Preços
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}