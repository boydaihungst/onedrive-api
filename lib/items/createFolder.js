const request = require('request-promise');
const userPathGenerator = require('../helpers/pathHelper');
const promiseRetry = require('promise-retry');
/**
 * @function createFolder
 * @description Create Folder
 *
 * @param {Object} params
 * @param {String} params.accessToken OneDrive access token
 * @param {String} params.refreshToken OneDrive refresh token
 * @param {String} [params.rootItemId=root] Root Item id
 * @param {String} params.name New folder name
 * @param {Object} [params.retryOptions]
 * @param {Boolean} [params.retryOptions.forever=false] Whether to retry forever.
 * @param {Boolean} [params.retryOptions.unref=false] Whether to [unref](https://nodejs.org/api/timers.html#timers_unref) the setTimeout's.
 * @param {Number} [params.retryOptions.maxRetryTime=Infinity] The maximum time (in milliseconds) that the retried operation is allowed to run.
 * @param {Number} [params.retryOptions.retries=1] The maximum amount of times to retry the operation.
 *
 * @return {Object} folder object
 */

function createFolder(params) {
  if (!params.accessToken) {
    throw new Error('Missing params.accessToken');
  }

  if (!params.name) {
    throw new Error('Missing params.name');
  }

  params.rootItemId = params.rootItemId === undefined ? 'root' : params.rootItemId;
  const userPath = userPathGenerator(params);

  const options = {
    method: 'POST',
    uri: appConfig.apiUrl + userPath + 'drive/items/' + params.rootItemId + '/children',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + params.accessToken,
    },
    body: {
      name: params.name,
      folder: {},
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

module.exports = createFolder;
