import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Truck, 
  Scale, 
  User, 
  Calendar, 
  FileSearch, 
  AlertCircle, 
  History, 
  Printer,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import HeaderEnterprise from "@/components/header";

export default function GestaoExpedicaoCorporativa() {
  return (
    <div className="bg-slate-100 min-h-screen font-sans pb-10">
      <HeaderEnterprise/>

      {/* HEADER DA PÁGINA - Ajustado para empilhar em mobile */}
      <header className="bg-slate-900 text-white p-4 md:p-6 mb-4 md:mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter">CONSOLIDAÇÃO DE CARGA S.A.</h1>
            <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-widest mt-1">
              Unidade Logística DIM Madeiras - Módulo de Escoamento
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none border-slate-700 text-white bg-slate-800 uppercase text-[10px] h-9">
              <Printer className="mr-2 h-3 w-3 md:h-4 md:w-4" /> Imprimir
            </Button>
            <Button className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] h-9 px-4">
              Liberar (F10)
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6">
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          
          {/* COLUNA ESQUERDA: DADOS DO FRETE E VEÍCULO */}
          <div className="col-span-12 lg:col-span-4 space-y-4 md:space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader className="bg-slate-50 border-b py-3">
                <CardTitle className="text-xs font-black text-slate-600 uppercase">Informações do Transportador</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">Motorista</Label>
                    <Input placeholder="Nome Completo" className="text-sm font-bold h-9 bg-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">CPF / RG</Label>
                    <Input placeholder="000.000.000-00" className="text-sm h-9 bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">Placa Cavalo / Reboque</Label>
                    <Input placeholder="ABC-1234" className="text-sm font-mono font-bold h-9 bg-white uppercase" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">RNTRC (ANTT)</Label>
                    <Input placeholder="Nº Registro" className="text-sm h-9 bg-white" />
                  </div>
                </div>
                <div className="space-y-1 pt-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Transportadora Responsável</Label>
                  <Input placeholder="Razão Social da Empresa de Frete" className="text-sm h-9 bg-white font-bold" />
                </div>
              </CardContent>
            </Card>

            {/* MONITOR DE CAPACIDADE */}
            <Card className="bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden border-none">
              <div className="bg-blue-600 p-3 text-white text-[10px] font-black uppercase text-center tracking-widest">
                Análise de Carga Real vs. Capacidade
              </div>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1 uppercase"><Scale className="h-3 w-3" /> Peso Bruto</span>
                    <span className="text-slate-900">22.840 kg / 33.000 kg</span>
                  </div>
                  <Progress value={(22840/33000)*100} className="h-2 bg-slate-100" />
                  <p className="text-[10px] text-right text-slate-400 italic">Disponível: 10.160 kg</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t text-center">
                  <div className="border-r border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Cubagem</p>
                    <p className="text-base md:text-lg font-black text-slate-800 tracking-tight">28.42 m³</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Itens (UN)</p>
                    <p className="text-base md:text-lg font-black text-slate-800 tracking-tight">1.842 un</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLUNA DIREITA: GRID DE CLIENTES E ITENS */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <Card className="shadow-sm border-none ring-1 ring-slate-200 overflow-hidden bg-white">
              <CardHeader className="py-3 px-4 border-b bg-slate-50/80 flex flex-row justify-between items-center gap-2">
                <CardTitle className="text-xs font-black text-slate-600 uppercase">Composição da Carga</CardTitle>
                <Button size="sm" variant="outline" className="text-[9px] md:text-[10px] font-bold uppercase h-7">+ Adicionar</Button>
              </CardHeader>
              <CardContent className="p-0">
                {/* Scroll horizontal para tabelas em telas pequenas */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-100/50">
                      <TableRow>
                        <TableHead className="min-w-[150px] text-[10px] font-black uppercase text-slate-500">Destinatário</TableHead>
                        <TableHead className="min-w-[150px] text-[10px] font-black uppercase text-slate-500">Produto</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">Qtd</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-right">Peso</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-right">Vlr. Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { id: "PED-209", cliente: "HARAS SÃO BENTO", prod: "Mourão 12x14 - 2,20m", un: "250", kg: "6.250", total: "4.850,00" },
                        { id: "PED-212", cliente: "CONST. ALVORADA", prod: "Postinho 08x10 - 1,50m", un: "1.200", kg: "14.400", total: "15.600,00" },
                        { id: "PED-215", cliente: "FAZENDA MODELO", prod: "Viga Estrutural 15x15", un: "42", kg: "2.190", total: "2.340,00" },
                      ].map((row, i) => (
                        <TableRow key={i} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="py-3">
                            <p className="text-[11px] font-black text-blue-700">{row.id}</p>
                            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight truncate max-w-[140px]">{row.cliente}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-[11px] text-slate-600 font-medium italic truncate max-w-[140px]">{row.prod}</p>
                          </TableCell>
                          <TableCell className="text-center font-black text-slate-900">{row.un}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-slate-600 whitespace-nowrap">{row.kg} kg</TableCell>
                          <TableCell className="text-right font-black text-xs text-slate-800 whitespace-nowrap">R$ {row.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* OBSERVAÇÕES */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
              <CardHeader className="py-2 border-b bg-slate-50/50">
                <CardTitle className="text-[10px] font-black text-slate-600 uppercase">Observações e Instruções</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <textarea 
                  className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Instruções de entrega..."
                />
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded">
                    <FileSearch className="h-5 w-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-blue-800 uppercase leading-none">Conferência de Pátio</p>
                      <p className="text-[9px] text-blue-600 mt-1 uppercase font-bold tracking-tighter italic">Obrigatório</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                    <AlertCircle className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Compliance Fiscal</p>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-tighter italic">Diferimento Aplicado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}