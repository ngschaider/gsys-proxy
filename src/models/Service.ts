import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import ServiceUser from "./ServiceUser";

export enum ServiceType {
    PVE = "pve",
    PhpMyAdmin = "phpmyadmin",
    Transparent = "transparent",
}

export type ServiceProtocol = "http" | "https";

@Entity()
export default class Service extends BaseEntity {

    @PrimaryColumn()
    name!: string;

    @Column()
    type!: ServiceType;

    @OneToMany(type => ServiceUser, serviceUser => serviceUser.service, {
        onDelete: "NO ACTION",
        eager: true,
    })
    serviceUsers!: ServiceUser[];

    @Column()
    hostname!: string;

    @Column()
    targetHost!: string;

    @Column()
    targetPort!: string;
    
    @Column()
    protocol!: ServiceProtocol;

}