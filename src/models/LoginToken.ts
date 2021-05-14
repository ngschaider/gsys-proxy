import { BaseEntity, Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, RelationCount } from "typeorm";
import User from "./User";
import {getRandomString} from "../utils/string";

@Entity()
export default class LoginToken extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @OneToMany(type => User, user => user.loginTokens)
    user!: User;

    @Column()
    token: string = getRandomString(32);

}