/// <reference path="../model.ts" />
/// <reference path="../config.ts" />

// To test this with node JS:
// node -e 'require("./spreadsheet/home_sweet_home").run();'
// Expects a config.js file in this directory: see config.example.js

import * as http from "http";
import Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet
import Sheet = GoogleAppsScript.Spreadsheet.Sheet

// Handle Node.js context -----------------------------
let isGoogleApp = function () {
    try {
        return (null !== UrlFetchApp);
    } catch (e) {
        return false;
    }
}();

if (!isGoogleApp) {
    module.exports.run = function () {
        runTest();
    };
    var Logger = console;
}

// ----------------------------------------------------


function isLineNumberOk(row: number): boolean {
    return config.workOnlyOnLines === undefined || row < config.workOnlyOnLines;
}

// ---------------------------------------------------------- DATA MODEL


/**
 * Get station by name
 * TODO use object
 * @param knownTrainStations
 * @param name
 */
function getKnownStation(knownTrainStations: TrainStation[], name: string): TrainStation | undefined {
    for (let station of knownTrainStations) {
        if (station.name.toLowerCase() === name.toLowerCase()) {
            return station;
        }
    }

    return undefined;
}

function runTest() {
    const from = encodeURIComponent("45.537293,5.5858869");

    for (let destination of config.destinations) {
        if (isATrainDestination(destination)) {
            // Find shortest complete journey (driving + train)
            findJourneysToStations(
                from,
                (<DestinationByTrain>destination).trainStations,
                (journeys => {
                        for (let journey of journeys) {
                            info(`${journey.trainDuration + journey.drivingDuration} ${JSON.stringify(journey)}`);
                        }
                    }
                ));
        } else {
            // Find duration driving to this location
            let to = encodeURIComponent((<DestinationByCar>destination).location);
            getDurations(from, [to], (duration) => {
                    info(`${duration[0]}`);
                },
                (errorResponse) => {
                    error("not found");
                },
            );
        }
    }
}

// TODO use inheritance
function debug(log: any) {
    Logger.log(`DEBUG ${JSON.stringify(log)}`);
    //console.log(`DEBUG ${log}`)
}

function info(log: any) {
    Logger.log(`INFO  ${JSON.stringify(log)}`);
}

function error(log: any) {
    Logger.log(`ERROR ${JSON.stringify(log)}`);
}

/**
 * HTTP get
 * TODO use inheritance
 * TODO use Promise
 * @param url
 * @param callback
 */
function get(url: string, callback: (response: object) => any): void {
    if (isGoogleApp) {
        googleAppGet(url, callback);
    } else {
        nodeGet(url, callback);
    }
}

/**
 * HTTP get, Google App version
 * TODO use inheritance
 * TODO use Promise
 * @param url
 * @param callback
 */
function googleAppGet(url: string, callback: (response: object) => any): void {
    let response = UrlFetchApp.fetch(url);
    callback(JSON.parse(response.getContentText()));
}

/**
 * HTTP get, node version
 * TODO use inheritance
 * TODO use Promise
 * @param url
 * @param callback
 */
function nodeGet(url: string, callback: (response: any) => any): void {
    const https = require('https');

    https.get(url, (resp: http.IncomingMessage) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received
        resp.on('end', () => {
            callback(JSON.parse(data));
        });

    }).on("error", (err: Error) => {
        error("Error: " + err.message);
    });
}

/**
 * Query google map to calculate duration from origin to multiple destinations
 * @see https://developers.google.com/maps/documentation/distance-matrix/get-api-key
 * @param origin
 * @param destinations
 * @param callback
 * @param errorCallback
 * @param mode
 */
function getDurations(origin: string, destinations: string[], callback: (durations: number[]) => any, errorCallback: (response: any) => void, mode = "driving"): void {
    const key = config.key;
    const destinationsParam = encodeURIComponent(destinations.join('|'));
    const getDistanceUrl =
        `https://maps.googleapis.com/maps/api/distancematrix/json?units=metrics&origins=${origin}&destinations=${destinationsParam}&key=${key}&mode=${mode}&language=fr`;

    // debug(getDistanceUrl)

    get(getDistanceUrl, (response: any) => {

        debug(JSON.stringify(response));

        if (response.status === "OK") {
            callback(response.rows[0].elements.map((element: any) => {
                return (element.status === "OK") ? element.duration.value : -1;
            }));
        } else {
            error(`${origin} : destinations not found!`);
            errorCallback(response);
        }
    });
}

/**
 * Get location from string address
 * TODO handle location not found
 * TODO use Promise
 * @param address
 * @param then
 * @param onError
 */
