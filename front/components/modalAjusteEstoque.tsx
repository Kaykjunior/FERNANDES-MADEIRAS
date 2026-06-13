// ModalAjusteEstoque.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    Package,
    Calculator,
    AlertCircle,
    Calendar,
    Save,
    RotateCcw,
    X,
    Check,
    Loader2,
    ArrowUpDown,
    Hash,
    DollarSign,
    Building,
    Warehouse,
    FileText,
    Search,
    Settings
} from "lucide-react";

interface Produto {
    id: string;
    nome: string;
    codigo_sku: string;
    categoria?: {
        id: number;
        nome: string;
    };
    preco_venda_base: number;
    unidade_comercial: string;
}

interface Estoque {
    id: string;
    produtoId: string;
    quantidade: number;
    quantidadeReservada: number;
    quantidadeDisponivel: number;
    custoMedio: number;
    localizacao: string;
    produto: Produto;
}

interface ModalAjusteEstoqueProps {
    isOpen: boolean;
    onClose: () => void;
    produtos: Produto[];
    estoqueAtual: Estoque[];
    onConfirm: (data: {
        produtoId: string;
        quantidadeAjuste: number;
        tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
        motivo: string;
        custo?: number;
        reiniciarCustoMedio: boolean;
    }) => Promise<void>;
}

