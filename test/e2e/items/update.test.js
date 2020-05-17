// delete.test.js
const faker = require('faker');

describe('update', function() {
  const folderName = 'test-update-' + faker.random.word(),
    newFolderName = 'test-updateNew-' + faker.random.word();

  let createdFolder;

  before(function(done) {
    oneDrive.items
      .createFolder({
        accessToken: accessToken,
        rootItemId: 'root',
        name: folderName,
      })
      .then(function(_folder) {
        createdFolder = _folder;
        done();
      })
      .catch(done);
  });

  after(function(done) {
    oneDrive.items
      .delete({
        accessToken: accessToken,
        itemId: createdFolder.id,
      })
      .then(function(_item) {
        done();
      })
      .catch(errorHandler(done));
  });

  it('Should rename folder', function(done) {
    oneDrive.items
      .update({
        accessToken: accessToken,
        itemId: createdFolder.id,
        toUpdate: {
          name: newFolderName,
        },
      })
      .then(function(_item) {
        //delete returns 204 No Contentđ
        expect(_item.name).to.be.equal(newFolderName);
        done();
      })
      .catch(errorHandler(done));
  });
});
