var Strings = {};

Strings.isEmpty = function(str) {
    return /^\s*$/.test(str);
};

Strings.trim = function(str) {
    return str.replace(/^\s+|\s+$/gm, "");
};

Strings.capitalize = function(str) {
    return str && str.replace(/^(.)/, function(a, b) {
        return b.toUpperCase();
    });
};

Strings.padLeft = function(str, padChar, padLength) {
    str = str + "";
    while (str.length < padLength) {
        str = padChar + str;
    }
    return str;
};

Strings.generateId = function() {
    var tempId;
    do {
        tempId = Math.random();
    } while (document.getElementById(tempId));
    return tempId;
};

Strings.toNumber = function(value) {
    if (!value) {
        return +"NaN";
    }
    var separator = Strings.getDecimalSeparator();
    var regExpedSeparator = separator.replace(/\./g, "\\.");
    return +value.replace(/ /g, "").replace(new RegExp(regExpedSeparator, "g"), ".");
};

Strings.getDecimalSeparator = function() {
    var n = 1.1;
    return /^1(.+)1$/.exec(n.toLocaleString())[1];
};

Strings.toLocaleNumber = function(n) {
    return (n + "").replace(/\.([^.]*)$/, Strings.getDecimalSeparator() + "$1");
};

Strings.escapeHTML = (function() {
    var entityMap = {
        "&" : "&amp;",
        "<" : "&lt;",
        ">" : "&gt;",
        '"' : '&quot;',
        "'" : '&#39;',
        "/" : '&#x2F;'
    };
    var pattern = [];
    for(var character in entityMap) {
        pattern.push(character);
    }
    var regexp = new RegExp("[" + pattern.join("") + "]", "g");
    var regexpTagOnly = /[<>]/g;
    
    return function (str, tagOnly) {
        return String(str).replace(tagOnly ? regexpTagOnly : regexp, function(s) {
            return entityMap[s];
        });
    };
})();

/**
 * @see http://www.faqs.org/faqs/mail/addressing/
 */
Strings.isEmail = function(email) {
    var hasError = false;

    removeEscapedEntities();
    unfoldLines();
    removeQuotedContent();
    removeComments();
    removeWhiteSpace();
    checkEmail();
    return !hasError;

    function removeEscapedEntities() {
        email = email.replace(/\\./g, "a");
    }

    function unfoldLines() {
        email = email.replace(/\\n/gm, "");
    }

    function removeQuotedContent() {
        email = email.replace(/"[^"]*"/g, "b");
    }

    function removeComments() {
        while (email.indexOf("(") != -1 || email.indexOf(")") != -1) {
            email = email.replace(/\([^()]*\)/g, "");
            if ((email.indexOf("(") == -1 && email.indexOf(")") != -1) || (email.indexOf("(") != -1 && email.indexOf(")") == -1)) {
                hasError = true; // Invalid nested comments
                break;
            }
        }
    }

    function removeWhiteSpace() {
        email = email.replace(/\s+/g, "");
    }

    function checkEmail() {
        var lft = email.split("<").length - 1;
        var rgt = email.split(">").length - 1;
        if (rgt != lft || lft < 0 || lft > 1) {
            hasError = true; // Invalid encapsulation
        } else {
            email = email.replace(/.*<([^>]*)>.*/, "$1");
            if (/\@\.|\.\.|\.$/.test(email)) {
                hasError = true; // Invalid dot placement
            } else if (/\@.*\@|^\@|\@$/.test(email)) {
                hasError = true; // Dubious @ usage
            } else if (email.indexOf("@") == -1) {
                hasError = true; // Missing @
            } else if (email.indexOf(".") == -1) {
                hasError = true; // Missing dot
            }
        }
    }
};