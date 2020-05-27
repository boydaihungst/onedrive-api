// uploadSimple.js
const request = require('request');
const path = require('path');
const userPathGenerator = require('../helpers/pathHelper');

/**
 * @function uploadSimple
 * @description Create file with simple upload
 *
 * @param {Object} params
 * @param {String} params.accessToken OneDrive access token
 * @param {String} params.filename File name
 * @param {String} [params.parentId=root] Parent id
 * @param {Object} params.readableStream Readable Stream with file's content
 *
 * @return {Object} Item
 */

function uploadSimple(params) {
  if (!params.accessToken) {
    throw new Error('Missing params.accessToken');
  }

  if (!params.filename) {
    throw new Error('Missing params.filename');
  }

  if (!params.readableStream) {
    throw new Error('Missing params.readableStream');
  }

  return new Promise(function (resolve, reject) {
    params.parentId = params.parentId === undefined ? 'root' : params.parentId;
    const userPath = userPathGenerator(params);

    let uri =
      appConfig.apiUrl + userPath + 'drive/items/' + params.parentId + '/children/' + params.filename + '/content';

    if (params.parentPath !== undefined && typeof params.parentPath === 'string')
      uri = appConfig.apiUrl + userPath + 'drive/root:/' + path.join(params.parentPath, params.filename) + ':/content';

    const options = {
      method: 'PUT',
      uri: uri,
      headers: {
        Authorization: 'Bearer ' + params.accessToken,
      },
      json: true,
    };

    params.readableStream.pipe(
      request(options, function (err, res, body) {
        if (err) return reject(err);
        else if (res.statusCode >= 400) return reject(body);
        resolve(body);
      }),
    );
  });
}

module.exports = uploadSimple;
