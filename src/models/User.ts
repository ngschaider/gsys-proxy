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

    @OneToMany(type => LoginToken, loginToken => loginToken.user, {
        onDelete: "NO ACTION",
    })
    loginTokens!: LoginToken[];

    @OneToMany(type => ServiceUser, serviceUser => serviceUser.user, {
        eager: true,
        onDelete: "NO ACTION",
    })
    serviceUsers!: ServiceUser[];

    @Column()
    changePasswordOnLogin!: boolean;

    @Column()
    isAdmin!: boolean;

    withoutHiddenFields() {
        return {
            id: this.id,
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            isAdmin: this.isAdmin,
            resetPasswordOnLogin: this.changePasswordOnLogin,
        }
    }

}