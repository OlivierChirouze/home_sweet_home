interface Destination {
    for: string,
    lower: number,
    middle: number,
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
    destinations: (DestinationByCar|DestinationByTrain)[], // For the moment assume there are two elements
}

let isATrainDestination = (o: DestinationByCar|DestinationByTrain) => ("trainStations" in o)

interface Journey {
    from: string,
    via: string,
    drivingDuration: number,
    trainDuration: number,
    isDirect: boolean,
    isOk: boolean,
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

function getColorFromOrder(i: number) {
    // TODO could be configurable
    let color;
    if (i <= 20) {
        color = "#40ff00";
    } else if (i <= 40) {
        color = "#54fcff";
    } else if (i <= 60) {
        color = "#ffd176";
    } else {
        color = "#ff0000";
    }

    return color
}

// Taken from https://css-tricks.com/snippets/javascript/lighten-darken-color/
function LightenDarkenColor(col: string, amt: number) {

    var usePound = false;

    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }

    var num = parseInt(col, 16);

    var r = (num >> 16) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    var b = ((num >> 8) & 0x00FF) + amt;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    var g = (num & 0x0000FF) + amt;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);

}

function getColorFromDuration(durationString: string, a: number, b: number, c: number) {
    let dur = getDuration(durationString);
    let color;
    if (dur <= a) {
        color = "#40ff00";
    } else if (dur <= b) {
        color = "#54fcff";
    } else if (dur <= c) {
        color = "#ffd176";
    } else {
        color = "#ff0000";
    }

    return color;
}

function getCityLocation(city: City) {
    return Number(city.lat.replace(',', '.')) + "," + Number(city.lng.replace(',', '.'));
}