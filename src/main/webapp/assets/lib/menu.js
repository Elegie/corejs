/**
 * Options:
 * <ul>
 * <li>anchor: the element to which the menu must be anchored, in a responsive
 * view.</li>
 * <li>backText: the text to be printed on back items in submenus.</li>
 * <li>backCssClass: the CSS class to be applied to back items in submenus.</li>
 * <li>responsiveWidth: the screen width under which the layout of the menu
 * changes to a small-screen one.</li>
 * </ul>
 */
var Menus = (function() {

    var topMenus = [];

    Events.addResizeListener(window, redrawAllMenus);

    function redrawAllMenus(evt) {
        for (var ii = 0; ii < topMenus.length; ii++) {
            topMenus[ii].redraw();
        }
    }

    function getMenuByContainer(container) {
        return findMenu(container, topMenus);

        function findMenu(container, menuList) {
            for (var ii = 0; ii < menuList.length; ii++) {
                var menu = menuList[ii];
                if (menu.container == container) {
                    return menu;
                }
                menu = findMenu(container, menu.subMenus);
                if (menu) {
                    return menu;
                }
            }
        }
    }

    // ------------------------------------------------------------------------

    function createMenu(container, layout, options) {
        var menu = parseMenu(container, layout, options);
        topMenus.push(menu);
        menu.init();
        menu.redraw();
        return menu;
    }

    function parseMenu(container, layout, options, parent, label) {
        var menu = new Menu(container, layout, options);
        if (parent) {
            menu.parent = parent;
            menu.parent.subMenus.push(menu);
        }
        if (label) {
            menu.label = label;
        }
        Dom.traverseDown(container, function(node) {
            if (node.nodeName.toLowerCase() == "li") {
                Dom.traverseDown(node, function(node) {
                    var nodeName = node.nodeName.toLowerCase();
                    if (nodeName == "button" || nodeName == "input" && node.type == "button") {
                        var candidateSubMenu = Dom.findNext(node, "ul");
                        if (candidateSubMenu) {
                            parseMenu(candidateSubMenu, layout, options, menu, node);
                        }
                    }
                }, false);
            }
        }, false);
        return menu;
    }

    // ------------------------------------------------------------------------

    function Menu(container, layout, options) {
        this.container = container;
        this.layout = layout;
        this.options = options;
        this.label = null;
        this.parent = null;
        this.subMenus = [];
    }

    Menu.prototype.init = function() {
        return this.layout.init(this);
    };

    Menu.prototype.redraw = function() {
        return this.layout.redraw(this);
    };

    Menu.prototype.show = function() {
        return this.layout.show(this);
    };

    Menu.prototype.hide = function() {
        return this.layout.hide(this);
    };

    Menu.prototype.isVisible = function() {
        return this.layout.isVisible(this);
    }

    Menu.prototype.isSubMenu = function() {
        return !!this.parent;
    };

    Menu.prototype.forEachSubMenu = function(actor) {
        for (var ii = 0; ii < this.subMenus.length; ii++) {
            actor(this.subMenus[ii]);
        }
    }

    // ------------------------------------------------------------------------

    function Layout() {

    }

    Layout.prototype.init = (function() {

        function backItemize(menu) {
            if (menu.label && menu.parent) {
                var backCssClass = menu.options.backCssClass;
                var list = menu.container;
                var backItem = document.createElement("li");
                var backItemButton = document.createElement("button");
                var backItemText = document.createTextNode(menu.options.backText);
                backItemButton.appendChild(backItemText);
                backItem.appendChild(backItemButton);
                if (backCssClass) {
                    Dom.addCssClass(backItem, backCssClass);
                }
                list.insertBefore(backItem, list.firstChild);
                menu.backItem = backItem;
                Events.addListener(menu.label, "onclick", createShowListener(menu));
                Events.addListener(backItem, "onclick", createShowListener(menu.parent));
            }
        }

        function popinifyMenu(menu) {
            if (!menu.popin) {
                menu.popin = Popins.create(menu.container);
                menu.popin.isVisible = popinVisible;
                menu.popin.setShowHandler(popinShowHandler);
                menu.popin.addCloseHandler(popinCloseHandler);
            }
        }

        function popinVisible() {
            var popin = this;
            return Dom.isDisplayed(popin.container) && Dom.isVisible(popin.container);
        }

        function popinShowHandler() {
            var popin = this;
            var menu = getMenuByContainer(popin.container);
            var layout = menu.layout;
            Dom.setDisplayed(menu.container, false);
            Dom.setVisible(menu.container, true);
            while ((menu = menu.parent) != null && layout.isUIPreparable(menu)) {
                Dom.setVisible(menu.container, false);
                Dom.setDisplayed(menu.container, true, "block");
            }
            return Popins.ShowHandlers.CoordinatesShowHandler.apply(popin, arguments);
        }

        function popinCloseHandler() {
            var popin = this;
            var menu = getMenuByContainer(popin.container);
            var layout = menu.layout;
            while ((menu = menu.parent) != null && layout.isUIPreparable(menu)) {
                Dom.setDisplayed(menu.container, false);
                Dom.setVisible(menu.container, true);
            }
        }

        function createShowListener(menu) {
            return function(evt) {
                if (menu.isVisible()) {
                    menu.hide();
                } else {
                    menu.show();
                }
                Events.stopPropagation(evt);
            };
        }

        return function(menu) {
            var layout = this;
            backItemize(menu);
            popinifyMenu(menu);
            menu.forEachSubMenu(function(subMenu) {
                layout.init(subMenu);
            });
            if (menu.options.anchor && !menu.isSubMenu()) {
                Events.addListener(menu.options.anchor, "onclick", function(evt) {
                    menu.show();
                    Events.stopPropagation(evt);
                });
            }
        }

    })();

    Layout.prototype.isVisible = function(menu) {
        if (menu.popin) {
            return menu.popin.isVisible();
        }
        return true;
    };

    Layout.prototype.showBackItem = function(menu, show) {
        if (menu.backItem) {
            Dom.setDisplayed(menu.backItem, show);
        }
    };

    Layout.prototype.showAnchor = function(menu, show) {
        var anchor = menu.options.anchor;
        if (anchor) {
            Dom.setDisplayed(anchor, show, "inline-block");
        }
    };

    // ------------------------------------------------------------------------

    var DropDownLayout = new Layout();

    DropDownLayout.redraw = function(menu) {
        var layout = this;
        if (menu.isSubMenu()) {
            menu.container.style.position = "absolute";
            menu.hide();
            var parent = menu.parent;
            if (!parent.isSubMenu()) {
                layout.showBackItem(menu, false);
            }
        } else {
            layout.showAnchor(menu, false);
            menu.popin.setActive(false);
            menu.container.style.position = "static";
            menu.show();
        }
        menu.forEachSubMenu(function(subMenu) {
            layout.redraw(subMenu);
        });
    };

    DropDownLayout.show = function(menu) {
        if (!menu.isSubMenu()) {
            menu.popin.show();
            return;
        }
        var firstSubMenu = menu;
        var parentMenu = firstSubMenu.parent;
        while (parentMenu.parent) {
            firstSubMenu = parentMenu;
            parentMenu = parentMenu.parent;
        }
        var parentContainer = firstSubMenu.container.parentNode;
        var dimensions = Dom.getDimensions(parentContainer);
        var position = Dom.getPosition(parentContainer);
        var popinDimensions = menu.popin.getUIInfo().dimensions;
        menu.popin.show(position.x + dimensions.width / 2 - popinDimensions.width / 2, position.y + dimensions.height);
    };

    DropDownLayout.hide = function(menu) {
        var layout = this;
        if (!menu.isSubMenu()) {
            return;
        }
        menu.popin.hide();
        menu.forEachSubMenu(function(subMenu) {
            layout.hide(subMenu);
        });
    };

    DropDownLayout.isUIPreparable = function(menu) {
        return menu.isSubMenu();
    };

    // ------------------------------------------------------------------------

    var PopinLayout = new Layout();

    PopinLayout.redraw = function(menu) {
        var layout = this;
        var anchor = menu.options.anchor;
        menu.popin.setActive(true);
        menu.container.style.position = Dom.getStylePropertyValue(anchor, "position") == "fixed" ? "fixed" : "absolute";
        menu.hide();
        layout.showBackItem(menu, true);
        menu.forEachSubMenu(function(subMenu) {
            layout.redraw(subMenu);
        });
        if (!menu.isSubMenu()) {
            layout.showAnchor(menu, true);
        }
    };

    PopinLayout.show = function(menu) {
        var anchor = menu.options.anchor;
        var dimensions = Dom.getDimensions(anchor);
        var position = Dom.getPosition(anchor);
        menu.popin.show(position.x + dimensions.width / 2, position.y + dimensions.height / 2);
    };

    PopinLayout.hide = function(menu) {
        var layout = this;
        menu.popin.hide();
        menu.forEachSubMenu(function(subMenu) {
            layout.hide(subMenu);
        });
    };

    PopinLayout.isUIPreparable = function(menu) {
        return true;
    };

    // ------------------------------------------------------------------------

    var ResponsiveLayout = (function() {

        function getLayout(menu) {
            var responsiveWidth = +menu.options.responsiveWidth;
            var viewPortSize = Dom.getViewPortSize();
            if (viewPortSize.width <= responsiveWidth) {
                return PopinLayout;
            }
            return DropDownLayout;
        }

        var layout = new Layout();
        layout.redraw = function(menu) {
            return getLayout(menu).redraw.apply(this, arguments);
        };
        layout.show = function(menu) {
            return getLayout(menu).show.apply(this, arguments);
        };
        layout.hide = function(menu) {
            return getLayout(menu).hide.apply(this, arguments);
        };
        layout.isUIPreparable = function(menu) {
            return getLayout(menu).isUIPreparable.apply(this, arguments);
        };
        return layout;

    })();

    // ------------------------------------------------------------------------

    return {
        create : createMenu,
        Layouts : {
            DropDownLayout : DropDownLayout,
            PopinLayout : PopinLayout,
            ResponsiveLayout : ResponsiveLayout
        }
    };

})();