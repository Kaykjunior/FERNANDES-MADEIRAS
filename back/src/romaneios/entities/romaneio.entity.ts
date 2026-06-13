import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum StatusRomaneio {
  EM_ABERTO = 'EM_ABERTO',
  ENVIADO = 'ENVIADO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO'
}

@Entity('romaneios')
export class Romaneio {
  // PARA POSTGRESQL: PrimaryGeneratedColumn com 'uuid'
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  codigo: string;

  @Column({
    type: 'enum',
    enum: StatusRomaneio,
    default: StatusRomaneio.EM_ABERTO,
  })
  status: StatusRomaneio;

  // PARA POSTGRESQL: Use 'uuid' SEM 'length'
  @Column({
    type: 'uuid',
    name: 'transportadora_id',
    nullable: true,
  })
  transportadoraId: string;

  @Column({
    type: 'uuid',
    name: 'motorista_id',
    nullable: true,
  })
  motoristaId: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'placa_veiculo',
    nullable: true,
  })
  placaVeiculo: string;

  @Column({
    type: 'timestamptz',
    name: 'data_envio',
    nullable: true,
  })
  dataEnvio: Date;

  @Column({
    type: 'timestamptz',
    name: 'data_entrega',
    nullable: true,
  })
  dataEntrega: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  observacoes: string;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMPtimestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMPtimestamptz',
    onUpdate: 'CURRENT_TIMESTAMPtimestamptz',
  })
  updatedAt: Date;
}
