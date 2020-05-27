// download.js
const request = require('request-promise');
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
 * @param {Boolean} [params.originSize]
 * @param {Number} [params.width]
 * @param {Number} [params.height]
 * @param {Boolean} [params.isCrop]
 * @param {Object} [params.retryOptions]
 * @param {Boolean} [params.retryOptions.forever=false] Whether to retry forever.
 * @param {Boolean} [params.retryOptions.unref=false] Whether to [unref](https://nodejs.org/api/timers.html#timers_unref) the setTimeout's.
 * @param {Number} [params.retryOptions.maxRetryTime=Infinity] The maximum time (in milliseconds) that the retried operation is allowed to run.
 * @param {Number} [params.retryOptions.retries=1] The maximum amount of times to retry the operation.
 *
 * @return {Object} {url: string, height: number, width: number }
 */

function getThumbnails(params) {
  if (!params.accessToken) {
    throw new Error('Missing params.accessToken');
  }

  if (!params.itemId) {
    throw new Error('Missing params.itemId');
  }

  const userPath = userPathGenerator(params);
  const size = `c${isNaN(params.height) ? 128 : params.height}x${isNaN(params.width) ? 128 : params.width}${
    params.isCrop ? '_crop' : ''
  }`;
  const options = {
    method: 'GET',
    uri: appConfig.apiUrl + userPath + 'drive/items/' + params.itemId + '/thumbnails/0',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + params.accessToken,
    },
    qs: {
      select: size,
    },
    json: true,
  };
  return promiseRetry(async function (retry, number) {
    try {
      const result = await request(options);
      for await (const prop of Object.keys(result)) {
        if (result[prop].url) {
          return result[prop];
        }
      }
    } catch (error) {
      if ([500, 502, 503, 504].includes(error.statusCode)) {
        return retry('retry');
      }
      throw error;
    }
  }, params.retryOptions);
}

module.exports = getThumbnails;
