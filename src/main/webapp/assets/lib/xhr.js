/**
 * <p>
 * This library lets the application programmer perform asynchronous xml http calls.
 * These calls can be made in many flavor, varying the method (GET, POST) and the returned
 * content type (Text, XML). Provided callbacks will invoked with two arguments:
 * the http status and the returned object.
 * </p>
 * 
 * <p>Based on work by <a href="http://jiberring.com/">Jim Ley</a>.</p>
 */
var XHR = (function() {
    var getXHRObject = function() {
        var xmlhttp = false;
        /*@cc_on @*/
        /*@if (@_jscript_version >= 5)
         try {
           xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
         } catch (e) {
           try {
             xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
           } catch (E) {
            xmlhttp = false;
           }
         }
        @end @*/
        if (!xmlhttp && typeof XMLHttpRequest != "undefined") {
            try {
                xmlhttp = new XMLHttpRequest();
            } catch (e) {
                xmlhttp = false;
            }
        }
        if (!xmlhttp && window.createRequest) {
            try {
                xmlhttp = window.createRequest();
            } catch (e) {
                xmlhttp = false;
            }
        }
        return xmlhttp;
    };

    function readResponse(method, prop, url, params, callback) {
        var XHRObj = getXHRObject();
        XHRObj.open(method, url, true);
        XHRObj.onreadystatechange = function() {
            if (XHRObj.readyState == 4) {
                callback(XHRObj.status, XHRObj[prop]);
            }
        };
        if (method.toUpperCase() == "POST" && params && params.length) {
            XHRObj.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }
        XHRObj.send(params);
    }

    function makeGetParams(params) {
        var result = "";
        if (params) {
            result = "?" + createParams(params);
        }
        return result;
    }

    function makePostParams(params) {
        var result = null;
        if (params) {
            result = createParams(params);
        }
        return result;
    }

    function createParams(params) {
        var queryString = [];
        for ( var p in params) {
            queryString.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
        }
        return queryString.join("&");
    }

    return {
        canRun : function() {
            return !!getXHRObject();
        },
        getText : function(url, params, callback) {
            readResponse("GET", "responseText", url + makeGetParams(params), null, callback);
        },
        getXML : function(url, params, callback) {
            readResponse("GET", "responseXML", url + makeGetParams(params), null, callback);
        },
        postText : function(url, params, callback) {
            readResponse("POST", "responseText", url, makePostParams(params), callback);
        },
        postXML : function(url, params, callback) {
            readResponse("POST", "responseXML", url, makePostParams(params), callback);
        }
    };
})();
