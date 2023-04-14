import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Service from "./Service";
import User from "./User";

@Entity()
export default class ServiceUser extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(type => User, user => user.serviceUsers, {
        onDelete: "CASCADE",
    })
    user!: Promise<User>;

    @ManyToOne(type => Service, service => service.serviceUsers, {
        onDelete: "CASCADE",
    })
    service!: Promise<Service>;

    async preRequest() {
        const service = await this.service;
        if(!service) {
            console.log("No Service found for ServiceUser '" + this.id + "'");
            return;
        }
    }
    
}