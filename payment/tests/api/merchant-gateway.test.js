const request = require('supertest');
const resources = require('../resources/merchant-gateway.json');
const modelInsert = require('../helpers/model-insert');
const modelClean = require('../helpers/model-clean');

let app;
beforeAll(async () => {
  await require('../../app')().then((appInstance) => {
    app = appInstance;
    app.set('port', 3000);
  });
});
let test_case_id = 1;
beforeEach(async () => {
  await modelClean();
  await modelInsert(resources[test_case_id].db);
});
afterEach(() => {
  test_case_id = test_case_id+1;
});

describe('Create Merchant-Gateway related tests', () => {
  it('should create a new merchant-gateway with all attributes', async () => {
    const res = await request(app)
      .post('/api/merchant-gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
	});
  it('should create a new merchant-gateway with only required attributes', async () => {
    const res = await request(app)
      .post('/api/merchant-gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
	});
  it('tries to create a new merchant-gateway with invalid gatewayId', async () => {
    const res = await request(app)
      .post('/api/merchant-gateway')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(1);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Invalid Payment-Gateway Id');
    expect(res.body).not.toContain('data');
	});
  it('tries to create a new merchant-gateway with a gateway that is inactive', async () => {
    const res = await request(app)
      .post('/api/merchant-gateway')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(1);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Invalid Payment-Gateway Id');
    expect(res.body).not.toContain('data');
	});
});

describe('Update Merchant-Gateway related tests', () => {
  it('should update a merchant-gateway', async () => {
    const res = await request(app)
      .put('/api/merchant-gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should update a merchant-gateway status active to inactive', async () => {
    const res = await request(app)
      .put('/api/merchant-gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should update a merchant-gateway status inactive to active', async () => {
    const res = await request(app)
      .put('/api/merchant-gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('tries to update a merchant-gateway with invalid gatewayId', async () => {
    const res = await request(app)
      .put('/api/merchant-gateway')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(1);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Invalid Payment-Gateway Id');
    expect(res.body).not.toContain('data');
  });
  it('tries to update a merchant-gateway with a gatewayId that is inactive', async () => {
    const res = await request(app)
      .put('/api/merchant-gateway')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(1);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Invalid Payment-Gateway Id');
    expect(res.body).not.toContain('data');
  });
  it('tries to update a merchant-gateway with duplicate gatewayId and merchantId', async () => {
    const res = await request(app)
      .put('/api/merchant-gateway')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(417);
    expect(res.body.code).toEqual(10);
    expect(res.body.title).toEqual('Expectation Failed');
    expect(res.body.details).toEqual('Together Merchant-Id & Gateway-Id need to be unique');
    expect(res.body).not.toContain('data');
  });
});

describe('Fetch Merchant-Gateway related tests', () => {
  it('should find a merchant-gateway with specific id', async () => {
    const res = await request(app)
      .get('/api/merchant-gateway?id=2');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should find all merchant-gateway with specific merchantId', async () => {
    const res = await request(app)
      .get('/api/merchant-gateway?merchantId=2');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
});