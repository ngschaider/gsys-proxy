import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, SaveOptions } from "typeorm";
import GiteaApi from "../external_api/GiteaApi";
import OPNsenseApi from "../external_api/OPNsenseApi";
import PveApi from "../external_api/PveApi";
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

interface ServiceUserDataOPNsense extends ServiceUserDataGeneric {
    type: ServiceType.OPNsense,
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


type ServiceUserData = ServiceUserDataPVE | ServiceUserDataPhpMyAdmin | ServiceUserDataTransparent | ServiceUserDataGitea | ServiceUserDataOPNsense;

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

    @Column({type: "json", name: "data"})
    data!: ServiceUserData;

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
            if(!this.data.token || !this.data.tokenCreated || new Date(this.data.tokenCreated) < d) {
                const host = service.protocol + "://" + service.targetHost + ":" + service.targetPort;
                console.log("Requesting new PVE Ticket...");
                const tokenResp = await PveApi.getNewTicket(host, this.data.username + "@" + this.data.realm, this.data.password);
                this.data.tokenCreated = new Date().toString();
                this.data.token = tokenResp.token;
                this.data.csrf = tokenResp.csrf;
                await this.save();
            }
        } else if(service.type === ServiceType.Gitea && this.data.type === ServiceType.Gitea) {
            const d = new Date();
            d.setDate(d.getDate() - 1);

            if(!this.data.token || !this.data.tokenCreated || new Date(this.data.tokenCreated) < d) {
                console.log("Requesting new Gitea Session...");
                const host = service.protocol + "://" + service.targetHost + ":" + service.targetPort;
                const token = await GiteaApi.getLoggedInSession(host, this.data.username, this.data.password);
                this.data.token = token;
                this.data.tokenCreated = new Date().toString();
                await this.save();
            }
        } else if(service.type === ServiceType.OPNsense && this.data.type === ServiceType.OPNsense) {
            const d = new Date();
            d.setDate(d.getDate() - 1);

            if(!this.data.token || !this.data.tokenCreated || new Date(this.data.tokenCreated) < d) {
                console.log("Requesting new OPNsense Session...");
                const host = service.protocol + "://" + service.targetHost + ":" + service.targetPort;
                const token = await OPNsenseApi.getLoggedInSession(host, this.data.username, this.data.password);
                this.data.token = token;
                this.data.tokenCreated = new Date().toString();
                await this.save();
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