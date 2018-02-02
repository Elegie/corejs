var Tooltips = (function() {

    var CLOSE_AFTER_MS = 3000;
    var CLOSE_DISTANCE_PX = 50;
    var EFFECT_INTERVAL_MS = 10;

    var activeTooltip;
    var mousePosition = {
        x : 0,
        y : 0
    };
    var recentTouchStart = false;

    Events.addListener(document, "onmousemove", mouseTracker);
    Events.addListener(document, "ontouchstart", touchTracker);

    function insert(container, tooltipCssClass, tooltipIconSrc, tooltipIconCssClasses, insertCloseButton) {
        var tooltips = Dom.findByCssClass(container, tooltipCssClass);
        for (var ii = 0; ii < tooltips.length; ii++) {
            Tooltips.create(tooltips[ii], tooltipIconSrc, tooltipIconCssClasses, insertCloseButton);
        }
    }

    function create(content, iconSrc, iconCssClasses, insertCloseButton) {
        var icon = document.createElement("img");
        icon.src = iconSrc;
        for (var ii = 0; ii < iconCssClasses.length; ii++) {
            Dom.addCssClass(icon, iconCssClasses[ii]);
        }
        content.parentNode.insertBefore(icon, content);
        associate(content, icon, insertCloseButton);
    }

    function associate(content, trigger, insertCloseButton) {
        var popin = Popins.create(content);
        popin.trigger = trigger;
        popin.insertCloseButton(!!insertCloseButton);
        popin.setCloseOtherPopinsOnShow(false);
        popin.setShowHandler(createShowHandler(popin));

        var tooltipShowHandler = createShowTooltipHandler(popin);
        Events.addListener(trigger, "onmouseover", tooltipShowHandler);
        Events.addListener(trigger, "onclick", tooltipShowHandler);
    }

    /*
     * Associates a show handler to the tooltip. If the tooltip is contained
     * within another popin, then we position it so that it does not hide any
     * kind of control (link, button, input), otherwise we simply position it at
     * the tooltip icon coordinates.
     */
    function createShowHandler(popin) {
        var containerPopin = getContainerPopin(popin);
        if (containerPopin) {
            return createInsidePopinShowHandler(containerPopin, popin);
        }
        return createOutsidePopinShowHandler(popin);

        function createInsidePopinShowHandler(containerPopin, popin) {
            var conflictingElementTypes = {
                "a" : true,
                "button" : true,
                "input" : true,
                "textarea" : true
            };
            return function(evt) {
                var dimensions = Dom.getDimensions(popin.container);
                var position = Dom.getPosition(popin.trigger);
                var candidatePositions = [ {
                    x : position.x,
                    y : position.y - dimensions.height
                }, {
                    x : position.x - dimensions.width,
                    y : position.y - dimensions.height
                }, {
                    x : position.x,
                    y : position.y
                }, {
                    x : position.x - dimensions.width,
                    y : position.y
                } ];
                nextCandidatePosition: for (var ii = 0; ii < candidatePositions.length; ii++) {
                    var candidatePosition = candidatePositions[ii];
                    var x1 = candidatePosition.x;
                    var y1 = candidatePosition.y;
                    var x2 = x1 + dimensions.width;
                    var y2 = y1 + dimensions.height;
                    var overlappingElements = Dom.getOverlappingElements(containerPopin.container, x1, y1, x2, y2);
                    for (var j = 0; j < overlappingElements.length; j++) {
                        var overlappingElement = overlappingElements[j];
                        if (conflictingElementTypes[overlappingElement.nodeName.toLowerCase()]) {
                            continue nextCandidatePosition;
                        }
                    }
                    return Popins.ShowHandlers.CoordinatesShowHandler.apply(popin, [ x1, y1 ]);
                }
                return Popins.ShowHandlers.CoordinatesShowHandler.apply(popin, [ position.x, position.y - dimensions.height ]);
            };
        }

        function createOutsidePopinShowHandler(popin) {
            return function(evt) {
                var dimensions = Dom.getDimensions(popin.container);
                var position = Dom.getPosition(popin.trigger);
                Popins.ShowHandlers.CoordinatesShowHandler.apply(popin, [ position.x, position.y - dimensions.height ]);
            }
        }

        function getContainerPopin(popin) {
            var allPopins = Popins.getAll();
            var trigger = popin.trigger;
            for (var ii = 0; ii < allPopins.length; ii++) {
                var currentPopin = allPopins[ii];
                if (currentPopin != popin) {
                    if (Dom.contains(currentPopin.container, trigger)) {
                        return currentPopin;
                    }
                }
            }
            return null;
        }
    }

    function createShowTooltipHandler(popin) {
        return function(evt) {
            Events.stopPropagation(evt);
            Events.preventDefaultBehavior(evt); // Needed for labels.
            if (popin.isVisible()) {
                return;
            }
            if (activeTooltip && activeTooltip.isVisible()) {
                activeTooltip.hide();
            }
            activeTooltip = popin;
            activeTooltip.show(evt);
            if (deviceHasMouse()) {
                setTimeout(tryCloseTooltip, CLOSE_AFTER_MS);
            }
        };
    }

    function mouseTracker(evt) {
        if (recentTouchStart) {
            mousePosition.x = 0;
            mousePosition.y = 0;
            recentTouchStart = false;
            return;
        }
        var position = Dom.getMousePosition(evt);
        mousePosition.x = position.x;
        mousePosition.y = position.y;
    }

    function touchTracker(evt) {
        recentTouchStart = true;
    }

    function deviceHasMouse() {
        return mousePosition.x > 0 || mousePosition.y > 0;
    }

    function tryCloseTooltip() {
        if (activeTooltip && activeTooltip.isVisible()) {
            var position = Dom.getPosition(activeTooltip.container);
            var dimensions = Dom.getDimensions(activeTooltip.container);
            var mouseAwayFromX = mousePosition.x + CLOSE_DISTANCE_PX < position.x || mousePosition.x > position.x + dimensions.width + CLOSE_DISTANCE_PX;
            var mouseAwayFromY = mousePosition.y + CLOSE_DISTANCE_PX < position.y || mousePosition.y > position.y + dimensions.height + CLOSE_DISTANCE_PX;
            if (mouseAwayFromX || mouseAwayFromY) {
                activeTooltip.hide();
            } else {
                setTimeout(tryCloseTooltip, CLOSE_AFTER_MS);
            }
        }
    }

    return {
        insert : insert,
        create : create,
        associate : associate
    };

})();