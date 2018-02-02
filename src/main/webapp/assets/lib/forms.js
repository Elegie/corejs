var Forms = {};

Forms.FIELD_DEFAULT_VALUE = "data-default-value";

Forms.clear = function(form, restoreDefault) {
    if (!form) {
        return;
    }
    var elem = form.elements;
    for (var ii = 0; ii < elem.length; ii++) {
        var ctrl = elem[ii];
        var type = ctrl.type;
        if (type) {
            type = type.toLowerCase();
            var defaultValue = ctrl.getAttribute(Forms.FIELD_DEFAULT_VALUE);
            switch (type) {
                case "text":
                    if (defaultValue == null || typeof defaultValue == "undefined") {
                        defaultValue = "";
                    }
                    ctrl.value = restoreDefault ? defaultValue : "";
                    break;
                case "checkbox":
                    ctrl.checked = restoreDefault ? toBoolean(defaultValue) : false;
                    break;
                case "select-one":
                    Forms.selectOptionByValue(ctrl, "");
                    break;
            }
        }
    }

    // ---

    function toBoolean(booleanString) {
        if (booleanString) {
            booleanString = booleanString.toLowerCase();
        }
        return booleanString == "true" || booleanString == "1" || booleanString == "y" || booleanString == "yes";
    }
};

Forms.selectOptionByValue = function(select, value) {
    var options = select.options;
    for (var ii = 0; ii < options.length; ii++) {
        if (options[ii].value == value) {
            options[ii].selected = true;
            break;
        }
    }
};

Forms.getInputByType = function(container, type) {
    var targetType = type.toLowerCase();
    var result = [];
    var inputs = container.getElementsByTagName("input");
    for (var ii = 0; ii < inputs.length; ii++) {
        var input = inputs[ii];
        if (input.type.toLowerCase() == targetType) {
            result.push(input);
        }
    }
    return result;
};

Forms.getSubmitControls = function(form) {
    var result = [];
    for (var ii = 0; ii < form.elements.length; ii++) {
        var element = form.elements[ii];
        var nodeName = element.nodeName.toLowerCase();
        if (nodeName == "input" && (element.type == "submit" || element.type == "image") || nodeName == "button" && element.type == "submit") {
            result.push(element);
        }
    }
    return result;
};

Forms.getAnyControlByTypeAndContent = function(container, type, content) {
    var inputs = container.getElementsByTagName(type);
    for (var ii = 0; ii < inputs.length; ii++) {
        var input = inputs[ii];
        if (input.name.toLowerCase().indexOf(content.toLowerCase()) != -1) {
            return input;
        }
    }
};

Forms.preventDoubleClick = function(button, replacementText, replacementClass) {
    Events.addListener(button, "onclick", function(evt) {
        setTimeout(function() {
            var replacement = document.createElement("span");
            replacement.appendChild(document.createTextNode(replacementText));
            if (replacementClass) {
                Dom.addCssClass(replacement, replacementClass);
            }
            button.parentNode.replaceChild(replacement, button);
        }, 1);
    });
};

Forms.requestOnChange = function(form, fields, requester) {
    var inputs = getTargetInputs(form);
    for (var ii = 0; ii < inputs.length; ii++) {
        var input = inputs[ii];
        Events.addListener(input, "onchange", saveValue);
    }

    // ---

    function getTargetInputs(form) {
        var targetInputs = [];
        var excludeInputs = {
            "submit" : true,
            "button" : true,
            "reset" : true,
            "fieldset" : true
        };
        for (var ii = 0; ii < form.elements.length; ii++) {
            var input = form.elements[ii];
            if (input.type && !excludeInputs[input.type.toLowerCase()]) {
                if (fields) {
                    var accept = false;
                    for (var j = 0; j < fields.length; j++) {
                        if (input.name == fields[j]) {
                            accept = true;
                            break;
                        }
                    }
                    if (!accept) {
                        continue;
                    }
                }
                targetInputs.push(input);
            }
        }
        return targetInputs;
    }

    function saveValue(evt) {
        var params = {};
        var inputs = getTargetInputs(form);
        for (var ii = 0; ii < inputs.length; ii++) {
            var input = inputs[ii];
            var inputType = input.type.toLowerCase();
            if (inputType == "radio" || inputType == "checkbox") {
                if (!input.checked) {
                    continue;
                }
            }
            params[input.name] = input.value;
        }
        requester(params);
    }
};

Forms.makeToggleSection = function(targetId, textShow, textHide, buttonClass, insertBefore) {
    var target = document.getElementById(targetId);
    var toggle = document.createElement("input");
    toggle.type = "button";
    toggle.value = textShow;
    Dom.addCssClass(toggle, buttonClass);
    target.parentNode.insertBefore(toggle, insertBefore ? target : target.nextChild);
    Events.addListener(toggle, "onclick", function(evt) {
        display(!Dom.isDisplayed(target));
    });
    display();

    function display(show) {
        if (typeof show == "undefined") {
            show = typeof Cookies != "undefined" && Cookies.get(targetId) == "visible";
        }
        toggle.value = show ? textHide : textShow;
        Dom.setDisplayed(target, show);
        if (typeof Cookies != "undefined") {
            Cookies.set(targetId, show ? "visible" : "hidden", Cookies.DEFAULT_EXPIRES);
        }
    }
};

Forms.makePercentControl = function(labelText, sourceId, referenceId, decimalSeparator, numFractionDigits) {
    if (!numFractionDigits) {
        numFractionDigits = 2;
    }
    var source = document.getElementById(sourceId);
    var reference = document.getElementById(referenceId);
    var targetId = Strings.generateId();

    var label = document.createElement("label");
    label.htmlFor = targetId;
    label.appendChild(document.createTextNode(labelText));
    source.parentNode.appendChild(label);

    var target = document.createElement("input");
    target.id = targetId;
    target.type = "text";
    source.parentNode.appendChild(target);

    var suffix = document.createElement("span");
    suffix.appendChild(document.createTextNode("%"));
    source.parentNode.appendChild(suffix);

    Events.addListener(source, "onchange", sourceHandler);
    Events.addListener(source, "onkeyup", sourceHandler);
    Events.addListener(target, "onchange", targetHandler);
    Events.addListener(target, "onkeyup", targetHandler);
    sourceHandler.call(source);

    function sourceHandler(evt) {
        genericHandler(this, target, function(o, r) {
            return o / r * 100
        });
    }

    function targetHandler(evt) {
        genericHandler(this, source, function(o, r) {
            return o * r / 100
        });
    }

    function genericHandler(origin, destination, operator) {
        if (Strings.isEmpty(origin.value)) {
            destination.value = "";
            return;
        }
        var originNumber = Strings.toNumber(origin.value);
        var referenceNumber = Strings.toNumber(reference.value);
        if (!isNaN(originNumber) && !isNaN(referenceNumber)) {
            var rawNumber = (operator(originNumber, referenceNumber)).toFixed(numFractionDigits);
            destination.value = Strings.toLocaleNumber(rawNumber);
        }
    }
};

Forms.whenEnterThenClickOn = function(source, target) {
    Events.addListener(source, "onkeydown", function(evt) {
        var ENTER_KEY_CODE = 13;
        if (evt.keyCode == ENTER_KEY_CODE) {
            Events.preventDefaultBehavior(evt);
            target.click();
        }
    });
};
