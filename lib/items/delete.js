const request = require('request-promise');
const userPathGenerator = require('../helpers/pathHelper');

/**
 * @function delete
 * @description Delete item (file or folder)
 *
 * @param {Object} params
 * @param {String} params.accessToken OneDrive access token
 * @param {String} params.itemId Item id
 *
 * @return {undefined} (204 No content)
 */

function _delete(params) {
  if (!params.accessToken) {
    throw new Error('Missing params.accessToken');
  }

  if (!params.itemId) {
    throw new Error('Missing params.itemId');
  }

  const userPath = userPathGenerator(params);

  const options = {
    method: 'DELETE',
    uri: appConfig.apiUrl + userPath + 'drive/items/' + params.itemId,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + params.accessToken,
    },
    json: true,
  };

  return request(options);
}

module.exports = _delete;
