// app/pagamento-comissoes/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DollarSign,
    Download,
    FileText,
    Search,
    UserCircle,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Printer,
    XCircle,
    Users,
    Loader2,
    Receipt,
    Banknote,
    Signature,
    FileCheck,
    RefreshCw,
    History
} from "lucide-react";
import HeaderEnterprise from "@/components/header";
import { API_URL } from '@/lib/api';
import { getToken, getUserCargp, getUserNome } from '@/lib/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// TYPES
// ============================================================================

interface Vendedor {
    id: string;
    nome: string;
    email: string;
    cargo: string;
    comissaoPercentual: number;
    filial?: string;
    cpf?: string;
}

interface Comissao {
    id: string;
    vendedorId: string;
    vendaId: string;
    baseCalculo: number;
    percentualAplicado: number;
    valorComissao: number;
    status: 'PREVISTA' | 'LIBERADA' | 'PAGA' | 'CANCELADA';
    dataLiberacao?: string;
    dataPagamento?: string;
    observacoes?: string;
    vendedor?: Vendedor;
    venda?: {
        id: string;
        numeroPedido?: number;
        valorTotal: number;
        cliente?: {
            nomeRazaoSocial: string;
            documento?: string;
        };
        createdAt: string;
    };
}

interface ComissaoSelecionada extends Comissao {
    selected: boolean;
}

interface ResumoPagamento {
    totalComissoes: number;
    totalVendedores: number;
    totalVendas: number;
    valorTotal: number;
}

interface ComprovanteData {
    numeroRecibo: string;
    dataPagamento: string;
    vendedor: Vendedor;
    comissoes: Comissao[];
    valorTotal: number;
    valorExtenso: string;
    periodo: {
        inicio: string;
        fim: string;
    };
    pagador: {
        nome: string;
        cargo: string;
    };
    observacoes?: string;
}

