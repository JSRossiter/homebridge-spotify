# homebridge-spotify

A Homebridge plugin to integrate control of Spotify into HomeKit. This plugin requires Homebridge to be running on a Mac, it uses the computer volume to fade in and out and triggers play/pause in the Spotify app, returning the computer volume to the original level.

## Setup

1. `sudo npm install -g homebridge`, See the [Homebridge](https://github.com/nfarina/homebridge) project site for more information, and to configure Homebridge
2. `sudo npm install -g homebridge-spotify`
3. Configure the platform...

Add the following accessory definition to `~/.homebridge/config.json`:

```
"accessories": [
  {
    "accessory": "Spotify",
    "name": "Spotify",
    "fadeInTime": "6",
    "fadeOutTime": "6",
    "statusCheckInterval": "2"
  }
]
```

Accessory field must be labeled Spotify but the name can be whatever you want, if you plan on using it with Siri it might be wise to choose something more unique, otherwise you may have to prefix with the room name. `fadeInTime` and `fadeOutTime` are optional, because of the processing time of setting the volume it seems to take approximately 1.5x the value set (in seconds), if omitted it will simply play/pause immediately. `statusCheckInterval` is also optional and defaults to 1.

## Acknowledgements

This plugin is primarily based on https://github.com/lprhodes/homebridge-applescript-status with inspiration from https://github.com/JosephDuffy/homebridge-pc-volume and https://github.com/SphtKr/homebridge-itunes so many thanks to those authors for their work.

## Issues

Any issues or help getting setup please use the [github page](https://github.com/JSRossiter/homebridge-spotify/issues).
