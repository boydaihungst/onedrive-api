// download.js
const request = require('request');
const getMetadata = require('./getMetadata');
const userPathGenerator = require('../helpers/pathHelper');
const promiseRetry = require('promise-retry');

/**
 * @function download
 * @description Download item content
 *
 * @param {Object} params
 * @param {String} params.accessToken OneDrive access token
 * @param {String} params.itemId item id
 * @param {String} [params.range] partial download range
 * @param {Object} [params.retryOptions]
 * @param {Boolean} [params.retryOptions.forever=false] Whether to retry forever.
 * @param {Boolean} [params.retryOptions.unref=false] Whether to [unref](https://nodejs.org/api/timers.html#timers_unref) the setTimeout's.
 * @param {Number} [params.retryOptions.maxRetryTime=Infinity] The maximum time (in milliseconds) that the retried operation is allowed to run.
 * @param {Number} [params.retryOptions.retries=1] The maximum amount of times to retry the operation.
 *
 * @return {Promise<any>} Readable stream with item's content
 */

function download(params) {
  if (!params.accessToken) {
    throw new Error('Missing params.accessToken');
  }

  if (!params.itemId) {
    throw new Error('Missing params.itemId');
  }

  const userPath = userPathGenerator(params);

  const options = {
    method: 'GET',
    uri: appConfig.apiUrl + userPath + 'drive/items/' + params.itemId + '/content',
    headers: {
      Authorization: 'Bearer ' + params.accessToken,
    },
  };
  if (params.range) {
    options.headers = { ...options.headers, range: params.range };
  }
  return promiseRetry(async function (retry, number) {
    try {
      await getMetadata(params);
      const downloadRequest = request(options);
      return downloadRequest;
    } catch (error) {
      if ([500, 502, 503, 504].includes(error.statusCode)) {
        return retry('retry');
      }
      throw error;
    }
  }, params.retryOptions);
}

module.exports = download;
