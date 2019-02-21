interface Destination {
    for: string,
    lower: number,
    max: number
}

interface DestinationByCar extends Destination {
    location: string
}

interface TrainStation {
    name: string,
    durationInSeconds: number,
    isDirect: boolean,
    location: string,
}

interface DestinationByTrain extends Destination {
    trainStations: TrainStation[]
}

interface Config {
    key: string,
    workOnlyOnLines?: number,
    startAtLine?: number,
    destinations: (DestinationByCar | DestinationByTrain)[], // For the moment assume there are two elements
}

interface City {
    n: string,
    cp: string,
    o: string,
    o_d: string,
    c: string,
    lat: string,
    lng: string,
    via: string,
}

interface Journey {
    from: string,
    via: string,
    drivingDuration: number,
    trainDuration: number,
    isDirect: boolean,
    isOk: boolean,
}

let isATrainDestination = (o: DestinationByCar | DestinationByTrain) => ("trainStations" in o);

// TODO move these methods to a dedicated file
function getColorFromOrder(i: number, max: number) {

    // i == max => 1
    // i == 0 => 0

    return getColor(i / max);
}

// Stolen from http://jsfiddle.net/jongobar/sNKWK/
function getColor(value: number) {
    // value from 0 to 1, 0 is green and 1 is red
    const hue = ((1 - value) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
}

function getColorFromDuration(durationString: string, min: number, max: number) {
    let dur = Math.max(Math.min(parseDuration(durationString), max), min);

    // dur == min => 0
    // dur == max => 1

    return getColor((dur - min) / (max - min));
}

// Taken from https://css-tricks.com/snippets/javascript/lighten-darken-color/
function LightenDarkenColor(col: string, amt: number) {

    let usePound = false;

    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }

    const num = parseInt(col, 16);

    let r = (num >> 16) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    let b = ((num >> 8) & 0x00FF) + amt;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    let g = (num & 0x0000FF) + amt;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

function parseDuration(durationString: string) {
    let arr = durationString.split(":");
    return Number(arr[0]) * 60 + Number(arr[1]);
}

function getDuration(city: City, i: number) {
    // TODO use index
    return (i === 0 ? city.o : city.c);
}

function getDurationVia(city: City, i: number) {
    // TODO use index
    return city.o_d;
}

function getUrl(city: City, dest: DestinationByCar | DestinationByTrain) {
    return "https://www.google.com/maps/dir/"
        + getCityLocation(city)
        + "/" + encodeURIComponent(isATrainDestination(dest) ? city.via : (<DestinationByCar>dest).location)
        + getUrlTimeData(new Date('02/11/2019 08:45')); // Arbitrarily choose a monday at 8:45 time of arrival
    // TODO make it a config value
}

function getUrlTimeData(arrivalDate: Date) {
    // @see https://mstickles.wordpress.com/2015/06/23/gmaps-urls-diropt3/
    // !6e1 = Arrive by
    // !7e2 = Calculate from 1/1/70 0:00 Local Time
    // !8j# specifies the time and day of travel as the number of seconds elapsed since midnight on the morning of January 1, 1970.
    // Example: https://www.google.com/maps/dir/Embassy+Suites-Crystal+City/Smithsonian+Natural+History+Museum/data=!4m6!4m5!2m3!6e1!7e2!8j1439200200!3e3
    return `/data=!4m6!4m5!2m3!6e1!7e1!8j${arrivalDate.getTime() / 1000}!4e0`;
}

function getFullUrl(city: City, destA: DestinationByCar | DestinationByTrain, destB: DestinationByCar | DestinationByTrain) {
    return "https://www.google.com/maps/dir/"
        + encodeURIComponent(isATrainDestination(destA) ? city.via : (<DestinationByCar>destA).location)
        + "/" + getCityLocation(city)
        + "/" + encodeURIComponent(isATrainDestination(destB) ? city.via : (<DestinationByCar>destB).location);
    // + "/@45.4719624,5.0736569,11z/"; // TODO update center of map
}

function getCityLocation(city: City) {
    return Number(city.lat.replace(',', '.')) + "," + Number(city.lng.replace(',', '.'));
}