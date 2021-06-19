import { stringify } from "querystring";
import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import ServiceUser from "./ServiceUser";

export enum ServiceType {
    PVE = "pve",
    PhpMyAdmin = "phpmyadmin",
    Transparent = "transparent",
}

export type ServiceProtocol = "http" | "https";

@Entity()
export default class Service extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

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

    withoutHiddenFields() {
        return {
            hostname: this.hostname,
            targetHost: this.targetHost,
            targetPort: this.targetPort,
            protocol: this.protocol,
            type: this.type,
            id: this.id,
        }
    }

}