interface ReciboEmitido {
    id: string;
    numeroRecibo: string;
    dataPagamento: string;
    vendedorId: string;
    vendedorNome: string;
    vendedor: Vendedor;
    valorTotal: number;
    comissoes: Comissao[];
    periodo: {
        inicio: string;
        fim: string;
    };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
    LIBERADA: { label: 'A Pagar', color: 'bg-blue-100 text-blue-700', icon: Banknote },
    PAGA: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    PREVISTA: { label: 'Prevista', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    CANCELADA: { label: 'Cancelada', color: 'bg-rose-100 text-rose-700', icon: XCircle }
} as const;

// ============================================================================
// UTILS
// ============================================================================

const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const formatarData = (data: string | Date | null | undefined): string => {
    if (!data) return '-';
    try {
        return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return '-';
    }
};

const formatarDataISO = (data: string | Date | null | undefined): string => {
    if (!data) return format(new Date(), 'yyyy-MM-dd');
    try {
        return format(new Date(data), 'yyyy-MM-dd');
    } catch {
        return format(new Date(), 'yyyy-MM-dd');
    }
};

const numeroPorExtenso = (valor: number): string => {
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const dezenas = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    const reais = Math.floor(valor);
    const centavos = Math.round((valor - reais) * 100);

    if (reais === 0) return 'zero reais';

    const converter = (n: number): string => {
        if (n < 10) return unidades[n];
        if (n < 100) {
            if (n === 10) return 'dez';
            if (n === 11) return 'onze';
            if (n === 12) return 'doze';
            if (n === 13) return 'treze';
            if (n === 14) return 'quatorze';
            if (n === 15) return 'quinze';
            if (n === 16) return 'dezesseis';
            if (n === 17) return 'dezessete';
            if (n === 18) return 'dezoito';
            if (n === 19) return 'dezenove';
            const d = Math.floor(n / 10);
            const u = n % 10;
            return dezenas[d] + (u > 0 ? ' e ' + unidades[u] : '');
        }
        if (n < 1000) {
            const c = Math.floor(n / 100);
            const r = n % 100;
            if (c === 1 && r === 0) return 'cem';
            return centenas[c] + (r > 0 ? ' e ' + converter(r) : '');
        }
        if (n < 1000000) {
            const m = Math.floor(n / 1000);
            const r = n % 1000;
            return (m === 1 ? 'um mil' : converter(m) + ' mil') + (r > 0 ? ' e ' + converter(r) : '');
        }
        return valor.toString();
    };

    let extenso = converter(reais) + (reais === 1 ? ' real' : ' reais');

    if (centavos > 0) {
        extenso += ' e ' + converter(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
    }

    return extenso;
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface FiltrosProps {
    dataInicio: string;
    dataFim: string;
    vendedorId: string;
    vendedores: Vendedor[];
    onDataInicioChange: (value: string) => void;
    onDataFimChange: (value: string) => void;
    onVendedorChange: (value: string) => void;
    onBuscar: () => void;
    onLimpar: () => void;
}

const FiltrosComponent: React.FC<FiltrosProps> = ({
    dataInicio,
    dataFim,
    vendedorId,
    vendedores,
    onDataInicioChange,
    onDataFimChange,
    onVendedorChange,
    onBuscar,
    onLimpar
}) => {
    return (
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <Label className="text-xs font-bold text-slate-600">Data Início</Label>
                        <Input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => onDataInicioChange(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-600">Data Fim</Label>
                        <Input
                            type="date"
                            value={dataFim}
                            onChange={(e) => onDataFimChange(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold text-slate-600">Vendedor</Label>
                        <Select value={vendedorId} onValueChange={onVendedorChange}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Todos os vendedores" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os vendedores</SelectItem>
                                {vendedores.map((v) => (
                                    <SelectItem key={v.id} value={v.id}>
                                        {v.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={onBuscar}
                            className="w-full bg-slate-900 text-white hover:bg-slate-800"
                        >
                            <Search className="mr-2 h-4 w-4" />
                            Buscar
                        </Button>
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={onLimpar}
                            variant="outline"
                            className="w-full border-slate-300"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Limpar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

interface ComissoesTableProps {
    comissoes: ComissaoSelecionada[];
    onSelectAll: (checked: boolean) => void;
    onSelectOne: (id: string, checked: boolean) => void;
    onReimprimirRecibo: (comissao: Comissao) => void;
    loading: boolean;
}

const ComissoesTable: React.FC<ComissoesTableProps> = ({
    comissoes,
    onSelectAll,
    onSelectOne,
    onReimprimirRecibo,
    loading
}) => {
    const todasSelecionadas = comissoes.length > 0 && comissoes.every(c => c.selected);
    const algumasSelecionadas = comissoes.some(c => c.selected);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (comissoes.length === 0) {
        return (
            <div className="text-center py-12">
                <Receipt className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Nenhuma comissão encontrada</p>
                <p className="text-sm text-slate-400">Tente ajustar os filtros de busca</p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-12">
                            <Checkbox
                                checked={todasSelecionadas}
                                onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                                aria-label="Selecionar todas"
                            />
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500">
                            Vendedor
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500">
                            Venda
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-right">
                            Base Cálculo
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">
                            % Aplicado
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-right">
                            Valor Comissão
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">
                            Data Liberação
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">
                            Status
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">
                            Ações
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {comissoes.map((comissao) => {
                        const StatusIcon = STATUS_CONFIG[comissao.status].icon;
                        return (
                            <TableRow key={comissao.id} className="hover:bg-slate-50">
                                <TableCell>
                                    <Checkbox
                                        checked={comissao.selected}
                                        onCheckedChange={(checked) => onSelectOne(comissao.id, checked as boolean)}
                                        aria-label={`Selecionar comissão ${comissao.id}`}
                                        disabled={comissao.status !== 'LIBERADA'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <UserCircle className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {comissao.vendedor?.nome || 'N/I'}
                                            </p>
                                            <p className="text-[9px] text-slate-400">
                                                {comissao.vendedor?.filial || 'Matriz'}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-medium text-slate-800">
                                        #{comissao.venda?.numeroPedido || 'N/I'}
                                    </p>
                                    <p className="text-[9px] text-slate-400">
                                        {formatarData(comissao.venda?.createdAt)}
                                    </p>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                    R$ {formatarMoeda(comissao.baseCalculo)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        {comissao.percentualAplicado}%
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-black text-sm text-blue-700">
                                    R$ {formatarMoeda(comissao.valorComissao)}
                                </TableCell>
                                <TableCell className="text-center text-xs text-slate-500">
                                    {formatarData(comissao.dataLiberacao)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className={`text-[9px] font-bold ${STATUS_CONFIG[comissao.status].color}`}>
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {STATUS_CONFIG[comissao.status].label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {comissao.status === 'PAGA' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onReimprimirRecibo(comissao)}
                                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800"
                                            title="Reimprimir recibo"
                                        >
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

interface ResumoPagamentoCardProps {
    resumo: ResumoPagamento;
    observacoes: string;
    onObservacoesChange: (value: string) => void;
    onProcessarPagamento: () => void;
    onGerarRecibo: () => void;
    processing: boolean;
    hasSelecionadas: boolean;
}

const ResumoPagamentoCard: React.FC<ResumoPagamentoCardProps> = ({
    resumo,
    observacoes,
    onObservacoesChange,
    onProcessarPagamento,
    onGerarRecibo,
    processing,
    hasSelecionadas
}) => {
    return (
        <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-slate-50">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg border">
                        <p className="text-[9px] font-black uppercase text-slate-400">Comissões</p>
                        <p className="text-xl font-black text-slate-800">{resumo.totalComissoes}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                        <p className="text-[9px] font-black uppercase text-slate-400">Vendedores</p>
                        <p className="text-xl font-black text-slate-800">{resumo.totalVendedores}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                        <p className="text-[9px] font-black uppercase text-slate-400">Vendas</p>
                        <p className="text-xl font-black text-slate-800">{resumo.totalVendas}</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-[9px] font-black uppercase text-slate-300">Total a Pagar</p>
                        <p className="text-xl font-black text-white">R$ {formatarMoeda(resumo.valorTotal)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs font-bold text-slate-600">Observações do Pagamento</Label>
                        <Textarea
                            value={observacoes}
                            onChange={(e) => onObservacoesChange(e.target.value)}
                            placeholder="Adicione observações sobre este pagamento..."
                            className="mt-1 h-20"
                            disabled={processing}
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <Button
                            onClick={onProcessarPagamento}
                            disabled={!hasSelecionadas || processing}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <DollarSign className="h-4 w-4 mr-2" />
                            )}
                            Processar Pagamento
                        </Button>
                        <Button
                            onClick={onGerarRecibo}
                            disabled={!hasSelecionadas || processing}
                            variant="outline"
                            className="border-slate-300"
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Recibo
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

interface ReciboDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    comprovante?: ComprovanteData;
    onGerarPDF: () => void;
    onAssinar: () => void;
    gerandoPDF: boolean;
    isReimpressao?: boolean;
    multiplosVendedores?: boolean;
    vendedoresCount?: number;
}

const ReciboDialog: React.FC<ReciboDialogProps> = ({
    open,
    onOpenChange,
    comprovante,
    onGerarPDF,
    onAssinar,
    gerandoPDF,
    isReimpressao = false,
    multiplosVendedores = false,
    vendedoresCount = 0
}) => {
    const [assinadoPagador, setAssinadoPagador] = useState(false);
    const [assinadoRecebedor, setAssinadoRecebedor] = useState(false);

    if (!comprovante) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="max-h-[90vh] overflow-y-auto"
                style={{ width: '95vw', maxWidth: '1400px' }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5" />
                        {isReimpressao ? 'Reimpressão de Recibo' : 'Recibo de Pagamento de Comissão'}
                    </DialogTitle>
                    <DialogDescription>
                        Nº {comprovante.numeroRecibo} - {formatarData(comprovante.dataPagamento)}
                        {isReimpressao && <Badge className="ml-2 bg-amber-100 text-amber-700">CÓPIA</Badge>}
                        {multiplosVendedores && (
                            <Badge className="ml-2 bg-blue-100 text-blue-700">
                                Pagamento em lote - {vendedoresCount} vendedor(es)
                            </Badge>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Preview do Recibo */}
                <div className="border rounded-lg p-6 bg-white">
                    {isReimpressao && (
                        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg text-center">
                            <p className="text-xs font-bold text-amber-700 uppercase">🔹 SEGUNDA VIA - DOCUMENTO NÃO ORIGINAL 🔹</p>
                        </div>
                    )}

                    {/* Cabeçalho */}
                    <div className="flex justify-between items-start mb-6 pb-4 border-b">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">RECIBO DE PAGAMENTO</h1>
                            <p className="text-xs text-slate-500">Comissão sobre Vendas</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-600">Nº {comprovante.numeroRecibo}</p>
                            <p className="text-xs text-slate-400">{formatarData(comprovante.dataPagamento)}</p>
                        </div>
                    </div>

                    {/* Dados do Vendedor */}
                    <div className="mb-4">
                        <h2 className="text-xs font-black uppercase text-slate-400 mb-2">VENDEDOR</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-bold">{comprovante.vendedor.nome}</p>
                                <p className="text-xs text-slate-500">{comprovante.vendedor.email}</p>
                                {comprovante.vendedor.cpf && (
                                    <p className="text-xs text-slate-500">CPF: {comprovante.vendedor.cpf}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Filial: {comprovante.vendedor.filial || 'Matriz'}</p>
                                <p className="text-xs text-slate-500">Comissão: {comprovante.vendedor.comissaoPercentual}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Comissões */}
                    <div className="mb-4">
                        <h2 className="text-xs font-black uppercase text-slate-400 mb-2">COMISSÕES PAGAS</h2>
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left p-2">Venda</th>
                                    <th className="text-left p-2">Cliente</th>
                                    <th className="text-right p-2">Data</th>
                                    <th className="text-right p-2">Base</th>
                                    <th className="text-right p-2">%</th>
                                    <th className="text-right p-2">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comprovante.comissoes.map((c, index) => (
                                    <tr key={c.id} className="border-b">
                                        <td className="p-2 font-mono">#{c.venda?.numeroPedido || 'N/I'}</td>
                                        <td className="p-2">{c.venda?.cliente?.nomeRazaoSocial || 'Consumidor'}</td>
                                        <td className="p-2 text-right">{formatarData(c.venda?.createdAt)}</td>
                                        <td className="p-2 text-right">R$ {formatarMoeda(c.baseCalculo)}</td>
                                        <td className="p-2 text-right">{c.percentualAplicado}%</td>
                                        <td className="p-2 text-right font-bold">R$ {formatarMoeda(c.valorComissao)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold">
                                <tr>
                                    <td colSpan={5} className="p-2 text-right">TOTAL:</td>
                                    <td className="p-2 text-right">R$ {formatarMoeda(comprovante.valorTotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Valor por Extenso */}
                    <div className="mb-6 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-600">
                            <span className="font-bold">Valor por extenso: </span>
                            {comprovante.valorExtenso}
                        </p>
                    </div>

                    {/* Período */}
                    <div className="mb-6 text-xs text-slate-500">
                        <p>Período de apuração: {formatarData(comprovante.periodo.inicio)} a {formatarData(comprovante.periodo.fim)}</p>
                    </div>

                    {/* Observações */}
                    {comprovante.observacoes && (
                        <div className="mb-6 p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-600">
                                <span className="font-bold">Observações: </span>
                                {comprovante.observacoes}
                            </p>
                        </div>
                    )}

                    {/* Assinaturas */}
                    <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t">
                        <div>
                            <p className="text-xs text-slate-400 mb-2">PAGADOR</p>
                            <div className="border-b border-slate-300 h-12 mb-1">
                                {assinadoPagador ? (
                                    <div className="h-12 flex items-center justify-center">
                                        <Signature className="h-8 w-8 text-slate-400" />
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setAssinadoPagador(true)}
                                        className="w-full h-12 border-2 border-dashed hover:bg-slate-50"
                                        disabled={isReimpressao}
                                    >
                                        <Signature className="h-4 w-4 mr-2" />
                                        {isReimpressao ? 'Assinatura já registrada' : 'Assinar como Pagador'}
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-center">{comprovante.pagador.nome}</p>
                            <p className="text-xs text-center text-slate-400">{comprovante.pagador.cargo}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-2">RECEBEDOR</p>
                            <div className="border-b border-slate-300 h-12 mb-1">
                                {assinadoRecebedor ? (
                                    <div className="h-12 flex items-center justify-center">
                                        <Signature className="h-8 w-8 text-slate-400" />
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setAssinadoRecebedor(true)}
                                        className="w-full h-12 border-2 border-dashed hover:bg-slate-50"
                                        disabled={isReimpressao}
                                    >
                                        <Signature className="h-4 w-4 mr-2" />
                                        {isReimpressao ? 'Assinatura já registrada' : 'Assinar como Recebedor'}
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-center">{comprovante.vendedor.nome}</p>
                            <p className="text-xs text-center text-slate-400">Vendedor</p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                    <Button
                        onClick={onGerarPDF}
                        className="bg-slate-900 text-white hover:bg-slate-800"
                        disabled={gerandoPDF}
                    >
                        {gerandoPDF ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        {isReimpressao ? 'Baixar Cópia PDF' : 'Baixar PDF'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Componente de Histórico de Recibos
interface RecibosEmitidosProps {
    onReimprimirRecibo: (recibo: ReciboEmitido) => void;
    token: string;
}

const RecibosEmitidosSection: React.FC<RecibosEmitidosProps> = ({ onReimprimirRecibo, token }) => {
    const [recibos, setRecibos] = useState<ReciboEmitido[]>([]);
    const [loading, setLoading] = useState(false);
    const [filtroData, setFiltroData] = useState({
        dataInicio: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        dataFim: format(new Date(), 'yyyy-MM-dd')
    });

    const carregarRecibos = async () => {
        setLoading(true);
        try {
            const dataInicioObj = new Date(filtroData.dataInicio);
            const dataFimObj = new Date(filtroData.dataFim);

            dataInicioObj.setHours(0, 0, 0, 0);
            dataFimObj.setHours(23, 59, 59, 999);

            const params = new URLSearchParams();
            params.append('dataInicio', dataInicioObj.toISOString());
            params.append('dataFim', dataFimObj.toISOString());
            params.append('status', 'PAGA');

            const response = await fetch(
                `${API_URL}/comissoes/buscar?${params.toString()}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();

                // Agrupar por data de pagamento e vendedor
                const recibosMap = new Map<string, ReciboEmitido>();

                data.forEach((comissao: Comissao) => {
                    if (comissao.status === 'PAGA' && comissao.dataPagamento && comissao.vendedor) {
                        const dataPagamento = new Date(comissao.dataPagamento).toISOString().split('T')[0];
                        const chave = `${comissao.vendedorId}-${dataPagamento}`;

                        if (!recibosMap.has(chave)) {
                            recibosMap.set(chave, {
                                id: chave,
                                numeroRecibo: `REC-${dataPagamento}-${comissao.vendedorId.substring(0, 4)}`,
                                dataPagamento: comissao.dataPagamento,
                                vendedorId: comissao.vendedorId,
                                vendedorNome: comissao.vendedor.nome,
                                vendedor: comissao.vendedor,
                                valorTotal: 0,
                                comissoes: [],
                                periodo: {
                                    inicio: filtroData.dataInicio,
                                    fim: filtroData.dataFim
                                }
                            });
                        }

                        const recibo = recibosMap.get(chave)!;
                        recibo.valorTotal += comissao.valorComissao;
                        recibo.comissoes.push(comissao);
                    }
                });

                setRecibos(Array.from(recibosMap.values()));
            }
        } catch (error) {
            console.error('Erro ao carregar recibos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarRecibos();
    }, []);

    return (
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="bg-white border-b py-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Histórico de Recibos Emitidos
                    </CardTitle>
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={filtroData.dataInicio}
                            onChange={(e) => setFiltroData(prev => ({ ...prev, dataInicio: e.target.value }))}
                            className="w-36 h-8 text-xs"
                        />
                        <Input
                            type="date"
                            value={filtroData.dataFim}
                            onChange={(e) => setFiltroData(prev => ({ ...prev, dataFim: e.target.value }))}
                            className="w-36 h-8 text-xs"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={carregarRecibos}
                            disabled={loading}
                            className="h-8"
                        >
                            <Search className="h-3 w-3 mr-1" />
                            Filtrar
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                ) : recibos.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum recibo encontrado no período</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recibos.map((recibo) => (
                            <div
                                key={recibo.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400">Recibo</p>
                                        <p className="text-sm font-black text-slate-800">{recibo.numeroRecibo}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px]">
                                        {formatarData(recibo.dataPagamento)}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <UserCircle className="h-5 w-5 text-slate-400" />
                                    <p className="text-sm font-medium text-slate-700">
                                        {recibo.vendedorNome}
                                    </p>
                                </div>

                                <div className="flex justify-between items-center mt-3 pt-2 border-t">
                                    <span className="text-xs text-slate-500">
                                        {recibo.comissoes.length} comissão(ões)
                                    </span>
                                    <span className="text-base font-black text-blue-700">
                                        R$ {formatarMoeda(recibo.valorTotal)}
                                    </span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => onReimprimirRecibo(recibo)}
                                >
                                    <Printer className="h-3 w-3 mr-2" />
                                    Reimprimir Recibo
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PagamentoComissoesPage() {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [gerandoPDF, setGerandoPDF] = useState(false);
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [comissoes, setComissoes] = useState<ComissaoSelecionada[]>([]);
    const [filtros, setFiltros] = useState({
        dataInicio: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        dataFim: format(new Date(), 'yyyy-MM-dd'),
        vendedorId: 'todos'
    });
    const [observacoes, setObservacoes] = useState('');
    const [showReciboDialog, setShowReciboDialog] = useState(false);
    const [comprovanteData, setComprovanteData] = useState<ComprovanteData>();
    const [currentUser, setCurrentUser] = useState<{ nome: string; cargo: string }>({
        nome: getUserNome(),
        cargo: getUserCargp()
    });
    const [error, setError] = useState<string | null>(null);
    const [isReimpressao, setIsReimpressao] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState<'pendentes' | 'recibos'>('pendentes');
    const [multiplosVendedores, setMultiplosVendedores] = useState(false);
    const [recibosGerados, setRecibosGerados] = useState<ComprovanteData[]>([]);
    
    // Estados para controle do token
    const [token, setToken] = useState<string | null>(null);
    const [checkingToken, setCheckingToken] = useState(true);

    // Verificar token de forma assíncrona
    useEffect(() => {
        const checkToken = async () => {
            setCheckingToken(true);
            const storedToken = getToken();
            setToken(storedToken);
            setCheckingToken(false);
        };
        
        checkToken();
    }, []);

    // Carregar vendedores apenas quando o token estiver disponível
    useEffect(() => {
        if (token) {
            carregarVendedores();
        }
    }, [token]);

    const carregarVendedores = async () => {
        console.log('🔍 Buscando vendedores...');
        try {
            const response = await fetch(`${API_URL}/usuario`,{ headers: { 'Authorization': `Bearer ${token}` } });

            console.log('📥 Status vendedores:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Vendedores recebidos:', data);

                // Verificar se data é array
                let usuarios = Array.isArray(data) ? data : [];

                const vendedoresFiltrados = usuarios.filter((u: any) =>
                    u.cargo === 'VENDEDOR' || u.cargo === 'GERENTE' || u.cargo === 'ADMIN'
                );

                console.log('🎯 Vendedores filtrados:', vendedoresFiltrados.length);
                setVendedores(vendedoresFiltrados);
                setError(null);
            } else {
                console.error('❌ Erro ao carregar vendedores:', response.status);
                setError('Erro ao carregar vendedores');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar vendedores:', error);
            setError('Erro de conexão ao carregar vendedores');
        }
    };

    const carregarComissoes = useCallback(async () => {
        if (!token) return;
        
        setLoading(true);
        setError(null);
        console.log('🔍 Buscando comissões com filtros:', filtros);

        try {
            const dataInicioObj = new Date(filtros.dataInicio);
            const dataFimObj = new Date(filtros.dataFim);

            dataInicioObj.setHours(0, 0, 0, 0);
            dataFimObj.setHours(23, 59, 59, 999);

            const params = new URLSearchParams();
            params.append('dataInicio', dataInicioObj.toISOString());
            params.append('dataFim', dataFimObj.toISOString());

            if (filtros.vendedorId !== 'todos') {
                params.append('vendedorId', filtros.vendedorId);
            }

            const url = `${API_URL}/comissoes/buscar?${params.toString()}`;
            console.log('📡 URL da requisição:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Status da resposta:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', response.status, errorText);
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Dados recebidos:', data);

            let comissoesArray: Comissao[] = [];
            if (Array.isArray(data)) {
                comissoesArray = data;
            } else if (data.data && Array.isArray(data.data)) {
                comissoesArray = data.data;
            } else {
                console.warn('⚠️ Formato de resposta inesperado:', data);
                comissoesArray = [];
            }

            // Filtrar comissões (todas exceto canceladas)
            const comissoesFiltradas = comissoesArray
                .filter(c => c.status !== 'CANCELADA' && c.vendedor)
                .map(c => ({ ...c, selected: false }));

            console.log('🎯 Comissões filtradas:', comissoesFiltradas.length);
            setComissoes(comissoesFiltradas);
            setError(null);

        } catch (error) {
            console.error('❌ Erro ao carregar comissões:', error);
            setError('Erro ao carregar comissões: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    }, [filtros, token]);

    // Carregar comissões iniciais após vendedores
    useEffect(() => {
        if (vendedores.length > 0 && token) {
            console.log('🔄 Vendedores carregados, buscando comissões...');
            carregarComissoes();
        }
    }, [vendedores, carregarComissoes, token]);

    const limparFiltros = () => {
        setFiltros({
            dataInicio: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
            dataFim: format(new Date(), 'yyyy-MM-dd'),
            vendedorId: 'todos'
        });
        setTimeout(() => carregarComissoes(), 100);
    };

    const resumo = useMemo<ResumoPagamento>(() => {
        const selecionadas = comissoes.filter(c => c.selected);
        const vendedoresUnicos = new Set(selecionadas.map(c => c.vendedorId));
        const vendasUnicas = new Set(selecionadas.map(c => c.vendaId));

        return {
            totalComissoes: selecionadas.length,
            totalVendedores: vendedoresUnicos.size,
            totalVendas: vendasUnicas.size,
            valorTotal: selecionadas.reduce((acc, c) => acc + c.valorComissao, 0)
        };
    }, [comissoes]);

    const handleSelectAll = (checked: boolean) => {
        setComissoes(prev =>
            prev.map(c => ({
                ...c,
                selected: c.status === 'LIBERADA' ? checked : false
            }))
        );
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        setComissoes(prev =>
            prev.map(c =>
                c.id === id ? { ...c, selected: checked } : c
            )
        );
    };

    const processarPagamento = async () => {
        if (!token) return;
        
        const selecionadas = comissoes.filter(c => c.selected);

        if (selecionadas.length === 0) return;

        setProcessing(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/comissoes/pagar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    comissoesIds: selecionadas.map(c => c.id),
                    observacoes
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Pagamento processado:', result);

                // Agrupar comissões por vendedor
                const porVendedor = selecionadas.reduce((acc, c) => {
                    if (!acc[c.vendedorId]) {
                        acc[c.vendedorId] = [];
                    }
                    acc[c.vendedorId].push(c);
                    return acc;
                }, {} as Record<string, Comissao[]>);

                const vendedoresIds = Object.keys(porVendedor);
                const multiplos = vendedoresIds.length > 1;
                setMultiplosVendedores(multiplos);

                // Gerar recibos para cada vendedor
                const novosRecibos: ComprovanteData[] = [];

                for (const vendedorId of vendedoresIds) {
                    const comissoesVendedor = porVendedor[vendedorId];
                    const vendedor = comissoesVendedor[0].vendedor!;

                    const comprovante: ComprovanteData = {
                        numeroRecibo: `REC-${format(new Date(), 'yyyyMMdd')}-${vendedorId.substring(0, 4)}`,
                        dataPagamento: new Date().toISOString(),
                        vendedor,
                        comissoes: comissoesVendedor,
                        valorTotal: comissoesVendedor.reduce((acc, c) => acc + c.valorComissao, 0),
                        valorExtenso: numeroPorExtenso(comissoesVendedor.reduce((acc, c) => acc + c.valorComissao, 0)),
                        periodo: {
                            inicio: filtros.dataInicio,
                            fim: filtros.dataFim
                        },
                        pagador: currentUser,
                        observacoes
                    };

                    novosRecibos.push(comprovante);
                }

                setRecibosGerados(novosRecibos);

                // Se for múltiplos vendedores, mostrar o primeiro
                if (multiplos) {
                    setComprovanteData(novosRecibos[0]);
                } else {
                    setComprovanteData(novosRecibos[0]);
                }

                setIsReimpressao(false);
                setShowReciboDialog(true);

                await carregarComissoes();
                setObservacoes('');
                setError(null);
            } else {
                const errorData = await response.json();
                console.error('❌ Erro no pagamento:', errorData);
                setError('Erro ao processar pagamento: ' + (errorData.message || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('❌ Erro ao processar pagamento:', error);
            setError('Erro de conexão ao processar pagamento');
        } finally {
            setProcessing(false);
        }
    };

    const gerarReciboPDF = async () => {
        if (!comprovanteData || !token) return;

        setGerandoPDF(true);
        setError(null);

        try {
            // Log para debug
            console.log('📤 Enviando dados para gerar PDF:', JSON.stringify(comprovanteData, null, 2));

            // Garantir que todos os números são números e não strings
            const dadosFormatados = {
                numeroRecibo: comprovanteData.numeroRecibo,
                dataPagamento: comprovanteData.dataPagamento,

                vendedor: {
                    id: comprovanteData.vendedor.id,
                    nome: comprovanteData.vendedor.nome,
                    email: comprovanteData.vendedor.email,
                    cargo: comprovanteData.vendedor.cargo,
                    comissaoPercentual: Number(comprovanteData.vendedor.comissaoPercentual),
                    filial: comprovanteData.vendedor.filial,
                    cpf: comprovanteData.vendedor.cpf
                },

                comissoes: comprovanteData.comissoes.map(c => ({
                    id: c.id,
                    vendaId: c.vendaId,
                    baseCalculo: Number(c.baseCalculo),
                    percentualAplicado: Number(c.percentualAplicado),
                    valorComissao: Number(c.valorComissao),

                    venda: c.venda ? {
                        numeroPedido: c.venda.numeroPedido,
                        createdAt: c.venda.createdAt,
                        cliente: c.venda.cliente ? {
                            nomeRazaoSocial: c.venda.cliente.nomeRazaoSocial
                        } : undefined
                    } : undefined
                })),

                valorTotal: Number(comprovanteData.valorTotal),
                valorExtenso: comprovanteData.valorExtenso,

                periodo: {
                    inicio: comprovanteData.periodo.inicio,
                    fim: comprovanteData.periodo.fim
                },

                pagador: {
                    nome: comprovanteData.pagador.nome,
                    cargo: comprovanteData.pagador.cargo
                },

                observacoes: comprovanteData.observacoes
            };

            const response = await fetch(`${API_URL}/comissoes/recibo-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dadosFormatados)
            });

            console.log('📥 Status da resposta PDF:', response.status);

            if (response.ok) {
                // Verificar se a resposta é um PDF ou JSON
                const contentType = response.headers.get('content-type');

                if (contentType?.includes('application/pdf')) {
                    // Resposta é PDF direto
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${isReimpressao ? 'copia-' : ''}recibo-${comprovanteData.vendedor.nome}-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                } else {
                    // Resposta é JSON com base64
                    const result = await response.json();

                    if (result.data) {
                        const pdfBuffer = Buffer.from(result.data, 'base64');
                        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${isReimpressao ? 'copia-' : ''}recibo-${comprovanteData.vendedor.nome}-${format(new Date(), 'dd-MM-yyyy')}.pdf`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                    } else {
                        throw new Error('Resposta não contém dados do PDF');
                    }
                }

                setError(null);
            } else {
                // Tentar ler mensagem de erro
                const errorText = await response.text();
                console.error('❌ Erro na resposta PDF:', response.status, errorText);

                try {
                    const errorJson = JSON.parse(errorText);
                    setError('Erro ao gerar PDF: ' + (errorJson.message || errorJson.error || 'Erro desconhecido'));
                } catch {
                    setError('Erro ao gerar PDF: ' + errorText);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao gerar PDF:', error);
            setError('Erro de conexão ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        } finally {
            setGerandoPDF(false);
        }
    };

    const reimprimirRecibo = async (recibo: ReciboEmitido) => {
        if (!token) return;
        
        setGerandoPDF(true);
        try {
            const comprovante: ComprovanteData = {
                numeroRecibo: recibo.numeroRecibo,
                dataPagamento: recibo.dataPagamento,
                vendedor: recibo.vendedor,
                comissoes: recibo.comissoes,
                valorTotal: recibo.valorTotal,
                valorExtenso: numeroPorExtenso(recibo.valorTotal),
                periodo: recibo.periodo,
                pagador: currentUser,
                observacoes: 'Reimpressão de recibo'
            };

            setComprovanteData(comprovante);
            setIsReimpressao(true);
            setShowReciboDialog(true);
        } catch (error) {
            console.error('Erro ao preparar reimpressão:', error);
            alert('Erro ao preparar reimpressão do recibo');
        } finally {
            setGerandoPDF(false);
        }
    };

    const handleAssinar = () => {
        alert('Funcionalidade de assinatura digital será implementada em breve');
    };

    const hasSelecionadas = comissoes.some(c => c.selected);

    // Mostrar loading enquanto verifica o token
    if (checkingToken) {
        return (
            <div className="bg-slate-50 min-h-screen font-sans">
                <HeaderEnterprise />
                <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600">Verificando autenticação...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Se não tiver token após a verificação, mostrar erro
    if (!token) {
        return (
            <div className="bg-slate-50 min-h-screen font-sans">
                <HeaderEnterprise />
                <div className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-rose-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">Erro de autenticação</h2>
                    <p className="text-slate-600 mt-2">Token não encontrado. Faça login novamente.</p>
                    <Button
                        onClick={() => window.location.href = '/login'}
                        className="mt-4 bg-slate-900 text-white"
                    >
                        Ir para Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <HeaderEnterprise />

            <main className="p-4 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-2">
                            <DollarSign className="h-6 w-6" />
                            Pagamento de Comissões
                        </h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                            Selecione as comissões e processe o pagamento com recibo
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={carregarComissoes}
                        disabled={loading}
                        className="border-slate-300"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>

                {/* Mensagem de erro */}
                {error && (
                    <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-rose-500" />
                        <p className="text-sm text-rose-700">{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setError(null)}
                            className="ml-auto text-rose-700 hover:bg-rose-100"
                        >
                            Fechar
                        </Button>
                    </div>
                )}

                {/* Abas */}
                <div className="flex gap-2 mb-4 border-b">
                    <button
                        className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${abaAtiva === 'pendentes'
                            ? 'text-slate-900 border-b-2 border-slate-900'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                        onClick={() => setAbaAtiva('pendentes')}
                    >
                        Comissões a Pagar
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${abaAtiva === 'recibos'
                            ? 'text-slate-900 border-b-2 border-slate-900'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                        onClick={() => setAbaAtiva('recibos')}
                    >
                        Histórico de Recibos
                    </button>
                </div>

                {abaAtiva === 'pendentes' ? (
                    <>
                        {/* Filtros */}
                        <FiltrosComponent
                            dataInicio={filtros.dataInicio}
                            dataFim={filtros.dataFim}
                            vendedorId={filtros.vendedorId}
                            vendedores={vendedores}
                            onDataInicioChange={(value) => setFiltros(prev => ({ ...prev, dataInicio: value }))}
                            onDataFimChange={(value) => setFiltros(prev => ({ ...prev, dataFim: value }))}
                            onVendedorChange={(value) => setFiltros(prev => ({ ...prev, vendedorId: value }))}
                            onBuscar={carregarComissoes}
                            onLimpar={limparFiltros}
                        />

                        {/* Resumo do Pagamento */}
                        {hasSelecionadas && (
                            <div className="mt-4">
                                <ResumoPagamentoCard
                                    resumo={resumo}
                                    observacoes={observacoes}
                                    onObservacoesChange={setObservacoes}
                                    onProcessarPagamento={processarPagamento}
                                    onGerarRecibo={() => {
                                        setIsReimpressao(false);
                                        setShowReciboDialog(true);
                                    }}
                                    processing={processing}
                                    hasSelecionadas={hasSelecionadas}
                                />
                            </div>
                        )}

                        {/* Tabela de Comissões */}
                        <div className="mt-4">
                            <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader className="bg-white border-b py-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                                            <Receipt className="h-4 w-4" />
                                            Comissões
                                        </CardTitle>
                                        <Badge variant="outline" className="text-xs">
                                            {comissoes.filter(c => c.status === 'LIBERADA').length} a pagar • {comissoes.filter(c => c.status === 'PAGA').length} pagas
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ComissoesTable
                                        comissoes={comissoes}
                                        onSelectAll={handleSelectAll}
                                        onSelectOne={handleSelectOne}
                                        onReimprimirRecibo={(comissao) => {
                                            // Buscar dados completos para reimpressão
                                            const recibo: ReciboEmitido = {
                                                id: comissao.id,
                                                numeroRecibo: `REC-${comissao.dataPagamento?.split('T')[0]}-${comissao.vendedorId.substring(0, 4)}`,
                                                dataPagamento: comissao.dataPagamento || new Date().toISOString(),
                                                vendedorId: comissao.vendedorId,
                                                vendedorNome: comissao.vendedor?.nome || '',
                                                vendedor: comissao.vendedor!,
                                                valorTotal: comissao.valorComissao,
                                                comissoes: [comissao],
                                                periodo: {
                                                    inicio: filtros.dataInicio,
                                                    fim: filtros.dataFim
                                                }
                                            };
                                            reimprimirRecibo(recibo);
                                        }}
                                        loading={loading}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : (
                    /* Histórico de Recibos */
                    <RecibosEmitidosSection
                        onReimprimirRecibo={reimprimirRecibo}
                        token={token}
                    />
                )}

                {/* Dialog do Recibo */}
                <ReciboDialog
                    open={showReciboDialog}
                    onOpenChange={setShowReciboDialog}
                    comprovante={comprovanteData}
                    onGerarPDF={gerarReciboPDF}
                    onAssinar={handleAssinar}
                    gerandoPDF={gerandoPDF}
                    isReimpressao={isReimpressao}
                    multiplosVendedores={multiplosVendedores}
                    vendedoresCount={multiplosVendedores ? Object.keys(comissoes.filter(c => c.selected).reduce((acc, c) => {
                        acc[c.vendedorId] = true;
                        return acc;
                    }, {} as Record<string, boolean>)).length : 0}
                />

                {/* Se houver múltiplos recibos, mostrar um seletor */}
                {multiplosVendedores && showReciboDialog && recibosGerados.length > 1 && (
                    <div className="fixed bottom-4 right-4 z-50">
                        <Card className="shadow-lg border-blue-200">
                            <CardContent className="p-3">
                                <p className="text-xs font-bold mb-2">Múltiplos recibos gerados:</p>
                                <div className="flex gap-2">
                                    {recibosGerados.map((recibo, index) => (
                                        <Button
                                            key={index}
                                            size="sm"
                                            variant={comprovanteData?.vendedor.id === recibo.vendedor.id ? "default" : "outline"}
                                            onClick={() => setComprovanteData(recibo)}
                                            className="text-xs"
                                        >
                                            {recibo.vendedor.nome.split(' ')[0]}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}