# Boat Dashboard - Serial Reader

## General Description

### Reading incoming text serial data
This component connects to the RPi serial port and reads the incoming data feed (sent by the connected Arduino board).
The expected data format is simple. It is text based with each line including a three letter prefix followed by the readings and a carriage return (\n);

It is meant to run on the Raspberry Pi and is the receiving endpoint of the measures collected by our Arduino device.


## Readings - Handled types

### `RDG` messages

A list of space separated readings. These readings are values which have already been processed (voltage to resistance conversion done by Arduino).
Each reading is expected to be numerical value.
They are expected to in the same order as provided in the *sensorReadingPositions* of the `inputs-configuration.json` file.
A typical RDG data line could look like this `RDG 12.15 33.5 50 90`


### `GPS` messages

A GPS reading. The values are space delimited and expected to be transmitted in the following order: `longitude, latitude, speed, course, numberOfSatellites, hdop, date/time`.

Example:
```GPS 151.5 -33.0 70 180 8 0 2022,12,31,14,52,21,32```


### `RAW` message

These are the raw values / unprocessed voltage readings (in the 0-1024 range / 10 bits resolution) of our Arduino board.

Example:
```RAW 128 144 385 644 728```

### `RPM` message

RPM messages are tachometer messages: they only contain one value the number of rev per minutes of the engine.

Example:
```RPM 2500```


## Converting data

Voltage data is received as is (in Volts) and does not require any special conversion.
The same goes for positional data (GPS).
However, the data we are receiving (RDG messages) for some sensors (water temperature, oil pressure, fuel gauge) is expressed as resistance (in Ohms).
To be converted to bars, degrees or number of litres, we need to refer to these gauges/sensors documentations and provide some reference values.
These conversions are defined in a configuration file: `inputs-configuration.json`, `converters` section.
For each sensor we want to operate a conversion for, we need to define both the type of conversion (`linear` or `polynomial`) and the file containing the reference values (Ohms to whichever value is meant to be reported by this sensor).

For instance, conversions for our water temperature sensor can be defined as follows:
```
{
    "converter-model": "linear-model-converter",
    "converter-data": "water-temperature/water-temperature-american-sender-40c-120c"
}
```

and the conversion data (`water-temperature/water-temperature-american-sender-40c-120c`) looks like this:
```
[{
    "source": 1000000000,
    "target": 0
}, {
    "source": 450,
    "target": 40
}, {
    "source": 99,
    "target": 65
}, {
    "source": 29.6,
    "target": 120
}]
``` 

With such configuration, a reading of 45 Ohms would give a temperature of `65 + (120 - 65) / (29.6 - 99) * (45 - 99) = 107 degrees Celsius`

## Smoothing spikes

Some sensors/inputs provide fluctuating data when we would expect a relatively stable values.
It is for instance very unlikely - if not impossible - for the content of your fuel tank to vary by 10 or 20 litres in the span of a second!
To cater for such variations, it is possible to define a list of filters per sensor through configuration.

See the filter section of our `inputs-configuration.json` file

```
"filters": {
        "voltage": [{
            "type": "moving-average",
            "params": {
                "number-of-values": 3
            }
        }], 
        "fuel-level": [{
            "type": "moving-average",
            "params": {
                "number-of-values": 10
            }
        }],
        "oil-pressure": [{
            "type": "moving-average",
            "params": {
                "number-of-values": 3
            }
        }],
        "water-temperature": [{
            "type": "moving-average",
            "params": {
                "number-of-values": 3
            }
        }]
    },
```

## Main configuration file

The main configuration file defines: 
* The port our web server runs on (remember, this webserver is used to expose readings to other components of our system - display/dashboard and logger for instance)
* what serial port to use (real one with its parameters, mock data read from file, mock random data).
See below for a few such examples:

### Raspberry Pi
```
{
    "SERIAL_PORT_TYPE": "./serial",
    "SERIAL_PORT_NAME": "/dev/ttyACM0",
    "SERIAL_PORT_CONFIGURATION": {
        "baudRate": 9600,
        "dataBits": 8,
        "parity": "none",
        "stopBits": 1,
        "flowControl": false
    },
    "WEB_SERVER_PORT": 8081
}
```

### Mac
```
{
    "SERIAL_PORT_TYPE": "./serial",
    "SERIAL_PORT_NAME": "/dev/cu.usbmodem14111",
    "SERIAL_PORT_CONFIGURATION": {
        "baudRate": 9600,
        "dataBits": 8,
        "parity": "none",
        "stopBits": 1,
        "flowControl": false
    },
    "WEB_SERVER_PORT": 8081
}
```

### Mock using log files
```
{
    "SERIAL_PORT_TYPE": "./mocks/mock-serial-port-replay-log-files",
    "SERIAL_PORT_NAME": "/dev/ttyACM0",
    "SERIAL_PORT_CONFIGURATION": {
        "baudRate": 9600,
        "dataBits": 8,
        "parity": "none",
        "stopBits": 1,
        "flowControl": false,
        "folder": "../logger/logger-data/"
    },
    "WEB_SERVER_PORT": 8081
}
```
