var qiniu = require('../');
var should = require('should');
var path = require('path');

qiniu.conf.ACCESS_KEY = process.env.QINIU_ACCESS_KEY;
qiniu.conf.SECRET_KEY = process.env.QINIU_SECRET_KEY;

var TEST_BUCKET = process.env.QINIU_TEST_BUCKET;
var TEST_DOMAIN = process.env.QINIU_TEST_DOMAIN;
var imageFile = path.join(__dirname, 'logo.png');

describe('test start step2:', function() {

  describe('rs.test.js', function() {

    var client = new qiniu.rs.Client();

    var EntryPath = qiniu.rs.EntryPath;
    var EntryPathPair = qiniu.rs.EntryPathPair;

    describe('single file handle', function() {

      before(function(done) {
        var putPolicy = new qiniu.rs.PutPolicy(TEST_BUCKET);
        var uptoken = putPolicy.token();
        qiniu.io.putFile(uptoken, 'logo2.png', imageFile, null, function(ret) {
          ret.code.should.equal(200);
        });
        qiniu.io.putFile(uptoken, 'logo.png', imageFile, null, function(ret) {
          ret.code.should.equal(200);
          done();
        });
      });

      describe('rs.Client#stat()', function() {
        it('get the stat of a file', function(done) {
          client.stat(TEST_BUCKET, 'logo.png', function(ret) {
            ret.code.should.equal(200);
            ret.data.should.have.keys('hash', 'fsize', 'putTime', 'mimeType');
            done();
          });
        });
      });

      describe('rs.Client#copy()', function() {
        it('copy logo.png to logo1.png', function(done) {
          client.copy(TEST_BUCKET, 'logo.png', TEST_BUCKET, 'logo1.png', function(ret) {
            ret.code.should.equal(200);
            done();
          });
        });
      });

      describe('rs.Client#remove()', function() {
        it('remove logo.png', function(done) {
          client.remove(TEST_BUCKET, 'logo.png', function(ret) {
            ret.code.should.equal(200);
            done();
          });
        });
      });

      describe('rs.Client#move()', function() {
        it('move logo1.png to logo.png', function(done) {
          client.move(TEST_BUCKET, 'logo1.png', TEST_BUCKET, 'logo.png', function(ret) {
            ret.code.should.equal(200);
            done();
          });
        });
      });
    });

    describe('batch file handle', function() {

      after(function(done) {
        var entries = [new EntryPath(TEST_BUCKET, 'logo.png'), new EntryPath(TEST_BUCKET, 'logo2.png')];

        client.batchDelete(entries, function(ret) {
          ret.code.should.equal(200);
          done();
        });
      });

      describe('rs.Client#batchStat()', function() {
        it('get the stat of logo.png and logo2.png', function(done) {
          var entries = [
            new EntryPath(TEST_BUCKET, 'logo.png'), 
            new EntryPath(TEST_BUCKET, 'logo2.png')];

            client.batchStat(entries, function(ret) {
              ret.code.should.equal(200);
              ret.data.length.should.equal(2);
              for (i in ret.data) {
                ret.data[i].code.should.equal(200);
                ret.data[i].data.should.have.keys('fsize', 'hash', 'mimeType', 'putTime');
              }
              done();
            });
        });

        it('should return code 298 when partial ok', function(done) {

          var entries = [
            new EntryPath(TEST_BUCKET, 'logo.png'), 
            new EntryPath(TEST_BUCKET, 'not exist file')];

            client.batchStat(entries, function(ret) {

              ret.code.should.equal(298);
              ret.data.length.should.equal(2);

              for (i in ret.data) {
                if (ret.data[i].code !== 200) {
                  ret.data[i].code.should.equal(612);
                  ret.data[i].data.should.have.keys('error');
                }
              }

              done();
            });
        });

      });

      describe('rs.Client#batchCopy', function() {
        var entries = [];
        entries.push(new EntryPathPair(new EntryPath(TEST_BUCKET, 'logo.png'), new EntryPath(TEST_BUCKET, 'logo1.png')));
        entries.push(new EntryPathPair(new EntryPath(TEST_BUCKET, 'logo2.png'), new EntryPath(TEST_BUCKET, 'logo3.png')));

        it('copy from logo, logo2 to logo1, logo3', function(done) {
          client.batchCopy(entries, function(ret) {
            ret.code.should.equal(200);
            done();
          });
        });
      });

      describe('rs.Client#batchDelete', function() {
        var entries = [new EntryPath(TEST_BUCKET, 'logo.png'), new EntryPath(TEST_BUCKET, 'logo2.png')];

        it('delete logo.png, logo2.png', function(done) {
          client.batchDelete(entries, function(ret) {
            ret.code.should.equal(200);
            done();
          });
        });
      });

      describe('rs.Client#batchMove', function() {
        var entries = [];
        entries.push(new EntryPathPair(new EntryPath(TEST_BUCKET, 'logo1.png'), new EntryPath(TEST_BUCKET, 'logo.png')));
        entries.push(new EntryPathPair(new EntryPath(TEST_BUCKET, 'logo3.png'), new EntryPath(TEST_BUCKET, 'logo2.png')));

        it('move from logo1.png, logo3.png to logo.png, logo2.png', function(done) {
          client.batchMove(entries, function(ret) {
            ret.code.should.equal(200);
            done();
          });
        });
      });
    });

    // rs.GetPolicy#makeRequest()

  });
});