export function ModalAjusteEstoque({
    isOpen,
    onClose,
    produtos,
    estoqueAtual,
    onConfirm
}: ModalAjusteEstoqueProps) {
    // Estados do formulário
    const [produtoId, setProdutoId] = useState('');
    const [quantidadeEstoque, setQuantidadeEstoque] = useState<number | null>(null);
    const [quantidadeReal, setQuantidadeReal] = useState('');
    const [tipoMovimentacao, setTipoMovimentacao] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('AJUSTE');
    const [motivo, setMotivo] = useState('Ajuste Saldo Estoque');
    const [custo, setCusto] = useState('');
    const [reiniciarCustoMedio, setReiniciarCustoMedio] = useState(false);
    const [localArmazenamento, setLocalArmazenamento] = useState('1');
    const [indicadorPosse, setIndicadorPosse] = useState('0');
    const [observacoes, setObservacoes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Produto selecionado
    const produtoSelecionado = produtos.find(p => p.id === produtoId);
    const estoqueProduto = estoqueAtual.find(e => e.produtoId === produtoId);

    // Calcular diferença
    const quantidadeRealNum = parseFloat(quantidadeReal) || 0;
    const quantidadeEstoqueNum = quantidadeEstoque || 0;
    const diferenca = quantidadeRealNum - quantidadeEstoqueNum;

    // Formatar data atual
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Resetar form ao abrir/fechar
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setProdutoId('');
        setQuantidadeEstoque(null);
        setQuantidadeReal('');
        setTipoMovimentacao('AJUSTE');
        setMotivo('Ajuste Saldo Estoque');
        setCusto('');
        setReiniciarCustoMedio(false);
        setLocalArmazenamento('1');
        setIndicadorPosse('0');
        setObservacoes('');
    };

    // Atualizar quantidade de estoque quando produto for selecionado
    useEffect(() => {
        if (produtoId && estoqueProduto) {
            setQuantidadeEstoque(estoqueProduto.quantidadeDisponivel);
            setCusto(estoqueProduto.custoMedio.toString());
        } else {
            setQuantidadeEstoque(null);
        }
    }, [produtoId, estoqueProduto]);

    // Determinar tipo de movimentação baseado na diferença
    useEffect(() => {
        if (diferenca > 0) {
            setTipoMovimentacao('ENTRADA');
        } else if (diferenca < 0) {
            setTipoMovimentacao('SAIDA');
        } else {
            setTipoMovimentacao('AJUSTE');
        }
    }, [diferenca]);

    const handleSubmit = async () => {
        if (!produtoId || !quantidadeReal) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm({
                produtoId,
                quantidadeAjuste: Math.abs(diferenca),
                tipo: tipoMovimentacao,
                motivo,
                custo: parseFloat(custo) || undefined,
                reiniciarCustoMedio
            });
            resetForm();
            onClose();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao registrar ajuste');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDiferencaColor = () => {
        if (diferenca > 0) return 'text-green-600';
        if (diferenca < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getDiferencaIcon = () => {
        if (diferenca > 0) return '↑';
        if (diferenca < 0) return '↓';
        return '=';
    };

    const getTipoMovimentacaoLabel = () => {
        switch (tipoMovimentacao) {
            case 'ENTRADA': return { label: 'Entrada', color: 'bg-green-100 text-green-800 border-green-200' };
            case 'SAIDA': return { label: 'Saída', color: 'bg-red-100 text-red-800 border-red-200' };
            case 'AJUSTE': return { label: 'Ajuste', color: 'bg-amber-100 text-amber-800 border-amber-200' };
            default: return { label: 'Ajuste', color: 'bg-gray-100 text-gray-800 border-gray-200' };
        }
    };

    const tipoMov = getTipoMovimentacaoLabel();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border border-gray-300 bg-white shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-700 rounded-lg">
                                    <Package className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                        Ajuste de Estoque
                                        <Badge className="bg-blue-600 text-white text-xs">v00.1.00</Badge>
                                    </DialogTitle>
                                    <DialogDescription className="text-blue-200">
                                        Sistema de gestão de inventário - Ajuste de saldo
                                    </DialogDescription>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-white hover:bg-blue-700"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </DialogHeader>
                </div>

                {/* Conteúdo Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    {/* Coluna Esquerda - Configurações */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Configurações
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                                            <Building className="h-3 w-3" />
                                            Indicador Posse
                                        </Label>
                                        <Select value={indicadorPosse} onValueChange={setIndicadorPosse}>
                                            <SelectTrigger className="text-sm border-gray-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="h-3 w-3 text-green-600" />
                                                        <span>Item de Propriedade do Informante e em seu Poder</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="1">Item de Terceiros</SelectItem>
                                                <SelectItem value="2">Item Alugado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                                            <Warehouse className="h-3 w-3" />
                                            Local Armazenamento
                                        </Label>
                                        <Select value={localArmazenamento} onValueChange={setLocalArmazenamento}>
                                            <SelectTrigger className="text-sm border-gray-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Empresa</SelectItem>
                                                <SelectItem value="2">Depósito Terceiro</SelectItem>
                                                <SelectItem value="3">Transportadora</SelectItem>
                                                <SelectItem value="4">Cliente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <Calculator className="h-4 w-4" />
                                    Valores
                                </h3>
                                
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs font-medium text-gray-600 mb-1">Valor Custo (R$)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="pl-10 border-gray-300"
                                                value={custo}
                                                onChange={(e) => setCusto(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-medium text-gray-600 mb-1">Valor Custo Gerencial (R$)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="pl-10 border-gray-300 bg-gray-50"
                                                value={custo}
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <Label className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                                            <RotateCcw className="h-3 w-3" />
                                            Reiniciar Custo Médio
                                        </Label>
                                        <Select value={reiniciarCustoMedio.toString()} onValueChange={(v) => setReiniciarCustoMedio(v === 'true')}>
                                            <SelectTrigger className="text-sm border-gray-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="false">Não</SelectItem>
                                                <SelectItem value="true">Sim</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna Central - Produto e Quantidades */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Seletor de Produto */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Seleção de Produto
                                </h3>
                                
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs font-medium text-gray-600 mb-2">Produto *</Label>
                                        <Select value={produtoId} onValueChange={setProdutoId}>
                                            <SelectTrigger className="border-gray-300">
                                                <SelectValue placeholder="Selecione o produto..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {produtos.map((produto) => (
                                                    <SelectItem key={produto.id} value={produto.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate">{produto.nome}</p>
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    SKU: {produto.codigo_sku || 'N/A'} | 
                                                                    Un: {produto.unidade_comercial}
                                                                </p>
                                                            </div>
                                                            {estoqueAtual.find(e => e.produtoId === produto.id) && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    Em estoque
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {produtoSelecionado && (
                                        <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-md p-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-800">{produtoSelecionado.nome}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {produtoSelecionado.categoria?.nome || 'Sem categoria'}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            SKU: {produtoSelecionado.codigo_sku || 'N/A'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Un: {produtoSelecionado.unidade_comercial}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge className={tipoMov.color}>
                                                    {tipoMov.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabela de Quantidades */}
                        <Card className="border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <Hash className="h-4 w-4" />
                                    Controle de Quantidades
                                </h3>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">Código</th>
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">Descrição</th>
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">Qtd Estoque</th>
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">Estoque Real</th>
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">Diferença</th>
                                                <th className="text-left p-3 text-xs font-semibold text-gray-700">Valor Custo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {produtoSelecionado ? (
                                                <tr className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="p-3">
                                                        <div className="font-mono text-sm font-medium">
                                                            {produtoSelecionado.codigo_sku || '0006'}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="text-sm">{produtoSelecionado.nome}</div>
                                                    </td>
                                                    <td className="p-3">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-32 border-gray-300 bg-gray-50"
                                                            value={quantidadeEstoque || ''}
                                                            readOnly
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-32 border-gray-300"
                                                            value={quantidadeReal}
                                                            onChange={(e) => setQuantidadeReal(e.target.value)}
                                                            placeholder="0,00"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <div className={`flex items-center gap-2 text-sm font-semibold ${getDiferencaColor()}`}>
                                                            <span>{getDiferencaIcon()}</span>
                                                            <span>{diferenca.toFixed(2)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="text-sm">R$ {parseFloat(custo || '0').toFixed(2)}</div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Package className="h-8 w-8 text-gray-300" />
                                                            <p>Selecione um produto para visualizar as quantidades</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex items-center gap-4">
                                    <div className="flex-1">
                                        <Label className="text-xs font-medium text-gray-600 mb-2">Tipo de Movimentação</Label>
                                        <Select value={tipoMovimentacao} onValueChange={(v: 'ENTRADA' | 'SAIDA' | 'AJUSTE') => setTipoMovimentacao(v)}>
                                            <SelectTrigger className="border-gray-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ENTRADA">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowUpDown className="h-4 w-4 text-green-600" />
                                                        <span>Entrada</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="SAIDA">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowUpDown className="h-4 w-4 text-red-600" />
                                                        <span>Saída</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="AJUSTE">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowUpDown className="h-4 w-4 text-amber-600" />
                                                        <span>Ajuste</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs font-medium text-gray-600 mb-2">Quantidade de Ajuste</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="border-gray-300 font-mono"
                                            value={Math.abs(diferenca)}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <Button variant="outline" size="sm" className="mt-6">
                                            Adicionar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Motivo e Observações */}
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Motivo do Ajuste
                                </Label>
                                <Textarea
                                    className="border-gray-300 min-h-[80px]"
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    placeholder="Descreva o motivo do ajuste..."
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2">Observações</Label>
                                <Textarea
                                    className="border-gray-300 min-h-[60px]"
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    placeholder="Informações adicionais..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-sm ${diferenca > 0 ? 'bg-green-500' : diferenca < 0 ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                                <span>Status: {diferenca > 0 ? 'Entrada' : diferenca < 0 ? 'Saída' : 'Sem alteração'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Data: {dataAtual}</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={resetForm}
                                className="border-gray-300"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reiniciar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="border-gray-300"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Fechar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !produtoId || !quantidadeReal || diferenca === 0}
                                className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white shadow-md"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Processar Ajuste
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}