import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Session from "./Session";
import ServiceUser from "./ServiceUser";

@Entity()
export default class User extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    firstName: string = "";

    @Column()
    lastName: string = "";

    @Column()
    username: string = "";

    @Column()
    passwordHash: string = "";

    @Column()
    email: string = "";

    @OneToMany(type => Session, session => session.user, {
        onDelete: "NO ACTION",
    })
    sessions!: Session[];

    @OneToMany(type => ServiceUser, serviceUser => serviceUser.user, {
        eager: true,
        onDelete: "NO ACTION",
    })
    serviceUsers!: ServiceUser[];

}