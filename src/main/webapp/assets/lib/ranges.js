var Ranges = {};

Ranges.getSelection = function() {
    var rng = null;
    if (document.selection && document.selection.type == "Text") {
        rng = document.selection.createRange();
    } else if (window.getSelection) {
        rng = window.getSelection();
        if (rng && rng.rangeCount && rng.getRangeAt) {
            rng = rng.getRangeAt(0);
        }
    }
    return rng;
};

Ranges.clearSelection = function() {
    var sel;
    if (document.selection && document.selection.empty) {
        document.selection.empty();
    } else if (window.getSelection) {
        sel = window.getSelection();
        if (sel) {
            if (sel.removeAllRanges) {
                sel.removeAllRanges();
            } else if (sel.collapse) {
                sel.collapse(sel.anchorNode || document.body, 0);
            }
        }
    }
};

Ranges.getCommonAncestor = function(rng) {
    return rng.parentElement ? rng.parentElement() : rng.commonAncestorContainer;
};

Ranges.overlap = function(r1, r2) {
    var p = null;
    if (r1.compareEndPoints) {
        p = {
            method : "compareEndPoints",
            StartToStart : "StartToStart",
            StartToEnd : "StartToEnd",
            EndToEnd : "EndToEnd",
            EndToStart : "EndToStart"
        };
    } else if (r1.compareBoundaryPoints) {
        p = {
            method : "compareBoundaryPoints",
            StartToStart : 0,
            StartToEnd : 1,
            EndToEnd : 2,
            EndToStart : 3
        };
    }
    return p && !(
          r2[p.method](p.StartToStart, r1) == 1 &&
          r2[p.method](p.EndToEnd, r1) == 1 &&
          r2[p.method](p.StartToEnd, r1) == 1 &&
          r2[p.method](p.EndToStart, r1) == 1
          ||
          r2[p.method](p.StartToStart, r1) == -1 &&
          r2[p.method](p.EndToEnd, r1) == -1 &&
          r2[p.method](p.StartToEnd, r1) == -1 &&
          r2[p.method](p.EndToStart, r1) == -1
        );
};

Ranges.createRangeFromElement = function(el) {
    var rng = null;
    if (document.body.createTextRange) {
        rng = document.body.createTextRange();
        rng.moveToElementText(el);
    } else if (document.createRange) {
        rng = document.createRange();
        rng.selectNodeContents(el);
    }
    return rng;
};

Ranges.getCaretPosition = function(element) {
    var rng, index = -1;
    if (typeof element.selectionStart == "number") {
        index = element.selectionStart;
    } else if (document.selection && document.selection.createRange) {
        rng = document.selection.createRange();
        rng.collapse(true);
        rng.moveStart("character", -element.value.length);
        index = rng.text.length;
    }
    return index;
};

Ranges.selectText = function(element, start, length) {
    element.selectionStart = start;
    element.selectionEnd = start + length;
};