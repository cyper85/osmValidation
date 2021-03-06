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

var osmValidation;
(function() {
    var osmValidationClass = osmValidationClass || function() {
        // Flag-System
        this.PLAIN_FLAG = "";
        this.msg = this.PLAIN_FLAG;

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
        var map = function(array, fn) {
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
        var mapDomain = function(string, fn) {
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
        const encode = function(input) {
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
                        for (var k = base; /* no condition */ ; k += base) {
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

        var idn2ascii = function(urlpart) {
            return mapDomain(urlpart, function(string) {
                return regexNonASCII.test(string) ?
                    'xn--' + encode(string) :
                    string;
            });
        };
        
        /**
         * Flag vor emergency Phonenumbers
         */
        this.PHONE_EMERGENCY = "phonenumber is a valid emergency number";
        this.PHONE_VALID = "phonenumber is a valid international number";
        this.PHONE_INVALID = "number is not a emergency number or an international phonenumber (\+\d{1,4} \d+( \d+(-\d+)))";

        /**
         * Tests Phonenumbers
         *
         * @param {String} phonenumber
         * @returns {Boolean}
         */
        this.phone = function(number) {
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
                    this.msg = this.PHONE_EMERGENCY;
                    return true;
                    break;
                    /*
                     * international-number
                     */
                default:
                    var regex = /^\+(?:[0-9][ -]?){6,14}[0-9]$/;
                    if (regex.test(number)) {
                        this.msg = this.PHONE_VALID;
                        return true;
                    } else {
                        this.msg = this.PHONE_INVALID;
                        return false;
                    }
            }
        };

        this.MAIL_VALID = "email is valid";
        this.MAIL_INVALID = "email is invalid";

        /**
         * Tests emailaddresses
         *
         * @param {string} mailaddress
         * @returns {boolean}
         */
        this.mail = function(email) {
            var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (regex.test(email)) {
                this.msg = this.MAIL_VALID;
                return true;
            } else {
                this.msg = this.MAIL_INVALID;
                return false;
            }
        };

        this.URL_PROTOCOLL_INVALID = "URL has no or wrong protocoll. At this time, I allow only http or https";
        this.URL_LOCAL_ADDRESS = "URL to a local service is not useful";
        this.URL_HOST_INVALID = "Host is not a ipv4- or ipv6-address and it has no fqdn";
        this.URL_INVALID = "URL seems broken";
        this.URL_VALID = "URL is valid";
        
        /**
         * Tests URL
         * @param {string} url
         * @returns {boolean}
         */
        this.url = function(url) {

            /*
             * Protocoll
             */
            var protocoll = /^https?:\/\//i;

            if (!protocoll.test(url)) {
                this.msg = this.URL_PROTOCOLL_INVALID;
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
                    this.msg = this.URL_LOCAL_ADDRESS;
                    return false;
                }
                url = url.replace(host_ipv4, "");
            } else if (host_ipv6.test(url)) {
                // Check for local network addresses (not allowed)
                var local_ipv6 = /^\[(([fF]([cCdD]|[eE]80))|(::\d+\]))/;
                if (local_ipv6.test(url)) {
                    this.msg = this.URL_LOCAL_ADDRESS;
                    return false;
                }
                url = url.replace(host_ipv6, "");

            } else if (!host_domain.test(url)) {
                // Test IDN
                var idn_name_regex = /^.+([?#/].*)$/;
                var idn = idn2ascii(url.replace(idn_name_regex, ""));
                var idn_decoded = idn2ascii(idn);
                if (!host_domain.test(idn_decoded)) {
                    this.msg = this.URL_HOST_INVALID;
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
                this.msg = this.URL_VALID;
                return true;
            }

            /*
             * delimiter
             */
            var delimiter = /^([?#/].*)?$/;
            if (delimiter.test(url)) {
                this.msg = this.URL_VALID;
                return true;
            } else {
                this.msg = this.URL_INVALID;
                return false;
            }
        };

        this.FACEBOOK_ID_ONLY = "correct facebook ID";
        this.FACEBOOK_URL_VALID = "correct facebook-page URL";
        this.FACEBOOK_URL_INVALID = "Neither a valid facebook ID nor a plain link (without parameter) to a page";
        
        /**
         * Validate Facebook-IDs
         * @param {string} facebookID
         * @returns {Boolean}
         */
        this.facebook = function(facebookID) {
            // Teste auf ID
            var facebookChars = /^[a-z0-9.]{5,}$/i;
            if (facebookChars.test(facebookID)) {
                this.msg = this.FACEBOOK_ID_ONLY;
                return true;
            }

            // Teste auf URL
            var facebookURL = /^(?:https?:\/\/?)?(?:www\.?)?(?:facebook|fb?)\.com\/(?:(?:[a-z0-9.]{5,}?)|pages\/(?:[^/?#\s]{5,}?)\/(?:[0-9]{5,}?)?)[\/]?$/i;
            if (facebookURL.test(facebookID)) {
                this.msg = this.FACEBOOK_URL_VALID;
                return true;
            }
            this.msg = this.FACEBOOK_URL_INVALID;
            return false;
        };

        this.TWITTER_ID_ONLY = "correct twitter ID";
        this.TWITTER_URL_VALID = "correct twitter-page URL";
        this.TWITTER_URL_INVALID = "Neither a valid twitter ID nor a plain link (without parameter) to a page";
        
        /**
         * Validate Twitter-IDs
         * @param {string} twitterID
         * @returns {Boolean}
         */
        this.twitter = function(twitterID) {
            // Nur Nutzername
            if (/^[@]?[a-z0-9_]{1,15}$/i.test(twitterID)) {
                this.msg = this.TWITTER_ID_ONLY
                return true;
            } else if (/^(?:https?:\/\/)?(?:www\.)?twitter\.(?:(?:com)|(?:de))\/[@]?[a-z0-9_]{1,15}$/i.test(twitterID)) {
                this.msg = this.TWITTER_URL_VALID
                return true;
            } else {
                this.msg = this.TWITTER_URL_INVALID
                return false;
            }
            var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return regex.test(twitterID);
        };

        this.GOOGLE_ID_ONLY = "correct google ID";
        this.GOOGLE_NAME_ONLY = "correct google plus name";
        this.GOOGLE_URL_VALID = "correct google-page URL";
        this.GOOGLE_URL_INVALID = "Neither a valid google ID, name nor a plain link (without parameter) to a page";
        
        /**
         * Validate google-plus-IDs
         * @param {string} googleID
         * @returns {Boolean}
         */
        this.google = function(googleID) {
            if (/^\d{+}21}$/.test(googleID)) {
                this.msg = this.GOOGLE_ID_ONLY;
                return true;
            } else if (/^(?:\+?)?[a-z][a-z0-9-_]+$/i.test(googleID)) {
                this.msg = this.GOOGLE_NAME_ONLY;
                return true;
            } else if (/^(?:https?:\/\/)?plus.google.com\/(?:(?:\w\/\d\/)|(?:communities\/))?((\d{21})|((?:\+)?[a-z][a-z0-9-_]+))[/]?$/i.test(googleID)) {
                this.msg = this.GOOGLE_URL_VALID;
                return true;
            }
            this.msg = this.GOOGLE_URL_INVALID;
            return false;
        };

        this.WIKIPEDIA_INCLUDING_LANG = "correct wikipedia page-name including language-tag";
        this.WIKIPEDIA_EXCLUDING_LANG = "correct wikipedia page-name without language-tag";
        this.WIKIPEDIA_URL = "correct wikipedia url";
        this.WIKIPEDIA_INVALID = "Wikipedia-Tag not valid";
        
        /**
         * Validate wikipedia-pages
         * @param {string} wikipediaPage
         * @returns {Boolean}
         */
        this.wikipedia = function(wikipediaPage) {
            this.msg = this.WIKIPEDIA_EXCLUDING_LANG;
            var urlRegex = /^(https?\:\/\/\w+\.wikipedia\.org\/wiki\/)/i;
            var langRegex = /^([a-z]{2,}\:)/;
            if(urlRegex.test(wikipediaPage) && this.url(wikipediaPage)) {
              this.msg = this.WIKIPEDIA_URL;
              wikipediaPage = wikipediaPage.replace(urlRegex, "");
            } else if (langRegex.test(wikipediaPage)) {
                this.msg = this.WIKIPEDIA_INCLUDING_LANG;
                wikipediaPage = wikipediaPage.replace(langRegex, "");
            }

            if(/[~]{3,}/.test(wikipediaPage)) {
              this.msg = this.WIKIPEDIA_INVALID;
              return false;
            }
            if(/[#<>\[\]|{}]/.test(wikipediaPage)) {
              this.msg = this.WIKIPEDIA_INVALID;
              return false;
            }
            if(/^[:]/.test(wikipediaPage)) {
              this.msg = this.WIKIPEDIA_INVALID;
              return false;
            }
            if(/^[.]{1,2}\//.test(wikipediaPage)) {
              this.msg = this.WIKIPEDIA_INVALID;
              return false;
            }
            if(/\/[.]{1,2}$/.test(wikipediaPage)) {
              this.msg = this.WIKIPEDIA_INVALID;
              return false;
            }
            if(/\/[.]{1,2}\//.test(wikipediaPage)) {
              this.msg = this.WIKIPEDIA_INVALID;
              return false;
            }
            if(/^(?:(special)|(user)|(talk)|(user[_ ]talk))\:/i.test(wikipediaPage)) {
              this.msg = this.WIKIPEDIA_INVALID;
              return false;
            }
            return true;
        };

        this.WIKIDATA_VALID_TAG = "correct wikidata tag";
        this.WIKIDATA_INVALID = "Wikidata-Tag not valid";
        
        /**
         * validate wikidata IDs
         * @param {string} wikidataID
         * @returns {Boolean}
         */
        this.wikidata = function(wikidataID) {
            if(/^Q\d+$/.test(wikidataID)) {
              this.msg = this.WIKIDATA_VALID_TAG;
              return true;
            } else {
                this.msg = this.WIKIDATA_INVALID;
                return false;
            }

        };
    };

    // Standard
    osmValidation = new osmValidationClass();
})();

// JQuery
if (typeof jQuery !== typeof undefined) {
    (function($) {
        $.fn.extend({
            osmValidate: function(parameters) {
                var configuration = {
                    type: "default"
                };
                parameters = $.extend(configuration, parameters);
                return $(this).each(function() {
                    var input;
                    // Generate input
                    if ($(this).prev().is("input")) {
                        input = $(this).val();
                    } else {
                        input = $(this).text();
                    }
                    if (parameters.type === "default") {
                        // Check, if we have a data-field
                        var attr_type = $(this).attr('type');
                        var data_type = $(this).data('type');
                        // Check, if we have a type-field
                        if (typeof attr_type !== typeof undefined && attr_type !== false && (typeof osmValidation[attr_type] === 'function')) {
                            parameters.type = attr_type;
                        } else
                            // Set URL as default
                            if (typeof data_type !== typeof undefined && data_type !== false && (typeof osmValidation[data_type] === 'function')) {
                                parameters.type = data_type;
                            }
                    }
                    if (typeof parameters.type !== typeof undefined && parameters.type !== false && (typeof osmValidation[parameters.type] === 'function')) {
                        return osmValidation[parameters.type](input);
                    }
                });
            }
        });
    })(jQuery);
}

// NodeJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = osmValidation;
}
