var Lists = {};

Lists.balance = function(lists) {
    var totalHeight = 0;
    for (var ii = 0; ii < lists.length; ii++) {
        totalHeight += Dom.getDimensions(lists[ii]).height;
    }

    var avgColHeight = Math.floor(totalHeight / lists.length);
    for (ii = 0; ii < lists.length - 1; ii++) {
        var left = lists[ii];
        var right = lists[ii + 1];
        var leftHeight = Dom.getDimensions(left).height;
        if (leftHeight < avgColHeight) {
            var rightItems = right.getElementsByTagName("li");
            do {
                left.appendChild(rightItems[0]);
                leftHeight = left.offsetHeight;
            } while (leftHeight < avgColHeight);
        } else if (leftHeight > avgColHeight) {
            var leftItems = left.getElementsByTagName("li");
            do {
                right.insertBefore(leftItems[leftItems.length - 1], right.firstChild);
                leftHeight = left.offsetHeight;
            } while (leftHeight > avgColHeight);
        }
    }
};

Lists.getItems = function(list) {
    var items = [];
    for (var ii = 0; ii < list.childNodes.length; ii++) {
        var child = list.childNodes[ii];
        if (child.nodeName.toLowerCase() == "li") {
            items.push(child);
        }
    }
    return items;
};