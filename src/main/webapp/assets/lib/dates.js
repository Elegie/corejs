var Dates = {};

Dates.patterns = (function() {

    function DatePattern(pattern, inject, update, toNumericPattern, offset) {
        this.pattern = pattern;
        this.inject = inject;
        this.update = update;
        this.toNumericPattern = toNumericPattern;
        this.offset = offset;
    }

    function createToNumericFunction(allowLessDigits) {
        return function() {
            var result = "(";
            if (allowLessDigits) {
                result += "\\d{1," + this.pattern.length + "}"
            } else {
                result += "\\d{" + this.pattern.length + "}"
            }
            result += ")";
            return result;
        }
    }

    function offsetMonths(date, operand) {
        var result = Dates.offsetMonths(date, operand);
        var check = Dates.offsetMonths(result, -operand);
        if (!Dates.isSameDay(date, check)) {
            // 31/12 => 30/11 rather than 01/12.
            // 31/03 => 30/04 rather than 01/05.
            var resultMonth = result.getMonth();
            do {
                result = Dates.offsetDays(result, -1);
            } while (resultMonth == result.getMonth());
        }
        if (Dates.isLastDayOfMonth(date)) {
            // Maintain the last day of the month.
            while (!Dates.isLastDayOfMonth(result)) {
                result = Dates.offsetDays(result, 1);
            }
        }
        return result;
    }

    // ---

    var patterns = [];
    patterns.push(
        new DatePattern(
            "MMM",
            function(date, i18n) { return i18n.months["short"][date.getMonth()]; }
        )
    );
    patterns.push(
        new DatePattern(
            "MM",
            function(date, i18n) { return Strings.padLeft(date.getMonth() + 1, "0", 2); },
            function(date, value) {
                var month = +value - 1;
                date.setMonth(month);
                return Dates.checkAdjustment(date, null, month, null);
            },
            createToNumericFunction(true),
            offsetMonths
        )
    );
    patterns.push(
        new DatePattern(
            "yyyy",
            function(date, i18n) { return date.getFullYear(); },
            function(date, value) {
                var year = +value;
                date.setFullYear(year);
                return Dates.checkAdjustment(date, year, null, null);
            },
            createToNumericFunction(false),
            function(date, operand) {
                return offsetMonths(date, operand * 12);
            }
        )
    );
    patterns.push(
        new DatePattern(
            "yy",
            function(date, i18n) { return date.getYear(); }
        )
    );
    patterns.push(
        new DatePattern(
            "ddd",
            function(date, i18n) { return i18n.days["short"][date.getDay()]; }
        )
    );
    patterns.push(
        new DatePattern(
            "dd",
            function(date, i18n) { return Strings.padLeft(date.getDate(), "0", 2); },
            function(date, value) {
                var day = +value;
                date.setDate(day);
                return Dates.checkAdjustment(date, null, null, day);
            },
            createToNumericFunction(true),
            function(date, operand) {
                return Dates.offsetDays(date, operand);
            }
        )
    );
    return patterns;
})();

Dates.checkAdjustment = function(date, fullYear, month, day) {
    var adjusted = false;
    if (fullYear && fullYear != date.getFullYear()) {
        adjusted = true;
    }
    if (month && month != date.getMonth()) {
        adjusted = true;
    }
    if (day && day != date.getDate()) {
        adjusted = true;
    }    
    return adjusted;
}

Dates.format = (function() {
    return function(date, pattern, i18n) {
        var substitutions = Dates.patterns;
        var result = pattern;
        for (var ii = 0; ii < substitutions.length; ii++) {
            result = result.replace(new RegExp("\\b" + substitutions[ii].pattern + "\\b", "g"), function() {
                return substitutions[ii].inject(date);
            });
        }
        return result;
    };

})();

Dates.toISODate = function(date) {
    var year = date.getFullYear();
    var month =  Strings.padLeft(date.getMonth() + 1, "0", 2);
    var day = Strings.padLeft(date.getDate(), "0", 2);
    return year + "-" + month + "-" + day;
};

Dates.toISODateTime = function(date) {
    var hours = Strings.padLeft(date.getHours(), "0", 2);
    var minutes = Strings.padLeft(date.getMinutes(), "0", 2);
    var seconds = Strings.padLeft(date.getSeconds(), "0", 2);
    return Dates.toISODate(date) + " " + hours + ":" + minutes + ":" + seconds;
};

Dates.clone = function(date) {
    return new Date(date.getTime());
};

Dates.isSameYear = function(date1, date2) {
    return date1.getFullYear() == date2.getFullYear();
};

Dates.isSameMonth = function(date1, date2) {
    return Dates.isSameYear(date1, date2) && date1.getMonth() == date2.getMonth();
};

Dates.isSameDay = function(date1, date2) {
    return Dates.isSameMonth(date1, date2) && date1.getDate() == date2.getDate();
};

Dates.isLastDayOfMonth = function(date) {
    return Dates.offsetDays(date, 1).getMonth() != date.getMonth();
};

Dates.isBeforeDay = function(date1, date2) {
    return date1.getTime() < date2.getTime() && !Dates.isSameDay(date1, date2);
};

Dates.isToday = function(date) {
    return Dates.isSameDay(date, new Date());
};

Dates.getFirstOfMonth = function(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

Dates.getNumDays = function(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

Dates.offsetMonths = function(date, offset) {
    return new Date(date.getFullYear(), date.getMonth() + offset, date.getDate());
};

Dates.offsetDays = function(date, offset) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
};
