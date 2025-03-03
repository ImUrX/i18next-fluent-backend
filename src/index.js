import * as utils from './utils.js';
import ajax from './ajax.js';

import ftl2js from 'fluent_conv/lib/ftl2js';

function getDefaults() {
  return {
    loadPath: '/locales/{{lng}}/{{ns}}.ftl',
    addPath: '/locales/add/{{lng}}/{{ns}}',
    parse: function(data, url) { return ftl2js(data) },
    crossDomain: false,
    ajax: ajax
  };
}

class Backend {
  constructor(services, options = {}) {
    this.init(services, options);

    this.type = 'backend';
  }

  init(services, options = {}) {
    this.services = services;
    this.options = utils.defaults(options, this.options || {}, getDefaults());
  }

  read(language, namespace, callback) {
    var loadPath = this.options.loadPath;
    if (typeof this.options.loadPath === 'function') {
	    loadPath = this.options.loadPath([language], [namespace]);
    }

    let url = this.services.interpolator.interpolate(loadPath, { lng: language, ns: namespace });

    this.loadUrl(url, callback);
  }

  loadUrl(url, callback) {
    this.options.ajax(url, this.options, (data, xhr) => {
      if (xhr.status >= 500 && xhr.status < 600) return callback('failed loading ' + url, true /* retry */);
      if (xhr.status >= 400 && xhr.status < 500) return callback('failed loading ' + url, false /* no retry */);

      let ret, err;
      try {
        ret = this.options.parse(data, url);
      } catch (e) {
        err = 'failed parsing ' + url + ' to json';
      }
      if (err) return callback(err, false);
      callback(null, ret);
    });
  }

  create(languages, namespace, key, fallbackValue) {
    if (typeof languages === 'string') languages = [languages];

    let payload = {};
    payload[key] = fallbackValue || '';

    languages.forEach(lng => {
      let url = this.services.interpolator.interpolate(this.options.addPath, { lng: lng, ns: namespace });

      this.options.ajax(url, this.options, function(data, xhr) {
        //const statusCode = xhr.status.toString();
        // TODO: if statusCode === 4xx do log
      }, payload);
    });
  }
}

Backend.type = 'backend';


export default Backend;
