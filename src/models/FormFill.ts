import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import FormFillField from "./FormFillField";


@Entity()
export default class FormFill extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // @Column()
    // fields!: FormFillField;

    @Column()
    delay!: number;

}