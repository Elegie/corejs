var Popins = (function() {
    Events.addTapListener(document, closeAllPopins);
    Events.addListener(document, "onclick", closeAllPopins);
    Events.addListener(document, "onkeyup", closeAllPopinsOnEscape);
    Events.addListener(window, "onresize", repositionAllPopins);

    var X_MARK = "\u2715";
    var allPopins = [];
    var overlay = null;
    var overlayCssClass;
    var zIndex = 0;

    Events.addListener(window, "onload", function(evt) {
        zIndex = Dom.findHighestZIndex(document.body)
    });

    // ------------------------------------------------------------------------

    function Popin(container) {
        this.container = container;
        this.container.style.position = "absolute";
        this.closeButton = null;
        this.closeHandlers = [];
        this.closeOtherPopinsOnShow = true;
        this.repositionOnResize = false;
        this.active = true;
    }

    Popin.prototype.setShowHandler = function(showHandler) {
        this.showHandler = showHandler;
    };

    Popin.prototype.setModal = function(isModal) {
        this.isModal = !!isModal;
    };

    Popin.prototype.insertCloseButton = function(insert) {
        if (insert && !this.closeButton) {
            addCloseButton(this);
        }
    };

    Popin.prototype.setCloseOtherPopinsOnShow = function(closeOtherPopinsOnShow) {
        this.closeOtherPopinsOnShow = closeOtherPopinsOnShow;
    }

    Popin.prototype.setRepositionOnResize = function(repositionOnResize) {
        this.repositionOnResize = repositionOnResize;
    }

    Popin.prototype.addCloseHandler = function(closeHandler) {
        this.closeHandlers.push(closeHandler);
    };

    Popin.prototype.show = function() {
        if (!this.showHandler) {
            throw "Before showing the popin, you must associate a ShowHandler";
        }
        if (this.closeOtherPopinsOnShow) {
            closeAllPopins();
        }
        var overlayZIndex = ++zIndex;
        this.container.style.zIndex = ++zIndex;
        this.showHandler.apply(this, arguments);
        if (this.isModal) {
            showOverlay(overlayZIndex);
        }
    };

    Popin.prototype.hide = function() {
        if (this.isModal) {
            hideOverlay();
        }
        for (var ii = 0; ii < this.closeHandlers.length; ii++) {
            this.closeHandlers[ii].call(this);
        }
        displayPopin(this, false);
    };

    Popin.prototype.isVisible = function() {
        return Dom.isDisplayed(this.container);
    };

    Popin.prototype.setActive = function(active) {
        this.active = active;
    };

    Popin.prototype.getUIInfo = function() {
        return calculateUI(this);
    };

    // ------------------------------------------------------------------------

    function setOverlayCssClass(cssClass) {
        overlayCssClass = cssClass;
    }

    function showOverlay(zIndex) {
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.style.position = "absolute";
            document.body.appendChild(overlay);
        }
        if (overlayCssClass) {
            Dom.addCssClass(overlay, overlayCssClass);
        }
        var pageSize = Dom.getViewPortSize();
        var pageScroll = Dom.getPageScroll();
        if (typeof zIndex != "undefined") {
            overlay.style.zIndex = zIndex;
        }
        Dom.setLeft(overlay, 0);
        Dom.setTop(overlay, 0);
        Dom.setWidth(overlay, Math.max(pageSize.width, pageScroll.width - 1));
        Dom.setHeight(overlay, Math.max(pageSize.height, pageScroll.height - 1));
        Dom.setDisplayed(overlay, true, "block");
    }

    function hideOverlay() {
        if (overlay) {
            Dom.setDisplayed(overlay, false);
        }
    }

    // ------------------------------------------------------------------------

    function createPopin(container) {
        var popin = new Popin(container);
        displayPopin(popin, false);
        allPopins.push(popin);
        return popin;
    }

    function addCloseButton(popin) {
        var closeButton = document.createElement("button");
        var xMark = document.createTextNode(X_MARK);
        closeButton.appendChild(xMark);
        popin.container.insertBefore(closeButton, popin.container.firstChild);
        popin.closeButton = closeButton;
        closeButton.type = "button";
        closeButton.style.position = "absolute";
        closeButton.style.top = 0;
        closeButton.style.right = 0;
        Events.addListener(closeButton, "onclick", function(evt) {
            popin.hide();
            Events.stopPropagation(evt);
            Events.preventDefaultBehavior(evt);
        });
    }

    function getAllPopins() {
        return allPopins;
    }

    function closeAllPopinsOnEscape(evt) {
        var KEYCODE_ESCAPE = 27;
        if (evt.keyCode == KEYCODE_ESCAPE) {
            closeAllPopins();
        }
    }

    function closeAllPopins(evt) {
        for (var ii = 0; ii < allPopins.length; ii++) {
            var popin = allPopins[ii];
            if (!popin.active) {
                continue;
            }
            if (popin.isVisible()) {
                if (evt) {
                    if (!Dom.contains(popin.container, Events.getTarget(evt))) {
                        popin.hide();
                    }
                } else {
                    popin.hide();
                }
            }
        }
    }

    function repositionAllPopins(evt) {
        var repositionOverlay = false;
        for (var ii = 0; ii < allPopins.length; ii++) {
            var popin = allPopins[ii];
            if (!popin.active) {
                continue;
            }
            if (evt) {
                if (popin.isVisible()) {
                    if (popin.isModal) {
                        repositionOverlay = true;
                    }
                    if (popin.repositionOnResize) {
                        popin.show();
                    }
                }
            }
        }
        if (repositionOverlay) {
            hideOverlay();
            showOverlay();
        }
    }

    function showAt(popin, x, y, evt, ui) {
        var xDefined = typeof x != "undefined";
        var yDefined = typeof y != "undefined";
        if (xDefined || yDefined) {
            if (typeof ui == "undefined") {
                ui = calculateUI(popin);
            }
            var epsilon = 10;
            var w = ui.dimensions.width;
            var h = ui.dimensions.height;
            var pw = ui.pageSize.width;
            var ph = ui.pageSize.height;
            var sx = ui.pageScroll.x;
            var sy = ui.pageScroll.y;
            var bx = ui.closeButtonOffset.x;
            var by = ui.closeButtonOffset.y;
            if (xDefined) {
                if (x + w + bx + epsilon > sx + pw) {
                    x = sx + pw - w - bx;
                }
                if (x < sx) {
                    x = sx;
                }
            }
            if (yDefined) {
                if (y + h + by + epsilon > sy + ph) {
                    y = sy + ph - h - by;
                }
                if (y < sy) {
                    y = sy + by;
                }
            }
        }
        displayPopin(popin, true, x, y);
        if (evt) {
            Events.stopPropagation(evt);
        }
    }

    function displayPopin(popin, visible, x, y) {
        var container = popin.container;
        Dom.setDisplayed(container, visible, "block");

        if (!visible) {
            return;
        }

        var position = {};
        var numPositionProperties = 0;
        if (typeof x != "undefined") {
            position.x = x;
            numPositionProperties++;
        }
        if (typeof y != "undefined") {
            position.y = y;
            numPositionProperties++;
        }
        if (numPositionProperties > 0) {
            Dom.setPosition(container, position);
        }
    }

    function getCloseButtonOffset(closeButton, dimensions) {
        var offset = {
            x : 0,
            y : 0
        };
        if (closeButton) {
            var offsetRight = dimensions.width - Dom.getDimensions(closeButton).width - closeButton.offsetLeft;
            if (offsetRight < 0) {
                offset.x = -offsetRight;
            }
            var offsetTop = closeButton.offsetTop;
            if (offsetTop < 0) {
                offset.y = -offsetTop;
            }
        }
        return offset;
    }

    // ------------------------------------------------------------------------

    function calculateUI(popin) {
        var container = popin.container;
        beforeUICalculations(container);
        var pageSize = Dom.getViewPortSize();
        var pageScroll = Dom.getPageScroll();
        var dimensions = Dom.getDimensions(container);
        var closeButtonOffset = getCloseButtonOffset(popin.closeButton, dimensions);
        afterUICalculations(container);

        return {
            pageSize : pageSize,
            pageScroll : pageScroll,
            dimensions : dimensions,
            closeButtonOffset : closeButtonOffset
        };

        function beforeUICalculations(container) {
            Dom.setVisible(container, false);
            Dom.setDisplayed(container, true, "block");
        }

        function afterUICalculations(container) {
            Dom.setDisplayed(container, false);
            Dom.setVisible(container, true);
        }
    }

    // ------------------------------------------------------------------------

    function EventShowHandler(evt) {
        if (evt) {
            var mousePosition = Dom.getMousePosition(evt);
            showAt(this, mousePosition.x, mousePosition.y, evt);
        } else {
            CenterShowHandler.call(this, evt);
        }
    }

    function CenterShowHandler(evt) {
        var ui = calculateUI(this);
        var goldenRatio = (1 + Math.sqrt(5)) / 2;
        var pw = ui.pageSize.width;
        var ph = ui.pageSize.height;
        var sx = ui.pageScroll.x;
        var sy = ui.pageScroll.y;
        var w = ui.dimensions.width;
        var h = ui.dimensions.height;
        var x = (pw - w) / 2 + sx;
        var y = ((ph - h) * (goldenRatio - 1) / goldenRatio) + sy;
        showAt(this, x, y, evt, ui);
    }

    function CoordinatesShowHandler(x, y) {
        showAt(this, x, y);
    }

    // ------------------------------------------------------------------------

    return {
        create : createPopin,
        getAll : getAllPopins,
        closeAll : closeAllPopins,
        setOverlayCssClass : setOverlayCssClass,
        ShowHandlers : {
            EventShowHandler : EventShowHandler,
            CenterShowHandler : CenterShowHandler,
            CoordinatesShowHandler : CoordinatesShowHandler
        }
    };

})();
