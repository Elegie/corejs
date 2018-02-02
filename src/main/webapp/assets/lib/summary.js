var Summary = (function() {

    function create(root, summaryCssClass) {
        var summary = buildSummary(root);
        Dom.addCssClass(summary, summaryCssClass);
        root.parentNode.insertBefore(summary, root);
    }

    function buildSummary(root) {
        var summary = document.createElement("div");
        var headers = createHeadersMap();
        var elements = root.getElementsByTagName("*");
        for (var ii = 0; ii < elements.length; ii++) {
            var element = elements[ii];
            var elementName = element.nodeName.toLowerCase();
            if (headers[elementName]) {
                if (!element.id) {
                    element.id = Strings.generateId();
                }
                var level = +elementName.replace(/\D/g, "");
                var link = document.createElement("a");
                link.setAttribute("data-level", level);
                link.href = "#" + element.id;
                link.appendChild(document.createTextNode(Dom.getText(element)));
                summary.appendChild(link);
            }
        }
        return summary;
    }

    function createHeadersMap() {
        var minLevel = 1;
        var maxLevel = 6;
        var headers = {};
        for (var ii = minLevel; ii < maxLevel; ii++) {
            headers["h" + ii] = true;
        }
        return headers;
    }

    return {
        create : create
    }

})();