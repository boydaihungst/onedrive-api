const request = require('request-promise');
const userPathGenerator = require('../helpers/pathHelper');
const promiseRetry = require('promise-retry');

/**
 * @function getDriveMetadata
 * @description Get drive metadata
 *
 * @param {Object} params
 * @param {String} params.accessToken OneDrive access token
 * @param {Object} [params.qs] Query string
 * @param {Object} [params.retryOptions]
 * @param {Boolean} [params.retryOptions.forever=false] Whether to retry forever.
 * @param {Boolean} [params.retryOptions.unref=false] Whether to [unref](https://nodejs.org/api/timers.html#timers_unref) the setTimeout's.
 * @param {Number} [params.retryOptions.maxRetryTime=Infinity] The maximum time (in milliseconds) that the retried operation is allowed to run.
 * @param {Number} [params.retryOptions.retries=1] The maximum amount of times to retry the operation.
 *
 * @return {Object} Item's metadata
 */

function getDriveMetadata(params) {
  if (!params.accessToken) {
    throw new Error('Missing params.accessToken');
  }

  const userPath = userPathGenerator(params);

  const options = {
    method: 'GET',
    uri: appConfig.apiUrl + userPath + 'drive',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + params.accessToken,
    },
    qs: params.qs,
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

module.exports = getDriveMetadata;
