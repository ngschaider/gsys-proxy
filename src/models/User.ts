import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import LoginToken from "./LoginToken";
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

    @OneToMany(type => LoginToken, loginToken => loginToken.user)
    loginTokens!: LoginToken[];

    @OneToMany(type => ServiceUser, serviceUser => serviceUser.user, {
        eager: true,
    })
    serviceUsers!: ServiceUser[];

    @Column()
    resetPasswordOnLogin!: boolean;

    @Column()
    isAdmin!: boolean;

}