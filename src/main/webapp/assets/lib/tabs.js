var Tabs = (function() {

    var contexts = [];
    var items = [];
    var targets = [];
    var tabs = [];
    var tabsById = {};

    Events.addListener(window, "onload", initAllTabs);

    function initAllTabs(evt) {
        createAllTabs();
        buildTabsHierarchy();
        unlockAllTargets();
        showInitialTabs();
    }

    function createAllTabs() {
        for (var ii = 0; ii < contexts.length; ii++) {
            contexts[ii].createTabs();
        }
    }

    function buildTabsHierarchy() {
        for (var ii = 0; ii < tabs.length; ii++) {
            var tab = tabs[ii];
            if (!tab.parent) {
                tab.parent = findParentTab(tab);
                if (tab.parent) {
                    tab.parent.children.push(tab);
                }
            }
            if (!tab.next) {
                tab.next = findSiblingTab(tab);
            }
        }
    }

    function unlockAllTargets() {
        for (var ii = 0; ii < contexts.length; ii++) {
            contexts[ii].unlockTargets();
        }
    }

    function showInitialTabs() {
        for (var ii = 0; ii < tabs.length; ii++) {
            tabs[ii].hide(true);
        }
        var lastActiveTabTargetIds = getQueryStringTargetIds();
        if (lastActiveTabTargetIds.length == 0) {
            lastActiveTabTargetIds = getCookiedTargetIds();
        }
        for (ii = 0; ii < lastActiveTabTargetIds.length; ii++) {
            var targetId = lastActiveTabTargetIds[ii];
            var tab = tabsById[targetId];
            if (tab) {
                tab.show();
            }
        }
        for (ii = 0; ii < contexts.length; ii++) {
            var context = contexts[ii];
            if (context.hasOneTabVisible()) {
                continue;
            }
            if (context.rootTab && !context.rootTab.parent) {
                context.rootTab.show();
            }
        }
    }

    // --- Contexts -----------------------------------------------------------

    function TabContext(config) {
        this.placeholderId = config.placeholderId;
        this.targetIds = config.targetIds;
        this.titleExtractor = config.titleExtractor;
        this.eventHandlers = config.eventHandlers;
        this.fadeIn = config.fadeIn;
        this.tabs = [];
        this.rootTab = null;
        this.activeTab = null;
    }

    TabContext.prototype.hasOneTabVisible = function() {
        for (var ii = 0; ii < this.tabs.length; ii++) {
            if (this.tabs[ii].isVisible()) {
                return true;
            }
        }
        return false;
    }

    TabContext.prototype.lockTargets = function() {
        for (var ii = 0; ii < this.targetIds.length; ii++) {
            Dom.addCssStyleDeclaration("#" + this.targetIds[ii], "display: none; visibility: hidden");
        }
    };

    TabContext.prototype.unlockTargets = function() {
        for (var ii = 0; ii < this.targetIds.length; ii++) {
            var style = Dom.getCssStyleDeclaration("#" + this.targetIds[ii]);
            style.display = "block";
            style.visibility = "visible";
        }
    };

    TabContext.prototype.createTabs = function() {
        var placeholder = document.getElementById(this.placeholderId);
        if (!placeholder) {
            return;
        }
        var tabGroup = document.createElement("ul");
        var container = document.createElement("div");
        placeholder.appendChild(tabGroup);
        placeholder.appendChild(container);
        for (var j = 0; j < this.targetIds.length; j++) {
            var target = document.getElementById(this.targetIds[j]);
            if (target) {
                container.appendChild(target);
                var tab = new Tab(this, target);
                tab.associate(tabGroup);
                if (!this.rootTab && j == 0) {
                    this.rootTab = tab;
                }
                items.push(tab.item);
                targets.push(target);
                tabs.push(tab);
                tabsById[target.id] = tab;
            }
        }
    };

    // --- Tabs ---------------------------------------------------------------

    function Tab(context, target) {
        this.context = context;
        this.target = target;
        this.parent = null;
        this.next = null;
        this.children = [];

        this.context.tabs.push(this);
    }

    Tab.prototype.associate = function createTabItem(tabGroup) {
        var item = document.createElement("li");
        var button = document.createElement("button");
        button.type = "button";
        Dom.setText(button, this.context.titleExtractor(this.target));
        item.appendChild(button);
        tabGroup.appendChild(item);
        Events.addListener(item, "onclick", makeTabSelector(this));
        this.item = item;
    };

    Tab.prototype.show = function(ignoreChildren, ignoreParent) {
        if (this.context.activeTab) {
            this.context.activeTab.hide();
        }
        if (!ignoreChildren && this.children.length) {
            return (this.lastChildShown || this.children[0]).show();
        }
        if (!ignoreParent && this.parent) {
            this.parent.lastChildShown = this;
            this.parent.show(true);
        }
        if (typeof Fade != "undefined" && this.context.fadeIn) {
            Fade.fadeIn(this.target);    
        }
        Dom.setDisplayed(this.target, true);
        if (this.context.eventHandlers && this.context.eventHandlers.onShow) {
            this.context.eventHandlers.onShow(this);
        }
        setCookiedTargetId(this.target.id, this.context.placeholderId);
        this.context.activeTab = this;
    };

    Tab.prototype.getText = function() {
        var button = this.item.getElementsByTagName("button")[0];
        return Dom.getText(button);
    };

    Tab.prototype.setText = function(text) {
        var button = this.item.getElementsByTagName("button")[0];
        Dom.setText(button, text);
    };

    Tab.prototype.hide = function(ignoreParent) {
        if (!ignoreParent) {
            if (this.parent) {
                this.parent.hide();
            }
        }
        Dom.setDisplayed(this.target, false);
        if (this.context.eventHandlers && this.context.eventHandlers.onHide) {
            this.context.eventHandlers.onHide(this);
        }
    };

    Tab.prototype.isVisible = function() {
        return Dom.isDisplayed(this.target);
    };

    // --- Tab helpers --------------------------------------------------------

    function findParentTab(tab) {
        var target = tab.target;
        while ((target = target.parentNode) != null) {
            for (var ii = 0; ii < targets.length; ii++) {
                if (targets[ii] == target) {
                    return tabs[ii];
                }
            }
        }
    }

    function findSiblingTab(tab) {
        var candidate = tab.item.nextSibling;
        if (candidate) {
            for (var ii = 0; ii < items.length; ii++) {
                if (candidate == items[ii]) {
                    return tabs[ii];
                }
            }
        }
    }

    function makeTabSelector(tab) {
        return function(evt) {
            tab.show();
            Events.preventDefaultBehavior(evt);
        };
    }

    // --- Caching tabs in cookies --------------------------------------------

    var QUERYSTRING_TAB_KEY = "tab";
    var LAST_ACTIVE_TAB_TARGET_ID_COOKIE_KEY = "lastTabTargetIds";
    var LAST_ACTIVE_TAB_TARGET_ID_COOKIE_KEY_SEPARATOR = ",";

    function getPagedCookieKey() {
        var path = location.pathname;
        path = path.replace(/\/\d+/g, ""); // remove rest-like ids.
        return path + "_" + LAST_ACTIVE_TAB_TARGET_ID_COOKIE_KEY;
    }

    function getQueryStringTargetIds() {
        var result = [];
        var ids = QueryString.getParams()[QUERYSTRING_TAB_KEY];
        if (ids) {
            if (typeof ids == "string") {
                result.push(ids);
            } else {
                result = ids;
            }
        }
        return result;
    }

    function getCookiedTargetIds() {
        var result = [];
        var ids = Cookies.get(getPagedCookieKey());
        if (ids) {
            result = ids.split(LAST_ACTIVE_TAB_TARGET_ID_COOKIE_KEY_SEPARATOR);
        }
        return result;
    }

    function setCookiedTargetId(targetId, placeholderId) {
        var placeholder = document.getElementById(placeholderId);
        if (!placeholder) {
            Cookies.set(getPagedCookieKey(), targetId, 1);
            return;
        }
        var target = document.getElementById(targetId);
        var currentIds = getCookiedTargetIds();
        var result = [];
        for (var ii = 0; ii < currentIds.length; ii++) {
            var currentId = currentIds[ii];
            if (currentId == targetId) {
                continue;
            }
            var currentTab = document.getElementById(currentId);
            if (!Dom.contains(placeholder, currentTab)) {
                // Keep, independent tab group.
                result.push(currentId);
                continue;
            }
            if (Dom.contains(currentTab, target)) {
                // Keep, it's a parent.
                result.push(currentId);
                continue;
            }
            if (Dom.contains(target, currentTab)) {
                // Keep, it's a child.
                result.push(currentId);
                continue;
            }
        }
        result.push(targetId);
        Cookies.set(getPagedCookieKey(), result.join(LAST_ACTIVE_TAB_TARGET_ID_COOKIE_KEY_SEPARATOR), 1);
    }

    // ------------------------------------------------------------------------

    var Tabs = {};

    /**
     * <p>
     * The configuration should contain the following properties:
     * </p>
     * <ul>
     * <li><strong>placeholderId</strong>: Empty element which will contain
     * the tabs, as well as their targets.</li>
     * <li><strong>targetIds</strong>: List of ids of the targets to be
     * activated through the tabs.</li>
     * <li><strong>titleExtractor</strong>: Function called when building the
     * tab. The function should return the title applicable to the current
     * target.</li>
     * <li><strong>eventHandlers</strong>: Object containing properties
     * "onShow" and "onHide", referring to handlers, called on corresponding
     * tab-related events.</li>
     * <li><strong>fadeIn</strong>: (Optional) true if the tab should be faded
     * in when when shown, using the Fade component.</li>
     * </ul>
     * 
     * @param config
     *            Empty element which will contain the tabs, as well as their
     *            targets.
     */
    Tabs.tabify = function(config) {
        var context = new TabContext(config);
        context.lockTargets();
        contexts.push(context);
        return context;
    };

    Tabs.setNextActiveTab = function(id) {
        setCookiedTargetId(id);
    };

    Tabs.getTabById = function(id) {
        return tabsById[id];
    };

    // ----------------------------------------------------------------------------

    Tabs.EventHandlers = {};

    Tabs.EventHandlers.createAddCssClassOnShowHandler = function(cssClass, nextHandler) {
        return function(tab) {
            Dom.addCssClass(tab.item, cssClass);
            if (nextHandler) {
                nextHandler(tab);
            }
        }
    };

    Tabs.EventHandlers.createRemoveCssClassOnHideHandler = function(cssClass, nextHandler) {
        return function(tab) {
            Dom.removeCssClass(tab.item, cssClass);
            if (nextHandler) {
                nextHandler(tab);
            }
        }
    };

    // ----------------------------------------------------------------------------

    var MAX_HEADERS_INDEX = 6;

    Tabs.TitleExtractors = {};

    for (var headerIndex = 1; headerIndex <= MAX_HEADERS_INDEX; headerIndex++) {
        Tabs.TitleExtractors["h" + headerIndex + "TitleExtractor"] = createHeaderTitleExtractor("h" + headerIndex);
    }

    Tabs.TitleExtractors.tableTitleExtractor = function(target) {
        var table = Dom.findFirst(target, "table", true);
        Dom.setDisplayed(table.caption, false);
        return Dom.getText(table.caption);
    }

    Tabs.TitleExtractors.legendTitleExtractor = function(target) {
        var legend = Dom.findFirst(target, "legend", true);
        Dom.setDisplayed(legend);
        return Dom.getText(legend);
    };

    function createHeaderTitleExtractor(header) {
        return function(target) {
            var h = Dom.findFirst(target, header, true);
            Dom.setDisplayed(h, false);
            return Dom.getText(h);
        }
    }

    // ----------------------------------------------------------------------------

    return Tabs;

})();
