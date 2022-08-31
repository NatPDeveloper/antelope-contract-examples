require('mocha');

const { requireBox } = require('@liquidapps/box-utils');
const { assert } = require('chai'); // Using Assert style
const { getCreateKeys } = requireBox('eos-keystore/helpers/key-utils');
const { getCreateAccount } = requireBox('seed-eos/tools/eos/utils');

const artifacts = requireBox('seed-eos/tools/eos/artifacts');
const deployer = requireBox('seed-eos/tools/eos/deployer');
const { getEosWrapper } = requireBox('seed-eos/tools/eos/eos-wrapper');

const contractCode = 'receiver';
const ctrt = artifacts.require(`./${contractCode}/`);
const { eosio } = requireBox('test-extensions/lib/index');
let deployedContract;

describe(`${contractCode} Contract`, () => {
    const code = 'receiver';
    let tableHelper;
    before(done => {
        (async () => {
            try {
                tableHelper = await deployer.deploy(ctrt, code);
                const keys = await getCreateAccount(code);
                const eosTestAcc = getEosWrapper({
                  keyProvider: keys.active.privateKey,
                  httpEndpoint: 'http://localhost:8888'
                });
                deployedContract = await eosTestAcc.contract(code);
                done();
            }
            catch (e) {
                done(e);
            }
        })();
    });

    it('testreceiver', done => {
        (async () => {
            try {
                const res = await deployedContract.testreceiver({}, {
                  authorization: `${code}@active`,
                  broadcast: true,
                  sign: true
                });
                console.log(res.processed.action_traces.forEach((el,i) => {
                    if(el.console) console.log(`console ${el.action_ordinal}:\n`, el.console,'\n')
                }));
                done();
            }
            catch (e) {
                done(e);
            }
        })();
    });
});