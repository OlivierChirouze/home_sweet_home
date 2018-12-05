// https://developers.google.com/apps-script/guides/sheets
var CalendarImport = function () {
    return this;
};

// Shouldn't be more than 1 event per day!
CalendarImport.maxMonthEvents = 300;

CalendarImport.prototype = {
    getMonthEvents: function (currentDate) {
        var calendarId = 'ie7d48frttnbcj8678ln7lv860@group.calendar.google.com';

        // First day of month
        var monthBegin = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        // Last day of month, end of day
        var monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

        var optionalArgs = {
            timeMin: monthBegin.toISOString(),
            timeMax: monthEnd.toISOString(),
            showDeleted: false,
            singleEvents: true,
            maxResults: CalendarImport.maxMonthEvents,
            orderBy: 'startTime'
        };

        return Calendar.Events.list(calendarId, optionalArgs).items;
    },

    getTab: function (tabName) {
        var sheets = this.getDoc().getSheets();

        for (var iSheet in sheets) {
            if (tabName === sheets[iSheet].getName()) {
                return sheets[iSheet];
            }
        }

        return undefined;
    },

    getDoc: function () {
        return SpreadsheetApp.getActiveSpreadsheet();
    },

    getOrCreateTab: function (tabName) {
        var existingTab = getTab(tabName);
        if (existingTab != undefined) {
            return existingTab;
        }

        var sheet = getDoc().insertSheet();
        sheet.setName(tabName);

        return sheet;
    },

    copyTab: function (fromName, toName) {
        var from = this.getTab(fromName);
        var to = from.copyTo(this.getDoc());
        to.setName(toName);
        return to;
    },

    dump: function (sheet, events) {
        var row = 0;

        const gridStartRow = 32; // TODO Make it parameter
        const gridStartCol = 2; // TODO Make it parameter

        const durationFormat = "[h]:mm";
        const costFormat = "0.00 €";

        var iCol = gridStartCol;

        // Header
        const header = {
            day: {
                COL: iCol++,
                NAME: 'Jour',
                FORMAT: "dddd d"
            },
            start: {
                COL: iCol++,
                NAME: 'Arrivée',
                FORMAT: "HH:mm"
            },
            end: {
                COL: iCol++,
                NAME: 'Départ',
                FORMAT: "HH:mm"
            },
            duration: {
                COL: iCol++,
                NAME: 'Durée',
                FORMAT: durationFormat
            },
            overtime: {
                COL: iCol++,
                NAME: 'Heures sup',
                FORMAT: durationFormat
            },
            maintenance: {
                COL: iCol++,
                NAME: 'Indemnité d\'entretien',
                FORMAT: costFormat
            },
            notes: {
                COL: iCol++,
                NAME: 'Notes',
                FORMAT: ""
            }
        };

        const columns = Object.keys(header);

        if (events.length > 0) {
            for (i = 0; i < events.length; i++) {
                row = i + gridStartRow;

                var sameRowCol = function(col) {
                    return sheet.getRange(row, col).getA1Notation();
                }

                var event = events[i];
                var startTime = event.start.dateTime;
                if (!startTime) {
                    startTime = event.start.date;
                }
                var endTime = event.end.dateTime;
                if (!endTime) {
                    endTime = event.end.date;
                }
                // Use date objects!
                var end = new Date(endTime);
                var start = new Date(startTime);

                var summary = (!event.summary || event.summary == 'Nouvel événement')
                    ? undefined
                    : event.summary;

                var values = {
                    day: start, // Will be formatted
                    start: start,
                    end: end,
                    duration: "="
                    + sameRowCol(header.end.COL) + "-"
                    + sameRowCol(header.start.COL)
                    ,
                    overtime:
                    '=if(value('+sameRowCol(header.duration.COL)
                    +'-vlookup(weekday('+sameRowCol(header.start.COL)+';2);$F$22:$G$26;2))>0;'
                    +sameRowCol(header.duration.COL)+'-vlookup(weekday('+sameRowCol(header.start.COL)+';2);$F$22:$G$26;2);"")',
                    maintenance: '=if(OR('+sameRowCol(header.notes.COL)+'="congé";'+sameRowCol(header.notes.COL)+'="absence");"";$G$29)',
                    notes: (!summary)
                        ? '=if('+sameRowCol(header.overtime.COL)+'<>"";"Dépassement : "&text('+sameRowCol(header.start.COL)+';"hh:mm")&" - "&text('+sameRowCol(header.end.COL)+';"hh:mm");"")'  // TODO
                        : summary
                };

                columns.forEach(function (key, index) {
                    sheet.getRange(row, header[key].COL).setValue(values[key]);
                });
            }

            // Now format all columns
            columns.forEach(function (key, index) {
                sheet.getRange(gridStartRow, header[key].COL, events.length).setNumberFormat(header[key].FORMAT);
            });
        } else {
            sheet.getRange(gridStartRow, 1).setValue('Aucun évènement');
            Logger.log('No event found for %s', monthBegin);
        }
    }
};

function test() {
    // Current month by default
    //var currentDate = new Date('2018-04-21T08:45:00+01:00');
    var currentDate = new Date();
    var monthName = currentDate.getFullYear() + "-" + ("0" + (currentDate.getMonth() + 1)).slice(-2);

    const calendarImport = new CalendarImport();

    // 1) copy template to current month
    var sheet = calendarImport.copyTab("template", monthName);

    var events = calendarImport.getMonthEvents(currentDate);

    calendarImport.dump(sheet, events);
}