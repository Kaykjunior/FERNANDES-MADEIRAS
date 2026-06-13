import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { VendasService } from './vendas.service';
import { PdfService } from 'src/vendas/pdf.service';

@Controller('vendas/documentos')
export class VendasPdfController {
  constructor(
    private readonly vendasService: VendasService,
    private readonly pdfService: PdfService,
  ) {}

  @Get(':id/comprovante')
  async gerarComprovante(@Param('id') id: string, @Res() res: Response) {
    try {
      // Use o novo método que inclui o endereço
      const venda = await this.vendasService.findOneWithEndereco(id);
      
      const pdfBuffer = await this.pdfService.gerarComprovanteVendaPdf(venda);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="pedido_${id.substring(0,8)}.pdf"`,
      });

      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erro ao gerar comprovante',
        error: error.message
      });
    }
  }
}