export interface Entidade {
    id:               string;
    tipoEntidade:     string;
    tipoPessoa:       string;
    documento:        string;
    rgIe:             null;
    indicadorIe:      number;
    nomeRazaoSocial:  string;
    nomeFantasia:     string;
    email:            string;
    telefone:         string;
    celular:          string;
    observacoes:      string;
    regimeTributario: null;
    createdAt:        Date;
    updatedAt:        Date;
    deletedAt:        null;
}