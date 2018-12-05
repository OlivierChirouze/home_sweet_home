<?php

const FROM = "2 rue Turbil, 69003 Lyon";

/** @var array $config */
$config = json_decode(file_get_contents(__DIR__.'/../config.json'), true);

function readMyFile($fileName): Generator
{
    $file = fopen($fileName, 'r');

    while ($line = fgets($file)) {
        yield trim($line);
    }
    fclose($file);
}

function getDirections($to)
{
    global $config;
    $key = $config['key'];
    $from = urlencode(FROM);
    $to = urlencode($to);
    $url = "https://maps.googleapis.com/maps/api/distancematrix/json?units=metrics&origins={$from}&destinations=$to&key={$key}&mode=walking&language=fr";
    return json_decode(file_get_contents($url), true);
}

function getDirectionUrl($to)
{
    $from = urlencode(FROM);
    $to = urlencode($to);
    $url = "https://www.google.fr/maps/dir/$from/$to";
    return $url;
}

function map(Generator $generator)
{
    while ($generator->valid()) {
        $line = $generator->current();

        if (preg_match('@ass-mat@', $line, $matches)) {
            // This is a new assistant
            if (isset($info['name'])) {
                $to = $info['address'] . ' ' . $info['code'];
                $directions = getDirections($to);
                // $text = $directions['rows'][0]['elements'][0]['duration']['text'];
                $value = $directions['rows'][0]['elements'][0]['duration']['value'];
                $info['duration'] = $value;
                $info['map'] = getDirectionUrl($to);
                $info['details'] = implode(', ', $info['details'] ?? []);
                yield $info;
            }
            $info = [];
        } elseif (preg_match('@<label .*>(.*)</label>@', $line, $matches)) {
            $info['dispo'] = $matches[1];
        } elseif (preg_match('@<h4>@', $line)) {
            // Read next line for name
            $generator->next();
            $info['name'] = $generator->current();
        } elseif (preg_match('@<span itemprop="streetAddress">(.*)@', $line, $matches)) {
            $info['address'] = $matches[1];
        } elseif (preg_match('@<span itemprop="postalCode">(.*)</span>@', $line, $matches)) {
            $info['code'] = $matches[1];
        } elseif (preg_match('@<span itemprop="telephone"><a href=".*">(.*)</a></span>@', $line, $matches)) {
            $info['tel1'] = $matches[1];
        } elseif (preg_match('@<span itemprop="telephone">(.*)</span><br>@', $line, $matches)) {
            $info['tel2'] = $matches[1];
        } elseif (preg_match('@Email : <a .*>(.*)\(at\)(.*)</a></a>@', $line, $matches)) {
            $info['email'] = $matches[1] . '@' . $matches[2];
        } elseif (preg_match('@<li class="col-sm-4 col-xs-6">(.*)</li>@', $line, $matches)) {
            $info['details'][] = $matches[1];
        }

        $generator->next();
    }
}

$keys = [
    'dispo',
    'duration',
    'name',
    'address',
    'code',
    'details',
    'tel1',
    'tel2',
    'email',
    'map',
];

function printLine($info)
{
    global $keys;
    $toPrint = array_map(
        function ($key) use ($info) {
            return $info[$key] ?? '';
        },
        $keys
    );
    echo implode("\t", $toPrint) . PHP_EOL;
}

$generator = readMyFile(__DIR__ . '/../listealacon.html');

echo implode("\t", $keys) . PHP_EOL;
foreach (map($generator) as $info) {
    printLine($info);
}