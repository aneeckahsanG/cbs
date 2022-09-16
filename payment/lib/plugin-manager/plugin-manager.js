'use strict';

const {getPathSegment} = require('../utils/common-functions');

const appCodes = require('../app-codes');
const AppError = require('../app-error').AppError;
const {ACTIVE} = require('../constants');

module.exports = (context) => {
  const plugins = {};
  const db = context['db'];
  const config = context['config'];

  async function fetchGatewayInfo() {
    return await db['Gateway']
      .findAll({
        where: {
          status: {
            [db.Sequelize.Op.eq]: ACTIVE
          }
        }
      })
      .then(gateways => {
        return gateways.map(gateway => gateway.dataValues);
      })
      .catch(err => {
        throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
      })
  }

  async function fetchSpecificGatewayInfo(name) {
    return await db['Gateway']
      .findOne({
        where: {
          name: {
            [db.Sequelize.Op.eq]: name
          },
          status: {
            [db.Sequelize.Op.eq]: ACTIVE
          }
        }
      })
      .then(gateway => {
        if(!gateway) return null;
        return gateway.dataValues;
      })
      .catch(err => {
        throw new AppError(appCodes.INTERNAL_SERVER_ERROR);
      });
  }

  function clearPluginCache(path) {
    const cachedModule = require.cache[require.resolve(path)];
    if (!cachedModule) return;

    const cachedPaths = [];
    const paths = [];
    paths.unshift({ path: cachedModule.id, visited: false });
    while (paths.length) {
      const elem = paths.shift();
      if (elem.visited) {
        cachedPaths.push(elem.path);
      } else {
        elem.visited = true;
        paths.unshift(elem);

        const elemData = require.cache[elem.path];
        for (const child of elemData.children) {
          paths.unshift({ path: child.id, visited: false });
        }
      }
    }

    for (const path of cachedPaths) {
      delete require.cache[path];
    }
  }

  function loadGateway(name, context) {
    const path = `../../plugins/${name}`;
    try {
      clearPluginCache(path);
      plugins[name] = {
        functions: require(path)(context),
        epoch: Math.round(Date.now()/1000)
      }
    } catch (e) {
      if (e instanceof ReferenceError) {
        throw new AppError(appCodes.INVALID_GATEWAY_PROPERTIES, {details: e.message});
      }

      throw new AppError(appCodes.INVALID_GATEWAY_NAME);
    }
  }

  function load(gateway) {
    if (!plugins[gateway.name]) {
      context[gateway.name] = gateway;
      loadGateway(gateway.name, context);
    }
  }

  function reload(gateway) {
    if (gateway.status !== undefined && Number(gateway.status) === 0) {
      delete plugins[gateway.name];
      return;
    }

    context[gateway.name] = gateway;
    loadGateway(gateway.name, context);
  }

  return {
    async initialize() {
      const gateways = await fetchGatewayInfo();
      gateways.forEach(gateway => {
        context[gateway.name] = gateway;
        try {
          loadGateway(gateway.name, context);
        } catch (e) {
          console.log(`[Warning]:: While loading [${gateway.name}] error occurred - ${e.description}`)
        }
      });
    },
    async injectNotificationRoute({app, paymentTransactionService}) {
      const gateways = await fetchGatewayInfo();
      gateways.forEach(gateway => {
        if (gateway.additionalProperties && gateway.additionalProperties.callbackUrl) {
          const pathSegment = getPathSegment(gateway.additionalProperties.callbackUrl);
          if (!pathSegment) {
            console.log(`[Warning]:: Invalid Callback-Url ${gateway.name}.${gateway.additionalProperties.callbackUrl}`);
            return;
          }

          const method = gateway.additionalProperties.callbackUrlMethod || 'post';
          app[method](pathSegment, async function (req, res) {
            req.headers['gateway-id'] = gateway.id;
            let {headers, status, body} = await paymentTransactionService.updatePaymentTransaction(req);
            headers && res.set(headers);
            res.status(status || 200);
            res.send(body);
            res.end();
          });
        }
      });
    },
    load,
    reload,
    get(name) {
      return plugins[name];
    },
    async getOrLoad(name) {
      const plugin = plugins[name];
      if (plugin && !config.invalidateGatewayCacheAfter) return plugin.functions;
      if (plugin) {
        if ((plugin.epoch + config.invalidateGatewayCacheAfter) > Math.round(Date.now()/1000)) return plugin.functions;
        const gateway = await fetchSpecificGatewayInfo(name);
        if (!gateway) throw new AppError(appCodes.INVALID_GATEWAY_NAME);

        delete plugins[name];
        load(gateway);
      }

      if(!plugin){
        const gateway = await fetchSpecificGatewayInfo(name);
        if (!gateway) throw new AppError(appCodes.INVALID_GATEWAY_NAME);

        load(gateway);
      }

      const newlyLoadedPlugin = plugins[name];
      if (!newlyLoadedPlugin) throw new AppError(appCodes.INTERNAL_SERVER_ERROR);

      return newlyLoadedPlugin.functions;
    }
  }
};
