// src/comissoes/recibo-pdf.service.ts
import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';
import { generatePdf } from 'html-pdf-node';
import { GerarReciboDto } from './dto/gerar-recibo.dto';

@Injectable()
export class ReciboPdfService {
  async gerarReciboPagamento(dados: GerarReciboDto): Promise<Buffer> {
    const templatePath = path.join(process.cwd(), 'src', 'comissoes', 'templates', 'recibo-pagamento.ejs');
    
    // Verificar se o template existe
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template não encontrado em: ${templatePath}`);
    }

    // Formatar dados
    const dadosFormatados = {
      ...dados,
      valorTotal: Number(dados.valorTotal),
      comissoes: dados.comissoes.map(c => ({
        ...c,
        baseCalculo: Number(c.baseCalculo),
        valorComissao: Number(c.valorComissao),
        percentualAplicado: Number(c.percentualAplicado)
      }))
    };

    try {
      const htmlContent = await ejs.renderFile(templatePath, dadosFormatados);

      return new Promise((resolve, reject) => {
        const options = {
          format: 'A4',
          landscape: false,
          margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
          printBackground: true,
          preferCSSPageSize: true
        };

        const file = { content: htmlContent };
        generatePdf(file, options, (error, buffer) => {
          if (error) {
            reject(error);
          } else {
            resolve(buffer);
          }
        });
      });
    } catch (error) {
      console.error('Erro ao gerar recibo PDF:', error);
      throw error;
    }
  }
}