"use client"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_URL } from "@/lib/api";
import {
  ShoppingCart, Search, Truck, Plus, Send, Trash2, Package,
  Save, CreditCard, User, CheckCircle, AlertCircle, ChevronRight,
  ChevronLeft, X, Minus, ArrowRight
} from "lucide-react";
import HeaderEnterprise from "@/components/header";
import { Entidade } from "@/app/types/entidades.types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getToken, getUserId } from "@/lib/auth";

// --- TIPAGEM ---
interface Categoria { id: number; nome: string; }
interface FormaPagamento {
  id: number; nome: string; codigoSefaz: string | null;
  taxaAdm: number; diasRecebimento: number; ativo: boolean;
}
interface Produto {
  id: string; nome: string; codigo_sku: string | null;
  categoria: Categoria; preco_venda_base: string; unidade_comercial: string;
  estoque?: Array<{
    id: string; quantidade: number; quantidadeReservada: number;
    custoMedio: number; localizacao: string | null; createdAt: string; updatedAt: string;
  }>;
}
interface ItemVenda {
  tempId: string; produtoId: string; sku: string; nome: string;
  unidade: string; precoTabela: number; quantidade: number;
  descontoReais: number; totalLiquido: number;
}

// Hook para detectar mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// --- COMPONENTE MOBILE: STEPPER ---
function MobileVendas({
  products, entidades, formasPagamento, loadingFormas, loading,
  itensVenda, setItensVenda, clienteSelecionado, setClienteSelecionado,
  formaPagamentoSelecionada, setFormaPagamentoSelecionada,
  frete, setFrete, isSubmitting, handleFinalizarVenda, BRL,
  getEstoqueProduto
}: any) {
  const [step, setStep] = useState(0); // 0: cliente, 1: produtos, 2: pagamento, 3: resumo
  const [buscaCliente, setBuscaCliente] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const steps = ["Cliente", "Produtos", "Pagamento", "Resumo"];

  const clientesFiltrados = useMemo(() => {
    if (buscaCliente.length < 2) return [];
    const termo = buscaCliente.toLowerCase();
    return entidades.filter((c: Entidade) =>
      c.nomeRazaoSocial?.toLowerCase().includes(termo) ||
      c.nomeFantasia?.toLowerCase().includes(termo) ||
      c.documento?.includes(termo)
    ).slice(0, 8);
  }, [buscaCliente, entidades]);

  const filteredProducts = products.filter((p: Produto) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo_sku && p.codigo_sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalProdutos = itensVenda.reduce((acc: number, item: ItemVenda) => acc + item.totalLiquido, 0);
  const totalGeral = totalProdutos + frete;
  const totalDescontos = itensVenda.reduce((acc: number, i: ItemVenda) => acc + i.descontoReais, 0);

  const handleAddItem = (produto: Produto) => {
    const precoBase = parseFloat(produto.preco_venda_base);
    const existente = itensVenda.find((i: ItemVenda) => i.produtoId === produto.id);
    if (existente) {
      setItensVenda(itensVenda.map((i: ItemVenda) =>
        i.produtoId === produto.id
          ? { ...i, quantidade: i.quantidade + 1, totalLiquido: i.precoTabela * (i.quantidade + 1) - i.descontoReais }
          : i
      ));
    } else {
      setItensVenda([...itensVenda, {
        tempId: crypto.randomUUID(), produtoId: produto.id,
        sku: produto.codigo_sku || "N/D", nome: produto.nome,
        unidade: produto.unidade_comercial, precoTabela: precoBase,
        quantidade: 1, descontoReais: 0, totalLiquido: precoBase
      }]);
    }
    setSearchTerm("");
    setIsProductModalOpen(false);
  };

  const handleQtdChange = (id: string, delta: number) => {
    setItensVenda((prev: ItemVenda[]) =>
      prev
        .map(item => {
          if (item.tempId !== id) return item;

          const novaQtd = Math.max(0, item.quantidade + delta);

          return {
            ...item,
            quantidade: novaQtd,
            totalLiquido: Math.max(
              0,
              item.precoTabela * novaQtd - item.descontoReais
            )
          };
        })
    );
  };

  const handleQtdSet = (id: string, value: string | number) => {
    // Se o input for limpo (string vazia), a quantidade vira 0 no estado
    const qtd = value === "" ? 0 : Math.max(0, Number(value));

    setItensVenda((prev: ItemVenda[]) =>
      prev.map(item => {
        if (item.tempId !== id) return item;

        return {
          ...item,
          quantidade: qtd,
          totalLiquido: Math.max(
            0,
            item.precoTabela * qtd - item.descontoReais
          )
        };
      })
      // O .filter() que removia o item foi deletado daqui!
    );
  };

  const handleRemoveItem = (id: string) => {
    setItensVenda((prev: ItemVenda[]) => prev.filter((i: ItemVenda) => i.tempId !== id));
  };

  const canProceed = [
    !!clienteSelecionado,
    itensVenda.length > 0,
    !!formaPagamentoSelecionada,
    true
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER COMPACTO MOBILE */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">Novo Pedido</h1>
            {clienteSelecionado && (
              <p className="text-[10px] text-blue-600 font-medium truncate max-w-[180px]">
                {clienteSelecionado.nomeRazaoSocial}
              </p>
            )}
          </div>
          {itensVenda.length > 0 && (
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
              <ShoppingCart className="h-3 w-3 text-emerald-600" />
              <span className="text-[11px] font-black text-emerald-700">{itensVenda.length}</span>
            </div>
          )}
        </div>

        {/* STEPPER */}
        <div className="flex bg-slate-50 border-t">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => i < step || canProceed[i - 1] ? setStep(i) : null}
              className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all relative ${step === i
                ? 'text-blue-700 bg-white border-b-2 border-blue-600'
                : i < step ? 'text-emerald-600' : 'text-slate-400'
                }`}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black ${step === i ? 'bg-blue-600 text-white' : i < step ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {i < step ? '✓' : i + 1}
                </span>
                <span>{s}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CONTEÚDO POR STEP */}
      <div className="flex-1 overflow-auto pb-24">

        {/* STEP 0: CLIENTE */}
        {step === 0 && (
          <div className="p-4 space-y-4">
            <div className="text-center py-2">
              <User className="h-8 w-8 text-blue-500 mx-auto mb-1" />
              <h2 className="text-sm font-black text-slate-700 uppercase">Selecione o Cliente</h2>
            </div>

            {clienteSelecionado ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs font-black text-slate-800 truncate">{clienteSelecionado.nomeRazaoSocial}</span>
                    </div>
                    {clienteSelecionado.nomeFantasia && (
                      <p className="text-[11px] text-slate-500 ml-6">{clienteSelecionado.nomeFantasia}</p>
                    )}
                    <p className="text-[11px] font-mono text-slate-600 ml-6 mt-0.5">{clienteSelecionado.documento}</p>
                    {(clienteSelecionado.celular || clienteSelecionado.telefone) && (
                      <p className="text-[11px] text-slate-500 ml-6">{clienteSelecionado.celular || clienteSelecionado.telefone}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setClienteSelecionado(null); setBuscaCliente(""); }}
                    className="ml-2 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, CPF ou CNPJ..."
                    className="pl-10 h-12 text-sm border-2 border-slate-200 focus:border-blue-500 rounded-xl"
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    autoFocus
                  />
                  {buscaCliente && (
                    <button onClick={() => setBuscaCliente("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                </div>

                {buscaCliente.length > 2 && (
                  <div className="mt-2 bg-white border-2 border-slate-100 rounded-xl shadow-lg overflow-hidden">
                    {clientesFiltrados.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">Nenhum cliente encontrado</div>
                    ) : (
                      clientesFiltrados.map((c: Entidade) => (
                        <button
                          key={c.id}
                          className="w-full p-3 border-b last:border-b-0 text-left hover:bg-blue-50 active:bg-blue-100 transition-colors"
                          onClick={() => { setClienteSelecionado(c); setBuscaCliente(""); }}
                        >
                          <p className="text-sm font-bold text-slate-800">{c.nomeRazaoSocial}</p>
                          {c.nomeFantasia && <p className="text-[11px] text-slate-400">{c.nomeFantasia}</p>}
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">{c.documento}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {buscaCliente.length < 2 && (
                  <p className="text-center text-xs text-slate-400 mt-6">Digite pelo menos 2 caracteres para buscar</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 1: PRODUTOS */}
        {step === 1 && (
          <div className="p-4 space-y-3">
            {/* Botão adicionar produto */}
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Plus className="h-5 w-5" />
              Adicionar Produto
            </button>

            {/* Lista de itens */}
            {itensVenda.length === 0 ? (
              <div className="text-center py-12 text-slate-300">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold uppercase">Nenhum item adicionado</p>
                <p className="text-xs mt-1">Toque em "Adicionar Produto" acima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {itensVenda.map((item: ItemVenda) => (
                  <div key={item.tempId} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 leading-tight">{item.nome}</p>
                        <p className="text-[10px] font-mono text-slate-400">{item.sku} · {item.unidade}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.tempId)}
                        className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Controle de quantidade */}
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">


                          <input
                            type="number"
                            min={0}
                            // Se for 0, mostra campo vazio para facilitar a digitação
                            value={item.quantidade === 0 ? "" : item.quantidade}
                            onChange={(e) =>
                              // Passa o valor cru (string) para a função avaliar
                              handleQtdSet(item.tempId, e.target.value)
                            }
                            className="w-22 p-1 text-center text-sm font-black text-slate-800 bg-blue-400/25 rounded-md outline-none"
                          />  


                        </div>
                        <span className="text-[10px] text-slate-400">× {BRL(item.precoTabela)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">{BRL(item.totalLiquido)}</span>
                        {item.descontoReais > 0 && (
                          <p className="text-[10px] text-red-500">-{BRL(item.descontoReais)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total parcial */}
                <div className="bg-slate-800 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase">Subtotal</span>
                  <span className="text-base font-black text-white">{BRL(totalProdutos)}</span>
                </div>
              </div>
            )}

            {/* Modal de busca de produto */}
            <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
              <DialogContent className="max-w-full max-h-[90vh] flex flex-col p-0 gap-0 m-2 rounded-2xl overflow-hidden">
                <DialogHeader className="p-4 border-b bg-white flex-shrink-0">
                  <DialogTitle className="text-sm font-black uppercase text-slate-700">Buscar Produto</DialogTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Nome ou código SKU..."
                      className="pl-9 h-11 border-2 border-slate-200 focus:border-blue-500 rounded-xl"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="h-4 w-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-auto">
                  <div className="p-2 space-y-1.5">
                    {loading ? (
                      <div className="p-8 text-center text-xs text-slate-400">Carregando catálogo...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Nenhum produto encontrado para "{searchTerm}"
                      </div>
                    ) : (
                      filteredProducts.map((prod: Produto) => {
                        const estoqueInfo = getEstoqueProduto(prod);
                        const semEstoque = estoqueInfo.disponivel <= 0;
                        return (
                          <button
                            key={prod.id}
                            disabled={semEstoque}
                            onClick={() => handleAddItem(prod)}
                            className={`w-full p-3 rounded-xl text-left transition-all active:scale-[0.98] border ${semEstoque
                              ? 'opacity-50 bg-slate-50 border-slate-100 cursor-not-allowed'
                              : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50 shadow-sm'
                              }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="text-xs font-bold text-slate-800 leading-tight">{prod.nome}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-mono text-slate-400">{prod.codigo_sku || '---'}</span>
                                  <span className="text-[10px] text-slate-400">· {prod.unidade_comercial}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-black text-slate-900">{BRL(parseFloat(prod.preco_venda_base))}</p>
                                <div className={`text-[10px] font-bold mt-0.5 ${estoqueInfo.disponivel === 0 ? 'text-red-500' : estoqueInfo.disponivel < 10 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                  {semEstoque ? 'ESGOTADO' : `Estq: ${estoqueInfo.disponivel}`}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* STEP 2: PAGAMENTO */}
        {step === 2 && (
          <div className="p-4 space-y-4">
            <div className="text-center py-2">
              <CreditCard className="h-8 w-8 text-blue-500 mx-auto mb-1" />
              <h2 className="text-sm font-black text-slate-700 uppercase">Forma de Pagamento</h2>
            </div>

            {loadingFormas ? (
              <div className="text-center py-8 text-xs text-slate-400">Carregando...</div>
            ) : (
              <div className="space-y-2">
                {formasPagamento.map((forma: FormaPagamento) => (
                  <button
                    key={forma.id}
                    onClick={() => setFormaPagamentoSelecionada(forma.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${formaPagamentoSelecionada === forma.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{forma.nome}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {forma.diasRecebimento === 0 ? 'Recebimento imediato' : `Recebimento em ${forma.diasRecebimento} dias`}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${formaPagamentoSelecionada === forma.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                        {formaPagamentoSelecionada === forma.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Frete */}
            <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
              <label className="text-[11px] font-black text-slate-500 uppercase block mb-2 flex items-center gap-1">
                <Truck className="h-3 w-3" /> Frete / Entrega (opcional)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">R$</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="0,00"
                  value={frete || ""}
                  onChange={(e) => setFrete(Number(e.target.value))}
                  className="h-11 text-right text-sm font-bold border-2 border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RESUMO */}
        {step === 3 && (
          <div className="p-4 space-y-3">
            <div className="text-center py-2">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-1" />
              <h2 className="text-sm font-black text-slate-700 uppercase">Confirmar Pedido</h2>
            </div>

            {/* Resumo do cliente */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cliente</p>
              <p className="text-sm font-bold text-slate-800">{clienteSelecionado?.nomeRazaoSocial}</p>
              <p className="text-[11px] font-mono text-slate-500">{clienteSelecionado?.documento}</p>
            </div>

            {/* Itens resumo */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 border-b bg-slate-50">
                <p className="text-[10px] font-black text-slate-500 uppercase">{itensVenda.length} Itens no Pedido</p>
              </div>
              {itensVenda.map((item: ItemVenda, i: number) => (
                <div key={item.tempId} className={`px-3 py-2 flex justify-between items-center ${i < itensVenda.length - 1 ? 'border-b' : ''}`}>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-700 truncate">{item.nome}</p>
                    <p className="text-[10px] text-slate-400">{item.quantidade}x {BRL(item.precoTabela)}</p>
                  </div>
                  <span className="text-xs font-black text-slate-800">{BRL(item.totalLiquido)}</span>
                </div>
              ))}
            </div>

            {/* Financeiro */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal Produtos</span>
                  <span className="font-bold">{BRL(totalProdutos)}</span>
                </div>
                {frete > 0 && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Frete</span>
                    <span className="font-bold">{BRL(frete)}</span>
                  </div>
                )}
                {totalDescontos > 0 && (
                  <div className="flex justify-between text-xs text-red-600">
                    <span>Descontos</span>
                    <span className="font-bold">- {BRL(totalDescontos)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-800 uppercase">Total</span>
                  <span className="text-xl font-black text-slate-900">{BRL(totalGeral)}</span>
                </div>
              </div>
            </div>

            {/* Forma de pagamento */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Forma de Pagamento</p>
              <p className="text-sm font-bold text-slate-800">
                {formasPagamento.find((f: FormaPagamento) => f.id === formaPagamentoSelecionada)?.nome}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE NAVEGAÇÃO INFERIOR FIXA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 shadow-2xl z-30">
        {step < 3 ? (
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="h-12 px-4 border-2 border-slate-200 rounded-xl text-slate-600 font-bold text-sm flex items-center gap-1 active:scale-95 transition-transform"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
            )}
            <button
              disabled={!canProceed[step]}
              onClick={() => setStep(step + 1)}
              className={`flex-1 h-12 rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2 transition-all active:scale-95 ${canProceed[step]
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              {step === 0 ? "Selecionar Produtos" : step === 1 ? "Pagamento" : "Revisar Pedido"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="h-12 px-4 border-2 border-slate-200 rounded-xl text-slate-600 font-bold text-sm flex items-center gap-1 active:scale-95 transition-transform"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => handleFinalizarVenda('ORCAMENTO')}
              className="flex-1 h-12 border-2 border-slate-700 bg-white rounded-xl text-slate-800 font-bold text-xs uppercase flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "..." : "Orçamento"}
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => handleFinalizarVenda('APROVADO')}
              className="flex-1 h-12 bg-emerald-600 rounded-xl text-white font-bold text-xs uppercase flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "..." : "Faturar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// --- COMPONENTE DESKTOP (original) ---
function DesktopVendas({
  products, entidades, formasPagamento, loadingFormas, loading,
  itensVenda, setItensVenda, clienteSelecionado, setClienteSelecionado,
  formaPagamentoSelecionada, setFormaPagamentoSelecionada,
  frete, setFrete, isSubmitting, handleFinalizarVenda, BRL, getEstoqueProduto
}: any) {
  const [buscaCliente, setBuscaCliente] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const clientesFiltrados = useMemo(() => {
    if (buscaCliente.length < 2) return [];
    const termo = buscaCliente.toLowerCase();
    return entidades.filter((c: Entidade) =>
      c.nomeRazaoSocial?.toLowerCase().includes(termo) ||
      c.nomeFantasia?.toLowerCase().includes(termo) ||
      c.documento?.includes(termo)
    ).slice(0, 8);
  }, [buscaCliente, entidades]);

  const filteredProducts = products.filter((p: Produto) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo_sku && p.codigo_sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddItem = (produto: Produto) => {
    const precoBase = parseFloat(produto.preco_venda_base);
    setItensVenda([...itensVenda, {
      tempId: crypto.randomUUID(), produtoId: produto.id,
      sku: produto.codigo_sku || "N/D", nome: produto.nome,
      unidade: produto.unidade_comercial, precoTabela: precoBase,
      quantidade: 1, descontoReais: 0, totalLiquido: precoBase
    }]);
    setIsModalOpen(false);
    setSearchTerm("");
  };

  const handleUpdateItem = (id: string, field: 'quantidade' | 'descontoReais', value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setItensVenda((prev: ItemVenda[]) => prev.map(item => {
      if (item.tempId !== id) return item;
      let novaQtd = field === 'quantidade' ? (isNaN(numValue) ? 0 : numValue) : item.quantidade;
      let novoDesc = field === 'descontoReais' ? (isNaN(numValue) ? 0 : numValue) : item.descontoReais;
      if (novaQtd < 0) novaQtd = 0;
      const subtotal = (item.precoTabela * novaQtd) - novoDesc;
      return { ...item, quantidade: novaQtd, descontoReais: novoDesc, totalLiquido: Math.max(0, subtotal) };
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItensVenda((prev: ItemVenda[]) => prev.filter((i: ItemVenda) => i.tempId !== id));
  };

  const totalProdutos = itensVenda.reduce((acc: number, item: ItemVenda) => acc + item.totalLiquido, 0);
  const totalGeral = totalProdutos + frete;

  return (
    <div className="bg-[#f0f2f5] min-h-screen font-sans text-slate-800 pb-20">
      <HeaderEnterprise />

      {/* BARRA DE AÇÕES SUPERIOR */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-700 uppercase tracking-tight">
              Pedido de Venda <span className="text-slate-400 font-normal">#NOVO</span>
            </h1>
            <Badge variant="secondary" className="rounded-sm text-[10px] uppercase font-bold px-2 bg-blue-50 text-blue-700 border-blue-100">
              Em Digitação
            </Badge>
            {formaPagamentoSelecionada && (
              <Badge variant="outline" className="rounded-sm text-[10px] uppercase font-bold px-2 bg-green-50 text-green-700 border-green-100 ml-2">
                <CreditCard className="w-3 h-3 mr-1" />
                {formasPagamento.find((f: FormaPagamento) => f.id === formaPagamentoSelecionada)?.nome}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleFinalizarVenda('ORCAMENTO')} variant="outline" size="sm" className="h-8 text-xs font-bold uppercase text-slate-600 border-slate-300">
              <Save className="w-3 h-3 mr-2" /> Salvar Orçamento
            </Button>
            <Button onClick={() => handleFinalizarVenda('APROVADO')} size="sm" className="h-8 text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white">
              <Send className="w-3 h-3 mr-2" /> Faturar Pedido
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-4">
        {/* CABEÇALHO: CLIENTE */}
        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="hover:no-underline py-2 px-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-50 bg-emerald-600 p-2 rounded-md">
                <User className="h-3 w-3" /> Dados do Cliente e Operação
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-4 overflow-visible">
              <Card className="rounded-md border-slate-200 shadow-sm p-0">
                <CardContent className="p-4 space-y-4 overflow-visible">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Buscar Cliente</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <Input
                        placeholder="Digite nome ou CPF para pesquisar..."
                        className="pl-9 h-8 text-xs border-blue-100 focus:border-blue-400"
                        value={buscaCliente}
                        onChange={(e) => setBuscaCliente(e.target.value)}
                      />
                      {clienteSelecionado && (
                        <Button variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 text-[10px] text-red-500 hover:bg-red-50"
                          onClick={() => { setClienteSelecionado(null); setBuscaCliente(""); }}>
                          LIMPAR
                        </Button>
                      )}
                    </div>
                    {buscaCliente.length > 2 && !clienteSelecionado && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-md shadow-2xl max-h-48 overflow-auto">
                        {clientesFiltrados.map((c: Entidade) => (
                          <div key={c.id} className="p-2 hover:bg-blue-600 hover:text-white cursor-pointer border-b border-slate-50 flex justify-between items-center transition-colors group"
                            onClick={() => { setClienteSelecionado(c); setBuscaCliente(""); }}>
                            <div>
                              <p className="text-xs font-bold group-hover:text-white">{c.nomeRazaoSocial}</p>
                              <p className="text-[10px] text-slate-500 group-hover:text-blue-100">{c.nomeFantasia}</p>
                            </div>
                            <span className="text-[9px] font-mono bg-slate-100 group-hover:bg-blue-500 px-1.5 py-0.5 rounded text-slate-600 group-hover:text-white">
                              {c.documento}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Razão Social / Nome</label>
                      <Input readOnly disabled value={clienteSelecionado?.nomeRazaoSocial || ""} className="h-8 text-xs bg-slate-50 border-slate-200 font-medium cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">CPF/CNPJ</label>
                      <Input readOnly disabled value={clienteSelecionado?.documento || ""} className="h-8 text-xs bg-slate-50 border-slate-200 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contato</label>
                      <Input readOnly disabled value={clienteSelecionado?.celular || clienteSelecionado?.telefone || ""} className="h-8 text-xs bg-slate-50 border-slate-200 cursor-not-allowed" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* GRID DE ITENS + TOTAIS */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-9">
            <Card className="h-full border-slate-200 shadow-sm rounded-md overflow-hidden flex flex-col p-0">
              <div className="p-2 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2 px-2">
                  <ShoppingCart className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-bold uppercase text-slate-700">Itens do Pedido</span>
                  <Badge variant="outline" className="text-[10px] h-5 px-1 bg-white ml-2">{itensVenda.length} Itens</Badge>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-7 text-xs font-bold uppercase bg-blue-700 hover:bg-blue-800 text-white shadow-sm">
                      <Plus className="h-3 w-3 mr-1" /> Adicionar Produto (F2)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-full p-0 gap-0 border-slate-200 shadow-2xl">
                    <DialogHeader className="p-4 border-b bg-slate-50">
                      <DialogTitle className="text-sm font-bold uppercase text-slate-700 flex justify-between items-center">
                        <span>Busca Rápida de Produtos</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                            {filteredProducts.filter((p: Produto) => getEstoqueProduto(p).disponivel > 0).length} com estoque
                          </Badge>
                          <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                            {filteredProducts.filter((p: Produto) => getEstoqueProduto(p).disponivel === 0).length} sem estoque
                          </Badge>
                        </div>
                      </DialogTitle>
                      <div className="pt-2 relative">
                        <Search className="absolute left-3 top-4 h-4 w-4 text-slate-400" />
                        <Input placeholder="Digite nome, código ou SKU..." className="pl-9 bg-white border-slate-300 focus-visible:ring-blue-600"
                          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
                      </div>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] bg-white">
                      {loading ? (
                        <div className="p-8 text-center text-xs text-slate-400 uppercase">Carregando catálogo...</div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-slate-100 sticky top-0 z-10">
                            <TableRow className="h-8 hover:bg-slate-100">
                              <TableHead className="w-[100px] text-[10px] font-bold uppercase text-slate-500">SKU</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase text-slate-500">Produto</TableHead>
                              <TableHead className="w-[80px] text-[10px] font-bold uppercase text-slate-500 text-center">Estoque</TableHead>
                              <TableHead className="w-[80px] text-[10px] font-bold uppercase text-slate-500 text-center">Un</TableHead>
                              <TableHead className="w-[120px] text-[10px] font-bold uppercase text-slate-500 text-right">Preço</TableHead>
                              <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProducts.map((prod: Produto) => {
                              const estoqueInfo = getEstoqueProduto(prod);
                              const semEstoque = estoqueInfo.disponivel <= 0;
                              return (
                                <TableRow key={prod.id}
                                  className={`h-9 cursor-pointer transition-colors group ${semEstoque ? 'opacity-60 hover:bg-red-50' : 'hover:bg-blue-50'}`}
                                  onClick={() => !semEstoque && handleAddItem(prod)}>
                                  <TableCell className="py-1 font-mono text-[10px] text-slate-500">{prod.codigo_sku || "---"}</TableCell>
                                  <TableCell className="py-1 text-xs font-bold text-slate-700">
                                    <div className="flex flex-col">
                                      <span>{prod.nome}</span>
                                      {semEstoque && <span className="text-[10px] text-red-500">ESGOTADO</span>}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-1 text-center">
                                    <span className={`text-xs font-bold ${estoqueInfo.disponivel === 0 ? 'text-red-600' : estoqueInfo.disponivel < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                                      {estoqueInfo.disponivel}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-1 text-[10px] font-medium text-center">{prod.unidade_comercial}</TableCell>
                                  <TableCell className="py-1 text-xs font-bold text-right font-mono">{BRL(parseFloat(prod.preco_venda_base))}</TableCell>
                                  <TableCell className="py-1 text-right">
                                    {semEstoque ? <AlertCircle className="h-4 w-4 text-red-400 ml-auto" /> : <Plus className="h-4 w-4 text-slate-300 group-hover:text-blue-600 ml-auto" />}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex-1 overflow-auto bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 hover:bg-slate-100 h-9 border-b-slate-200">
                      <TableHead className="w-[50px] text-[9px] font-black text-slate-500 uppercase text-center">#</TableHead>
                      <TableHead className="min-w-[250px] text-[9px] font-black text-slate-500 uppercase">Produto / SKU</TableHead>
                      <TableHead className="w-[60px] text-[9px] font-black text-slate-500 uppercase text-center">Un</TableHead>
                      <TableHead className="w-[100px] text-[9px] font-black text-slate-500 uppercase text-right">Preço V.</TableHead>
                      <TableHead className="w-[100px] text-[9px] font-black text-blue-700 uppercase text-center bg-blue-50/30">Quantidade</TableHead>
                      <TableHead className="w-[110px] text-[9px] font-black text-red-700 uppercase text-center bg-red-50/30">Desc. (R$)</TableHead>
                      <TableHead className="w-[120px] text-[9px] font-black text-slate-800 uppercase text-right bg-slate-50">Total Líquido</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensVenda.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-300">
                            <Package className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-xs font-bold uppercase">Nenhum item lançado</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      itensVenda.map((item: ItemVenda, index: number) => (
                        <TableRow key={item.tempId} className="h-10 hover:bg-slate-50 border-b-slate-100 group">
                          <TableCell className="text-[10px] font-medium text-slate-400 text-center">{index + 1}</TableCell>
                          <TableCell className="py-1">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[280px]">{item.nome}</span>
                              <span className="text-[9px] font-mono text-slate-400">{item.sku}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px] text-center font-medium text-slate-500">{item.unidade}</TableCell>
                          <TableCell className="text-[11px] text-right font-medium text-slate-600 font-mono">{BRL(item.precoTabela)}</TableCell>
                          <TableCell className="p-1 bg-blue-50/10">
                            <Input type="number" min={0} placeholder="0" className="h-7 text-center text-xs font-bold text-blue-800 border-slate-200 focus:border-blue-500"
                              value={item.quantidade || ""} onChange={(e) => handleUpdateItem(item.tempId, 'quantidade', e.target.value)} />
                          </TableCell>
                          <TableCell className="p-1 bg-red-50/10">
                            <Input type="number" min={0} placeholder="0" className="h-7 text-center text-xs font-medium text-red-700 border-slate-200 focus:border-red-500"
                              value={item.descontoReais || ""} onChange={(e) => handleUpdateItem(item.tempId, 'descontoReais', e.target.value)} />
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs text-slate-900 bg-slate-50/50 font-mono pr-4">{BRL(item.totalLiquido)}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveItem(item.tempId)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="p-2 border-t bg-slate-50 text-[10px] text-slate-400 flex justify-end gap-4 font-medium uppercase">
                <span>Total Itens: <b className="text-slate-700">{itensVenda.length}</b></span>
                <span>Volume Total: <b className="text-slate-700">{itensVenda.reduce((acc: number, i: ItemVenda) => acc + i.quantidade, 0)}</b></span>
              </div>
            </Card>
          </div>

          {/* PAINEL LATERAL */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="border-none shadow-md ring-1 ring-slate-200 bg-white p-0">
              <CardHeader className="py-3 bg-slate-800 text-white rounded-t-md">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-center">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 pb-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Subtotal Produtos</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">{BRL(totalProdutos)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Frete</span>
                    <div className="flex items-center w-24">
                      <span className="text-[10px] text-slate-400 mr-1">R$</span>
                      <Input className="h-6 text-right text-xs font-bold border-slate-200" value={frete || ""} placeholder="0"
                        onChange={(e) => setFrete(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold uppercase text-red-500">Total Descontos</span>
                    <span className="text-xs font-bold text-red-600 font-mono">
                      - {BRL(itensVenda.reduce((acc: number, i: ItemVenda) => acc + i.descontoReais, 0))}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Valor Total Líquido</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tighter block">{BRL(totalProdutos + frete)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm p-0">
              <CardHeader className="py-2 border-b bg-slate-50">
                <CardTitle className="text-[10px] font-black uppercase text-slate-600 flex items-center justify-center gap-2">
                  <CreditCard className="h-3 w-3" /> Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {loadingFormas ? (
                  <div className="text-center py-2"><span className="text-[10px] text-slate-400">Carregando...</span></div>
                ) : (
                  <Select value={formaPagamentoSelecionada?.toString()} onValueChange={(value) => setFormaPagamentoSelecionada(Number(value))}>
                    <SelectTrigger className="h-8 text-xs font-bold bg-white">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento.map((forma: FormaPagamento) => (
                        <SelectItem key={forma.id} value={forma.id.toString()}>
                          <span>{forma.nome}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- COMPONENTE PRINCIPAL ---
export default function ComercialVendas() {
  const isMobile = useIsMobile();
  const [vendedorId, setVendedorId] = useState<string | null>(null);
  const [products, setProducts] = useState<Produto[]>([]);
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Entidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frete, setFrete] = useState(0);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState<number | null>(null);
  const [loadingFormas, setLoadingFormas] = useState(true);

  useEffect(() => { setVendedorId(getUserId()); }, []);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/produtos`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        setProducts(await res.json());
      } catch { } finally { setLoading(false); }
    };
    fetch_();
  }, []);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoadingFormas(true);
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/formas-pagamento`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const ativas = data.filter((f: FormaPagamento) => f.ativo);
        setFormasPagamento(ativas);
        if (ativas.length > 0) setFormaPagamentoSelecionada(ativas[0].id);
      } catch { } finally { setLoadingFormas(false); }
    };
    fetch_();
  }, []);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/entidades/tipo/CLIENTE`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        setEntidades(await res.json());
      } catch { }
    };
    fetch_();
  }, []);

  const handleFinalizarVenda = async (status: 'ORCAMENTO' | 'APROVADO') => {
    if (itensVenda.length === 0) { alert("Adicione pelo menos um item."); return; }
    if (!clienteSelecionado) { alert("Selecione um cliente."); return; }
    if (!formaPagamentoSelecionada) { alert("Selecione uma forma de pagamento."); return; }
    try {
      setIsSubmitting(true);
      const token = getToken();
      if (!token) return;
      const payload = {
        clienteId: clienteSelecionado.id, vendedorId, formaPagamentoId: formaPagamentoSelecionada,
        statusVenda: status, valorFrete: Number(frete), valorDesconto: 0, observacoesCliente: "",
        itens: itensVenda.map(item => ({
          produtoId: item.produtoId, quantidade: Number(item.quantidade),
          valorUnitario: Number(item.precoTabela), valorSubtotal: Number(item.totalLiquido),
          cfop: "5102", cstIcms: "000", valorDesconto: Number(item.descontoReais), valorFreteItem: 0
        }))
      };
      const res = await fetch(`${API_URL}/vendas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Erro"); }
      alert(`Venda registrada como ${status} com sucesso!`);
      setItensVenda([]); setFrete(0); setClienteSelecionado(null);
      setFormaPagamentoSelecionada(formasPagamento[0]?.id || null);
    } catch (err: any) {
      alert("Falha ao salvar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  function getEstoqueProduto(produto: Produto) {
    if (!produto.estoque || produto.estoque.length === 0) return { quantidade: 0, reservada: 0, disponivel: 0, custoMedio: 0, temEstoque: false };
    const item = produto.estoque[0];
    const disponivel = item.quantidade + item.quantidadeReservada;
    return { quantidade: item.quantidade, reservada: Math.abs(item.quantidadeReservada), disponivel: Math.max(0, disponivel), custoMedio: item.custoMedio, temEstoque: disponivel > 0 };
  }

  const BRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const sharedProps = {
    products, entidades, formasPagamento, loadingFormas, loading,
    itensVenda, setItensVenda, clienteSelecionado, setClienteSelecionado,
    formaPagamentoSelecionada, setFormaPagamentoSelecionada,
    frete, setFrete, isSubmitting, handleFinalizarVenda, BRL, getEstoqueProduto
  };

  if (isMobile) return <MobileVendas {...sharedProps} />;
  return <DesktopVendas {...sharedProps} />;
}