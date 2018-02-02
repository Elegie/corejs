var Dom = {};

// --- Positioning ------------------------------------------------------------

Dom.setLeft = function(element, left) {
    element.style.left = left + "px";
};

Dom.setTop = function(element, top) {
    element.style.top = top + "px";
};

Dom.setWidth = function(element, width) {
    element.style.width = width + "px";
};

Dom.setHeight = function(element, height) {
    element.style.height = height + "px";
};

Dom.setPosition = function(element, target) {
    var offsetPosition = {
        x : 0,
        y : 0
    };
    var isFixedPosition = Dom.getStylePropertyValue(element, "position") == "fixed";
    if (isFixedPosition) {
        var scroll = Dom.getPageScroll();
        offsetPosition.x += scroll.x;
        offsetPosition.y += scroll.y;
    }
    var offsetParent = element.offsetParent;
    if (offsetParent) {
        var position = Dom.getStylePropertyValue(offsetParent, "position");
        if (position != "static") {
            var parentPosition = Dom.getPosition(offsetParent);
            offsetPosition.x += parentPosition.x + offsetParent.clientLeft;
            offsetPosition.y += parentPosition.y + offsetParent.clientTop;
        }
    }
    if (typeof target.x != "undefined") {
        Dom.setLeft(element, target.x - offsetPosition.x);
    }
    if (typeof target.y != "undefined") {
        Dom.setTop(element, target.y - offsetPosition.y);
    }
};

/**
 * @return The top left corner of the element, borders included, margins
 *         excluded.
 */
Dom.getPosition = function(element) {
    if (element.getBoundingClientRect) {
        var scroll = Dom.getPageScroll();
        var rect = element.getBoundingClientRect();
        return {
            x : rect.left + scroll.x,
            y : rect.top + scroll.y
        };
    }
    var position = {
        x : element.offsetLeft,
        y : element.offsetTop
    };
    var isFixedPosition = Dom.getStylePropertyValue(element, "position") == "fixed";
    if (isFixedPosition) {
        var scroll = Dom.getPageScroll();
        position.x += scroll.x;
        position.y += scroll.y;
    }
    while ((element = element.offsetParent) != null) {
        position.x += element.offsetLeft + element.clientLeft;
        position.y += element.offsetTop + element.clientTop;
    }
    return position;
};

Dom.getMousePosition = function(evt) {
    var scroll = Dom.getPageScroll();
    return {
        x : evt.clientX + scroll.x,
        y : evt.clientY + scroll.y
    };
};

Dom.getDimensions = function(element, marginProperties) {
    var dimensions = {
        width : 0,
        height : 0
    };
    var margins = {
        top : 0,
        right : 0,
        bottom : 0,
        left : 0
    };
    if (marginProperties) {
        for (var ii = 0; ii < marginProperties.length; ii++) {
            var property = marginProperties[ii];
            if (typeof margins[property] != "undefined") {
                var value = Dom.getStylePropertyValue(element, "margin-" + property);
                value = value.replace(/[a-z]/g, "");
                margins[property] = +value;
            }
        }
    }
    if (element) {
        var rect = element.getBoundingClientRect();
        dimensions.width = rect.width + margins.left + margins.right;
        dimensions.height = rect.height + margins.top + margins.bottom;
    }
    return dimensions;
}

Dom.getOverlappingElements = function(root, x1, y1, x2, y2) {
    var result = [];
    var all = root.getElementsByTagName("*");
    for (var ii = 0; ii < all.length; ii++) {
        var element = all[ii];
        var position = Dom.getPosition(element);
        var dimensions = Dom.getDimensions(element);
        var left = position.x;
        var right = left + dimensions.width;
        var top = position.y;
        var bottom = top + dimensions.height;
        if (left <= x2 && top <= y2 && right >= x1 && bottom >= y1) {
            result.push(element);
        }
    }
    return result;
};

// --- Tree analysis -----------------------------------------------------------

Dom.traverseDown = function(element, consumer, includeDescendants) {
    if (!element || !consumer) {
        return;
    }
    var children = element.childNodes;
    for (var ii = 0; ii < children.length; ii++) {
        var child = children[ii];
        var stop = consumer(child);
        if (stop) {
            return;
        }
        if (includeDescendants) {
            Dom.traverseDown(child, consumer, includeDescendants);
        }
    }
};

Dom.traverseSiblings = function(element, consumer, direction) {
    if (!element || !consumer) {
        return;
    }
    var sibling = element[direction.toLowerCase() + "Sibling"];
    if (!sibling) {
        return;
    }
    var stop = consumer(sibling);
    if (stop) {
        return;
    }
    return Dom.traverseSiblings(sibling, consumer, direction);
};

Dom.traverseNext = function(element, consumer) {
    return Dom.traverseSiblings(element, consumer, "next");
};

Dom.traversePrevious = function(element, consumer) {
    return Dom.traverseSiblings(element, consumer, "previous");
};

