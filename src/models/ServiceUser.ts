import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import PveApi from "../pve/PveApi";
import Service, { ServiceType } from "./Service";
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

    @Column()
    username: string = "";

    @Column()
    password: string = "";

    @Column({type: "text", name: "data"})
    private _data: string = "";

    get data(): any {
        if(!this._data) return {};
        return JSON.parse(this._data);
    }

    set data(value: any) {
        this._data = JSON.stringify(value);
    }

    @Column({type: "timestamp"})
    tokenCreated!: Date;

    async preRequest() {
        const service = await this.service;
        if(!service) {
            console.log("No Service found for ServiceUser '" + this.id + "'");
            return;
        }

        if(service.type === ServiceType.PVE) {
            //if we dont have a token or the saved token is older than 2 hours, request a new token and save it
            //console.log("Checking Ticket validity");
            const d = new Date();
            d.setHours(d.getHours() - 2);
            if(!this.data.token || this.tokenCreated < d) {
                const host = service.protocol + "://" + service.targetHost + ":" + service.targetPort;
                console.log("Requesting new PVE Ticket...");
                const tokenResp = await PveApi.getNewTicket(host, this.username, this.password);
                if(!tokenResp) {
                    return;
                }
                this.tokenCreated = new Date();
                this.data = {
                    token: tokenResp.token,
                    csrf: tokenResp.csrf,
                }
                this.save(); // this is async but we dont wait for saving
            }
        }
    }

    async withoutHiddenFields() {
        return {
            id: this.id,
            username: this.username,
            password: this.password,
            data: this.data,
            service: (await this.service).withoutHiddenFields(),
            user: (await this.user).withoutHiddenFields(),
        }
    }

    

}