import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';
import { generatePdf } from 'html-pdf-node';

@Injectable()
export class PdfService {
    async gerarTabelaCompletaPdf(dadosParaTemplate: any): Promise<Buffer> {
        // Caminho da logo
        const logoPath = path.join(process.cwd(), 'src', 'assests', 'logo-madeira.jpeg');
        let logoDataUri = '';

        try {
            if (fs.existsSync(logoPath)) {
                const bitmap = fs.readFileSync(logoPath);
                logoDataUri = `data:image/jpeg;base64,${bitmap.toString('base64')}`;
            } else {
                console.warn(`Logo não encontrada em: ${logoPath}`);
                // Placeholder simples
                logoDataUri = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+PC9zdmc+';
            }
        } catch (error: any) {
            console.error("Erro ao converter imagem:", error.message);
        }

        // Preparar dados para o template
        const data = {
            ...dadosParaTemplate,
            logoDataUri: logoDataUri
        };

        // Caminho do template
        const templatePath = path.join(process.cwd(), 'src', 'produtos', 'templates', 'tabela-completa.ejs');

        try {
            // Renderizar HTML com EJS
            const htmlContent = await ejs.renderFile(templatePath, data);

            // Gerar PDF com html-pdf-node
            const pdfBuffer = await this.generatePdfFromHtml(htmlContent);
            
            return pdfBuffer;
        } catch (error: any) {
            console.error('Erro ao gerar PDF:', error);
            throw new Error(`Falha ao gerar PDF: ${error.message}`);
        }
    }



    async gerarTabelaEspecialPdf(dadosParaTemplate: any): Promise<Buffer> {
        // Caminho da logo
        const logoPath = path.join(process.cwd(), 'src', 'assests', 'logo-madeira.jpeg');
        let logoDataUri = '';

        try {
            if (fs.existsSync(logoPath)) {
                const bitmap = fs.readFileSync(logoPath);
                logoDataUri = `data:image/jpeg;base64,${bitmap.toString('base64')}`;
            } else {
                console.warn(`Logo não encontrada em: ${logoPath}`);
                // Placeholder simples
                logoDataUri = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+PC9zdmc+';
            }
        } catch (error: any) {
            console.error("Erro ao converter imagem:", error.message);
        }

        // Preparar dados para o template
        const data = {
            ...dadosParaTemplate,
            logoDataUri: logoDataUri
        };

        // Caminho do template
        const templatePath = path.join(process.cwd(), 'src', 'produtos', 'templates', 'tabela-especial.ejs');

        try {
            // Renderizar HTML com EJS
            const htmlContent = await ejs.renderFile(templatePath, data);

            // Gerar PDF com html-pdf-node
            const pdfBuffer = await this.generatePdfFromHtml(htmlContent);
            
            return pdfBuffer;
        } catch (error: any) {
            console.error('Erro ao gerar PDF:', error);
            throw new Error(`Falha ao gerar PDF: ${error.message}`);
        }
    }


    private async generatePdfFromHtml(html: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const options = {
                format: 'A4',
                landscape: true, // ← MODO PAISAGEM/HORIZONTAL
                margin: {
                    top: '15mm',    // Aumentei um pouco as margens
                    right: '15mm',
                    bottom: '15mm',
                    left: '15mm'
                },
                printBackground: true,
                preferCSSPageSize: false, // IMPORTANTE: false quando usar landscape
                displayHeaderFooter: false
            };

            const file = { content: html };
            
            generatePdf(file, options, (error: Error | null, buffer: Buffer) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(buffer);
                }
            });
        });
    }
}