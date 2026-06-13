export enum StatusContaPagar {
  PENDENTE   = 'PENDENTE',
  PAGO       = 'PAGO',
  VENCIDO    = 'VENCIDO',
  CANCELADO  = 'CANCELADO',
  PARCIAL    = 'PARCIAL',
}

export enum FormaPagamento {
  DINHEIRO    = 'DINHEIRO',
  PIX         = 'PIX',
  BOLETO      = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO  = 'CARTAO_DEBITO',
  CHEQUE      = 'CHEQUE',
}

export enum TipoRecorrencia {
  DIARIA    = 'DIARIA',
  SEMANAL   = 'SEMANAL',
  MENSAL    = 'MENSAL',
  BIMESTRAL = 'BIMESTRAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL     = 'ANUAL',
}

export enum TipoDespesa {
  INSUMO       = 'INSUMO',
  SALARIO      = 'SALARIO',
  SERVICO      = 'SERVICO',
  UTILIDADE    = 'UTILIDADE',   // água, luz, internet
  MATERIAL     = 'MATERIAL',
  RETIRADA     = 'RETIRADA',
  IMPOSTO      = 'IMPOSTO',
  ALUGUEL      = 'ALUGUEL',
  MANUTENCAO   = 'MANUTENCAO',
  TRANSPORTE   = 'TRANSPORTE',
  OUTRO        = 'OUTRO',
}