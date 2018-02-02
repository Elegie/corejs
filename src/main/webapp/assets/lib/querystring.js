var QueryString = {};

QueryString.getPath = function(href) {
    return (href || location.href).split("?")[0];
};

QueryString.getQuery = function(href) {
    return href ? (href.split("?")[1] || "") : location.search.substring(1);
};

QueryString.getParams = function(href) {
    var search = /([^&=]+)=?([^&]*)/g;
    var query = QueryString.getQuery(href);
    var result = {};
    var match;
    while (match = search.exec(query)) {
        var key = QueryString.decode(match[1]);
        var value = QueryString.decode(match[2]);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(value);
    }
    for ( var p in result) {
        if (result[p].length == 1) {
            result[p] = result[p][0];
        }
    }
    return result;
};

QueryString.addParam = function(href, key, value) {
    var result = QueryString.getPath(href) + "?";
    var params = QueryString.getParams(href);
    var decodedKey = QueryString.decode(key);
    var ii = 0;
    var paramFound = false;
    for ( var param in params) {
        if (ii > 0) {
            result += "&";
        }
        var decodedParam = QueryString.decode(param);
        if (decodedParam == decodedKey) {
            paramFound = true;
            result += param + "=" + QueryString.encode(value);
        } else {
            result += param + "=" + params[param];
        }
        ii++;
    }
    if (!paramFound) {
        result += QueryString.encode(key) + "=" + QueryString.encode(value);
    }
    return result;
};

QueryString.decode = function(str) {
    return decodeURIComponent(str.replace(/\+/g, " "));
};

QueryString.encode = function(str) {
    return encodeURIComponent(str);
};