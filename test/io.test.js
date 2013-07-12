var qiniu = require('../');
var should = require('should');
var path = require('path');

qiniu.conf.ACCESS_KEY = process.env.QINIU_ACCESS_KEY;
qiniu.conf.SECRET_KEY = process.env.QINIU_SECRET_KEY;

var TEST_BUCKET = process.env.QINIU_TEST_BUCKET;
var TEST_DOMAIN = process.env.QINIU_TEST_DOMAIN;

var imageFile = path.join(__dirname, 'logo.png');

before(function(done) {
  if(!process.env.QINIU_ACCESS_KEY) {
    console.log('should run command `source test-env.sh` first\n');
    process.exit(0);
  }
  done();
});

describe('test start step1:', function() {

  var keys = [];

  after(function(done) {
    entries = [];
    for (i in keys) {
      entries.push(new qiniu.rs.EntryPath(TEST_BUCKET, keys[i]));
    }

    var client = new qiniu.rs.Client();
    client.batchDelete(entries, function(ret) {
      ret.code.should.equal(200);
      done();
    });
  });

  describe('io.js', function() {
    describe('upload#', function() {
      var uptoken = null;
      beforeEach(function(done) {
        var putPolicy = new qiniu.rs.PutPolicy(TEST_BUCKET);
        uptoken = putPolicy.token();
        done();
      });

      describe('io.put()', function() {
        it('test upload from memory', function(done) {
          qiniu.io.put(uptoken, 'filename', 'content', null, function(ret) {
            ret.code.should.equal(200);
            ret.data.should.have.keys('hash', 'key');
            ret.data.key.should.equal('filename');
            keys.push(ret.data.key);
            done();
          });
        });
      });

      describe('io.putWithoutKey()', function() {
        it('test upload from memory without key', function(done) {
          qiniu.io.putWithoutKey(uptoken, 'content', null, function(ret) {
            ret.code.should.equal(200);
            ret.data.should.have.keys('hash', 'key');
            ret.data.key.should.equal(ret.data.hash);
            keys.push(ret.data.key);
            done();
          });
        });
      });

      describe('io.putFile()', function() {
        it('test upload from a file', function(done) {
          qiniu.io.putFile(uptoken, 'logo.png', imageFile, null, function(ret) {
            ret.code.should.equal(200);
            ret.data.should.have.keys('key', 'hash');
            ret.data.key.should.equal('logo.png');
            keys.push(ret.data.key);
            done();
          });
        });

        it('test upload from a file with checkCrc32=1', function(done) {
          var extra = new qiniu.io.PutExtra();
          extra.checkCrc = 1;
          qiniu.io.putFile(uptoken, 'logo_crc32.png', imageFile, extra, function(ret) {
            ret.code.should.equal(200);
            ret.data.should.have.keys('key', 'hash');
            ret.data.key.should.equal('logo_crc32.png');
            keys.push(ret.data.key);
            done();
          });
        });
      });

      describe('io.putFileWithoutKey()', function() {
        it('test upload from a file without key', function(done) {
          qiniu.io.putFileWithoutKey(uptoken, imageFile, null, function(ret) {
            ret.code.should.equal(200);
            ret.data.should.have.keys('key', 'hash');
            ret.data.key.should.equal(ret.data.hash);
            keys.push(ret.data.key);
            done();
          });
        });
      });
    });
  });

  describe('rsf.js', function() {
    describe('file handle', function() {
      describe('rsf.listPrefix()', function() {
        it('list all file in test bucket', function(done) {
          qiniu.rsf.listPrefix(TEST_BUCKET, null, null, null, function(ret) {
            ret.code.should.equal(200);
            ret.data.items.length.should.equal(keys.length);
            for (i in ret.items) {
              ret.data.items[i].should.has.keys('key', 'time', 'hash', 'fsize', 'mimeType', 'customer');
              keys.indexOf(ret.data.items[i].key).should.above(-1);
            }
            done();
          });
        });
      });
    });
  });
});
