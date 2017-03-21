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
describe('google plus IDs', function () {
    it('Test google plus ID: https://plus.google.com/+google/', function () {
        assert.equal(true, osmValidation.google("https://plus.google.com/+google/"));
    });
    it('Test google plus ID: https://plus.google.com/communities/104645458102703754878', function () {
        assert.equal(true, osmValidation.google("https://plus.google.com/communities/104645458102703754878"));
    });
    it('Test google plus ID: HTTP://plus.google.com/108288211774646493519', function () {
        assert.equal(true, osmValidation.google("https://plus.google.com/108288211774646493519"));
    });
    it('Test google plus ID: https://plus.google.com/u/0/108288211774646493519', function () {
        assert.equal(true, osmValidation.google("https://plus.google.com/u/0/108288211774646493519"));
    });
    it('Test google plus ID: +AndreasNeumann', function () {
        assert.equal(true, osmValidation.google("+AndreasNeumann"));
    });
    it('Test google plus ID: https://aboutme.google.com', function () {
        assert.equal(false, osmValidation.google("https://aboutme.google.com/"));
    });
    it('Test google plus ID: https://plus.google.com/108288211774646493519/palette', function () {
        assert.equal(false, osmValidation.google("https://plus.google.com/108288211774646493519/palette"));
    });
});