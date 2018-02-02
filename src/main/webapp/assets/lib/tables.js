var Tables = {};

Tables.getColumnWidth = function(table, colIndex) {
    var width = 0;
    for (var ii = 0; ii < table.rows.length; ii++) {
        var cell = table.rows[ii].cells[colIndex];
        var cellWidth = Dom.getDimensions(cell).width;
        if (cellWidth > width) {
            width = cellWidth;
        }
    }
    return width;
};

/**
 * <p>
 * Fixes the first column, making the other columns scrollable. The target TABLE
 * must be enclosed within a DIV, marked with an "overflow: auto" CSS property.
 * Also, make sure the table has been properly rendered before calling the
 * method, as it requires final dimensions to work correctly (this for instance
 * applies when you dynamically show the table).
 * </p>
 * 
 * <p>
 * Options
 * </p>
 * <ul>
 * <li>noBorderBoxSizing: true if your style does not have border box sizing,
 * false otherwise.</li>
 * </ul>
 */
Tables.fixFirstColumn = function(table, options) {
    var headerWidth = Tables.getColumnWidth(table, 0);
    table.parentNode.style.marginLeft = headerWidth + "px";
    for (var ii = 0; ii < table.rows.length; ii++) {
        var firstCell = table.rows[ii].cells[0];
        var secondCell = table.rows[ii].cells[1];
        firstCell.style.position = "absolute";

        var borderBoxSizingCorrection = 0;
        if (options && options.noBorderBoxSizing) {
            var paddingLeft = parseInt(Dom.getStylePropertyValue(firstCell, "padding-left"), 10) || 0;
            var paddingRight = parseInt(Dom.getStylePropertyValue(firstCell, "padding-right"), 10) || 0;
            var borderLeft = parseInt(Dom.getStylePropertyValue(firstCell, "border-left-width"), 10) || 0;
            var borderRight = parseInt(Dom.getStylePropertyValue(firstCell, "border-right-width"), 10) || 0;
            borderBoxSizingCorrection = paddingLeft + paddingRight + borderLeft + borderRight;
        }

        var height = parseInt(Dom.getStylePropertyValue(secondCell, "height"), 10) || 0;
        firstCell.style.width = (headerWidth - borderBoxSizingCorrection) + "px";
        firstCell.style.height = height + "px";
        firstCell.style.marginLeft = "-" + headerWidth + "px";
    }
};

// --- Filtering --------------------------------------------------------------

Tables.filter = function(tbody, predicate) {
    var rows = tbody.rows;
    for (var ii = 0; ii < rows.length; ii++) {
        var row = rows[ii];
        Dom.setDisplayed(row, predicate(row));
    }
};

Tables.predicates = {};

Tables.predicates.createSimpleTextPredicate = function(text) {
    return function(row) {
        var cells = row.cells;
        if (!text || Strings.isEmpty(text)) {
            return true;
        }
        var textLC = text.toLowerCase();
        for (var ii = 0; ii < cells.length; ii++) {
            var cellContent = Dom.getText(cells[ii]);
            if (cellContent.toLowerCase().indexOf(textLC) != -1) {
                return true;
            }
        }
        return false;
    };
};

// --- Sorting ----------------------------------------------------------------

Tables.sort = function(tbody, columnIndex, extractor, comparator) {
    var sortableEntities = buildSortableEntityList(tbody, columnIndex, extractor);
    sortEntityList(sortableEntities, comparator);
    reflectSortOnHTML(tbody, sortableEntities);

    // ---

    function SortableEntity(text, row) {
        this.text = text;
        this.row = row;
    }

    function buildSortableEntityList(tbody, columnIndex, extractor) {
        var entities = [];
        var rows = tbody.rows;
        var rowsCount = rows.length;
        for (var ii = 0; ii < rowsCount; ii++) {
            entities.push(new SortableEntity(extractor(rows[ii].cells[columnIndex]), rows[ii]));
        }
        return entities;
    }

    function sortEntityList(entityList, comparator) {
        entityList.sort(function(first, second) {
            return comparator(first.text, second.text);
        });
    }

    function reflectSortOnHTML(tbody, sortedEntityList) {
        for (var ii = 0; ii < sortedEntityList.length; ii++) {
            tbody.appendChild(sortedEntityList[ii].row);
        }
    }
};

// ---

Tables.extractors = {};

Tables.extractors.CELL_TEXT_EXTRACTOR = function(cell) {
    return Dom.getText(cell);
};

Tables.extractors.createCellAttributeExtractor = function(attribute) {
    return function(cell) {
        return cell.getAttribute(attribute);
    };
};

// ---

Tables.comparators = {};

Tables.comparators.SIMPLE_ASC_COMPARATOR = function(first, second) {
    if (first < second) {
        return -1;
    }
    if (first > second) {
        return +1;
    }
    return 0;
}

Tables.comparators.STRING_INSENSITIVE_ASC_COMPARATOR = function(first, second) {
    var s1 = first && first.toLowerCase() || "";
    var s2 = second && second.toLowerCase() || "";
    return Tables.comparators.SIMPLE_ASC_COMPARATOR(s1, s2);
};

Tables.comparators.STRING_INSENSITIVE_DESC_COMPARATOR = function(first, second) {
    return Tables.comparators.STRING_INSENSITIVE_ASC_COMPARATOR(second, first);
};

Tables.comparators.NUMBER_ASC_COMPARATOR = function(first, second) {
    var s1 = +first || 0;
    var s2 = +second || 0;
    return Tables.comparators.SIMPLE_ASC_COMPARATOR(s1, s2);
};

Tables.comparators.NUMBER_DESC_COMPARATOR = function(first, second) {
    return Tables.comparators.NUMBER_ASC_COMPARATOR(second, first);
};
