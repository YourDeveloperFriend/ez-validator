import _ from 'lodash';

let Conversions = {
  int(value) {
    return Conversions.float(value);
  },
  text(value) {
    return '' + value;
  },
  float(value) {
    return parseFloat(value);
  },
  boolean(value) {
    return _.isString(value) ? value === 'true' : !!value;
  },
  date(value) {
    return new Date(value);
  },
  array(value) {
    return _.isArray(value) ? value : void 0;
  }
}

export default class Converter {
  constructor(conversions) {
    this.conversions = conversions || {};
  }
  convertCtrl(ctrl) {
    return this.convertData(ctrl.routeDetails.data, ctrl.data, ctrl);
  }
  async convertData(convertInfo, data, context) {
    var iterators = _.map(convertInfo, (info, key)=> {
      return this.convertField(info, key, data, context);
    });
    for(let iter of iterators) {
      await iter;
    }
    let allowedFields = _.reduce(convertInfo, (allowed, info, key)=> {
      allowed.push(info.rename || key);
      if(info.rename && info.keepOriginal) allowed.push(key);
      return allowed;
    }, []);
    let unallowedFields = _.difference(Object.keys(data), allowedFields);
    unallowedFields.forEach( (field)=> delete data[field] );
    return data;
  }
  async convertField(info, key, data, context) {
    let converter;
    if(info.type && (converter = this.getConverter(info.type))) {
      let rename = info.rename;
      let name = rename || key;
      if(rename && context && context.usedArgs) {
        key = rename;
        rename = false;
      }
      if(!data[key]) {
        if(info.default) {
          data[key] = info.default;
        }
      } else {
        data[name] = await converter.call(context, data[key], key, info, data);
        if(rename && !info.keepOriginal) {
          delete data[key];
        }
      }
    }
  }
  getConverter(type) {
    if(_.isArray(type)) {
      [type] = type;
      let converter = this.getConverter(type);
      if(converter) {
        return function arrayConverter(value) {
          if(value.forEach) {
            value.forEach(function(value, i, array) {
              array[i] = converter.call(this, value);
            });
          }
          return value;
        }
      } else {
        return;
      }
    } else if (_.isFunction(type)) {
      return type;
    } else if (_.isString(type)) {
      return this.conversions[type] || Conversions[type];
    } else {
      throw new Error('Invalid conversion type ' + type + ' expected a string or an array');
    }
    if(_.isObject(type)) {
      // Work in progress
      return function objectConverter(obj) {
        _.forEach(obj, (value, key, obj)=> {
          obj[key] = converter.call(this, value);
        });
      };
    }
  }
};
