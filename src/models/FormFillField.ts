import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class FormFillField extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: string;

    @Column()
    name?: string;

    @Column()
    queryClass?: string;
    @Column()
    queryClassIndex?: number;

    @Column()
    queryId?: string;

    @Column()
    value!: string;

    getQueryElementExpression(): string {
        if(this.queryId) {
            return "document.getElementById('" + this.queryId + "')";
        } else if(this.queryClass && this.queryClassIndex) {
            return "document.getElementByClassName('" + this.queryClass + "')[" + this.queryClassIndex + "]";
        } else {
            throw new Error("Either queryId or (queryClass and queryClassIndex) must be specified");
        }
    }

    getSetValueExpression() {
        return this.getQueryElementExpression() + ".value='" + this.value + "';";
    }

}