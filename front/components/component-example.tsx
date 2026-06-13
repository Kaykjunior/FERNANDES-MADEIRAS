// Exemplo de estrutura para a Tela de Nova Venda
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function VendaEnterprise() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      <header className="flex justify-between items-center mb-6 border-b pb-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">DIM MADEIRAS - Gestão Comercial</h1>
          <p className="text-sm text-muted-foreground">Emissão de Pedido / Nota Fiscal</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-amber-600 text-amber-600">Salvar Orçamento</Button>
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">FINALIZAR VENDA (F10)</Button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Lado Esquerdo: Dados do Cliente e Itens */}
        <div className="col-span-9 space-y-6">
          <Card className="shadow-md border-slate-200">
            <CardHeader className="bg-slate-100 py-3">
              <CardTitle className="text-sm uppercase font-semibold text-slate-600">Dados do Cliente & Vendedor</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 pt-4">
              <Input placeholder="CPF/CNPJ do Cliente" className="bg-white" />
              <Input placeholder="Nome do Cliente / Razão Social" disabled className="bg-slate-50" />
              <Input placeholder="Vendedor Responsável" className="bg-white" />
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200">
            <CardHeader className="bg-slate-100 py-3 flex flex-row justify-between items-center">
              <CardTitle className="text-sm uppercase font-semibold text-slate-600">Itens do Pedido</CardTitle>
              <Button size="sm" variant="secondary">+ Adicionar Produto</Button>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[100px]">Cód. Lote</TableHead>
                    <TableHead>Descrição do Produto</TableHead>
                    <TableHead className="text-right">Qtd (m³)</TableHead>
                    <TableHead className="text-right">Vlr. Tabela</TableHead>
                    <TableHead className="text-right">Desc. (%)</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Exemplo de linha de item */}
                  <TableRow>
                    <TableCell className="font-mono text-xs text-blue-700">LT-2024-001</TableCell>
                    <TableCell>Viga de Eucalipto Tratado - 50mm x 150mm x 3m</TableCell>
                    <TableCell className="text-right font-medium">10,500</TableCell>
                    <TableCell className="text-right">R$ 1.200,00</TableCell>
                    <TableCell className="text-right text-red-600 font-bold">5%</TableCell>
                    <TableCell className="text-right font-bold">R$ 11.970,00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Resumo Financeiro e Fiscal */}
        <div className="col-span-3 space-y-6">
          <Card className="bg-slate-800 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Resumo da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-slate-300">
                <span>Total Bruto:</span>
                <span>R$ 12.600,00</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>Desconto Total:</span>
                <span>- R$ 630,00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Comissão Prevista:</span>
                <span className="text-amber-400 font-semibold">R$ 359,10</span>
              </div>
              <div className="border-t border-slate-600 pt-4 flex justify-between text-xl font-black">
                <span>TOTAL:</span>
                <span className="text-emerald-400">R$ 11.970,00</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="py-3">
              <CardTitle className="text-xs uppercase text-amber-800 font-bold">Status Fiscal (Rastreabilidade)</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-amber-900">
                <div className="flex justify-between italic">
                    <span>Espécie:</span>
                    <span>Eucalipto</span>
                </div>
                <div className="flex justify-between font-mono">
                    <span>DOF Original:</span>
                    <span>39281-PR</span>
                </div>
                <Badge className="bg-amber-600 w-full justify-center mt-2">Pronto para Emissão NF-e</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}