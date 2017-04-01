# osmValidation
JavaScript library to validate various value-types of OpenStreetMap.

Useable in [https://plainjs.com](plain.js), [https://nodejs.org](node.js) and [https://jquery.com](jQuery).

## Installation
### node.js
Install osmvalidation via npm:

```bash
npm install osmvalidation
```

```javascript
var osmValidation = require('osmvalidation');

if(osmValidation.phone('+49 123 456-789')) {
    // do stuff
}
```

### jQuery
Download *osmValidation.js* and include it before you use it.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>osmValidation</title>
    </head>
    <body>
        <form>
            <input type="url" />
            <input type="submit" />
        </form>
        <script type="text/javascript" src="js/jQuery.js"></script>
        <script type="text/javascript" src="js/osmValidation.js"></script>
        <script type="text/javascript">
            $('input[type=submit]').attr('disabled','disabled');
            $('input[type=url]').onkeyup(function(){
                if($(this).validate()) {
                    $('input[type="submit"]').removeAttr('disabled');
                } else {
                    $('input[type=submit]').attr('disabled','disabled');
                }
            });
        </script>
    </body>
</html>
```

### plain js
Download *osmValidation.js* and include it before you use it.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>osmValidation</title>
    </head>
    <body>
        <form>
            <input id='url' type="url" />
            <input id='submit' type="submit" />
        </form>
        <script type="text/javascript" src="js/jQuery.js"></script>
        <script type="text/javascript" src="js/osmValidation.js"></script>
        <script type="text/javascript">
            document.getElementById('submit').onclick(function(){
            	if(osmValidation.url(document.getElementById('url').value) {
                	alert("valid");
                }
            });
        </script>
    </body>
</html>
```

## Functions
* `phone(string)` Validate phonenumbers
* `mail(string)` Validate mailaddresses
* `url(string)` Validate urls
* `facebook(string)` Validate facebook ID
* `google(string)` Validate google plus ID
* `twitter(string)` Validate twitter ID
* `wikipedia(string)` Validate wikipedia-Page tag
* `wikidata(string)` Validate wikidata-ID

You can validate a givven String as parameter. The return is a boolean (false or true). If you want more informations, you can read `msg`. This function returns a string with more informations about the validation. If you want to use your own error-messages: every `msg`-string is a public string-constant of osmValidation. You can compare the return with the constant.

Available constants:
* `PLAIN_FLAG` empty string, default message
* `PHONE_EMERGENCY` phonenumber is a valid emergency number
* `PHONE_VALID` phonenumber is a valid international number
* `PHONE_INVALID` number is not a emergency number or an international phonenumber (\+\d{1,4} \d+( \d+(-\d+)))
* `MAIL_VALID` email is valid
* `MAIL_INVALID` email is invalid
* `URL_PROTOCOLL_INVALID` URL has no or wrong protocoll. At this time, I allow only http or https
* `URL_LOCAL_ADDRESS` URL to a local service is not useful
* `URL_HOST_INVALID` Host is not a ipv4- or ipv6-address and it has no fqdn
* `URL_INVALID` URL seems broken
* `URL_VALID` URL is valid
* `FACEBOOK_ID_ONLY` correct facebook ID
* `FACEBOOK_URL_VALID` correct facebook-page URL
* `FACEBOOK_URL_INVALID` Neither a valid facebook ID nor a plain link (without parameter) to a page
* `TWITTER_ID_ONLY` correct twitter ID
* `TWITTER_URL_VALID` correct twitter-page URL
* `TWITTER_URL_INVALID` Neither a valid twitter ID nor a plain link (without parameter) to a page
* `GOOGLE_ID_ONLY` correct google ID
* `GOOGLE_NAME_ONLY` correct google plus name
* `GOOGLE_URL_VALID` correct google-page URL
* `GOOGLE_URL_INVALID` Neither a valid google ID, name nor a plain link (without parameter) to a page
* `WIKIPEDIA_INCLUDING_LANG` correct wikipedia page-name including language-tag
* `WIKIPEDIA_EXCLUDING_LANG` correct wikipedia page-name without language-tag
* `WIKIPEDIA_URL` correct wikipedia url
* `WIKIPEDIA_INVALID` Wikipedia-Tag not valid        
* `WIKIDATA_VALID_TAG` correct wikidata tag
* `WIKIDATA_INVALID` Wikidata-Tag not valid