var Cookies = (function() {
    var DEFAULT_EXPIRES = 30;

    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "expires=" + date.toUTCString();
        }
        document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + (expires ? (" ;" + expires) : "");
    }

    function getCookie(name) {
        var re = new RegExp(encodeURIComponent(name) + "=([^;]+)");
        var match = re.exec(document.cookie);
        return match && decodeURIComponent(match[1]);
    }

    return {
        DEFAULT_EXPIRES : DEFAULT_EXPIRES,
        set : setCookie,
        get : getCookie
    };

})();
