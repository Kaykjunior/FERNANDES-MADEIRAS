import { ValueTransformer } from 'typeorm';

export class ColumnNumericTransformer implements ValueTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    // Cuidado: parseFloat pode perder precisão em cálculos muito pequenos, 
    // mas para API REST geralmente é o comportamento esperado. 
    // Para cálculos internos, use bibliotecas como decimal.js
    return parseFloat(data);
  }
}