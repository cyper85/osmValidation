exports.phone = function(number) {
      var regex = /^\+(?:[0-9][ -]?){6,14}[0-9]$/;
      switch(number) {
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
        default:
          return regex.test(number);
      }
    };
exports.mail = function(email) {
      var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(email);
    };
exports.url = function(url) {
      var regex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;
      return regex.test(url);
    };
exports.facebook = function(email) {
      var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(email);
    };
exports.twitter = function(email) {
      var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(email);
    };
exports.google = function(email) {
      var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(email);
    };
