/*
 * The MIT License
 *
 * Copyright 2017 Andreas Neumann <andr.neumann@googlemail.com>.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var assert = require('assert');
var osmValidation = require('../osmValidation.js');
describe('wikipedia pages', function() {
  it('Test wikipedia tag value: "de:Ilmenau"', function() {
    assert.equal(true,osmValidation.wikipedia("de:Ilmenau"));
  });
  it('Test wikipedia tag value: "OpenStreetMap"', function() {
    assert.equal(true,osmValidation.wikipedia("OpenStreetMap"));
  });
  it('Test wikipedia tag value: "https://de.wikipedia.org/wiki/ID_(OpenStreetMap)"', function() {
    assert.equal(true,osmValidation.wikipedia("https://de.wikipedia.org/wiki/ID_(OpenStreetMap)"));
  });
  it('Test wikipedia tag value: "iD (OpenStreetMap)"', function() {
    assert.equal(true,osmValidation.wikipedia("iD (OpenStreetMap)"));
  });
  it('Test wikipedia tag value: "Österreich"', function() {
    assert.equal(true,osmValidation.wikipedia("Österreich"));
  });
  it('Test wikipedia tag value: "User:cyper"', function() {
    assert.equal(false,osmValidation.wikipedia("User:Cyper"));
  });
  it('Test wikipedia tag value: "./invalid"', function() {
    assert.equal(false,osmValidation.wikipedia("./invalid"));
  });
  it('Test wikipedia tag value: "/tmp/test/."', function() {
    assert.equal(false,osmValidation.wikipedia("/tmp/test/."));
  });
  it('Test wikipedia tag value: "false [bracket]"', function() {
    assert.equal(false,osmValidation.wikipedia("false [bracket]"));
  });
  it('Test wikipedia tag value: "Three Tildes ~~~ Test"', function() {
    assert.equal(false,osmValidation.wikipedia("Three Tildes ~~~ Test"));
  });
});
