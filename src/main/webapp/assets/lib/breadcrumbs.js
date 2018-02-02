var Breadcrumbs = (function() {

    function Crumb(label, href) {
        this.label = Strings.escapeHTML(label, true);
        this.href = href;
    }

    Crumb.prototype.toHTML = function() {
        if (this.href) {
            return "<a href=\"" + this.href + "\">" + this.label + "<\/a>";
        }
        return "<span>" + this.label + "<\/span>";
    };

    function Url(href, menu, label) {
        this.href = href;
        this.path = QueryString.getPath(href);
        this.menu = menu;
        this.label = label;
    }

    Url.match = function(targetUrl, menu) {
        var candidates = extractCandidateUrls(targetUrl, menu);
        if (candidates.length == 0) {
            return null;
        }
        candidates = filterCandidateUrlsByPathLength(candidates);
        return candidates.length > 0 ? candidates[0] : null;

        // ---

        function extractCandidateUrls(targetUrl, menu) {
            var candidates = [];
            var items = Lists.getItems(menu.container);
            for (var ii = 0; ii < items.length; ii++) {
                var link = Dom.findByType(items[ii], "a", "Down", false, false);
                if (link) {
                    var label = Dom.getText(link);
                    var url = new Url(link.href, menu, label);
                    if (targetUrl.path.indexOf(url.path) != -1) {
                        candidates.push(url);
                    }
                }
            }
            for (var j = 0; j < menu.subMenus.length; j++) {
                var subMenu = menu.subMenus[j];
                var subCandidates = extractCandidateUrls(targetUrl, subMenu);
                for (var k = 0; k < subCandidates.length; k++) {
                    candidates.push(subCandidates[k]);
                }
            }
            return candidates;
        }

        function filterCandidateUrlsByPathLength(candidates) {
            candidates.sort(function(c1, c2) {
                if (c1.path.length > c2.path.length) {
                    return -1;
                }
                if (c1.path.length < c2.path.length) {
                    return +1;
                }
                return 0;
            });
            var bestPathLength = candidates[0].path.length;
            var filteredCandidates = [];
            for (var ii = 0; ii < candidates.length; ii++) {
                var candidate = candidates[ii];
                if (candidate.path.length == bestPathLength) {
                    filteredCandidates.push(candidate);
                }
            }
            return filteredCandidates;
        }
    };

    Url.prototype.toCrumb = function(label) {
        return new Crumb(this.label || label, this.href);
    };

    /* --------------------------------------------------------------------- */

    function generate(menu, firstLabel, lastLabel, home) {
        var currentUrl = new Url(location.href);
        var matchingUrl = Url.match(currentUrl, menu);

        if (!matchingUrl) {
            return;
        }

        var crumbs = [];
        if (lastLabel) {
            crumbs.push(currentUrl.toCrumb(lastLabel));
        }
        crumbs.push(matchingUrl.toCrumb());

        var hierarchy = matchingUrl.menu;
        while (hierarchy && hierarchy.label) {
            crumbs.push(new Crumb(Dom.getText(hierarchy.label)));
            hierarchy = hierarchy.parent;
        }
        crumbs.push(new Crumb(firstLabel, home));

        var output = [];
        output.push("<ul>");
        for (var ii = crumbs.length - 1; ii >= 0; ii--) {
            output.push("<li>" + crumbs[ii].toHTML() + "<\/li>");
        }
        output.push("<\/ul>");
        document.write(output.join(""));

    }

    // ------------------------------------------------------------------------

    return {
        generate : generate
    };

})();
