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
    const script = on ? path.join(__dirname, 'scripts', 'spotify-on.applescript') : path.join(__dirname, 'scripts', 'spotify-off.applescript');
    const fadeConfig = on ? 'fadeInTime' : 'fadeOutTime';
    const fade = this.config[fadeConfig] * 1000 || 0;

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

    const logVolErr = (err) => {
      if (err) this.log('node-loudness error:', err);
    };

    const adjustVol = (target, curVol, interval, cb) => {
      setTimeout(() => {
        const newVol = curVol > target ? curVol - 1 : curVol + 1;
        loudness.setVolume(newVol, err => {
          logVolErr(err);
          if (newVol !== target) adjustVol(target, newVol, interval, cb);
          else cb(err);
        });
      }, interval);
    };

    if (fade) {
      loudness.getVolume((err, initVol) => {
        const interval = fade / initVol;
        if (on) {
          loudness.setVolume(0, (err) => {
            logVolErr(err);
            setTimeout(() => {
              osascript.executeFile(script);
            }, 100);
            adjustVol(initVol, 0, interval, done);
          });
        } else {
          adjustVol(0, initVol, interval, () => {
            osascript.executeFile(script, done);
            setTimeout(() => {
              loudness.setVolume(initVol, logVolErr);
            }, 100);
          });
        }
      });
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
