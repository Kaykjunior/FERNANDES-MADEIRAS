'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Search,
    Filter,
    Download,
    Printer,
    DollarSign,
    CheckCircle,
    Clock,
    AlertCircle,
    Calendar,
    MoreVertical,
    Check,
    X,
    Loader2,
    Eye,
    TrendingUp,
    FileText,
    ChevronDown,
    ChevronUp,
    Settings,
    Package,
    Warehouse,
    ArrowUpCircle,
    ArrowDownCircle,
    BarChart3,
    Tag,
    Layers,
    Box,
    ClipboardList,
    RefreshCw,
    Plus,
    Minus,
    ArrowRightLeft,
    Scale,
    CalendarDays,
    User,
    AlertTriangle,
    CheckSquare,
    Square,
    TrendingDown,
    Truck,
    RotateCcw,
    Wrench,
    Move,
    QrCode,
    MapPin,
    FileSearch,
    ShoppingCart,
    Receipt,
    Percent,
    TrendingUp as TrendingUpIcon,
    Database,
    ChevronRight,
    Boxes
} from "lucide-react";
import HeaderEnterprise from '@/components/header';
import { getToken, getUserId } from '@/lib/auth';
import { API_URL } from '@/lib/api';

// Tipos
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
    comprimento_mt?: number;
    diametro_min?: number;
    diametro_max?: number;
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
    createdAt: string;
    updatedAt: string;
}

interface MovimentacaoEstoque {
    id: string;
    tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';
    produtoId: string;
    produto?: Produto;
    quantidade: number;
    motivo: string;
    observacoes?: string;
    usuarioId: string;
    usuario?: {
        id: string;
        nome: string;
        email: string;
    };
    createdAt: string;
}

interface ResumoMovimentacoes {
    totalEntradas: number;
    totalSaidas: number;
    saldoPeriodo: number;
    movimentacoesRecentes: MovimentacaoEstoque[];
}

