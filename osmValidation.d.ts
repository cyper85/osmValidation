/* 
 * The MIT License
 *
 * Copyright 2017 andreas.
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


interface OsmValidation {
    // Vaildationsfunktionen
    phone(phonenumber: string): boolean;
    mail(mail: string): boolean;
    url(url: string): boolean;
    facebook(facebookID: string): boolean;
    google(googleID: string): boolean;
    twitter(twitterID: string): boolean;
    wikipedia(wikipediaPage: string): boolean;
    wikidata(wikidataID: string): boolean;
    
    // Fehlermeldung
    msg:string;
    
    // Konstanten / FLAGS
    PLAIN_FLAG    : string;
    PHONE_EMERGENCY    : string;
    PHONE_VALID: string;
    PHONE_INVALID: string;
    MAIL_VALID: string;
    MAIL_INVALID: string;
    URL_PROTOCOLL_INVALID: string;
    URL_LOCAL_ADDRESS: string;
    URL_HOST_INVALID: string;
    URL_INVALID: string;
    URL_VALID: string;
    FACEBOOK_ID_ONLY: string;
    FACEBOOK_URL_VALID: string;
    FACEBOOK_URL_INVALID: string;
    TWITTER_ID_ONLY: string;
    TWITTER_URL_VALID: string;
    TWITTER_URL_INVALID: string;
    GOOGLE_ID_ONLY: string;
    GOOGLE_NAME_ONLY: string;
    GOOGLE_URL_VALID: string;
    GOOGLE_URL_INVALID: string;
    WIKIPEDIA_INCLUDING_LANG: string;
    WIKIPEDIA_EXCLUDING_LANG: string;
    WIKIPEDIA_URL: string;
    WIKIPEDIA_INVALID: string;
    WIKIDATA_VALID_TAG: string;
    WIKIDATA_INVALID: string;
}