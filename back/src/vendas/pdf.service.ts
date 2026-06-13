import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';
import { generatePdf } from 'html-pdf-node';
import { Venda } from './entities/venda.entity';

@Injectable()
export class PdfService {
  async gerarComprovanteVendaPdf(vendaComEndereco: any): Promise<Buffer> {
    console.log('=== GERANDO PDF ===');
    console.log('Venda ID:', vendaComEndereco.venda?.id || vendaComEndereco.id);
    console.log('Endereço encontrado:', vendaComEndereco.enderecoEntrega);

    // Verifique qual estrutura está sendo recebida
    const venda = vendaComEndereco.venda || vendaComEndereco;
    const enderecoEntrega = vendaComEndereco.enderecoEntrega;

    // Caminho da logo - igual ao que funcionava antes
    const logoPath = path.join(process.cwd(), 'src', 'assests', 'logo-madeira.jpeg'); // Note: 'assests' com dois 's'
    let logoDataUri = 'data:image/svg+xml;base64,...';

    if (fs.existsSync(logoPath)) {
      console.log('Logo encontrada em:', logoPath);
      const bitmap = fs.readFileSync(logoPath);
      logoDataUri = `data:image/jpeg;base64,${bitmap.toString('base64')}`;
    } else {
      console.warn(`Logo não encontrada em: ${logoPath}`);
      console.log('Tentando caminho alternativo...');

      // Tenta caminhos alternativos
      const pathsToTry = [
        path.join(process.cwd(), 'src', 'assests', 'logo-madeira.jpeg'),
        path.join(process.cwd(), 'src', 'assets', 'logo-madeira.jpeg'),
        path.join(process.cwd(), 'public', 'logo-madeira.jpeg'),
        path.join(process.cwd(), 'logo-madeira.jpeg')
      ];

      let found = false;
      for (const testPath of pathsToTry) {
        if (fs.existsSync(testPath)) {
          console.log(`Logo encontrada em: ${testPath}`);
          const bitmap = fs.readFileSync(testPath);
          logoDataUri = `data:image/jpeg;base64,${bitmap.toString('base64')}`;
          found = true;
          break;
        }
      }

      if (!found) {
        console.warn('Logo não encontrada em nenhum caminho, usando placeholder');
        // Placeholder SVG simples com o nome da empresa
        const svg = `<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#1a365d"/>
          <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" 
                text-anchor="middle" dy=".3em" font-weight="bold">REI MADEIRAS</text>
        </svg>`;
        logoDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      }
    }

    const templatePath = path.join(process.cwd(), 'src', 'vendas', 'templates', 'comprovante-venda.ejs');
    console.log('Template path:', templatePath);

    // Verifique se o template existe
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template não encontrado em: ${templatePath}`);
    }

    // Formatar dados antes de enviar para o template
    const vendaFormatada = {
      ...venda,
      numeroPedido: venda.numeroPedido,
      enderecoEntrega: enderecoEntrega, // Adiciona o endereço aqui
      valorProdutos: parseFloat(venda.valorProdutos) || 0,
      valorFrete: parseFloat(venda.valorFrete) || 0,
      valorDesconto: parseFloat(venda.valorDesconto) || 0,
      valorTotal: parseFloat(venda.valorTotal) || 0,
      itens: venda.itens?.map(item => ({
        ...item,
        valorUnitario: parseFloat(item.valorUnitario) || 0,
        valorDesconto: parseFloat(item.valorDesconto) || 0,
        valorSubtotal: parseFloat(item.valorSubtotal) || 0
      })) || []
    };
    console.log(JSON.stringify(Venda))
    console.log('Dados formatados para template:', {
      numeroPedido: vendaFormatada.numeroPedido,
      id: vendaFormatada.id,
      cliente: vendaFormatada.cliente?.nomeRazaoSocial,
      itensCount: vendaFormatada.itens?.length,
      endereco: vendaFormatada.enderecoEntrega ? 'SIM' : 'NÃO'
    });

    try {
      const htmlContent = await ejs.renderFile(templatePath, {
        venda: vendaFormatada,
        logoDataUri
      });

      console.log('Template renderizado com sucesso, tamanho HTML:', htmlContent.length);

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
            console.error('Erro ao gerar PDF:', error);
            reject(error);
          } else {
            console.log('PDF gerado com sucesso, tamanho:', buffer?.length, 'bytes');
            resolve(buffer);
          }
        });
      });
    } catch (templateError) {
      console.error('Erro ao renderizar template:', templateError);
      throw templateError;
    }
  }
}