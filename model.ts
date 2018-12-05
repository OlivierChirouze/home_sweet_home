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