Dom.traverseUp = function(element, consumer) {
    if (!element || !consumer) {
        return;
    }
    var parent = element.parentNode;
    var stop = consumer(parent);
    if (stop) {
        return;
    }
    Dom.traverseUp(parent, consumer);
};

Dom.findParent = function(element, type, includeCurrent) {
    return Dom.findByType(element, type, "Up", includeCurrent);
};

Dom.findNext = function(element, type, includeCurrent) {
    return Dom.findByType(element, type, "Next", includeCurrent);
};

Dom.findPrevious = function(element, type, includeCurrent) {
    return Dom.findByType(element, type, "Previous", includeCurrent);
};

Dom.findFirst = function(element, type, includeCurrent) {
    return Dom.findByType(element, type, "Down", includeCurrent, true); // Include_Descendants.
};

Dom.findFirstBeforeLastScript = function(type) {
    var scripts = document.getElementsByTagName("script");
    var lastScript = scripts[scripts.length - 1];
    return Dom.findPrevious(lastScript, type, false);
};

Dom.findByType = function(element, type, direction, includeCurrent) {
    if (!element || !type || !direction) {
        return;
    }
    var targetType = type.toLowerCase();
    if (includeCurrent && element.nodeName.toLowerCase() == targetType) {
        return element;
    }
    var target;
    var targetArgs = [];
    targetArgs.push(element);
    targetArgs.push(function(node) {
        if (node.nodeName.toLowerCase() == targetType) {
            target = node;
            return true;
        }
        return false;
    });
    for (var ii = 4; ii < arguments.length; ii++) {
        targetArgs.push(arguments[ii]);
    }
    Dom["traverse" + direction].apply(this, targetArgs);
    return target;
};

Dom.getElementsByName = function(container, name) {
    if (!container || !name) {
        return;
    }
    var result = [];
    var nameLowerCase = name && name.toLowerCase();
    Dom.traverseDown(container, function(node) {
        if (node.name && node.name.toLowerCase() == nameLowerCase) {
            result.push(node);
        }
    }, true);
    return result;
};

Dom.contains = function(container, containee) {
    if (!container || !containee) {
        return false;
    }
    if (container == containee) {
        return true;
    }
    return arguments.callee(container, containee.parentNode);
};

Dom.removeBlankNodes = function(node) {
    if (!node) {
        return;
    }
    if (node.nodeType == 3) {
        if (Strings.isEmpty(node.nodeValue)) {
            node.parentNode.removeChild(node);
        }
    }
    if (node.nodeType == 1) {
        var children = node.childNodes;
        for (var ii = 0; ii < children.length; ii++) {
            arguments.callee(children[ii]);
        }
    }
};

Dom.removeAllNodes = function(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
};

Dom.getText = function(node) {
    if (!node) {
        return "";
    }
    if (node.nodeType == 3) {
        return node.nodeValue;
    }
    if (node.nodeType == 1 && node.nodeName.toLowerCase() != "script") {
        var children = node.childNodes;
        var text = "";
        for (var ii = 0; ii < children.length; ii++) {
            text += arguments.callee(children[ii]);
        }
        return text;
    }
    return "";
};

Dom.setText = function(node, content) {
    Dom.removeAllNodes(node);
    node.appendChild(document.createTextNode(content));
};

Dom.parseXML = function(xmlString) {
    if (typeof DOMParser != "undefined") {
        return new DOMParser().parseFromString(xmlString, "application/xml");
    }
};

/**
 * Testing for feature#Shape is the most restrictive approach. Testing for
 * feature#BasicStructure, or testing for SVGRect being defined, can lead to
 * unfortunate false positives (e.g. old iPhones).
 */
Dom.supportSVG = function() {
    return document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Shape", "1.0");
};

// --- Styling ----------------------------------------------------------------

Dom.getStylePropertyValue = function(element, property) {
    var camelProperty = property.replace(/\-(.)/g, function(whole, letter) {
        return letter.toUpperCase();
    });
    var hyphenizedProperty = property.replace(/([A-Z])/g, function(whole, letter) {
        return "-" + letter.toLowerCase();
    });
    if (document.defaultView && document.defaultView.getComputedStyle) {
        return document.defaultView.getComputedStyle(element, null).getPropertyValue(hyphenizedProperty);
    }
    if (element.currentStyle) {
        return element.currentStyle[camelProperty];
    }
    return element.style[camelProperty];
};

Dom.isVisible = function(element) {
    return element.style.visibility != "hidden";
};

Dom.setVisible = function(element, visible) {
    element.style.visibility = (visible ? "visible" : "hidden");
};

Dom.isDisplayed = function(element) {
    return element.style.display != "none";
};

Dom.setDisplayed = function(element, displayed, showValue) {
    element.style.display = (displayed ? (showValue || "") : "none");
};

Dom.cssClassToRegExp = function(cssClass) {
    return new RegExp("\\b(" + cssClass.replace("-", "\\-") + ")\\b", "g");
};

