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

if (typeof osmValidation === "undefined") {
    var osmValidation;
}

(function () {

    // Create a reference to this
    osmValidation = new Object();

    /** Regular expressions */

    const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators
    const regexNonASCII = /[^\0-\x7E]/; // non-ASCII chars
    const regexPunycode = /^xn--/;
    /** Highest positive signed 32-bit float value */
    const maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1
    /** Bootstring parameters */
    const base = 36;
    const tMin = 1;
    const tMax = 26;
    const skew = 38;
    const damp = 700;
    const initialBias = 72;
    const initialN = 128; // 0x80
    const delimiter = '-'; // '\x2D



    /** Convenience shortcuts */
    const baseMinusTMin = base - tMin;
    const floor = Math.floor;
    const stringFromCharCode = String.fromCharCode;


    /**
     * A generic `Array#map` utility function.
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} callback The function that gets called for every array
     * item.
     * @returns {Array} A new array of values returned by the callback function.
     */
    var map = function (array, fn) {
        const result = [];
        var length = array.length;
        while (length--) {
            result[length] = fn(array[length]);
        }
        return result;
    }

    /**
     * A simple `Array#map`-like wrapper to work with domain name strings or email
     * addresses.
     * @private
     * @param {String} domain The domain name or email address.
     * @param {Function} callback The function that gets called for every
     * character.
     * @returns {Array} A new string of characters returned by the callback
     * function.
     */
    var mapDomain = function (string, fn) {
        const parts = string.split('@');
        var result = '';
        if (parts.length > 1) {
            // In email addresses, only the domain name should be punycoded. Leave
            // the local part (i.e. everything up to `@`) intact.
            result = parts[0] + '@';
            string = parts[1];
        }
        // Avoid `split(regex)` for IE8 compatibility. See #17.
        string = string.replace(regexSeparators, '\x2E');
        const labels = string.split('.');
        const encoded = map(labels, fn).join('.');
        return result + encoded;
    }

    /**
     * Creates an array containing the numeric code points of each Unicode
     * character in the string. While JavaScript uses UCS-2 internally,
     * this function will convert a pair of surrogate halves (each of which
     * UCS-2 exposes as separate characters) into a single code point,
     * matching UTF-16.
     * @see `punycode.ucs2.encode`
     * @see <https://mathiasbynens.be/notes/javascript-encoding>
     * @memberOf punycode.ucs2
     * @name decode
     * @param {String} string The Unicode input string (UCS-2).
     * @returns {Array} The new array of code points.
     */
    function ucs2decode(string) {
        const output = [];
        var counter = 0;
        const length = string.length;
        while (counter < length) {
            const value = string.charCodeAt(counter++);
            if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                // It's a high surrogate, and there is a next character.
                const extra = string.charCodeAt(counter++);
                if ((extra & 0xFC00) == 0xDC00) { // Low surrogate.
                    output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                } else {
                    // It's an unmatched surrogate; only append this code unit, in case the
                    // next code unit is the high surrogate of a surrogate pair.
                    output.push(value);
                    counter--;
                }
            } else {
                output.push(value);
            }
        }
        return output;
    }

    /**
     * Converts a string of Unicode symbols (e.g. a domain name label) to a
     * Punycode string of ASCII-only symbols.
     * @memberOf punycode
     * @param {String} input The string of Unicode symbols.
     * @returns {String} The resulting Punycode string of ASCII-only symbols.
     */
    const encode = function (input) {
        const output = [];

        // Convert the input in UCS-2 to an array of Unicode code points.
        input = ucs2decode(input);

        // Cache the length.
        var inputLength = input.length;

        // Initialize the state.
        var n = 128;
        var delta = 0;
        var bias = 72;

        // Handle the basic code points.
        for (var currentValue of input) {
            if (currentValue < 0x80) {
                output.push(stringFromCharCode(currentValue));
            }
        }

        var basicLength = output.length;
        var handledCPCount = basicLength;

        // `handledCPCount` is the number of code points that have been handled;
        // `basicLength` is the number of basic code points.

        // Finish the basic string with a delimiter unless it's empty.
        if (basicLength) {
            output.push('-');
        }

        // Main encoding loop:
        while (handledCPCount < inputLength) {

            // All non-basic code points < n have been handled already. Find the next
            // larger one:
            var m = maxInt;
            for (var currentValue of input) {
                if (currentValue >= n && currentValue < m) {
                    m = currentValue;
                }
            }

            // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
            // but guard against overflow.
            const handledCPCountPlusOne = handledCPCount + 1;
            if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
                error('overflow');
            }

            delta += (m - n) * handledCPCountPlusOne;
            n = m;

            for (var currentValue of input) {
                if (currentValue < n && ++delta > maxInt) {
                    error('overflow');
                }
                if (currentValue == n) {
                    // Represent delta as a generalized variable-length integer.
                    var q = delta;
                    for (var k = base; /* no condition */; k += base) {
                        const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
                        if (q < t) {
                            break;
                        }
                        const qMinusT = q - t;
                        const baseMinusT = base - t;
                        output.push(
                                stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
                                );
                        q = floor(qMinusT / baseMinusT);
                    }

                    output.push(stringFromCharCode(digitToBasic(q, 0)));
                    bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                    delta = 0;
                    ++handledCPCount;
                }
            }

            ++delta;
            ++n;

        }
        return output.join('');
    };

    /**
     * Converts a Unicode string representing a domain name or an email address to
     * Punycode. Only the non-ASCII parts of the domain name will be converted,
     * i.e. it doesn't matter if you call it with a domain that's already in
     * ASCII.
     * @memberOf punycode
     * @param {String} input The domain name or email address to convert, as a
     * Unicode string.
     * @returns {String} The Punycode representation of the given domain name or
     * email address.
     */

    var idn2ascii = function (urlpart) {
        return mapDomain(urlpart, function (string) {
            return regexNonASCII.test(string)
                    ? 'xn--' + encode(string)
                    : string;
        });
    };

    /**
     * Tests Phonenumbers
     * 
     * @param {String} phonenumber
     * @returns {Boolean} 
     */
    osmValidation.phone = function (number) {
        switch (number) {
            /*
             * emergency-numbers
             */
            case "000":
            case "15":
            case "17":
            case "18":
            case "061":
            case "062":
            case "080":
            case "081":
            case "085":
            case "088":
            case "091":
            case "092":
            case "100":
            case "101":
            case "102":
            case "103":
            case "108":
            case "110":
            case "112":
            case "113":
            case "117":
            case "118":
            case "119":
            case "122":
            case "123":
            case "133":
            case "143":
            case "144":
            case "145":
            case "147":
            case "150":
            case "153":
            case "154":
            case "155":
            case "158":
            case "160":
            case "165":
            case "166":
            case "190":
            case "191":
            case "192":
            case "193":
            case "194":
            case "199":
            case "911":
            case "995":
            case "996":
            case "997":
            case "998":
            case "999":
            case "0123":
            case "1006":
            case "1414":
            case "1415":
            case "1515":
            case "1530":
            case "1669":
            case "02800":
                return true;
                break;
                /*
                 * international-number
                 */
            default:
                var regex = /^\+(?:[0-9][ -]?){6,14}[0-9]$/;
                return regex.test(number);
        }
    };

    /**
     * Tests emailaddresses
     * 
     * @param {String} mailaddress
     * @returns {Boolean} 
     */
    osmValidation.mail = function (email) {
        var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(email);
    };

    /**
     * Tests URL
     * @param {String} Url
     * @returns {Boolean} 
     */
    osmValidation.url = function (url) {

        /*
         * Protocoll
         */
        var protocoll = /^https?:\/\//i;

        if (!protocoll.test(url)) {
            return false;
        } else {
            url = url.replace(protocoll, "");
        }

        /*
         * Remove Username & Password
         */
        var userpass = /^((\w|\d)(?:\:(\w|\d)+?)\@)/;
        url = url.replace(userpass, "");

        /*
         * Host-Adress
         */
        var host_ipv4 = /^(1?\d{1,2}|2[0-4][0-9]|25[0-5])\.(1?\d{1,2}|2[0-4][0-9]|25[0-5])\.(1?\d{1,2}|2[0-4][0-9]|25[0-5])\.(1?\d{1,2}|2[0-4][0-9]|25[0-5])/;
        var host_ipv6 = /^\[(([0-9A-Fa-f]{1,4}:){1,7}|:)(:|([0-9A-Fa-f]{1,4}:){1,7})[0-9A-Fa-f]{0,4}\]/;
        var host_domain = /^[0-9a-zA-Z-_.~]+\.\w+/;

        if (host_ipv4.test(url)) {
            // Check for local network addresses (not allowed)
            var local_ipv4 = /^((0?10\.)|(127\.)|(192\.168\.)|(169\.254\.)|(172\.0?((1[6-9])|(2[0-9])|(3[0-1]))\.))/;
            if (local_ipv4.test(url)) {
                return false;
            }
            url = url.replace(host_ipv4, "");
        } else if (host_ipv6.test(url)) {
            // Check for local network addresses (not allowed)
            var local_ipv6 = /^\[(([fF]([cCdD]|[eE]80))|(::\d+\]))/;
            if (local_ipv6.test(url)) {
                return false;
            }
            url = url.replace(host_ipv6, "");

        } else if (!host_domain.test(url)) {
            // Test IDN
            var idn_name_regex = /^.+([?#/].*)$/;
            var idn = idn2ascii(url.replace(idn_name_regex, ""));
            var idn_decoded = idn2ascii(idn);
            if (!host_domain.test(idn_decoded)) {
                return false;
            } else {
                url = url.replace(/^(.+)(?:[?#/].*?)?$/, "");
            }
        } else {
            url = url.replace(host_domain, "");
        }
        /*
         * Port
         */
        var port = /^\:\d+/;
        url = url.replace(port, "");

        /*
         * End?
         */
        if (url.length === 0) {
            return true;
        }

        /*
         * delimiter
         */
        var delimiter = /^([?#/].*)?$/;
        return delimiter.test(url);
    };
    osmValidation.facebook = function (email) {
        var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(email);
    };
    osmValidation.twitter = function (email) {
        var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(email);
    };
    osmValidation.google = function (email) {
        var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(email);
    };

    // Export the Underscore object for **CommonJS**, with backwards-compatibility
    // for the old `require()` API. If we're not in CommonJS, add `_` to the
    // global object.
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = osmValidation;
    }
})();

