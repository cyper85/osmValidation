var assert = require('assert');
var osmValidation = require('../osmValidation.js');
describe('phonenumbers', function() {
  it('Test phonenumbers: +49 111 2314-456', function() {
    assert.equal(true,osmValidation.phone("+49 111 2314-456"));
  });
  it('Test phonenumbers: 112', function() {
    assert.equal(true,osmValidation.phone("112"));
  });
  it('Test phonenumbers: 911', function() {
    assert.equal(true,osmValidation.phone("911"));
  });
  it('Test phonenumbers: 0111 23 14 45', function() {
    assert.equal(false,osmValidation.phone("0111 23 14 45"));
  });
});