Dom.addCssClass = function(element, cssClass) {
    if (typeof element.classList != "undefined") {
        element.classList.add(cssClass);
        return;
    }
    if (!Dom.containsCssClass(element, cssClass)) {
        if (typeof element.className != "undefined") {
            if (typeof element.className.baseVal != "undefined") {
                element.className.baseVal += " " + cssClass;
            } else {
                element.className += " " + cssClass;
            }
        }
    }
};

Dom.removeCssClass = function(element, cssClass) {
    if (typeof element.classList != "undefined") {
        element.classList.remove(cssClass);
        return;
    }
    if (typeof element.className != "undefined") {
        if (typeof element.className.baseVal != "undefined") {
            element.className.baseVal = element.className.baseVal.replace(Dom.cssClassToRegExp(cssClass), "");
        } else {
            element.className = element.className.replace(Dom.cssClassToRegExp(cssClass), "");
        }
    }
};

Dom.containsCssClass = function(element, cssClass) {
    if (typeof element.classList != "undefined") {
        return element.classList.contains(cssClass);
    }
    var cssString = element.className
    if (cssString.baseVal) {
        cssString = cssString.baseVal;
    }
    return Dom.cssClassToRegExp(cssClass).test(cssString);
};

Dom.findByCssClass = function(root, cssClass) {
    if (root.getElementsByClassName) {
        return root.getElementsByClassName(cssClass);
    }
    var result = [];
    var nodes = root.getElementsByTagName("*");
    for (var ii = 0; ii < nodes.length; ii++) {
        var matchingByClassName = nodes[ii].className && nodes[ii].className.indexOf && nodes[ii].className.indexOf(cssClass) != -1;
        var matchingByBaseVal = nodes[ii].className && nodes[ii].className.baseVal && nodes[ii].className.baseVal.indexOf(cssClass) != -1;
        var matchingByClassList = false;
        var classList = nodes[ii].classList;
        if (classList) {
            for (var j = 0; j < classList.length; j++) {
                if (classList[j].indexOf(cssClass) != -1) {
                    matchingByClassList = true;
                    break;
                }
            }
        }
        if (matchingByClassName || matchingByBaseVal || matchingByClassList) {
            result.push(nodes[ii]);
        }
    }
    return result;
};

Dom.findHighestZIndex = function(element) {
    var highestZIndex = 0;
    var all = element.getElementsByTagName("*");
    for (var ii = 0; ii < all.length; ii++) {
        updateMaxZIndexFor(all[ii]);
    }
    updateMaxZIndexFor(element);
    return highestZIndex;

    function updateMaxZIndexFor(element) {
        var zIndex = +Dom.getStylePropertyValue(element, "zIndex");
        if (!isNaN(zIndex)) {
            highestZIndex = Math.max(highestZIndex, zIndex);
        }
    }
};

Dom.getCssStyleDeclaration = function(ruleName) {
    var styleSheets = document.styleSheets;
    if (styleSheets) {
        for (var ii = styleSheets.length - 1; ii >= 0; ii--) {
            var rules = styleSheets[ii].cssRules || styleSheets[ii].rules;
            if (rules) {
                for (var j = rules.length - 1; j >= 0; j--) {
                    var rule = rules[j];
                    var selectorText = rule.selectorText;
                    if (selectorText && selectorText.toLowerCase() == ruleName.toLowerCase()) {
                        return rule.style;
                    }
                }
            } else {
                break;
            }
        }
    }
    return null;
};

Dom.addCssStyleDeclaration = function(ruleName, rulesList) {
    if (!rulesList) {
        rulesList = "";
    }
    var style = document.createElement("style");
    style.type = "text/css";
    document.getElementsByTagName('head')[0].appendChild(style);
    var styleSheet = style.sheet || style.styleSheet;
    var rules = styleSheet.cssRules || styleSheet.rules;
    if (styleSheet.insertRule) {
        styleSheet.insertRule(ruleName + "{" + rulesList + "}", rules.length);
    } else if (styleSheet.addRule) {
        styleSheet.addRule(ruleName, rulesList);
    }
}

// --- Page -------------------------------------------------------------------

Dom.getViewPortSize = function() { // excluding scrollbars
    return {
        width : document.documentElement.clientWidth,
        height : document.documentElement.clientHeight,
    };
};

Dom.getPageScroll = function() {
    var scroll = {
        x : 0,
        y : 0,
        width : 0,
        height : 0
    };
    var docElement = document.documentElement;
    var body = document.body;
    if (docElement) {
        scroll.x = docElement.scrollLeft || 0;
        scroll.y = docElement.scrollTop || 0;
        scroll.width = docElement.scrollWidth || 0;
        scroll.height = docElement.scrollHeight || 0;
    }
    if (body) { // Chrome bug
        scroll.x = Math.max(scroll.x, body.scrollLeft || 0);
        scroll.y = Math.max(scroll.y, body.scrollTop || 0);
        scroll.width = Math.max(scroll.width, body.scrollWidth || 0);
        scroll.height = Math.max(scroll.height, body.scrollHeight || 0);
    }
    return scroll;
};
