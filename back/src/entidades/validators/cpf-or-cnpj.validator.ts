import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions
} from 'class-validator';

@ValidatorConstraint({ name: 'cpfOrCnpj', async: false })
export class CpfOrCnpjValidator implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (!value) return false;
    
    const cleanValue = value.replace(/\D/g, '');
    const tipoPessoa = args.object['tipo_pessoa'];
    
    if (!tipoPessoa) {
      // Se não tiver tipo_pessoa, aceita qualquer um dos dois
      if (cleanValue.length === 11) {
        return this.validateCPF(cleanValue);
      } else if (cleanValue.length === 14) {
        return this.validateCNPJ(cleanValue);
      }
      return false;
    }
    
    if (tipoPessoa === 'F' && cleanValue.length === 11) {
      return this.validateCPF(cleanValue);
    } else if (tipoPessoa === 'J' && cleanValue.length === 14) {
      return this.validateCNPJ(cleanValue);
    }
    
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    const tipoPessoa = args.object['tipo_pessoa'];
    const value = args.value || '';
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length === 11) {
      if (tipoPessoa === 'J') {
        return 'CPF não é válido para Pessoa Jurídica. Use um CNPJ.';
      }
      return 'CPF inválido';
    } else if (cleanValue.length === 14) {
      if (tipoPessoa === 'F') {
        return 'CNPJ não é válido para Pessoa Física. Use um CPF.';
      }
      return 'CNPJ inválido';
    }
    
    return tipoPessoa === 'F' 
      ? 'CPF inválido (deve ter 11 dígitos)' 
      : 'CNPJ inválido (deve ter 14 dígitos)';
  }

  private validateCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    let resto;
    
    // Validação do primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  }

  private validateCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    // Validação do primeiro dígito verificador
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    // Validação do segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;
    
    return true;
  }
}

export function IsCpfOrCnpj(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCpfOrCnpj',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: CpfOrCnpjValidator,
      constraints: []
    });
  };
}