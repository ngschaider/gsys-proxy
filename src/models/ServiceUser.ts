import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, SaveOptions } from "typeorm";
import PveApi from "../pve/PveApi";
import Service, { ServiceType } from "./Service";
import User from "./User";

interface ServiceUserDataPVE extends ServiceUserDataGeneric {
    type: ServiceType.PVE,
    username: string,
    realm: string,
    password: string,
    tokenCreated: string,
    token: string,
    csrf: string,
}

interface ServiceUserDataPhpMyAdmin extends ServiceUserDataGeneric {
    type: ServiceType.PhpMyAdmin,
    username: string,
    password: string,
}

interface ServiceUserDataGitea extends ServiceUserDataGeneric {
    type: ServiceType.Gitea,
    username: string,
    password: string,
    token: string,
    tokenCreated: string,
}

interface ServiceUserDataGeneric {
    type: string;
}

interface ServiceUserDataTransparent extends ServiceUserDataGeneric {
    type: ServiceType.Transparent
}

type ServiceUserData = ServiceUserDataPVE | ServiceUserDataPhpMyAdmin | ServiceUserDataTransparent;

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

    @Column({type: "text", name: "data"})
    private _data: string = "";

    private cachedData?: ServiceUserData;
    get data() {
        if(!this.cachedData) {
            this.cachedData = JSON.parse(this._data) as ServiceUserData;
        }
        return this.cachedData;
    }

    set data(value) {
        this.cachedData = value;
    }


    async save(options?: SaveOptions) {
        this._data = JSON.stringify(this.data);
        return super.save();
    }

    async preRequest() {
        const service = await this.service;
        if(!service) {
            console.log("No Service found for ServiceUser '" + this.id + "'");
            return;
        }

        if(service.type === ServiceType.PVE && this.data.type === ServiceType.PVE) {
            //if we dont have a token or the saved token is older than 2 hours, request a new token and save it
            //console.log("Checking Ticket validity");
            const d = new Date();
            d.setHours(d.getHours() - 2);
            if(!this.data || new Date(this.data.tokenCreated) < d) {
                const host = service.protocol + "://" + service.targetHost + ":" + service.targetPort;
                console.log("Requesting new PVE Ticket...");
                const tokenResp = await PveApi.getNewTicket(host, this.data.username, this.data.password);
                if(!tokenResp) {
                    return;
                }
                this.data.tokenCreated = new Date().toString();
                this.data.token = tokenResp.token;
                this.data.csrf = tokenResp.csrf;
                this.save(); // this is async but we dont wait for saving
            }
        }
    }

    async withoutHiddenFields() {
        return {
            id: this.id,
            data: this.data,
            service: (await this.service).withoutHiddenFields(),
            user: (await this.user).withoutHiddenFields(),
        }
    }

    

}