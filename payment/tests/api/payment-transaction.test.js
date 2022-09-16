const request = require('supertest');

const db = require('../../db/models');

const resources = require('../resources/payment-transaction.json');
const modelInsert = require('../helpers/model-insert');
const modelClean = require('../helpers/model-clean');
const pluginHelper = require('../helpers/plugin-helper')();

let app;
let test_case_id = 1;
beforeEach(async () => {
  await modelClean();
  await modelInsert(resources[test_case_id].db);
  pluginHelper.addPlugin(resources[test_case_id].plugin);
  await require('../../app')().then((appInstance) => {
    app = appInstance;
    app.set('port', 3000);
  });
});

afterEach(() => {
  pluginHelper.removePlugin(resources[test_case_id].plugin);
  test_case_id = test_case_id + 1;
});

describe('Create Payment-Transaction related tests', () => {
  it('should create a new payment-transaction with all attributes', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should create a new payment-transaction with only required attributes', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('tries to create a new payment-transaction with invalid gatewayId', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(12);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Invalid Merchant or Gateway-Id');
    expect(res.body).not.toContain('data');
  });
  it('tries to create a new payment-transaction with invalid merchantId', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(12);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Invalid Merchant or Gateway-Id');
    expect(res.body).not.toContain('data');
  });
  it('tries to create a new payment-transaction with invalid transactionType', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(254);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('"transactionType" must be one of [payment, refund]');
    expect(res.body).not.toContain('data');
  });
  it('should create a new payment-transaction there is no gatewayParams check', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should create a new payment-transaction when a gatewayParams attribute is required', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('tries to create a new payment-transaction when a gatewayParams attribute is required but not given', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(14);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Malformed or insufficient Payment Information');
    expect(res.body).not.toContain('data');
  });
  it('should create a new payment-transaction when no merge operation needed', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('tries to create a new payment-transaction when transactionType = refund without merchantTransactionId', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(14);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Malformed or insufficient Payment Information');
    expect(res.body).not.toContain('data');
  });
  it('should create a new payment-transaction when transactionType = refund with previous transactionId', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('tries to create a new payment-transaction when transactionType = refund with previous transactionId', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(14);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Malformed or insufficient Payment Information');
    expect(res.body).not.toContain('data');
  });
  it('should create a new payment-transaction when transactionType = refund without previous transactionId', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('tries to create a new payment-transaction when transactionType = refund without previous transactionId', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(14);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Malformed or insufficient Payment Information');
    expect(res.body).not.toContain('data');
  });
  it('should create a new payment-transaction when paymentStatus = FAILED', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should create a new payment-transaction when paymentStatus = PENDING', async () => {
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);

    const res1 = await db['PaymentTransactionEvent'].findAll();
    expect(res1.length).toBe(1)
  });
  it('should create a new payment-transaction when op = VOID', async () => {    
    const res = await request(app)
      .post('/api/payment-transaction')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);

    const res1 = await db['PaymentTransaction'].findAll();
    expect(res1.length).toBe(1);
  });
});

describe('Fetch Payment-Transaction related tests', () => {
  it('should find all payment-transaction with specific merchantId', async () => {
    const res = await request(app)
      .get('/api/payment-transaction?merchantId=2');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should find a payment-transaction with specific transactionId', async () => {
    const res = await request(app)
      .get('/api/payment-transaction?merchantId=2&transactionId=42821296-0039-4d0b-9884-2a56e772c22a');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should find a payment-transaction with specific merchantTransactionId', async () => {
    const res = await request(app)
      .get('/api/payment-transaction?merchantId=2&merchantTransactionId=1234567802');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should find a payment-transaction with specific gatewayTransactionId', async () => {
    const res = await request(app)
      .get('/api/payment-transaction?merchantId=2&gatewayTransactionId=ab377471-eefc-4d0d-9cde-4f4485b296a2');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should find all payment-transaction with specific startDate', async () => {
    const res = await request(app)
      .get('/api/payment-transaction?merchantId=2&startDate=2020-01-01');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should find all payment-transaction with specific endDate', async () => {
    const res = await request(app)
      .get('/api/payment-transaction?merchantId=2&endDate=2019-01-02');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should find all payment-transaction with specific startDate and endDate', async () => {
    const res = await request(app)
      .get('/api/payment-transaction?merchantId=2&startDate=2019-01-01&endDate=2020-01-02');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('find all payment-transaction with offset & limit value', async () => {
    const res = await request(app)
      .get('/api/payment-transaction?merchantId=2&offset=0&limit=2');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0]).toMatchObject(resources[test_case_id].response[0]);
    expect(res.body.data[1]).toMatchObject(resources[test_case_id].response[1]);

    const res1 = await request(app)
      .get('/api/payment-transaction?merchantId=2&offset=2&limit=2');

    expect(res1.body.code).toEqual(0);
    expect(res1.body.data.length).toBe(2);
    expect(res1.body.data[0]).toMatchObject(resources[test_case_id].response[2]);
    expect(res1.body.data[1]).toMatchObject(resources[test_case_id].response[3]);

    const res2 = await request(app)
      .get('/api/payment-transaction?merchantId=2&offset=4&limit=3');

    expect(res2.body.code).toEqual(0);
    expect(res2.body.data.length).toBe(3);
    expect(res2.body.data[0]).toMatchObject(resources[test_case_id].response[4]);
    expect(res2.body.data[1]).toMatchObject(resources[test_case_id].response[5]);
    expect(res2.body.data[2]).toMatchObject(resources[test_case_id].response[6]);

    const res3 = await request(app)
      .get('/api/payment-transaction?merchantId=2&offset=7&limit=2');

    expect(res3.body.code).toEqual(0);
    expect(res3.body.data.length).toBe(0);
  });
});
