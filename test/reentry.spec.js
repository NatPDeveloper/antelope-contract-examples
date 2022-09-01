require('mocha');

const { requireBox } = require('@liquidapps/box-utils');
const { assert } = require('chai'); // Using Assert style
const { getCreateKeys } = requireBox('eos-keystore/helpers/key-utils');
const { getCreateAccount, getTestContract } = requireBox('seed-eos/tools/eos/utils');

const artifacts = requireBox('seed-eos/tools/eos/artifacts');
const deployer = requireBox('seed-eos/tools/eos/deployer');
const { getEosWrapper } = requireBox('seed-eos/tools/eos/eos-wrapper');

const contractCode = 'reentry';
const ctrt = artifacts.require(`./${contractCode}/`);
const contractCode2 = "bank";
const ctrt2 = artifacts.require(`./${contractCode2}/`);
const { eosio } = requireBox('test-extensions/lib/index');
let deployedContract, bankContract;

describe(`${contractCode} Contract`, () => {
    const code = 'reentry';
    const code2 = contractCode2;
    let tableHelper;
    let testcontract;
    before(done => {
        (async () => {
            try {
                tableHelper = await deployer.deploy(ctrt, code);
                await deployer.deploy(ctrt2, code2);
                const keys = await getCreateAccount(code);
                const eosTestAcc = getEosWrapper({
                  keyProvider: keys.active.privateKey,
                  httpEndpoint: 'http://localhost:8888'
                });
                deployedContract = await eosTestAcc.contract(code);
                bankContract = await eosTestAcc.contract(code2);
                testcontract = await getTestContract("eosio.token");
                done();
            }
            catch (e) {
                done(e);
            }
        })();
    });

    it('test attack', done => {
        (async () => {
            try {
                await bankContract.open({
                    owner: code,
                    symbol: "4,SYS",
                    ram_payer: code
                }, {
                    authorization: `${code}@active`,
                    broadcast: true,
                    sign: true
                });
                const keys = await getCreateAccount(code);

                await testcontract.transfer({
                    from:code,
                    to:contractCode2,
                    quantity: `1000.0000 SYS`,
                    memo:"bank deposit"
                }, {
                    authorization: `${code}@active`,
                    broadcast: true,
                    sign: true,
                    keyProvider: [keys.active.privateKey]
                });

                let res;

                try {
                    res = await bankContract.withdraw({
                        to:code,
                        quantity: "500.0000 SYS"
                    }, {
                        authorization: `${code}@active`,
                        broadcast: true,
                        sign: true
                    });
                } catch(e) {
                    console.log(e.details[0].message)
                    console.log(JSON.stringify(e));
                    res = e;
                }
                // assert.equal(res.details[0].message, 'assertion failure with message: overdrawn balance');
    
                if(res.processed) {
                    console.log(res.processed.action_traces.forEach((el,i) => {
                        if(el.console && el.console.length > 0) {
                            console.log(`console ${el.action_ordinal}:\n`, el.console,'\n')
                        }
                    }));
                } else if (res.json.code == 500) {
                    console.log(res.details.forEach((el,i) => {
                        if(el.message.includes("pending console output") && el.message.length > 24) {
                            console.log(`${el.message}\n`)
                        }
                    }));
                }

                res = await tableHelper.eos.getTableRows({
                    code: "eosio.token",
                    scope: contractCode2,
                    table: "accounts",
                    json: true
                });
                let balance2a = res.rows[0].balance.replace(' SYS', '');
                res = await tableHelper.eos.getTableRows({
                    code: "eosio.token",
                    scope: code,
                    table: "accounts",
                    json: true
                });
                let balance2b = res.rows[0].balance.replace(' SYS', '');
                res = await tableHelper.eos.getTableRows({
                    code: contractCode2,
                    scope: code,
                    table: "accounts",
                    json: true
                });
                let balance2c = res.rows[0].balance.replace(' SYS', '');

                console.log(balance2a);
                console.log(balance2b);
                console.log(balance2c);
                assert.equal(balance2a, '2000.0000');
                assert.equal(balance2b, '0.0000');
                assert.equal(balance2c, '1000.0000');
                done();
            }
            catch (e) {
                done(e);
            }
        })();
    });
});