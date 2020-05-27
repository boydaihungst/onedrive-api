const request = require('request-promise');
const userPathGenerator = require('../helpers/pathHelper');
const promiseRetry = require('promise-retry');

/**
 * @function listChildren
 * @description List childrens
 *
 * @param {Object} params
 * @param {String} params.accessToken OneDrive access token
 * @param {String} [params.itemId=root] Item id
 * @param {Boolean} [params.shared] A flag to indicated whether this files is owned by the user or shared from another user. If true params.user has to be set.
 * @param {String} [params.user] The user who shared the file. Must be set if params.shared is true.
 * @param {Object} [params.retryOptions]
 * @param {Boolean} [params.retryOptions.forever=false] Whether to retry forever.
 * @param {Boolean} [params.retryOptions.unref=false] Whether to [unref](https://nodejs.org/api/timers.html#timers_unref) the setTimeout's.
 * @param {Number} [params.retryOptions.maxRetryTime=Infinity] The maximum time (in milliseconds) that the retried operation is allowed to run.
 * @param {Number} [params.retryOptions.retries=1] The maximum amount of times to retry the operation.
 *
 * @return {Array} object of children items
 */

function listChildren(params) {
  if (!params.accessToken) {
    throw new Error('Missing params.accessToken');
  }

  params.itemId = params.itemId === undefined ? 'root' : params.itemId;
  const userPath = userPathGenerator(params);

  const options = {
    method: 'GET',
    uri: appConfig.apiUrl + userPath + 'drive/items/' + params.itemId + '/children',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + params.accessToken,
    },
    json: true,
  };
  return promiseRetry(async function (retry, number) {
    try {
      return await request(options);
    } catch (error) {
      if ([500, 502, 503, 504].includes(error.statusCode)) {
        return retry('retry');
      }
      throw error;
    }
  }, params.retryOptions);
}

module.exports = listChildren;
