require('dotenv').config()
import "reflect-metadata";
import { createConnection, ConnectionOptions, Connection } from "typeorm";
import fs = require('fs-extra');
import path = require('path')
import { Post } from "./examples/sample1-simple-entity/entity/Post";
import { Engine } from "./../../src/Engine";
import { AbstractDriver } from "./../../src/drivers/AbstractDriver";
import { MssqlDriver } from "./../../src/drivers/MssqlDriver";
import { DriverType } from "typeorm/driver/DriverOptions";
import { expect } from "chai";
import * as Sinon from 'sinon'


describe("integration tests", async function () {
    let examplesPath = path.resolve(process.cwd(), 'test/integration/examples')
    let files = fs.readdirSync(examplesPath)

    let dbDrivers: DriverType[] = []
    if (process.env.MSSQL_Skip=='0') dbDrivers.push('mssql')

    for (let folder of files) {

        describe(folder, async function () {

            for (let dbDriver of dbDrivers) {
                it(dbDriver, async function () {

                    let filesOrgPath = path.resolve(examplesPath, folder, 'entity')

                    let connOpt: ConnectionOptions = {

                        driver: {
                            database: process.env.MSSQL_Database,
                            host: process.env.MSSQL_Host,
                            password: process.env.MSSQL_Password,
                            type: 'mssql',
                            username: process.env.MSSQL_Username,
                            port: process.env.MSSQL_Port
                        },
                        dropSchemaOnConnection: true,
                        autoSchemaSync: true,
                        entities: [path.resolve(filesOrgPath, '*.js')],
                    }
                    let conn = await createConnection(connOpt)

                    if (conn.isConnected)
                        await conn.close()

                    let driver: AbstractDriver;
                    driver = new MssqlDriver();

                    let resultsPath = path.resolve(process.cwd(), `output`)
                    let engine = new Engine(
                        driver, {
                            //TODO:get data from env
                            host: process.env.MSSQL_Host,
                            port: process.env.MSSQL_Port,
                            databaseName: process.env.MSSQL_Database,
                            user: process.env.MSSQL_Username,
                            password: process.env.MSSQL_Password,
                            databaseType: 'mssql',
                            resultsPath: resultsPath
                        });
                    fs.removeSync(resultsPath)


                    let result = await engine.createModelFromDatabase()

                    let filesGenPath = path.resolve(resultsPath, 'entities')

                    let filesOrg = fs.readdirSync(filesOrgPath).map(function (this, val) { return val.toString().toLowerCase(); }).filter(function (this, val, ind, arr) { return val.toString().endsWith('.ts') })
                    let filesGen = fs.readdirSync(filesGenPath).map(function (this, val) { return val.toString().toLowerCase(); }).filter(function (this, val, ind, arr) { return val.toString().endsWith('.ts') })

                    expect(filesOrg).to.be.deep.equal(filesGen)

                    for (let file of filesOrg) {
                        //TODO:Compare files logically(not buffer to buffer)
                        //expect(fs.readFileSync(path.resolve(filesOrgPath, file)).toString()).to.be.eq(fs.readFileSync(path.resolve(filesGenPath, file)).toString())
                    }
                });

            }
        })
    }
})