interface Destination {
    for: string,
    percent: number
}

interface DestinationOutput {
    min: number,
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
    limit: number,
    destinations: (DestinationByCar | DestinationByTrain)[], // For the moment assume there are two elements in this list
}

interface City {
    n: string,
    cp: string,
    o: string, // TODO should be a list (use index)
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

// TODO find an appropriate name
class ScoredCity implements City {
    public score: number = 0;

    c: string;
    cp: string;
    lat: string;
    lng: string;
    n: string;
    o: string;
    o_d: string;
    via: string;

    constructor(city: City) {
        this.c = city.c;
        this.cp = city.cp;
        this.lat = city.lat;
        this.lng = city.lng;
        this.n = city.n;
        this.o = city.o;
        this.o_d = city.o_d;
        this.via = city.via;
    }

    public updateScore(config: Config) {
        this.score = getCityScore(this, config);
    }
}

function getCityScore(city: City, config: Config): number {
    // Basic rule is "minimize total duration"
    //return getTotalDuration(city);
    // Other approach: you know the "optimum" for each destination and try to get as close as possible to this optimum
    // return Math.abs(getDuration(city, 0) - getOptimumForDestination(config.destinations[0]))
    //    + Math.abs(getDuration(city, 1) - getOptimumForDestination(config.destinations[1]))
    // Other approach: weight duration per destination
    // return getDuration(city, 0) * config.destinations[0].percent
    //     + getDuration(city, 1) * config.destinations[1].percent;
    const duration0 = getDuration(city, 0);
    const duration1 = getDuration(city, 1);
    const totalDuration = duration0 + duration1;

    const ratio = duration0 / totalDuration;

    // What the difference between the actual ratio and the "ideal" ratio?
    // TODO should check that percent for destination1 is coherent (1 - destination0)
    const ratioDiff = Math.abs(config.destinations[0].percent / 100 - ratio);

    // Weight the total duration with the difference with ideal ratio
    return totalDuration * (1 + ratioDiff);
}

class HomeSweetHome {
    protected cities: ScoredCity[];

    constructor(cities: City[], public config: Config) {
        this.cities = [];
        // Calculate min and max for each destination
        cities.forEach((c) => {
            this.cities.push(new ScoredCity(c));
        });

        // Now sort the list
        this.sort();
    }

    public getDestinationOutputs(): DestinationOutput[] {

        let outputs: DestinationOutput[] = [];

        // Update min and max on the remaining cities
        this.getCities().forEach((c) => {
            this.config.destinations.forEach((d, i) => {
                let duration = getDuration(c, i);
                if (!outputs[i]) {
                    outputs[i] = {min: duration, max: duration};
                } else {
                    if (duration < outputs[i].min) {
                        outputs[i].min = duration;
                    }
                    if (duration > outputs[i].max) {
                        outputs[i].max = duration;
                    }
                }
            });
        });

        return outputs;
    }

    public getCities(): ScoredCity[] {
        return this.cities.slice(0, this.config.limit);
    }

    public sort() {
        // Calculate score for each city
        this.cities.forEach((c) => c.updateScore(config));
        // Sort by score
        this.cities.sort((a, b) => a.score - b.score);
    }
}


// TODO move these methods to a dedicated file
function getColorFromOrder(i: number, max: number) {

    // i == max => 1
    // i == 0 => 0

    // We allow position to be more than max but then consider is max
    let position = Math.min(i, max);
    return getColor(position / max);
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

function parseDuration(durationString: string) {
    let arr = durationString.split(":");
    return Number(arr[0]) * 60 + Number(arr[1]);
}

function getDurationString(city: City, i: number): string {
    // TODO use index
    return (i === 0 ? city.o : city.c);
}

// TODO move to class
function getDuration(city: City, i: number): number {
    return parseDuration(getDurationString(city, i));
}

function getDurationStringVia(city: City, i: number) {
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
        + "/" + encodeURIComponent(isATrainDestination(destB) ? city.via : (<DestinationByCar>destB).location)
        + getUrlTimeData(new Date('02/11/2019 08:45')); // Arbitrarily choose a monday at 8:45 time of arrival
    // TODO make it a config value
    // + "/@45.4719624,5.0736569,11z/"; // TODO update center of map
}

function getCityLocation(city: City) {
    return Number(city.lat.replace(',', '.')) + "," + Number(city.lng.replace(',', '.'));
}