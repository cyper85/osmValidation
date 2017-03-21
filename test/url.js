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
describe('urls', function () {
    it('Test url: http://google.de/#test=test', function () {
        assert.equal(true, osmValidation.url("http://google.de/#test=test"));
    });
    it('Test url: https://127.0.0.1/?ab=f', function () {
        assert.equal(false, osmValidation.url("https://127.0.0.1/?ab=f"));
    });
    it('Test url: https://server-börse.de', function () {
        assert.equal(true, osmValidation.url("https://server-börse.de"));
    });
    it('Test url: file:///C:\\test', function () {
        assert.equal(false, osmValidation.url("file:///C:\test"));
    });
    it('Test url: HtTpS://printer.box:8080/test/folder?get=default', function () {
        assert.equal(true, osmValidation.url("HtTpS://printer.box:8080/test/folder?get=default"));
    });
    it('Test url: https://127.0.0.1', function () {
        assert.equal(false, osmValidation.url("https://127.0.0.1"));
    });
    it('Test url: http://[2001:4860:0:2001::68]:80#!test', function () {
        assert.equal(true, osmValidation.url("http://[2001:4860:0:2001::68]:80#!test"));
    });
    it('Test url: http://[::1]:443', function () {
        assert.equal(false, osmValidation.url("http://[::1]:443"));
    });
});