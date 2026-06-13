import { Controller, Get, Res, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express'; // Use import type aqui
import { ProdutosService } from './produtos.service';
import { PdfService } from './pdf.service';

@Controller('relatorios')
export class ProdutosPdfController {
    private readonly logger = new Logger(ProdutosPdfController.name);

    constructor(
        private readonly produtosService: ProdutosService,
        private readonly pdfService: PdfService,
    ) { }

    @Get('tabela-precos')
    async downloadTabelaCompleta(@Res() res: Response) {
        try {
            const dadosRelatorio = await this.produtosService.getDadosParaRelatorio();
            const pdfBuffer = await this.pdfService.gerarTabelaCompletaPdf(dadosRelatorio);

            // Configurar headers
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="tabela_precos_cia_rei.pdf"',
                'Content-Length': pdfBuffer.length.toString()
            });

            // Enviar o buffer PDF
            res.send(pdfBuffer);
        } catch (error) {
            this.logger.error('Erro ao gerar PDF:', error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Erro ao gerar o arquivo PDF',
                error: error.message,
            });
        }
    }




    @Get('tabela-especial')
    async downloadTabelaEspecial(@Res() res: Response) {
        try {
            const dadosRelatorio = await this.produtosService.getDadosParaRelatorio();
            const pdfBuffer = await this.pdfService.gerarTabelaEspecialPdf(dadosRelatorio);

            // Configurar headers
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="tabela_precos_cia_rei.pdf"',
                'Content-Length': pdfBuffer.length.toString()
            });

            // Enviar o buffer PDF
            res.send(pdfBuffer);
        } catch (error) {
            this.logger.error('Erro ao gerar PDF:', error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Erro ao gerar o arquivo PDF',
                error: error.message,
            });
        }
    }
}