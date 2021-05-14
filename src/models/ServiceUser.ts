import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Service from "./Service";
import User from "./User";

@Entity()
export default class ServiceUser extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(type => User, user => user.serviceUsers)
    user!: User;

    @ManyToOne(type => Service, service => service.serviceUsers)
    service!: Service;

    @Column()
    username: string = "";

    @Column()
    password: string = "";

    @Column()
    additionalInfo: string = "";

}