// ============================================================
// MODAL DE BUSCA DE PRODUTO
// ============================================================
function ProdutoSearchModal({
    isOpen,
    onClose,
    produtos,
    estoqueAtual,
    onSelect,
}: {
    isOpen: boolean;
    onClose: () => void;
    produtos: Produto[];
    estoqueAtual: Estoque[];
    onSelect: (produto: Produto) => void;
}) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const queryLower = query.toLowerCase().trim();
    const filtrados = query.length === 0
        ? produtos
        : produtos.filter(p =>
            p.nome.toLowerCase().includes(queryLower) ||
            (p.codigo_sku && p.codigo_sku.toLowerCase().includes(queryLower)) ||
            (p.categoria?.nome && p.categoria.nome.toLowerCase().includes(queryLower))
        );

    const getEstoqueProduto = (produtoId: string) =>
        estoqueAtual.find(e => e.produtoId === produtoId);

    const handleSelect = (produto: Produto) => {
        onSelect(produto);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '75vh' }}>

                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Buscar por nome, SKU ou categoria..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-2 px-1">
                        <span className="text-xs text-gray-400">
                            {filtrados.length} produto{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
                        </span>
                        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
                            Fechar (ESC)
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1">
                    {filtrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Package className="h-10 w-10 mb-3 opacity-30" />
                            <p className="text-sm font-medium">Nenhum produto encontrado</p>
                            <p className="text-xs mt-1">Tente outro nome ou código SKU</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {filtrados.map((produto) => {
                                const estoque = getEstoqueProduto(produto.id);
                                const disponivel = estoque?.quantidadeDisponivel ?? null;
                                const semEstoque = disponivel !== null && disponivel <= 0;
                                const baixoEstoque = disponivel !== null && disponivel > 0 && disponivel < 10;

                                return (
                                    <li key={produto.id}>
                                        <button
                                            onClick={() => handleSelect(produto)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 active:bg-blue-100 transition-colors text-left group"
                                        >
                                            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                                <Boxes className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-800 truncate">
                                                        {produto.nome}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {produto.codigo_sku && (
                                                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                            {produto.codigo_sku}
                                                        </span>
                                                    )}
                                                    {produto.categoria?.nome && (
                                                        <span className="text-xs text-gray-400">
                                                            {produto.categoria.nome}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                        · {produto.unidade_comercial}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                                {disponivel === null ? (
                                                    <span className="text-xs text-gray-300 font-medium">Sem registro</span>
                                                ) : semEstoque ? (
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                                        Esgotado
                                                    </span>
                                                ) : baixoEstoque ? (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                                        {disponivel} {produto.unidade_comercial}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                        {disponivel} {produto.unidade_comercial}
                                                    </span>
                                                )}
                                            </div>

                                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

function MovimentacaoCard({ movimentacao }: { movimentacao: MovimentacaoEstoque }) {
    const getTipoIcone = (tipo: string) => {
        switch (tipo) {
            case 'ENTRADA': return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
            case 'SAIDA': return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
            case 'AJUSTE': return <Wrench className="h-4 w-4 text-amber-600" />;
            case 'TRANSFERENCIA': return <Move className="h-4 w-4 text-blue-600" />;
            default: return <Package className="h-4 w-4 text-gray-600" />;
        }
    };

    const getTipoBadgeColor = (tipo: string) => {
        switch (tipo) {
            case 'ENTRADA': return 'bg-green-100 text-green-800 border-green-200';
            case 'SAIDA': return 'bg-red-100 text-red-800 border-red-200';
            case 'AJUSTE': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'TRANSFERENCIA': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-gray-50 rounded-sm">
                    {getTipoIcone(movimentacao.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 truncate">
                            {movimentacao.produto?.nome || 'Produto não encontrado'}
                        </p>
                        <Badge className={`text-xs rounded-sm ${getTipoBadgeColor(movimentacao.tipo)}`}>
                            {movimentacao.tipo}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600">
                            {movimentacao.quantidade} {movimentacao.produto?.unidade_comercial || 'un'}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 truncate">{movimentacao.motivo}</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                    {new Date(movimentacao.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-gray-400">
                    {new Date(movimentacao.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}

function ProdutoBaixoEstoqueCard({ item }: { item: Estoque }) {
    return (
        <div className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-md hover:bg-amber-50 transition-colors">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.produto.nome}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">SKU: {item.produto.codigo_sku || 'N/A'}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">Un: {item.produto.unidade_comercial}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Disponível</p>
                        <p className="text-sm font-bold text-amber-700">{item.quantidadeDisponivel}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Mín. Recomendado</p>
                        <p className="text-sm font-medium text-gray-700">10</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Repor
                </Badge>
                <Button size="sm" variant="outline" className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
                    <ArrowUpCircle className="h-3 w-3 mr-1" />
                    Entrada Rápida
                </Button>
            </div>
        </div>
    );
}

function EntradaRapidaModal({ isOpen, onClose, produto, onConfirm }: {
    isOpen: boolean;
    onClose: () => void;
    produto: Produto | null;
    onConfirm: (quantidade: number, custoUnitario: number, motivo: string) => void;
}) {
    const [quantidade, setQuantidade] = useState(1);
    const [custoUnitario, setCustoUnitario] = useState(0);
    const [motivo, setMotivo] = useState('COMPRA');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // rawInputs para o modal de entrada rápida
    const [rawInputs, setRawInputs] = useState({
        quantidade: '1',
        custoUnitario: '0',
    });

    // Reseta os campos ao abrir o modal
    useEffect(() => {
        if (isOpen) {
            setQuantidade(1);
            setCustoUnitario(0);
            setMotivo('COMPRA');
            setRawInputs({ quantidade: '1', custoUnitario: '0' });
        }
    }, [isOpen]);

    const handleRawNumber = (field: 'quantidade' | 'custoUnitario', value: string) => {
        const cleaned = value.replace(/[^\d.,]/g, '');
        setRawInputs(prev => ({ ...prev, [field]: cleaned }));

        const normalized = cleaned.replace(',', '.');
        const numeric = parseFloat(normalized);
        const final = isNaN(numeric) ? 0 : numeric;

        if (field === 'quantidade') {
            setQuantidade(Math.max(1, Math.floor(final)));
        } else {
            setCustoUnitario(final);
        }
    };

    if (!isOpen || !produto) return null;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(quantidade, custoUnitario, motivo);
            onClose();
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md border border-gray-300">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Entrada Rápida</h2>
                        <p className="text-sm text-gray-500">{produto.nome}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Quantidade</Label>
                        <div className="relative">
                            <Input
                                className="pl-10 border-gray-300"
                                value={rawInputs.quantidade}
                                onChange={(e) => handleRawNumber('quantidade', e.target.value)}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                <Layers className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Custo Unitário (R$)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">R$</span>
                            <Input
                                className="pl-10 border-gray-300"
                                value={rawInputs.custoUnitario}
                                onChange={(e) => handleRawNumber('custoUnitario', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Motivo</Label>
                        <Select value={motivo} onValueChange={setMotivo}>
                            <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="COMPRA">Compra</SelectItem>
                                <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
                                <SelectItem value="PRODUCAO">Produção</SelectItem>
                                <SelectItem value="AJUSTE">Ajuste de Inventário</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Valor Total:</span>
                            <span className="text-lg font-bold text-gray-800">
                                R$ {(quantidade * custoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-4 border-t">
                    <Button variant="outline" onClick={onClose} className="flex-1 border-gray-300">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || quantidade <= 0}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Check className="h-4 w-4 mr-2" />
                        )}
                        Confirmar Entrada
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Componente principal
export default function ControleEstoque() {
    const userID = getUserId();
    const token = getToken();

    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [estoqueAtual, setEstoqueAtual] = useState<Estoque[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
    const [resumo, setResumo] = useState<ResumoMovimentacoes>({
        totalEntradas: 0,
        totalSaidas: 0,
        saldoPeriodo: 0,
        movimentacoesRecentes: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'entrada' | 'ajuste' | 'historico'>('entrada');
    const [entradaRapidaOpen, setEntradaRapidaOpen] = useState(false);
    const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
    const [produtoModalOpen, setProdutoModalOpen] = useState(false);
    const [produtoSelecionadoForm, setProdutoSelecionadoForm] = useState<Produto | null>(null);

    const [formData, setFormData] = useState({
        produtoId: '',
        quantidade: 1,
        custoUnitario: 0,
        motivo: 'COMPRA',
        localizacao: '',
        observacoes: '',
        tipo: 'ENTRADA' as 'ENTRADA' | 'AJUSTE',
        usuarioId: userID || '',
    });

    // Estado de string bruta para os campos numéricos — evita bug de reformatação
    const [rawInputs, setRawInputs] = useState({
        quantidade: '1',
        custoUnitario: '0',
    });

    const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
    const [filtroPeriodo, setFiltroPeriodo] = useState<string>('30_DIAS');
    const [searchTerm, setSearchTerm] = useState('');

    // Handler para campos numéricos — atualiza a string bruta E o número no formData
    const handleRawNumber = (field: 'quantidade' | 'custoUnitario', value: string) => {
        const cleaned = value.replace(/[^\d.,]/g, '');
        setRawInputs(prev => ({ ...prev, [field]: cleaned }));

        const normalized = cleaned.replace(',', '.');
        const numeric = parseFloat(normalized);
        const final = isNaN(numeric) ? 0 : numeric;

        setFormData(prev => ({
            ...prev,
            [field]: field === 'quantidade' ? Math.max(1, Math.floor(final)) : final,
        }));
    };

    // Reseta rawInputs quando o formulário é limpo após submit
    const resetForm = () => {
        setFormData({
            produtoId: '',
            quantidade: 1,
            custoUnitario: 0,
            motivo: 'COMPRA',
            localizacao: '',
            observacoes: '',
            tipo: 'ENTRADA',
            usuarioId: userID || '',
        });
        setRawInputs({ quantidade: '1', custoUnitario: '0' });
        setProdutoSelecionadoForm(null);
    };

    const carregarDados = useCallback(async () => {
        try {
            setIsLoading(true);

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const produtosRes = await fetch(`${API_URL}/produtos`, { method: 'GET', headers });
            const produtosData = await produtosRes.json();
            setProdutos(produtosData);

            const estoqueRes = await fetch(`${API_URL}/estoque`, { method: 'GET', headers });
            if (estoqueRes.ok) {
                setEstoqueAtual(await estoqueRes.json());
            } else {
                setEstoqueAtual([]);
            }

            const movRes = await fetch(`${API_URL}/movimentacoes-estoque`, { method: 'GET', headers });
            if (movRes.ok) {
                setMovimentacoes(await movRes.json());
            } else {
                setMovimentacoes([]);
            }

            const resumoRes = await fetch(`${API_URL}/movimentacoes-estoque/resumo?periodo=${filtroPeriodo}`, { method: 'GET', headers });
            if (resumoRes.ok) {
                setResumo(await resumoRes.json());
            }

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filtroPeriodo, token]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const handleProdutoSelect = (produto: Produto) => {
        setProdutoSelecionadoForm(produto);
        setFormData(prev => ({ ...prev, produtoId: produto.id }));
    };

    const handleLimparProduto = () => {
        setProdutoSelecionadoForm(null);
        setFormData(prev => ({ ...prev, produtoId: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.produtoId) {
            alert('Selecione um produto');
            return;
        }

        if (formData.quantidade <= 0) {
            alert('Quantidade deve ser maior que zero');
            return;
        }

        try {
            setIsSubmitting(true);

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const movimentacaoPayload = {
                tipo: formData.tipo,
                produtoId: formData.produtoId,
                quantidade: formData.quantidade,
                motivo: formData.motivo,
                observacoes: formData.observacoes,
                usuarioId: userID,
            };

            const movResponse = await fetch(`${API_URL}/movimentacoes-estoque`, {
                method: 'POST',
                headers,
                body: JSON.stringify(movimentacaoPayload),
            });

            if (!movResponse.ok) {
                throw new Error('Erro ao registrar movimentação');
            }

            const endpoint = formData.tipo === 'ENTRADA' ? 'entrada' : 'ajuste';
            const estoquePayload: any = {
                produtoId: formData.produtoId,
                quantidade: formData.quantidade,
                motivo: formData.motivo,
                usuarioId: userID,
            };

            if (formData.tipo === 'ENTRADA') {
                if (formData.custoUnitario > 0) estoquePayload.custoUnitario = formData.custoUnitario;
                if (formData.localizacao) estoquePayload.localizacao = formData.localizacao;
            }

            const estoqueResponse = await fetch(`${API_URL}/estoque/${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(estoquePayload),
            });

            if (!estoqueResponse.ok) {
                const errorData = await estoqueResponse.json();
                throw new Error(errorData.message || 'Erro ao atualizar estoque');
            }

            resetForm();
            await carregarDados();
            alert('✅ Movimentação registrada com sucesso!');

        } catch (error: any) {
            console.error('Erro:', error);
            alert(`❌ ${error.message || 'Erro ao registrar movimentação'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEntradaRapida = async (quantidade: number, custoUnitario: number, motivo: string) => {
        if (!produtoSelecionado) return;

        try {
            setIsSubmitting(true);

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            await fetch(`${API_URL}/movimentacoes-estoque`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    tipo: 'ENTRADA' as const,
                    produtoId: produtoSelecionado.id,
                    quantidade,
                    motivo,
                    observacoes: 'Entrada rápida via painel',
                    usuarioId: userID,
                }),
            });

            const estoquePayload: any = {
                produtoId: produtoSelecionado.id,
                quantidade,
                motivo,
                usuarioId: userID,
            };
            if (custoUnitario > 0) estoquePayload.custoUnitario = custoUnitario;

            await fetch(`${API_URL}/estoque/entrada`, {
                method: 'POST',
                headers,
                body: JSON.stringify(estoquePayload),
            });

            await carregarDados();
            alert('Entrada rápida registrada com sucesso!');

        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao registrar entrada rápida');
        } finally {
            setIsSubmitting(false);
        }
    };

    const movimentacoesFiltradas = movimentacoes.filter(mov => {
        if (filtroTipo !== 'TODOS' && mov.tipo !== filtroTipo) return false;
        const searchLower = searchTerm.toLowerCase();
        return (
            mov.produto?.nome.toLowerCase().includes(searchLower) ||
            mov.motivo.toLowerCase().includes(searchLower) ||
            mov.observacoes?.toLowerCase().includes(searchLower)
        );
    });

    const totalProdutosEstoque = estoqueAtual.length;
    const valorTotalEstoque = estoqueAtual.reduce((sum, e) => sum + (e.quantidade * e.custoMedio), 0);
    const produtosComBaixoEstoque = estoqueAtual.filter(e => e.quantidadeDisponivel < 10);
    const estoqueAltoValor = estoqueAtual
        .sort((a, b) => (b.quantidadeDisponivel * b.custoMedio) - (a.quantidadeDisponivel * a.custoMedio))
        .slice(0, 5);

    const estoqueFormProduto = produtoSelecionadoForm
        ? estoqueAtual.find(e => e.produtoId === produtoSelecionadoForm.id)
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <ProdutoSearchModal
                isOpen={produtoModalOpen}
                onClose={() => setProdutoModalOpen(false)}
                produtos={produtos}
                estoqueAtual={estoqueAtual}
                onSelect={handleProdutoSelect}
            />

            <EntradaRapidaModal
                isOpen={entradaRapidaOpen}
                onClose={() => {
                    setEntradaRapidaOpen(false);
                    setProdutoSelecionado(null);
                }}
                produto={produtoSelecionado}
                onConfirm={handleEntradaRapida}
            />

            <HeaderEnterprise />

            <main className="px-4 md:px-6 py-4 md:py-6">
                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Total em Estoque</p>
                                    <p className="text-2xl font-bold text-gray-800">{totalProdutosEstoque}</p>
                                    <p className="text-xs text-gray-400 mt-1">produtos diferentes</p>
                                </div>
                                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-lg">
                                    <Package className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">valor em estoque</p>
                                </div>
                                <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 text-green-600 rounded-lg">
                                    <DollarSign className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Entradas (30 dias)</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {resumo.totalEntradas.toLocaleString('pt-BR')}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">unidades</p>
                                </div>
                                <div className="p-2 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 rounded-lg">
                                    <ArrowUpCircle className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Baixo Estoque</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {produtosComBaixoEstoque.length}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">produtos</p>
                                </div>
                                <div className="p-2 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 rounded-lg">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Conteúdo Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulário */}
                    <div className="lg:col-span-1">
                        <Card className="border border-gray-200 shadow-sm h-full">
                            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold text-gray-800">
                                        Nova Movimentação
                                    </CardTitle>
                                    <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                                        <Button
                                            size="sm"
                                            variant={activeTab === 'entrada' ? 'default' : 'ghost'}
                                            className={`text-xs h-7 px-3 rounded-sm ${activeTab === 'entrada'
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                            onClick={() => {
                                                setActiveTab('entrada');
                                                setFormData(prev => ({ ...prev, tipo: 'ENTRADA', motivo: 'COMPRA' }));
                                            }}
                                        >
                                            <ArrowUpCircle className="h-3 w-3 mr-1" />
                                            Entrada
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={activeTab === 'ajuste' ? 'default' : 'ghost'}
                                            className={`text-xs h-7 px-3 rounded-sm ${activeTab === 'ajuste'
                                                ? 'bg-amber-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                            onClick={() => {
                                                setActiveTab('ajuste');
                                                setFormData(prev => ({ ...prev, tipo: 'AJUSTE', motivo: 'AJUSTE' }));
                                            }}
                                        >
                                            <Wrench className="h-3 w-3 mr-1" />
                                            Ajuste
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <form onSubmit={handleSubmit} className="space-y-4">

                                    {/* Seleção de Produto */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                            <Package className="h-4 w-4" />
                                            Produto *
                                        </Label>

                                        {produtoSelecionadoForm ? (
                                            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                                        <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <Boxes className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-800 leading-tight">
                                                                {produtoSelecionadoForm.nome}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                {produtoSelecionadoForm.codigo_sku && (
                                                                    <span className="text-xs font-mono text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                                                                        {produtoSelecionadoForm.codigo_sku}
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-gray-500">
                                                                    {produtoSelecionadoForm.unidade_comercial}
                                                                </span>
                                                            </div>

                                                            {estoqueFormProduto && (
                                                                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-blue-200">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Disponível</p>
                                                                        <p className={`text-sm font-bold ${estoqueFormProduto.quantidadeDisponivel < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                                                                            {estoqueFormProduto.quantidadeDisponivel} {produtoSelecionadoForm.unidade_comercial}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Custo Médio</p>
                                                                        <p className="text-sm font-medium text-gray-700">
                                                                            R$ {estoqueFormProduto.custoMedio.toFixed(2)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1 flex-shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => setProdutoModalOpen(true)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                                                        >
                                                            Trocar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleLimparProduto}
                                                            className="text-xs text-red-400 hover:text-red-600 font-medium"
                                                        >
                                                            Remover
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProdutoSelecionado(produtoSelecionadoForm);
                                                        setEntradaRapidaOpen(true);
                                                    }}
                                                    className="mt-2 w-full text-xs text-green-700 border border-green-300 bg-white hover:bg-green-50 rounded-md py-1.5 flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <ArrowUpCircle className="h-3 w-3" />
                                                    Entrada Rápida
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setProdutoModalOpen(true)}
                                                className="w-full flex items-center gap-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg px-4 py-3 transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-md bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                                    <Search className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                                                        Selecionar produto
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Clique para buscar por nome ou SKU
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Quantidade */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                <Layers className="h-4 w-4" />
                                                Quantidade *
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    className="border-gray-300 pl-10 hover:border-blue-300 transition-colors"
                                                    value={rawInputs.quantidade}
                                                    onChange={(e) => handleRawNumber('quantidade', e.target.value)}
                                                    required
                                                />
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                    <Tag className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Custo Unitário */}
                                        {formData.tipo === 'ENTRADA' && (
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                    <DollarSign className="h-4 w-4" />
                                                    Custo Unitário
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">R$</span>
                                                    <Input
                                                        className="pl-10 border-gray-300 hover:border-blue-300 transition-colors"
                                                        value={rawInputs.custoUnitario}
                                                        onChange={(e) => handleRawNumber('custoUnitario', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Motivo */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                            <ClipboardList className="h-4 w-4" />
                                            Motivo *
                                        </Label>
                                        <Select
                                            value={formData.motivo}
                                            onValueChange={(value) => setFormData({ ...formData, motivo: value })}
                                        >
                                            <SelectTrigger className="border-gray-300 hover:border-blue-300 transition-colors">
                                                <SelectValue placeholder="Selecione o motivo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formData.tipo === 'ENTRADA' ? (
                                                    <>
                                                        <SelectItem value="COMPRA">
                                                            <div className="flex items-center gap-2">
                                                                <ShoppingCart className="h-4 w-4 text-green-600" />
                                                                <span>Compra</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="DEVOLUCAO">
                                                            <div className="flex items-center gap-2">
                                                                <RotateCcw className="h-4 w-4 text-blue-600" />
                                                                <span>Devolução</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="PRODUCAO">
                                                            <div className="flex items-center gap-2">
                                                                <Package className="h-4 w-4 text-amber-600" />
                                                                <span>Produção</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="TRANSFERENCIA">
                                                            <div className="flex items-center gap-2">
                                                                <Move className="h-4 w-4 text-purple-600" />
                                                                <span>Transferência</span>
                                                            </div>
                                                        </SelectItem>
                                                    </>
                                                ) : (
                                                    <>
                                                        <SelectItem value="AJUSTE">
                                                            <div className="flex items-center gap-2">
                                                                <Wrench className="h-4 w-4 text-amber-600" />
                                                                <span>Ajuste de Inventário</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="PERDA">
                                                            <div className="flex items-center gap-2">
                                                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                                                <span>Perda/Danificação</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="SAMPLE">
                                                            <div className="flex items-center gap-2">
                                                                <FileSearch className="h-4 w-4 text-gray-600" />
                                                                <span>Amostra/Teste</span>
                                                            </div>
                                                        </SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Localização */}
                                    {formData.tipo === 'ENTRADA' && (
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                Localização
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    className="border-gray-300 pl-10 hover:border-blue-300 transition-colors"
                                                    placeholder="Ex: Prateleira A3, Setor B"
                                                    value={formData.localizacao}
                                                    onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                                                />
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Observações */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                            <FileText className="h-4 w-4" />
                                            Observações
                                        </Label>
                                        <Textarea
                                            className="border-gray-300 hover:border-blue-300 transition-colors"
                                            placeholder="Informações adicionais, notas, etc..."
                                            rows={2}
                                            value={formData.observacoes}
                                            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                        />
                                    </div>

                                    {/* Botão de Submissão */}
                                    <div className="pt-2">
                                        <Button
                                            type="submit"
                                            className={`w-full h-11 font-medium ${formData.tipo === 'ENTRADA'
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                                                } text-white shadow-md hover:shadow-lg transition-all`}
                                            disabled={isSubmitting || !formData.produtoId}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : formData.tipo === 'ENTRADA' ? (
                                                <ArrowUpCircle className="h-4 w-4 mr-2" />
                                            ) : (
                                                <Wrench className="h-4 w-4 mr-2" />
                                            )}
                                            {formData.tipo === 'ENTRADA' ? 'Registrar Entrada' : 'Aplicar Ajuste'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Histórico */}
                    <div className="lg:col-span-2">
                        <Card className="border border-gray-200 shadow-sm h-full">
                            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                                        <Database className="h-5 w-5 text-blue-600" />
                                        Histórico de Movimentações
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Buscar..."
                                                className="pl-8 border-gray-300 text-sm w-40 hover:border-blue-300 transition-colors"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                                            <SelectTrigger className="w-36 border-gray-300 text-sm hover:border-blue-300 transition-colors">
                                                <SelectValue placeholder="Tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TODOS">Todos</SelectItem>
                                                <SelectItem value="ENTRADA">Entradas</SelectItem>
                                                <SelectItem value="SAIDA">Saídas</SelectItem>
                                                <SelectItem value="AJUSTE">Ajustes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                                            <SelectTrigger className="w-36 border-gray-300 text-sm hover:border-blue-300 transition-colors">
                                                <SelectValue placeholder="Período" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="HOJE">Hoje</SelectItem>
                                                <SelectItem value="7_DIAS">7 dias</SelectItem>
                                                <SelectItem value="30_DIAS">30 dias</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-64">
                                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                                        <p className="text-gray-500">Carregando movimentações...</p>
                                    </div>
                                ) : movimentacoesFiltradas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 p-4">
                                        <Package className="h-12 w-12 text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium text-center">Nenhuma movimentação encontrada</p>
                                        <p className="text-sm text-gray-400 text-center mt-1">
                                            {searchTerm ? 'Tente outros termos de busca' : 'Registre sua primeira entrada'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                        {movimentacoesFiltradas.map((mov) => (
                                            <MovimentacaoCard key={mov.id} movimentacao={mov} />
                                        ))}
                                    </div>
                                )}

                                {movimentacoesFiltradas.length > 0 && (
                                    <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-white">
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-md">
                                                <div className="flex items-center justify-center gap-2 mb-1">
                                                    <ArrowUpCircle className="h-4 w-4 text-green-600" />
                                                    <p className="text-sm font-medium text-green-700">Entradas</p>
                                                </div>
                                                <p className="text-xl font-bold text-green-800">
                                                    {resumo.totalEntradas.toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                            <div className="text-center p-3 bg-red-50 border border-red-200 rounded-md">
                                                <div className="flex items-center justify-center gap-2 mb-1">
                                                    <ArrowDownCircle className="h-4 w-4 text-red-600" />
                                                    <p className="text-sm font-medium text-red-700">Saídas</p>
                                                </div>
                                                <p className="text-xl font-bold text-red-800">
                                                    {resumo.totalSaidas.toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                            <div className={`text-center p-3 border rounded-md ${resumo.saldoPeriodo >= 0
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-red-50 border-red-200'
                                                }`}>
                                                <div className="flex items-center justify-center gap-2 mb-1">
                                                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                                                    <p className="text-sm font-medium text-gray-700">Saldo Líquido</p>
                                                </div>
                                                <p className={`text-xl font-bold ${resumo.saldoPeriodo >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                                                    {resumo.saldoPeriodo >= 0 ? '+' : ''}{resumo.saldoPeriodo.toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500">
                                                Período: {filtroPeriodo === 'HOJE' ? 'Hoje' : filtroPeriodo === '7_DIAS' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Alertas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {produtosComBaixoEstoque.length > 0 && (
                        <Card className="border border-amber-200 shadow-sm">
                            <CardHeader className="border-b border-amber-200 bg-gradient-to-r from-amber-50 to-white">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    <CardTitle className="text-base font-bold text-amber-800">
                                        Produtos com Baixo Estoque
                                    </CardTitle>
                                    <Badge className="ml-auto bg-amber-100 text-amber-800 border-amber-200">
                                        {produtosComBaixoEstoque.length} produto(s)
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    {produtosComBaixoEstoque.slice(0, 3).map((item) => (
                                        <ProdutoBaixoEstoqueCard key={item.id} item={item} />
                                    ))}
                                    {produtosComBaixoEstoque.length > 3 && (
                                        <div className="text-center pt-2">
                                            <p className="text-sm text-gray-500">
                                                +{produtosComBaixoEstoque.length - 3} produtos com estoque baixo
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {estoqueAltoValor.length > 0 && (
                        <Card className="border border-blue-200 shadow-sm">
                            <CardHeader className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                                <div className="flex items-center gap-2">
                                    <TrendingUpIcon className="h-5 w-5 text-blue-600" />
                                    <CardTitle className="text-base font-bold text-blue-800">
                                        Produtos de Alto Valor
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    {estoqueAltoValor.map((item) => {
                                        const valorTotal = item.quantidade * item.custoMedio;
                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-md hover:bg-blue-50 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800 truncate">{item.produto.nome}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-500">Disponível</p>
                                                            <p className="text-sm font-bold text-blue-700">{item.quantidade}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-500">Custo Médio</p>
                                                            <p className="text-sm font-medium text-gray-700">
                                                                R$ {item.custoMedio.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-blue-800">
                                                        R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Valor Total</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>

            <footer className="mt-6 px-4 md:px-6 py-4 border-t border-gray-200 bg-white">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="flex flex-wrap gap-3 justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                            <span className="text-sm text-gray-600">Entrada</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                            <span className="text-sm text-gray-600">Saída</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
                            <span className="text-sm text-gray-600">Ajuste</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                            <span className="text-sm text-gray-600">Transferência</span>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 text-center md:text-right">
                        <p>Sistema atualizado em {new Date().toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Total de {movimentacoes.length} movimentações registradas
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}