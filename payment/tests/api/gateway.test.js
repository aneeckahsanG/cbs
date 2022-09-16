'use strict';

const request = require('supertest');

const resources = require('../resources/gateway.json');
const modelInsert = require('../helpers/model-insert');
const modelClean = require('../helpers/model-clean');
const pluginHelper = require('../helpers/plugin-helper')();

let app;
let test_case_id = 1;
beforeEach(async () => {
  jest.resetModules();
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

describe('Create Gateway related tests', () => {
  it('should create a new gateway with all attributes', async () => {
    const res = await request(app)
      .post('/api/gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should create a new gateway with only required attributes', async () => {
    const res = await request(app)
      .post('/api/gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('tries to create a new gateway with duplicate gateway name', async () => {
    const res = await request(app)
      .post('/api/gateway')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(3);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Duplicate Gateway name');
    expect(res.body).not.toContain('data');
  });
  it('tries to create a new gateway with invalid name', async () => {
    const res = await request(app)
      .post('/api/gateway')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(5);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Invalid Gateway name');
    expect(res.body).not.toContain('data');
  });
});

describe('Update Gateway related tests', () => {
  it('should update a gateway with a new prettyName', async () => {
    const res = await request(app)
      .put('/api/gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should update a gateway with status active to inactive', async () => {
    const res = await request(app)
      .put('/api/gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should update a gateway with status inactive to active', async () => {
    const res = await request(app)
      .put('/api/gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should update a gateway by adding an additionalProperties', async () => {
    const res = await request(app)
      .put('/api/gateway')
      .send(resources[test_case_id].request);

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('tries to update a gateway with invalid id', async () => {
    const res = await request(app)
      .put('/api/gateway')
      .send(resources[test_case_id].request);

    expect(res.body.status).toEqual(400);
    expect(res.body.code).toEqual(1);
    expect(res.body.title).toEqual('Bad Request');
    expect(res.body.details).toEqual('Invalid Payment-Gateway Id');
    expect(res.body).not.toContain('data');
  });
});

describe('Fetch Gateway related tests', () => {
  it('should find a gateway with specific id', async () => {
    const res = await request(app)
      .get('/api/gateway?id=2');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
  it('should find a gateway with specific name', async () => {
    const res = await request(app)
      .get('/api/gateway?name=ghoori');

    expect(res.body.code).toEqual(0);
    expect(res.body.data.length).toBe(resources[test_case_id].response.length);
    expect(res.body.data).toMatchObject(resources[test_case_id].response);
  });
});
