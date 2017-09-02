const loudness = require('loudness');
const osascript = require('node-osascript');
const path = require('path');

let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-spotify', 'Spotify', Spotify);
};

class Spotify {

  constructor (log, config) {
    this.log = log;
    this.service = 'Switch';
    this.config = config;

    this.retrieveSwitchState = this.retrieveSwitchState.bind(this);

    this.on = false;
  }

  setState (on, callback) {
    if (this.on === on) return callback();

    const state = on ? 'on' : 'off';
    let script = on ? path.join(__dirname, 'scripts', 'spotify-on.applescript') : path.join(__dirname, 'scripts', 'spotify-off.applescript');

    const done = (err) => {
      if (err) {
        this.log('Error: ' + err);
        callback(err || new Error('Error setting ' + this.config.name + ' to ' + state));
      } else {
        this.on = on;

        this.log('Set ' + this.config.name + ' to ' + state);
        callback(null);
      }
    };
    const fadeConfig = on ? 'fadeInTime' : 'fadeOutTime';
    const fade = this.config[fadeConfig] * 1000 || 0;

    const logVolErr = (err) => {
      if(err) this.log('node-loudness error:', err);
    };

    const fadeIn = (time) => {
      loudness.getVolume((err, initVol) => {
        const interval = time / initVol;
        let i = 0;
        loudness.setVolume(0, logVolErr);
        osascript.executeFile(script, done);

        const timer = setInterval(() => {
          if (i === initVol) clearInterval(timer);
          loudness.setVolume(i, logVolErr);
          i++;
        }, interval);
      });
    };

    const fadeOut = (time) => {
      loudness.getVolume((err, initVol) => {
        const interval = time / initVol;
        let i = 0;

        const timer = setInterval(() => {
          loudness.setVolume(initVol - i, logVolErr);
          if (i === initVol) {
            clearInterval(timer);
            osascript.executeFile(script, done);
            setTimeout(() => {
              loudness.setVolume(initVol, logVolErr);
            }, 500);
          }
          i++;
        }, interval);
      });
    };

    if (fade) {
      if (on) {
        fadeIn(fade);
      } else {
        fadeOut(fade);
      }
    } else {
      osascript.executeFile(script, done);
    }
  }

  retrieveSwitchState () {
    const script = path.join(__dirname, 'scripts', 'spotify-status.applescript');

    const done = (err, on) => {
      setTimeout(this.retrieveSwitchState, (this.config.statusCheckInterval * 1000) || 1000);

      if (err) return;

      this.on = !!on;

      this.switchService.setCharacteristic(Characteristic.On, !!on);
    };

    osascript.executeFile(script, done);
  }

  getServices () {
    const switchService = new Service.Switch(this.config.name);

    switchService
      .getCharacteristic(Characteristic.On)
      .on('set', this.setState.bind(this));

    this.switchService = switchService;
    this.retrieveSwitchState();

    return [switchService];
  }
}
