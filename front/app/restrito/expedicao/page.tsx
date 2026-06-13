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
  Printer,
  ChevronRight,
  PackageCheck,
  Navigation,
  ExternalLink
} from "lucide-react";
import HeaderEnterprise from "@/components/header";

export default function GestaoLogisticaExpedicao() {
  return (
    <div className="bg-slate-100 min-h-screen font-sans pb-10">
      <HeaderEnterprise />

      {/* HEADER LOGÍSTICO */}
      <header className="bg-slate-900 text-white p-4 md:p-6 mb-4 md:mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">Painel de Escoamento e Logística</h1>
              <Badge className="bg-amber-500 text-slate-900 text-[10px] font-black uppercase border-none">Em Montagem</Badge>
            </div>
            <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-widest mt-1">
              ID Romaneio: <span className="text-white">ROM-2026-088</span> | Unidade Logística DIM Madeiras
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none border-slate-700 text-white bg-slate-800 uppercase text-[10px] h-9">
              <Printer className="mr-2 h-4 w-4" /> Ordem de Carga
            </Button>
            <Button className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] h-9 px-6">
              <Navigation className="mr-2 h-4 w-4" /> Liberar Trânsito
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6">
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          
          {/* COLUNA ESQUERDA: DADOS DO VEÍCULO E CAPACIDADE */}
          <div className="col-span-12 lg:col-span-4 space-y-4 md:space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
              <CardHeader className="bg-slate-50 border-b py-3">
                <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Manifesto do Transportador
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">Motorista</Label>
                    <Input defaultValue="João Marcos Pereira" className="text-sm font-bold h-9 bg-slate-50/50" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">Documento (CPF)</Label>
                    <Input defaultValue="000.444.888-22" className="text-sm h-9 bg-slate-50/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">Placa Cavalo</Label>
                    <Input defaultValue="KRA-5J12" className="text-sm font-mono font-bold h-9 uppercase text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">Placa Reboque</Label>
                    <Input defaultValue="LPR-9921" className="text-sm font-mono font-bold h-9 uppercase text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1 pt-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Transportadora Proprietária</Label>
                  <Input defaultValue="LOG-MADEIRAS EXPRESS LTDA" className="text-sm h-9 font-black" />
                </div>
              </CardContent>
            </Card>

            {/* MONITOR DE CAPACIDADE REAL-TIME (Tabela romaneios do BD) */}
            <Card className="bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden border-none">
              <div className="bg-blue-600 p-3 text-white text-[10px] font-black uppercase text-center tracking-widest">
                Análise de Carga Real vs. Capacidade do Caminhão
              </div>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1 uppercase"><Scale className="h-3 w-3" /> Peso Bruto Estimado</span>
                    <span className="text-slate-900 font-black">28.450 kg / 32.000 kg</span>
                  </div>
                  <Progress value={88} className="h-2 bg-slate-100" />
                  <p className="text-[10px] text-right text-slate-400 italic font-bold">Capacidade Utilizada: 88%</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t text-center">
                  <div className="border-r border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Cubagem Total</p>
                    <p className="text-xl font-black text-slate-800 tracking-tight">42.15 m³</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Qtd de Itens</p>
                    <p className="text-xl font-black text-slate-800 tracking-tight">2.450 un</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLUNA DIREITA: COMPOSIÇÃO DE VENDAS DO ROMANEIO */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <Card className="shadow-sm border-none ring-1 ring-slate-200 overflow-hidden bg-white">
              <CardHeader className="py-3 px-4 border-b bg-slate-50/80 flex flex-row justify-between items-center gap-2">
                <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                  <PackageCheck className="h-4 w-4" /> Ordens de Venda Consolidadas
                </CardTitle>
                <Button size="sm" variant="outline" className="text-[10px] font-black uppercase h-7 border-slate-300">
                  + Vincular Pedido
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-100/50">
                      <TableRow>
                        <TableHead className="w-[120px] text-[10px] font-black uppercase text-slate-500">Pedido</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500">Destinatário / Localidade</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">Itens</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-right">M³</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-right">Peso (Kg)</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { id: "PED-8042", cliente: "CONSTRUTORA ALVORADA", local: "BH / MG", un: "450", m3: "12,40", kg: "8.400" },
                        { id: "PED-8045", cliente: "HARAS SÃO FRANCISCO", local: "BETIM / MG", un: "1.200", m3: "18,25", kg: "12.150" },
                        { id: "PED-8050", cliente: "REVENDA MADEIRAS S.A.", local: "CONTAGEM / MG", un: "800", m3: "11,50", kg: "7.900" },
                      ].map((row, i) => (
                        <TableRow key={i} className="hover:bg-slate-50/80 transition-colors border-b last:border-none">
                          <TableCell className="py-3">
                            <p className="text-[11px] font-black text-blue-700">{row.id}</p>
                            <Badge variant="outline" className="text-[8px] font-black uppercase h-4 px-1 border-slate-300">NF-e Autorizada</Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-[10px] font-black text-slate-700 uppercase">{row.cliente}</p>
                            <p className="text-[9px] font-medium text-slate-400 flex items-center gap-1 uppercase"><Navigation className="h-2 w-2" /> {row.local}</p>
                          </TableCell>
                          <TableCell className="text-center font-black text-slate-900 text-[11px]">{row.un}</TableCell>
                          <TableCell className="text-right font-black text-slate-800 text-[11px]">{row.m3}</TableCell>
                          <TableCell className="text-right font-black text-slate-800 text-[11px]">{row.kg}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600"><ExternalLink className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* BLOCO DE ALERTAS E DOF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm">
                <div className="bg-emerald-600 p-2 rounded text-white shadow-lg">
                  <FileSearch className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase leading-none">Rastreabilidade Florestal</p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-bold">7 de 7 ITENS COM DOF ATIVOS</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                <div className="bg-blue-500 p-2 rounded text-white shadow-lg">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-100 uppercase leading-none">Seguro de Carga</p>
                  <p className="text-[11px] text-blue-300 mt-1 font-bold italic uppercase">Averbação Automatizada</p>
                </div>
              </div>
            </div>

            {/* ÁREA DE NOTAS E OBSERVAÇÕES LOGÍSTICAS */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
              <CardHeader className="py-2 border-b bg-slate-50/50">
                <CardTitle className="text-[10px] font-black text-slate-600 uppercase">Instruções de Rota e Entrega</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <textarea 
                  className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Entrega após às 14h, entrar pelo portão lateral da fazenda..."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}