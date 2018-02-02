var Events = (function() {

    function dispatch(target, evt) {
        evt = evt.replace(/^on/i, "");
        if (document.createEventObject) {
            return target.fireEvent("on" + evt, document.createEventObject());
        } else if (document.createEvent) {
            var eventObj = document.createEvent("HTMLEvents");
            eventObj.initEvent(evt, true, true);
            return !target.dispatchEvent(eventObj);
        }
    }

    // ------------------------------------------------------------------------

    function addListener(target, evt, listener) {
        evt = evt.replace(/^on/i, "");
        if (target.addEventListener) {
            target.addEventListener(evt, listener, false);
        } else if (target.attachEvent) {
            target.attachEvent("on" + evt, function(evt) {
                return listener.call(target, evt || window.event);
            });
        } else {
            if (target[evt]) {
                target[evt] = (function(oldListener) {
                    return function(evt) {
                        oldListener.call(this, evt || window.event);
                        return listener.call(this, evt || window.event);
                    };
                })(target[evt]);
            } else {
                target[evt] = listener;
            }
        }
    }

    // ------------------------------------------------------------------------

    function getTarget(evt) {
        return evt && (evt.target || evt.srcElement);
    }

    // ------------------------------------------------------------------------

    function stopPropagation(evt) {
        if (evt.stopPropagation) {
            evt.stopPropagation();
        } else if (typeof evt.cancelBubble != "undefined") {
            evt.cancelBubble = true;
        }
    }

    // ------------------------------------------------------------------------

    function preventDefaultBehavior(evt) {
        if (window.event) {
            window.event.returnValue = false;
        }
        if (evt.preventDefault) {
            evt.preventDefault();
        }
    }

    // ------------------------------------------------------------------------

    function addTapListener(element, listener) {
        var touchMoving = false;
        addListener(element, "ontouchmove", function(evt) {
            touchMoving = true;
        });
        addListener(element, "ontouchend", function(evt) {
            if (!touchMoving) {
                listener.call(this, evt);
            }
            touchMoving = false;
        });
    }

    // ------------------------------------------------------------------------

    var viewPortSize;

    addListener(window, "onload", function(evt) {
        viewPortSize = Dom.getViewPortSize();
    });

    /**
     * On mobile devices, iOS triggers resize events when the user scrolls the
     * page. Thus, we need to assert the validity of the resize prior to
     * executing the actual listener.
     */
    function addResizeListener(element, listener) {
        addListener(element, "onresize", function(evt) {
            var newViewPortSize = Dom.getViewPortSize();
            if (!viewPortSize || newViewPortSize.width != viewPortSize.width || newViewPortSize.height != viewPortSize.height) {
                viewPortSize = newViewPortSize;
                return listener.apply(this, arguments);
            }
        });
    }

    // ------------------------------------------------------------------------

    return {
        dispatch : dispatch,
        addListener : addListener,
        getTarget : getTarget,
        stopPropagation : stopPropagation,
        preventDefaultBehavior : preventDefaultBehavior,
        addTapListener : addTapListener,
        addResizeListener : addResizeListener
    };

})();