function getLocation(address: string,
                     then: (location: { lat: string, lng: string }) => void,
                     onError: () => void = () =>{}) {
    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${config.key}`;
    get(url, (response: any) => {
            if (response["status"] === "ZERO_RESULTS") {
                error(`Couldn't find location for ${address}: ${url}`);
                onError()
            } else {
                then(response["results"][0]["geometry"]["location"])
            }
        }
    );
}

/**
 * Build a clickable Google Maps URL showing directions from A to B
 * @see https://developers.google.com/maps/documentation/urls/guide#directions-action
 * @param from
 * @param to
 * @param mode
 */
function clickableUrl(from: string, to: string, mode = "driving") {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${to}&travelmode=${mode}`;
}

/**
 * Find journeys from initial position to a list of intermediate positions and sort them.
 * TODO use Promise
 * @param from
 * @param trainStations
 * @param callback
 */
function findJourneysToStations(from: string, trainStations: TrainStation[], callback: (journeys: Journey[]) => any): void {

    let journeys: Journey[] = [];

    getDurations(from, trainStations.map((station) => `${station.location}`),
        (durations) => {

            journeys = trainStations.map((station, index) => {
                return {
                    from: from,
                    via: station.name,
                    drivingDuration: durations[index],
                    trainDuration: station.durationInSeconds,
                    isDirect: station.isDirect,
                    isOk: durations[index] !== -1,
                };
            });

            // Sort journeys by minimum total duration
            journeys.sort((j1: Journey, j2: Journey) => {

                // Ex:
                // a == {"from":"Châbons","via":"Rives","drivingDuration":832,"trainDuration":2280,"isDirect":true,"isOk":true}
                // b == {"from":"Châbons","via":"Chabons","drivingDuration":118,"trainDuration":3060,"isDirect":true,"isOk":true}
                // totalDiff == 3112 - 3178 == -66
                // drivingDiff == 832 - 118 == 714
                // ratio == -66 / 714 == -0.09243697478991597

                let totalDiff = (j1.trainDuration + j1.drivingDuration) - (j2.trainDuration + j2.drivingDuration);
                let drivingDiff = j1.drivingDuration - j2.drivingDuration;
                let ratio = totalDiff / drivingDiff;

                debug(`a = ${j1.via}`);
                debug(`b = ${j2.via}`);
                debug(`totalDiff = ${totalDiff} drivingDiff = ${drivingDiff} ratio = ${ratio}`);

                // The ratio of global diff, compared to driving diff is less then 50%
                // => consider the other journey is better
                if (ratio < 0 && ratio > -0.7) {
                    return -totalDiff;
                }

                return totalDiff;
            });

            callback(journeys);
        },
        (errorResponse) => {
            error("Cannot find durations!");
        });
}

// ============================================================================================= GOOGLE SPREADSHEET PART

const headerHeight = 1;

const startRow = (config.startAtLine != null)
    ? config.startAtLine
    : headerHeight + 1;

function getDoc(): Spreadsheet | null {
    return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Get tab by name
 * @param tabName
 */
function getTab(tabName: string): Sheet | undefined {
    const doc = getDoc();
    if (!doc) {
        return undefined;
    }

    const sheets = doc.getSheets();

    for (let iSheet in sheets) {
        if (tabName === sheets[iSheet].getName()) {
            return sheets[iSheet];
        }
    }

    return undefined;
}

let col = 0;
const columns = {
    name: ++col,
    insee: ++col,
    postal: ++col,
    ignore1: ++col,
    ignore2: ++col,
    ignore3: ++col,
    ignore4: ++col,
    ignore5: ++col,
    link: ++col,
    driving_to_trainA: ++col,
    via: ++col,
    direct: ++col,
    train_to_destA: ++col,
    total_destA: ++col,
    total_destB: ++col,
    diff: ++col,
    a_plus_b: ++col, // Total time A + B
    lat: ++col,
    lng: ++col,
    journeysJson: ++col,
    mapJson: ++col,
    notes: ++col,
    driving_to_trainA_link: ++col,
    total_destB_link: ++col,
};

function step1_getListOfCities() {
    // TODO this is a manual step:
    // visit Wikipedia. Example https://fr.wikipedia.org/wiki/Liste_des_communes_du_Rh%C3%B4ne
    // Copy the table. Plugins exist to help: https://chrome.google.com/webstore/detail/table-capture/iebpjdmgckacbodjpijphcplhebcmeop
    // Make sure "code postal" is the third column
    // Paste it in spreadsheet at first column

}

/**
 * Update table for each existing city in the table, store GPS location
 * TODO extract spreadsheet part
 */
function step2_updateFromGPSLocations() {
    const tab = getTab("communes");
    if (!tab) {
        info("tab not found!");
        return;
    }

    // TODO clean up: delete all lines content for column J to Y

    let row = startRow;

    while (isLineNumberOk(row)) {
        let name = tab.getRange(row, columns.name).getValue().toString();
        let postal = tab.getRange(row, columns.postal).getValue().toString();

        if (tab.getRange(row, columns.lat).getValue().toString() !== "") {

            debug(`already has a lat (${columns.lat}): ${tab.getRange(row, columns.lat).getValue()}`);
            row++;
            // Has a value
            continue;
        }

        if ("" === name) {
            // Done!
            break;
        }

        // TODO fix hardcoded destination by train
        // Check if the city itself is known as a train station, in this case use the known station information
        let knownStation = getKnownStation((<DestinationByTrain>config.destinations[0]).trainStations, name);
        if (knownStation) {
            // This is a known station, take coordinates from the station
            info(`found station: ${name}`);
            let location = knownStation.location.split(",");
            tab.getRange(row, columns.lat).setValue(location[0].replace(".", ","));
            tab.getRange(row, columns.lng).setValue(location[1].replace(".", ","));
        } else {
            getLocation(encodeURIComponent(`${postal} ${name}`),
                location => {
                    tab.getRange(row, columns.lat).setValue(location.lat);
                    tab.getRange(row, columns.lng).setValue(location.lng);
                }
            );
        }

        row++;
    }
}

/**
 * Update table for each known GPS locations, store duration
 * TODO extract spreadsheet part
 */
function step3_updateToFromDurations() {
    const tab = getTab("communes");
    if (!tab) {
        info("tab not found!");
        return;
    }

    let row = startRow;

    while (isLineNumberOk(row)) {
        let name = tab.getRange(row, columns.name).getValue();

        if ("" === name) {
            // Done!
            break;
        }

        if ("" !== tab.getRange(row, columns.journeysJson).getValue().toString()) {
            row++;
            continue;
        }

        let lat = tab.getRange(row, columns.lat).getValue().toString().replace(",", ".");
        let lng = tab.getRange(row, columns.lng).getValue().toString().replace(",", ".");

        let from = encodeURIComponent(`${lat},${lng}`);

        let getA1Notation = (column: number) => {
            return tab.getRange(row, column).getA1Notation();
        };

        // TODO hide columns when not using train?

        let destination1 = config.destinations[0];
        if (isATrainDestination(destination1)) {
            findJourneysToStations(from,
                (<DestinationByTrain>destination1).trainStations,
                (journeys: Journey[]) => {

                    let bestJourney = journeys[0];

                    if (!bestJourney) {
                        bestJourney = {
                            from: from,
                            via: '=NA()',
                            drivingDuration: 0,
                            trainDuration: 0,
                            isDirect: false,
                            isOk: false,
                        };
                    }

                    tab.getRange(row, columns.journeysJson).setValue(JSON.stringify(journeys));
                    tab.getRange(row, columns.driving_to_trainA).setValue(`=${bestJourney.drivingDuration}/24/3600`);
                    tab.getRange(row, columns.train_to_destA).setValue(`=${bestJourney.trainDuration}/24/3600`);
                    tab.getRange(row, columns.via).setValue(bestJourney.via);
                    tab.getRange(row, columns.direct).setValue(bestJourney.isDirect ? '=true' : '=false');
                    // TODO handle errors
                });
        } else {
            getDurations(from, [(<DestinationByCar>destination1).location], (duration) => {
                    // TODO?
                    //tab.getRange(row, columns.journeysJson).setValue(JSON.stringify(journeys));
                    tab.getRange(row, columns.driving_to_trainA).setValue(`=${duration[0]}/24/3600`);
                    tab.getRange(row, columns.train_to_destA).setValue(`=0`);
                    tab.getRange(row, columns.via).setValue('');
                    tab.getRange(row, columns.direct).setValue('=true');
                },
                (errorResponse) => {
                   // tab.getRange(row, columns.total_destB).setValue(`=NA()`);
                });
        }

        // Find duration driving to this location

        let destination2 = config.destinations[1];
        if (!isATrainDestination(destination1)) {
            // TODO here handle case where "to" can be either a location or multiple train locations
            getDurations(from, [(<DestinationByCar>destination2).location], (duration) => {
                    tab.getRange(row, columns.total_destB).setValue(`=${duration[0]}/24/3600`);
                    // TODO add column link


                },
                (errorResponse) => {
                    tab.getRange(row, columns.total_destB).setValue(`=NA()`);
                });
        }


        // Now for the calculated columns
        tab.getRange(row, columns.total_destA).setValue('=('
            + getA1Notation(columns.driving_to_trainA) + '+'
            + getA1Notation(columns.train_to_destA)
            + ')');
        tab.getRange(row, columns.diff).setValue('=ABS('
            + getA1Notation(columns.total_destA) + '-'
            + getA1Notation(columns.total_destB)
            + ')');
        tab.getRange(row, columns.a_plus_b).setValue('=('
            + getA1Notation(columns.total_destA) + '+'
            + getA1Notation(columns.total_destB)
            + ')',
        );
        // TODO build this JSON properly
        tab.getRange(row, columns.mapJson).setValue('="{""n"":"""&'
            + getA1Notation(columns.name)
            + '&""", ""cp"":"""&'
            + getA1Notation(columns.postal)
            + '&""", ""o"":"""&text('
            + getA1Notation(columns.total_destA)
            + ';"hh:mm")&""", ""o_d"":"""&text('
            + getA1Notation(columns.driving_to_trainA)
            + ';"hh:mm")&""", ""c"":"""&text('
            + getA1Notation(columns.total_destB)
            + ';"hh:mm")&""", ""lat"":"""&'
            + getA1Notation(columns.lat)
            + '&""", ""lng"":"""&'
            + getA1Notation(columns.lng)
            + '&""", ""via"":"""&'
            + getA1Notation(columns.via)
            + '&"""},"');
        // TODO use clickableUrl
        tab.getRange(row, columns.driving_to_trainA_link).setValue('=hyperlink("https://www.google.com/maps/dir/"&SUBSTITUTE('
            + getA1Notation(columns.lat)
            + ';",";".")&","&SUBSTITUTE('
            + getA1Notation(columns.lng)
            + ';",";".")&"/"&'
            + getA1Notation(columns.via)
            + ';'
            + getA1Notation(columns.driving_to_trainA)
            + ')');
        tab.getRange(row, columns.total_destB_link).setValue('=hyperlink("https://www.google.com/maps/dir/"&SUBSTITUTE('
            + getA1Notation(columns.lat)
            + ';",";".")&","&SUBSTITUTE('
            + getA1Notation(columns.lng)
            + ';",";".")&"/"&"'
            + (<DestinationByCar>config.destinations[1]).location
            + '";'
            + getA1Notation(columns.total_destB)
            + ')');

        row++;
    }
}

// ------------------------------------------------------------- Nannies
// TODO extract to a dedicated file

col = 0;
const nannyColumns = {
    name: ++col,
    state: ++col,
    phone: ++col,
    address: ++col,
    postal: ++col,
    link: ++col,
    agreement: ++col,
    capacity: ++col,
    walking: ++col,
    driving: ++col,
    lat: ++col,
    lng: ++col,
    json: ++col,
};

// TODO move to a different file!!
function updateNannies() {
    const tab = getTab("nounous Champier");
    if (!tab) {
        info("tab not found!");
        return;
    }

    const headerRow = 1;
    let row = headerRow + 1;

    let addresses: string[] = [];

    // Build list of addresses
    while (true) {
        let name = tab.getRange(row, nannyColumns.name).getValue();

        if ("" === name) {
            // Done!
            break;
        }

        addresses[row] = tab.getRange(row, nannyColumns.address).getValue()
            + " " + tab.getRange(row, nannyColumns.postal).getValue();

        // Use the opportunity to update location
        getLocation(encodeURIComponent(addresses[row]),
            location => {
                tab.getRange(row, nannyColumns.lat).setValue(location.lat);
                tab.getRange(row, nannyColumns.lng).setValue(location.lng);
            },
        );

        row++;
    }

    const homeAddress = "1061 Route des Alpes 38260 Champier";

    // Update walking durations
    getDurations(homeAddress, addresses, durations => {
            for (let i in durations) {
                const row = headerRow + 1 + Number(i);
                tab.getRange(row, nannyColumns.walking).setValue(`=hyperlink("${clickableUrl(
                    homeAddress,
                    `"&${tab.getRange(row, nannyColumns.address).getA1Notation()}&" "&${tab.getRange(row, nannyColumns.postal).getA1Notation()}&"`,
                    "walking",
                )}";${durations[i]}/24/3600)`);
            }
        },
        response => error(response),
        "walking",
    );

    // Update driving durations
    getDurations(homeAddress, addresses, durations => {
            for (let i in durations) {
                const row = headerRow + 1 + Number(i);
                tab.getRange(row, nannyColumns.driving).setValue(`=hyperlink("${clickableUrl(
                    homeAddress,
                    `"&${tab.getRange(row, nannyColumns.address).getA1Notation()}&" "&${tab.getRange(row, nannyColumns.postal).getA1Notation()}&"`,
                    "driving",
                )}";${durations[i]}/24/3600)`);
            }
        },
        response => error(response),
        "driving",
    );
}