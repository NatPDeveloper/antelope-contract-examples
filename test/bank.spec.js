require('mocha');

const { requireBox } = require('@liquidapps/box-utils');
const { assert } = require('chai'); // Using Assert style
const { getCreateKeys } = requireBox('eos-keystore/helpers/key-utils');
const { getCreateAccount, getTestContract } = requireBox('seed-eos/tools/eos/utils');

const artifacts = requireBox('seed-eos/tools/eos/artifacts');
const deployer = requireBox('seed-eos/tools/eos/deployer');
const { getEosWrapper } = requireBox('seed-eos/tools/eos/eos-wrapper');

const contractCode = 'bank';
const ctrt = artifacts.require(`./${contractCode}/`);
const { eosio } = requireBox('test-extensions/lib/index');
let deployedContract;

describe(`${contractCode} Contract`, () => {
    const code = 'bank';
    const depositor = "depositor";
    let depositor_keys;
    let tableHelper;
    let testcontract;
    before(done => {
        (async () => {
            try {
                tableHelper = await deployer.deploy(ctrt, code);
                const keys = await getCreateAccount(code);
                depositor_keys = await getCreateAccount("depositor");
                const eosTestAcc = getEosWrapper({
                  keyProvider: keys.active.privateKey,
                  httpEndpoint: 'http://localhost:8888'
                });
                deployedContract = await eosTestAcc.contract(code);
                testcontract = await getTestContract("eosio.token");
                done();
            }
            catch (e) {
                done(e);
            }
        })();
    });

    it('test deposit', done => {
        (async () => {
            try {
                let res = await tableHelper.eos.getTableRows({
                    code: "eosio.token",
                    scope: depositor,
                    table: "accounts",
                    json: true
                });
                let balance1a = res.rows[0].balance.replace(' SYS', '');
                res = await tableHelper.eos.getTableRows({
                    code: "eosio.token",
                    scope: code,
                    table: "accounts",
                    json: true
                });
                let balance1b = res.rows[0].balance.replace(' SYS', '');

                assert.equal(balance1a, '1000.0000');
                assert.equal(balance1b, '1000.0000');

                await deployedContract.open({
                    owner: depositor,
                    symbol: "4,SYS",
                    ram_payer: depositor
                }, {
                    authorization: `${depositor}@active`,
                    broadcast: true,
                    sign: true,
                    keyProvider: [depositor_keys.active.privateKey]
                });

                res = await testcontract.transfer({
                    from:depositor,
                    to:code,
                    quantity: `${balance1a} SYS`,
                    memo:"bank deposit"
                }, {
                    authorization: `${depositor}@active`,
                    broadcast: true,
                    sign: true,
                    keyProvider: [depositor_keys.active.privateKey]
                });

                console.log(res.processed.action_traces.forEach((el,i) => {
                    if(el.console) console.log(`console ${el.action_ordinal}:\n`, el.console,'\n')
                }));

                res = await tableHelper.eos.getTableRows({
                    code: "eosio.token",
                    scope: depositor,
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
                    code: code,
                    scope: depositor,
                    table: "accounts",
                    json: true
                });
                let balance2c = res.rows[0].balance.replace(' SYS', '');

                assert.equal(balance2a, '0.0000');
                assert.equal(balance2b, '2000.0000');
                assert.equal(balance2c, '1000.0000');
                done();
            }
            catch (e) {
                done(e);
            }
        })();
    });

    it('test withdraw', done => {
        (async () => {
            try {
                let res = await tableHelper.eos.getTableRows({
                    code: "eosio.token",
                    scope: depositor,
                    table: "accounts",
                    json: true
                });
                let balance1a = res.rows[0].balance.replace(' SYS', '');
                res = await tableHelper.eos.getTableRows({
                    code: "eosio.token",
                    scope: code,
                    table: "accounts",
                    json: true
                });
                let balance1b = res.rows[0].balance.replace(' SYS', '');
                res = await tableHelper.eos.getTableRows({
                    code: code,
                    scope: depositor,
                    table: "accounts",
                    json: true
                });
                let balance1c = res.rows[0].balance.replace(' SYS', '');

                assert.equal(balance1a, '0.0000');
                assert.equal(balance1b, '2000.0000');
                assert.equal(balance1c, '1000.0000');

                await deployedContract.withdraw({
                    to: depositor,
                    quantity: `${balance1c} SYS`
                }, {
                    authorization: `${depositor}@active`,
                    broadcast: true,
                    sign: true,
                    keyProvider: [depositor_keys.active.privateKey]
                });

                res = await tableHelper.eos.getTableRows({
                    code: "eosio.token",
                    scope: depositor,
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
                    code: code,
                    scope: depositor,
                    table: "accounts",
                    json: true
                });
                let balance2c = res.rows[0].balance.replace(' SYS', '');

                assert.equal(balance2a, '1000.0000');
                assert.equal(balance2b, '1000.0000');
                assert.equal(balance2c, '0.0000');
                done();
            }
            catch (e) {
                done(e);
            }
        })();
    });
});