// uploadSession.js
const request = require('request-promise');
const path = require('path');
const promiseRetry = require('promise-retry');
const userPathGenerator = require('../helpers/pathHelper');
const Writable = require('stream').Writable;

/**
 * @function uploadSession
 * @description Create file with session upload
 *
 * @param {Object} params
 * @param {String} params.accessToken OneDrive access token
 * @param {String} params.filename File name
 * @param {String} [params.parentId=root] Parent id
 * @param {String} [params.parentPath] Parent id
 * @param {Object} params.readableStream Readable Stream with file's content
 * @param {Number} params.fileSize Size of file
 * @param {Number} [params.chunksToUpload=20] Number of chunks to upload at a time
 * @param {Object} [params.retryOptions]
 * @param {Boolean} [params.retryOptions.forever=false] Whether to retry forever.
 * @param {Boolean} [params.retryOptions.unref=false] Whether to [unref](https://nodejs.org/api/timers.html#timers_unref) the setTimeout's.
 * @param {Number} [params.retryOptions.maxRetryTime=Infinity] The maximum time (in milliseconds) that the retried operation is allowed to run.
 * @param {Number} [params.retryOptions.retries=1] The maximum amount of times to retry the operation.
 *
 * @return {Object} Item
 */

function uploadSession(params) {
  if (!params.accessToken) {
    throw new Error('Missing params.accessToken');
  }

  if (!params.filename) {
    throw new Error('Missing params.filename');
  }

  if (!params.readableStream) {
    throw new Error('Missing params.readableStream');
  }

  if (!params.fileSize) {
    throw new Error('Missing params.fileSize');
  }

  return new Promise(function (resolve, reject) {
    params.parentId = params.parentId === undefined ? 'root' : params.parentId;
    const userPath = userPathGenerator(params);

    params.chunksToUpload = params.chunksToUpload === undefined ? 20 : params.chunksToUpload;

    let uri;
    if (params.parentPath !== undefined && typeof params.parentPath === 'string') {
      uri =
        appConfig.apiUrl +
        userPath +
        'drive/root:/' +
        path.join(params.parentPath, params.filename) +
        ':/createUploadSession';
    } else if (params.parentId) {
      uri =
        appConfig.apiUrl +
        userPath +
        'drive/items/' +
        params.parentId +
        ':/' +
        params.filename +
        ':/createUploadSession';
    } else {
      params.parentId = 'root';
      uri = appConfig.apiUrl + userPath + 'drive/' + params.parentId + ':/' + params.filename + ':/createUploadSession';
    }
    // total uploaded bytes
    let uploadedBytes = 0;
    // size of the chunks that are going to be uploaded
    let chunksToUploadSize = 0;
    // chunks we've accumulated in memory that we're going to upload
    let chunks = [];
    let percent = 0;
    let urlResponse;

    request({
      method: 'POST',
      uri,
      headers: {
        Authorization: 'Bearer ' + params.accessToken,
      },
      body: {
        '@microsoft.graph.conflictBehavior': 'rename',
        fileSystemInfo: { '@odata.type': 'microsoft.graph.fileSystemInfo' },
        name: params.filename,
      },
      resolveWithFullResponse: true,
      json: true,
    })
      .then(function (_urlResponse) {
        urlResponse = _urlResponse;
        if (urlResponse.statusCode >= 400) {
          return reject(urlResponse.body);
        }
        params.readableStream
          .on('data', function (chunk) {
            chunks.push(chunk);
            chunksToUploadSize += chunk.length;
            // upload only if we've specified number of chunks in memory OR we're uploading the final chunk
            if (chunks.length === params.chunksToUpload || chunksToUploadSize + uploadedBytes === params.fileSize) {
              params.readableStream.pause();
              // make buffer from the chunks
              const payload = Buffer.concat(chunks, chunksToUploadSize);
              let uploadResponse;
              promiseRetry(async function (retry, number) {
                try {
                  const _uploadResponse = await request({
                    method: 'PUT',
                    uri: urlResponse.body.uploadUrl,
                    headers: {
                      'Content-Length': chunksToUploadSize,
                      'Content-Range':
                        'bytes ' +
                        uploadedBytes +
                        '-' +
                        (uploadedBytes + chunksToUploadSize - 1) +
                        '/' +
                        params.fileSize,
                    },
                    body: payload,
                    resolveWithFullResponse: true,
                  });
                  uploadResponse = _uploadResponse;
                  // Retry if error
                  if ([500, 502, 503, 504].includes(uploadResponse.statusCode)) {
                    return retry(uploadResponse.body);
                  }
                  if (uploadResponse.statusCode >= 400) {
                    console.log('err', uploadResponse.body);
                    return reject(uploadResponse.body);
                  }
                  // update uploaded bytes
                  uploadedBytes += chunksToUploadSize;
                  percent = ((uploadedBytes / params.fileSize) * 100).toFixed(2);
                  params.readableStream.emit('uploaded', percent);
                  // reset for next chunks
                  chunks = [];
                  chunksToUploadSize = 0;
                  if (
                    uploadResponse.statusCode === 201 ||
                    uploadResponse.statusCode === 203 ||
                    uploadResponse.statusCode === 200
                  ) {
                    resolve(JSON.parse(uploadResponse.body));
                  }
                  params.readableStream.resume();
                } catch (err) {
                  console.log(err);
                  reject(err);
                }
              }, params.retryOptions);
            }
          })
          .on('error', function (err) {
            reject(err);
          })
          .on('end', function () {
            // Delete if filesize is wrong
            if (percent !== 100) {
              if (urlResponse)
                request({
                  method: 'DELETE',
                  uri: urlResponse.body.uploadUrl,
                  headers: {
                    Authorization: 'Bearer ' + params.accessToken,
                  },
                })
                  .then((result) => {
                    console.log('deleted onedrive upload session');
                    reject('deleted onedrive upload session');
                  })
                  .catch(reject);
              else reject('file stream is closed');
            }
          });
      })
      .catch(reject);
  });
}

module.exports = uploadSession;
