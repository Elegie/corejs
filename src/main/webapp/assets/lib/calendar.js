var Calendar = {};

Calendar.css = {
    WIDGET : "calendar-widget",
    BUTTON : "calendar-button",
    INPUT : "calendar-input",
    SELECTOR : "calendar-selector",
    GRID : "calendar-grid",
    PREVIOUS : "calendar-previous",
    NEXT : "calendar-next",
    MONTH : "calendar-month",
    YEAR : "calendar-year",
    DAY_HEADER : "calendar-day-header",
    DAY_PAST : "calendar-day-past",
    DAY_CURRENT : "calendar-day-current",
    DAY_TODAY : "calendar-day-today",
    DAY_SELECTED : "calendar-day-selected",
    DAY_FUTURE : "calendar-day-future"
};

/**
 * @param i18n
 *            Object containing i18n collections. "i18n.days.short" contains a
 *            list of day short names (["Su, "Mo"...]. "i18n.selector" contains
 *            labels for the selector ("i18n.selector.previous" and
 *            "i18n.selector.next").
 */
Calendar.setUp = function(yearControl, monthControl, dayControl, datePattern, i18n, enableNumericRanges) {

    var currentView;
    var popin;
    var calendar;
    var selector;
    var grid;

    var dateParts = [];
    var dateRegExp;
    var dateAllowKeyboardEvents;
    var DatePart = function(content, index) {
        this.content = content;
        this.index = index;
    }

    init();
    return calendar;

    // --- init ---------------------------------------------------------------

    function init() {
        calendar = document.createElement("input");
        calendar.id = "calendar-" + Strings.generateId();
        calendar.type = "text";
        calendar.readOnly = !enableNumericRanges;
        calendar.setDate = setDate;
        calendar.getDate = getDate;
        Dom.addCssClass(calendar, Calendar.css.INPUT);

        calendar.originalDay = dayControl;
        calendar.originalMonth = monthControl;
        calendar.originalYear = yearControl;
        calendar.day = replaceSelectWithHiddenInput(dayControl);
        calendar.month = replaceSelectWithHiddenInput(monthControl);
        calendar.year = replaceSelectWithHiddenInput(yearControl);
        calendar.value = formatDate(getDate(), calendar.datePattern);
        calendar.day.parentNode.insertBefore(calendar, calendar.day);
        if (enableNumericRanges) {
            initRanges();
        }

        var trigger = document.createElement("input");
        trigger.type = "button";
        Dom.addCssClass(trigger, Calendar.css.BUTTON);
        Events.addListener(trigger, "onclick", createCalendarShowListener());
        calendar.parentNode.insertBefore(trigger, calendar.nextSibling);
    }

    function replaceSelectWithHiddenInput(select) {
        var hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = select.name;
        hiddenInput.id = select.id;
        hiddenInput.value = select.options[select.selectedIndex].value;
        select.parentNode.replaceChild(hiddenInput, select);
        return hiddenInput;
    }

    function createCalendarShowListener() {
        var widget = createCalendarWidget();
        popin = Popins.create(widget);
        popin.setCloseOtherPopinsOnShow(false);
        popin.setShowHandler(Popins.ShowHandlers.EventShowHandler);
        popin.addCloseHandler(function() {
            currentView = null;
        });
        document.body.appendChild(widget);
        return function(evt) {
            updateGrid();
            popin.show(evt);
        };
    }

    // --- Ranges -------------------------------------------------------------

    function initRanges() {
        createDateRegExp();
        adjustCalendarLabels();

        Events.addListener(calendar, "onclick", selectRange);
        Events.addListener(calendar, "onkeydown", updateRange);
        Events.addListener(calendar, "onkeyup", saveRange);
        Events.addListener(calendar, "onblur", validateRange);
    }

    function createDateRegExp() {
        var interlopedPattern = datePattern;
        var letters = /\w+/g;
        var match;
        while ((match = letters.exec(datePattern)) != null) {
            var datePartPattern = null;
            for (var ii = 0; ii < Dates.patterns.length; ii++) {
                if (Dates.patterns[ii].pattern == match[0]) {
                    datePartPattern = Dates.patterns[ii];
                    break;
                }
            }
            if (!datePartPattern || !datePartPattern.toNumericPattern) {
                continue;
            }
            var datePartRegExp = new RegExp(datePartPattern.pattern);
            if (datePartRegExp.test(interlopedPattern)) {
                interlopedPattern = interlopedPattern.replace(datePartRegExp, datePartPattern.toNumericPattern());
                dateParts.push(new DatePart(datePartPattern, dateParts.length));
            }
        }
        interlopedPattern = interlopedPattern.replace(/ /g, " ?");
        dateRegExp = RegExp("^" + interlopedPattern + "$");
    }

    function adjustCalendarLabels() {
        var labels = document.getElementsByTagName("label");
        var ids = [ calendar.year.id, calendar.month.id, calendar.day.id ];
        for (var ii = 0; ii < labels.length; ii++) {
            for (var j = 0; j < ids.length; j++) {
                if (labels[ii].htmlFor == ids[j]) {
                    labels[ii].htmlFor = calendar.id;
                    Events.addListener(labels[ii], "onclick", labelSelectionHandler);
                    break;
                }
            }
        }
        // Show first date part.
        function labelSelectionHandler(evt) {
            Events.preventDefaultBehavior(evt);
            Events.stopPropagation(evt);
            calendar.focus();
            highlightDatePart(dateParts[0]);
        }
    }

    function selectRange(evt) {
        if (!dateRegExp.test(calendar.value)) {
            return;
        }
        highlightDatePart(getSelectedDatePart());
    }

    function updateRange(evt) {
        var KEYCODE_LEFT = 37;
        var KEYCODE_UP = 38;
        var KEYCODE_RIGHT = 39;
        var KEYCODE_DOWN = 40;

        var selectedDatePart = getSelectedDatePart();
        dateAllowKeyboardEvents = false;
        switch (evt.keyCode) {
            case KEYCODE_DOWN:
                updateDatePart(selectedDatePart, -1);
                break;
            case KEYCODE_UP:
                updateDatePart(selectedDatePart, +1);
                break;
            case KEYCODE_LEFT:
                selectNextDatePart(selectedDatePart, -1);
                break;
            case KEYCODE_RIGHT:
                selectNextDatePart(selectedDatePart, +1);
                break;
            default:
                dateAllowKeyboardEvents = true;
        }
        if (!dateAllowKeyboardEvents) {
            Events.preventDefaultBehavior(evt);
        }
    }

    function saveRange(evt, formatCalendarValue) {
        if (!dateAllowKeyboardEvents) {
            Events.preventDefaultBehavior(evt);
            return false;
        }
        var match = dateRegExp.exec(calendar.value);
        if (!match) {
            return false;
        }
        // a 31-days/month, 366-days/year date.
        var date = new Date(2012, 11, 1, 0, 0, 0, 0);
        var adjusted = false;
        for (var ii = 0; ii < dateParts.length; ii++) {
            adjusted = dateParts[ii].content.update(date, match[ii + 1]);
            if (adjusted) {
                break;
            }
        }
        if (!adjusted && dateInRange(date)) {
            setDate(date, !!formatCalendarValue);
            return true;
        }
        return false;
    }

    function validateRange(evt) {
        dateAllowKeyboardEvents = true;
        var saved = saveRange(evt, true);
        if (!saved) {
            calendar.value = formatDate(getDate(), calendar.datePattern);
        }
    }

    function getSelectedDatePart() {
        var caretPosition = Ranges.getCaretPosition(calendar);
        var selectedDatePart = dateParts[0];
        var digits = /\d+/g;
        var match;
        var index = 0;
        while ((match = digits.exec(calendar.value)) != null) {
            if (caretPosition < match.index) {
                break;
            }
            selectedDatePart = dateParts[index++];
        }
        return selectedDatePart;
    }

    function updateDatePart(datePart, offset) {
        var date = datePart.content.offset(getDate(), offset);
        setDate(date, true);
        highlightDatePart(datePart);
    }

    function selectNextDatePart(datePart, offset) {
        var datePartIndex = datePart.index;
        if (datePartIndex == 0 && offset < 0) {
            return;
        }
        if (datePartIndex == dateParts.length - 1 && offset > 0) {
            return;
        }
        highlightDatePart(dateParts[datePartIndex + offset]);
    }

    function highlightDatePart(datePart) {
        Ranges.clearSelection();

        var digits = /\d+/g;
        var match;
        var index = 0;
        while ((match = digits.exec(calendar.value)) != null) {
            if (index++ == datePart.index) {
                Ranges.selectText(calendar, match.index, match[0].length);
            }
        }
    }

    // --- Calendar Widget ----------------------------------------------------

    function createCalendarWidget() {
        selector = createSelector();
        grid = createGrid();
        var container = document.createElement("div");
        Dom.addCssClass(container, Calendar.css.WIDGET);
        container.appendChild(selector);
        container.appendChild(grid);
        return container;
    }

    // --- Selector ---

    function createSelector() {
        var container = document.createElement("div");
        container.appendChild(createNavigation(-1, Calendar.css.PREVIOUS, "previous"));
        container.appendChild(createMonthPicker());
        container.appendChild(createNavigation(+1, Calendar.css.NEXT, "next"));
        Dom.addCssClass(container, Calendar.css.SELECTOR);
        return container;
    }

    function createNavigation(monthOffset, cssClass, title) {
        var box = document.createElement("div");
        var button = document.createElement("input");
        button.type = "button";
        if (i18n && i18n.selector && i18n.selector[title]) {
            button.title = i18n.selector[title];
        }
        Events.addListener(button, "onclick", createMonthOffsetHandler(monthOffset));
        Dom.addCssClass(box, cssClass);
        box.appendChild(button);
        return box;
    }

    function createMonthOffsetHandler(monthOffset) {
        return function(evt) {
            Events.preventDefaultBehavior(evt);
            Events.stopPropagation(evt);
            return updateCurrentViewAndGrid(currentView.getFullYear(), currentView.getMonth() + 1 + monthOffset);
        }
    }

    function createMonthPicker() {
        var box = document.createElement("div");
        box.appendChild(calendar.originalMonth);
        box.appendChild(calendar.originalYear);
        Events.addListener(calendar.originalMonth, "onclick", onMonthPickerClick);
        Events.addListener(calendar.originalYear, "onclick", onMonthPickerClick);
        Events.addTapListener(calendar.originalMonth, onMonthPickerClick);
        Events.addTapListener(calendar.originalYear, onMonthPickerClick);
        Events.addListener(calendar.originalMonth, "onchange", onMonthPickerChange);
        Events.addListener(calendar.originalYear, "onchange", onMonthPickerChange);

        Dom.addCssClass(calendar.originalMonth, Calendar.css.MONTH);
        Dom.addCssClass(calendar.originalYear, Calendar.css.YEAR);
        return box;

        function onMonthPickerChange(evt) {
            return updateCurrentViewAndGrid(calendar.originalYear.value, calendar.originalMonth.value);
        }

        function onMonthPickerClick(evt) {
            Events.preventDefaultBehavior(evt);
            Events.stopPropagation(evt);
        }
    }

    function updateCurrentViewAndGrid(year, month) {
        var candidateDate = new Date(year, month - 1, currentView.getDate());
        if (Dates.isSameDay(candidateDate, currentView)) {
            return;
        }
        var firstYear = calendar.originalYear.options[0].value;
        var lastYear = calendar.originalYear.options[calendar.originalYear.options.length - 1].value;
        var candidateYear = candidateDate.getFullYear();
        if (candidateYear >= firstYear && candidateYear <= lastYear) {
            currentView = candidateDate;
            updateGrid();
        }
    }

    // --- Grid ---

    function createGrid() {
        var container = document.createElement("div");
        Dom.addCssClass(container, Calendar.css.GRID);
        return container;
    }

    function updateGrid() {
        // Selectors.
        if (!currentView) {
            currentView = Dates.clone(getDate());
        }
        calendar.originalYear.value = currentView.getFullYear();
        calendar.originalMonth.value = currentView.getMonth() + 1;

        // Grid building.
        var table = document.createElement("table");
        table.appendChild(createGridHeader());
        table.appendChild(createGridBody());
        Dom.removeAllNodes(grid);
        grid.appendChild(table);
    }

    function createGridHeader() {
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");
        var days = i18n.days["short"];
        for (var ii = 0; ii < days.length; ii++) {
            var th = document.createElement("th");
            var label = document.createTextNode(days[ii]);
            Dom.addCssClass(th, Calendar.css.DAY_HEADER);
            th.appendChild(label);
            tr.appendChild(th);
        }
        thead.appendChild(tr);
        return thead;
    }

    function createGridBody() {
        var tbody = document.createElement("tbody");
        var currentRow = document.createElement("tr");
        var currentCellIndex = 0;
        var firstOfMonth = Dates.getFirstOfMonth(currentView);
        var firstDayOfCurrentMonth = firstOfMonth.getDay();
        var referenceDate = getDate();

        // Previous month.
        var firstOfPreviousMonth = Dates.getFirstOfMonth(Dates.offsetDays(firstOfMonth, -1));
        var numDaysPreviousMonth = Dates.getNumDays(firstOfPreviousMonth);
        if (firstDayOfCurrentMonth != 0) {
            for (var ii = numDaysPreviousMonth - firstDayOfCurrentMonth; ii < numDaysPreviousMonth; ii++) {
                var cell = createDaySelector(Dates.offsetDays(firstOfPreviousMonth, ii), referenceDate);
                currentRow.appendChild(cell);
                currentCellIndex++;
            }
        }

        // Current month.
        var numDaysCurrentMonth = Dates.getNumDays(firstOfMonth);
        var currentDay = 0;
        while (currentDay < numDaysCurrentMonth) {
            if (currentCellIndex % 7 == 0) {
                tbody.appendChild(currentRow);
                currentRow = document.createElement("tr");
            }
            var targetDate = Dates.offsetDays(firstOfMonth, currentDay);
            var cell = createDaySelector(Dates.offsetDays(firstOfMonth, currentDay), referenceDate);
            currentRow.appendChild(cell);
            currentCellIndex++;
            currentDay++;
        }

        // Next month.
        var firstOfNextMonth = Dates.getFirstOfMonth(Dates.offsetMonths(firstOfMonth, +1));
        var dayIndex = 0;
        while (currentCellIndex % 7 != 0) {
            var cell = createDaySelector(Dates.offsetDays(firstOfNextMonth, dayIndex), referenceDate);
            currentRow.appendChild(cell);
            currentCellIndex++;
            dayIndex++;
        }

        tbody.appendChild(currentRow);
        return tbody;
    }

    function createDaySelector(date, referenceDate) {
        var td = document.createElement("td");
        if (Dates.isSameDay(date, referenceDate)) {
            Dom.addCssClass(td, Calendar.css.DAY_SELECTED);
        }
        if (Dates.isSameDay(date, new Date())) {
            Dom.addCssClass(td, Calendar.css.DAY_TODAY);
        }
        if (Dates.isSameMonth(date, currentView)) {
            Dom.addCssClass(td, Calendar.css.DAY_CURRENT);
        }
        if (Dates.isBeforeDay(date, new Date())) {
            Dom.addCssClass(td, Calendar.css.DAY_PAST);
        } else {
            Dom.addCssClass(td, Calendar.css.DAY_FUTURE);
        }

        var button = document.createElement("input");
        button.type = "button";
        button.value = date.getDate();
        button.date = date;
        Events.addListener(button, "onclick", selectDate);

        td.appendChild(button);
        return td;
    }

    function selectDate(evt) {
        Events.preventDefaultBehavior(evt);
        Events.stopPropagation(evt);
        setDate(this.date, true);
        popin.hide();
    }

    // --- Date utilities -----------------------------------------------------

    function dateInRange(date) {
        var firstYear;
        var lastYear;
        var yearSelect = calendar.originalYear.options;
        for (var ii = 0; ii < yearSelect.length; ii++) {
            var year = +yearSelect[ii].value;
            if (!firstYear || year < firstYear) {
                firstYear = year;
            }
            if (!lastYear || year > lastYear) {
                lastYear = year;
            }
        }
        return date.getFullYear() <= lastYear && date.getFullYear() >= firstYear;
    }

    function setDate(date, formatCalendarValue) {
        if (formatCalendarValue) {
            calendar.value = formatDate(date, calendar.datePattern);
        }
        calendar.year.value = date.getFullYear();
        calendar.month.value = date.getMonth() + 1;
        calendar.day.value = date.getDate();
        calendar.originalYear.value = date.getFullYear();
        calendar.originalMonth.value = date.getMonth() + 1;
        Events.dispatch(calendar, "onchange");
    }

    function getDate() {
        var year = calendar.year.value;
        var month = calendar.month.value;
        var day = calendar.day.value;
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    function formatDate(date) {
        if (datePattern) {
            return Dates.format(date, datePattern, i18n);
        }
        return date;
    }

};