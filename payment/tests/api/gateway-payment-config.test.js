const request = require('supertest');
const resources = require('../resources/gateway-payment-config.json');
const modelInsert = require('../helpers/model-insert');
const modelClean = require('../helpers/model-clean');
const db = require('../../db/models');
const dbOfDummy = require('../../plugins/dummy/models')(db);

let app;
beforeAll(async () => {
  await db.sequelize.query("CREATE TABLE `dummy_test` ("+
    "`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,"+
    "`name` varchar(255) NOT NULL,"+
    "PRIMARY KEY (`id`)"+
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8");
});
let test_case_id = 1;
beforeEach(async () => {
  await modelClean();
  await dbOfDummy.Test.destroy({ truncate: true });
  await modelInsert(resources[test_case_id].db);
  await require('../../app')().then((appInstance) => {
    app = appInstance;
    app.set('port', 3000);
  });
});
afterEach(() => {
  test_case_id = test_case_id+1;
});

describe('Create Gateway-Payment-Config related tests', () => {
  it('should create a new gateway-payment-config', async () => {
    const res = await request(app)
      .post('/api/gateway/payment-transaction-config')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('tries to create a new gateway-payment-config without configs name', async () => {
    const res = await request(app)
      .post('/api/gateway/payment-transaction-config')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(417);
    expect(res.body.code).toEqual(9);
    expect(res.body.title).toEqual('Expectation Failed');
    expect(res.body.details).toEqual('Field(s) missing');
    expect(res.body).not.toContain('data');
  });
  it('tries to create a new gateway-payment-config with invalid gatewayId', async () => {
    const res = await request(app)
      .post('/api/gateway/payment-transaction-config')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(1);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Invalid Payment-Gateway Id');
    expect(res.body).not.toContain('data');
  });
});

describe('Update Gateway-Payment-Config related tests', () => {
  it('should update a gateway-payment-config', async () => {
    const res = await request(app)
      .put('/api/gateway/payment-transaction-config')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('tries to update a gateway-payment-config without config id', async () => {
    const res = await request(app)
      .put('/api/gateway/payment-transaction-config')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(417);
    expect(res.body.code).toEqual(9);
    expect(res.body.title).toEqual('Expectation Failed');
    expect(res.body.details).toEqual('id required');
    expect(res.body).not.toContain('data');
  });
  it('tries to update a gateway-payment-config without configs name', async () => {
    const res = await request(app)
      .put('/api/gateway/payment-transaction-config')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(417);
    expect(res.body.code).toEqual(9);
    expect(res.body.title).toEqual('Expectation Failed');
    expect(res.body.details).toEqual('Field(s) missing');
    expect(res.body).not.toContain('data');
  });
  it('tries to update a gateway-payment-config with invalid Configs id', async () => {
    const res = await request(app)
      .put('/api/gateway/payment-transaction-config')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(417);
    expect(res.body.code).toEqual(9);
    expect(res.body.title).toEqual('Expectation Failed');
    expect(res.body.details).toEqual('Invalid id');
    expect(res.body).not.toContain('data');
  });
  it('tries to update a gateway-payment-config with invalid gatewayId', async () => {
    const res = await request(app)
      .put('/api/gateway/payment-transaction-config')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(1);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Invalid Payment-Gateway Id');
    expect(res.body).not.toContain('data');
  });
});

describe('Fetch Gateway-Payment-Config related tests', () => {
  it('should find a gateway-payment-config with specific id', async () => {
    const res = await request(app)
      .get('/api/gateway/payment-transaction-config?gatewayId=1&id=2');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should find a gateway-payment-config with specific name', async () => {
    const res = await request(app)
      .get('/api/gateway/payment-transaction-config?gatewayId=1&name=third');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
});
