'use strict';

const db = require('../../db/models')
const pluginManager = require('../../lib/plugin-manager/plugin-manager')({db: db});
const AppError = require('../../lib/app-error').AppError;

const resources = require('../resources/plugin-manager.json');
const modelClean = require('../helpers/model-clean');
const modelInsert = require('../helpers/model-insert');
const pluginHelper = require('../helpers/plugin-helper')();

let test_case_id = 1;
beforeEach(async () => {
  await modelClean();
  await modelInsert(resources[test_case_id].db);
  pluginHelper.addPlugin(resources[test_case_id].plugin);
});

afterEach(async () => {
  pluginHelper.removePlugin(resources[test_case_id].plugin);
  test_case_id = test_case_id + 1;
});

describe('Plugin-Manager related tests', () => {
  it('should initialize all plugin in cache from database', async () => {
    await pluginManager.initialize();

    const gateways = resources[test_case_id].db[0].data;
    expect(pluginManager.get(gateways[0].name)).not.toBe(undefined);
    expect(pluginManager.get(gateways[1].name)).toBe(undefined);
    expect(pluginManager.get(gateways[2].name)).toBe(undefined);
  });
  it('should load a plugin in cache', async () => {
    const gateway = resources[test_case_id].request;
    pluginManager.load(gateway);
    expect(pluginManager.get(gateway.name)).not.toBe(undefined);
  });
  it('can not load a plugin that is not in plugins directory', async () => {
    const gateway = resources[test_case_id].request;
    try {
      pluginManager.load(gateway);
    } catch (err) {
      expect(err.httpCode).toBe(400);
      expect(err.code).toBe(5);
      expect(err.name).toBe('Bad Request');
      expect(err.description).toBe('Invalid Gateway name');
    }

    expect(pluginManager.get(gateway.name)).toBe(undefined);
  });
  it('can not load a plugin which is not being injected necessary properties', async () => {
    const gateway = resources[test_case_id].request;

    try {
      pluginManager.load(gateway);
    } catch (err) {
      expect(err.httpCode).toBe(400);
      expect(err.code).toBe(6);
      expect(err.name).toBe('Bad Request');
    }

    expect(pluginManager.get(gateway.name)).toBe(undefined);
  });
  it('should remove a plugin from cache when status is inactive', async () => {
    const gateway = resources[test_case_id].request;

    pluginManager.load(gateway);
    pluginManager.reload(gateway);

    expect(pluginManager.get(gateway.name)).toBe(undefined);
  });
  it('should load a plugin from cache when status is active', async () => {
    const gateway = resources[test_case_id].request;
    expect(pluginManager.get(gateway.name)).toBe(undefined);
    pluginManager.reload(gateway);
    expect(pluginManager.get(gateway.name)).not.toBe(undefined);
  });
});

