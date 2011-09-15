window.showUpperStuff = "show";
window.jive_enable_grid = "enable";
window.jive_enable_autocomplete = "enable";
window.jive_show_branding = "hide";


var org = {};
org.jive = {};
org.jive.util = {}
org.jive.spank = {}
org.jive.spank.control = {}

/*  Prototype JavaScript framework, version 1.5.1
 *  (c) 2005-2007 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
/*--------------------------------------------------------------------------*/

var Prototype = {
  Version: '1.5.1',

  Browser: {
    IE:     !!(window.attachEvent && !window.opera),
    Opera:  !!window.opera,
    WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    Gecko:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1
  },

  BrowserFeatures: {
    XPath: !!document.evaluate,
    ElementExtensions: !!window.HTMLElement,
    SpecificElementExtensions:
      (document.createElement('div').__proto__ !==
       document.createElement('form').__proto__)
  },

  ScriptFragment: '<script[^>]*>([\u0001-\uFFFF]*?)</script>',
  JSONFilter: /^\/\*-secure-\s*(.*)\s*\*\/\s*$/,

  emptyFunction: function() { },
  K: function(x) { return x }
}

var Class = {
  create: function() {
    return function() {
      this.initialize.apply(this, arguments);
    }
  }
}

var Abstract = new Object();

Object.extend = function(destination, source) {
  for (var property in source) {
    destination[property] = source[property];
  }
  return destination;
}

Object.extend(Object, {
  inspect: function(object) {
    try {
      if (object === undefined) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : object.toString();
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  },

  toJSON: function(object) {
    var type = typeof object;
    switch(type) {
      case 'undefined':
      case 'function':
      case 'unknown': return;
      case 'boolean': return object.toString();
    }
    if (object === null) return 'null';
    if (object.toJSON) return object.toJSON();
    if (object.ownerDocument === document) return;
    var results = [];
    for (var property in object) {
      var value = Object.toJSON(object[property]);
      if (value !== undefined)
        results.push(property.toJSON() + ': ' + value);
    }
    return '{' + results.join(', ') + '}';
  },

  keys: function(object) {
    var keys = [];
    for (var property in object)
      keys.push(property);
    return keys;
  },

  values: function(object) {
    var values = [];
    for (var property in object)
      values.push(object[property]);
    return values;
  },

  clone: function(object) {
    return Object.extend({}, object);
  }
});

Function.prototype.bind = function() {
  var __method = this, args = $A(arguments), object = args.shift();
  return function() {
    return __method.apply(object, args.concat($A(arguments)));
  }
}

Function.prototype.bindAsEventListener = function(object) {
  var __method = this, args = $A(arguments), object = args.shift();
  return function(event) {
    return __method.apply(object, [event || window.event].concat(args));
  }
}

Object.extend(Number.prototype, {
  toColorPart: function() {
    return this.toPaddedString(2, 16);
  },

  succ: function() {
    return this + 1;
  },

  times: function(iterator) {
    $R(0, this, true).each(iterator);
    return this;
  },

  toPaddedString: function(length, radix) {
    var string = this.toString(radix || 10);
    return '0'.times(length - string.length) + string;
  },

  toJSON: function() {
    return isFinite(this) ? this.toString() : 'null';
  }
});

Date.prototype.toJSON = function() {
  return '"' + this.getFullYear() + '-' +
    (this.getMonth() + 1).toPaddedString(2) + '-' +
    this.getDate().toPaddedString(2) + 'T' +
    this.getHours().toPaddedString(2) + ':' +
    this.getMinutes().toPaddedString(2) + ':' +
    this.getSeconds().toPaddedString(2) + '"';
};

var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) {}
    }

    return returnValue;
  }
}

/*--------------------------------------------------------------------------*/

var PeriodicalExecuter = Class.create();
PeriodicalExecuter.prototype = {
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.callback(this);
      } finally {
        this.currentlyExecuting = false;
      }
    }
  }
}
Object.extend(String, {
  interpret: function(value) {
    return value == null ? '' : String(value);
  },
  specialChar: {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '\\': '\\\\'
  }
});

Object.extend(String.prototype, {
  gsub: function(pattern, replacement) {
    var result = '', source = this, match;
    replacement = arguments.callee.prepareReplacement(replacement);

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  },

  sub: function(pattern, replacement, count) {
    replacement = this.gsub.prepareReplacement(replacement);
    count = count === undefined ? 1 : count;

    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  },

  scan: function(pattern, iterator) {
    this.gsub(pattern, iterator);
    return this;
  },

  truncate: function(length, truncation) {
    length = length || 30;
    truncation = truncation === undefined ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : this;
  },

  strip: function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  },

  stripTags: function() {
    return this.replace(/<\/?[^>]+>/gi, '');
  },

  stripScripts: function() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  },

  extractScripts: function() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img');
    var matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  },

  evalScripts: function() {
    return this.extractScripts().map(function(script) { return eval(script) });
  },

  escapeHTML: function() {
    var self = arguments.callee;
    self.text.data = this;
    return self.div.innerHTML;
  },

  unescapeHTML: function() {
    var div = document.createElement('div');
    div.innerHTML = this.stripTags();
    return div.childNodes[0] ? (div.childNodes.length > 1 ?
      $A(div.childNodes).inject('', function(memo, node) { return memo+node.nodeValue }) :
      div.childNodes[0].nodeValue) : '';
  },

  toQueryParams: function(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return {};

    return match[1].split(separator || '&').inject({}, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift());
        var value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (hash[key].constructor != Array) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  },

  toArray: function() {
    return this.split('');
  },

  succ: function() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  },

  times: function(count) {
    var result = '';
    for (var i = 0; i < count; i++) result += this;
    return result;
  },

  camelize: function() {
    var parts = this.split('-'), len = parts.length;
    if (len == 1) return parts[0];

    var camelized = this.charAt(0) == '-'
      ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
      : parts[0];

    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

    return camelized;
  },

  capitalize: function() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  },

  underscore: function() {
    return this.gsub(/::/, '/').gsub(/([A-Z]+)([A-Z][a-z])/,'#{1}_#{2}').gsub(/([a-z\d])([A-Z])/,'#{1}_#{2}').gsub(/-/,'_').toLowerCase();
  },

  dasherize: function() {
    return this.gsub(/_/,'-');
  },

  inspect: function(useDoubleQuotes) {
    var escapedString = this.gsub(/[\x00-\x1f\\]/, function(match) {
      var character = String.specialChar[match[0]];
      return character ? character : '\\u00' + match[0].charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  },

  toJSON: function() {
    return this.inspect(true);
  },

  unfilterJSON: function(filter) {
    return this.sub(filter || Prototype.JSONFilter, '#{1}');
  },

  evalJSON: function(sanitize) {
    var json = this.unfilterJSON();
    try {
      if (!sanitize || (/^("(\\.|[^"\\\n\r])*?"|[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t])+?$/.test(json)))
        return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  },

  include: function(pattern) {
    return this.indexOf(pattern) > -1;
  },

  startsWith: function(pattern) {
    return this.indexOf(pattern) === 0;
  },

  endsWith: function(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.lastIndexOf(pattern) === d;
  },

  empty: function() {
    return this == '';
  },

  blank: function() {
    return /^\s*$/.test(this);
  }
});

if (Prototype.Browser.WebKit || Prototype.Browser.IE) Object.extend(String.prototype, {
  escapeHTML: function() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },
  unescapeHTML: function() {
    return this.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  }
});

String.prototype.gsub.prepareReplacement = function(replacement) {
  if (typeof replacement == 'function') return replacement;
  var template = new Template(replacement);
  return function(match) { return template.evaluate(match) };
}

String.prototype.parseQuery = String.prototype.toQueryParams;

Object.extend(String.prototype.escapeHTML, {
  div:  document.createElement('div'),
  text: document.createTextNode('')
});

with (String.prototype.escapeHTML) div.appendChild(text);

var Template = Class.create();
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;
Template.prototype = {
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern  = pattern || Template.Pattern;
  },

  evaluate: function(object) {
    return this.template.gsub(this.pattern, function(match) {
      var before = match[1];
      if (before == '\\') return match[2];
      return before + String.interpret(object[match[3]]);
    });
  }
}

var $break = {}, $continue = new Error('"throw $continue" is deprecated, use "return" instead');

var Enumerable = {
  each: function(iterator) {
    var index = 0;
    try {
      this._each(function(value) {
        iterator(value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  },

  eachSlice: function(number, iterator) {
    var index = -number, slices = [], array = this.toArray();
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.map(iterator);
  },

  all: function(iterator) {
    var result = true;
    this.each(function(value, index) {
      result = result && !!(iterator || Prototype.K)(value, index);
      if (!result) throw $break;
    });
    return result;
  },

  any: function(iterator) {
    var result = false;
    this.each(function(value, index) {
      if (result = !!(iterator || Prototype.K)(value, index))
        throw $break;
    });
    return result;
  },

  collect: function(iterator) {
    var results = [];
    this.each(function(value, index) {
      results.push((iterator || Prototype.K)(value, index));
    });
    return results;
  },

  detect: function(iterator) {
    var result;
    this.each(function(value, index) {
      if (iterator(value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  },

  findAll: function(iterator) {
    var results = [];
    this.each(function(value, index) {
      if (iterator(value, index))
        results.push(value);
    });
    return results;
  },

  grep: function(pattern, iterator) {
    var results = [];
    this.each(function(value, index) {
      var stringValue = value.toString();
      if (stringValue.match(pattern))
        results.push((iterator || Prototype.K)(value, index));
    })
    return results;
  },

  include: function(object) {
    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  },

  inGroupsOf: function(number, fillWith) {
    fillWith = fillWith === undefined ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  },

  inject: function(memo, iterator) {
    this.each(function(value, index) {
      memo = iterator(memo, value, index);
    });
    return memo;
  },

  invoke: function(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  },

  max: function(iterator) {
    var result;
    this.each(function(value, index) {
      value = (iterator || Prototype.K)(value, index);
      if (result == undefined || value >= result)
        result = value;
    });
    return result;
  },

  min: function(iterator) {
    var result;
    this.each(function(value, index) {
      value = (iterator || Prototype.K)(value, index);
      if (result == undefined || value < result)
        result = value;
    });
    return result;
  },

  partition: function(iterator) {
    var trues = [], falses = [];
    this.each(function(value, index) {
      ((iterator || Prototype.K)(value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  },

  pluck: function(property) {
    var results = [];
    this.each(function(value, index) {
      results.push(value[property]);
    });
    return results;
  },

  reject: function(iterator) {
    var results = [];
    this.each(function(value, index) {
      if (!iterator(value, index))
        results.push(value);
    });
    return results;
  },

  sortBy: function(iterator) {
    return this.map(function(value, index) {
      return {value: value, criteria: iterator(value, index)};
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  },

  toArray: function() {
    return this.map();
  },

  zip: function() {
    var iterator = Prototype.K, args = $A(arguments);
    if (typeof args.last() == 'function')
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  },

  size: function() {
    return this.toArray().length;
  },

  inspect: function() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }
}

Object.extend(Enumerable, {
  map:     Enumerable.collect,
  find:    Enumerable.detect,
  select:  Enumerable.findAll,
  member:  Enumerable.include,
  entries: Enumerable.toArray
});
var $A = Array.from = function(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) {
    return iterable.toArray();
  } else {
    var results = [];
    for (var i = 0, length = iterable.length; i < length; i++)
      results.push(iterable[i]);
    return results;
  }
}

if (Prototype.Browser.WebKit) {
  $A = Array.from = function(iterable) {
    if (!iterable) return [];
    if (!(typeof iterable == 'function' && iterable == '[object NodeList]') &&
      iterable.toArray) {
      return iterable.toArray();
    } else {
      var results = [];
      for (var i = 0, length = iterable.length; i < length; i++)
        results.push(iterable[i]);
      return results;
    }
  }
}

Object.extend(Array.prototype, Enumerable);

if (!Array.prototype._reverse)
  Array.prototype._reverse = Array.prototype.reverse;

Object.extend(Array.prototype, {
  _each: function(iterator) {
    for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
  },

  clear: function() {
    this.length = 0;
    return this;
  },

  first: function() {
    return this[0];
  },

  last: function() {
    return this[this.length - 1];
  },

  compact: function() {
    return this.select(function(value) {
      return value != null;
    });
  },

  flatten: function() {
    return this.inject([], function(array, value) {
      return array.concat(value && value.constructor == Array ?
        value.flatten() : [value]);
    });
  },

  without: function() {
    var values = $A(arguments);
    return this.select(function(value) {
      return !values.include(value);
    });
  },

  indexOf: function(object) {
    for (var i = 0, length = this.length; i < length; i++)
      if (this[i] == object) return i;
    return -1;
  },

  reverse: function(inline) {
    return (inline !== false ? this : this.toArray())._reverse();
  },

  reduce: function() {
    return this.length > 1 ? this : this[0];
  },

  uniq: function(sorted) {
    return this.inject([], function(array, value, index) {
      if (0 == index || (sorted ? array.last() != value : !array.include(value)))
        array.push(value);
      return array;
    });
  },

  clone: function() {
    return [].concat(this);
  },

  size: function() {
    return this.length;
  },

  inspect: function() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  },

  toJSON: function() {
    var results = [];
    this.each(function(object) {
      var value = Object.toJSON(object);
      if (value !== undefined) results.push(value);
    });
    return '[' + results.join(', ') + ']';
  }
});

Array.prototype.toArray = Array.prototype.clone;

function $w(string) {
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}

if (Prototype.Browser.Opera){
  Array.prototype.concat = function() {
    var array = [];
    for (var i = 0, length = this.length; i < length; i++) array.push(this[i]);
    for (var i = 0, length = arguments.length; i < length; i++) {
      if (arguments[i].constructor == Array) {
        for (var j = 0, arrayLength = arguments[i].length; j < arrayLength; j++)
          array.push(arguments[i][j]);
      } else {
        array.push(arguments[i]);
      }
    }
    return array;
  }
}
var Hash = function(object) {
  if (object instanceof Hash) this.merge(object);
  else Object.extend(this, object || {});
};

Object.extend(Hash, {
  toQueryString: function(obj) {
    var parts = [];
    parts.add = arguments.callee.addPair;

    this.prototype._each.call(obj, function(pair) {
      if (!pair.key) return;
      var value = pair.value;

      if (value && typeof value == 'object') {
        if (value.constructor == Array) value.each(function(value) {
          parts.add(pair.key, value);
        });
        return;
      }
      parts.add(pair.key, value);
    });

    return parts.join('&');
  },

  toJSON: function(object) {
    var results = [];
    this.prototype._each.call(object, function(pair) {
      var value = Object.toJSON(pair.value);
      if (value !== undefined) results.push(pair.key.toJSON() + ': ' + value);
    });
    return '{' + results.join(', ') + '}';
  }
});

Hash.toQueryString.addPair = function(key, value, prefix) {
  key = encodeURIComponent(key);
  if (value === undefined) this.push(key);
  else this.push(key + '=' + (value == null ? '' : encodeURIComponent(value)));
}

Object.extend(Hash.prototype, Enumerable);
Object.extend(Hash.prototype, {
  _each: function(iterator) {
    for (var key in this) {
      var value = this[key];
      if (value && value == Hash.prototype[key]) continue;

      var pair = [key, value];
      pair.key = key;
      pair.value = value;
      iterator(pair);
    }
  },

  keys: function() {
    return this.pluck('key');
  },

  values: function() {
    return this.pluck('value');
  },

  merge: function(hash) {
    return $H(hash).inject(this, function(mergedHash, pair) {
      mergedHash[pair.key] = pair.value;
      return mergedHash;
    });
  },

  remove: function() {
    var result;
    for(var i = 0, length = arguments.length; i < length; i++) {
      var value = this[arguments[i]];
      if (value !== undefined){
        if (result === undefined) result = value;
        else {
          if (result.constructor != Array) result = [result];
          result.push(value)
        }
      }
      delete this[arguments[i]];
    }
    return result;
  },

  toQueryString: function() {
    return Hash.toQueryString(this);
  },

  inspect: function() {
    return '#<Hash:{' + this.map(function(pair) {
      return pair.map(Object.inspect).join(': ');
    }).join(', ') + '}>';
  },

  toJSON: function() {
    return Hash.toJSON(this);
  }
});

function $H(object) {
  if (object instanceof Hash) return object;
  return new Hash(object);
};

// Safari iterates over shadowed properties
if (function() {
  var i = 0, Test = function(value) { this.key = value };
  Test.prototype.key = 'foo';
  for (var property in new Test('bar')) i++;
  return i > 1;
}()) Hash.prototype._each = function(iterator) {
  var cache = [];
  for (var key in this) {
    var value = this[key];
    if ((value && value == Hash.prototype[key]) || cache.include(key)) continue;
    cache.push(key);
    var pair = [key, value];
    pair.key = key;
    pair.value = value;
    iterator(pair);
  }
};
ObjectRange = Class.create();
Object.extend(ObjectRange.prototype, Enumerable);
Object.extend(ObjectRange.prototype, {
  initialize: function(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  },

  _each: function(iterator) {
    var value = this.start;
    while (this.include(value)) {
      iterator(value);
      value = value.succ();
    }
  },

  include: function(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }
});

var $R = function(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
}

var Ajax = {
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },

  activeRequestCount: 0
}

Ajax.Responders = {
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },

  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (typeof responder[callback] == 'function') {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) {}
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate: function() {
    Ajax.activeRequestCount++;
  },
  onComplete: function() {
    Ajax.activeRequestCount--;
  }
});

Ajax.Base = function() {};
Ajax.Base.prototype = {
  setOptions: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   ''
    }
    Object.extend(this.options, options || {});

    this.options.method = this.options.method.toLowerCase();
    if (typeof this.options.parameters == 'string')
      this.options.parameters = this.options.parameters.toQueryParams();
  }
}

Ajax.Request = Class.create();
Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];

Ajax.Request.prototype = Object.extend(new Ajax.Base(), {
  _complete: false,

  initialize: function(url, options) {
    this.transport = Ajax.getTransport();
    this.setOptions(options);
    this.request(url);
  },

  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.clone(this.options.parameters);

    if (!['get', 'post'].include(this.method)) {
      // simulate other verbs over post
      params['_method'] = this.method;
      this.method = 'post';
    }

    this.parameters = params;

    if (params = Hash.toQueryString(params)) {
      // when GET, append parameters to URL
      if (this.method == 'get')
        this.url += (this.url.include('?') ? '&' : '?') + params;
      else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
        params += '&_=';
    }

    try {
      if (this.options.onCreate) this.options.onCreate(this.transport);
      Ajax.Responders.dispatch('onCreate', this, this.transport);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous)
        setTimeout(function() { this.respondToReadyState(1) }.bind(this), 10);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },

  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }

    // user-defined headers
    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (typeof extras.push == 'function')
        for (var i = 0, length = extras.length; i < length; i += 2)
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
  },

  success: function() {
    return !this.transport.status
        || (this.transport.status >= 200 && this.transport.status < 300);
  },

  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState];
    var transport = this.transport, json = this.evalJSON();

    if (state == 'Complete') {
      try {
        this._complete = true;
        (this.options['on' + this.transport.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(transport, json);
      } catch (e) {
        this.dispatchException(e);
      }

      var contentType = this.getHeader('Content-type');
      if (contentType && contentType.strip().
        match(/^(text|application)\/(x-)?(java|ecma)script(;.*)?$/i))
          this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(transport, json);
      Ajax.Responders.dispatch('on' + state, this, transport, json);
    } catch (e) {
      this.dispatchException(e);
    }

    if (state == 'Complete') {
      // avoid memory leak in MSIE: clean up
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },

  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name);
    } catch (e) { return null }
  },

  evalJSON: function() {
    try {
      var json = this.getHeader('X-JSON');
      return json ? json.evalJSON() : null;
    } catch (e) { return null }
  },

  evalResponse: function() {
    try {
      return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

Ajax.Updater = Class.create();

Object.extend(Object.extend(Ajax.Updater.prototype, Ajax.Request.prototype), {
  initialize: function(container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    }

    this.transport = Ajax.getTransport();
    this.setOptions(options);

    var onComplete = this.options.onComplete || Prototype.emptyFunction;
    this.options.onComplete = (function(transport, param) {
      this.updateContent();
      onComplete(transport, param);
    }).bind(this);

    this.request(url);
  },

  updateContent: function() {
    var receiver = this.container[this.success() ? 'success' : 'failure'];
    var response = this.transport.responseText;

    if (!this.options.evalScripts) response = response.stripScripts();

    if (receiver = $(receiver)) {
      if (this.options.insertion)
        new this.options.insertion(receiver, response);
      else
        receiver.update(response);
    }

    if (this.success()) {
      if (this.onComplete)
        setTimeout(this.onComplete.bind(this), 10);
    }
  }
});

Ajax.PeriodicalUpdater = Class.create();
Ajax.PeriodicalUpdater.prototype = Object.extend(new Ajax.Base(), {
  initialize: function(container, url, options) {
    this.setOptions(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = {};
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(request) {
    if (this.options.decay) {
      this.decay = (request.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = request.responseText;
    }
    this.timer = setTimeout(this.onTimerEvent.bind(this),
      this.decay * this.frequency * 1000);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});
function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (typeof element == 'string')
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(query.snapshotItem(i));
    return results;
  };

  document.getElementsByClassName = function(className, parentElement) {
    var q = ".//*[contains(concat(' ', @class, ' '), ' " + className + " ')]";
    return document._getElementsByXPath(q, parentElement);
  }

} else document.getElementsByClassName = function(className, parentElement) {
  var children = ($(parentElement) || document.body).getElementsByTagName('*');
  var elements = [], child;
  for (var i = 0, length = children.length; i < length; i++) {
    child = children[i];
    if (Element.hasClassName(child, className))
      elements.push(Element.extend(child));
  }
  return elements;
};

/*--------------------------------------------------------------------------*/

if (!window.Element) var Element = {};

Element.extend = function(element) {
  var F = Prototype.BrowserFeatures;
  if (!element || !element.tagName || element.nodeType == 3 ||
   element._extended || F.SpecificElementExtensions || element == window)
    return element;

  var methods = {}, tagName = element.tagName, cache = Element.extend.cache,
   T = Element.Methods.ByTag;

  // extend methods for all tags (Safari doesn't need this)
  if (!F.ElementExtensions) {
    Object.extend(methods, Element.Methods),
    Object.extend(methods, Element.Methods.Simulated);
  }

  // extend methods for specific tags
  if (T[tagName]) Object.extend(methods, T[tagName]);

  for (var property in methods) {
    var value = methods[property];
    if (typeof value == 'function' && !(property in element))
      element[property] = cache.findOrStore(value);
  }

  element._extended = Prototype.emptyFunction;
  return element;
};

Element.extend.cache = {
  findOrStore: function(value) {
    return this[value] = this[value] || function() {
      return value.apply(null, [this].concat($A(arguments)));
    }
  }
};

Element.Methods = {
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  toggle: function(element) {
    element = $(element);
    Element[Element.visible(element) ? 'hide' : 'show'](element);
    return element;
  },

  hide: function(element) {
    $(element).style.display = 'none';
    return element;
  },

  show: function(element) {
    $(element).style.display = '';
    return element;
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
    return element;
  },

  update: function(element, html) {
    html = typeof html == 'undefined' ? '' : html.toString();
    $(element).innerHTML = html.stripScripts();
    setTimeout(function() {html.evalScripts()}, 10);
    return element;
  },

  replace: function(element, html) {
    element = $(element);
    html = typeof html == 'undefined' ? '' : html.toString();
    if (element.outerHTML) {
      element.outerHTML = html.stripScripts();
    } else {
      var range = element.ownerDocument.createRange();
      range.selectNodeContents(element);
      element.parentNode.replaceChild(
        range.createContextualFragment(html.stripScripts()), element);
    }
    setTimeout(function() {html.evalScripts()}, 10);
    return element;
  },

  inspect: function(element) {
    element = $(element);
    var result = '<' + element.tagName.toLowerCase();
    $H({'id': 'id', 'className': 'class'}).each(function(pair) {
      var property = pair.first(), attribute = pair.last();
      var value = (element[property] || '').toString();
      if (value) result += ' ' + attribute + '=' + value.inspect(true);
    });
    return result + '>';
  },

  recursivelyCollect: function(element, property) {
    element = $(element);
    var elements = [];
    while (element = element[property])
      if (element.nodeType == 1)
        elements.push(Element.extend(element));
    return elements;
  },

  ancestors: function(element) {
    return $(element).recursivelyCollect('parentNode');
  },

  descendants: function(element) {
    return $A($(element).getElementsByTagName('*')).each(Element.extend);
  },

  firstDescendant: function(element) {
    element = $(element).firstChild;
    while (element && element.nodeType != 1) element = element.nextSibling;
    return $(element);
  },

  immediateDescendants: function(element) {
    if (!(element = $(element).firstChild)) return [];
    while (element && element.nodeType != 1) element = element.nextSibling;
    if (element) return [element].concat($(element).nextSiblings());
    return [];
  },

  previousSiblings: function(element) {
    return $(element).recursivelyCollect('previousSibling');
  },

  nextSiblings: function(element) {
    return $(element).recursivelyCollect('nextSibling');
  },

  siblings: function(element) {
    element = $(element);
    return element.previousSiblings().reverse().concat(element.nextSiblings());
  },

  match: function(element, selector) {
    if (typeof selector == 'string')
      selector = new Selector(selector);
    return selector.match($(element));
  },

  up: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(element.parentNode);
    var ancestors = element.ancestors();
    return expression ? Selector.findElement(ancestors, expression, index) :
      ancestors[index || 0];
  },

  down: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return element.firstDescendant();
    var descendants = element.descendants();
    return expression ? Selector.findElement(descendants, expression, index) :
      descendants[index || 0];
  },

  previous: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(Selector.handlers.previousElementSibling(element));
    var previousSiblings = element.previousSiblings();
    return expression ? Selector.findElement(previousSiblings, expression, index) :
      previousSiblings[index || 0];
  },

  next: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(Selector.handlers.nextElementSibling(element));
    var nextSiblings = element.nextSiblings();
    return expression ? Selector.findElement(nextSiblings, expression, index) :
      nextSiblings[index || 0];
  },

  getElementsBySelector: function() {
    var args = $A(arguments), element = $(args.shift());
    return Selector.findChildElements(element, args);
  },

  getElementsByClassName: function(element, className) {
    return document.getElementsByClassName(className, element);
  },

  readAttribute: function(element, name) {
    element = $(element);
    if (Prototype.Browser.IE) {
      if (!element.attributes) return null;
      var t = Element._attributeTranslations;
      if (t.values[name]) return t.values[name](element, name);
      if (t.names[name])  name = t.names[name];
      var attribute = element.attributes[name];
      return attribute ? attribute.nodeValue : null;
    }
    return element.getAttribute(name);
  },

  getHeight: function(element) {
    return $(element).getDimensions().height;
  },

  getWidth: function(element) {
    return $(element).getDimensions().width;
  },

  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    var elementClassName = element.className;
    if (elementClassName.length == 0) return false;
    if (elementClassName == className ||
        elementClassName.match(new RegExp("(^|\\s)" + className + "(\\s|$)")))
      return true;
    return false;
  },

  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    Element.classNames(element).add(className);
    return element;
  },

  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    Element.classNames(element).remove(className);
    return element;
  },

  toggleClassName: function(element, className) {
    if (!(element = $(element))) return;
    Element.classNames(element)[element.hasClassName(className) ? 'remove' : 'add'](className);
    return element;
  },

  observe: function() {
    Event.observe.apply(Event, arguments);
    return $A(arguments).first();
  },

  stopObserving: function() {
    Event.stopObserving.apply(Event, arguments);
    return $A(arguments).first();
  },

  // removes whitespace-only text node children
  cleanWhitespace: function(element) {
    element = $(element);
    var node = element.firstChild;
    while (node) {
      var nextNode = node.nextSibling;
      if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
        element.removeChild(node);
      node = nextNode;
    }
    return element;
  },

  empty: function(element) {
    return $(element).innerHTML.blank();
  },

  descendantOf: function(element, ancestor) {
    element = $(element), ancestor = $(ancestor);
    while (element = element.parentNode)
      if (element == ancestor) return true;
    return false;
  },

  scrollTo: function(element) {
    element = $(element);
    var pos = Position.cumulativeOffset(element);
    window.scrollTo(pos[0], pos[1]);
    return element;
  },

  getStyle: function(element, style) {
    element = $(element);
    style = style == 'float' ? 'cssFloat' : style.camelize();
    var value = element.style[style];
    if (!value) {
      var css = document.defaultView.getComputedStyle(element, null);
      value = css ? css[style] : null;
    }
    if (style == 'opacity') return value ? parseFloat(value) : 1.0;
    return value == 'auto' ? null : value;
  },

  getOpacity: function(element) {
    return $(element).getStyle('opacity');
  },

  setStyle: function(element, styles, camelized) {
    element = $(element);
    var elementStyle = element.style;

    for (var property in styles)
      if (property == 'opacity') element.setOpacity(styles[property])
      else
        elementStyle[(property == 'float' || property == 'cssFloat') ?
          (elementStyle.styleFloat === undefined ? 'cssFloat' : 'styleFloat') :
          (camelized ? property : property.camelize())] = styles[property];

    return element;
  },

  setOpacity: function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;
    return element;
  },

  getDimensions: function(element) {
    element = $(element);
    var display = $(element).getStyle('display');
    if (display != 'none' && display != null) // Safari bug
      return {width: element.offsetWidth, height: element.offsetHeight};

    // All *Width and *Height properties give 0 on elements with display none,
    // so enable the element temporarily
    var els = element.style;
    var originalVisibility = els.visibility;
    var originalPosition = els.position;
    var originalDisplay = els.display;
    els.visibility = 'hidden';
    els.position = 'absolute';
    els.display = 'block';
    var originalWidth = element.clientWidth;
    var originalHeight = element.clientHeight;
    els.display = originalDisplay;
    els.position = originalPosition;
    els.visibility = originalVisibility;
    return {width: originalWidth, height: originalHeight};
  },

  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      // Opera returns the offset relative to the positioning context, when an
      // element is position relative but top and left have not been defined
      if (window.opera) {
        element.style.top = 0;
        element.style.left = 0;
      }
    }
    return element;
  },

  undoPositioned: function(element) {
    element = $(element);
    if (element._madePositioned) {
      element._madePositioned = undefined;
      element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
    }
    return element;
  },

  makeClipping: function(element) {
    element = $(element);
    if (element._overflow) return element;
    element._overflow = element.style.overflow || 'auto';
    if ((Element.getStyle(element, 'overflow') || 'visible') != 'hidden')
      element.style.overflow = 'hidden';
    return element;
  },

  undoClipping: function(element) {
    element = $(element);
    if (!element._overflow) return element;
    element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
    element._overflow = null;
    return element;
  }
};

Object.extend(Element.Methods, {
  childOf: Element.Methods.descendantOf,
  childElements: Element.Methods.immediateDescendants
});

if (Prototype.Browser.Opera) {
  Element.Methods._getStyle = Element.Methods.getStyle;
  Element.Methods.getStyle = function(element, style) {
    switch(style) {
      case 'left':
      case 'top':
      case 'right':
      case 'bottom':
        if (Element._getStyle(element, 'position') == 'static') return null;
      default: return Element._getStyle(element, style);
    }
  };
}
else if (Prototype.Browser.IE) {
  Element.Methods.getStyle = function(element, style) {
    element = $(element);
    style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
    var value = element.style[style];
    if (!value && element.currentStyle) value = element.currentStyle[style];

    if (style == 'opacity') {
      if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
        if (value[1]) return parseFloat(value[1]) / 100;
      return 1.0;
    }

    if (value == 'auto') {
      if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none'))
        return element['offset'+style.capitalize()] + 'px';
      return null;
    }
    return value;
  };

  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    var filter = element.getStyle('filter'), style = element.style;
    if (value == 1 || value === '') {
      style.filter = filter.replace(/alpha\([^\)]*\)/gi,'');
      return element;
    } else if (value < 0.00001) value = 0;
    style.filter = filter.replace(/alpha\([^\)]*\)/gi, '') +
      'alpha(opacity=' + (value * 100) + ')';
    return element;
  };

  // IE is missing .innerHTML support for TABLE-related elements
  Element.Methods.update = function(element, html) {
    element = $(element);
    html = typeof html == 'undefined' ? '' : html.toString();
    var tagName = element.tagName.toUpperCase();
    if (['THEAD','TBODY','TR','TD'].include(tagName)) {
      var div = document.createElement('div');
      switch (tagName) {
        case 'THEAD':
        case 'TBODY':
          div.innerHTML = '<table><tbody>' +  html.stripScripts() + '</tbody></table>';
          depth = 2;
          break;
        case 'TR':
          div.innerHTML = '<table><tbody><tr>' +  html.stripScripts() + '</tr></tbody></table>';
          depth = 3;
          break;
        case 'TD':
          div.innerHTML = '<table><tbody><tr><td>' +  html.stripScripts() + '</td></tr></tbody></table>';
          depth = 4;
      }
      $A(element.childNodes).each(function(node) { element.removeChild(node) });
      depth.times(function() { div = div.firstChild });
      $A(div.childNodes).each(function(node) { element.appendChild(node) });
    } else {
      element.innerHTML = html.stripScripts();
    }
    setTimeout(function() { html.evalScripts() }, 10);
    return element;
  }
}
else if (Prototype.Browser.Gecko) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1) ? 0.999999 :
      (value === '') ? '' : (value < 0.00001) ? 0 : value;
    return element;
  };
}

Element._attributeTranslations = {
  names: {
    colspan:   "colSpan",
    rowspan:   "rowSpan",
    valign:    "vAlign",
    datetime:  "dateTime",
    accesskey: "accessKey",
    tabindex:  "tabIndex",
    enctype:   "encType",
    maxlength: "maxLength",
    readonly:  "readOnly",
    longdesc:  "longDesc"
  },
  values: {
    _getAttr: function(element, attribute) {
      return element.getAttribute(attribute, 2);
    },
    _flag: function(element, attribute) {
      return $(element).hasAttribute(attribute) ? attribute : null;
    },
    style: function(element) {
      return element.style.cssText.toLowerCase();
    },
    title: function(element) {
      var node = element.getAttributeNode('title');
      return node.specified ? node.nodeValue : null;
    }
  }
};

(function() {
  Object.extend(this, {
    href: this._getAttr,
    src:  this._getAttr,
    type: this._getAttr,
    disabled: this._flag,
    checked:  this._flag,
    readonly: this._flag,
    multiple: this._flag
  });
}).call(Element._attributeTranslations.values);

Element.Methods.Simulated = {
  hasAttribute: function(element, attribute) {
    var t = Element._attributeTranslations, node;
    attribute = t.names[attribute] || attribute;
    node = $(element).getAttributeNode(attribute);
    return node && node.specified;
  }
};

Element.Methods.ByTag = {};

Object.extend(Element, Element.Methods);

if (!Prototype.BrowserFeatures.ElementExtensions &&
 document.createElement('div').__proto__) {
  window.HTMLElement = {};
  window.HTMLElement.prototype = document.createElement('div').__proto__;
  Prototype.BrowserFeatures.ElementExtensions = true;
}

Element.hasAttribute = function(element, attribute) {
  if (element.hasAttribute) return element.hasAttribute(attribute);
  return Element.Methods.Simulated.hasAttribute(element, attribute);
};

Element.addMethods = function(methods) {
  var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;

  if (!methods) {
    Object.extend(Form, Form.Methods);
    Object.extend(Form.Element, Form.Element.Methods);
    Object.extend(Element.Methods.ByTag, {
      "FORM":     Object.clone(Form.Methods),
      "INPUT":    Object.clone(Form.Element.Methods),
      "SELECT":   Object.clone(Form.Element.Methods),
      "TEXTAREA": Object.clone(Form.Element.Methods)
    });
  }

  if (arguments.length == 2) {
    var tagName = methods;
    methods = arguments[1];
  }

  if (!tagName) Object.extend(Element.Methods, methods || {});
  else {
    if (tagName.constructor == Array) tagName.each(extend);
    else extend(tagName);
  }

  function extend(tagName) {
    tagName = tagName.toUpperCase();
    if (!Element.Methods.ByTag[tagName])
      Element.Methods.ByTag[tagName] = {};
    Object.extend(Element.Methods.ByTag[tagName], methods);
  }

  function copy(methods, destination, onlyIfAbsent) {
    onlyIfAbsent = onlyIfAbsent || false;
    var cache = Element.extend.cache;
    for (var property in methods) {
      var value = methods[property];
      if (!onlyIfAbsent || !(property in destination))
        destination[property] = cache.findOrStore(value);
    }
  }

  function findDOMClass(tagName) {
    var klass;
    var trans = {
      "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph",
      "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
      "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
      "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote",
      "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":
      "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":
      "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
      "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":
      "FrameSet", "IFRAME": "IFrame"
    };
    if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName.capitalize() + 'Element';
    if (window[klass]) return window[klass];

    window[klass] = {};
    window[klass].prototype = document.createElement(tagName).__proto__;
    return window[klass];
  }

  if (F.ElementExtensions) {
    copy(Element.Methods, HTMLElement.prototype);
    copy(Element.Methods.Simulated, HTMLElement.prototype, true);
  }

  if (F.SpecificElementExtensions) {
    for (var tag in Element.Methods.ByTag) {
      var klass = findDOMClass(tag);
      if (typeof klass == "undefined") continue;
      copy(T[tag], klass.prototype);
    }
  }

  Object.extend(Element, Element.Methods);
  delete Element.ByTag;
};

var Toggle = { display: Element.toggle };

/*--------------------------------------------------------------------------*/

Abstract.Insertion = function(adjacency) {
  this.adjacency = adjacency;
}

Abstract.Insertion.prototype = {
  initialize: function(element, content) {
    this.element = $(element);
    this.content = content.stripScripts();

    if (this.adjacency && this.element.insertAdjacentHTML) {
      try {
        this.element.insertAdjacentHTML(this.adjacency, this.content);
      } catch (e) {
        var tagName = this.element.tagName.toUpperCase();
        if (['TBODY', 'TR'].include(tagName)) {
          this.insertContent(this.contentFromAnonymousTable());
        } else {
          throw e;
        }
      }
    } else {
      this.range = this.element.ownerDocument.createRange();
      if (this.initializeRange) this.initializeRange();
      this.insertContent([this.range.createContextualFragment(this.content)]);
    }

    setTimeout(function() {content.evalScripts()}, 10);
  },

  contentFromAnonymousTable: function() {
    var div = document.createElement('div');
    div.innerHTML = '<table><tbody>' + this.content + '</tbody></table>';
    return $A(div.childNodes[0].childNodes[0].childNodes);
  }
}

var Insertion = new Object();

Insertion.Before = Class.create();
Insertion.Before.prototype = Object.extend(new Abstract.Insertion('beforeBegin'), {
  initializeRange: function() {
    this.range.setStartBefore(this.element);
  },

  insertContent: function(fragments) {
    fragments.each((function(fragment) {
      this.element.parentNode.insertBefore(fragment, this.element);
    }).bind(this));
  }
});

Insertion.Top = Class.create();
Insertion.Top.prototype = Object.extend(new Abstract.Insertion('afterBegin'), {
  initializeRange: function() {
    this.range.selectNodeContents(this.element);
    this.range.collapse(true);
  },

  insertContent: function(fragments) {
    fragments.reverse(false).each((function(fragment) {
      this.element.insertBefore(fragment, this.element.firstChild);
    }).bind(this));
  }
});

Insertion.Bottom = Class.create();
Insertion.Bottom.prototype = Object.extend(new Abstract.Insertion('beforeEnd'), {
  initializeRange: function() {
    this.range.selectNodeContents(this.element);
    this.range.collapse(this.element);
  },

  insertContent: function(fragments) {
    fragments.each((function(fragment) {
      this.element.appendChild(fragment);
    }).bind(this));
  }
});

Insertion.After = Class.create();
Insertion.After.prototype = Object.extend(new Abstract.Insertion('afterEnd'), {
  initializeRange: function() {
    this.range.setStartAfter(this.element);
  },

  insertContent: function(fragments) {
    fragments.each((function(fragment) {
      this.element.parentNode.insertBefore(fragment,
        this.element.nextSibling);
    }).bind(this));
  }
});

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
  initialize: function(element) {
    this.element = $(element);
  },

  _each: function(iterator) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator);
  },

  set: function(className) {
    this.element.className = className;
  },

  add: function(classNameToAdd) {
    if (this.include(classNameToAdd)) return;
    this.set($A(this).concat(classNameToAdd).join(' '));
  },

  remove: function(classNameToRemove) {
    if (!this.include(classNameToRemove)) return;
    this.set($A(this).without(classNameToRemove).join(' '));
  },

  toString: function() {
    return $A(this).join(' ');
  }
};

Object.extend(Element.ClassNames.prototype, Enumerable);
/* Portions of the Selector class are derived from Jack Slocum’s DomQuery,
 * part of YUI-Ext version 0.40, distributed under the terms of an MIT-style
 * license.  Please see http://www.yui-ext.com/ for more information. */

var Selector = Class.create();

Selector.prototype = {
  initialize: function(expression) {
    this.expression = expression.strip();
    this.compileMatcher();
  },

  compileMatcher: function() {
    // Selectors with namespaced attributes can't use the XPath version
    if (Prototype.BrowserFeatures.XPath && !(/\[[\w-]*?:/).test(this.expression))
      return this.compileXPathMatcher();

    var e = this.expression, ps = Selector.patterns, h = Selector.handlers,
        c = Selector.criteria, le, p, m;

    if (Selector._cache[e]) {
      this.matcher = Selector._cache[e]; return;
    }
    this.matcher = ["this.matcher = function(root) {",
                    "var r = root, h = Selector.handlers, c = false, n;"];

    while (e && le != e && (/\S/).test(e)) {
      le = e;
      for (var i in ps) {
        p = ps[i];
        if (m = e.match(p)) {
          this.matcher.push(typeof c[i] == 'function' ? c[i](m) :
    	      new Template(c[i]).evaluate(m));
          e = e.replace(m[0], '');
          break;
        }
      }
    }

    this.matcher.push("return h.unique(n);\n}");
    eval(this.matcher.join('\n'));
    Selector._cache[this.expression] = this.matcher;
  },

  compileXPathMatcher: function() {
    var e = this.expression, ps = Selector.patterns,
        x = Selector.xpath, le,  m;

    if (Selector._cache[e]) {
      this.xpath = Selector._cache[e]; return;
    }

    this.matcher = ['.//*'];
    while (e && le != e && (/\S/).test(e)) {
      le = e;
      for (var i in ps) {
        if (m = e.match(ps[i])) {
          this.matcher.push(typeof x[i] == 'function' ? x[i](m) :
            new Template(x[i]).evaluate(m));
          e = e.replace(m[0], '');
          break;
        }
      }
    }

    this.xpath = this.matcher.join('');
    Selector._cache[this.expression] = this.xpath;
  },

  findElements: function(root) {
    root = root || document;
    if (this.xpath) return document._getElementsByXPath(this.xpath, root);
    return this.matcher(root);
  },

  match: function(element) {
    return this.findElements(document).include(element);
  },

  toString: function() {
    return this.expression;
  },

  inspect: function() {
    return "#<Selector:" + this.expression.inspect() + ">";
  }
};

Object.extend(Selector, {
  _cache: {},

  xpath: {
    descendant:   "//*",
    child:        "/*",
    adjacent:     "/following-sibling::*[1]",
    laterSibling: '/following-sibling::*',
    tagName:      function(m) {
      if (m[1] == '*') return '';
      return "[local-name()='" + m[1].toLowerCase() +
             "' or local-name()='" + m[1].toUpperCase() + "']";
    },
    className:    "[contains(concat(' ', @class, ' '), ' #{1} ')]",
    id:           "[@id='#{1}']",
    attrPresence: "[@#{1}]",
    attr: function(m) {
      m[3] = m[5] || m[6];
      return new Template(Selector.xpath.operators[m[2]]).evaluate(m);
    },
    pseudo: function(m) {
      var h = Selector.xpath.pseudos[m[1]];
      if (!h) return '';
      if (typeof h === 'function') return h(m);
      return new Template(Selector.xpath.pseudos[m[1]]).evaluate(m);
    },
    operators: {
      '=':  "[@#{1}='#{3}']",
      '!=': "[@#{1}!='#{3}']",
      '^=': "[starts-with(@#{1}, '#{3}')]",
      '$=': "[substring(@#{1}, (string-length(@#{1}) - string-length('#{3}') + 1))='#{3}']",
      '*=': "[contains(@#{1}, '#{3}')]",
      '~=': "[contains(concat(' ', @#{1}, ' '), ' #{3} ')]",
      '|=': "[contains(concat('-', @#{1}, '-'), '-#{3}-')]"
    },
    pseudos: {
      'first-child': '[not(preceding-sibling::*)]',
      'last-child':  '[not(following-sibling::*)]',
      'only-child':  '[not(preceding-sibling::* or following-sibling::*)]',
      'empty':       "[count(*) = 0 and (count(text()) = 0 or translate(text(), ' \t\r\n', '') = '')]",
      'checked':     "[@checked]",
      'disabled':    "[@disabled]",
      'enabled':     "[not(@disabled)]",
      'not': function(m) {
        var e = m[6], p = Selector.patterns,
            x = Selector.xpath, le, m, v;

        var exclusion = [];
        while (e && le != e && (/\S/).test(e)) {
          le = e;
          for (var i in p) {
            if (m = e.match(p[i])) {
              v = typeof x[i] == 'function' ? x[i](m) : new Template(x[i]).evaluate(m);
              exclusion.push("(" + v.substring(1, v.length - 1) + ")");
              e = e.replace(m[0], '');
              break;
            }
          }
        }
        return "[not(" + exclusion.join(" and ") + ")]";
      },
      'nth-child':      function(m) {
        return Selector.xpath.pseudos.nth("(count(./preceding-sibling::*) + 1) ", m);
      },
      'nth-last-child': function(m) {
        return Selector.xpath.pseudos.nth("(count(./following-sibling::*) + 1) ", m);
      },
      'nth-of-type':    function(m) {
        return Selector.xpath.pseudos.nth("position() ", m);
      },
      'nth-last-of-type': function(m) {
        return Selector.xpath.pseudos.nth("(last() + 1 - position()) ", m);
      },
      'first-of-type':  function(m) {
        m[6] = "1"; return Selector.xpath.pseudos['nth-of-type'](m);
      },
      'last-of-type':   function(m) {
        m[6] = "1"; return Selector.xpath.pseudos['nth-last-of-type'](m);
      },
      'only-of-type':   function(m) {
        var p = Selector.xpath.pseudos; return p['first-of-type'](m) + p['last-of-type'](m);
      },
      nth: function(fragment, m) {
        var mm, formula = m[6], predicate;
        if (formula == 'even') formula = '2n+0';
        if (formula == 'odd')  formula = '2n+1';
        if (mm = formula.match(/^(\d+)$/)) // digit only
          return '[' + fragment + "= " + mm[1] + ']';
        if (mm = formula.match(/^(-?\d*)?n(([+-])(\d+))?/)) { // an+b
          if (mm[1] == "-") mm[1] = -1;
          var a = mm[1] ? Number(mm[1]) : 1;
          var b = mm[2] ? Number(mm[2]) : 0;
          predicate = "[((#{fragment} - #{b}) mod #{a} = 0) and " +
          "((#{fragment} - #{b}) div #{a} >= 0)]";
          return new Template(predicate).evaluate({
            fragment: fragment, a: a, b: b });
        }
      }
    }
  },

  criteria: {
    tagName:      'n = h.tagName(n, r, "#{1}", c);   c = false;',
    className:    'n = h.className(n, r, "#{1}", c); c = false;',
    id:           'n = h.id(n, r, "#{1}", c);        c = false;',
    attrPresence: 'n = h.attrPresence(n, r, "#{1}"); c = false;',
    attr: function(m) {
      m[3] = (m[5] || m[6]);
      return new Template('n = h.attr(n, r, "#{1}", "#{3}", "#{2}"); c = false;').evaluate(m);
    },
    pseudo:       function(m) {
      if (m[6]) m[6] = m[6].replace(/"/g, '\\"');
      return new Template('n = h.pseudo(n, "#{1}", "#{6}", r, c); c = false;').evaluate(m);
    },
    descendant:   'c = "descendant";',
    child:        'c = "child";',
    adjacent:     'c = "adjacent";',
    laterSibling: 'c = "laterSibling";'
  },

  patterns: {
    // combinators must be listed first
    // (and descendant needs to be last combinator)
    laterSibling: /^\s*~\s*/,
    child:        /^\s*>\s*/,
    adjacent:     /^\s*\+\s*/,
    descendant:   /^\s/,

    // selectors follow
    tagName:      /^\s*(\*|[\w\-]+)(\b|$)?/,
    id:           /^#([\w\-\*]+)(\b|$)/,
    className:    /^\.([\w\-\*]+)(\b|$)/,
    pseudo:       /^:((first|last|nth|nth-last|only)(-child|-of-type)|empty|checked|(en|dis)abled|not)(\((.*?)\))?(\b|$|\s|(?=:))/,
    attrPresence: /^\[([\w]+)\]/,
    attr:         /\[((?:[\w-]*:)?[\w-]+)\s*(?:([!^$*~|]?=)\s*((['"])([^\]]*?)\4|([^'"][^\]]*?)))?\]/
  },

  handlers: {
    // UTILITY FUNCTIONS
    // joins two collections
    concat: function(a, b) {
      for (var i = 0, node; node = b[i]; i++)
        a.push(node);
      return a;
    },

    // marks an array of nodes for counting
    mark: function(nodes) {
      for (var i = 0, node; node = nodes[i]; i++)
        node._counted = true;
      return nodes;
    },

    unmark: function(nodes) {
      for (var i = 0, node; node = nodes[i]; i++)
        node._counted = undefined;
      return nodes;
    },

    // mark each child node with its position (for nth calls)
    // "ofType" flag indicates whether we're indexing for nth-of-type
    // rather than nth-child
    index: function(parentNode, reverse, ofType) {
      parentNode._counted = true;
      if (reverse) {
        for (var nodes = parentNode.childNodes, i = nodes.length - 1, j = 1; i >= 0; i--) {
          node = nodes[i];
          if (node.nodeType == 1 && (!ofType || node._counted)) node.nodeIndex = j++;
        }
      } else {
        for (var i = 0, j = 1, nodes = parentNode.childNodes; node = nodes[i]; i++)
          if (node.nodeType == 1 && (!ofType || node._counted)) node.nodeIndex = j++;
      }
    },

    // filters out duplicates and extends all nodes
    unique: function(nodes) {
      if (nodes.length == 0) return nodes;
      var results = [], n;
      for (var i = 0, l = nodes.length; i < l; i++)
        if (!(n = nodes[i])._counted) {
          n._counted = true;
          results.push(Element.extend(n));
        }
      return Selector.handlers.unmark(results);
    },

    // COMBINATOR FUNCTIONS
    descendant: function(nodes) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        h.concat(results, node.getElementsByTagName('*'));
      return results;
    },

    child: function(nodes) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        for (var j = 0, children = [], child; child = node.childNodes[j]; j++)
          if (child.nodeType == 1 && child.tagName != '!') results.push(child);
      }
      return results;
    },

    adjacent: function(nodes) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        var next = this.nextElementSibling(node);
        if (next) results.push(next);
      }
      return results;
    },

    laterSibling: function(nodes) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        h.concat(results, Element.nextSiblings(node));
      return results;
    },

    nextElementSibling: function(node) {
      while (node = node.nextSibling)
	      if (node.nodeType == 1) return node;
      return null;
    },

    previousElementSibling: function(node) {
      while (node = node.previousSibling)
        if (node.nodeType == 1) return node;
      return null;
    },

    // TOKEN FUNCTIONS
    tagName: function(nodes, root, tagName, combinator) {
      tagName = tagName.toUpperCase();
      var results = [], h = Selector.handlers;
      if (nodes) {
        if (combinator) {
          // fastlane for ordinary descendant combinators
          if (combinator == "descendant") {
            for (var i = 0, node; node = nodes[i]; i++)
              h.concat(results, node.getElementsByTagName(tagName));
            return results;
          } else nodes = this[combinator](nodes);
          if (tagName == "*") return nodes;
        }
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.tagName.toUpperCase() == tagName) results.push(node);
        return results;
      } else return root.getElementsByTagName(tagName);
    },

    id: function(nodes, root, id, combinator) {
      var targetNode = $(id), h = Selector.handlers;
      if (!nodes && root == document) return targetNode ? [targetNode] : [];
      if (nodes) {
        if (combinator) {
          if (combinator == 'child') {
            for (var i = 0, node; node = nodes[i]; i++)
              if (targetNode.parentNode == node) return [targetNode];
          } else if (combinator == 'descendant') {
            for (var i = 0, node; node = nodes[i]; i++)
              if (Element.descendantOf(targetNode, node)) return [targetNode];
          } else if (combinator == 'adjacent') {
            for (var i = 0, node; node = nodes[i]; i++)
              if (Selector.handlers.previousElementSibling(targetNode) == node)
                return [targetNode];
          } else nodes = h[combinator](nodes);
        }
        for (var i = 0, node; node = nodes[i]; i++)
          if (node == targetNode) return [targetNode];
        return [];
      }
      return (targetNode && Element.descendantOf(targetNode, root)) ? [targetNode] : [];
    },

    className: function(nodes, root, className, combinator) {
      if (nodes && combinator) nodes = this[combinator](nodes);
      return Selector.handlers.byClassName(nodes, root, className);
    },

    byClassName: function(nodes, root, className) {
      if (!nodes) nodes = Selector.handlers.descendant([root]);
      var needle = ' ' + className + ' ';
      for (var i = 0, results = [], node, nodeClassName; node = nodes[i]; i++) {
        nodeClassName = node.className;
        if (nodeClassName.length == 0) continue;
        if (nodeClassName == className || (' ' + nodeClassName + ' ').include(needle))
          results.push(node);
      }
      return results;
    },

    attrPresence: function(nodes, root, attr) {
      var results = [];
      for (var i = 0, node; node = nodes[i]; i++)
        if (Element.hasAttribute(node, attr)) results.push(node);
      return results;
    },

    attr: function(nodes, root, attr, value, operator) {
      if (!nodes) nodes = root.getElementsByTagName("*");
      var handler = Selector.operators[operator], results = [];
      for (var i = 0, node; node = nodes[i]; i++) {
        var nodeValue = Element.readAttribute(node, attr);
        if (nodeValue === null) continue;
        if (handler(nodeValue, value)) results.push(node);
      }
      return results;
    },

    pseudo: function(nodes, name, value, root, combinator) {
      if (nodes && combinator) nodes = this[combinator](nodes);
      if (!nodes) nodes = root.getElementsByTagName("*");
      return Selector.pseudos[name](nodes, value, root);
    }
  },

  pseudos: {
    'first-child': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        if (Selector.handlers.previousElementSibling(node)) continue;
          results.push(node);
      }
      return results;
    },
    'last-child': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        if (Selector.handlers.nextElementSibling(node)) continue;
          results.push(node);
      }
      return results;
    },
    'only-child': function(nodes, value, root) {
      var h = Selector.handlers;
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (!h.previousElementSibling(node) && !h.nextElementSibling(node))
          results.push(node);
      return results;
    },
    'nth-child':        function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root);
    },
    'nth-last-child':   function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root, true);
    },
    'nth-of-type':      function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root, false, true);
    },
    'nth-last-of-type': function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, formula, root, true, true);
    },
    'first-of-type':    function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, "1", root, false, true);
    },
    'last-of-type':     function(nodes, formula, root) {
      return Selector.pseudos.nth(nodes, "1", root, true, true);
    },
    'only-of-type':     function(nodes, formula, root) {
      var p = Selector.pseudos;
      return p['last-of-type'](p['first-of-type'](nodes, formula, root), formula, root);
    },

    // handles the an+b logic
    getIndices: function(a, b, total) {
      if (a == 0) return b > 0 ? [b] : [];
      return $R(1, total).inject([], function(memo, i) {
        if (0 == (i - b) % a && (i - b) / a >= 0) memo.push(i);
        return memo;
      });
    },

    // handles nth(-last)-child, nth(-last)-of-type, and (first|last)-of-type
    nth: function(nodes, formula, root, reverse, ofType) {
      if (nodes.length == 0) return [];
      if (formula == 'even') formula = '2n+0';
      if (formula == 'odd')  formula = '2n+1';
      var h = Selector.handlers, results = [], indexed = [], m;
      h.mark(nodes);
      for (var i = 0, node; node = nodes[i]; i++) {
        if (!node.parentNode._counted) {
          h.index(node.parentNode, reverse, ofType);
          indexed.push(node.parentNode);
        }
      }
      if (formula.match(/^\d+$/)) { // just a number
        formula = Number(formula);
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.nodeIndex == formula) results.push(node);
      } else if (m = formula.match(/^(-?\d*)?n(([+-])(\d+))?/)) { // an+b
        if (m[1] == "-") m[1] = -1;
        var a = m[1] ? Number(m[1]) : 1;
        var b = m[2] ? Number(m[2]) : 0;
        var indices = Selector.pseudos.getIndices(a, b, nodes.length);
        for (var i = 0, node, l = indices.length; node = nodes[i]; i++) {
          for (var j = 0; j < l; j++)
            if (node.nodeIndex == indices[j]) results.push(node);
        }
      }
      h.unmark(nodes);
      h.unmark(indexed);
      return results;
    },

    'empty': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++) {
        // IE treats comments as element nodes
        if (node.tagName == '!' || (node.firstChild && !node.innerHTML.match(/^\s*$/))) continue;
        results.push(node);
      }
      return results;
    },

    'not': function(nodes, selector, root) {
      var h = Selector.handlers, selectorType, m;
      var exclusions = new Selector(selector).findElements(root);
      h.mark(exclusions);
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (!node._counted) results.push(node);
      h.unmark(exclusions);
      return results;
    },

    'enabled': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (!node.disabled) results.push(node);
      return results;
    },

    'disabled': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (node.disabled) results.push(node);
      return results;
    },

    'checked': function(nodes, value, root) {
      for (var i = 0, results = [], node; node = nodes[i]; i++)
        if (node.checked) results.push(node);
      return results;
    }
  },

  operators: {
    '=':  function(nv, v) { return nv == v; },
    '!=': function(nv, v) { return nv != v; },
    '^=': function(nv, v) { return nv.startsWith(v); },
    '$=': function(nv, v) { return nv.endsWith(v); },
    '*=': function(nv, v) { return nv.include(v); },
    '~=': function(nv, v) { return (' ' + nv + ' ').include(' ' + v + ' '); },
    '|=': function(nv, v) { return ('-' + nv.toUpperCase() + '-').include('-' + v.toUpperCase() + '-'); }
  },

  matchElements: function(elements, expression) {
    var matches = new Selector(expression).findElements(), h = Selector.handlers;
    h.mark(matches);
    for (var i = 0, results = [], element; element = elements[i]; i++)
      if (element._counted) results.push(element);
    h.unmark(matches);
    return results;
  },

  findElement: function(elements, expression, index) {
    if (typeof expression == 'number') {
      index = expression; expression = false;
    }
    return Selector.matchElements(elements, expression || '*')[index || 0];
  },

  findChildElements: function(element, expressions) {
    var exprs = expressions.join(','), expressions = [];
    exprs.scan(/(([\w#:.~>+()\s-]+|\*|\[.*?\])+)\s*(,|$)/, function(m) {
      expressions.push(m[1].strip());
    });
    var results = [], h = Selector.handlers;
    for (var i = 0, l = expressions.length, selector; i < l; i++) {
      selector = new Selector(expressions[i].strip());
      h.concat(results, selector.findElements(element));
    }
    return (l > 1) ? h.unique(results) : results;
  }
});

function $$() {
  return Selector.findChildElements(document, $A(arguments));
}
var Form = {
  reset: function(form) {
    $(form).reset();
    return form;
  },

  serializeElements: function(elements, getHash) {
    var data = elements.inject({}, function(result, element) {
      if (!element.disabled && element.name) {
        var key = element.name, value = $(element).getValue();
        if (value != null) {
         	if (key in result) {
            if (result[key].constructor != Array) result[key] = [result[key]];
            result[key].push(value);
          }
          else result[key] = value;
        }
      }
      return result;
    });

    return getHash ? data : Hash.toQueryString(data);
  }
};

Form.Methods = {
  serialize: function(form, getHash) {
    return Form.serializeElements(Form.getElements(form), getHash);
  },

  getElements: function(form) {
    return $A($(form).getElementsByTagName('*')).inject([],
      function(elements, child) {
        if (Form.Element.Serializers[child.tagName.toLowerCase()])
          elements.push(Element.extend(child));
        return elements;
      }
    );
  },

  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name) return $A(inputs).map(Element.extend);

    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  disable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('disable');
    return form;
  },

  enable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('enable');
    return form;
  },

  findFirstElement: function(form) {
    return $(form).getElements().find(function(element) {
      return element.type != 'hidden' && !element.disabled &&
        ['input', 'select', 'textarea'].include(element.tagName.toLowerCase());
    });
  },

  focusFirstElement: function(form) {
    form = $(form);
    form.findFirstElement().activate();
    return form;
  },

  request: function(form, options) {
    form = $(form), options = Object.clone(options || {});

    var params = options.parameters;
    options.parameters = form.serialize(true);

    if (params) {
      if (typeof params == 'string') params = params.toQueryParams();
      Object.extend(options.parameters, params);
    }

    if (form.hasAttribute('method') && !options.method)
      options.method = form.method;

    return new Ajax.Request(form.readAttribute('action'), options);
  }
}

/*--------------------------------------------------------------------------*/

Form.Element = {
  focus: function(element) {
    $(element).focus();
    return element;
  },

  select: function(element) {
    $(element).select();
    return element;
  }
}

Form.Element.Methods = {
  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = {};
        pair[element.name] = value;
        return Hash.toQueryString(pair);
      }
    }
    return '';
  },

  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  clear: function(element) {
    $(element).value = '';
    return element;
  },

  present: function(element) {
    return $(element).value != '';
  },

  activate: function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && (element.tagName.toLowerCase() != 'input' ||
        !['button', 'reset', 'submit'].include(element.type)))
        element.select();
    } catch (e) {}
    return element;
  },

  disable: function(element) {
    element = $(element);
    element.blur();
    element.disabled = true;
    return element;
  },

  enable: function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }
}

/*--------------------------------------------------------------------------*/

var Field = Form.Element;
var $F = Form.Element.Methods.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = {
  input: function(element) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return Form.Element.Serializers.inputSelector(element);
      default:
        return Form.Element.Serializers.textarea(element);
    }
  },

  inputSelector: function(element) {
    return element.checked ? element.value : null;
  },

  textarea: function(element) {
    return element.value;
  },

  select: function(element) {
    return this[element.type == 'select-one' ?
      'selectOne' : 'selectMany'](element);
  },

  selectOne: function(element) {
    var index = element.selectedIndex;
    return index >= 0 ? this.optionValue(element.options[index]) : null;
  },

  selectMany: function(element) {
    var values, length = element.length;
    if (!length) return null;

    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(this.optionValue(opt));
    }
    return values;
  },

  optionValue: function(opt) {
    // extend element because hasAttribute may not be native
    return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
  }
}

/*--------------------------------------------------------------------------*/

Abstract.TimedObserver = function() {}
Abstract.TimedObserver.prototype = {
  initialize: function(element, frequency, callback) {
    this.frequency = frequency;
    this.element   = $(element);
    this.callback  = callback;

    this.lastValue = this.getValue();
    this.registerCallback();
  },

  registerCallback: function() {
    setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  onTimerEvent: function() {
    var value = this.getValue();
    var changed = ('string' == typeof this.lastValue && 'string' == typeof value
      ? this.lastValue != value : String(this.lastValue) != String(value));
    if (changed) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
}

Form.Element.Observer = Class.create();
Form.Element.Observer.prototype = Object.extend(new Abstract.TimedObserver(), {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create();
Form.Observer.prototype = Object.extend(new Abstract.TimedObserver(), {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = function() {}
Abstract.EventObserver.prototype = {
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback.bind(this));
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
}

Form.Element.EventObserver = Class.create();
Form.Element.EventObserver.prototype = Object.extend(new Abstract.EventObserver(), {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create();
Form.EventObserver.prototype = Object.extend(new Abstract.EventObserver(), {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
if (!window.Event) {
  var Event = new Object();
}

Object.extend(Event, {
  KEY_BACKSPACE: 8,
  KEY_TAB:       9,
  KEY_RETURN:   13,
  KEY_ESC:      27,
  KEY_LEFT:     37,
  KEY_UP:       38,
  KEY_RIGHT:    39,
  KEY_DOWN:     40,
  KEY_DELETE:   46,
  KEY_HOME:     36,
  KEY_END:      35,
  KEY_PAGEUP:   33,
  KEY_PAGEDOWN: 34,

  element: function(event) {
    return $(event.target || event.srcElement);
  },

  isLeftClick: function(event) {
    return (((event.which) && (event.which == 1)) ||
            ((event.button) && (event.button == 1)));
  },

  pointerX: function(event) {
    return event.pageX || (event.clientX +
      (document.documentElement.scrollLeft || document.body.scrollLeft));
  },

  pointerY: function(event) {
    return event.pageY || (event.clientY +
      (document.documentElement.scrollTop || document.body.scrollTop));
  },

  stop: function(event) {
    if (event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.returnValue = false;
      event.cancelBubble = true;
    }
  },

  // find the first node with the given tagName, starting from the
  // node the event was triggered on; traverses the DOM upwards
  findElement: function(event, tagName) {
    var element = Event.element(event);
    while (element.parentNode && (!element.tagName ||
        (element.tagName.toUpperCase() != tagName.toUpperCase())))
      element = element.parentNode;
    return element;
  },

  observers: false,

  _observeAndCache: function(element, name, observer, useCapture) {
    if (!this.observers) this.observers = [];
    if (element.addEventListener) {
      this.observers.push([element, name, observer, useCapture]);
      element.addEventListener(name, observer, useCapture);
    } else if (element.attachEvent) {
      this.observers.push([element, name, observer, useCapture]);
      element.attachEvent('on' + name, observer);
    }
  },

  unloadCache: function() {
    if (!Event.observers) return;
    for (var i = 0, length = Event.observers.length; i < length; i++) {
      Event.stopObserving.apply(this, Event.observers[i]);
      Event.observers[i][0] = null;
    }
    Event.observers = false;
  },

  observe: function(element, name, observer, useCapture) {
    element = $(element);
    useCapture = useCapture || false;

    if (name == 'keypress' &&
      (Prototype.Browser.WebKit || element.attachEvent))
      name = 'keydown';

    Event._observeAndCache(element, name, observer, useCapture);
  },

  stopObserving: function(element, name, observer, useCapture) {
    element = $(element);
    useCapture = useCapture || false;

    if (name == 'keypress' &&
        (Prototype.Browser.WebKit || element.attachEvent))
      name = 'keydown';

    if (element.removeEventListener) {
      element.removeEventListener(name, observer, useCapture);
    } else if (element.detachEvent) {
      try {
        element.detachEvent('on' + name, observer);
      } catch (e) {}
    }
  }
});

/* prevent memory leaks in IE */
if (Prototype.Browser.IE)
  Event.observe(window, 'unload', Event.unloadCache, false);
var Position = {
  // set to true if needed, warning: firefox performance problems
  // NOT neeeded for page scrolling, only if draggable contained in
  // scrollable elements
  includeScrollOffsets: false,

  // must be called before calling withinIncludingScrolloffset, every time the
  // page is scrolled
  prepare: function() {
    this.deltaX =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    this.deltaY =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
  },

  realOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return [valueL, valueT];
  },

  cumulativeOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    return [valueL, valueT];
  },

  positionedOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        if(element.tagName=='BODY') break;
        var p = Element.getStyle(element, 'position');
        if (p == 'relative' || p == 'absolute') break;
      }
    } while (element);
    return [valueL, valueT];
  },

  offsetParent: function(element) {
    if (element.offsetParent) return element.offsetParent;
    if (element == document.body) return element;

    while ((element = element.parentNode) && element != document.body)
      if (Element.getStyle(element, 'position') != 'static')
        return element;

    return document.body;
  },

  // caches x/y coordinate pair to use with overlap
  within: function(element, x, y) {
    if (this.includeScrollOffsets)
      return this.withinIncludingScrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    this.offset = this.cumulativeOffset(element);

    return (y >= this.offset[1] &&
            y <  this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x <  this.offset[0] + element.offsetWidth);
  },

  withinIncludingScrolloffsets: function(element, x, y) {
    var offsetcache = this.realOffset(element);

    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = this.cumulativeOffset(element);

    return (this.ycomp >= this.offset[1] &&
            this.ycomp <  this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp <  this.offset[0] + element.offsetWidth);
  },

  // within must be called directly before
  overlap: function(mode, element) {
    if (!mode) return 0;
    if (mode == 'vertical')
      return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
    if (mode == 'horizontal')
      return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
  },

  page: function(forElement) {
    var valueT = 0, valueL = 0;

    var element = forElement;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;

      // Safari fix
      if (element.offsetParent == document.body)
        if (Element.getStyle(element,'position')=='absolute') break;

    } while (element = element.offsetParent);

    element = forElement;
    do {
      if (!window.opera || element.tagName=='BODY') {
        valueT -= element.scrollTop  || 0;
        valueL -= element.scrollLeft || 0;
      }
    } while (element = element.parentNode);

    return [valueL, valueT];
  },

  clone: function(source, target) {
    var options = Object.extend({
      setLeft:    true,
      setTop:     true,
      setWidth:   true,
      setHeight:  true,
      offsetTop:  0,
      offsetLeft: 0
    }, arguments[2] || {})

    // find page position of source
    source = $(source);
    var p = Position.page(source);

    // find coordinate system to use
    target = $(target);
    var delta = [0, 0];
    var parent = null;
    // delta [0,0] will do fine with position: fixed elements,
    // position:absolute needs offsetParent deltas
    if (Element.getStyle(target,'position') == 'absolute') {
      parent = Position.offsetParent(target);
      delta = Position.page(parent);
    }

    // correct by body offsets (fixes Safari)
    if (parent == document.body) {
      delta[0] -= document.body.offsetLeft;
      delta[1] -= document.body.offsetTop;
    }

    // set position
    if(options.setLeft)   target.style.left  = (p[0] - delta[0] + options.offsetLeft) + 'px';
    if(options.setTop)    target.style.top   = (p[1] - delta[1] + options.offsetTop) + 'px';
    if(options.setWidth)  target.style.width = source.offsetWidth + 'px';
    if(options.setHeight) target.style.height = source.offsetHeight + 'px';
  },

  absolutize: function(element) {
    element = $(element);
    if (element.style.position == 'absolute') return;
    Position.prepare();

    var offsets = Position.positionedOffset(element);
    var top     = offsets[1];
    var left    = offsets[0];
    var width   = element.clientWidth;
    var height  = element.clientHeight;

    element._originalLeft   = left - parseFloat(element.style.left  || 0);
    element._originalTop    = top  - parseFloat(element.style.top || 0);
    element._originalWidth  = element.style.width;
    element._originalHeight = element.style.height;

    element.style.position = 'absolute';
    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.width  = width + 'px';
    element.style.height = height + 'px';
  },

  relativize: function(element) {
    element = $(element);
    if (element.style.position == 'relative') return;
    Position.prepare();

    element.style.position = 'relative';
    var top  = parseFloat(element.style.top  || 0) - (element._originalTop || 0);
    var left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.height = element._originalHeight;
    element.style.width  = element._originalWidth;
  }
}

// Safari returns margins on body which is incorrect if the child is absolutely
// positioned.  For performance reasons, redefine Position.cumulativeOffset for
// KHTML/WebKit only.
if (Prototype.Browser.WebKit) {
  Position.cumulativeOffset = function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == document.body)
        if (Element.getStyle(element, 'position') == 'absolute') break;

      element = element.offsetParent;
    } while (element);

    return [valueL, valueT];
  }
}

Element.addMethods();


/**
 * ====================================================================
 * About
 * ====================================================================
 * Sarissa is an ECMAScript library acting as a cross-browser wrapper for native XML APIs.
 * The library supports Gecko based browsers like Mozilla and Firefox,
 * Internet Explorer (5.5+ with MSXML3.0+), Konqueror, Safari and a little of Opera
 * @version ${project.version}
 * @author: Manos Batsis, mailto: mbatsis at users full stop sourceforge full stop net
 * ====================================================================
 * Licence
 * ====================================================================
 * Sarissa is free software distributed under the GNU GPL version 2 (see <a href="gpl.txt">gpl.txt</a>) or higher, 
 * GNU LGPL version 2.1 (see <a href="lgpl.txt">lgpl.txt</a>) or higher and Apache Software License 2.0 or higher 
 * (see <a href="asl.txt">asl.txt</a>). This means you can choose one of the three and use that if you like. If 
 * you make modifications under the ASL, i would appreciate it if you submitted those.
 * In case your copy of Sarissa does not include the license texts, you may find
 * them online in various formats at <a href="http://www.gnu.org">http://www.gnu.org</a> and 
 * <a href="http://www.apache.org">http://www.apache.org</a>.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY 
 * KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
 * WARRANTIES OF MERCHANTABILITY,FITNESS FOR A PARTICULAR PURPOSE 
 * AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/**
 * <p>Sarissa is a utility class. Provides "static" methods for DOMDocument, 
 * DOM Node serialization to XML strings and other utility goodies.</p>
 * @constructor
 */
function Sarissa(){};
Sarissa.VERSION = "${project.version}";
Sarissa.PARSED_OK = "Document contains no parsing errors";
Sarissa.PARSED_EMPTY = "Document is empty";
Sarissa.PARSED_UNKNOWN_ERROR = "Not well-formed or other error";
Sarissa.IS_ENABLED_TRANSFORM_NODE = false;
var _sarissa_iNsCounter = 0;
var _SARISSA_IEPREFIX4XSLPARAM = "";
var _SARISSA_HAS_DOM_IMPLEMENTATION = document.implementation && true;
var _SARISSA_HAS_DOM_CREATE_DOCUMENT = _SARISSA_HAS_DOM_IMPLEMENTATION && document.implementation.createDocument;
var _SARISSA_HAS_DOM_FEATURE = _SARISSA_HAS_DOM_IMPLEMENTATION && document.implementation.hasFeature;
var _SARISSA_IS_MOZ = _SARISSA_HAS_DOM_CREATE_DOCUMENT && _SARISSA_HAS_DOM_FEATURE;
var _SARISSA_IS_SAFARI = (navigator.userAgent && navigator.vendor && (navigator.userAgent.toLowerCase().indexOf("applewebkit") != -1 || navigator.vendor.indexOf("Apple") != -1));
var _SARISSA_IS_IE = document.all && window.ActiveXObject && navigator.userAgent.toLowerCase().indexOf("msie") > -1  && navigator.userAgent.toLowerCase().indexOf("opera") == -1;
if(!window.Node || !Node.ELEMENT_NODE){
    Node = {ELEMENT_NODE: 1, ATTRIBUTE_NODE: 2, TEXT_NODE: 3, CDATA_SECTION_NODE: 4, ENTITY_REFERENCE_NODE: 5,  ENTITY_NODE: 6, PROCESSING_INSTRUCTION_NODE: 7, COMMENT_NODE: 8, DOCUMENT_NODE: 9, DOCUMENT_TYPE_NODE: 10, DOCUMENT_FRAGMENT_NODE: 11, NOTATION_NODE: 12};
};

if(typeof XMLDocument == "undefined" && typeof Document !="undefined"){ XMLDocument = Document; } 

// IE initialization
if(_SARISSA_IS_IE){
    // for XSLT parameter names, prefix needed by IE
    _SARISSA_IEPREFIX4XSLPARAM = "xsl:";
    // used to store the most recent ProgID available out of the above
    var _SARISSA_DOM_PROGID = "";
    var _SARISSA_XMLHTTP_PROGID = "";
    var _SARISSA_DOM_XMLWRITER = "";
    /**
     * Called when the Sarissa_xx.js file is parsed, to pick most recent
     * ProgIDs for IE, then gets destroyed.
     * @private
     * @param idList an array of MSXML PROGIDs from which the most recent will be picked for a given object
     * @param enabledList an array of arrays where each array has two items; the index of the PROGID for which a certain feature is enabled
     */
    Sarissa.pickRecentProgID = function (idList){
        // found progID flag
        var bFound = false;
        for(var i=0; i < idList.length && !bFound; i++){
            try{
                var oDoc = new ActiveXObject(idList[i]);
                o2Store = idList[i];
                bFound = true;
            }catch (objException){
                // trap; try next progID
            };
        };
        if (!bFound) {
            throw "Could not retreive a valid progID of Class: " + idList[idList.length-1]+". (original exception: "+e+")";
        };
        idList = null;
        return o2Store;
    };
    // pick best available MSXML progIDs
    _SARISSA_DOM_PROGID = null;
    _SARISSA_THREADEDDOM_PROGID = null;
    _SARISSA_XSLTEMPLATE_PROGID = null;
    _SARISSA_XMLHTTP_PROGID = null;
    if(!window.XMLHttpRequest){
        /**
         * Emulate XMLHttpRequest
         * @constructor
         */
        XMLHttpRequest = function() {
            if(!_SARISSA_XMLHTTP_PROGID){
                _SARISSA_XMLHTTP_PROGID = Sarissa.pickRecentProgID(["MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"]);
            };
            return new ActiveXObject(_SARISSA_XMLHTTP_PROGID);
        };
    };
    // we dont need this anymore
    //============================================
    // Factory methods (IE)
    //============================================
    // see non-IE version
    Sarissa.getDomDocument = function(sUri, sName){
        if(!_SARISSA_DOM_PROGID){
            _SARISSA_DOM_PROGID = Sarissa.pickRecentProgID(["Msxml2.DOMDocument.3.0", "MSXML2.DOMDocument", "MSXML.DOMDocument", "Microsoft.XMLDOM"]);
        };
        var oDoc = new ActiveXObject(_SARISSA_DOM_PROGID);
        // if a root tag name was provided, we need to load it in the DOM object
        if (sName){
            // create an artifical namespace prefix 
            // or reuse existing prefix if applicable
            var prefix = "";
            if(sUri){
                if(sName.indexOf(":") > 1){
                    prefix = sName.substring(0, sName.indexOf(":"));
                    sName = sName.substring(sName.indexOf(":")+1); 
                }else{
                    prefix = "a" + (_sarissa_iNsCounter++);
                };
            };
            // use namespaces if a namespace URI exists
            if(sUri){
                oDoc.loadXML('<' + prefix+':'+sName + " xmlns:" + prefix + "=\"" + sUri + "\"" + " />");
            } else {
                oDoc.loadXML('<' + sName + " />");
            };
        };
        return oDoc;
    };
    // see non-IE version   
    Sarissa.getParseErrorText = function (oDoc) {
        var parseErrorText = Sarissa.PARSED_OK;
        if(oDoc && oDoc.parseError && oDoc.parseError.errorCode && oDoc.parseError.errorCode != 0){
            parseErrorText = "XML Parsing Error: " + oDoc.parseError.reason + 
                "\nLocation: " + oDoc.parseError.url + 
                "\nLine Number " + oDoc.parseError.line + ", Column " + 
                oDoc.parseError.linepos + 
                ":\n" + oDoc.parseError.srcText +
                "\n";
            for(var i = 0;  i < oDoc.parseError.linepos;i++){
                parseErrorText += "-";
            };
            parseErrorText +=  "^\n";
        }
        else if(oDoc.documentElement == null){
            parseErrorText = Sarissa.PARSED_EMPTY;
        };
        return parseErrorText;
    };
    // see non-IE version
    Sarissa.setXpathNamespaces = function(oDoc, sNsSet) {
        oDoc.setProperty("SelectionLanguage", "XPath");
        oDoc.setProperty("SelectionNamespaces", sNsSet);
    };   
    /**
     * Basic implementation of Mozilla's XSLTProcessor for IE. 
     * Reuses the same XSLT stylesheet for multiple transforms
     * @constructor
     */
    XSLTProcessor = function(){
        if(!_SARISSA_XSLTEMPLATE_PROGID){
            _SARISSA_XSLTEMPLATE_PROGID = Sarissa.pickRecentProgID(["MSXML2.XSLTemplate.3.0"]);
        };
        this.template = new ActiveXObject(_SARISSA_XSLTEMPLATE_PROGID);
        this.processor = null;
    };
    /**
     * Imports the given XSLT DOM and compiles it to a reusable transform
     * <b>Note:</b> If the stylesheet was loaded from a URL and contains xsl:import or xsl:include elements,it will be reloaded to resolve those
     * @argument xslDoc The XSLT DOMDocument to import
     */
    XSLTProcessor.prototype.importStylesheet = function(xslDoc){
        if(!_SARISSA_THREADEDDOM_PROGID){
            _SARISSA_THREADEDDOM_PROGID = Sarissa.pickRecentProgID(["MSXML2.FreeThreadedDOMDocument.3.0"]);
        };
        xslDoc.setProperty("SelectionLanguage", "XPath");
        xslDoc.setProperty("SelectionNamespaces", "xmlns:xsl='http://www.w3.org/1999/XSL/Transform'");
        // convert stylesheet to free threaded
        var converted = new ActiveXObject(_SARISSA_THREADEDDOM_PROGID);
        // make included/imported stylesheets work if exist and xsl was originally loaded from url
        if(xslDoc.url && xslDoc.selectSingleNode("//xsl:*[local-name() = 'import' or local-name() = 'include']") != null){
            converted.async = false;
            if (_SARISSA_THREADEDDOM_PROGID == "MSXML2.FreeThreadedDOMDocument.6.0") { 
                converted.setProperty("AllowDocumentFunction", true); 
                converted.resolveExternals = true; 
            }
            converted.load(xslDoc.url);
        } else {
            converted.loadXML(xslDoc.xml);
        };
        converted.setProperty("SelectionNamespaces", "xmlns:xsl='http://www.w3.org/1999/XSL/Transform'");
        var output = converted.selectSingleNode("//xsl:output");
        this.outputMethod = output ? output.getAttribute("method") : "html";
        this.template.stylesheet = converted;
        this.processor = this.template.createProcessor();
        // for getParameter and clearParameters
        this.paramsSet = new Array();
    };

    /**
     * Transform the given XML DOM and return the transformation result as a new DOM document
     * @argument sourceDoc The XML DOMDocument to transform
     * @return The transformation result as a DOM Document
     */
    XSLTProcessor.prototype.transformToDocument = function(sourceDoc){
        // fix for bug 1549749
        if(_SARISSA_THREADEDDOM_PROGID){
            this.processor.input=sourceDoc;
            var outDoc=new ActiveXObject(_SARISSA_DOM_PROGID);
            this.processor.output=outDoc;
            this.processor.transform();
            return outDoc;
        }
        else{
            if(!_SARISSA_DOM_XMLWRITER){
                _SARISSA_DOM_XMLWRITER = Sarissa.pickRecentProgID(["Msxml2.MXXMLWriter.3.0", "MSXML2.MXXMLWriter", "MSXML.MXXMLWriter", "Microsoft.XMLDOM"]);
            };
            this.processor.input = sourceDoc;
            var outDoc = new ActiveXObject(_SARISSA_DOM_XMLWRITER);
            this.processor.output = outDoc; 
            this.processor.transform();
            var oDoc = new ActiveXObject(_SARISSA_DOM_PROGID);
            oDoc.loadXML(outDoc.output+"");
            return oDoc;
        };
    };
    
    /**
     * Transform the given XML DOM and return the transformation result as a new DOM fragment.
     * <b>Note</b>: The xsl:output method must match the nature of the owner document (XML/HTML).
     * @argument sourceDoc The XML DOMDocument to transform
     * @argument ownerDoc The owner of the result fragment
     * @return The transformation result as a DOM Document
     */
    XSLTProcessor.prototype.transformToFragment = function (sourceDoc, ownerDoc) {
        this.processor.input = sourceDoc;
        this.processor.transform();
        var s = this.processor.output;
        var f = ownerDoc.createDocumentFragment();
        if (this.outputMethod == 'text') {
            f.appendChild(ownerDoc.createTextNode(s));
        } else if (ownerDoc.body && ownerDoc.body.innerHTML) {
            var container = ownerDoc.createElement('div');
            container.innerHTML = s;
            while (container.hasChildNodes()) {
                f.appendChild(container.firstChild);
            }
        }
        else {
            var oDoc = new ActiveXObject(_SARISSA_DOM_PROGID);
            if (s.substring(0, 5) == '<?xml') {
                s = s.substring(s.indexOf('?>') + 2);
            }
            var xml = ''.concat('<my>', s, '</my>');
            oDoc.loadXML(xml);
            var container = oDoc.documentElement;
            while (container.hasChildNodes()) {
                f.appendChild(container.firstChild);
            }
        }
        return f;
    };
    
    /**
     * Set global XSLT parameter of the imported stylesheet
     * @argument nsURI The parameter namespace URI
     * @argument name The parameter base name
     * @argument value The new parameter value
     */
    XSLTProcessor.prototype.setParameter = function(nsURI, name, value){
        // make value a zero length string if null to allow clearing
        value = value ? value : "";
        // nsURI is optional but cannot be null 
        if(nsURI){
            this.processor.addParameter(name, value, nsURI);
        }else{
            this.processor.addParameter(name, value);
        };
        // update updated params for getParameter 
        if(!this.paramsSet[""+nsURI]){
            this.paramsSet[""+nsURI] = new Array();
        };
        this.paramsSet[""+nsURI][name] = value;
    };
    /**
     * Gets a parameter if previously set by setParameter. Returns null
     * otherwise
     * @argument name The parameter base name
     * @argument value The new parameter value
     * @return The parameter value if reviously set by setParameter, null otherwise
     */
    XSLTProcessor.prototype.getParameter = function(nsURI, name){
        nsURI = "" + nsURI;
        if(this.paramsSet[nsURI] && this.paramsSet[nsURI][name]){
            return this.paramsSet[nsURI][name];
        }else{
            return null;
        };
    };
    /**
     * Clear parameters (set them to default values as defined in the stylesheet itself)
     */
    XSLTProcessor.prototype.clearParameters = function(){
        for(var nsURI in this.paramsSet){
            for(var name in this.paramsSet[nsURI]){
                if(nsURI){
                    this.processor.addParameter(name, "", nsURI);
                }else{
                    this.processor.addParameter(name, "");
                };
            };
        };
        this.paramsSet = new Array();
    };
}else{ /* end IE initialization, try to deal with real browsers now ;-) */
    if(_SARISSA_HAS_DOM_CREATE_DOCUMENT){
        /**
         * <p>Ensures the document was loaded correctly, otherwise sets the
         * parseError to -1 to indicate something went wrong. Internal use</p>
         * @private
         */
        Sarissa.__handleLoad__ = function(oDoc){
            Sarissa.__setReadyState__(oDoc, 4);
        };
        /**
        * <p>Attached by an event handler to the load event. Internal use.</p>
        * @private
        */
        _sarissa_XMLDocument_onload = function(){
            Sarissa.__handleLoad__(this);
        };
        /**
         * <p>Sets the readyState property of the given DOM Document object.
         * Internal use.</p>
         * @private
         * @argument oDoc the DOM Document object to fire the
         *          readystatechange event
         * @argument iReadyState the number to change the readystate property to
         */
        Sarissa.__setReadyState__ = function(oDoc, iReadyState){
            oDoc.readyState = iReadyState;
            oDoc.readystate = iReadyState;
            if (oDoc.onreadystatechange != null && typeof oDoc.onreadystatechange == "function")
                oDoc.onreadystatechange();
        };
        Sarissa.getDomDocument = function(sUri, sName){
            var oDoc = document.implementation.createDocument(sUri?sUri:null, sName?sName:null, null);
            if(!oDoc.onreadystatechange){
            
                /**
                * <p>Emulate IE's onreadystatechange attribute</p>
                */
                oDoc.onreadystatechange = null;
            };
            if(!oDoc.readyState){
                /**
                * <p>Emulates IE's readyState property, which always gives an integer from 0 to 4:</p>
                * <ul><li>1 == LOADING,</li>
                * <li>2 == LOADED,</li>
                * <li>3 == INTERACTIVE,</li>
                * <li>4 == COMPLETED</li></ul>
                */
                oDoc.readyState = 0;
            };
            oDoc.addEventListener("load", _sarissa_XMLDocument_onload, false);
            return oDoc;
        };
        if(window.XMLDocument){
            // do nothing
        }// TODO: check if the new document has content before trying to copynodes, check  for error handling in DOM 3 LS
        else if(_SARISSA_HAS_DOM_FEATURE && window.Document && !Document.prototype.load && document.implementation.hasFeature('LS', '3.0')){
            //Opera 9 may get the XPath branch which gives creates XMLDocument, therefore it doesn't reach here which is good
            /**
            * <p>Factory method to obtain a new DOM Document object</p>
            * @argument sUri the namespace of the root node (if any)
            * @argument sUri the local name of the root node (if any)
            * @returns a new DOM Document
            */
            Sarissa.getDomDocument = function(sUri, sName){
                var oDoc = document.implementation.createDocument(sUri?sUri:null, sName?sName:null, null);
                return oDoc;
            };
        }
        else {
            Sarissa.getDomDocument = function(sUri, sName){
                var oDoc = document.implementation.createDocument(sUri?sUri:null, sName?sName:null, null);
                // looks like safari does not create the root element for some unknown reason
                if(oDoc && (sUri || sName) && !oDoc.documentElement){
                    oDoc.appendChild(oDoc.createElementNS(sUri, sName));
                };
                return oDoc;
            };
        };
    };//if(_SARISSA_HAS_DOM_CREATE_DOCUMENT)
};
//==========================================
// Common stuff
//==========================================
if(!window.DOMParser){
    if(_SARISSA_IS_SAFARI){
        /*
         * DOMParser is a utility class, used to construct DOMDocuments from XML strings
         * @constructor
         */
        DOMParser = function() { };
        /** 
        * Construct a new DOM Document from the given XMLstring
        * @param sXml the given XML string
        * @param contentType the content type of the document the given string represents (one of text/xml, application/xml, application/xhtml+xml). 
        * @return a new DOM Document from the given XML string
        */
        DOMParser.prototype.parseFromString = function(sXml, contentType){
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", "data:text/xml;charset=utf-8," + encodeURIComponent(sXml), false);
            xmlhttp.send(null);
            return xmlhttp.responseXML;
        };
    }else if(Sarissa.getDomDocument && Sarissa.getDomDocument() && Sarissa.getDomDocument(null, "bar").xml){
        DOMParser = function() { };
        DOMParser.prototype.parseFromString = function(sXml, contentType){
            var doc = Sarissa.getDomDocument();
            doc.loadXML(sXml);
            return doc;
        };
    };
};

if((typeof(document.importNode) == "undefined") && _SARISSA_IS_IE){
    try{
        /**
        * Implementation of importNode for the context window document in IE.
        * If <code>oNode</code> is a TextNode, <code>bChildren</code> is ignored.
        * @param oNode the Node to import
        * @param bChildren whether to include the children of oNode
        * @returns the imported node for further use
        */
        document.importNode = function(oNode, bChildren){
            var tmp;
            if (oNode.nodeName=='#text') {
                return document.createTextElement(oNode.data);
            }
            else {
                if(oNode.nodeName == "tbody" || oNode.nodeName == "tr"){
                    tmp = document.createElement("table");
                }
                else if(oNode.nodeName == "td"){
                    tmp = document.createElement("tr");
                }
                else if(oNode.nodeName == "option"){
                    tmp = document.createElement("select");
                }
                else{
                    tmp = document.createElement("div");
                };
                if(bChildren){
                    tmp.innerHTML = oNode.xml ? oNode.xml : oNode.outerHTML;
                }else{
                    tmp.innerHTML = oNode.xml ? oNode.cloneNode(false).xml : oNode.cloneNode(false).outerHTML;
                };
                return tmp.getElementsByTagName("*")[0];
            };
            
        };
    }catch(e){ };
};
if(!Sarissa.getParseErrorText){
    /**
     * <p>Returns a human readable description of the parsing error. Usefull
     * for debugging. Tip: append the returned error string in a &lt;pre&gt;
     * element if you want to render it.</p>
     * <p>Many thanks to Christian Stocker for the initial patch.</p>
     * @argument oDoc The target DOM document
     * @returns The parsing error description of the target Document in
     *          human readable form (preformated text)
     */
    Sarissa.getParseErrorText = function (oDoc){
        var parseErrorText = Sarissa.PARSED_OK;
        if(!oDoc.documentElement){
            parseErrorText = Sarissa.PARSED_EMPTY;
        } else if(oDoc.documentElement.tagName == "parsererror"){
            parseErrorText = oDoc.documentElement.firstChild.data;
            parseErrorText += "\n" +  oDoc.documentElement.firstChild.nextSibling.firstChild.data;
        } else if(oDoc.getElementsByTagName("parsererror").length > 0){
            var parsererror = oDoc.getElementsByTagName("parsererror")[0];
            parseErrorText = Sarissa.getText(parsererror, true)+"\n";
        } else if(oDoc.parseError && oDoc.parseError.errorCode != 0){
            parseErrorText = Sarissa.PARSED_UNKNOWN_ERROR;
        };
        return parseErrorText;
    };
};
Sarissa.getText = function(oNode, deep){
    var s = "";
    var nodes = oNode.childNodes;
    for(var i=0; i < nodes.length; i++){
        var node = nodes[i];
        var nodeType = node.nodeType;
        if(nodeType == Node.TEXT_NODE || nodeType == Node.CDATA_SECTION_NODE){
            s += node.data;
        } else if(deep == true
                    && (nodeType == Node.ELEMENT_NODE
                        || nodeType == Node.DOCUMENT_NODE
                        || nodeType == Node.DOCUMENT_FRAGMENT_NODE)){
            s += Sarissa.getText(node, true);
        };
    };
    return s;
};
if(!window.XMLSerializer 
    && Sarissa.getDomDocument 
    && Sarissa.getDomDocument("","foo", null).xml){
    /**
     * Utility class to serialize DOM Node objects to XML strings
     * @constructor
     */
    XMLSerializer = function(){};
    /**
     * Serialize the given DOM Node to an XML string
     * @param oNode the DOM Node to serialize
     */
    XMLSerializer.prototype.serializeToString = function(oNode) {
        return oNode.xml;
    };
};

/**
 * strips tags from a markup string
 */
Sarissa.stripTags = function (s) {
    return s.replace(/<[^>]+>/g,"");
};
/**
 * <p>Deletes all child nodes of the given node</p>
 * @argument oNode the Node to empty
 */
Sarissa.clearChildNodes = function(oNode) {
    // need to check for firstChild due to opera 8 bug with hasChildNodes
    while(oNode.firstChild) {
        oNode.removeChild(oNode.firstChild);
    };
};
/**
 * <p> Copies the childNodes of nodeFrom to nodeTo</p>
 * <p> <b>Note:</b> The second object's original content is deleted before 
 * the copy operation, unless you supply a true third parameter</p>
 * @argument nodeFrom the Node to copy the childNodes from
 * @argument nodeTo the Node to copy the childNodes to
 * @argument bPreserveExisting whether to preserve the original content of nodeTo, default is false
 */
Sarissa.copyChildNodes = function(nodeFrom, nodeTo, bPreserveExisting) {
    if((!nodeFrom) || (!nodeTo)){
        throw "Both source and destination nodes must be provided";
    };
    if(!bPreserveExisting){
        Sarissa.clearChildNodes(nodeTo);
    };
    var ownerDoc = nodeTo.nodeType == Node.DOCUMENT_NODE ? nodeTo : nodeTo.ownerDocument;
    var nodes = nodeFrom.childNodes;
    if(typeof(ownerDoc.importNode) != "undefined")  {
        for(var i=0;i < nodes.length;i++) {
            nodeTo.appendChild(ownerDoc.importNode(nodes[i], true));
        };
    } else {
        for(var i=0;i < nodes.length;i++) {
            nodeTo.appendChild(nodes[i].cloneNode(true));
        };
    };
};

/**
 * <p> Moves the childNodes of nodeFrom to nodeTo</p>
 * <p> <b>Note:</b> The second object's original content is deleted before 
 * the move operation, unless you supply a true third parameter</p>
 * @argument nodeFrom the Node to copy the childNodes from
 * @argument nodeTo the Node to copy the childNodes to
 * @argument bPreserveExisting whether to preserve the original content of nodeTo, default is
 */ 
Sarissa.moveChildNodes = function(nodeFrom, nodeTo, bPreserveExisting) {
    if((!nodeFrom) || (!nodeTo)){
        throw "Both source and destination nodes must be provided";
    };
    if(!bPreserveExisting){
        Sarissa.clearChildNodes(nodeTo);
    };
    var nodes = nodeFrom.childNodes;
    // if within the same doc, just move, else copy and delete
    if(nodeFrom.ownerDocument == nodeTo.ownerDocument){
        while(nodeFrom.firstChild){
            nodeTo.appendChild(nodeFrom.firstChild);
        };
    } else {
        var ownerDoc = nodeTo.nodeType == Node.DOCUMENT_NODE ? nodeTo : nodeTo.ownerDocument;
        if(typeof(ownerDoc.importNode) != "undefined") {
           for(var i=0;i < nodes.length;i++) {
               nodeTo.appendChild(ownerDoc.importNode(nodes[i], true));
           };
        }else{
           for(var i=0;i < nodes.length;i++) {
               nodeTo.appendChild(nodes[i].cloneNode(true));
           };
        };
        Sarissa.clearChildNodes(nodeFrom);
    };
};

/** 
 * <p>Serialize any object to an XML string. All properties are serialized using the property name
 * as the XML element name. Array elements are rendered as <code>array-item</code> elements, 
 * using their index/key as the value of the <code>key</code> attribute.</p>
 * @argument anyObject the object to serialize
 * @argument objectName a name for that object
 * @return the XML serializationj of the given object as a string
 */
Sarissa.xmlize = function(anyObject, objectName, indentSpace){
    indentSpace = indentSpace?indentSpace:'';
    var s = indentSpace  + '<' + objectName + '>';
    var isLeaf = false;
    if(!(anyObject instanceof Object) || anyObject instanceof Number || anyObject instanceof String 
        || anyObject instanceof Boolean || anyObject instanceof Date){
        s += Sarissa.escape(""+anyObject);
        isLeaf = true;
    }else{
        s += "\n";
        var itemKey = '';
        var isArrayItem = anyObject instanceof Array;
        for(var name in anyObject){
            s += Sarissa.xmlize(anyObject[name], (isArrayItem?"array-item key=\""+name+"\"":name), indentSpace + "   ");
        };
        s += indentSpace;
    };
    return s += (objectName.indexOf(' ')!=-1?"</array-item>\n":"</" + objectName + ">\n");
};

/** 
 * Escape the given string chacters that correspond to the five predefined XML entities
 * @param sXml the string to escape
 */
Sarissa.escape = function(sXml){
    return sXml.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
};

/** 
 * Unescape the given string. This turns the occurences of the predefined XML 
 * entities to become the characters they represent correspond to the five predefined XML entities
 * @param sXml the string to unescape
 */
Sarissa.unescape = function(sXml){
    return sXml.replace(/&apos;/g,"'")
        .replace(/&quot;/g,"\"")
        .replace(/&gt;/g,">")
        .replace(/&lt;/g,"<")
        .replace(/&amp;/g,"&");
};
//   EOF


/* document.getElementsBySelector(selector)
   - returns an array of element objects from the current document
     matching the CSS selector. Selectors can contain element names, 
     class names and ids and can be nested. For example:
     
       elements = document.getElementsBySelect('div#main p a.external')
     
     Will return an array of all 'a' elements with 'external' in their 
     class attribute that are contained inside 'p' elements that are 
     contained inside the 'div' element which has id="main"

   New in version 0.4: Support for CSS2 and CSS3 attribute selectors:
   See http://www.w3.org/TR/css3-selectors/#attribute-selectors

   Version 0.4 - Simon Willison, March 25th 2003
   -- Works in Phoenix 0.5, Mozilla 1.3, Opera 7, Internet Explorer 6, Internet Explorer 5 on Windows
   -- Opera 7 fails 
*/

function getAllChildren(e) {
  // Returns all children of element. Workaround required for IE5/Windows. Ugh.
  return e.all ? e.all : e.getElementsByTagName('*');
}

document.getElementsBySelector = function(selector) {
  // Attempt to fail gracefully in lesser browsers
  if (!document.getElementsByTagName) {
    return new Array();
  }
  // Split selector in to tokens
  var tokens = selector.split(' ');
  var currentContext = new Array(document);
  for (var i = 0; i < tokens.length; i++) {
    token = tokens[i].replace(/^\s+/,'').replace(/\s+$/,'');;
    if (token.indexOf('#') > -1) {
      // Token is an ID selector
      var bits = token.split('#');
      var tagName = bits[0];
      var id = bits[1];
      var element = document.getElementById(id);
      if (tagName && element.nodeName.toLowerCase() != tagName) {
        // tag with that ID not found, return false
        return new Array();
      }
      // Set currentContext to contain just this element
      currentContext = new Array(element);
      continue; // Skip to next token
    }
    if (token.indexOf('.') > -1) {
      // Token contains a class selector
      var bits = token.split('.');
      var tagName = bits[0];
      var className = bits[1];
      if (!tagName) {
        tagName = '*';
      }
      // Get elements matching tag, filter them for class selector
      var found = new Array;
      var foundCount = 0;
      for (var h = 0; h < currentContext.length; h++) {
        var elements;
        if (tagName == '*') {
            elements = getAllChildren(currentContext[h]);
        } else {
            elements = currentContext[h].getElementsByTagName(tagName);
        }
        for (var j = 0; j < elements.length; j++) {
          found[foundCount++] = elements[j];
        }
      }
      currentContext = new Array;
      var currentContextIndex = 0;
      for (var k = 0; k < found.length; k++) {
        if (found[k].className && found[k].className.match(new RegExp('\\b'+className+'\\b'))) {
          currentContext[currentContextIndex++] = found[k];
        }
      }
      continue; // Skip to next token
    }
    // Code to deal with attribute selectors
    if (token.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/)) {
      var tagName = RegExp.$1;
      var attrName = RegExp.$2;
      var attrOperator = RegExp.$3;
      var attrValue = RegExp.$4;
      if (!tagName) {
        tagName = '*';
      }
      // Grab all of the tagName elements within current context
      var found = new Array;
      var foundCount = 0;
      for (var h = 0; h < currentContext.length; h++) {
        var elements;
        if (tagName == '*') {
            elements = getAllChildren(currentContext[h]);
        } else {
            elements = currentContext[h].getElementsByTagName(tagName);
        }
        for (var j = 0; j < elements.length; j++) {
          found[foundCount++] = elements[j];
        }
      }
      currentContext = new Array;
      var currentContextIndex = 0;
      var checkFunction; // This function will be used to filter the elements
      switch (attrOperator) {
        case '=': // Equality
          checkFunction = function(e) { return (e.getAttribute(attrName) == attrValue); };
          break;
        case '~': // Match one of space seperated words 
          checkFunction = function(e) { return (e.getAttribute(attrName).match(new RegExp('\\b'+attrValue+'\\b'))); };
          break;
        case '|': // Match start with value followed by optional hyphen
          checkFunction = function(e) { return (e.getAttribute(attrName).match(new RegExp('^'+attrValue+'-?'))); };
          break;
        case '^': // Match starts with value
          checkFunction = function(e) { return (e.getAttribute(attrName).indexOf(attrValue) == 0); };
          break;
        case '$': // Match ends with value - fails with "Warning" in Opera 7
          checkFunction = function(e) { return (e.getAttribute(attrName).lastIndexOf(attrValue) == e.getAttribute(attrName).length - attrValue.length); };
          break;
        case '*': // Match ends with value
          checkFunction = function(e) { return (e.getAttribute(attrName).indexOf(attrValue) > -1); };
          break;
        default :
          // Just test for existence of attribute
          checkFunction = function(e) { return e.getAttribute(attrName); };
      }
      currentContext = new Array;
      var currentContextIndex = 0;
      for (var k = 0; k < found.length; k++) {
        if (checkFunction(found[k])) {
          currentContext[currentContextIndex++] = found[k];
        }
      }
      // alert('Attribute Selector: '+tagName+' '+attrName+' '+attrOperator+' '+attrValue);
      continue; // Skip to next token
    }
    // If we get here, token is JUST an element (not a class or ID selector)
    tagName = token;
    var found = new Array;
    var foundCount = 0;
    for (var h = 0; h < currentContext.length; h++) {
      var elements = currentContext[h].getElementsByTagName(tagName);
      for (var j = 0; j < elements.length; j++) {
        found[foundCount++] = elements[j];
      }
    }
    currentContext = found;
  }
  return currentContext;
}

/* That revolting regular expression explained 
/^(\w+)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/
  \---/  \---/\-------------/    \-------/
    |      |         |               |
    |      |         |           The value
    |      |    ~,|,^,$,* or =
    |   Attribute 
   Tag
*/







if(typeof YAHOO=="undefined"){var YAHOO={};}
YAHOO.namespace=function(){var a=arguments,o=null,i,j,d;for(i=0;i<a.length;++i){d=a[i].split(".");o=YAHOO;for(j=(d[0]=="YAHOO")?1:0;j<d.length;++j){o[d[j]]=o[d[j]]||{};o=o[d[j]];}}
return o;};YAHOO.log=function(msg,cat,src){var l=YAHOO.widget.Logger;if(l&&l.log){return l.log(msg,cat,src);}else{return false;}};YAHOO.extend=function(subc,superc,overrides){var F=function(){};F.prototype=superc.prototype;subc.prototype=new F();subc.prototype.constructor=subc;subc.superclass=superc.prototype;if(superc.prototype.constructor==Object.prototype.constructor){superc.prototype.constructor=superc;}
if(overrides){for(var i in overrides){subc.prototype[i]=overrides[i];}}};YAHOO.augment=function(r,s){var rp=r.prototype,sp=s.prototype,a=arguments,i,p;if(a[2]){for(i=2;i<a.length;++i){rp[a[i]]=sp[a[i]];}}else{for(p in sp){if(!rp[p]){rp[p]=sp[p];}}}};YAHOO.namespace("util","widget","example");
YAHOO.util.CustomEvent=function(type,oScope,silent,signature){this.type=type;this.scope=oScope||window;this.silent=silent;this.signature=signature||YAHOO.util.CustomEvent.LIST;this.subscribers=[];if(!this.silent){}
var onsubscribeType="_YUICEOnSubscribe";if(type!==onsubscribeType){this.subscribeEvent=new YAHOO.util.CustomEvent(onsubscribeType,this,true);}};YAHOO.util.CustomEvent.LIST=0;YAHOO.util.CustomEvent.FLAT=1;YAHOO.util.CustomEvent.prototype={subscribe:function(fn,obj,override){if(this.subscribeEvent){this.subscribeEvent.fire(fn,obj,override);}
this.subscribers.push(new YAHOO.util.Subscriber(fn,obj,override));},unsubscribe:function(fn,obj){var found=false;for(var i=0,len=this.subscribers.length;i<len;++i){var s=this.subscribers[i];if(s&&s.contains(fn,obj)){this._delete(i);found=true;}}
return found;},fire:function(){var len=this.subscribers.length;if(!len&&this.silent){return true;}
var args=[],ret=true,i;for(i=0;i<arguments.length;++i){args.push(arguments[i]);}
var argslength=args.length;if(!this.silent){}
for(i=0;i<len;++i){var s=this.subscribers[i];if(s){if(!this.silent){}
var scope=s.getScope(this.scope);if(this.signature==YAHOO.util.CustomEvent.FLAT){var param=null;if(args.length>0){param=args[0];}
ret=s.fn.call(scope,param,s.obj);}else{ret=s.fn.call(scope,this.type,args,s.obj);}
if(false===ret){if(!this.silent){}
return false;}}}
return true;},unsubscribeAll:function(){for(var i=0,len=this.subscribers.length;i<len;++i){this._delete(len-1-i);}},_delete:function(index){var s=this.subscribers[index];if(s){delete s.fn;delete s.obj;}
this.subscribers.splice(index,1);},toString:function(){return"CustomEvent: "+"'"+this.type+"', "+"scope: "+this.scope;}};YAHOO.util.Subscriber=function(fn,obj,override){this.fn=fn;this.obj=obj||null;this.override=override;};YAHOO.util.Subscriber.prototype.getScope=function(defaultScope){if(this.override){if(this.override===true){return this.obj;}else{return this.override;}}
return defaultScope;};YAHOO.util.Subscriber.prototype.contains=function(fn,obj){if(obj){return(this.fn==fn&&this.obj==obj);}else{return(this.fn==fn);}};YAHOO.util.Subscriber.prototype.toString=function(){return"Subscriber { obj: "+(this.obj||"")+", override: "+(this.override||"no")+" }";};if(!YAHOO.util.Event){YAHOO.util.Event=function(){var loadComplete=false;var listeners=[];var unloadListeners=[];var legacyEvents=[];var legacyHandlers=[];var retryCount=0;var onAvailStack=[];var legacyMap=[];var counter=0;return{POLL_RETRYS:200,POLL_INTERVAL:20,EL:0,TYPE:1,FN:2,WFN:3,OBJ:3,ADJ_SCOPE:4,isSafari:(/Safari|Konqueror|KHTML/gi).test(navigator.userAgent),isIE:(!this.isSafari&&!navigator.userAgent.match(/opera/gi)&&navigator.userAgent.match(/msie/gi)),_interval:null,startInterval:function(){if(!this._interval){var self=this;var callback=function(){self._tryPreloadAttach();};this._interval=setInterval(callback,this.POLL_INTERVAL);}},onAvailable:function(p_id,p_fn,p_obj,p_override){onAvailStack.push({id:p_id,fn:p_fn,obj:p_obj,override:p_override,checkReady:false});retryCount=this.POLL_RETRYS;this.startInterval();},onContentReady:function(p_id,p_fn,p_obj,p_override){onAvailStack.push({id:p_id,fn:p_fn,obj:p_obj,override:p_override,checkReady:true});retryCount=this.POLL_RETRYS;this.startInterval();},addListener:function(el,sType,fn,obj,override){if(!fn||!fn.call){return false;}
if(this._isValidCollection(el)){var ok=true;for(var i=0,len=el.length;i<len;++i){ok=this.on(el[i],sType,fn,obj,override)&&ok;}
return ok;}else if(typeof el=="string"){var oEl=this.getEl(el);if(oEl){el=oEl;}else{this.onAvailable(el,function(){YAHOO.util.Event.on(el,sType,fn,obj,override);});return true;}}
if(!el){return false;}
if("unload"==sType&&obj!==this){unloadListeners[unloadListeners.length]=[el,sType,fn,obj,override];return true;}
var scope=el;if(override){if(override===true){scope=obj;}else{scope=override;}}
var wrappedFn=function(e){return fn.call(scope,YAHOO.util.Event.getEvent(e),obj);};var li=[el,sType,fn,wrappedFn,scope];var index=listeners.length;listeners[index]=li;if(this.useLegacyEvent(el,sType)){var legacyIndex=this.getLegacyIndex(el,sType);if(legacyIndex==-1||el!=legacyEvents[legacyIndex][0]){legacyIndex=legacyEvents.length;legacyMap[el.id+sType]=legacyIndex;legacyEvents[legacyIndex]=[el,sType,el["on"+sType]];legacyHandlers[legacyIndex]=[];el["on"+sType]=function(e){YAHOO.util.Event.fireLegacyEvent(YAHOO.util.Event.getEvent(e),legacyIndex);};}
legacyHandlers[legacyIndex].push(li);}else{try{this._simpleAdd(el,sType,wrappedFn,false);}catch(e){this.removeListener(el,sType,fn);return false;}}
return true;},fireLegacyEvent:function(e,legacyIndex){var ok=true;var le=legacyHandlers[legacyIndex];for(var i=0,len=le.length;i<len;++i){var li=le[i];if(li&&li[this.WFN]){var scope=li[this.ADJ_SCOPE];var ret=li[this.WFN].call(scope,e);ok=(ok&&ret);}}
return ok;},getLegacyIndex:function(el,sType){var key=this.generateId(el)+sType;if(typeof legacyMap[key]=="undefined"){return-1;}else{return legacyMap[key];}},useLegacyEvent:function(el,sType){if(!el.addEventListener&&!el.attachEvent){return true;}else if(this.isSafari){if("click"==sType||"dblclick"==sType){return true;}}
return false;},removeListener:function(el,sType,fn){var i,len;if(typeof el=="string"){el=this.getEl(el);}else if(this._isValidCollection(el)){var ok=true;for(i=0,len=el.length;i<len;++i){ok=(this.removeListener(el[i],sType,fn)&&ok);}
return ok;}
if(!fn||!fn.call){return this.purgeElement(el,false,sType);}
if("unload"==sType){for(i=0,len=unloadListeners.length;i<len;i++){var li=unloadListeners[i];if(li&&li[0]==el&&li[1]==sType&&li[2]==fn){unloadListeners.splice(i,1);return true;}}
return false;}
var cacheItem=null;var index=arguments[3];if("undefined"==typeof index){index=this._getCacheIndex(el,sType,fn);}
if(index>=0){cacheItem=listeners[index];}
if(!el||!cacheItem){return false;}
if(this.useLegacyEvent(el,sType)){var legacyIndex=this.getLegacyIndex(el,sType);var llist=legacyHandlers[legacyIndex];if(llist){for(i=0,len=llist.length;i<len;++i){li=llist[i];if(li&&li[this.EL]==el&&li[this.TYPE]==sType&&li[this.FN]==fn){llist.splice(i,1);break;}}}}else{try{this._simpleRemove(el,sType,cacheItem[this.WFN],false);}catch(e){return false;}}
delete listeners[index][this.WFN];delete listeners[index][this.FN];listeners.splice(index,1);return true;},getTarget:function(ev,resolveTextNode){var t=ev.target||ev.srcElement;return this.resolveTextNode(t);},resolveTextNode:function(node){if(node&&3==node.nodeType){return node.parentNode;}else{return node;}},getPageX:function(ev){var x=ev.pageX;if(!x&&0!==x){x=ev.clientX||0;if(this.isIE){x+=this._getScrollLeft();}}
return x;},getPageY:function(ev){var y=ev.pageY;if(!y&&0!==y){y=ev.clientY||0;if(this.isIE){y+=this._getScrollTop();}}
return y;},getXY:function(ev){return[this.getPageX(ev),this.getPageY(ev)];},getRelatedTarget:function(ev){var t=ev.relatedTarget;if(!t){if(ev.type=="mouseout"){t=ev.toElement;}else if(ev.type=="mouseover"){t=ev.fromElement;}}
return this.resolveTextNode(t);},getTime:function(ev){if(!ev.time){var t=new Date().getTime();try{ev.time=t;}catch(e){return t;}}
return ev.time;},stopEvent:function(ev){this.stopPropagation(ev);this.preventDefault(ev);},stopPropagation:function(ev){if(ev.stopPropagation){ev.stopPropagation();}else{ev.cancelBubble=true;}},preventDefault:function(ev){if(ev.preventDefault){ev.preventDefault();}else{ev.returnValue=false;}},getEvent:function(e){var ev=e||window.event;if(!ev){var c=this.getEvent.caller;while(c){ev=c.arguments[0];if(ev&&Event==ev.constructor){break;}
c=c.caller;}}
return ev;},getCharCode:function(ev){return ev.charCode||ev.keyCode||0;},_getCacheIndex:function(el,sType,fn){for(var i=0,len=listeners.length;i<len;++i){var li=listeners[i];if(li&&li[this.FN]==fn&&li[this.EL]==el&&li[this.TYPE]==sType){return i;}}
return-1;},generateId:function(el){var id=el.id;if(!id){id="yuievtautoid-"+counter;++counter;el.id=id;}
return id;},_isValidCollection:function(o){return(o&&o.length&&typeof o!="string"&&!o.tagName&&!o.alert&&typeof o[0]!="undefined");},elCache:{},getEl:function(id){return document.getElementById(id);},clearCache:function(){},_load:function(e){loadComplete=true;var EU=YAHOO.util.Event;if(this.isIE){EU._simpleRemove(window,"load",EU._load);}},_tryPreloadAttach:function(){if(this.locked){return false;}
this.locked=true;var tryAgain=!loadComplete;if(!tryAgain){tryAgain=(retryCount>0);}
var notAvail=[];for(var i=0,len=onAvailStack.length;i<len;++i){var item=onAvailStack[i];if(item){var el=this.getEl(item.id);if(el){if(!item.checkReady||loadComplete||el.nextSibling||(document&&document.body)){var scope=el;if(item.override){if(item.override===true){scope=item.obj;}else{scope=item.override;}}
item.fn.call(scope,item.obj);onAvailStack[i]=null;}}else{notAvail.push(item);}}}
retryCount=(notAvail.length===0)?0:retryCount-1;if(tryAgain){onAvailStack=notAvail;this.startInterval();}else{clearInterval(this._interval);this._interval=null;}
this.locked=false;return true;},purgeElement:function(el,recurse,sType){var elListeners=this.getListeners(el,sType);if(elListeners){for(var i=0,len=elListeners.length;i<len;++i){var l=elListeners[i];this.removeListener(el,l.type,l.fn);}}
if(recurse&&el&&el.childNodes){for(i=0,len=el.childNodes.length;i<len;++i){this.purgeElement(el.childNodes[i],recurse,sType);}}},getListeners:function(el,sType){var elListeners=[];if(listeners&&listeners.length>0){for(var i=0,len=listeners.length;i<len;++i){var l=listeners[i];if(l&&l[this.EL]===el&&(!sType||sType===l[this.TYPE])){elListeners.push({type:l[this.TYPE],fn:l[this.FN],obj:l[this.OBJ],adjust:l[this.ADJ_SCOPE],index:i});}}}
return(elListeners.length)?elListeners:null;},_unload:function(e){var EU=YAHOO.util.Event,i,j,l,len,index;for(i=0,len=unloadListeners.length;i<len;++i){l=unloadListeners[i];if(l){var scope=window;if(l[EU.ADJ_SCOPE]){if(l[EU.ADJ_SCOPE]===true){scope=l[EU.OBJ];}else{scope=l[EU.ADJ_SCOPE];}}
l[EU.FN].call(scope,EU.getEvent(e),l[EU.OBJ]);unloadListeners[i]=null;l=null;scope=null;}}
unloadListeners=null;if(listeners&&listeners.length>0){j=listeners.length;while(j){index=j-1;l=listeners[index];if(l){EU.removeListener(l[EU.EL],l[EU.TYPE],l[EU.FN],index);}
j=j-1;}
l=null;EU.clearCache();}
for(i=0,len=legacyEvents.length;i<len;++i){legacyEvents[i][0]=null;legacyEvents[i]=null;}
legacyEvents=null;EU._simpleRemove(window,"unload",EU._unload);},_getScrollLeft:function(){return this._getScroll()[1];},_getScrollTop:function(){return this._getScroll()[0];},_getScroll:function(){var dd=document.documentElement,db=document.body;if(dd&&(dd.scrollTop||dd.scrollLeft)){return[dd.scrollTop,dd.scrollLeft];}else if(db){return[db.scrollTop,db.scrollLeft];}else{return[0,0];}},_simpleAdd:function(){if(window.addEventListener){return function(el,sType,fn,capture){el.addEventListener(sType,fn,(capture));};}else if(window.attachEvent){return function(el,sType,fn,capture){el.attachEvent("on"+sType,fn);};}else{return function(){};}}(),_simpleRemove:function(){if(window.removeEventListener){return function(el,sType,fn,capture){el.removeEventListener(sType,fn,(capture));};}else if(window.detachEvent){return function(el,sType,fn){el.detachEvent("on"+sType,fn);};}else{return function(){};}}()};}();(function(){var EU=YAHOO.util.Event;EU.on=EU.addListener;if(document&&document.body){EU._load();}else{EU._simpleAdd(window,"load",EU._load);}
EU._simpleAdd(window,"unload",EU._unload);EU._tryPreloadAttach();})();}
YAHOO.util.EventProvider=function(){};YAHOO.util.EventProvider.prototype={__yui_events:null,__yui_subscribers:null,subscribe:function(p_type,p_fn,p_obj,p_override){this.__yui_events=this.__yui_events||{};var ce=this.__yui_events[p_type];if(ce){ce.subscribe(p_fn,p_obj,p_override);}else{this.__yui_subscribers=this.__yui_subscribers||{};var subs=this.__yui_subscribers;if(!subs[p_type]){subs[p_type]=[];}
subs[p_type].push({fn:p_fn,obj:p_obj,override:p_override});}},unsubscribe:function(p_type,p_fn,p_obj){this.__yui_events=this.__yui_events||{};var ce=this.__yui_events[p_type];if(ce){return ce.unsubscribe(p_fn,p_obj);}else{return false;}},createEvent:function(p_type,p_config){this.__yui_events=this.__yui_events||{};var opts=p_config||{};var events=this.__yui_events;if(events[p_type]){}else{var scope=opts.scope||this;var silent=opts.silent||null;var ce=new YAHOO.util.CustomEvent(p_type,scope,silent,YAHOO.util.CustomEvent.FLAT);events[p_type]=ce;if(opts.onSubscribeCallback){ce.subscribeEvent.subscribe(opts.onSubscribeCallback);}
this.__yui_subscribers=this.__yui_subscribers||{};var qs=this.__yui_subscribers[p_type];if(qs){for(var i=0;i<qs.length;++i){ce.subscribe(qs[i].fn,qs[i].obj,qs[i].override);}}}
return events[p_type];},fireEvent:function(p_type,arg1,arg2,etc){this.__yui_events=this.__yui_events||{};var ce=this.__yui_events[p_type];if(ce){var args=[];for(var i=1;i<arguments.length;++i){args.push(arguments[i]);}
return ce.fire.apply(ce,args);}else{return null;}},hasEvent:function(type){if(this.__yui_events){if(this.__yui_events[type]){return true;}}
return false;}};
(function(){var Y=YAHOO.util,getStyle,setStyle,id_counter=0,propertyCache={};var ua=navigator.userAgent.toLowerCase(),isOpera=(ua.indexOf('opera')>-1),isSafari=(ua.indexOf('safari')>-1),isGecko=(!isOpera&&!isSafari&&ua.indexOf('gecko')>-1),isIE=(!isOpera&&ua.indexOf('msie')>-1);var patterns={HYPHEN:/(-[a-z])/i};var toCamel=function(property){if(!patterns.HYPHEN.test(property)){return property;}
if(propertyCache[property]){return propertyCache[property];}
while(patterns.HYPHEN.exec(property)){property=property.replace(RegExp.$1,RegExp.$1.substr(1).toUpperCase());}
propertyCache[property]=property;return property;};if(document.defaultView&&document.defaultView.getComputedStyle){getStyle=function(el,property){var value=null;var computed=document.defaultView.getComputedStyle(el,'');if(computed){value=computed[toCamel(property)];}
return el.style[property]||value;};}else if(document.documentElement.currentStyle&&isIE){getStyle=function(el,property){switch(toCamel(property)){case'opacity':var val=100;try{val=el.filters['DXImageTransform.Microsoft.Alpha'].opacity;}catch(e){try{val=el.filters('alpha').opacity;}catch(e){}}
return val/100;break;default:var value=el.currentStyle?el.currentStyle[property]:null;return(el.style[property]||value);}};}else{getStyle=function(el,property){return el.style[property];};}
if(isIE){setStyle=function(el,property,val){switch(property){case'opacity':if(typeof el.style.filter=='string'){el.style.filter='alpha(opacity='+val*100+')';if(!el.currentStyle||!el.currentStyle.hasLayout){el.style.zoom=1;}}
break;default:el.style[property]=val;}};}else{setStyle=function(el,property,val){el.style[property]=val;};}
YAHOO.util.Dom={get:function(el){if(!el){return null;}
if(typeof el!='string'&&!(el instanceof Array)){return el;}
if(typeof el=='string'){return document.getElementById(el);}
else{var collection=[];for(var i=0,len=el.length;i<len;++i){collection[collection.length]=Y.Dom.get(el[i]);}
return collection;}
return null;},getStyle:function(el,property){property=toCamel(property);var f=function(element){return getStyle(element,property);};return Y.Dom.batch(el,f,Y.Dom,true);},setStyle:function(el,property,val){property=toCamel(property);var f=function(element){setStyle(element,property,val);};Y.Dom.batch(el,f,Y.Dom,true);},getXY:function(el){var f=function(el){if(el.parentNode===null||el.offsetParent===null||this.getStyle(el,'display')=='none'){return false;}
var parentNode=null;var pos=[];var box;if(el.getBoundingClientRect){box=el.getBoundingClientRect();var doc=document;if(!this.inDocument(el)&&parent.document!=document){doc=parent.document;if(!this.isAncestor(doc.documentElement,el)){return false;}}
var scrollTop=Math.max(doc.documentElement.scrollTop,doc.body.scrollTop);var scrollLeft=Math.max(doc.documentElement.scrollLeft,doc.body.scrollLeft);return[box.left+scrollLeft,box.top+scrollTop];}
else{pos=[el.offsetLeft,el.offsetTop];parentNode=el.offsetParent;if(parentNode!=el){while(parentNode){pos[0]+=parentNode.offsetLeft;pos[1]+=parentNode.offsetTop;parentNode=parentNode.offsetParent;}}
if(isSafari&&this.getStyle(el,'position')=='absolute'){pos[0]-=document.body.offsetLeft;pos[1]-=document.body.offsetTop;}}
if(el.parentNode){parentNode=el.parentNode;}
else{parentNode=null;}
while(parentNode&&parentNode.tagName.toUpperCase()!='BODY'&&parentNode.tagName.toUpperCase()!='HTML')
{if(Y.Dom.getStyle(parentNode,'display')!='inline'){pos[0]-=parentNode.scrollLeft;pos[1]-=parentNode.scrollTop;}
if(parentNode.parentNode){parentNode=parentNode.parentNode;}else{parentNode=null;}}
return pos;};return Y.Dom.batch(el,f,Y.Dom,true);},getX:function(el){var f=function(el){return Y.Dom.getXY(el)[0];};return Y.Dom.batch(el,f,Y.Dom,true);},getY:function(el){var f=function(el){return Y.Dom.getXY(el)[1];};return Y.Dom.batch(el,f,Y.Dom,true);},setXY:function(el,pos,noRetry){var f=function(el){var style_pos=this.getStyle(el,'position');if(style_pos=='static'){this.setStyle(el,'position','relative');style_pos='relative';}
var pageXY=this.getXY(el);if(pageXY===false){return false;}
var delta=[parseInt(this.getStyle(el,'left'),10),parseInt(this.getStyle(el,'top'),10)];if(isNaN(delta[0])){delta[0]=(style_pos=='relative')?0:el.offsetLeft;}
if(isNaN(delta[1])){delta[1]=(style_pos=='relative')?0:el.offsetTop;}
if(pos[0]!==null){el.style.left=pos[0]-pageXY[0]+delta[0]+'px';}
if(pos[1]!==null){el.style.top=pos[1]-pageXY[1]+delta[1]+'px';}
if(!noRetry){var newXY=this.getXY(el);if((pos[0]!==null&&newXY[0]!=pos[0])||(pos[1]!==null&&newXY[1]!=pos[1])){this.setXY(el,pos,true);}}};Y.Dom.batch(el,f,Y.Dom,true);},setX:function(el,x){Y.Dom.setXY(el,[x,null]);},setY:function(el,y){Y.Dom.setXY(el,[null,y]);},getRegion:function(el){var f=function(el){var region=new Y.Region.getRegion(el);return region;};return Y.Dom.batch(el,f,Y.Dom,true);},getClientWidth:function(){return Y.Dom.getViewportWidth();},getClientHeight:function(){return Y.Dom.getViewportHeight();},getElementsByClassName:function(className,tag,root){var method=function(el){return Y.Dom.hasClass(el,className);};return Y.Dom.getElementsBy(method,tag,root);},hasClass:function(el,className){var re=new RegExp('(?:^|\\s+)'+className+'(?:\\s+|$)');var f=function(el){return re.test(el['className']);};return Y.Dom.batch(el,f,Y.Dom,true);},addClass:function(el,className){var f=function(el){if(this.hasClass(el,className)){return;}
el['className']=[el['className'],className].join(' ');};Y.Dom.batch(el,f,Y.Dom,true);},removeClass:function(el,className){var re=new RegExp('(?:^|\\s+)'+className+'(?:\\s+|$)','g');var f=function(el){if(!this.hasClass(el,className)){return;}
var c=el['className'];el['className']=c.replace(re,' ');if(this.hasClass(el,className)){this.removeClass(el,className);}};Y.Dom.batch(el,f,Y.Dom,true);},replaceClass:function(el,oldClassName,newClassName){if(oldClassName===newClassName){return false;}
var re=new RegExp('(?:^|\\s+)'+oldClassName+'(?:\\s+|$)','g');var f=function(el){if(!this.hasClass(el,oldClassName)){this.addClass(el,newClassName);return;}
el['className']=el['className'].replace(re,' '+newClassName+' ');if(this.hasClass(el,oldClassName)){this.replaceClass(el,oldClassName,newClassName);}};Y.Dom.batch(el,f,Y.Dom,true);},generateId:function(el,prefix){prefix=prefix||'yui-gen';el=el||{};var f=function(el){if(el){el=Y.Dom.get(el);}else{el={};}
if(!el.id){el.id=prefix+id_counter++;}
return el.id;};return Y.Dom.batch(el,f,Y.Dom,true);},isAncestor:function(haystack,needle){haystack=Y.Dom.get(haystack);if(!haystack||!needle){return false;}
var f=function(needle){if(haystack.contains&&!isSafari){return haystack.contains(needle);}
else if(haystack.compareDocumentPosition){return!!(haystack.compareDocumentPosition(needle)&16);}
else{var parent=needle.parentNode;while(parent){if(parent==haystack){return true;}
else if(!parent.tagName||parent.tagName.toUpperCase()=='HTML'){return false;}
parent=parent.parentNode;}
return false;}};return Y.Dom.batch(needle,f,Y.Dom,true);},inDocument:function(el){var f=function(el){return this.isAncestor(document.documentElement,el);};return Y.Dom.batch(el,f,Y.Dom,true);},getElementsBy:function(method,tag,root){tag=tag||'*';var nodes=[];if(root){root=Y.Dom.get(root);if(!root){return nodes;}}else{root=document;}
var elements=root.getElementsByTagName(tag);if(!elements.length&&(tag=='*'&&root.all)){elements=root.all;}
for(var i=0,len=elements.length;i<len;++i){if(method(elements[i])){nodes[nodes.length]=elements[i];}}
return nodes;},batch:function(el,method,o,override){var id=el;el=Y.Dom.get(el);var scope=(override)?o:window;if(!el||el.tagName||!el.length){if(!el){return false;}
return method.call(scope,el,o);}
var collection=[];for(var i=0,len=el.length;i<len;++i){if(!el[i]){id=el[i];}
collection[collection.length]=method.call(scope,el[i],o);}
return collection;},getDocumentHeight:function(){var scrollHeight=(document.compatMode!='CSS1Compat')?document.body.scrollHeight:document.documentElement.scrollHeight;var h=Math.max(scrollHeight,Y.Dom.getViewportHeight());return h;},getDocumentWidth:function(){var scrollWidth=(document.compatMode!='CSS1Compat')?document.body.scrollWidth:document.documentElement.scrollWidth;var w=Math.max(scrollWidth,Y.Dom.getViewportWidth());return w;},getViewportHeight:function(){var height=self.innerHeight;var mode=document.compatMode;if((mode||isIE)&&!isOpera){height=(mode=='CSS1Compat')?document.documentElement.clientHeight:document.body.clientHeight;}
return height;},getViewportWidth:function(){var width=self.innerWidth;var mode=document.compatMode;if(mode||isIE){width=(mode=='CSS1Compat')?document.documentElement.clientWidth:document.body.clientWidth;}
return width;}};})();YAHOO.util.Region=function(t,r,b,l){this.top=t;this[1]=t;this.right=r;this.bottom=b;this.left=l;this[0]=l;};YAHOO.util.Region.prototype.contains=function(region){return(region.left>=this.left&&region.right<=this.right&&region.top>=this.top&&region.bottom<=this.bottom);};YAHOO.util.Region.prototype.getArea=function(){return((this.bottom-this.top)*(this.right-this.left));};YAHOO.util.Region.prototype.intersect=function(region){var t=Math.max(this.top,region.top);var r=Math.min(this.right,region.right);var b=Math.min(this.bottom,region.bottom);var l=Math.max(this.left,region.left);if(b>=t&&r>=l){return new YAHOO.util.Region(t,r,b,l);}else{return null;}};YAHOO.util.Region.prototype.union=function(region){var t=Math.min(this.top,region.top);var r=Math.max(this.right,region.right);var b=Math.max(this.bottom,region.bottom);var l=Math.min(this.left,region.left);return new YAHOO.util.Region(t,r,b,l);};YAHOO.util.Region.prototype.toString=function(){return("Region {"+"top: "+this.top+", right: "+this.right+", bottom: "+this.bottom+", left: "+this.left+"}");};YAHOO.util.Region.getRegion=function(el){var p=YAHOO.util.Dom.getXY(el);var t=p[1];var r=p[0]+el.offsetWidth;var b=p[1]+el.offsetHeight;var l=p[0];return new YAHOO.util.Region(t,r,b,l);};YAHOO.util.Point=function(x,y){if(x instanceof Array){y=x[1];x=x[0];}
this.x=this.right=this.left=this[0]=x;this.y=this.top=this.bottom=this[1]=y;};YAHOO.util.Point.prototype=new YAHOO.util.Region();
YAHOO.widget.AutoComplete=function(elInput,elContainer,oDataSource,oConfigs){if(elInput&&elContainer&&oDataSource){if(oDataSource&&(oDataSource instanceof YAHOO.widget.DataSource)){this.dataSource=oDataSource;}
else{return;}
if(YAHOO.util.Dom.inDocument(elInput)){if(typeof elInput=="string"){this._sName="instance"+YAHOO.widget.AutoComplete._nIndex+" "+elInput;this._oTextbox=document.getElementById(elInput);}
else{this._sName=(elInput.id)?"instance"+YAHOO.widget.AutoComplete._nIndex+" "+elInput.id:"instance"+YAHOO.widget.AutoComplete._nIndex;this._oTextbox=elInput;}}
else{return;}
if(YAHOO.util.Dom.inDocument(elContainer)){if(typeof elContainer=="string"){this._oContainer=document.getElementById(elContainer);}
else{this._oContainer=elContainer;}
if(this._oContainer.style.display=="none"){}}
else{return;}
if(typeof oConfigs=="object"){for(var sConfig in oConfigs){if(sConfig){this[sConfig]=oConfigs[sConfig];}}}
this._initContainer();this._initProps();this._initList();this._initContainerHelpers();var oSelf=this;var oTextbox=this._oTextbox;var oContent=this._oContainer._oContent;YAHOO.util.Event.addListener(oTextbox,"keyup",oSelf._onTextboxKeyUp,oSelf);YAHOO.util.Event.addListener(oTextbox,"keydown",oSelf._onTextboxKeyDown,oSelf);YAHOO.util.Event.addListener(oTextbox,"focus",oSelf._onTextboxFocus,oSelf);YAHOO.util.Event.addListener(oTextbox,"blur",oSelf._onTextboxBlur,oSelf);YAHOO.util.Event.addListener(oContent,"mouseover",oSelf._onContainerMouseover,oSelf);YAHOO.util.Event.addListener(oContent,"mouseout",oSelf._onContainerMouseout,oSelf);YAHOO.util.Event.addListener(oContent,"scroll",oSelf._onContainerScroll,oSelf);YAHOO.util.Event.addListener(oContent,"resize",oSelf._onContainerResize,oSelf);if(oTextbox.form){YAHOO.util.Event.addListener(oTextbox.form,"submit",oSelf._onFormSubmit,oSelf);}
YAHOO.util.Event.addListener(oTextbox,"keypress",oSelf._onTextboxKeyPress,oSelf);this.textboxFocusEvent=new YAHOO.util.CustomEvent("textboxFocus",this);this.textboxKeyEvent=new YAHOO.util.CustomEvent("textboxKey",this);this.dataRequestEvent=new YAHOO.util.CustomEvent("dataRequest",this);this.dataReturnEvent=new YAHOO.util.CustomEvent("dataReturn",this);this.dataErrorEvent=new YAHOO.util.CustomEvent("dataError",this);this.containerExpandEvent=new YAHOO.util.CustomEvent("containerExpand",this);this.typeAheadEvent=new YAHOO.util.CustomEvent("typeAhead",this);this.itemMouseOverEvent=new YAHOO.util.CustomEvent("itemMouseOver",this);this.itemMouseOutEvent=new YAHOO.util.CustomEvent("itemMouseOut",this);this.itemArrowToEvent=new YAHOO.util.CustomEvent("itemArrowTo",this);this.itemArrowFromEvent=new YAHOO.util.CustomEvent("itemArrowFrom",this);this.itemSelectEvent=new YAHOO.util.CustomEvent("itemSelect",this);this.unmatchedItemSelectEvent=new YAHOO.util.CustomEvent("unmatchedItemSelect",this);this.selectionEnforceEvent=new YAHOO.util.CustomEvent("selectionEnforce",this);this.containerCollapseEvent=new YAHOO.util.CustomEvent("containerCollapse",this);this.textboxBlurEvent=new YAHOO.util.CustomEvent("textboxBlur",this);oTextbox.setAttribute("autocomplete","off");YAHOO.widget.AutoComplete._nIndex++;}
else{}};YAHOO.widget.AutoComplete.prototype.dataSource=null;YAHOO.widget.AutoComplete.prototype.minQueryLength=1;YAHOO.widget.AutoComplete.prototype.maxResultsDisplayed=10;YAHOO.widget.AutoComplete.prototype.queryDelay=0.5;YAHOO.widget.AutoComplete.prototype.highlightClassName="yui-ac-highlight";YAHOO.widget.AutoComplete.prototype.prehighlightClassName=null;YAHOO.widget.AutoComplete.prototype.delimChar=null;YAHOO.widget.AutoComplete.prototype.autoHighlight=true;YAHOO.widget.AutoComplete.prototype.typeAhead=false;YAHOO.widget.AutoComplete.prototype.animHoriz=false;YAHOO.widget.AutoComplete.prototype.animVert=true;YAHOO.widget.AutoComplete.prototype.animSpeed=0.3;YAHOO.widget.AutoComplete.prototype.forceSelection=false;YAHOO.widget.AutoComplete.prototype.allowBrowserAutocomplete=true;YAHOO.widget.AutoComplete.prototype.alwaysShowContainer=false;YAHOO.widget.AutoComplete.prototype.useIFrame=false;YAHOO.widget.AutoComplete.prototype.useShadow=false;YAHOO.widget.AutoComplete.prototype.toString=function(){return"AutoComplete "+this._sName;};YAHOO.widget.AutoComplete.prototype.isContainerOpen=function(){return this._bContainerOpen;};YAHOO.widget.AutoComplete.prototype.getListItems=function(){return this._aListItems;};YAHOO.widget.AutoComplete.prototype.getListItemData=function(oListItem){if(oListItem._oResultData){return oListItem._oResultData;}
else{return false;}};YAHOO.widget.AutoComplete.prototype.setHeader=function(sHeader){if(sHeader){if(this._oContainer._oContent._oHeader){this._oContainer._oContent._oHeader.innerHTML=sHeader;this._oContainer._oContent._oHeader.style.display="block";}}
else{this._oContainer._oContent._oHeader.innerHTML="";this._oContainer._oContent._oHeader.style.display="none";}};YAHOO.widget.AutoComplete.prototype.setFooter=function(sFooter){if(sFooter){if(this._oContainer._oContent._oFooter){this._oContainer._oContent._oFooter.innerHTML=sFooter;this._oContainer._oContent._oFooter.style.display="block";}}
else{this._oContainer._oContent._oFooter.innerHTML="";this._oContainer._oContent._oFooter.style.display="none";}};YAHOO.widget.AutoComplete.prototype.setBody=function(sBody){if(sBody){if(this._oContainer._oContent._oBody){this._oContainer._oContent._oBody.innerHTML=sBody;this._oContainer._oContent._oBody.style.display="block";this._oContainer._oContent.style.display="block";}}
else{this._oContainer._oContent._oBody.innerHTML="";this._oContainer._oContent.style.display="none";}
this._maxResultsDisplayed=0;};YAHOO.widget.AutoComplete.prototype.formatResult=function(oResultItem,sQuery){var sResult=oResultItem[0];if(sResult){return sResult;}
else{return"";}};YAHOO.widget.AutoComplete.prototype.doBeforeExpandContainer=function(oResultItem,sQuery){return true;};YAHOO.widget.AutoComplete.prototype.sendQuery=function(sQuery){this._sendQuery(sQuery);};YAHOO.widget.AutoComplete.prototype.textboxFocusEvent=null;YAHOO.widget.AutoComplete.prototype.textboxKeyEvent=null;YAHOO.widget.AutoComplete.prototype.dataRequestEvent=null;YAHOO.widget.AutoComplete.prototype.dataReturnEvent=null;YAHOO.widget.AutoComplete.prototype.dataErrorEvent=null;YAHOO.widget.AutoComplete.prototype.containerExpandEvent=null;YAHOO.widget.AutoComplete.prototype.typeAheadEvent=null;YAHOO.widget.AutoComplete.prototype.itemMouseOverEvent=null;YAHOO.widget.AutoComplete.prototype.itemMouseOutEvent=null;YAHOO.widget.AutoComplete.prototype.itemArrowToEvent=null;YAHOO.widget.AutoComplete.prototype.itemArrowFromEvent=null;YAHOO.widget.AutoComplete.prototype.itemSelectEvent=null;YAHOO.widget.AutoComplete.prototype.unmatchedItemSelectEvent=null;YAHOO.widget.AutoComplete.prototype.selectionEnforceEvent=null;YAHOO.widget.AutoComplete.prototype.containerCollapseEvent=null;YAHOO.widget.AutoComplete.prototype.textboxBlurEvent=null;YAHOO.widget.AutoComplete._nIndex=0;YAHOO.widget.AutoComplete.prototype._sName=null;YAHOO.widget.AutoComplete.prototype._oTextbox=null;YAHOO.widget.AutoComplete.prototype._bFocused=true;YAHOO.widget.AutoComplete.prototype._oAnim=null;YAHOO.widget.AutoComplete.prototype._oContainer=null;YAHOO.widget.AutoComplete.prototype._bContainerOpen=false;YAHOO.widget.AutoComplete.prototype._bOverContainer=false;YAHOO.widget.AutoComplete.prototype._aListItems=null;YAHOO.widget.AutoComplete.prototype._nDisplayedItems=0;YAHOO.widget.AutoComplete.prototype._maxResultsDisplayed=0;YAHOO.widget.AutoComplete.prototype._sCurQuery=null;YAHOO.widget.AutoComplete.prototype._sSavedQuery=null;YAHOO.widget.AutoComplete.prototype._oCurItem=null;YAHOO.widget.AutoComplete.prototype._bItemSelected=false;YAHOO.widget.AutoComplete.prototype._nKeyCode=null;YAHOO.widget.AutoComplete.prototype._nDelayID=-1;YAHOO.widget.AutoComplete.prototype._iFrameSrc="javascript:false;";YAHOO.widget.AutoComplete.prototype._queryInterval=null;YAHOO.widget.AutoComplete.prototype._sLastTextboxValue=null;YAHOO.widget.AutoComplete.prototype._initProps=function(){var minQueryLength=this.minQueryLength;if(isNaN(minQueryLength)||(minQueryLength<1)){minQueryLength=1;}
var maxResultsDisplayed=this.maxResultsDisplayed;if(isNaN(this.maxResultsDisplayed)||(this.maxResultsDisplayed<1)){this.maxResultsDisplayed=10;}
var queryDelay=this.queryDelay;if(isNaN(this.queryDelay)||(this.queryDelay<0)){this.queryDelay=0.5;}
var aDelimChar=(this.delimChar)?this.delimChar:null;if(aDelimChar){if(typeof aDelimChar=="string"){this.delimChar=[aDelimChar];}
else if(aDelimChar.constructor!=Array){this.delimChar=null;}}
var animSpeed=this.animSpeed;if((this.animHoriz||this.animVert)&&YAHOO.util.Anim){if(isNaN(animSpeed)||(animSpeed<0)){animSpeed=0.3;}
if(!this._oAnim){oAnim=new YAHOO.util.Anim(this._oContainer._oContent,{},this.animSpeed);this._oAnim=oAnim;}
else{this._oAnim.duration=animSpeed;}}
if(this.forceSelection&&this.delimChar){}};YAHOO.widget.AutoComplete.prototype._initContainerHelpers=function(){if(this.useShadow&&!this._oContainer._oShadow){var oShadow=document.createElement("div");oShadow.className="yui-ac-shadow";this._oContainer._oShadow=this._oContainer.appendChild(oShadow);}
if(this.useIFrame&&!this._oContainer._oIFrame){var oIFrame=document.createElement("iframe");oIFrame.src=this._iFrameSrc;oIFrame.frameBorder=0;oIFrame.scrolling="no";oIFrame.style.position="absolute";oIFrame.style.width="100%";oIFrame.style.height="100%";oIFrame.tabIndex=-1;this._oContainer._oIFrame=this._oContainer.appendChild(oIFrame);}};YAHOO.widget.AutoComplete.prototype._initContainer=function(){if(!this._oContainer._oContent){var oContent=document.createElement("div");oContent.className="yui-ac-content";oContent.style.display="none";this._oContainer._oContent=this._oContainer.appendChild(oContent);var oHeader=document.createElement("div");oHeader.className="yui-ac-hd";oHeader.style.display="none";this._oContainer._oContent._oHeader=this._oContainer._oContent.appendChild(oHeader);var oBody=document.createElement("div");oBody.className="yui-ac-bd";this._oContainer._oContent._oBody=this._oContainer._oContent.appendChild(oBody);var oFooter=document.createElement("div");oFooter.className="yui-ac-ft";oFooter.style.display="none";this._oContainer._oContent._oFooter=this._oContainer._oContent.appendChild(oFooter);}
else{}};YAHOO.widget.AutoComplete.prototype._initList=function(){this._aListItems=[];while(this._oContainer._oContent._oBody.hasChildNodes()){var oldListItems=this.getListItems();if(oldListItems){for(var oldi=oldListItems.length-1;oldi>=0;i--){oldListItems[oldi]=null;}}
this._oContainer._oContent._oBody.innerHTML="";}
var oList=document.createElement("ul");oList=this._oContainer._oContent._oBody.appendChild(oList);for(var i=0;i<this.maxResultsDisplayed;i++){var oItem=document.createElement("li");oItem=oList.appendChild(oItem);this._aListItems[i]=oItem;this._initListItem(oItem,i);}
this._maxResultsDisplayed=this.maxResultsDisplayed;};YAHOO.widget.AutoComplete.prototype._initListItem=function(oItem,nItemIndex){var oSelf=this;oItem.style.display="none";oItem._nItemIndex=nItemIndex;oItem.mouseover=oItem.mouseout=oItem.onclick=null;YAHOO.util.Event.addListener(oItem,"mouseover",oSelf._onItemMouseover,oSelf);YAHOO.util.Event.addListener(oItem,"mouseout",oSelf._onItemMouseout,oSelf);YAHOO.util.Event.addListener(oItem,"click",oSelf._onItemMouseclick,oSelf);};YAHOO.widget.AutoComplete.prototype._onIMEDetected=function(oSelf){oSelf._enableIntervalDetection();};YAHOO.widget.AutoComplete.prototype._enableIntervalDetection=function(){var currValue=this._oTextbox.value;var lastValue=this._sLastTextboxValue;if(currValue!=lastValue){this._sLastTextboxValue=currValue;this._sendQuery(currValue);}};YAHOO.widget.AutoComplete.prototype._cancelIntervalDetection=function(oSelf){if(oSelf._queryInterval){clearInterval(oSelf._queryInterval);}};YAHOO.widget.AutoComplete.prototype._isIgnoreKey=function(nKeyCode){if((nKeyCode==9)||(nKeyCode==13)||(nKeyCode==16)||(nKeyCode==17)||(nKeyCode>=18&&nKeyCode<=20)||(nKeyCode==27)||(nKeyCode>=33&&nKeyCode<=35)||(nKeyCode>=36&&nKeyCode<=38)||(nKeyCode==40)||(nKeyCode>=44&&nKeyCode<=45)){return true;}
return false;};YAHOO.widget.AutoComplete.prototype._sendQuery=function(sQuery){if(this.minQueryLength==-1){this._toggleContainer(false);return;}
var aDelimChar=(this.delimChar)?this.delimChar:null;if(aDelimChar){var nDelimIndex=-1;for(var i=aDelimChar.length-1;i>=0;i--){var nNewIndex=sQuery.lastIndexOf(aDelimChar[i]);if(nNewIndex>nDelimIndex){nDelimIndex=nNewIndex;}}
if(aDelimChar[i]==" "){for(var j=aDelimChar.length-1;j>=0;j--){if(sQuery[nDelimIndex-1]==aDelimChar[j]){nDelimIndex--;break;}}}
if(nDelimIndex>-1){var nQueryStart=nDelimIndex+1;while(sQuery.charAt(nQueryStart)==" "){nQueryStart+=1;}
this._sSavedQuery=sQuery.substring(0,nQueryStart);sQuery=sQuery.substr(nQueryStart);}
else if(sQuery.indexOf(this._sSavedQuery)<0){this._sSavedQuery=null;}}
if(sQuery&&(sQuery.length<this.minQueryLength)||(!sQuery&&this.minQueryLength>0)){if(this._nDelayID!=-1){clearTimeout(this._nDelayID);}
this._toggleContainer(false);return;}
sQuery=encodeURIComponent(sQuery);this._nDelayID=-1;this.dataRequestEvent.fire(this,sQuery);this.dataSource.getResults(this._populateList,sQuery,this);};YAHOO.widget.AutoComplete.prototype._populateList=function(sQuery,aResults,oSelf){if(aResults===null){oSelf.dataErrorEvent.fire(oSelf,sQuery);}
if(!oSelf._bFocused||!aResults){return;}
var isOpera=(navigator.userAgent.toLowerCase().indexOf("opera")!=-1);var contentStyle=oSelf._oContainer._oContent.style;contentStyle.width=(!isOpera)?null:"";contentStyle.height=(!isOpera)?null:"";var sCurQuery=decodeURIComponent(sQuery);oSelf._sCurQuery=sCurQuery;oSelf._bItemSelected=false;if(oSelf._maxResultsDisplayed!=oSelf.maxResultsDisplayed){oSelf._initList();}
var nItems=Math.min(aResults.length,oSelf.maxResultsDisplayed);oSelf._nDisplayedItems=nItems;if(nItems>0){oSelf._initContainerHelpers();var aItems=oSelf._aListItems;for(var i=nItems-1;i>=0;i--){var oItemi=aItems[i];var oResultItemi=aResults[i];oItemi.innerHTML=oSelf.formatResult(oResultItemi,sCurQuery);oItemi.style.display="list-item";oItemi._sResultKey=oResultItemi[0];oItemi._oResultData=oResultItemi;}
for(var j=aItems.length-1;j>=nItems;j--){var oItemj=aItems[j];oItemj.innerHTML=null;oItemj.style.display="none";oItemj._sResultKey=null;oItemj._oResultData=null;}
if(oSelf.autoHighlight){var oFirstItem=aItems[0];oSelf._toggleHighlight(oFirstItem,"to");oSelf.itemArrowToEvent.fire(oSelf,oFirstItem);oSelf._typeAhead(oFirstItem,sQuery);}
else{oSelf._oCurItem=null;}
var ok=oSelf.doBeforeExpandContainer(oSelf._oTextbox,oSelf._oContainer,sQuery,aResults);oSelf._toggleContainer(ok);}
else{oSelf._toggleContainer(false);}
oSelf.dataReturnEvent.fire(oSelf,sQuery,aResults);};YAHOO.widget.AutoComplete.prototype._clearSelection=function(){var sValue=this._oTextbox.value;var sChar=(this.delimChar)?this.delimChar[0]:null;var nIndex=(sChar)?sValue.lastIndexOf(sChar,sValue.length-2):-1;if(nIndex>-1){this._oTextbox.value=sValue.substring(0,nIndex);}
else{this._oTextbox.value="";}
this._sSavedQuery=this._oTextbox.value;this.selectionEnforceEvent.fire(this);};YAHOO.widget.AutoComplete.prototype._textMatchesOption=function(){var foundMatch=false;for(var i=this._nDisplayedItems-1;i>=0;i--){var oItem=this._aListItems[i];var sMatch=oItem._sResultKey.toLowerCase();if(sMatch==this._sCurQuery.toLowerCase()){foundMatch=true;break;}}
return(foundMatch);};YAHOO.widget.AutoComplete.prototype._typeAhead=function(oItem,sQuery){if(!this.typeAhead||(this._nKeyCode==8)){return;}
var oTextbox=this._oTextbox;var sValue=this._oTextbox.value;if(!oTextbox.setSelectionRange&&!oTextbox.createTextRange){return;}
var nStart=sValue.length;this._updateValue(oItem);var nEnd=oTextbox.value.length;this._selectText(oTextbox,nStart,nEnd);var sPrefill=oTextbox.value.substr(nStart,nEnd);this.typeAheadEvent.fire(this,sQuery,sPrefill);};YAHOO.widget.AutoComplete.prototype._selectText=function(oTextbox,nStart,nEnd){if(oTextbox.setSelectionRange){oTextbox.setSelectionRange(nStart,nEnd);}
else if(oTextbox.createTextRange){var oTextRange=oTextbox.createTextRange();oTextRange.moveStart("character",nStart);oTextRange.moveEnd("character",nEnd-oTextbox.value.length);oTextRange.select();}
else{oTextbox.select();}};YAHOO.widget.AutoComplete.prototype._toggleContainerHelpers=function(bShow){var bFireEvent=false;var width=this._oContainer._oContent.offsetWidth+"px";var height=this._oContainer._oContent.offsetHeight+"px";if(this.useIFrame&&this._oContainer._oIFrame){bFireEvent=true;if(bShow){this._oContainer._oIFrame.style.width=width;this._oContainer._oIFrame.style.height=height;}
else{this._oContainer._oIFrame.style.width=0;this._oContainer._oIFrame.style.height=0;}}
if(this.useShadow&&this._oContainer._oShadow){bFireEvent=true;if(bShow){this._oContainer._oShadow.style.width=width;this._oContainer._oShadow.style.height=height;}
else{this._oContainer._oShadow.style.width=0;this._oContainer._oShadow.style.height=0;}}};YAHOO.widget.AutoComplete.prototype._toggleContainer=function(bShow){var oContainer=this._oContainer;if(this.alwaysShowContainer&&this._bContainerOpen){return;}
if(!bShow){this._oContainer._oContent.scrollTop=0;var aItems=this._aListItems;if(aItems&&(aItems.length>0)){for(var i=aItems.length-1;i>=0;i--){aItems[i].style.display="none";}}
if(this._oCurItem){this._toggleHighlight(this._oCurItem,"from");}
this._oCurItem=null;this._nDisplayedItems=0;this._sCurQuery=null;}
if(!bShow&&!this._bContainerOpen){oContainer._oContent.style.display="none";return;}
var oAnim=this._oAnim;if(oAnim&&oAnim.getEl()&&(this.animHoriz||this.animVert)){if(!bShow){this._toggleContainerHelpers(bShow);}
if(oAnim.isAnimated()){oAnim.stop();}
var oClone=oContainer._oContent.cloneNode(true);oContainer.appendChild(oClone);oClone.style.top="-9000px";oClone.style.display="block";var wExp=oClone.offsetWidth;var hExp=oClone.offsetHeight;var wColl=(this.animHoriz)?0:wExp;var hColl=(this.animVert)?0:hExp;oAnim.attributes=(bShow)?{width:{to:wExp},height:{to:hExp}}:{width:{to:wColl},height:{to:hColl}};if(bShow&&!this._bContainerOpen){oContainer._oContent.style.width=wColl+"px";oContainer._oContent.style.height=hColl+"px";}
else{oContainer._oContent.style.width=wExp+"px";oContainer._oContent.style.height=hExp+"px";}
oContainer.removeChild(oClone);oClone=null;var oSelf=this;var onAnimComplete=function(){oAnim.onComplete.unsubscribeAll();if(bShow){oSelf.containerExpandEvent.fire(oSelf);}
else{oContainer._oContent.style.display="none";oSelf.containerCollapseEvent.fire(oSelf);}
oSelf._toggleContainerHelpers(bShow);};oContainer._oContent.style.display="block";oAnim.onComplete.subscribe(onAnimComplete);oAnim.animate();this._bContainerOpen=bShow;}
else{if(bShow){oContainer._oContent.style.display="block";this.containerExpandEvent.fire(this);}
else{oContainer._oContent.style.display="none";this.containerCollapseEvent.fire(this);}
this._toggleContainerHelpers(bShow);this._bContainerOpen=bShow;}};YAHOO.widget.AutoComplete.prototype._toggleHighlight=function(oNewItem,sType){var sHighlight=this.highlightClassName;if(this._oCurItem){YAHOO.util.Dom.removeClass(this._oCurItem,sHighlight);}
if((sType=="to")&&sHighlight){YAHOO.util.Dom.addClass(oNewItem,sHighlight);this._oCurItem=oNewItem;}};YAHOO.widget.AutoComplete.prototype._togglePrehighlight=function(oNewItem,sType){if(oNewItem==this._oCurItem){return;}
var sPrehighlight=this.prehighlightClassName;if((sType=="mouseover")&&sPrehighlight){YAHOO.util.Dom.addClass(oNewItem,sPrehighlight);}
else{YAHOO.util.Dom.removeClass(oNewItem,sPrehighlight);}};YAHOO.widget.AutoComplete.prototype._updateValue=function(oItem){var oTextbox=this._oTextbox;var sDelimChar=(this.delimChar)?(this.delimChar[0]||this.delimChar):null;var sSavedQuery=this._sSavedQuery;var sResultKey=oItem._sResultKey;oTextbox.focus();oTextbox.value="";if(sDelimChar){if(sSavedQuery){oTextbox.value=sSavedQuery;}
oTextbox.value+=sResultKey+sDelimChar;if(sDelimChar!=" "){oTextbox.value+=" ";}}
else{oTextbox.value=sResultKey;}
if(oTextbox.type=="textarea"){oTextbox.scrollTop=oTextbox.scrollHeight;}
var end=oTextbox.value.length;this._selectText(oTextbox,end,end);this._oCurItem=oItem;};YAHOO.widget.AutoComplete.prototype._selectItem=function(oItem){this._bItemSelected=true;this._updateValue(oItem);this._cancelIntervalDetection(this);this.itemSelectEvent.fire(this,oItem,oItem._oResultData);this._toggleContainer(false);};YAHOO.widget.AutoComplete.prototype._jumpSelection=function(){if(!this.typeAhead){return;}
else{this._toggleContainer(false);}};YAHOO.widget.AutoComplete.prototype._moveSelection=function(nKeyCode){if(this._bContainerOpen){var oCurItem=this._oCurItem;var nCurItemIndex=-1;if(oCurItem){nCurItemIndex=oCurItem._nItemIndex;}
var nNewItemIndex=(nKeyCode==40)?(nCurItemIndex+1):(nCurItemIndex-1);if(nNewItemIndex<-2||nNewItemIndex>=this._nDisplayedItems){return;}
if(oCurItem){this._toggleHighlight(oCurItem,"from");this.itemArrowFromEvent.fire(this,oCurItem);}
if(nNewItemIndex==-1){if(this.delimChar&&this._sSavedQuery){if(!this._textMatchesOption()){this._oTextbox.value=this._sSavedQuery;}
else{this._oTextbox.value=this._sSavedQuery+this._sCurQuery;}}
else{this._oTextbox.value=this._sCurQuery;}
this._oCurItem=null;return;}
if(nNewItemIndex==-2){this._toggleContainer(false);return;}
var oNewItem=this._aListItems[nNewItemIndex];var oContent=this._oContainer._oContent;var scrollOn=((YAHOO.util.Dom.getStyle(oContent,"overflow")=="auto")||(YAHOO.util.Dom.getStyle(oContent,"overflowY")=="auto"));if(scrollOn&&(nNewItemIndex>-1)&&(nNewItemIndex<this._nDisplayedItems)){if(nKeyCode==40){if((oNewItem.offsetTop+oNewItem.offsetHeight)>(oContent.scrollTop+oContent.offsetHeight)){oContent.scrollTop=(oNewItem.offsetTop+oNewItem.offsetHeight)-oContent.offsetHeight;}
else if((oNewItem.offsetTop+oNewItem.offsetHeight)<oContent.scrollTop){oContent.scrollTop=oNewItem.offsetTop;}}
else{if(oNewItem.offsetTop<oContent.scrollTop){this._oContainer._oContent.scrollTop=oNewItem.offsetTop;}
else if(oNewItem.offsetTop>(oContent.scrollTop+oContent.offsetHeight)){this._oContainer._oContent.scrollTop=(oNewItem.offsetTop+oNewItem.offsetHeight)-oContent.offsetHeight;}}}
this._toggleHighlight(oNewItem,"to");this.itemArrowToEvent.fire(this,oNewItem);if(this.typeAhead){this._updateValue(oNewItem);}}};YAHOO.widget.AutoComplete.prototype._onItemMouseover=function(v,oSelf){if(oSelf.prehighlightClassName){oSelf._togglePrehighlight(this,"mouseover");}
else{oSelf._toggleHighlight(this,"to");}
oSelf.itemMouseOverEvent.fire(oSelf,this);};YAHOO.widget.AutoComplete.prototype._onItemMouseout=function(v,oSelf){if(oSelf.prehighlightClassName){oSelf._togglePrehighlight(this,"mouseout");}
else{oSelf._toggleHighlight(this,"from");}
oSelf.itemMouseOutEvent.fire(oSelf,this);};YAHOO.widget.AutoComplete.prototype._onItemMouseclick=function(v,oSelf){oSelf._toggleHighlight(this,"to");oSelf._selectItem(this);};YAHOO.widget.AutoComplete.prototype._onContainerMouseover=function(v,oSelf){oSelf._bOverContainer=true;};YAHOO.widget.AutoComplete.prototype._onContainerMouseout=function(v,oSelf){oSelf._bOverContainer=false;if(oSelf._oCurItem){oSelf._toggleHighlight(oSelf._oCurItem,"to");}};YAHOO.widget.AutoComplete.prototype._onContainerScroll=function(v,oSelf){oSelf._oTextbox.focus();};YAHOO.widget.AutoComplete.prototype._onContainerResize=function(v,oSelf){oSelf._toggleContainerHelpers(oSelf._bContainerOpen);};YAHOO.widget.AutoComplete.prototype._onTextboxKeyDown=function(v,oSelf){var nKeyCode=v.keyCode;switch(nKeyCode){case 9:if(oSelf.delimChar&&(oSelf._nKeyCode!=nKeyCode)){if(oSelf._bContainerOpen){YAHOO.util.Event.stopEvent(v);}}
if(oSelf._oCurItem){oSelf._selectItem(oSelf._oCurItem);}
else{oSelf._toggleContainer(false);}
break;case 13:if(oSelf._nKeyCode!=nKeyCode){if(oSelf._bContainerOpen){YAHOO.util.Event.stopEvent(v);}}
if(oSelf._oCurItem){oSelf._selectItem(oSelf._oCurItem);}
else{oSelf._toggleContainer(false);}
break;case 27:oSelf._toggleContainer(false);return;case 39:oSelf._jumpSelection();break;case 38:YAHOO.util.Event.stopEvent(v);oSelf._moveSelection(nKeyCode);break;case 40:YAHOO.util.Event.stopEvent(v);oSelf._moveSelection(nKeyCode);break;default:break;}};YAHOO.widget.AutoComplete.prototype._onTextboxKeyPress=function(v,oSelf){var nKeyCode=v.keyCode;var isMac=(navigator.userAgent.toLowerCase().indexOf("mac")!=-1);if(isMac){switch(nKeyCode){case 9:if(oSelf.delimChar&&(oSelf._nKeyCode!=nKeyCode)){if(oSelf._bContainerOpen){YAHOO.util.Event.stopEvent(v);}}
break;case 13:if(oSelf._nKeyCode!=nKeyCode){if(oSelf._bContainerOpen){YAHOO.util.Event.stopEvent(v);}}
break;case 38:case 40:YAHOO.util.Event.stopEvent(v);break;default:break;}}
else if(nKeyCode==229){oSelf._queryInterval=setInterval(function(){oSelf._onIMEDetected(oSelf);},500);}};YAHOO.widget.AutoComplete.prototype._onTextboxKeyUp=function(v,oSelf){oSelf._initProps();var nKeyCode=v.keyCode;oSelf._nKeyCode=nKeyCode;var sText=this.value;if(oSelf._isIgnoreKey(nKeyCode)||(sText.toLowerCase()==oSelf._sCurQuery)){return;}
else{oSelf.textboxKeyEvent.fire(oSelf,nKeyCode);}
if(oSelf.queryDelay>0){var nDelayID=setTimeout(function(){oSelf._sendQuery(sText);},(oSelf.queryDelay*1000));if(oSelf._nDelayID!=-1){clearTimeout(oSelf._nDelayID);}
oSelf._nDelayID=nDelayID;}
else{oSelf._sendQuery(sText);}};YAHOO.widget.AutoComplete.prototype._onTextboxFocus=function(v,oSelf){oSelf._oTextbox.setAttribute("autocomplete","off");oSelf._bFocused=true;oSelf.textboxFocusEvent.fire(oSelf);};YAHOO.widget.AutoComplete.prototype._onTextboxBlur=function(v,oSelf){if(!oSelf._bOverContainer||(oSelf._nKeyCode==9)){if(!oSelf._bItemSelected){if(!oSelf._bContainerOpen||(oSelf._bContainerOpen&&!oSelf._textMatchesOption())){if(oSelf.forceSelection){oSelf._clearSelection();}
else{oSelf.unmatchedItemSelectEvent.fire(oSelf,oSelf._sCurQuery);}}}
if(oSelf._bContainerOpen){oSelf._toggleContainer(false);}
oSelf._cancelIntervalDetection(oSelf);oSelf._bFocused=false;oSelf.textboxBlurEvent.fire(oSelf);}};YAHOO.widget.AutoComplete.prototype._onFormSubmit=function(v,oSelf){if(oSelf.allowBrowserAutocomplete){oSelf._oTextbox.setAttribute("autocomplete","on");}
else{oSelf._oTextbox.setAttribute("autocomplete","off");}};YAHOO.widget.DataSource=function(){};YAHOO.widget.DataSource.ERROR_DATANULL="Response data was null";YAHOO.widget.DataSource.ERROR_DATAPARSE="Response data could not be parsed";YAHOO.widget.DataSource.prototype.maxCacheEntries=15;YAHOO.widget.DataSource.prototype.queryMatchContains=false;YAHOO.widget.DataSource.prototype.queryMatchSubset=false;YAHOO.widget.DataSource.prototype.queryMatchCase=false;YAHOO.widget.DataSource.prototype.toString=function(){return"DataSource "+this._sName;};YAHOO.widget.DataSource.prototype.getResults=function(oCallbackFn,sQuery,oParent){var aResults=this._doQueryCache(oCallbackFn,sQuery,oParent);if(aResults.length===0){this.queryEvent.fire(this,oParent,sQuery);this.doQuery(oCallbackFn,sQuery,oParent);}};YAHOO.widget.DataSource.prototype.doQuery=function(oCallbackFn,sQuery,oParent){};YAHOO.widget.DataSource.prototype.flushCache=function(){if(this._aCache){this._aCache=[];}
if(this._aCacheHelper){this._aCacheHelper=[];}
this.cacheFlushEvent.fire(this);};YAHOO.widget.DataSource.prototype.queryEvent=null;YAHOO.widget.DataSource.prototype.cacheQueryEvent=null;YAHOO.widget.DataSource.prototype.getResultsEvent=null;YAHOO.widget.DataSource.prototype.getCachedResultsEvent=null;YAHOO.widget.DataSource.prototype.dataErrorEvent=null;YAHOO.widget.DataSource.prototype.cacheFlushEvent=null;YAHOO.widget.DataSource._nIndex=0;YAHOO.widget.DataSource.prototype._sName=null;YAHOO.widget.DataSource.prototype._aCache=null;YAHOO.widget.DataSource.prototype._init=function(){var maxCacheEntries=this.maxCacheEntries;if(isNaN(maxCacheEntries)||(maxCacheEntries<0)){maxCacheEntries=0;}
if(maxCacheEntries>0&&!this._aCache){this._aCache=[];}
this._sName="instance"+YAHOO.widget.DataSource._nIndex;YAHOO.widget.DataSource._nIndex++;this.queryEvent=new YAHOO.util.CustomEvent("query",this);this.cacheQueryEvent=new YAHOO.util.CustomEvent("cacheQuery",this);this.getResultsEvent=new YAHOO.util.CustomEvent("getResults",this);this.getCachedResultsEvent=new YAHOO.util.CustomEvent("getCachedResults",this);this.dataErrorEvent=new YAHOO.util.CustomEvent("dataError",this);this.cacheFlushEvent=new YAHOO.util.CustomEvent("cacheFlush",this);};YAHOO.widget.DataSource.prototype._addCacheElem=function(oResult){var aCache=this._aCache;if(!aCache||!oResult||!oResult.query||!oResult.results){return;}
if(aCache.length>=this.maxCacheEntries){aCache.shift();}
aCache.push(oResult);};YAHOO.widget.DataSource.prototype._doQueryCache=function(oCallbackFn,sQuery,oParent){var aResults=[];var bMatchFound=false;var aCache=this._aCache;var nCacheLength=(aCache)?aCache.length:0;var bMatchContains=this.queryMatchContains;if((this.maxCacheEntries>0)&&aCache&&(nCacheLength>0)){this.cacheQueryEvent.fire(this,oParent,sQuery);if(!this.queryMatchCase){var sOrigQuery=sQuery;sQuery=sQuery.toLowerCase();}
for(var i=nCacheLength-1;i>=0;i--){var resultObj=aCache[i];var aAllResultItems=resultObj.results;var matchKey=(!this.queryMatchCase)?encodeURIComponent(resultObj.query).toLowerCase():encodeURIComponent(resultObj.query);if(matchKey==sQuery){bMatchFound=true;aResults=aAllResultItems;if(i!=nCacheLength-1){aCache.splice(i,1);this._addCacheElem(resultObj);}
break;}
else if(this.queryMatchSubset){for(var j=sQuery.length-1;j>=0;j--){var subQuery=sQuery.substr(0,j);if(matchKey==subQuery){bMatchFound=true;for(var k=aAllResultItems.length-1;k>=0;k--){var aRecord=aAllResultItems[k];var sKeyIndex=(this.queryMatchCase)?encodeURIComponent(aRecord[0]).indexOf(sQuery):encodeURIComponent(aRecord[0]).toLowerCase().indexOf(sQuery);if((!bMatchContains&&(sKeyIndex===0))||(bMatchContains&&(sKeyIndex>-1))){aResults.unshift(aRecord);}}
resultObj={};resultObj.query=sQuery;resultObj.results=aResults;this._addCacheElem(resultObj);break;}}
if(bMatchFound){break;}}}
if(bMatchFound){this.getCachedResultsEvent.fire(this,oParent,sOrigQuery,aResults);oCallbackFn(sOrigQuery,aResults,oParent);}}
return aResults;};YAHOO.widget.DS_XHR=function(sScriptURI,aSchema,oConfigs){if(typeof oConfigs=="object"){for(var sConfig in oConfigs){this[sConfig]=oConfigs[sConfig];}}
if(!aSchema||(aSchema.constructor!=Array)){return;}
else{this.schema=aSchema;}
this.scriptURI=sScriptURI;this._init();};YAHOO.widget.DS_XHR.prototype=new YAHOO.widget.DataSource();YAHOO.widget.DS_XHR.TYPE_JSON=0;YAHOO.widget.DS_XHR.TYPE_XML=1;YAHOO.widget.DS_XHR.TYPE_FLAT=2;YAHOO.widget.DS_XHR.ERROR_DATAXHR="XHR response failed";YAHOO.widget.DS_XHR.prototype.connMgr=YAHOO.util.Connect;YAHOO.widget.DS_XHR.prototype.connTimeout=0;YAHOO.widget.DS_XHR.prototype.scriptURI=null;YAHOO.widget.DS_XHR.prototype.scriptQueryParam="query";YAHOO.widget.DS_XHR.prototype.scriptQueryAppend="";YAHOO.widget.DS_XHR.prototype.responseType=YAHOO.widget.DS_XHR.TYPE_JSON;YAHOO.widget.DS_XHR.prototype.responseStripAfter="\n<!-";YAHOO.widget.DS_XHR.prototype.doQuery=function(oCallbackFn,sQuery,oParent){var isXML=(this.responseType==YAHOO.widget.DS_XHR.TYPE_XML);var sUri=this.scriptURI+"?"+this.scriptQueryParam+"="+sQuery;if(this.scriptQueryAppend.length>0){sUri+="&"+this.scriptQueryAppend;}
var oResponse=null;var oSelf=this;var responseSuccess=function(oResp){if(!oSelf._oConn||(oResp.tId!=oSelf._oConn.tId)){oSelf.dataErrorEvent.fire(oSelf,oParent,sQuery,YAHOO.widget.DataSource.ERROR_DATANULL);return;}
for(var foo in oResp){}
if(!isXML){oResp=oResp.responseText;}
else{oResp=oResp.responseXML;}
if(oResp===null){oSelf.dataErrorEvent.fire(oSelf,oParent,sQuery,YAHOO.widget.DataSource.ERROR_DATANULL);return;}
var aResults=oSelf.parseResponse(sQuery,oResp,oParent);var resultObj={};resultObj.query=decodeURIComponent(sQuery);resultObj.results=aResults;if(aResults===null){oSelf.dataErrorEvent.fire(oSelf,oParent,sQuery,YAHOO.widget.DataSource.ERROR_DATAPARSE);aResults=[];}
else{oSelf.getResultsEvent.fire(oSelf,oParent,sQuery,aResults);oSelf._addCacheElem(resultObj);}
oCallbackFn(sQuery,aResults,oParent);};var responseFailure=function(oResp){oSelf.dataErrorEvent.fire(oSelf,oParent,sQuery,YAHOO.widget.DS_XHR.ERROR_DATAXHR);return;};var oCallback={success:responseSuccess,failure:responseFailure};if(!isNaN(this.connTimeout)&&this.connTimeout>0){oCallback.timeout=this.connTimeout;}
if(this._oConn){this.connMgr.abort(this._oConn);}
oSelf._oConn=this.connMgr.asyncRequest("GET",sUri,oCallback,null);};YAHOO.widget.DS_XHR.prototype.parseResponse=function(sQuery,oResponse,oParent){var aSchema=this.schema;var aResults=[];var bError=false;var nEnd=((this.responseStripAfter!=="")&&(oResponse.indexOf))?oResponse.indexOf(this.responseStripAfter):-1;if(nEnd!=-1){oResponse=oResponse.substring(0,nEnd);}
switch(this.responseType){case YAHOO.widget.DS_XHR.TYPE_JSON:var jsonList;if(window.JSON&&(navigator.userAgent.toLowerCase().indexOf('khtml')==-1)){var jsonObjParsed=JSON.parse(oResponse);if(!jsonObjParsed){bError=true;break;}
else{try{jsonList=eval("jsonObjParsed."+aSchema[0]);}
catch(e){bError=true;break;}}}
else{try{while(oResponse.substring(0,1)==" "){oResponse=oResponse.substring(1,oResponse.length);}
if(oResponse.indexOf("{")<0){bError=true;break;}
if(oResponse.indexOf("{}")===0){break;}
var jsonObjRaw=eval("("+oResponse+")");if(!jsonObjRaw){bError=true;break;}
jsonList=eval("(jsonObjRaw."+aSchema[0]+")");}
catch(e){bError=true;break;}}
if(!jsonList){bError=true;break;}
if(jsonList.constructor!=Array){jsonList=[jsonList];}
for(var i=jsonList.length-1;i>=0;i--){var aResultItem=[];var jsonResult=jsonList[i];for(var j=aSchema.length-1;j>=1;j--){var dataFieldValue=jsonResult[aSchema[j]];if(!dataFieldValue){dataFieldValue="";}
aResultItem.unshift(dataFieldValue);}
if(aResultItem.length==1){aResultItem.push(jsonResult);}
aResults.unshift(aResultItem);}
break;case YAHOO.widget.DS_XHR.TYPE_XML:var xmlList=oResponse.getElementsByTagName(aSchema[0]);if(!xmlList){bError=true;break;}
for(var k=xmlList.length-1;k>=0;k--){var result=xmlList.item(k);var aFieldSet=[];for(var m=aSchema.length-1;m>=1;m--){var sValue=null;var xmlAttr=result.attributes.getNamedItem(aSchema[m]);if(xmlAttr){sValue=xmlAttr.value;}
else{var xmlNode=result.getElementsByTagName(aSchema[m]);if(xmlNode&&xmlNode.item(0)&&xmlNode.item(0).firstChild){sValue=xmlNode.item(0).firstChild.nodeValue;}
else{sValue="";}}
aFieldSet.unshift(sValue);}
aResults.unshift(aFieldSet);}
break;case YAHOO.widget.DS_XHR.TYPE_FLAT:if(oResponse.length>0){var newLength=oResponse.length-aSchema[0].length;if(oResponse.substr(newLength)==aSchema[0]){oResponse=oResponse.substr(0,newLength);}
var aRecords=oResponse.split(aSchema[0]);for(var n=aRecords.length-1;n>=0;n--){aResults[n]=aRecords[n].split(aSchema[1]);}}
break;default:break;}
sQuery=null;oResponse=null;oParent=null;if(bError){return null;}
else{return aResults;}};YAHOO.widget.DS_XHR.prototype._oConn=null;YAHOO.widget.DS_JSFunction=function(oFunction,oConfigs){if(typeof oConfigs=="object"){for(var sConfig in oConfigs){this[sConfig]=oConfigs[sConfig];}}
if(!oFunction||(oFunction.constructor!=Function)){return;}
else{this.dataFunction=oFunction;this._init();}};YAHOO.widget.DS_JSFunction.prototype=new YAHOO.widget.DataSource();YAHOO.widget.DS_JSFunction.prototype.dataFunction=null;YAHOO.widget.DS_JSFunction.prototype.doQuery=function(oCallbackFn,sQuery,oParent){var oFunction=this.dataFunction;var aResults=[];aResults=oFunction(sQuery);if(aResults===null){this.dataErrorEvent.fire(this,oParent,sQuery,YAHOO.widget.DataSource.ERROR_DATANULL);return;}
var resultObj={};resultObj.query=decodeURIComponent(sQuery);resultObj.results=aResults;this._addCacheElem(resultObj);this.getResultsEvent.fire(this,oParent,sQuery,aResults);oCallbackFn(sQuery,aResults,oParent);return;};YAHOO.widget.DS_JSArray=function(aData,oConfigs){if(typeof oConfigs=="object"){for(var sConfig in oConfigs){this[sConfig]=oConfigs[sConfig];}}
if(!aData||(aData.constructor!=Array)){return;}
else{this.data=aData;this._init();}};YAHOO.widget.DS_JSArray.prototype=new YAHOO.widget.DataSource();YAHOO.widget.DS_JSArray.prototype.data=null;YAHOO.widget.DS_JSArray.prototype.doQuery=function(oCallbackFn,sQuery,oParent){var aData=this.data;var aResults=[];var bMatchFound=false;var bMatchContains=this.queryMatchContains;if(sQuery){if(!this.queryMatchCase){sQuery=sQuery.toLowerCase();}
for(var i=aData.length-1;i>=0;i--){var aDataset=[];if(aData[i]){if(aData[i].constructor==String){aDataset[0]=aData[i];}
else if(aData[i].constructor==Array){aDataset=aData[i];}}
if(aDataset[0]&&(aDataset[0].constructor==String)){var sKeyIndex=(this.queryMatchCase)?encodeURIComponent(aDataset[0]).indexOf(sQuery):encodeURIComponent(aDataset[0]).toLowerCase().indexOf(sQuery);if((!bMatchContains&&(sKeyIndex===0))||(bMatchContains&&(sKeyIndex>-1))){aResults.unshift(aDataset);}}}}
this.getResultsEvent.fire(this,oParent,sQuery,aResults);oCallbackFn(sQuery,aResults,oParent);};
YAHOO.util.Config=function(owner){if(owner){this.init(owner);}};YAHOO.util.Config.prototype={owner:null,queueInProgress:false,checkBoolean:function(val){if(typeof val=='boolean'){return true;}else{return false;}},checkNumber:function(val){if(isNaN(val)){return false;}else{return true;}}};YAHOO.util.Config.prototype.init=function(owner){this.owner=owner;this.configChangedEvent=new YAHOO.util.CustomEvent("configChanged");this.queueInProgress=false;var config={};var initialConfig={};var eventQueue=[];var fireEvent=function(key,value){key=key.toLowerCase();var property=config[key];if(typeof property!='undefined'&&property.event){property.event.fire(value);}};this.addProperty=function(key,propertyObject){key=key.toLowerCase();config[key]=propertyObject;propertyObject.event=new YAHOO.util.CustomEvent(key);propertyObject.key=key;if(propertyObject.handler){propertyObject.event.subscribe(propertyObject.handler,this.owner,true);}
this.setProperty(key,propertyObject.value,true);if(!propertyObject.suppressEvent){this.queueProperty(key,propertyObject.value);}};this.getConfig=function(){var cfg={};for(var prop in config){var property=config[prop];if(typeof property!='undefined'&&property.event){cfg[prop]=property.value;}}
return cfg;};this.getProperty=function(key){key=key.toLowerCase();var property=config[key];if(typeof property!='undefined'&&property.event){return property.value;}else{return undefined;}};this.resetProperty=function(key){key=key.toLowerCase();var property=config[key];if(typeof property!='undefined'&&property.event){if(initialConfig[key]&&initialConfig[key]!='undefined'){this.setProperty(key,initialConfig[key]);}
return true;}else{return false;}};this.setProperty=function(key,value,silent){key=key.toLowerCase();if(this.queueInProgress&&!silent){this.queueProperty(key,value);return true;}else{var property=config[key];if(typeof property!='undefined'&&property.event){if(property.validator&&!property.validator(value)){return false;}else{property.value=value;if(!silent){fireEvent(key,value);this.configChangedEvent.fire([key,value]);}
return true;}}else{return false;}}};this.queueProperty=function(key,value){key=key.toLowerCase();var property=config[key];if(typeof property!='undefined'&&property.event){if(typeof value!='undefined'&&property.validator&&!property.validator(value)){return false;}else{if(typeof value!='undefined'){property.value=value;}else{value=property.value;}
var foundDuplicate=false;for(var i=0;i<eventQueue.length;i++){var queueItem=eventQueue[i];if(queueItem){var queueItemKey=queueItem[0];var queueItemValue=queueItem[1];if(queueItemKey.toLowerCase()==key){eventQueue[i]=null;eventQueue.push([key,(typeof value!='undefined'?value:queueItemValue)]);foundDuplicate=true;break;}}}
if(!foundDuplicate&&typeof value!='undefined'){eventQueue.push([key,value]);}}
if(property.supercedes){for(var s=0;s<property.supercedes.length;s++){var supercedesCheck=property.supercedes[s];for(var q=0;q<eventQueue.length;q++){var queueItemCheck=eventQueue[q];if(queueItemCheck){var queueItemCheckKey=queueItemCheck[0];var queueItemCheckValue=queueItemCheck[1];if(queueItemCheckKey.toLowerCase()==supercedesCheck.toLowerCase()){eventQueue.push([queueItemCheckKey,queueItemCheckValue]);eventQueue[q]=null;break;}}}}}
return true;}else{return false;}};this.refireEvent=function(key){key=key.toLowerCase();var property=config[key];if(typeof property!='undefined'&&property.event&&typeof property.value!='undefined'){if(this.queueInProgress){this.queueProperty(key);}else{fireEvent(key,property.value);}}};this.applyConfig=function(userConfig,init){if(init){initialConfig=userConfig;}
for(var prop in userConfig){this.queueProperty(prop,userConfig[prop]);}};this.refresh=function(){for(var prop in config){this.refireEvent(prop);}};this.fireQueue=function(){this.queueInProgress=true;for(var i=0;i<eventQueue.length;i++){var queueItem=eventQueue[i];if(queueItem){var key=queueItem[0];var value=queueItem[1];var property=config[key];property.value=value;fireEvent(key,value);}}
this.queueInProgress=false;eventQueue=[];};this.subscribeToConfigEvent=function(key,handler,obj,override){key=key.toLowerCase();var property=config[key];if(typeof property!='undefined'&&property.event){if(!YAHOO.util.Config.alreadySubscribed(property.event,handler,obj)){property.event.subscribe(handler,obj,override);}
return true;}else{return false;}};this.unsubscribeFromConfigEvent=function(key,handler,obj){key=key.toLowerCase();var property=config[key];if(typeof property!='undefined'&&property.event){return property.event.unsubscribe(handler,obj);}else{return false;}};this.toString=function(){var output="Config";if(this.owner){output+=" ["+this.owner.toString()+"]";}
return output;};this.outputEventQueue=function(){var output="";for(var q=0;q<eventQueue.length;q++){var queueItem=eventQueue[q];if(queueItem){output+=queueItem[0]+"="+queueItem[1]+", ";}}
return output;};};YAHOO.util.Config.alreadySubscribed=function(evt,fn,obj){for(var e=0;e<evt.subscribers.length;e++){var subsc=evt.subscribers[e];if(subsc&&subsc.obj==obj&&subsc.fn==fn){return true;}}
return false;};YAHOO.widget.Module=function(el,userConfig){if(el){this.init(el,userConfig);}};YAHOO.widget.Module.IMG_ROOT="http://us.i1.yimg.com/us.yimg.com/i/";YAHOO.widget.Module.IMG_ROOT_SSL="https://a248.e.akamai.net/sec.yimg.com/i/";YAHOO.widget.Module.CSS_MODULE="module";YAHOO.widget.Module.CSS_HEADER="hd";YAHOO.widget.Module.CSS_BODY="bd";YAHOO.widget.Module.CSS_FOOTER="ft";YAHOO.widget.Module.RESIZE_MONITOR_SECURE_URL="javascript:false;";YAHOO.widget.Module.textResizeEvent=new YAHOO.util.CustomEvent("textResize");YAHOO.widget.Module.prototype={constructor:YAHOO.widget.Module,element:null,header:null,body:null,footer:null,id:null,imageRoot:YAHOO.widget.Module.IMG_ROOT,initEvents:function(){this.beforeInitEvent=new YAHOO.util.CustomEvent("beforeInit");this.initEvent=new YAHOO.util.CustomEvent("init");this.appendEvent=new YAHOO.util.CustomEvent("append");this.beforeRenderEvent=new YAHOO.util.CustomEvent("beforeRender");this.renderEvent=new YAHOO.util.CustomEvent("render");this.changeHeaderEvent=new YAHOO.util.CustomEvent("changeHeader");this.changeBodyEvent=new YAHOO.util.CustomEvent("changeBody");this.changeFooterEvent=new YAHOO.util.CustomEvent("changeFooter");this.changeContentEvent=new YAHOO.util.CustomEvent("changeContent");this.destroyEvent=new YAHOO.util.CustomEvent("destroy");this.beforeShowEvent=new YAHOO.util.CustomEvent("beforeShow");this.showEvent=new YAHOO.util.CustomEvent("show");this.beforeHideEvent=new YAHOO.util.CustomEvent("beforeHide");this.hideEvent=new YAHOO.util.CustomEvent("hide");},platform:function(){var ua=navigator.userAgent.toLowerCase();if(ua.indexOf("windows")!=-1||ua.indexOf("win32")!=-1){return"windows";}else if(ua.indexOf("macintosh")!=-1){return"mac";}else{return false;}}(),browser:function(){var ua=navigator.userAgent.toLowerCase();if(ua.indexOf('opera')!=-1){return'opera';}else if(ua.indexOf('msie 7')!=-1){return'ie7';}else if(ua.indexOf('msie')!=-1){return'ie';}else if(ua.indexOf('safari')!=-1){return'safari';}else if(ua.indexOf('gecko')!=-1){return'gecko';}else{return false;}}(),isSecure:function(){if(window.location.href.toLowerCase().indexOf("https")===0){return true;}else{return false;}}(),initDefaultConfig:function(){this.cfg.addProperty("visible",{value:true,handler:this.configVisible,validator:this.cfg.checkBoolean});this.cfg.addProperty("effect",{suppressEvent:true,supercedes:["visible"]});this.cfg.addProperty("monitorresize",{value:true,handler:this.configMonitorResize});},init:function(el,userConfig){this.initEvents();this.beforeInitEvent.fire(YAHOO.widget.Module);this.cfg=new YAHOO.util.Config(this);if(this.isSecure){this.imageRoot=YAHOO.widget.Module.IMG_ROOT_SSL;}
if(typeof el=="string"){var elId=el;el=document.getElementById(el);if(!el){el=document.createElement("DIV");el.id=elId;}}
this.element=el;if(el.id){this.id=el.id;}
var childNodes=this.element.childNodes;if(childNodes){for(var i=0;i<childNodes.length;i++){var child=childNodes[i];switch(child.className){case YAHOO.widget.Module.CSS_HEADER:this.header=child;break;case YAHOO.widget.Module.CSS_BODY:this.body=child;break;case YAHOO.widget.Module.CSS_FOOTER:this.footer=child;break;}}}
this.initDefaultConfig();YAHOO.util.Dom.addClass(this.element,YAHOO.widget.Module.CSS_MODULE);if(userConfig){this.cfg.applyConfig(userConfig,true);}
if(!YAHOO.util.Config.alreadySubscribed(this.renderEvent,this.cfg.fireQueue,this.cfg)){this.renderEvent.subscribe(this.cfg.fireQueue,this.cfg,true);}
this.initEvent.fire(YAHOO.widget.Module);},initResizeMonitor:function(){if(this.browser!="opera"){var resizeMonitor=document.getElementById("_yuiResizeMonitor");if(!resizeMonitor){resizeMonitor=document.createElement("iframe");var bIE=(this.browser.indexOf("ie")===0);if(this.isSecure&&YAHOO.widget.Module.RESIZE_MONITOR_SECURE_URL&&bIE){resizeMonitor.src=YAHOO.widget.Module.RESIZE_MONITOR_SECURE_URL;}
resizeMonitor.id="_yuiResizeMonitor";resizeMonitor.style.visibility="hidden";document.body.appendChild(resizeMonitor);resizeMonitor.style.width="10em";resizeMonitor.style.height="10em";resizeMonitor.style.position="absolute";var nLeft=-1*resizeMonitor.offsetWidth,nTop=-1*resizeMonitor.offsetHeight;resizeMonitor.style.top=nTop+"px";resizeMonitor.style.left=nLeft+"px";resizeMonitor.style.borderStyle="none";resizeMonitor.style.borderWidth="0";YAHOO.util.Dom.setStyle(resizeMonitor,"opacity","0");resizeMonitor.style.visibility="visible";if(!bIE){var doc=resizeMonitor.contentWindow.document;doc.open();doc.close();}}
var fireTextResize=function(){YAHOO.widget.Module.textResizeEvent.fire();};if(resizeMonitor&&resizeMonitor.contentWindow){this.resizeMonitor=resizeMonitor;YAHOO.widget.Module.textResizeEvent.subscribe(this.onDomResize,this,true);if(!YAHOO.widget.Module.textResizeInitialized){if(!YAHOO.util.Event.addListener(this.resizeMonitor.contentWindow,"resize",fireTextResize)){YAHOO.util.Event.addListener(this.resizeMonitor,"resize",fireTextResize);}
YAHOO.widget.Module.textResizeInitialized=true;}}}},onDomResize:function(e,obj){var nLeft=-1*this.resizeMonitor.offsetWidth,nTop=-1*this.resizeMonitor.offsetHeight;this.resizeMonitor.style.top=nTop+"px";this.resizeMonitor.style.left=nLeft+"px";},setHeader:function(headerContent){if(!this.header){this.header=document.createElement("DIV");this.header.className=YAHOO.widget.Module.CSS_HEADER;}
if(typeof headerContent=="string"){this.header.innerHTML=headerContent;}else{this.header.innerHTML="";this.header.appendChild(headerContent);}
this.changeHeaderEvent.fire(headerContent);this.changeContentEvent.fire();},appendToHeader:function(element){if(!this.header){this.header=document.createElement("DIV");this.header.className=YAHOO.widget.Module.CSS_HEADER;}
this.header.appendChild(element);this.changeHeaderEvent.fire(element);this.changeContentEvent.fire();},setBody:function(bodyContent){if(!this.body){this.body=document.createElement("DIV");this.body.className=YAHOO.widget.Module.CSS_BODY;}
if(typeof bodyContent=="string")
{this.body.innerHTML=bodyContent;}else{this.body.innerHTML="";this.body.appendChild(bodyContent);}
this.changeBodyEvent.fire(bodyContent);this.changeContentEvent.fire();},appendToBody:function(element){if(!this.body){this.body=document.createElement("DIV");this.body.className=YAHOO.widget.Module.CSS_BODY;}
this.body.appendChild(element);this.changeBodyEvent.fire(element);this.changeContentEvent.fire();},setFooter:function(footerContent){if(!this.footer){this.footer=document.createElement("DIV");this.footer.className=YAHOO.widget.Module.CSS_FOOTER;}
if(typeof footerContent=="string"){this.footer.innerHTML=footerContent;}else{this.footer.innerHTML="";this.footer.appendChild(footerContent);}
this.changeFooterEvent.fire(footerContent);this.changeContentEvent.fire();},appendToFooter:function(element){if(!this.footer){this.footer=document.createElement("DIV");this.footer.className=YAHOO.widget.Module.CSS_FOOTER;}
this.footer.appendChild(element);this.changeFooterEvent.fire(element);this.changeContentEvent.fire();},render:function(appendToNode,moduleElement){this.beforeRenderEvent.fire();if(!moduleElement){moduleElement=this.element;}
var me=this;var appendTo=function(element){if(typeof element=="string"){element=document.getElementById(element);}
if(element){element.appendChild(me.element);me.appendEvent.fire();}};if(appendToNode){appendTo(appendToNode);}else{if(!YAHOO.util.Dom.inDocument(this.element)){return false;}}
if(this.header&&!YAHOO.util.Dom.inDocument(this.header)){var firstChild=moduleElement.firstChild;if(firstChild){moduleElement.insertBefore(this.header,firstChild);}else{moduleElement.appendChild(this.header);}}
if(this.body&&!YAHOO.util.Dom.inDocument(this.body)){if(this.footer&&YAHOO.util.Dom.isAncestor(this.moduleElement,this.footer)){moduleElement.insertBefore(this.body,this.footer);}else{moduleElement.appendChild(this.body);}}
if(this.footer&&!YAHOO.util.Dom.inDocument(this.footer)){moduleElement.appendChild(this.footer);}
this.renderEvent.fire();return true;},destroy:function(){var parent;if(this.element){YAHOO.util.Event.purgeElement(this.element,true);parent=this.element.parentNode;}
if(parent){parent.removeChild(this.element);}
this.element=null;this.header=null;this.body=null;this.footer=null;for(var e in this){if(e instanceof YAHOO.util.CustomEvent){e.unsubscribeAll();}}
YAHOO.widget.Module.textResizeEvent.unsubscribe(this.onDomResize,this);this.destroyEvent.fire();},show:function(){this.cfg.setProperty("visible",true);},hide:function(){this.cfg.setProperty("visible",false);},configVisible:function(type,args,obj){var visible=args[0];if(visible){this.beforeShowEvent.fire();YAHOO.util.Dom.setStyle(this.element,"display","block");this.showEvent.fire();}else{this.beforeHideEvent.fire();YAHOO.util.Dom.setStyle(this.element,"display","none");this.hideEvent.fire();}},configMonitorResize:function(type,args,obj){var monitor=args[0];if(monitor){this.initResizeMonitor();}else{YAHOO.widget.Module.textResizeEvent.unsubscribe(this.onDomResize,this,true);this.resizeMonitor=null;}}};YAHOO.widget.Module.prototype.toString=function(){return"Module "+this.id;};YAHOO.widget.Overlay=function(el,userConfig){YAHOO.widget.Overlay.superclass.constructor.call(this,el,userConfig);};YAHOO.extend(YAHOO.widget.Overlay,YAHOO.widget.Module);YAHOO.widget.Overlay.IFRAME_SRC="javascript:false;";YAHOO.widget.Overlay.TOP_LEFT="tl";YAHOO.widget.Overlay.TOP_RIGHT="tr";YAHOO.widget.Overlay.BOTTOM_LEFT="bl";YAHOO.widget.Overlay.BOTTOM_RIGHT="br";YAHOO.widget.Overlay.CSS_OVERLAY="overlay";YAHOO.widget.Overlay.prototype.init=function(el,userConfig){YAHOO.widget.Overlay.superclass.init.call(this,el);this.beforeInitEvent.fire(YAHOO.widget.Overlay);YAHOO.util.Dom.addClass(this.element,YAHOO.widget.Overlay.CSS_OVERLAY);if(userConfig){this.cfg.applyConfig(userConfig,true);}
if(this.platform=="mac"&&this.browser=="gecko"){if(!YAHOO.util.Config.alreadySubscribed(this.showEvent,this.showMacGeckoScrollbars,this)){this.showEvent.subscribe(this.showMacGeckoScrollbars,this,true);}
if(!YAHOO.util.Config.alreadySubscribed(this.hideEvent,this.hideMacGeckoScrollbars,this)){this.hideEvent.subscribe(this.hideMacGeckoScrollbars,this,true);}}
this.initEvent.fire(YAHOO.widget.Overlay);};YAHOO.widget.Overlay.prototype.initEvents=function(){YAHOO.widget.Overlay.superclass.initEvents.call(this);this.beforeMoveEvent=new YAHOO.util.CustomEvent("beforeMove",this);this.moveEvent=new YAHOO.util.CustomEvent("move",this);};YAHOO.widget.Overlay.prototype.initDefaultConfig=function(){YAHOO.widget.Overlay.superclass.initDefaultConfig.call(this);this.cfg.addProperty("x",{handler:this.configX,validator:this.cfg.checkNumber,suppressEvent:true,supercedes:["iframe"]});this.cfg.addProperty("y",{handler:this.configY,validator:this.cfg.checkNumber,suppressEvent:true,supercedes:["iframe"]});this.cfg.addProperty("xy",{handler:this.configXY,suppressEvent:true,supercedes:["iframe"]});this.cfg.addProperty("context",{handler:this.configContext,suppressEvent:true,supercedes:["iframe"]});this.cfg.addProperty("fixedcenter",{value:false,handler:this.configFixedCenter,validator:this.cfg.checkBoolean,supercedes:["iframe","visible"]});this.cfg.addProperty("width",{handler:this.configWidth,suppressEvent:true,supercedes:["iframe"]});this.cfg.addProperty("height",{handler:this.configHeight,suppressEvent:true,supercedes:["iframe"]});this.cfg.addProperty("zIndex",{value:null,handler:this.configzIndex});this.cfg.addProperty("constraintoviewport",{value:false,handler:this.configConstrainToViewport,validator:this.cfg.checkBoolean,supercedes:["iframe","x","y","xy"]});this.cfg.addProperty("iframe",{value:(this.browser=="ie"?true:false),handler:this.configIframe,validator:this.cfg.checkBoolean,supercedes:["zIndex"]});};YAHOO.widget.Overlay.prototype.moveTo=function(x,y){this.cfg.setProperty("xy",[x,y]);};YAHOO.widget.Overlay.prototype.hideMacGeckoScrollbars=function(){YAHOO.util.Dom.removeClass(this.element,"show-scrollbars");YAHOO.util.Dom.addClass(this.element,"hide-scrollbars");};YAHOO.widget.Overlay.prototype.showMacGeckoScrollbars=function(){YAHOO.util.Dom.removeClass(this.element,"hide-scrollbars");YAHOO.util.Dom.addClass(this.element,"show-scrollbars");};YAHOO.widget.Overlay.prototype.configVisible=function(type,args,obj){var visible=args[0];var currentVis=YAHOO.util.Dom.getStyle(this.element,"visibility");if(currentVis=="inherit"){var e=this.element.parentNode;while(e.nodeType!=9&&e.nodeType!=11){currentVis=YAHOO.util.Dom.getStyle(e,"visibility");if(currentVis!="inherit"){break;}
e=e.parentNode;}
if(currentVis=="inherit"){currentVis="visible";}}
var effect=this.cfg.getProperty("effect");var effectInstances=[];if(effect){if(effect instanceof Array){for(var i=0;i<effect.length;i++){var eff=effect[i];effectInstances[effectInstances.length]=eff.effect(this,eff.duration);}}else{effectInstances[effectInstances.length]=effect.effect(this,effect.duration);}}
var isMacGecko=(this.platform=="mac"&&this.browser=="gecko");if(visible){if(isMacGecko){this.showMacGeckoScrollbars();}
if(effect){if(visible){if(currentVis!="visible"||currentVis===""){this.beforeShowEvent.fire();for(var j=0;j<effectInstances.length;j++){var ei=effectInstances[j];if(j===0&&!YAHOO.util.Config.alreadySubscribed(ei.animateInCompleteEvent,this.showEvent.fire,this.showEvent)){ei.animateInCompleteEvent.subscribe(this.showEvent.fire,this.showEvent,true);}
ei.animateIn();}}}}else{if(currentVis!="visible"||currentVis===""){this.beforeShowEvent.fire();YAHOO.util.Dom.setStyle(this.element,"visibility","visible");this.cfg.refireEvent("iframe");this.showEvent.fire();}}}else{if(isMacGecko){this.hideMacGeckoScrollbars();}
if(effect){if(currentVis=="visible"){this.beforeHideEvent.fire();for(var k=0;k<effectInstances.length;k++){var h=effectInstances[k];if(k===0&&!YAHOO.util.Config.alreadySubscribed(h.animateOutCompleteEvent,this.hideEvent.fire,this.hideEvent)){h.animateOutCompleteEvent.subscribe(this.hideEvent.fire,this.hideEvent,true);}
h.animateOut();}}else if(currentVis===""){YAHOO.util.Dom.setStyle(this.element,"visibility","hidden");}}else{if(currentVis=="visible"||currentVis===""){this.beforeHideEvent.fire();YAHOO.util.Dom.setStyle(this.element,"visibility","hidden");this.cfg.refireEvent("iframe");this.hideEvent.fire();}}}};YAHOO.widget.Overlay.prototype.doCenterOnDOMEvent=function(){if(this.cfg.getProperty("visible")){this.center();}};YAHOO.widget.Overlay.prototype.configFixedCenter=function(type,args,obj){var val=args[0];if(val){this.center();if(!YAHOO.util.Config.alreadySubscribed(this.beforeShowEvent,this.center,this)){this.beforeShowEvent.subscribe(this.center,this,true);}
if(!YAHOO.util.Config.alreadySubscribed(YAHOO.widget.Overlay.windowResizeEvent,this.doCenterOnDOMEvent,this)){YAHOO.widget.Overlay.windowResizeEvent.subscribe(this.doCenterOnDOMEvent,this,true);}
if(!YAHOO.util.Config.alreadySubscribed(YAHOO.widget.Overlay.windowScrollEvent,this.doCenterOnDOMEvent,this)){YAHOO.widget.Overlay.windowScrollEvent.subscribe(this.doCenterOnDOMEvent,this,true);}}else{YAHOO.widget.Overlay.windowResizeEvent.unsubscribe(this.doCenterOnDOMEvent,this);YAHOO.widget.Overlay.windowScrollEvent.unsubscribe(this.doCenterOnDOMEvent,this);}};YAHOO.widget.Overlay.prototype.configHeight=function(type,args,obj){var height=args[0];var el=this.element;YAHOO.util.Dom.setStyle(el,"height",height);this.cfg.refireEvent("iframe");};YAHOO.widget.Overlay.prototype.configWidth=function(type,args,obj){var width=args[0];var el=this.element;YAHOO.util.Dom.setStyle(el,"width",width);this.cfg.refireEvent("iframe");};YAHOO.widget.Overlay.prototype.configzIndex=function(type,args,obj){var zIndex=args[0];var el=this.element;if(!zIndex){zIndex=YAHOO.util.Dom.getStyle(el,"zIndex");if(!zIndex||isNaN(zIndex)){zIndex=0;}}
if(this.iframe){if(zIndex<=0){zIndex=1;}
YAHOO.util.Dom.setStyle(this.iframe,"zIndex",(zIndex-1));}
YAHOO.util.Dom.setStyle(el,"zIndex",zIndex);this.cfg.setProperty("zIndex",zIndex,true);};YAHOO.widget.Overlay.prototype.configXY=function(type,args,obj){var pos=args[0];var x=pos[0];var y=pos[1];this.cfg.setProperty("x",x);this.cfg.setProperty("y",y);this.beforeMoveEvent.fire([x,y]);x=this.cfg.getProperty("x");y=this.cfg.getProperty("y");this.cfg.refireEvent("iframe");this.moveEvent.fire([x,y]);};YAHOO.widget.Overlay.prototype.configX=function(type,args,obj){var x=args[0];var y=this.cfg.getProperty("y");this.cfg.setProperty("x",x,true);this.cfg.setProperty("y",y,true);this.beforeMoveEvent.fire([x,y]);x=this.cfg.getProperty("x");y=this.cfg.getProperty("y");YAHOO.util.Dom.setX(this.element,x,true);this.cfg.setProperty("xy",[x,y],true);this.cfg.refireEvent("iframe");this.moveEvent.fire([x,y]);};YAHOO.widget.Overlay.prototype.configY=function(type,args,obj){var x=this.cfg.getProperty("x");var y=args[0];this.cfg.setProperty("x",x,true);this.cfg.setProperty("y",y,true);this.beforeMoveEvent.fire([x,y]);x=this.cfg.getProperty("x");y=this.cfg.getProperty("y");YAHOO.util.Dom.setY(this.element,y,true);this.cfg.setProperty("xy",[x,y],true);this.cfg.refireEvent("iframe");this.moveEvent.fire([x,y]);};YAHOO.widget.Overlay.prototype.showIframe=function(){if(this.iframe){this.iframe.style.display="block";}};YAHOO.widget.Overlay.prototype.hideIframe=function(){if(this.iframe){this.iframe.style.display="none";}};YAHOO.widget.Overlay.prototype.configIframe=function(type,args,obj){var val=args[0];if(val){if(!YAHOO.util.Config.alreadySubscribed(this.showEvent,this.showIframe,this)){this.showEvent.subscribe(this.showIframe,this,true);}
if(!YAHOO.util.Config.alreadySubscribed(this.hideEvent,this.hideIframe,this)){this.hideEvent.subscribe(this.hideIframe,this,true);}
var x=this.cfg.getProperty("x");var y=this.cfg.getProperty("y");if(!x||!y){this.syncPosition();x=this.cfg.getProperty("x");y=this.cfg.getProperty("y");}
if(!isNaN(x)&&!isNaN(y)){if(!this.iframe){this.iframe=document.createElement("iframe");if(this.isSecure){this.iframe.src=YAHOO.widget.Overlay.IFRAME_SRC;}
var parent=this.element.parentNode;if(parent){parent.appendChild(this.iframe);}else{document.body.appendChild(this.iframe);}
YAHOO.util.Dom.setStyle(this.iframe,"position","absolute");YAHOO.util.Dom.setStyle(this.iframe,"border","none");YAHOO.util.Dom.setStyle(this.iframe,"margin","0");YAHOO.util.Dom.setStyle(this.iframe,"padding","0");YAHOO.util.Dom.setStyle(this.iframe,"opacity","0");if(this.cfg.getProperty("visible")){this.showIframe();}else{this.hideIframe();}}
var iframeDisplay=YAHOO.util.Dom.getStyle(this.iframe,"display");if(iframeDisplay=="none"){this.iframe.style.display="block";}
YAHOO.util.Dom.setXY(this.iframe,[x,y]);var width=this.element.clientWidth;var height=this.element.clientHeight;YAHOO.util.Dom.setStyle(this.iframe,"width",(width+2)+"px");YAHOO.util.Dom.setStyle(this.iframe,"height",(height+2)+"px");if(iframeDisplay=="none"){this.iframe.style.display="none";}}}else{if(this.iframe){this.iframe.style.display="none";}
this.showEvent.unsubscribe(this.showIframe,this);this.hideEvent.unsubscribe(this.hideIframe,this);}};YAHOO.widget.Overlay.prototype.configConstrainToViewport=function(type,args,obj){var val=args[0];if(val){if(!YAHOO.util.Config.alreadySubscribed(this.beforeMoveEvent,this.enforceConstraints,this)){this.beforeMoveEvent.subscribe(this.enforceConstraints,this,true);}}else{this.beforeMoveEvent.unsubscribe(this.enforceConstraints,this);}};YAHOO.widget.Overlay.prototype.configContext=function(type,args,obj){var contextArgs=args[0];if(contextArgs){var contextEl=contextArgs[0];var elementMagnetCorner=contextArgs[1];var contextMagnetCorner=contextArgs[2];if(contextEl){if(typeof contextEl=="string"){this.cfg.setProperty("context",[document.getElementById(contextEl),elementMagnetCorner,contextMagnetCorner],true);}
if(elementMagnetCorner&&contextMagnetCorner){this.align(elementMagnetCorner,contextMagnetCorner);}}}};YAHOO.widget.Overlay.prototype.align=function(elementAlign,contextAlign){var contextArgs=this.cfg.getProperty("context");if(contextArgs){var context=contextArgs[0];var element=this.element;var me=this;if(!elementAlign){elementAlign=contextArgs[1];}
if(!contextAlign){contextAlign=contextArgs[2];}
if(element&&context){var elementRegion=YAHOO.util.Dom.getRegion(element);var contextRegion=YAHOO.util.Dom.getRegion(context);var doAlign=function(v,h){switch(elementAlign){case YAHOO.widget.Overlay.TOP_LEFT:me.moveTo(h,v);break;case YAHOO.widget.Overlay.TOP_RIGHT:me.moveTo(h-element.offsetWidth,v);break;case YAHOO.widget.Overlay.BOTTOM_LEFT:me.moveTo(h,v-element.offsetHeight);break;case YAHOO.widget.Overlay.BOTTOM_RIGHT:me.moveTo(h-element.offsetWidth,v-element.offsetHeight);break;}};switch(contextAlign){case YAHOO.widget.Overlay.TOP_LEFT:doAlign(contextRegion.top,contextRegion.left);break;case YAHOO.widget.Overlay.TOP_RIGHT:doAlign(contextRegion.top,contextRegion.right);break;case YAHOO.widget.Overlay.BOTTOM_LEFT:doAlign(contextRegion.bottom,contextRegion.left);break;case YAHOO.widget.Overlay.BOTTOM_RIGHT:doAlign(contextRegion.bottom,contextRegion.right);break;}}}};YAHOO.widget.Overlay.prototype.enforceConstraints=function(type,args,obj){var pos=args[0];var x=pos[0];var y=pos[1];var offsetHeight=this.element.offsetHeight;var offsetWidth=this.element.offsetWidth;var viewPortWidth=YAHOO.util.Dom.getViewportWidth();var viewPortHeight=YAHOO.util.Dom.getViewportHeight();var scrollX=document.documentElement.scrollLeft||document.body.scrollLeft;var scrollY=document.documentElement.scrollTop||document.body.scrollTop;var topConstraint=scrollY+10;var leftConstraint=scrollX+10;var bottomConstraint=scrollY+viewPortHeight-offsetHeight-10;var rightConstraint=scrollX+viewPortWidth-offsetWidth-10;if(x<leftConstraint){x=leftConstraint;}else if(x>rightConstraint){x=rightConstraint;}
if(y<topConstraint){y=topConstraint;}else if(y>bottomConstraint){y=bottomConstraint;}
this.cfg.setProperty("x",x,true);this.cfg.setProperty("y",y,true);this.cfg.setProperty("xy",[x,y],true);};YAHOO.widget.Overlay.prototype.center=function(){var scrollX=document.documentElement.scrollLeft||document.body.scrollLeft;var scrollY=document.documentElement.scrollTop||document.body.scrollTop;var viewPortWidth=YAHOO.util.Dom.getClientWidth();var viewPortHeight=YAHOO.util.Dom.getClientHeight();var elementWidth=this.element.offsetWidth;var elementHeight=this.element.offsetHeight;var x=(viewPortWidth/2)-(elementWidth/2)+scrollX;var y=(viewPortHeight/2)-(elementHeight/2)+scrollY;this.cfg.setProperty("xy",[parseInt(x,10),parseInt(y,10)]);this.cfg.refireEvent("iframe");};YAHOO.widget.Overlay.prototype.syncPosition=function(){var pos=YAHOO.util.Dom.getXY(this.element);this.cfg.setProperty("x",pos[0],true);this.cfg.setProperty("y",pos[1],true);this.cfg.setProperty("xy",pos,true);};YAHOO.widget.Overlay.prototype.onDomResize=function(e,obj){YAHOO.widget.Overlay.superclass.onDomResize.call(this,e,obj);var me=this;setTimeout(function(){me.syncPosition();me.cfg.refireEvent("iframe");me.cfg.refireEvent("context");},0);};YAHOO.widget.Overlay.prototype.destroy=function(){if(this.iframe){this.iframe.parentNode.removeChild(this.iframe);}
this.iframe=null;YAHOO.widget.Overlay.windowResizeEvent.unsubscribe(this.doCenterOnDOMEvent,this);YAHOO.widget.Overlay.windowScrollEvent.unsubscribe(this.doCenterOnDOMEvent,this);YAHOO.widget.Overlay.superclass.destroy.call(this);};YAHOO.widget.Overlay.prototype.toString=function(){return"Overlay "+this.id;};YAHOO.widget.Overlay.windowScrollEvent=new YAHOO.util.CustomEvent("windowScroll");YAHOO.widget.Overlay.windowResizeEvent=new YAHOO.util.CustomEvent("windowResize");YAHOO.widget.Overlay.windowScrollHandler=function(e){if(YAHOO.widget.Module.prototype.browser=="ie"||YAHOO.widget.Module.prototype.browser=="ie7"){if(!window.scrollEnd){window.scrollEnd=-1;}
clearTimeout(window.scrollEnd);window.scrollEnd=setTimeout(function(){YAHOO.widget.Overlay.windowScrollEvent.fire();},1);}else{YAHOO.widget.Overlay.windowScrollEvent.fire();}};YAHOO.widget.Overlay.windowResizeHandler=function(e){if(YAHOO.widget.Module.prototype.browser=="ie"||YAHOO.widget.Module.prototype.browser=="ie7"){if(!window.resizeEnd){window.resizeEnd=-1;}
clearTimeout(window.resizeEnd);window.resizeEnd=setTimeout(function(){YAHOO.widget.Overlay.windowResizeEvent.fire();},100);}else{YAHOO.widget.Overlay.windowResizeEvent.fire();}};YAHOO.widget.Overlay._initialized=null;if(YAHOO.widget.Overlay._initialized===null){YAHOO.util.Event.addListener(window,"scroll",YAHOO.widget.Overlay.windowScrollHandler);YAHOO.util.Event.addListener(window,"resize",YAHOO.widget.Overlay.windowResizeHandler);YAHOO.widget.Overlay._initialized=true;}
YAHOO.widget.OverlayManager=function(userConfig){this.init(userConfig);};YAHOO.widget.OverlayManager.CSS_FOCUSED="focused";YAHOO.widget.OverlayManager.prototype={constructor:YAHOO.widget.OverlayManager,overlays:null,initDefaultConfig:function(){this.cfg.addProperty("overlays",{suppressEvent:true});this.cfg.addProperty("focusevent",{value:"mousedown"});},init:function(userConfig){this.cfg=new YAHOO.util.Config(this);this.initDefaultConfig();if(userConfig){this.cfg.applyConfig(userConfig,true);}
this.cfg.fireQueue();var activeOverlay=null;this.getActive=function(){return activeOverlay;};this.focus=function(overlay){var o=this.find(overlay);if(o){this.blurAll();activeOverlay=o;YAHOO.util.Dom.addClass(activeOverlay.element,YAHOO.widget.OverlayManager.CSS_FOCUSED);this.overlays.sort(this.compareZIndexDesc);var topZIndex=YAHOO.util.Dom.getStyle(this.overlays[0].element,"zIndex");if(!isNaN(topZIndex)&&this.overlays[0]!=overlay){activeOverlay.cfg.setProperty("zIndex",(parseInt(topZIndex,10)+2));}
this.overlays.sort(this.compareZIndexDesc);}};this.remove=function(overlay){var o=this.find(overlay);if(o){var originalZ=YAHOO.util.Dom.getStyle(o.element,"zIndex");o.cfg.setProperty("zIndex",-1000,true);this.overlays.sort(this.compareZIndexDesc);this.overlays=this.overlays.slice(0,this.overlays.length-1);o.cfg.setProperty("zIndex",originalZ,true);o.cfg.setProperty("manager",null);o.focusEvent=null;o.blurEvent=null;o.focus=null;o.blur=null;}};this.blurAll=function(){activeOverlay=null;for(var o=0;o<this.overlays.length;o++){YAHOO.util.Dom.removeClass(this.overlays[o].element,YAHOO.widget.OverlayManager.CSS_FOCUSED);}};var overlays=this.cfg.getProperty("overlays");if(!this.overlays){this.overlays=[];}
if(overlays){this.register(overlays);this.overlays.sort(this.compareZIndexDesc);}},register:function(overlay){if(overlay instanceof YAHOO.widget.Overlay){overlay.cfg.addProperty("manager",{value:this});overlay.focusEvent=new YAHOO.util.CustomEvent("focus");overlay.blurEvent=new YAHOO.util.CustomEvent("blur");var mgr=this;overlay.focus=function(){mgr.focus(this);this.focusEvent.fire();};overlay.blur=function(){mgr.blurAll();this.blurEvent.fire();};var focusOnDomEvent=function(e,obj){overlay.focus();};var focusevent=this.cfg.getProperty("focusevent");YAHOO.util.Event.addListener(overlay.element,focusevent,focusOnDomEvent,this,true);var zIndex=YAHOO.util.Dom.getStyle(overlay.element,"zIndex");if(!isNaN(zIndex)){overlay.cfg.setProperty("zIndex",parseInt(zIndex,10));}else{overlay.cfg.setProperty("zIndex",0);}
this.overlays.push(overlay);return true;}else if(overlay instanceof Array){var regcount=0;for(var i=0;i<overlay.length;i++){if(this.register(overlay[i])){regcount++;}}
if(regcount>0){return true;}}else{return false;}},find:function(overlay){if(overlay instanceof YAHOO.widget.Overlay){for(var o=0;o<this.overlays.length;o++){if(this.overlays[o]==overlay){return this.overlays[o];}}}else if(typeof overlay=="string"){for(var p=0;p<this.overlays.length;p++){if(this.overlays[p].id==overlay){return this.overlays[p];}}}
return null;},compareZIndexDesc:function(o1,o2){var zIndex1=o1.cfg.getProperty("zIndex");var zIndex2=o2.cfg.getProperty("zIndex");if(zIndex1>zIndex2){return-1;}else if(zIndex1<zIndex2){return 1;}else{return 0;}},showAll:function(){for(var o=0;o<this.overlays.length;o++){this.overlays[o].show();}},hideAll:function(){for(var o=0;o<this.overlays.length;o++){this.overlays[o].hide();}},toString:function(){return"OverlayManager";}};YAHOO.util.KeyListener=function(attachTo,keyData,handler,event){if(!event){event=YAHOO.util.KeyListener.KEYDOWN;}
var keyEvent=new YAHOO.util.CustomEvent("keyPressed");this.enabledEvent=new YAHOO.util.CustomEvent("enabled");this.disabledEvent=new YAHOO.util.CustomEvent("disabled");if(typeof attachTo=='string'){attachTo=document.getElementById(attachTo);}
if(typeof handler=='function'){keyEvent.subscribe(handler);}else{keyEvent.subscribe(handler.fn,handler.scope,handler.correctScope);}
function handleKeyPress(e,obj){if(!keyData.shift){keyData.shift=false;}
if(!keyData.alt){keyData.alt=false;}
if(!keyData.ctrl){keyData.ctrl=false;}
if(e.shiftKey==keyData.shift&&e.altKey==keyData.alt&&e.ctrlKey==keyData.ctrl){var dataItem;var keyPressed;if(keyData.keys instanceof Array){for(var i=0;i<keyData.keys.length;i++){dataItem=keyData.keys[i];if(dataItem==e.charCode){keyEvent.fire(e.charCode,e);break;}else if(dataItem==e.keyCode){keyEvent.fire(e.keyCode,e);break;}}}else{dataItem=keyData.keys;if(dataItem==e.charCode){keyEvent.fire(e.charCode,e);}else if(dataItem==e.keyCode){keyEvent.fire(e.keyCode,e);}}}}
this.enable=function(){if(!this.enabled){YAHOO.util.Event.addListener(attachTo,event,handleKeyPress);this.enabledEvent.fire(keyData);}
this.enabled=true;};this.disable=function(){if(this.enabled){YAHOO.util.Event.removeListener(attachTo,event,handleKeyPress);this.disabledEvent.fire(keyData);}
this.enabled=false;};this.toString=function(){return"KeyListener ["+keyData.keys+"] "+attachTo.tagName+(attachTo.id?"["+attachTo.id+"]":"");};};YAHOO.util.KeyListener.KEYDOWN="keydown";YAHOO.util.KeyListener.KEYUP="keyup";YAHOO.widget.ContainerEffect=function(overlay,attrIn,attrOut,targetElement,animClass){if(!animClass){animClass=YAHOO.util.Anim;}
this.overlay=overlay;this.attrIn=attrIn;this.attrOut=attrOut;this.targetElement=targetElement||overlay.element;this.animClass=animClass;};YAHOO.widget.ContainerEffect.prototype.init=function(){this.beforeAnimateInEvent=new YAHOO.util.CustomEvent("beforeAnimateIn");this.beforeAnimateOutEvent=new YAHOO.util.CustomEvent("beforeAnimateOut");this.animateInCompleteEvent=new YAHOO.util.CustomEvent("animateInComplete");this.animateOutCompleteEvent=new YAHOO.util.CustomEvent("animateOutComplete");this.animIn=new this.animClass(this.targetElement,this.attrIn.attributes,this.attrIn.duration,this.attrIn.method);this.animIn.onStart.subscribe(this.handleStartAnimateIn,this);this.animIn.onTween.subscribe(this.handleTweenAnimateIn,this);this.animIn.onComplete.subscribe(this.handleCompleteAnimateIn,this);this.animOut=new this.animClass(this.targetElement,this.attrOut.attributes,this.attrOut.duration,this.attrOut.method);this.animOut.onStart.subscribe(this.handleStartAnimateOut,this);this.animOut.onTween.subscribe(this.handleTweenAnimateOut,this);this.animOut.onComplete.subscribe(this.handleCompleteAnimateOut,this);};YAHOO.widget.ContainerEffect.prototype.animateIn=function(){this.beforeAnimateInEvent.fire();this.animIn.animate();};YAHOO.widget.ContainerEffect.prototype.animateOut=function(){this.beforeAnimateOutEvent.fire();this.animOut.animate();};YAHOO.widget.ContainerEffect.prototype.handleStartAnimateIn=function(type,args,obj){};YAHOO.widget.ContainerEffect.prototype.handleTweenAnimateIn=function(type,args,obj){};YAHOO.widget.ContainerEffect.prototype.handleCompleteAnimateIn=function(type,args,obj){};YAHOO.widget.ContainerEffect.prototype.handleStartAnimateOut=function(type,args,obj){};YAHOO.widget.ContainerEffect.prototype.handleTweenAnimateOut=function(type,args,obj){};YAHOO.widget.ContainerEffect.prototype.handleCompleteAnimateOut=function(type,args,obj){};YAHOO.widget.ContainerEffect.prototype.toString=function(){var output="ContainerEffect";if(this.overlay){output+=" ["+this.overlay.toString()+"]";}
return output;};YAHOO.widget.ContainerEffect.FADE=function(overlay,dur){var fade=new YAHOO.widget.ContainerEffect(overlay,{attributes:{opacity:{from:0,to:1}},duration:dur,method:YAHOO.util.Easing.easeIn},{attributes:{opacity:{to:0}},duration:dur,method:YAHOO.util.Easing.easeOut},overlay.element);fade.handleStartAnimateIn=function(type,args,obj){YAHOO.util.Dom.addClass(obj.overlay.element,"hide-select");if(!obj.overlay.underlay){obj.overlay.cfg.refireEvent("underlay");}
if(obj.overlay.underlay){obj.initialUnderlayOpacity=YAHOO.util.Dom.getStyle(obj.overlay.underlay,"opacity");obj.overlay.underlay.style.filter=null;}
YAHOO.util.Dom.setStyle(obj.overlay.element,"visibility","visible");YAHOO.util.Dom.setStyle(obj.overlay.element,"opacity",0);};fade.handleCompleteAnimateIn=function(type,args,obj){YAHOO.util.Dom.removeClass(obj.overlay.element,"hide-select");if(obj.overlay.element.style.filter){obj.overlay.element.style.filter=null;}
if(obj.overlay.underlay){YAHOO.util.Dom.setStyle(obj.overlay.underlay,"opacity",obj.initialUnderlayOpacity);}
obj.overlay.cfg.refireEvent("iframe");obj.animateInCompleteEvent.fire();};fade.handleStartAnimateOut=function(type,args,obj){YAHOO.util.Dom.addClass(obj.overlay.element,"hide-select");if(obj.overlay.underlay){obj.overlay.underlay.style.filter=null;}};fade.handleCompleteAnimateOut=function(type,args,obj){YAHOO.util.Dom.removeClass(obj.overlay.element,"hide-select");if(obj.overlay.element.style.filter){obj.overlay.element.style.filter=null;}
YAHOO.util.Dom.setStyle(obj.overlay.element,"visibility","hidden");YAHOO.util.Dom.setStyle(obj.overlay.element,"opacity",1);obj.overlay.cfg.refireEvent("iframe");obj.animateOutCompleteEvent.fire();};fade.init();return fade;};YAHOO.widget.ContainerEffect.SLIDE=function(overlay,dur){var x=overlay.cfg.getProperty("x")||YAHOO.util.Dom.getX(overlay.element);var y=overlay.cfg.getProperty("y")||YAHOO.util.Dom.getY(overlay.element);var clientWidth=YAHOO.util.Dom.getClientWidth();var offsetWidth=overlay.element.offsetWidth;var slide=new YAHOO.widget.ContainerEffect(overlay,{attributes:{points:{to:[x,y]}},duration:dur,method:YAHOO.util.Easing.easeIn},{attributes:{points:{to:[(clientWidth+25),y]}},duration:dur,method:YAHOO.util.Easing.easeOut},overlay.element,YAHOO.util.Motion);slide.handleStartAnimateIn=function(type,args,obj){obj.overlay.element.style.left=(-25-offsetWidth)+"px";obj.overlay.element.style.top=y+"px";};slide.handleTweenAnimateIn=function(type,args,obj){var pos=YAHOO.util.Dom.getXY(obj.overlay.element);var currentX=pos[0];var currentY=pos[1];if(YAHOO.util.Dom.getStyle(obj.overlay.element,"visibility")=="hidden"&&currentX<x){YAHOO.util.Dom.setStyle(obj.overlay.element,"visibility","visible");}
obj.overlay.cfg.setProperty("xy",[currentX,currentY],true);obj.overlay.cfg.refireEvent("iframe");};slide.handleCompleteAnimateIn=function(type,args,obj){obj.overlay.cfg.setProperty("xy",[x,y],true);obj.startX=x;obj.startY=y;obj.overlay.cfg.refireEvent("iframe");obj.animateInCompleteEvent.fire();};slide.handleStartAnimateOut=function(type,args,obj){var vw=YAHOO.util.Dom.getViewportWidth();var pos=YAHOO.util.Dom.getXY(obj.overlay.element);var yso=pos[1];var currentTo=obj.animOut.attributes.points.to;obj.animOut.attributes.points.to=[(vw+25),yso];};slide.handleTweenAnimateOut=function(type,args,obj){var pos=YAHOO.util.Dom.getXY(obj.overlay.element);var xto=pos[0];var yto=pos[1];obj.overlay.cfg.setProperty("xy",[xto,yto],true);obj.overlay.cfg.refireEvent("iframe");};slide.handleCompleteAnimateOut=function(type,args,obj){YAHOO.util.Dom.setStyle(obj.overlay.element,"visibility","hidden");obj.overlay.cfg.setProperty("xy",[x,y]);obj.animateOutCompleteEvent.fire();};slide.init();return slide;};
(function(){var Event=YAHOO.util.Event;var Dom=YAHOO.util.Dom;YAHOO.util.DragDrop=function(id,sGroup,config){if(id){this.init(id,sGroup,config);}};YAHOO.util.DragDrop.prototype={id:null,config:null,dragElId:null,handleElId:null,invalidHandleTypes:null,invalidHandleIds:null,invalidHandleClasses:null,startPageX:0,startPageY:0,groups:null,locked:false,lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isTarget:true,padding:null,_domRef:null,__ygDragDrop:true,constrainX:false,constrainY:false,minX:0,maxX:0,minY:0,maxY:0,maintainOffset:false,xTicks:null,yTicks:null,primaryButtonOnly:true,available:false,hasOuterHandles:false,b4StartDrag:function(x,y){},startDrag:function(x,y){},b4Drag:function(e){},onDrag:function(e){},onDragEnter:function(e,id){},b4DragOver:function(e){},onDragOver:function(e,id){},b4DragOut:function(e){},onDragOut:function(e,id){},b4DragDrop:function(e){},onDragDrop:function(e,id){},onInvalidDrop:function(e){},b4EndDrag:function(e){},endDrag:function(e){},b4MouseDown:function(e){},onMouseDown:function(e){},onMouseUp:function(e){},onAvailable:function(){},getEl:function(){if(!this._domRef){this._domRef=Dom.get(this.id);}
return this._domRef;},getDragEl:function(){return Dom.get(this.dragElId);},init:function(id,sGroup,config){this.initTarget(id,sGroup,config);Event.on(this.id,"mousedown",this.handleMouseDown,this,true);},initTarget:function(id,sGroup,config){this.config=config||{};this.DDM=YAHOO.util.DDM;this.groups={};if(typeof id!=="string"){YAHOO.log("id is not a string, assuming it is an HTMLElement");id=Dom.generateId(id);}
this.id=id;this.addToGroup((sGroup)?sGroup:"default");this.handleElId=id;Event.onAvailable(id,this.handleOnAvailable,this,true);this.setDragElId(id);this.invalidHandleTypes={A:"A"};this.invalidHandleIds={};this.invalidHandleClasses=[];this.applyConfig();},applyConfig:function(){this.padding=this.config.padding||[0,0,0,0];this.isTarget=(this.config.isTarget!==false);this.maintainOffset=(this.config.maintainOffset);this.primaryButtonOnly=(this.config.primaryButtonOnly!==false);},handleOnAvailable:function(){this.available=true;this.resetConstraints();this.onAvailable();},setPadding:function(iTop,iRight,iBot,iLeft){if(!iRight&&0!==iRight){this.padding=[iTop,iTop,iTop,iTop];}else if(!iBot&&0!==iBot){this.padding=[iTop,iRight,iTop,iRight];}else{this.padding=[iTop,iRight,iBot,iLeft];}},setInitPosition:function(diffX,diffY){var el=this.getEl();if(!this.DDM.verifyEl(el)){return;}
var dx=diffX||0;var dy=diffY||0;var p=Dom.getXY(el);this.initPageX=p[0]-dx;this.initPageY=p[1]-dy;this.lastPageX=p[0];this.lastPageY=p[1];this.setStartPosition(p);},setStartPosition:function(pos){var p=pos||Dom.getXY(this.getEl());this.deltaSetXY=null;this.startPageX=p[0];this.startPageY=p[1];},addToGroup:function(sGroup){this.groups[sGroup]=true;this.DDM.regDragDrop(this,sGroup);},removeFromGroup:function(sGroup){if(this.groups[sGroup]){delete this.groups[sGroup];}
this.DDM.removeDDFromGroup(this,sGroup);},setDragElId:function(id){this.dragElId=id;},setHandleElId:function(id){if(typeof id!=="string"){YAHOO.log("id is not a string, assuming it is an HTMLElement");id=Dom.generateId(id);}
this.handleElId=id;this.DDM.regHandle(this.id,id);},setOuterHandleElId:function(id){if(typeof id!=="string"){YAHOO.log("id is not a string, assuming it is an HTMLElement");id=Dom.generateId(id);}
Event.on(id,"mousedown",this.handleMouseDown,this,true);this.setHandleElId(id);this.hasOuterHandles=true;},unreg:function(){Event.removeListener(this.id,"mousedown",this.handleMouseDown);this._domRef=null;this.DDM._remove(this);},isLocked:function(){return(this.DDM.isLocked()||this.locked);},handleMouseDown:function(e,oDD){var button=e.which||e.button;if(this.primaryButtonOnly&&button>1){return;}
if(this.isLocked()){return;}
this.DDM.refreshCache(this.groups);var pt=new YAHOO.util.Point(Event.getPageX(e),Event.getPageY(e));if(!this.hasOuterHandles&&!this.DDM.isOverTarget(pt,this)){}else{if(this.clickValidator(e)){this.setStartPosition();this.b4MouseDown(e);this.onMouseDown(e);this.DDM.handleMouseDown(e,this);this.DDM.stopEvent(e);}else{}}},clickValidator:function(e){var target=Event.getTarget(e);return(this.isValidHandleChild(target)&&(this.id==this.handleElId||this.DDM.handleWasClicked(target,this.id)));},addInvalidHandleType:function(tagName){var type=tagName.toUpperCase();this.invalidHandleTypes[type]=type;},addInvalidHandleId:function(id){if(typeof id!=="string"){YAHOO.log("id is not a string, assuming it is an HTMLElement");id=Dom.generateId(id);}
this.invalidHandleIds[id]=id;},addInvalidHandleClass:function(cssClass){this.invalidHandleClasses.push(cssClass);},removeInvalidHandleType:function(tagName){var type=tagName.toUpperCase();delete this.invalidHandleTypes[type];},removeInvalidHandleId:function(id){if(typeof id!=="string"){YAHOO.log("id is not a string, assuming it is an HTMLElement");id=Dom.generateId(id);}
delete this.invalidHandleIds[id];},removeInvalidHandleClass:function(cssClass){for(var i=0,len=this.invalidHandleClasses.length;i<len;++i){if(this.invalidHandleClasses[i]==cssClass){delete this.invalidHandleClasses[i];}}},isValidHandleChild:function(node){var valid=true;var nodeName;try{nodeName=node.nodeName.toUpperCase();}catch(e){nodeName=node.nodeName;}
valid=valid&&!this.invalidHandleTypes[nodeName];valid=valid&&!this.invalidHandleIds[node.id];for(var i=0,len=this.invalidHandleClasses.length;valid&&i<len;++i){valid=!Dom.hasClass(node,this.invalidHandleClasses[i]);}
return valid;},setXTicks:function(iStartX,iTickSize){this.xTicks=[];this.xTickSize=iTickSize;var tickMap={};for(var i=this.initPageX;i>=this.minX;i=i-iTickSize){if(!tickMap[i]){this.xTicks[this.xTicks.length]=i;tickMap[i]=true;}}
for(i=this.initPageX;i<=this.maxX;i=i+iTickSize){if(!tickMap[i]){this.xTicks[this.xTicks.length]=i;tickMap[i]=true;}}
this.xTicks.sort(this.DDM.numericSort);},setYTicks:function(iStartY,iTickSize){this.yTicks=[];this.yTickSize=iTickSize;var tickMap={};for(var i=this.initPageY;i>=this.minY;i=i-iTickSize){if(!tickMap[i]){this.yTicks[this.yTicks.length]=i;tickMap[i]=true;}}
for(i=this.initPageY;i<=this.maxY;i=i+iTickSize){if(!tickMap[i]){this.yTicks[this.yTicks.length]=i;tickMap[i]=true;}}
this.yTicks.sort(this.DDM.numericSort);},setXConstraint:function(iLeft,iRight,iTickSize){this.leftConstraint=iLeft;this.rightConstraint=iRight;this.minX=this.initPageX-iLeft;this.maxX=this.initPageX+iRight;if(iTickSize){this.setXTicks(this.initPageX,iTickSize);}
this.constrainX=true;},clearConstraints:function(){this.constrainX=false;this.constrainY=false;this.clearTicks();},clearTicks:function(){this.xTicks=null;this.yTicks=null;this.xTickSize=0;this.yTickSize=0;},setYConstraint:function(iUp,iDown,iTickSize){this.topConstraint=iUp;this.bottomConstraint=iDown;this.minY=this.initPageY-iUp;this.maxY=this.initPageY+iDown;if(iTickSize){this.setYTicks(this.initPageY,iTickSize);}
this.constrainY=true;},resetConstraints:function(){if(this.initPageX||this.initPageX===0){var dx=(this.maintainOffset)?this.lastPageX-this.initPageX:0;var dy=(this.maintainOffset)?this.lastPageY-this.initPageY:0;this.setInitPosition(dx,dy);}else{this.setInitPosition();}
if(this.constrainX){this.setXConstraint(this.leftConstraint,this.rightConstraint,this.xTickSize);}
if(this.constrainY){this.setYConstraint(this.topConstraint,this.bottomConstraint,this.yTickSize);}},getTick:function(val,tickArray){if(!tickArray){return val;}else if(tickArray[0]>=val){return tickArray[0];}else{for(var i=0,len=tickArray.length;i<len;++i){var next=i+1;if(tickArray[next]&&tickArray[next]>=val){var diff1=val-tickArray[i];var diff2=tickArray[next]-val;return(diff2>diff1)?tickArray[i]:tickArray[next];}}
return tickArray[tickArray.length-1];}},toString:function(){return("DragDrop "+this.id);}};})();if(!YAHOO.util.DragDropMgr){YAHOO.util.DragDropMgr=function(){var Event=YAHOO.util.Event;return{ids:{},handleIds:{},dragCurrent:null,dragOvers:{},deltaX:0,deltaY:0,preventDefault:true,stopPropagation:true,initalized:false,locked:false,init:function(){this.initialized=true;},POINT:0,INTERSECT:1,STRICT_INTERSECT:2,mode:0,_execOnAll:function(sMethod,args){for(var i in this.ids){for(var j in this.ids[i]){var oDD=this.ids[i][j];if(!this.isTypeOfDD(oDD)){continue;}
oDD[sMethod].apply(oDD,args);}}},_onLoad:function(){this.init();Event.on(document,"mouseup",this.handleMouseUp,this,true);Event.on(document,"mousemove",this.handleMouseMove,this,true);Event.on(window,"unload",this._onUnload,this,true);Event.on(window,"resize",this._onResize,this,true);},_onResize:function(e){this._execOnAll("resetConstraints",[]);},lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isLocked:function(){return this.locked;},locationCache:{},useCache:true,clickPixelThresh:3,clickTimeThresh:1000,dragThreshMet:false,clickTimeout:null,startX:0,startY:0,regDragDrop:function(oDD,sGroup){if(!this.initialized){this.init();}
if(!this.ids[sGroup]){this.ids[sGroup]={};}
this.ids[sGroup][oDD.id]=oDD;},removeDDFromGroup:function(oDD,sGroup){if(!this.ids[sGroup]){this.ids[sGroup]={};}
var obj=this.ids[sGroup];if(obj&&obj[oDD.id]){delete obj[oDD.id];}},_remove:function(oDD){for(var g in oDD.groups){if(g&&this.ids[g][oDD.id]){delete this.ids[g][oDD.id];}}
delete this.handleIds[oDD.id];},regHandle:function(sDDId,sHandleId){if(!this.handleIds[sDDId]){this.handleIds[sDDId]={};}
this.handleIds[sDDId][sHandleId]=sHandleId;},isDragDrop:function(id){return(this.getDDById(id))?true:false;},getRelated:function(p_oDD,bTargetsOnly){var oDDs=[];for(var i in p_oDD.groups){for(j in this.ids[i]){var dd=this.ids[i][j];if(!this.isTypeOfDD(dd)){continue;}
if(!bTargetsOnly||dd.isTarget){oDDs[oDDs.length]=dd;}}}
return oDDs;},isLegalTarget:function(oDD,oTargetDD){var targets=this.getRelated(oDD,true);for(var i=0,len=targets.length;i<len;++i){if(targets[i].id==oTargetDD.id){return true;}}
return false;},isTypeOfDD:function(oDD){return(oDD&&oDD.__ygDragDrop);},isHandle:function(sDDId,sHandleId){return(this.handleIds[sDDId]&&this.handleIds[sDDId][sHandleId]);},getDDById:function(id){for(var i in this.ids){if(this.ids[i][id]){return this.ids[i][id];}}
return null;},handleMouseDown:function(e,oDD){this.currentTarget=YAHOO.util.Event.getTarget(e);this.dragCurrent=oDD;var el=oDD.getEl();this.startX=YAHOO.util.Event.getPageX(e);this.startY=YAHOO.util.Event.getPageY(e);this.deltaX=this.startX-el.offsetLeft;this.deltaY=this.startY-el.offsetTop;this.dragThreshMet=false;this.clickTimeout=setTimeout(function(){var DDM=YAHOO.util.DDM;DDM.startDrag(DDM.startX,DDM.startY);},this.clickTimeThresh);},startDrag:function(x,y){clearTimeout(this.clickTimeout);if(this.dragCurrent){this.dragCurrent.b4StartDrag(x,y);this.dragCurrent.startDrag(x,y);}
this.dragThreshMet=true;},handleMouseUp:function(e){if(!this.dragCurrent){return;}
clearTimeout(this.clickTimeout);if(this.dragThreshMet){this.fireEvents(e,true);}else{}
this.stopDrag(e);this.stopEvent(e);},stopEvent:function(e){if(this.stopPropagation){YAHOO.util.Event.stopPropagation(e);}
if(this.preventDefault){YAHOO.util.Event.preventDefault(e);}},stopDrag:function(e){if(this.dragCurrent){if(this.dragThreshMet){this.dragCurrent.b4EndDrag(e);this.dragCurrent.endDrag(e);}
this.dragCurrent.onMouseUp(e);}
this.dragCurrent=null;this.dragOvers={};},handleMouseMove:function(e){if(!this.dragCurrent){return true;}
if(YAHOO.util.Event.isIE&&!e.button){this.stopEvent(e);return this.handleMouseUp(e);}
if(!this.dragThreshMet){var diffX=Math.abs(this.startX-YAHOO.util.Event.getPageX(e));var diffY=Math.abs(this.startY-YAHOO.util.Event.getPageY(e));if(diffX>this.clickPixelThresh||diffY>this.clickPixelThresh){this.startDrag(this.startX,this.startY);}}
if(this.dragThreshMet){this.dragCurrent.b4Drag(e);this.dragCurrent.onDrag(e);this.fireEvents(e,false);}
this.stopEvent(e);return true;},fireEvents:function(e,isDrop){var dc=this.dragCurrent;if(!dc||dc.isLocked()){return;}
var x=YAHOO.util.Event.getPageX(e);var y=YAHOO.util.Event.getPageY(e);var pt=new YAHOO.util.Point(x,y);var oldOvers=[];var outEvts=[];var overEvts=[];var dropEvts=[];var enterEvts=[];for(var i in this.dragOvers){var ddo=this.dragOvers[i];if(!this.isTypeOfDD(ddo)){continue;}
if(!this.isOverTarget(pt,ddo,this.mode)){outEvts.push(ddo);}
oldOvers[i]=true;delete this.dragOvers[i];}
for(var sGroup in dc.groups){if("string"!=typeof sGroup){continue;}
for(i in this.ids[sGroup]){var oDD=this.ids[sGroup][i];if(!this.isTypeOfDD(oDD)){continue;}
if(oDD.isTarget&&!oDD.isLocked()&&oDD!=dc){if(this.isOverTarget(pt,oDD,this.mode)){if(isDrop){dropEvts.push(oDD);}else{if(!oldOvers[oDD.id]){enterEvts.push(oDD);}else{overEvts.push(oDD);}
this.dragOvers[oDD.id]=oDD;}}}}}
if(this.mode){if(outEvts.length){dc.b4DragOut(e,outEvts);dc.onDragOut(e,outEvts);}
if(enterEvts.length){dc.onDragEnter(e,enterEvts);}
if(overEvts.length){dc.b4DragOver(e,overEvts);dc.onDragOver(e,overEvts);}
if(dropEvts.length){dc.b4DragDrop(e,dropEvts);dc.onDragDrop(e,dropEvts);}}else{var len=0;for(i=0,len=outEvts.length;i<len;++i){dc.b4DragOut(e,outEvts[i].id);dc.onDragOut(e,outEvts[i].id);}
for(i=0,len=enterEvts.length;i<len;++i){dc.onDragEnter(e,enterEvts[i].id);}
for(i=0,len=overEvts.length;i<len;++i){dc.b4DragOver(e,overEvts[i].id);dc.onDragOver(e,overEvts[i].id);}
for(i=0,len=dropEvts.length;i<len;++i){dc.b4DragDrop(e,dropEvts[i].id);dc.onDragDrop(e,dropEvts[i].id);}}
if(isDrop&&!dropEvts.length){dc.onInvalidDrop(e);}},getBestMatch:function(dds){var winner=null;var len=dds.length;if(len==1){winner=dds[0];}else{for(var i=0;i<len;++i){var dd=dds[i];if(this.mode==this.INTERSECT&&dd.cursorIsOver){winner=dd;break;}else{if(!winner||!winner.overlap||(dd.overlap&&winner.overlap.getArea()<dd.overlap.getArea())){winner=dd;}}}}
return winner;},refreshCache:function(groups){for(var sGroup in groups){if("string"!=typeof sGroup){continue;}
for(var i in this.ids[sGroup]){var oDD=this.ids[sGroup][i];if(this.isTypeOfDD(oDD)){var loc=this.getLocation(oDD);if(loc){this.locationCache[oDD.id]=loc;}else{delete this.locationCache[oDD.id];}}}}},verifyEl:function(el){try{if(el){var parent=el.offsetParent;if(parent){return true;}}}catch(e){}
return false;},getLocation:function(oDD){if(!this.isTypeOfDD(oDD)){return null;}
var el=oDD.getEl(),pos,x1,x2,y1,y2,t,r,b,l;try{pos=YAHOO.util.Dom.getXY(el);}catch(e){}
if(!pos){return null;}
x1=pos[0];x2=x1+el.offsetWidth;y1=pos[1];y2=y1+el.offsetHeight;t=y1-oDD.padding[0];r=x2+oDD.padding[1];b=y2+oDD.padding[2];l=x1-oDD.padding[3];return new YAHOO.util.Region(t,r,b,l);},isOverTarget:function(pt,oTarget,intersect){var loc=this.locationCache[oTarget.id];if(!loc||!this.useCache){loc=this.getLocation(oTarget);this.locationCache[oTarget.id]=loc;}
if(!loc){return false;}
oTarget.cursorIsOver=loc.contains(pt);var dc=this.dragCurrent;if(!dc||!dc.getTargetCoord||(!intersect&&!dc.constrainX&&!dc.constrainY)){return oTarget.cursorIsOver;}
oTarget.overlap=null;var pos=dc.getTargetCoord(pt.x,pt.y);var el=dc.getDragEl();var curRegion=new YAHOO.util.Region(pos.y,pos.x+el.offsetWidth,pos.y+el.offsetHeight,pos.x);var overlap=curRegion.intersect(loc);if(overlap){oTarget.overlap=overlap;return(intersect)?true:oTarget.cursorIsOver;}else{return false;}},_onUnload:function(e,me){this.unregAll();},unregAll:function(){if(this.dragCurrent){this.stopDrag();this.dragCurrent=null;}
this._execOnAll("unreg",[]);for(i in this.elementCache){delete this.elementCache[i];}
this.elementCache={};this.ids={};},elementCache:{},getElWrapper:function(id){var oWrapper=this.elementCache[id];if(!oWrapper||!oWrapper.el){oWrapper=this.elementCache[id]=new this.ElementWrapper(YAHOO.util.Dom.get(id));}
return oWrapper;},getElement:function(id){return YAHOO.util.Dom.get(id);},getCss:function(id){var el=YAHOO.util.Dom.get(id);return(el)?el.style:null;},ElementWrapper:function(el){this.el=el||null;this.id=this.el&&el.id;this.css=this.el&&el.style;},getPosX:function(el){return YAHOO.util.Dom.getX(el);},getPosY:function(el){return YAHOO.util.Dom.getY(el);},swapNode:function(n1,n2){if(n1.swapNode){n1.swapNode(n2);}else{var p=n2.parentNode;var s=n2.nextSibling;if(s==n1){p.insertBefore(n1,n2);}else if(n2==n1.nextSibling){p.insertBefore(n2,n1);}else{n1.parentNode.replaceChild(n2,n1);p.insertBefore(n1,s);}}},getScroll:function(){var t,l,dde=document.documentElement,db=document.body;if(dde&&(dde.scrollTop||dde.scrollLeft)){t=dde.scrollTop;l=dde.scrollLeft;}else if(db){t=db.scrollTop;l=db.scrollLeft;}else{YAHOO.log("could not get scroll property");}
return{top:t,left:l};},getStyle:function(el,styleProp){return YAHOO.util.Dom.getStyle(el,styleProp);},getScrollTop:function(){return this.getScroll().top;},getScrollLeft:function(){return this.getScroll().left;},moveToEl:function(moveEl,targetEl){var aCoord=YAHOO.util.Dom.getXY(targetEl);YAHOO.util.Dom.setXY(moveEl,aCoord);},getClientHeight:function(){return YAHOO.util.Dom.getViewportHeight();},getClientWidth:function(){return YAHOO.util.Dom.getViewportWidth();},numericSort:function(a,b){return(a-b);},_timeoutCount:0,_addListeners:function(){var DDM=YAHOO.util.DDM;if(YAHOO.util.Event&&document){DDM._onLoad();}else{if(DDM._timeoutCount>2000){}else{setTimeout(DDM._addListeners,10);if(document&&document.body){DDM._timeoutCount+=1;}}}},handleWasClicked:function(node,id){if(this.isHandle(id,node.id)){return true;}else{var p=node.parentNode;while(p){if(this.isHandle(id,p.id)){return true;}else{p=p.parentNode;}}}
return false;}};}();YAHOO.util.DDM=YAHOO.util.DragDropMgr;YAHOO.util.DDM._addListeners();}
YAHOO.util.DD=function(id,sGroup,config){if(id){this.init(id,sGroup,config);}};YAHOO.extend(YAHOO.util.DD,YAHOO.util.DragDrop,{scroll:true,autoOffset:function(iPageX,iPageY){var x=iPageX-this.startPageX;var y=iPageY-this.startPageY;this.setDelta(x,y);},setDelta:function(iDeltaX,iDeltaY){this.deltaX=iDeltaX;this.deltaY=iDeltaY;},setDragElPos:function(iPageX,iPageY){var el=this.getDragEl();this.alignElWithMouse(el,iPageX,iPageY);},alignElWithMouse:function(el,iPageX,iPageY){var oCoord=this.getTargetCoord(iPageX,iPageY);if(!this.deltaSetXY){var aCoord=[oCoord.x,oCoord.y];YAHOO.util.Dom.setXY(el,aCoord);var newLeft=parseInt(YAHOO.util.Dom.getStyle(el,"left"),10);var newTop=parseInt(YAHOO.util.Dom.getStyle(el,"top"),10);this.deltaSetXY=[newLeft-oCoord.x,newTop-oCoord.y];}else{YAHOO.util.Dom.setStyle(el,"left",(oCoord.x+this.deltaSetXY[0])+"px");YAHOO.util.Dom.setStyle(el,"top",(oCoord.y+this.deltaSetXY[1])+"px");}
this.cachePosition(oCoord.x,oCoord.y);this.autoScroll(oCoord.x,oCoord.y,el.offsetHeight,el.offsetWidth);},cachePosition:function(iPageX,iPageY){if(iPageX){this.lastPageX=iPageX;this.lastPageY=iPageY;}else{var aCoord=YAHOO.util.Dom.getXY(this.getEl());this.lastPageX=aCoord[0];this.lastPageY=aCoord[1];}},autoScroll:function(x,y,h,w){if(this.scroll){var clientH=this.DDM.getClientHeight();var clientW=this.DDM.getClientWidth();var st=this.DDM.getScrollTop();var sl=this.DDM.getScrollLeft();var bot=h+y;var right=w+x;var toBot=(clientH+st-y-this.deltaY);var toRight=(clientW+sl-x-this.deltaX);var thresh=40;var scrAmt=(document.all)?80:30;if(bot>clientH&&toBot<thresh){window.scrollTo(sl,st+scrAmt);}
if(y<st&&st>0&&y-st<thresh){window.scrollTo(sl,st-scrAmt);}
if(right>clientW&&toRight<thresh){window.scrollTo(sl+scrAmt,st);}
if(x<sl&&sl>0&&x-sl<thresh){window.scrollTo(sl-scrAmt,st);}}},getTargetCoord:function(iPageX,iPageY){var x=iPageX-this.deltaX;var y=iPageY-this.deltaY;if(this.constrainX){if(x<this.minX){x=this.minX;}
if(x>this.maxX){x=this.maxX;}}
if(this.constrainY){if(y<this.minY){y=this.minY;}
if(y>this.maxY){y=this.maxY;}}
x=this.getTick(x,this.xTicks);y=this.getTick(y,this.yTicks);return{x:x,y:y};},applyConfig:function(){YAHOO.util.DD.superclass.applyConfig.call(this);this.scroll=(this.config.scroll!==false);},b4MouseDown:function(e){this.autoOffset(YAHOO.util.Event.getPageX(e),YAHOO.util.Event.getPageY(e));},b4Drag:function(e){this.setDragElPos(YAHOO.util.Event.getPageX(e),YAHOO.util.Event.getPageY(e));},toString:function(){return("DD "+this.id);}});YAHOO.util.DDProxy=function(id,sGroup,config){if(id){this.init(id,sGroup,config);this.initFrame();}};YAHOO.util.DDProxy.dragElId="ygddfdiv";YAHOO.extend(YAHOO.util.DDProxy,YAHOO.util.DD,{resizeFrame:true,centerFrame:false,createFrame:function(){var self=this;var body=document.body;if(!body||!body.firstChild){setTimeout(function(){self.createFrame();},50);return;}
var div=this.getDragEl();if(!div){div=document.createElement("div");div.id=this.dragElId;var s=div.style;s.position="absolute";s.visibility="hidden";s.cursor="move";s.border="2px solid #aaa";s.zIndex=999;body.insertBefore(div,body.firstChild);}},initFrame:function(){this.createFrame();},applyConfig:function(){YAHOO.util.DDProxy.superclass.applyConfig.call(this);this.resizeFrame=(this.config.resizeFrame!==false);this.centerFrame=(this.config.centerFrame);this.setDragElId(this.config.dragElId||YAHOO.util.DDProxy.dragElId);},showFrame:function(iPageX,iPageY){var el=this.getEl();var dragEl=this.getDragEl();var s=dragEl.style;this._resizeProxy();if(this.centerFrame){this.setDelta(Math.round(parseInt(s.width,10)/2),Math.round(parseInt(s.height,10)/2));}
this.setDragElPos(iPageX,iPageY);YAHOO.util.Dom.setStyle(dragEl,"visibility","visible");},_resizeProxy:function(){if(this.resizeFrame){var DOM=YAHOO.util.Dom;var el=this.getEl();var dragEl=this.getDragEl();var bt=parseInt(DOM.getStyle(dragEl,"borderTopWidth"),10);var br=parseInt(DOM.getStyle(dragEl,"borderRightWidth"),10);var bb=parseInt(DOM.getStyle(dragEl,"borderBottomWidth"),10);var bl=parseInt(DOM.getStyle(dragEl,"borderLeftWidth"),10);if(isNaN(bt)){bt=0;}
if(isNaN(br)){br=0;}
if(isNaN(bb)){bb=0;}
if(isNaN(bl)){bl=0;}
var newWidth=Math.max(0,el.offsetWidth-br-bl);var newHeight=Math.max(0,el.offsetHeight-bt-bb);DOM.setStyle(dragEl,"width",newWidth+"px");DOM.setStyle(dragEl,"height",newHeight+"px");}},b4MouseDown:function(e){var x=YAHOO.util.Event.getPageX(e);var y=YAHOO.util.Event.getPageY(e);this.autoOffset(x,y);this.setDragElPos(x,y);},b4StartDrag:function(x,y){this.showFrame(x,y);},b4EndDrag:function(e){YAHOO.util.Dom.setStyle(this.getDragEl(),"visibility","hidden");},endDrag:function(e){var DOM=YAHOO.util.Dom;var lel=this.getEl();var del=this.getDragEl();DOM.setStyle(del,"visibility","");DOM.setStyle(lel,"visibility","hidden");YAHOO.util.DDM.moveToEl(lel,del);DOM.setStyle(del,"visibility","hidden");DOM.setStyle(lel,"visibility","");},toString:function(){return("DDProxy "+this.id);}});YAHOO.util.DDTarget=function(id,sGroup,config){if(id){this.initTarget(id,sGroup,config);}};YAHOO.extend(YAHOO.util.DDTarget,YAHOO.util.DragDrop,{toString:function(){return("DDTarget "+this.id);}});
(function(){var Dom=YAHOO.util.Dom,Event=YAHOO.util.Event;YAHOO.widget.MenuManager=function(){var m_bInitializedEventHandlers=false,m_oMenus={},m_oItems={},m_oVisibleMenus={},me=this;function addItem(p_oItem){var sYUIId=Dom.generateId();if(p_oItem&&m_oItems[sYUIId]!=p_oItem){p_oItem.element.setAttribute("yuiid",sYUIId);m_oItems[sYUIId]=p_oItem;p_oItem.destroyEvent.subscribe(onItemDestroy,p_oItem);}}
function removeItem(p_oItem){var sYUIId=p_oItem.element.getAttribute("yuiid");if(sYUIId&&m_oItems[sYUIId]){delete m_oItems[sYUIId];}}
function getMenuRootElement(p_oElement){var oParentNode;if(p_oElement&&p_oElement.tagName){switch(p_oElement.tagName.toUpperCase()){case"DIV":oParentNode=p_oElement.parentNode;if(Dom.hasClass(p_oElement,"bd")&&oParentNode&&oParentNode.tagName&&oParentNode.tagName.toUpperCase()=="DIV"){return oParentNode;}
else{return p_oElement;}
break;case"LI":return p_oElement;default:oParentNode=p_oElement.parentNode;if(oParentNode){return getMenuRootElement(oParentNode);}
break;}}}
function onDOMEvent(p_oEvent){var oTarget=Event.getTarget(p_oEvent),oElement=getMenuRootElement(oTarget),oMenuItem,oMenu;if(oElement){var sTagName=oElement.tagName.toUpperCase();if(sTagName=="LI"){var sYUIId=oElement.getAttribute("yuiid");if(sYUIId){oMenuItem=m_oItems[sYUIId];oMenu=oMenuItem.parent;}}
else if(sTagName=="DIV"){if(oElement.id){oMenu=m_oMenus[oElement.id];}}}
if(oMenu){var oEventTypes={"click":"clickEvent","mousedown":"mouseDownEvent","mouseup":"mouseUpEvent","mouseover":"mouseOverEvent","mouseout":"mouseOutEvent","keydown":"keyDownEvent","keyup":"keyUpEvent","keypress":"keyPressEvent"},sCustomEventType=oEventTypes[p_oEvent.type];if(oMenuItem&&!oMenuItem.cfg.getProperty("disabled")){oMenuItem[sCustomEventType].fire(p_oEvent);}
oMenu[sCustomEventType].fire(p_oEvent,oMenuItem);}
else if(p_oEvent.type=="mousedown"){var oActiveItem;for(var i in m_oMenus){if(m_oMenus.hasOwnProperty(i)){oMenu=m_oMenus[i];if(oMenu.cfg.getProperty("clicktohide")&&oMenu.cfg.getProperty("position")=="dynamic"){oMenu.hide();}
else{oMenu.clearActiveItem(true);}}}}}
function onMenuDestroy(p_sType,p_aArgs,p_oMenu){if(p_oMenu&&m_oMenus[p_oMenu.id]){delete m_oMenus[p_oMenu.id];}}
function onItemDestroy(p_sType,p_aArgs,p_oItem){var sYUIId=p_oItem.element.getAttribute("yuiid");if(sYUIId){delete m_oItems[sYUIId];}}
function onMenuVisibleConfigChange(p_sType,p_aArgs,p_oMenu){var bVisible=p_aArgs[0];if(bVisible){m_oVisibleMenus[p_oMenu.id]=p_oMenu;}
else if(m_oVisibleMenus[p_oMenu.id]){delete m_oVisibleMenus[p_oMenu.id];}}
function onItemAdded(p_sType,p_aArgs){addItem(p_aArgs[0]);}
function onItemRemoved(p_sType,p_aArgs){removeItem(p_aArgs[0]);}
return{addMenu:function(p_oMenu){if(p_oMenu&&p_oMenu.id&&!m_oMenus[p_oMenu.id]){m_oMenus[p_oMenu.id]=p_oMenu;if(!m_bInitializedEventHandlers){var oDoc=document;Event.addListener(oDoc,"mouseover",onDOMEvent,me,true);Event.addListener(oDoc,"mouseout",onDOMEvent,me,true);Event.addListener(oDoc,"mousedown",onDOMEvent,me,true);Event.addListener(oDoc,"mouseup",onDOMEvent,me,true);Event.addListener(oDoc,"click",onDOMEvent,me,true);Event.addListener(oDoc,"keydown",onDOMEvent,me,true);Event.addListener(oDoc,"keyup",onDOMEvent,me,true);Event.addListener(oDoc,"keypress",onDOMEvent,me,true);m_bInitializedEventHandlers=true;}
p_oMenu.destroyEvent.subscribe(onMenuDestroy,p_oMenu,me);p_oMenu.cfg.subscribeToConfigEvent("visible",onMenuVisibleConfigChange,p_oMenu);p_oMenu.itemAddedEvent.subscribe(onItemAdded);p_oMenu.itemRemovedEvent.subscribe(onItemRemoved);}},removeMenu:function(p_oMenu){if(p_oMenu&&m_oMenus[p_oMenu.id]){delete m_oMenus[p_oMenu.id];}},hideVisible:function(){var oMenu;for(var i in m_oVisibleMenus){if(m_oVisibleMenus.hasOwnProperty(i)){oMenu=m_oVisibleMenus[i];if(oMenu.cfg.getProperty("position")=="dynamic"){oMenu.hide();}}}},getMenus:function(){return m_oMenus;},getMenu:function(p_sId){if(m_oMenus[p_sId]){return m_oMenus[p_sId];}},toString:function(){return("MenuManager");}};}();})();(function(){var Dom=YAHOO.util.Dom,Event=YAHOO.util.Event;YAHOO.widget.Menu=function(p_oElement,p_oConfig){if(p_oConfig){this.parent=p_oConfig.parent;this.lazyLoad=p_oConfig.lazyLoad||p_oConfig.lazyload;this.itemData=p_oConfig.itemData||p_oConfig.itemdata;}
YAHOO.widget.Menu.superclass.constructor.call(this,p_oElement,p_oConfig);};YAHOO.extend(YAHOO.widget.Menu,YAHOO.widget.Overlay,{CSS_CLASS_NAME:"yuimenu",ITEM_TYPE:null,GROUP_TITLE_TAG_NAME:"h6",_nHideDelayId:null,_nShowDelayId:null,_hideDelayEventHandlersAssigned:false,_bHandledMouseOverEvent:false,_bHandledMouseOutEvent:false,_aGroupTitleElements:null,_aItemGroups:null,_aListElements:null,lazyLoad:false,itemData:null,activeItem:null,parent:null,srcElement:null,mouseOverEvent:null,mouseOutEvent:null,mouseDownEvent:null,mouseUpEvent:null,clickEvent:null,keyPressEvent:null,keyDownEvent:null,keyUpEvent:null,itemAddedEvent:null,itemRemovedEvent:null,init:function(p_oElement,p_oConfig){this._aItemGroups=[];this._aListElements=[];this._aGroupTitleElements=[];if(!this.ITEM_TYPE){this.ITEM_TYPE=YAHOO.widget.MenuItem;}
var oElement;if(typeof p_oElement=="string"){oElement=document.getElementById(p_oElement);}
else if(p_oElement.tagName){oElement=p_oElement;}
if(oElement&&oElement.tagName){switch(oElement.tagName.toUpperCase()){case"DIV":this.srcElement=oElement;if(!oElement.id){oElement.setAttribute("id",Dom.generateId());}
YAHOO.widget.Menu.superclass.init.call(this,oElement);this.beforeInitEvent.fire(YAHOO.widget.Menu);break;case"SELECT":this.srcElement=oElement;YAHOO.widget.Menu.superclass.init.call(this,Dom.generateId());this.beforeInitEvent.fire(YAHOO.widget.Menu);break;}}
else{YAHOO.widget.Menu.superclass.init.call(this,p_oElement);this.beforeInitEvent.fire(YAHOO.widget.Menu);}
if(this.element){var oEl=this.element;Dom.addClass(oEl,this.CSS_CLASS_NAME);this.initEvent.subscribe(this._onInit,this,true);this.beforeRenderEvent.subscribe(this._onBeforeRender,this,true);this.renderEvent.subscribe(this._onRender,this,true);this.beforeShowEvent.subscribe(this._onBeforeShow,this,true);this.showEvent.subscribe(this._onShow,this,true);this.beforeHideEvent.subscribe(this._onBeforeHide,this,true);this.mouseOverEvent.subscribe(this._onMouseOver,this,true);this.mouseOutEvent.subscribe(this._onMouseOut,this,true);this.clickEvent.subscribe(this._onClick,this,true);this.keyDownEvent.subscribe(this._onKeyDown,this,true);YAHOO.widget.Module.textResizeEvent.subscribe(this._onTextResize,this,true);if(p_oConfig){this.cfg.applyConfig(p_oConfig,true);}
YAHOO.widget.MenuManager.addMenu(this);this.initEvent.fire(YAHOO.widget.Menu);}},_initSubTree:function(){var oNode;if(this.srcElement.tagName=="DIV"){oNode=this.body.firstChild;var nGroup=0,sGroupTitleTagName=this.GROUP_TITLE_TAG_NAME.toUpperCase();do{if(oNode&&oNode.tagName){switch(oNode.tagName.toUpperCase()){case sGroupTitleTagName:this._aGroupTitleElements[nGroup]=oNode;break;case"UL":this._aListElements[nGroup]=oNode;this._aItemGroups[nGroup]=[];nGroup++;break;}}}
while((oNode=oNode.nextSibling));if(this._aListElements[0]){Dom.addClass(this._aListElements[0],"first-of-type");}}
oNode=null;if(this.srcElement.tagName){var sSrcElementTagName=this.srcElement.tagName.toUpperCase();switch(sSrcElementTagName){case"DIV":if(this._aListElements.length>0){var i=this._aListElements.length-1;do{oNode=this._aListElements[i].firstChild;do{if(oNode&&oNode.tagName&&oNode.tagName.toUpperCase()=="LI"){this.addItem(new this.ITEM_TYPE(oNode,{parent:this}),i);}}
while((oNode=oNode.nextSibling));}
while(i--);}
break;case"SELECT":oNode=this.srcElement.firstChild;do{if(oNode&&oNode.tagName){switch(oNode.tagName.toUpperCase()){case"OPTGROUP":case"OPTION":this.addItem(new this.ITEM_TYPE(oNode,{parent:this}));break;}}}
while((oNode=oNode.nextSibling));break;}}},_getFirstEnabledItem:function(){var nGroups=this._aItemGroups.length,oItem,aItemGroup;for(var i=0;i<nGroups;i++){aItemGroup=this._aItemGroups[i];if(aItemGroup){var nItems=aItemGroup.length;for(var n=0;n<nItems;n++){oItem=aItemGroup[n];if(!oItem.cfg.getProperty("disabled")&&oItem.element.style.display!="none"){return oItem;}
oItem=null;}}}},_checkPosition:function(p_sPosition){if(typeof p_sPosition=="string"){var sPosition=p_sPosition.toLowerCase();return("dynamic,static".indexOf(sPosition)!=-1);}},_addItemToGroup:function(p_nGroupIndex,p_oItem,p_nItemIndex){var oItem;if(p_oItem instanceof this.ITEM_TYPE){oItem=p_oItem;oItem.parent=this;}
else if(typeof p_oItem=="string"){oItem=new this.ITEM_TYPE(p_oItem,{parent:this});}
else if(typeof p_oItem=="object"){p_oItem.parent=this;oItem=new this.ITEM_TYPE(p_oItem.text,p_oItem);}
if(oItem){var nGroupIndex=typeof p_nGroupIndex=="number"?p_nGroupIndex:0,aGroup=this._getItemGroup(nGroupIndex),oGroupItem;if(!aGroup){aGroup=this._createItemGroup(nGroupIndex);}
if(typeof p_nItemIndex=="number"){var bAppend=(p_nItemIndex>=aGroup.length);if(aGroup[p_nItemIndex]){aGroup.splice(p_nItemIndex,0,oItem);}
else{aGroup[p_nItemIndex]=oItem;}
oGroupItem=aGroup[p_nItemIndex];if(oGroupItem){if(bAppend&&(!oGroupItem.element.parentNode||oGroupItem.element.parentNode.nodeType==11)){this._aListElements[nGroupIndex].appendChild(oGroupItem.element);}
else{function getNextItemSibling(p_aArray,p_nStartIndex){return(p_aArray[p_nStartIndex]||getNextItemSibling(p_aArray,(p_nStartIndex+1)));}
var oNextItemSibling=getNextItemSibling(aGroup,(p_nItemIndex+1));if(oNextItemSibling&&(!oGroupItem.element.parentNode||oGroupItem.element.parentNode.nodeType==11)){this._aListElements[nGroupIndex].insertBefore(oGroupItem.element,oNextItemSibling.element);}}
oGroupItem.parent=this;this._subscribeToItemEvents(oGroupItem);this._configureSubmenu(oGroupItem);this._updateItemProperties(nGroupIndex);this.itemAddedEvent.fire(oGroupItem);return oGroupItem;}}
else{var nItemIndex=aGroup.length;aGroup[nItemIndex]=oItem;oGroupItem=aGroup[nItemIndex];if(oGroupItem){if(!Dom.isAncestor(this._aListElements[nGroupIndex],oGroupItem.element)){this._aListElements[nGroupIndex].appendChild(oGroupItem.element);}
oGroupItem.element.setAttribute("groupindex",nGroupIndex);oGroupItem.element.setAttribute("index",nItemIndex);oGroupItem.parent=this;oGroupItem.index=nItemIndex;oGroupItem.groupIndex=nGroupIndex;this._subscribeToItemEvents(oGroupItem);this._configureSubmenu(oGroupItem);if(nItemIndex===0){Dom.addClass(oGroupItem.element,"first-of-type");}
this.itemAddedEvent.fire(oGroupItem);return oGroupItem;}}}},_removeItemFromGroupByIndex:function(p_nGroupIndex,p_nItemIndex){var nGroupIndex=typeof p_nGroupIndex=="number"?p_nGroupIndex:0,aGroup=this._getItemGroup(nGroupIndex);if(aGroup){var aArray=aGroup.splice(p_nItemIndex,1),oItem=aArray[0];if(oItem){this._updateItemProperties(nGroupIndex);if(aGroup.length===0){var oUL=this._aListElements[nGroupIndex];if(this.body&&oUL){this.body.removeChild(oUL);}
this._aItemGroups.splice(nGroupIndex,1);this._aListElements.splice(nGroupIndex,1);oUL=this._aListElements[0];if(oUL){Dom.addClass(oUL,"first-of-type");}}
this.itemRemovedEvent.fire(oItem);return oItem;}}},_removeItemFromGroupByValue:function(p_nGroupIndex,p_oItem){var aGroup=this._getItemGroup(p_nGroupIndex);if(aGroup){var nItems=aGroup.length,nItemIndex=-1;if(nItems>0){var i=nItems-1;do{if(aGroup[i]==p_oItem){nItemIndex=i;break;}}
while(i--);if(nItemIndex>-1){return this._removeItemFromGroupByIndex(p_nGroupIndex,nItemIndex);}}}},_updateItemProperties:function(p_nGroupIndex){var aGroup=this._getItemGroup(p_nGroupIndex),nItems=aGroup.length;if(nItems>0){var i=nItems-1,oItem,oLI;do{oItem=aGroup[i];if(oItem){oLI=oItem.element;oItem.index=i;oItem.groupIndex=p_nGroupIndex;oLI.setAttribute("groupindex",p_nGroupIndex);oLI.setAttribute("index",i);Dom.removeClass(oLI,"first-of-type");}}
while(i--);if(oLI){Dom.addClass(oLI,"first-of-type");}}},_createItemGroup:function(p_nIndex){if(!this._aItemGroups[p_nIndex]){this._aItemGroups[p_nIndex]=[];var oUL=document.createElement("ul");this._aListElements[p_nIndex]=oUL;return this._aItemGroups[p_nIndex];}},_getItemGroup:function(p_nIndex){var nIndex=((typeof p_nIndex=="number")?p_nIndex:0);return this._aItemGroups[nIndex];},_configureSubmenu:function(p_oItem){var oSubmenu=p_oItem.cfg.getProperty("submenu");if(oSubmenu){this.cfg.configChangedEvent.subscribe(this._onParentMenuConfigChange,oSubmenu,true);this.renderEvent.subscribe(this._onParentMenuRender,oSubmenu,true);oSubmenu.beforeShowEvent.subscribe(this._onSubmenuBeforeShow,oSubmenu,true);oSubmenu.showEvent.subscribe(this._onSubmenuShow,oSubmenu,true);oSubmenu.hideEvent.subscribe(this._onSubmenuHide,oSubmenu,true);}},_subscribeToItemEvents:function(p_oItem){p_oItem.focusEvent.subscribe(this._onMenuItemFocus,p_oItem,this);p_oItem.blurEvent.subscribe(this._onMenuItemBlur,this,true);p_oItem.cfg.configChangedEvent.subscribe(this._onMenuItemConfigChange,p_oItem,this);},_getOffsetWidth:function(){var oClone=this.element.cloneNode(true);Dom.setStyle(oClone,"width","");document.body.appendChild(oClone);var sWidth=oClone.offsetWidth;document.body.removeChild(oClone);return sWidth;},_cancelHideDelay:function(){var oRoot=this.getRoot();if(oRoot._nHideDelayId){window.clearTimeout(oRoot._nHideDelayId);}},_execHideDelay:function(){this._cancelHideDelay();var oRoot=this.getRoot(),me=this;function hideMenu(){if(oRoot.activeItem){oRoot.clearActiveItem();}
if(oRoot==me&&me.cfg.getProperty("position")=="dynamic"){me.hide();}}
oRoot._nHideDelayId=window.setTimeout(hideMenu,oRoot.cfg.getProperty("hidedelay"));},_cancelShowDelay:function(){var oRoot=this.getRoot();if(oRoot._nShowDelayId){window.clearTimeout(oRoot._nShowDelayId);}},_execShowDelay:function(p_oMenu){var oRoot=this.getRoot();function showMenu(){p_oMenu.show();}
oRoot._nShowDelayId=window.setTimeout(showMenu,oRoot.cfg.getProperty("showdelay"));},_onMouseOver:function(p_sType,p_aArgs,p_oMenu){var oEvent=p_aArgs[0],oItem=p_aArgs[1],oTarget=Event.getTarget(oEvent);if(!this._bHandledMouseOverEvent&&(oTarget==this.element||Dom.isAncestor(this.element,oTarget))){this.clearActiveItem();this._bHandledMouseOverEvent=true;this._bHandledMouseOutEvent=false;}
if(oItem&&!oItem.handledMouseOverEvent&&!oItem.cfg.getProperty("disabled")&&(oTarget==oItem.element||Dom.isAncestor(oItem.element,oTarget))){var nShowDelay=this.cfg.getProperty("showdelay"),bShowDelay=(nShowDelay>0);if(bShowDelay){this._cancelShowDelay();}
var oActiveItem=this.activeItem;if(oActiveItem){oActiveItem.cfg.setProperty("selected",false);var oActiveSubmenu=oActiveItem.cfg.getProperty("submenu");if(oActiveSubmenu){oActiveSubmenu.hide();}}
var oItemCfg=oItem.cfg;oItemCfg.setProperty("selected",true);oItem.focus();if(this.cfg.getProperty("autosubmenudisplay")){var oSubmenu=oItemCfg.getProperty("submenu");if(oSubmenu){if(bShowDelay){this._execShowDelay(oSubmenu);}
else{oSubmenu.show();}}}
oItem.handledMouseOverEvent=true;oItem.handledMouseOutEvent=false;}},_onMouseOut:function(p_sType,p_aArgs,p_oMenu){var oEvent=p_aArgs[0],oItem=p_aArgs[1],oRelatedTarget=Event.getRelatedTarget(oEvent),bMovingToSubmenu=false;if(oItem&&!oItem.cfg.getProperty("disabled")){var oItemCfg=oItem.cfg,oSubmenu=oItemCfg.getProperty("submenu");if(oSubmenu&&(oRelatedTarget==oSubmenu.element||Dom.isAncestor(oSubmenu.element,oRelatedTarget))){bMovingToSubmenu=true;}
if(!oItem.handledMouseOutEvent&&((oRelatedTarget!=oItem.element&&!Dom.isAncestor(oItem.element,oRelatedTarget))||bMovingToSubmenu)){if(!oSubmenu||(oSubmenu&&!oSubmenu.cfg.getProperty("visible"))){oItem.cfg.setProperty("selected",false);if(oSubmenu&&oSubmenu.cfg.getProperty("showdelay")&&!oSubmenu.cfg.getProperty("visible")){this._cancelShowDelay();}}
oItem.handledMouseOutEvent=true;oItem.handledMouseOverEvent=false;}}
if(!this._bHandledMouseOutEvent&&((oRelatedTarget!=this.element&&!Dom.isAncestor(this.element,oRelatedTarget))||bMovingToSubmenu)){this._bHandledMouseOutEvent=true;this._bHandledMouseOverEvent=false;}},_onClick:function(p_sType,p_aArgs,p_oMenu){var oEvent=p_aArgs[0],oItem=p_aArgs[1],oTarget=Event.getTarget(oEvent);if(oItem&&!oItem.cfg.getProperty("disabled")){var oItemCfg=oItem.cfg,oSubmenu=oItemCfg.getProperty("submenu");if(oTarget==oItem.submenuIndicator&&oSubmenu){if(oSubmenu.cfg.getProperty("visible")){oSubmenu.hide();}
else{this.clearActiveItem();this.activeItem=oItem;oItem.cfg.setProperty("selected",true);oSubmenu.show();}}
else{var sURL=oItemCfg.getProperty("url"),bCurrentPageURL=(sURL.substr((sURL.length-1),1)=="#"),sTarget=oItemCfg.getProperty("target"),bHasTarget=(sTarget&&sTarget.length>0);if(oTarget.tagName.toUpperCase()=="A"&&bCurrentPageURL&&!bHasTarget){Event.preventDefault(oEvent);}
if(oTarget.tagName.toUpperCase()!="A"&&!bCurrentPageURL&&!bHasTarget){document.location=sURL;}
if(bCurrentPageURL&&!oSubmenu){var oRoot=this.getRoot();if(oRoot.cfg.getProperty("position")=="static"){oRoot.clearActiveItem();}
else{oRoot.hide();}}}}},_onKeyDown:function(p_sType,p_aArgs,p_oMenu){var oEvent=p_aArgs[0],oItem=p_aArgs[1],oSubmenu;if(oItem&&!oItem.cfg.getProperty("disabled")){var oItemCfg=oItem.cfg,oParentItem=this.parent,oRoot,oNextItem;switch(oEvent.keyCode){case 38:case 40:if(oItem==this.activeItem&&!oItemCfg.getProperty("selected")){oItemCfg.setProperty("selected",true);}
else{oNextItem=(oEvent.keyCode==38)?oItem.getPreviousEnabledSibling():oItem.getNextEnabledSibling();if(oNextItem){this.clearActiveItem();oNextItem.cfg.setProperty("selected",true);oNextItem.focus();}}
Event.preventDefault(oEvent);break;case 39:oSubmenu=oItemCfg.getProperty("submenu");if(oSubmenu){if(!oItemCfg.getProperty("selected")){oItemCfg.setProperty("selected",true);}
oSubmenu.show();oSubmenu.setInitialSelection();}
else{oRoot=this.getRoot();if(oRoot instanceof YAHOO.widget.MenuBar){oNextItem=oRoot.activeItem.getNextEnabledSibling();if(oNextItem){oRoot.clearActiveItem();oNextItem.cfg.setProperty("selected",true);oSubmenu=oNextItem.cfg.getProperty("submenu");if(oSubmenu){oSubmenu.show();}
oNextItem.focus();}}}
Event.preventDefault(oEvent);break;case 37:if(oParentItem){var oParentMenu=oParentItem.parent;if(oParentMenu instanceof YAHOO.widget.MenuBar){oNextItem=oParentMenu.activeItem.getPreviousEnabledSibling();if(oNextItem){oParentMenu.clearActiveItem();oNextItem.cfg.setProperty("selected",true);oSubmenu=oNextItem.cfg.getProperty("submenu");if(oSubmenu){oSubmenu.show();}
oNextItem.focus();}}
else{this.hide();oParentItem.focus();}}
Event.preventDefault(oEvent);break;}}
if(oEvent.keyCode==27){if(this.cfg.getProperty("position")=="dynamic"){this.hide();if(this.parent){this.parent.focus();}}
else if(this.activeItem){oSubmenu=this.activeItem.cfg.getProperty("submenu");if(oSubmenu&&oSubmenu.cfg.getProperty("visible")){oSubmenu.hide();this.activeItem.focus();}
else{this.activeItem.cfg.setProperty("selected",false);this.activeItem.blur();}}
Event.preventDefault(oEvent);}},_onTextResize:function(p_sType,p_aArgs,p_oMenu){if(this.browser=="gecko"&&!this._handleResize){this._handleResize=true;return;}
var oConfig=this.cfg;if(oConfig.getProperty("position")=="dynamic"){oConfig.setProperty("width",(this._getOffsetWidth()+"px"));}},_onInit:function(p_sType,p_aArgs,p_oMenu){if(((this.parent&&!this.lazyLoad)||(!this.parent&&this.cfg.getProperty("position")=="static")||(!this.parent&&!this.lazyLoad&&this.cfg.getProperty("position")=="dynamic"))&&this.getItemGroups().length===0){if(this.srcElement){this._initSubTree();}
if(this.itemData){this.addItems(this.itemData);}}
else if(this.lazyLoad){this.cfg.fireQueue();}},_onBeforeRender:function(p_sType,p_aArgs,p_oMenu){var oConfig=this.cfg,oEl=this.element,nListElements=this._aListElements.length;if(nListElements>0){var i=0,bFirstList=true,oUL,oGroupTitle;do{oUL=this._aListElements[i];if(oUL){if(bFirstList){Dom.addClass(oUL,"first-of-type");bFirstList=false;}
if(!Dom.isAncestor(oEl,oUL)){this.appendToBody(oUL);}
oGroupTitle=this._aGroupTitleElements[i];if(oGroupTitle){if(!Dom.isAncestor(oEl,oGroupTitle)){oUL.parentNode.insertBefore(oGroupTitle,oUL);}
Dom.addClass(oUL,"hastitle");}}
i++;}
while(i<nListElements);}},_onRender:function(p_sType,p_aArgs,p_oMenu){if(this.cfg.getProperty("position")=="dynamic"){var sWidth=this.element.parentNode.tagName.toUpperCase()=="BODY"?this.element.offsetWidth:this._getOffsetWidth();this.cfg.setProperty("width",(sWidth+"px"));}},_onBeforeShow:function(p_sType,p_aArgs,p_oMenu){if(this.lazyLoad&&this.getItemGroups().length===0){if(this.srcElement){this._initSubTree();}
if(this.itemData){if(this.parent&&this.parent.parent&&this.parent.parent.srcElement&&this.parent.parent.srcElement.tagName.toUpperCase()=="SELECT"){var nOptions=this.itemData.length;for(var n=0;n<nOptions;n++){if(this.itemData[n].tagName){this.addItem((new this.ITEM_TYPE(this.itemData[n])));}}}
else{this.addItems(this.itemData);}}
if(this.srcElement){this.render();}
else{if(this.parent){this.render(this.parent.element);}
else{this.render(this.cfg.getProperty("container"));}}}},_onShow:function(p_sType,p_aArgs,p_oMenu){this.setInitialFocus();var oParent=this.parent;if(oParent){var oParentMenu=oParent.parent,aParentAlignment=oParentMenu.cfg.getProperty("submenualignment"),aAlignment=this.cfg.getProperty("submenualignment");if((aParentAlignment[0]!=aAlignment[0])&&(aParentAlignment[1]!=aAlignment[1])){this.cfg.setProperty("submenualignment",[aParentAlignment[0],aParentAlignment[1]]);}
if(!oParentMenu.cfg.getProperty("autosubmenudisplay")&&oParentMenu.cfg.getProperty("position")=="static"){oParentMenu.cfg.setProperty("autosubmenudisplay",true);function disableAutoSubmenuDisplay(p_oEvent){if(p_oEvent.type=="mousedown"||(p_oEvent.type=="keydown"&&p_oEvent.keyCode==27)){var oTarget=Event.getTarget(p_oEvent);if(oTarget!=oParentMenu.element||!YAHOO.util.Dom.isAncestor(oParentMenu.element,oTarget)){oParentMenu.cfg.setProperty("autosubmenudisplay",false);Event.removeListener(document,"mousedown",disableAutoSubmenuDisplay);Event.removeListener(document,"keydown",disableAutoSubmenuDisplay);}}}
Event.addListener(document,"mousedown",disableAutoSubmenuDisplay);Event.addListener(document,"keydown",disableAutoSubmenuDisplay);}}},_onBeforeHide:function(p_sType,p_aArgs,p_oMenu){var oActiveItem=this.activeItem;if(oActiveItem){var oConfig=oActiveItem.cfg;oConfig.setProperty("selected",false);var oSubmenu=oConfig.getProperty("submenu");if(oSubmenu){oSubmenu.hide();}
oActiveItem.blur();}},_onParentMenuConfigChange:function(p_sType,p_aArgs,p_oSubmenu){var sPropertyName=p_aArgs[0][0],oPropertyValue=p_aArgs[0][1];switch(sPropertyName){case"iframe":case"constraintoviewport":case"hidedelay":case"showdelay":case"clicktohide":case"effect":p_oSubmenu.cfg.setProperty(sPropertyName,oPropertyValue);break;}},_onParentMenuRender:function(p_sType,p_aArgs,p_oSubmenu){var oParentMenu=p_oSubmenu.parent.parent,oConfig={constraintoviewport:oParentMenu.cfg.getProperty("constraintoviewport"),xy:[0,0],clicktohide:oParentMenu.cfg.getProperty("clicktohide"),effect:oParentMenu.cfg.getProperty("effect"),showdelay:oParentMenu.cfg.getProperty("showdelay"),hidedelay:oParentMenu.cfg.getProperty("hidedelay")};if(this.cfg.getProperty("position")==oParentMenu.cfg.getProperty("position")){oConfig.iframe=oParentMenu.cfg.getProperty("iframe");}
p_oSubmenu.cfg.applyConfig(oConfig);if(!this.lazyLoad){if(Dom.inDocument(this.element)){this.render();}
else{this.render(this.parent.element);}}},_onSubmenuBeforeShow:function(p_sType,p_aArgs,p_oSubmenu){var oParent=this.parent,aAlignment=oParent.parent.cfg.getProperty("submenualignment");this.cfg.setProperty("context",[oParent.element,aAlignment[0],aAlignment[1]]);},_onSubmenuShow:function(p_sType,p_aArgs,p_oSubmenu){var oParent=this.parent;oParent.submenuIndicator.alt=oParent.EXPANDED_SUBMENU_INDICATOR_ALT_TEXT;},_onSubmenuHide:function(p_sType,p_aArgs,p_oSubmenu){var oParent=this.parent;oParent.submenuIndicator.alt=oParent.COLLAPSED_SUBMENU_INDICATOR_ALT_TEXT;},_onMenuItemFocus:function(p_sType,p_aArgs,p_oItem){this.activeItem=p_oItem;},_onMenuItemBlur:function(p_sType,p_aArgs){this.activeItem=null;},_onMenuItemConfigChange:function(p_sType,p_aArgs,p_oItem){var sProperty=p_aArgs[0][0];switch(sProperty){case"submenu":var oSubmenu=p_aArgs[0][1];if(oSubmenu){this._configureSubmenu(p_oItem);}
break;case"text":case"helptext":if(this.element.style.width){var sWidth=this._getOffsetWidth()+"px";Dom.setStyle(this.element,"width",sWidth);}
break;}},enforceConstraints:function(type,args,obj){var oConfig=this.cfg,pos=args[0],x=pos[0],y=pos[1],offsetHeight=this.element.offsetHeight,offsetWidth=this.element.offsetWidth,viewPortWidth=YAHOO.util.Dom.getViewportWidth(),viewPortHeight=YAHOO.util.Dom.getViewportHeight(),scrollX=Math.max(document.documentElement.scrollLeft,document.body.scrollLeft),scrollY=Math.max(document.documentElement.scrollTop,document.body.scrollTop),topConstraint=scrollY+10,leftConstraint=scrollX+10,bottomConstraint=scrollY+viewPortHeight-offsetHeight-10,rightConstraint=scrollX+viewPortWidth-offsetWidth-10,aContext=oConfig.getProperty("context"),oContextElement=aContext?aContext[0]:null;if(x<10){x=leftConstraint;}else if((x+offsetWidth)>viewPortWidth){if(oContextElement&&((x-oContextElement.offsetWidth)>offsetWidth)){x=(x-(oContextElement.offsetWidth+offsetWidth));}
else{x=rightConstraint;}}
if(y<10){y=topConstraint;}else if(y>bottomConstraint){if(oContextElement&&(y>offsetHeight)){y=((y+oContextElement.offsetHeight)-offsetHeight);}
else{y=bottomConstraint;}}
oConfig.setProperty("x",x,true);oConfig.setProperty("y",y,true);oConfig.setProperty("xy",[x,y],true);},configVisible:function(p_sType,p_aArgs,p_oMenu){if(this.cfg.getProperty("position")=="dynamic"){YAHOO.widget.Menu.superclass.configVisible.call(this,p_sType,p_aArgs,p_oMenu);}
else{var bVisible=p_aArgs[0],sDisplay=Dom.getStyle(this.element,"display");if(bVisible){if(sDisplay!="block"){this.beforeShowEvent.fire();Dom.setStyle(this.element,"display","block");this.showEvent.fire();}}
else{if(sDisplay=="block"){this.beforeHideEvent.fire();Dom.setStyle(this.element,"display","none");this.hideEvent.fire();}}}},configPosition:function(p_sType,p_aArgs,p_oMenu){var sCSSPosition=p_aArgs[0]=="static"?"static":"absolute",oCfg=this.cfg;Dom.setStyle(this.element,"position",sCSSPosition);if(sCSSPosition=="static"){oCfg.setProperty("iframe",false);Dom.setStyle(this.element,"display","block");oCfg.setProperty("visible",true);}
else{Dom.setStyle(this.element,"visibility","hidden");}
if(sCSSPosition=="absolute"){var nZIndex=oCfg.getProperty("zindex");if(!nZIndex||nZIndex===0){nZIndex=this.parent?(this.parent.parent.cfg.getProperty("zindex")+1):1;oCfg.setProperty("zindex",nZIndex);}}},configIframe:function(p_sType,p_aArgs,p_oMenu){if(this.cfg.getProperty("position")=="dynamic"){YAHOO.widget.Menu.superclass.configIframe.call(this,p_sType,p_aArgs,p_oMenu);}},configHideDelay:function(p_sType,p_aArgs,p_oMenu){var nHideDelay=p_aArgs[0],oMouseOutEvent=this.mouseOutEvent,oMouseOverEvent=this.mouseOverEvent,oKeyDownEvent=this.keyDownEvent;if(nHideDelay>0){if(!this._hideDelayEventHandlersAssigned){oMouseOutEvent.subscribe(this._execHideDelay,true);oMouseOverEvent.subscribe(this._cancelHideDelay,this,true);oKeyDownEvent.subscribe(this._cancelHideDelay,this,true);this._hideDelayEventHandlersAssigned=true;}}
else{oMouseOutEvent.unsubscribe(this._execHideDelay,this);oMouseOverEvent.unsubscribe(this._cancelHideDelay,this);oKeyDownEvent.unsubscribe(this._cancelHideDelay,this);this._hideDelayEventHandlersAssigned=false;}},configContainer:function(p_sType,p_aArgs,p_oMenu){var oElement=p_aArgs[0];if(typeof oElement=='string'){this.cfg.setProperty("container",document.getElementById(oElement),true);}},initEvents:function(){YAHOO.widget.Menu.superclass.initEvents.call(this);var CustomEvent=YAHOO.util.CustomEvent;this.mouseOverEvent=new CustomEvent("mouseOverEvent",this);this.mouseOutEvent=new CustomEvent("mouseOutEvent",this);this.mouseDownEvent=new CustomEvent("mouseDownEvent",this);this.mouseUpEvent=new CustomEvent("mouseUpEvent",this);this.clickEvent=new CustomEvent("clickEvent",this);this.keyPressEvent=new CustomEvent("keyPressEvent",this);this.keyDownEvent=new CustomEvent("keyDownEvent",this);this.keyUpEvent=new CustomEvent("keyUpEvent",this);this.itemAddedEvent=new CustomEvent("itemAddedEvent",this);this.itemRemovedEvent=new CustomEvent("itemRemovedEvent",this);},getRoot:function(){var oItem=this.parent;if(oItem){var oParentMenu=oItem.parent;return oParentMenu?oParentMenu.getRoot():this;}
else{return this;}},toString:function(){return("Menu "+this.id);},setItemGroupTitle:function(p_sGroupTitle,p_nGroupIndex){if(typeof p_sGroupTitle=="string"&&p_sGroupTitle.length>0){var nGroupIndex=typeof p_nGroupIndex=="number"?p_nGroupIndex:0,oTitle=this._aGroupTitleElements[nGroupIndex];if(oTitle){oTitle.innerHTML=p_sGroupTitle;}
else{oTitle=document.createElement(this.GROUP_TITLE_TAG_NAME);oTitle.innerHTML=p_sGroupTitle;this._aGroupTitleElements[nGroupIndex]=oTitle;}
var i=this._aGroupTitleElements.length-1,nFirstIndex;do{if(this._aGroupTitleElements[i]){Dom.removeClass(this._aGroupTitleElements[i],"first-of-type");nFirstIndex=i;}}
while(i--);if(nFirstIndex!==null){Dom.addClass(this._aGroupTitleElements[nFirstIndex],"first-of-type");}}},addItem:function(p_oItem,p_nGroupIndex){if(p_oItem){return this._addItemToGroup(p_nGroupIndex,p_oItem);}},addItems:function(p_aItems,p_nGroupIndex){function isArray(p_oValue){return(typeof p_oValue=="object"&&p_oValue.constructor==Array);}
if(isArray(p_aItems)){var nItems=p_aItems.length,aItems=[],oItem;for(var i=0;i<nItems;i++){oItem=p_aItems[i];if(isArray(oItem)){aItems[aItems.length]=this.addItems(oItem,i);}
else{aItems[aItems.length]=this._addItemToGroup(p_nGroupIndex,oItem);}}
if(aItems.length){return aItems;}}},insertItem:function(p_oItem,p_nItemIndex,p_nGroupIndex){if(p_oItem){return this._addItemToGroup(p_nGroupIndex,p_oItem,p_nItemIndex);}},removeItem:function(p_oObject,p_nGroupIndex){if(typeof p_oObject!="undefined"){var oItem;if(p_oObject instanceof YAHOO.widget.MenuItem){oItem=this._removeItemFromGroupByValue(p_nGroupIndex,p_oObject);}
else if(typeof p_oObject=="number"){oItem=this._removeItemFromGroupByIndex(p_nGroupIndex,p_oObject);}
if(oItem){oItem.destroy();return oItem;}}},getItemGroups:function(){return this._aItemGroups;},getItem:function(p_nItemIndex,p_nGroupIndex){if(typeof p_nItemIndex=="number"){var aGroup=this._getItemGroup(p_nGroupIndex);if(aGroup){return aGroup[p_nItemIndex];}}},destroy:function(){this.mouseOverEvent.unsubscribeAll();this.mouseOutEvent.unsubscribeAll();this.mouseDownEvent.unsubscribeAll();this.mouseUpEvent.unsubscribeAll();this.clickEvent.unsubscribeAll();this.keyPressEvent.unsubscribeAll();this.keyDownEvent.unsubscribeAll();this.keyUpEvent.unsubscribeAll();this.itemAddedEvent.unsubscribeAll();this.itemRemovedEvent.unsubscribeAll();var nItemGroups=this._aItemGroups.length,nItems,oItemGroup,oItem,i,n;if(nItemGroups>0){i=nItemGroups-1;do{oItemGroup=this._aItemGroups[i];if(oItemGroup){nItems=oItemGroup.length;if(nItems>0){n=nItems-1;do{oItem=this._aItemGroups[i][n];if(oItem){oItem.destroy();}}
while(n--);}}}
while(i--);}
YAHOO.widget.Menu.superclass.destroy.call(this);},setInitialFocus:function(){var oItem=this._getFirstEnabledItem();if(oItem){oItem.focus();}},setInitialSelection:function(){var oItem=this._getFirstEnabledItem();if(oItem){oItem.cfg.setProperty("selected",true);}},clearActiveItem:function(p_bBlur){if(this.cfg.getProperty("showdelay")>0){this._cancelShowDelay();}
var oActiveItem=this.activeItem;if(oActiveItem){var oConfig=oActiveItem.cfg;oConfig.setProperty("selected",false);var oSubmenu=oConfig.getProperty("submenu");if(oSubmenu){oSubmenu.hide();}
if(p_bBlur){oActiveItem.blur();}}},initDefaultConfig:function(){YAHOO.widget.Menu.superclass.initDefaultConfig.call(this);var oConfig=this.cfg;oConfig.addProperty("visible",{value:false,handler:this.configVisible,validator:this.cfg.checkBoolean});oConfig.addProperty("constraintoviewport",{value:true,handler:this.configConstrainToViewport,validator:this.cfg.checkBoolean,supercedes:["iframe","x","y","xy"]});oConfig.addProperty("position",{value:"dynamic",handler:this.configPosition,validator:this._checkPosition,supercedes:["visible"]});oConfig.addProperty("submenualignment",{value:["tl","tr"]});oConfig.addProperty("autosubmenudisplay",{value:true,validator:oConfig.checkBoolean});oConfig.addProperty("showdelay",{value:0,validator:oConfig.checkNumber});oConfig.addProperty("hidedelay",{value:0,validator:oConfig.checkNumber,handler:this.configHideDelay,suppressEvent:true});oConfig.addProperty("clicktohide",{value:true,validator:oConfig.checkBoolean});this.cfg.addProperty("container",{value:document.body,handler:this.configContainer});}});})();YAHOO.widget.MenuModule=YAHOO.widget.Menu;(function(){var Dom=YAHOO.util.Dom,Module=YAHOO.widget.Module,Menu=YAHOO.widget.Menu;YAHOO.widget.MenuItem=function(p_oObject,p_oConfig){if(p_oObject){if(p_oConfig){this.parent=p_oConfig.parent;this.value=p_oConfig.value;}
this.init(p_oObject,p_oConfig);}};YAHOO.widget.MenuItem.prototype={SUBMENU_INDICATOR_IMAGE_PATH:"nt/ic/ut/alt1/menuarorght8_nrm_1.gif",SELECTED_SUBMENU_INDICATOR_IMAGE_PATH:"nt/ic/ut/alt1/menuarorght8_hov_1.gif",DISABLED_SUBMENU_INDICATOR_IMAGE_PATH:"nt/ic/ut/alt1/menuarorght8_dim_1.gif",COLLAPSED_SUBMENU_INDICATOR_ALT_TEXT:"Collapsed.  Click to expand.",EXPANDED_SUBMENU_INDICATOR_ALT_TEXT:"Expanded.  Click to collapse.",DISABLED_SUBMENU_INDICATOR_ALT_TEXT:"Disabled.",CHECKED_IMAGE_PATH:"nt/ic/ut/bsc/menuchk8_nrm_1.gif",SELECTED_CHECKED_IMAGE_PATH:"nt/ic/ut/bsc/menuchk8_hov_1.gif",DISABLED_CHECKED_IMAGE_PATH:"nt/ic/ut/bsc/menuchk8_dim_1.gif",CHECKED_IMAGE_ALT_TEXT:"Checked.",DISABLED_CHECKED_IMAGE_ALT_TEXT:"Checked. (Item disabled.)",CSS_CLASS_NAME:"yuimenuitem",SUBMENU_TYPE:null,IMG_ROOT:"http://us.i1.yimg.com/us.yimg.com/i/",IMG_ROOT_SSL:"https://a248.e.akamai.net/sec.yimg.com/i/",_oAnchor:null,_oText:null,_oHelpTextEM:null,_oSubmenu:null,_checkImage:null,constructor:YAHOO.widget.MenuItem,imageRoot:null,isSecure:Module.prototype.isSecure,index:null,groupIndex:null,parent:null,element:null,srcElement:null,value:null,submenuIndicator:null,browser:Module.prototype.browser,destroyEvent:null,mouseOverEvent:null,mouseOutEvent:null,mouseDownEvent:null,mouseUpEvent:null,clickEvent:null,keyPressEvent:null,keyDownEvent:null,keyUpEvent:null,focusEvent:null,blurEvent:null,init:function(p_oObject,p_oConfig){this.imageRoot=(this.isSecure)?this.IMG_ROOT_SSL:this.IMG_ROOT;if(!this.SUBMENU_TYPE){this.SUBMENU_TYPE=Menu;}
this.cfg=new YAHOO.util.Config(this);this.initDefaultConfig();var oConfig=this.cfg;if(this._checkString(p_oObject)){this._createRootNodeStructure();oConfig.setProperty("text",p_oObject);}
else if(this._checkDOMNode(p_oObject)){switch(p_oObject.tagName.toUpperCase()){case"OPTION":this._createRootNodeStructure();oConfig.setProperty("text",p_oObject.text);this.srcElement=p_oObject;break;case"OPTGROUP":this._createRootNodeStructure();oConfig.setProperty("text",p_oObject.label);this.srcElement=p_oObject;this._initSubTree();break;case"LI":var oAnchor=this._getFirstElement(p_oObject,"A"),sURL="#",sTarget,sText;if(oAnchor){sURL=oAnchor.getAttribute("href");sTarget=oAnchor.getAttribute("target");if(oAnchor.innerText){sText=oAnchor.innerText;}
else{var oRange=oAnchor.ownerDocument.createRange();oRange.selectNodeContents(oAnchor);sText=oRange.toString();}}
else{var oText=p_oObject.firstChild;sText=oText.nodeValue;oAnchor=document.createElement("a");oAnchor.setAttribute("href",sURL);p_oObject.replaceChild(oAnchor,oText);oAnchor.appendChild(oText);}
this.srcElement=p_oObject;this.element=p_oObject;this._oAnchor=oAnchor;var oEmphasisNode=this._getFirstElement(oAnchor),bEmphasis=false,bStrongEmphasis=false;if(oEmphasisNode){this._oText=oEmphasisNode.firstChild;switch(oEmphasisNode.tagName.toUpperCase()){case"EM":bEmphasis=true;break;case"STRONG":bStrongEmphasis=true;break;}}
else{this._oText=oAnchor.firstChild;}
oConfig.setProperty("text",sText,true);oConfig.setProperty("url",sURL,true);oConfig.setProperty("target",sTarget,true);oConfig.setProperty("emphasis",bEmphasis,true);oConfig.setProperty("strongemphasis",bStrongEmphasis,true);this._initSubTree();break;}}
if(this.element){Dom.addClass(this.element,this.CSS_CLASS_NAME);var CustomEvent=YAHOO.util.CustomEvent;this.destroyEvent=new CustomEvent("destroyEvent",this);this.mouseOverEvent=new CustomEvent("mouseOverEvent",this);this.mouseOutEvent=new CustomEvent("mouseOutEvent",this);this.mouseDownEvent=new CustomEvent("mouseDownEvent",this);this.mouseUpEvent=new CustomEvent("mouseUpEvent",this);this.clickEvent=new CustomEvent("clickEvent",this);this.keyPressEvent=new CustomEvent("keyPressEvent",this);this.keyDownEvent=new CustomEvent("keyDownEvent",this);this.keyUpEvent=new CustomEvent("keyUpEvent",this);this.focusEvent=new CustomEvent("focusEvent",this);this.blurEvent=new CustomEvent("blurEvent",this);if(p_oConfig){oConfig.applyConfig(p_oConfig);}
oConfig.fireQueue();}},_getFirstElement:function(p_oElement,p_sTagName){var oElement;if(p_oElement.firstChild&&p_oElement.firstChild.nodeType==1){oElement=p_oElement.firstChild;}
else if(p_oElement.firstChild&&p_oElement.firstChild.nextSibling&&p_oElement.firstChild.nextSibling.nodeType==1){oElement=p_oElement.firstChild.nextSibling;}
if(p_sTagName){return(oElement&&oElement.tagName.toUpperCase()==p_sTagName)?oElement:false;}
return oElement;},_checkString:function(p_oObject){return(typeof p_oObject=="string");},_checkDOMNode:function(p_oObject){return(p_oObject&&p_oObject.tagName);},_createRootNodeStructure:function(){this.element=document.createElement("li");this._oText=document.createTextNode("");this._oAnchor=document.createElement("a");this._oAnchor.appendChild(this._oText);this.cfg.refireEvent("url");this.element.appendChild(this._oAnchor);},_initSubTree:function(){var oSrcEl=this.srcElement,oConfig=this.cfg;if(oSrcEl.childNodes.length>0){if(this.parent.lazyLoad&&this.parent.srcElement&&this.parent.srcElement.tagName.toUpperCase()=="SELECT"){oConfig.setProperty("submenu",{id:Dom.generateId(),itemdata:oSrcEl.childNodes});}
else{var oNode=oSrcEl.firstChild,aOptions=[];do{if(oNode&&oNode.tagName){switch(oNode.tagName.toUpperCase()){case"DIV":oConfig.setProperty("submenu",oNode);break;case"OPTION":aOptions[aOptions.length]=oNode;break;}}}
while((oNode=oNode.nextSibling));var nOptions=aOptions.length;if(nOptions>0){var oMenu=new this.SUBMENU_TYPE(Dom.generateId());oConfig.setProperty("submenu",oMenu);for(var n=0;n<nOptions;n++){oMenu.addItem((new oMenu.ITEM_TYPE(aOptions[n])));}}}}},_preloadImage:function(p_sPath){var sPath=this.imageRoot+p_sPath;if(!document.images[sPath]){var oImage=document.createElement("img");oImage.src=sPath;oImage.name=sPath;oImage.id=sPath;oImage.style.display="none";document.body.appendChild(oImage);}},configText:function(p_sType,p_aArgs,p_oItem){var sText=p_aArgs[0];if(this._oText){this._oText.nodeValue=sText;}},configHelpText:function(p_sType,p_aArgs,p_oItem){var me=this,oHelpText=p_aArgs[0],oEl=this.element,oConfig=this.cfg,aNodes=[oEl,this._oAnchor],oImg=this.submenuIndicator;function initHelpText(){Dom.addClass(aNodes,"hashelptext");if(oConfig.getProperty("disabled")){oConfig.refireEvent("disabled");}
if(oConfig.getProperty("selected")){oConfig.refireEvent("selected");}}
function removeHelpText(){Dom.removeClass(aNodes,"hashelptext");oEl.removeChild(me._oHelpTextEM);me._oHelpTextEM=null;}
if(this._checkDOMNode(oHelpText)){if(this._oHelpTextEM){this._oHelpTextEM.parentNode.replaceChild(oHelpText,this._oHelpTextEM);}
else{this._oHelpTextEM=oHelpText;oEl.insertBefore(this._oHelpTextEM,oImg);}
initHelpText();}
else if(this._checkString(oHelpText)){if(oHelpText.length===0){removeHelpText();}
else{if(!this._oHelpTextEM){this._oHelpTextEM=document.createElement("em");oEl.insertBefore(this._oHelpTextEM,oImg);}
this._oHelpTextEM.innerHTML=oHelpText;initHelpText();}}
else if(!oHelpText&&this._oHelpTextEM){removeHelpText();}},configURL:function(p_sType,p_aArgs,p_oItem){var sURL=p_aArgs[0];if(!sURL){sURL="#";}
this._oAnchor.setAttribute("href",sURL);},configTarget:function(p_sType,p_aArgs,p_oItem){var sTarget=p_aArgs[0],oAnchor=this._oAnchor;if(sTarget&&sTarget.length>0){oAnchor.setAttribute("target",sTarget);}
else{oAnchor.removeAttribute("target");}},configEmphasis:function(p_sType,p_aArgs,p_oItem){var bEmphasis=p_aArgs[0],oAnchor=this._oAnchor,oText=this._oText,oConfig=this.cfg,oEM;if(bEmphasis&&oConfig.getProperty("strongemphasis")){oConfig.setProperty("strongemphasis",false);}
if(oAnchor){if(bEmphasis){oEM=document.createElement("em");oEM.appendChild(oText);oAnchor.appendChild(oEM);}
else{oEM=this._getFirstElement(oAnchor,"EM");if(oEM){oAnchor.removeChild(oEM);oAnchor.appendChild(oText);}}}},configStrongEmphasis:function(p_sType,p_aArgs,p_oItem){var bStrongEmphasis=p_aArgs[0],oAnchor=this._oAnchor,oText=this._oText,oConfig=this.cfg,oStrong;if(bStrongEmphasis&&oConfig.getProperty("emphasis")){oConfig.setProperty("emphasis",false);}
if(oAnchor){if(bStrongEmphasis){oStrong=document.createElement("strong");oStrong.appendChild(oText);oAnchor.appendChild(oStrong);}
else{oStrong=this._getFirstElement(oAnchor,"STRONG");if(oStrong){oAnchor.removeChild(oStrong);oAnchor.appendChild(oText);}}}},configChecked:function(p_sType,p_aArgs,p_oItem){var bChecked=p_aArgs[0],oEl=this.element,oConfig=this.cfg,oImg;if(bChecked){this._preloadImage(this.CHECKED_IMAGE_PATH);this._preloadImage(this.SELECTED_CHECKED_IMAGE_PATH);this._preloadImage(this.DISABLED_CHECKED_IMAGE_PATH);oImg=document.createElement("img");oImg.src=(this.imageRoot+this.CHECKED_IMAGE_PATH);oImg.alt=this.CHECKED_IMAGE_ALT_TEXT;var oSubmenu=this.cfg.getProperty("submenu");if(oSubmenu){oEl.insertBefore(oImg,oSubmenu.element);}
else{oEl.appendChild(oImg);}
Dom.addClass([oEl,oImg],"checked");this._checkImage=oImg;if(oConfig.getProperty("disabled")){oConfig.refireEvent("disabled");}
if(oConfig.getProperty("selected")){oConfig.refireEvent("selected");}}
else{oImg=this._checkImage;Dom.removeClass([oEl,oImg],"checked");if(oImg){oEl.removeChild(oImg);}
this._checkImage=null;}},configDisabled:function(p_sType,p_aArgs,p_oItem){var bDisabled=p_aArgs[0],oAnchor=this._oAnchor,aNodes=[this.element,oAnchor],oEM=this._oHelpTextEM,oConfig=this.cfg,oImg,sImgSrc,sImgAlt;if(oEM){aNodes[2]=oEM;}
if(this.cfg.getProperty("checked")){sImgAlt=this.CHECKED_IMAGE_ALT_TEXT;sImgSrc=this.CHECKED_IMAGE_PATH;oImg=this._checkImage;if(bDisabled){sImgAlt=this.DISABLED_CHECKED_IMAGE_ALT_TEXT;sImgSrc=this.DISABLED_CHECKED_IMAGE_PATH;}
oImg.src=document.images[(this.imageRoot+sImgSrc)].src;oImg.alt=sImgAlt;}
oImg=this.submenuIndicator;if(bDisabled){if(oConfig.getProperty("selected")){oConfig.setProperty("selected",false);}
oAnchor.removeAttribute("href");Dom.addClass(aNodes,"disabled");sImgSrc=this.DISABLED_SUBMENU_INDICATOR_IMAGE_PATH;sImgAlt=this.DISABLED_SUBMENU_INDICATOR_ALT_TEXT;}
else{oAnchor.setAttribute("href",oConfig.getProperty("url"));Dom.removeClass(aNodes,"disabled");sImgSrc=this.SUBMENU_INDICATOR_IMAGE_PATH;sImgAlt=this.COLLAPSED_SUBMENU_INDICATOR_ALT_TEXT;}
if(oImg){oImg.src=this.imageRoot+sImgSrc;oImg.alt=sImgAlt;}},configSelected:function(p_sType,p_aArgs,p_oItem){if(!this.cfg.getProperty("disabled")){var bSelected=p_aArgs[0],oEM=this._oHelpTextEM,aNodes=[this.element,this._oAnchor],oImg=this.submenuIndicator,sImgSrc;if(oEM){aNodes[aNodes.length]=oEM;}
if(oImg){aNodes[aNodes.length]=oImg;}
if(this.cfg.getProperty("checked")){sImgSrc=this.imageRoot+(bSelected?this.SELECTED_CHECKED_IMAGE_PATH:this.CHECKED_IMAGE_PATH);this._checkImage.src=document.images[sImgSrc].src;}
if(bSelected){Dom.addClass(aNodes,"selected");sImgSrc=this.SELECTED_SUBMENU_INDICATOR_IMAGE_PATH;}
else{Dom.removeClass(aNodes,"selected");sImgSrc=this.SUBMENU_INDICATOR_IMAGE_PATH;}
if(oImg){oImg.src=document.images[(this.imageRoot+sImgSrc)].src;}}},configSubmenu:function(p_sType,p_aArgs,p_oItem){var oEl=this.element,oSubmenu=p_aArgs[0],oImg=this.submenuIndicator,oConfig=this.cfg,aNodes=[this.element,this._oAnchor],oMenu,bLazyLoad=this.parent&&this.parent.lazyLoad;if(oSubmenu){if(oSubmenu instanceof Menu){oMenu=oSubmenu;oMenu.parent=this;oMenu.lazyLoad=bLazyLoad;}
else if(typeof oSubmenu=="object"&&oSubmenu.id&&!oSubmenu.nodeType){var sSubmenuId=oSubmenu.id,oSubmenuConfig=oSubmenu;oSubmenuConfig.lazyload=bLazyLoad;oSubmenuConfig.parent=this;oMenu=new this.SUBMENU_TYPE(sSubmenuId,oSubmenuConfig);this.cfg.setProperty("submenu",oMenu,true);}
else{oMenu=new this.SUBMENU_TYPE(oSubmenu,{lazyload:bLazyLoad,parent:this});this.cfg.setProperty("submenu",oMenu,true);}
if(oMenu){this._oSubmenu=oMenu;if(!oImg){this._preloadImage(this.SUBMENU_INDICATOR_IMAGE_PATH);this._preloadImage(this.SELECTED_SUBMENU_INDICATOR_IMAGE_PATH);this._preloadImage(this.DISABLED_SUBMENU_INDICATOR_IMAGE_PATH);oImg=document.createElement("img");oImg.src=(this.imageRoot+this.SUBMENU_INDICATOR_IMAGE_PATH);oImg.alt=this.COLLAPSED_SUBMENU_INDICATOR_ALT_TEXT;oEl.appendChild(oImg);this.submenuIndicator=oImg;Dom.addClass(aNodes,"hassubmenu");if(oConfig.getProperty("disabled")){oConfig.refireEvent("disabled");}
if(oConfig.getProperty("selected")){oConfig.refireEvent("selected");}}}}
else{Dom.removeClass(aNodes,"hassubmenu");if(oImg){oEl.removeChild(oImg);}
if(this._oSubmenu){this._oSubmenu.destroy();}}},initDefaultConfig:function(){var oConfig=this.cfg,CheckBoolean=oConfig.checkBoolean;oConfig.addProperty("text",{value:"",handler:this.configText,validator:this._checkString,suppressEvent:true});oConfig.addProperty("helptext",{handler:this.configHelpText});oConfig.addProperty("url",{value:"#",handler:this.configURL,suppressEvent:true});oConfig.addProperty("target",{handler:this.configTarget,suppressEvent:true});oConfig.addProperty("emphasis",{value:false,handler:this.configEmphasis,validator:CheckBoolean,suppressEvent:true});oConfig.addProperty("strongemphasis",{value:false,handler:this.configStrongEmphasis,validator:CheckBoolean,suppressEvent:true});oConfig.addProperty("checked",{value:false,handler:this.configChecked,validator:this.cfg.checkBoolean,suppressEvent:true,supercedes:["disabled"]});oConfig.addProperty("disabled",{value:false,handler:this.configDisabled,validator:CheckBoolean,suppressEvent:true});oConfig.addProperty("selected",{value:false,handler:this.configSelected,validator:CheckBoolean,suppressEvent:true});oConfig.addProperty("submenu",{handler:this.configSubmenu});},getNextEnabledSibling:function(){if(this.parent instanceof Menu){var nGroupIndex=this.groupIndex;function getNextArrayItem(p_aArray,p_nStartIndex){return p_aArray[p_nStartIndex]||getNextArrayItem(p_aArray,(p_nStartIndex+1));}
var aItemGroups=this.parent.getItemGroups(),oNextItem;if(this.index<(aItemGroups[nGroupIndex].length-1)){oNextItem=getNextArrayItem(aItemGroups[nGroupIndex],(this.index+1));}
else{var nNextGroupIndex;if(nGroupIndex<(aItemGroups.length-1)){nNextGroupIndex=nGroupIndex+1;}
else{nNextGroupIndex=0;}
var aNextGroup=getNextArrayItem(aItemGroups,nNextGroupIndex);oNextItem=getNextArrayItem(aNextGroup,0);}
return(oNextItem.cfg.getProperty("disabled")||oNextItem.element.style.display=="none")?oNextItem.getNextEnabledSibling():oNextItem;}},getPreviousEnabledSibling:function(){if(this.parent instanceof Menu){var nGroupIndex=this.groupIndex;function getPreviousArrayItem(p_aArray,p_nStartIndex){return p_aArray[p_nStartIndex]||getPreviousArrayItem(p_aArray,(p_nStartIndex-1));}
function getFirstItemIndex(p_aArray,p_nStartIndex){return p_aArray[p_nStartIndex]?p_nStartIndex:getFirstItemIndex(p_aArray,(p_nStartIndex+1));}
var aItemGroups=this.parent.getItemGroups(),oPreviousItem;if(this.index>getFirstItemIndex(aItemGroups[nGroupIndex],0)){oPreviousItem=getPreviousArrayItem(aItemGroups[nGroupIndex],(this.index-1));}
else{var nPreviousGroupIndex;if(nGroupIndex>getFirstItemIndex(aItemGroups,0)){nPreviousGroupIndex=nGroupIndex-1;}
else{nPreviousGroupIndex=aItemGroups.length-1;}
var aPreviousGroup=getPreviousArrayItem(aItemGroups,nPreviousGroupIndex);oPreviousItem=getPreviousArrayItem(aPreviousGroup,(aPreviousGroup.length-1));}
return(oPreviousItem.cfg.getProperty("disabled")||oPreviousItem.element.style.display=="none")?oPreviousItem.getPreviousEnabledSibling():oPreviousItem;}},focus:function(){var oParent=this.parent,oAnchor=this._oAnchor,oActiveItem=oParent.activeItem;function setFocus(){try{oAnchor.focus();}
catch(e){}}
if(!this.cfg.getProperty("disabled")&&oParent&&oParent.cfg.getProperty("visible")&&this.element.style.display!="none"){if(oActiveItem){oActiveItem.blur();}
window.setTimeout(setFocus,0);this.focusEvent.fire();}},blur:function(){var oParent=this.parent;if(!this.cfg.getProperty("disabled")&&oParent&&Dom.getStyle(oParent.element,"visibility")=="visible"){this._oAnchor.blur();this.blurEvent.fire();}},destroy:function(){var oEl=this.element;if(oEl){var oSubmenu=this.cfg.getProperty("submenu");if(oSubmenu){oSubmenu.destroy();}
this.mouseOverEvent.unsubscribeAll();this.mouseOutEvent.unsubscribeAll();this.mouseDownEvent.unsubscribeAll();this.mouseUpEvent.unsubscribeAll();this.clickEvent.unsubscribeAll();this.keyPressEvent.unsubscribeAll();this.keyDownEvent.unsubscribeAll();this.keyUpEvent.unsubscribeAll();this.focusEvent.unsubscribeAll();this.blurEvent.unsubscribeAll();this.cfg.configChangedEvent.unsubscribeAll();var oParentNode=oEl.parentNode;if(oParentNode){oParentNode.removeChild(oEl);this.destroyEvent.fire();}
this.destroyEvent.unsubscribeAll();}},toString:function(){return("MenuItem: "+this.cfg.getProperty("text"));}};})();YAHOO.widget.MenuModuleItem=YAHOO.widget.MenuItem;YAHOO.widget.ContextMenu=function(p_oElement,p_oConfig){YAHOO.widget.ContextMenu.superclass.constructor.call(this,p_oElement,p_oConfig);};YAHOO.extend(YAHOO.widget.ContextMenu,YAHOO.widget.Menu,{_oTrigger:null,contextEventTarget:null,init:function(p_oElement,p_oConfig){if(!this.ITEM_TYPE){this.ITEM_TYPE=YAHOO.widget.ContextMenuItem;}
YAHOO.widget.ContextMenu.superclass.init.call(this,p_oElement);this.beforeInitEvent.fire(YAHOO.widget.ContextMenu);if(p_oConfig){this.cfg.applyConfig(p_oConfig,true);}
this.initEvent.fire(YAHOO.widget.ContextMenu);},_removeEventHandlers:function(){var Event=YAHOO.util.Event,oTrigger=this._oTrigger,bOpera=(this.browser=="opera");Event.removeListener(oTrigger,(bOpera?"mousedown":"contextmenu"),this._onTriggerContextMenu);if(bOpera){Event.removeListener(oTrigger,"click",this._onTriggerClick);}},_onTriggerClick:function(p_oEvent,p_oMenu){if(p_oEvent.ctrlKey){YAHOO.util.Event.stopEvent(p_oEvent);}},_onTriggerContextMenu:function(p_oEvent,p_oMenu){YAHOO.widget.MenuManager.hideVisible();var Event=YAHOO.util.Event,oConfig=this.cfg;if(p_oEvent.type=="mousedown"&&!p_oEvent.ctrlKey){return;}
this.contextEventTarget=Event.getTarget(p_oEvent);var nX=Event.getPageX(p_oEvent),nY=Event.getPageY(p_oEvent);oConfig.applyConfig({xy:[nX,nY],visible:true});oConfig.fireQueue();Event.stopEvent(p_oEvent);},toString:function(){return("ContextMenu "+this.id);},initDefaultConfig:function(){YAHOO.widget.ContextMenu.superclass.initDefaultConfig.call(this);this.cfg.addProperty("trigger",{handler:this.configTrigger});},destroy:function(){this._removeEventHandlers();YAHOO.widget.ContextMenu.superclass.destroy.call(this);},configTrigger:function(p_sType,p_aArgs,p_oMenu){var Event=YAHOO.util.Event,oTrigger=p_aArgs[0];if(oTrigger){if(this._oTrigger){this._removeEventHandlers();}
this._oTrigger=oTrigger;var bOpera=(this.browser=="opera");Event.addListener(oTrigger,(bOpera?"mousedown":"contextmenu"),this._onTriggerContextMenu,this,true);if(bOpera){Event.addListener(oTrigger,"click",this._onTriggerClick,this,true);}}
else{this._removeEventHandlers();}}});YAHOO.widget.ContextMenuItem=function(p_oObject,p_oConfig){YAHOO.widget.ContextMenuItem.superclass.constructor.call(this,p_oObject,p_oConfig);};YAHOO.extend(YAHOO.widget.ContextMenuItem,YAHOO.widget.MenuItem,{init:function(p_oObject,p_oConfig){if(!this.SUBMENU_TYPE){this.SUBMENU_TYPE=YAHOO.widget.ContextMenu;}
YAHOO.widget.ContextMenuItem.superclass.init.call(this,p_oObject);var oConfig=this.cfg;if(p_oConfig){oConfig.applyConfig(p_oConfig,true);}
oConfig.fireQueue();},toString:function(){return("MenuBarItem: "+this.cfg.getProperty("text"));}});YAHOO.widget.MenuBar=function(p_oElement,p_oConfig){YAHOO.widget.MenuBar.superclass.constructor.call(this,p_oElement,p_oConfig);};YAHOO.extend(YAHOO.widget.MenuBar,YAHOO.widget.Menu,{init:function(p_oElement,p_oConfig){if(!this.ITEM_TYPE){this.ITEM_TYPE=YAHOO.widget.MenuBarItem;}
YAHOO.widget.MenuBar.superclass.init.call(this,p_oElement);this.beforeInitEvent.fire(YAHOO.widget.MenuBar);if(p_oConfig){this.cfg.applyConfig(p_oConfig,true);}
this.initEvent.fire(YAHOO.widget.MenuBar);},CSS_CLASS_NAME:"yuimenubar",_onKeyDown:function(p_sType,p_aArgs,p_oMenuBar){var Event=YAHOO.util.Event,oEvent=p_aArgs[0],oItem=p_aArgs[1],oSubmenu;if(oItem&&!oItem.cfg.getProperty("disabled")){var oItemCfg=oItem.cfg;switch(oEvent.keyCode){case 37:case 39:if(oItem==this.activeItem&&!oItemCfg.getProperty("selected")){oItemCfg.setProperty("selected",true);}
else{var oNextItem=(oEvent.keyCode==37)?oItem.getPreviousEnabledSibling():oItem.getNextEnabledSibling();if(oNextItem){this.clearActiveItem();oNextItem.cfg.setProperty("selected",true);if(this.cfg.getProperty("autosubmenudisplay")){oSubmenu=oNextItem.cfg.getProperty("submenu");if(oSubmenu){oSubmenu.show();oSubmenu.activeItem.blur();oSubmenu.activeItem=null;}}
oNextItem.focus();}}
Event.preventDefault(oEvent);break;case 40:if(this.activeItem!=oItem){this.clearActiveItem();oItemCfg.setProperty("selected",true);oItem.focus();}
oSubmenu=oItemCfg.getProperty("submenu");if(oSubmenu){if(oSubmenu.cfg.getProperty("visible")){oSubmenu.setInitialSelection();oSubmenu.setInitialFocus();}
else{oSubmenu.show();}}
Event.preventDefault(oEvent);break;}}
if(oEvent.keyCode==27&&this.activeItem){oSubmenu=this.activeItem.cfg.getProperty("submenu");if(oSubmenu&&oSubmenu.cfg.getProperty("visible")){oSubmenu.hide();this.activeItem.focus();}
else{this.activeItem.cfg.setProperty("selected",false);this.activeItem.blur();}
Event.preventDefault(oEvent);}},_onClick:function(p_sType,p_aArgs,p_oMenuBar){YAHOO.widget.MenuBar.superclass._onClick.call(this,p_sType,p_aArgs,p_oMenuBar);var oItem=p_aArgs[1];if(oItem&&!oItem.cfg.getProperty("disabled")){var Event=YAHOO.util.Event,Dom=YAHOO.util.Dom,oEvent=p_aArgs[0],oTarget=Event.getTarget(oEvent),oActiveItem=this.activeItem,oConfig=this.cfg;if(oActiveItem&&oActiveItem!=oItem){this.clearActiveItem();}
oItem.cfg.setProperty("selected",true);oItem.focus();var oSubmenu=oItem.cfg.getProperty("submenu");if(oSubmenu&&oTarget!=oItem.submenuIndicator){if(oSubmenu.cfg.getProperty("visible")){oSubmenu.hide();}
else{oSubmenu.show();}}}},toString:function(){return("MenuBar "+this.id);},initDefaultConfig:function(){YAHOO.widget.MenuBar.superclass.initDefaultConfig.call(this);var oConfig=this.cfg;oConfig.addProperty("position",{value:"static",handler:this.configPosition,validator:this._checkPosition,supercedes:["visible"]});oConfig.addProperty("submenualignment",{value:["tl","bl"]});oConfig.addProperty("autosubmenudisplay",{value:false,validator:oConfig.checkBoolean});}});YAHOO.widget.MenuBarItem=function(p_oObject,p_oConfig){YAHOO.widget.MenuBarItem.superclass.constructor.call(this,p_oObject,p_oConfig);};YAHOO.extend(YAHOO.widget.MenuBarItem,YAHOO.widget.MenuItem,{init:function(p_oObject,p_oConfig){if(!this.SUBMENU_TYPE){this.SUBMENU_TYPE=YAHOO.widget.Menu;}
YAHOO.widget.MenuBarItem.superclass.init.call(this,p_oObject);var oConfig=this.cfg;if(p_oConfig){oConfig.applyConfig(p_oConfig,true);}
oConfig.fireQueue();},CSS_CLASS_NAME:"yuimenubaritem",SUBMENU_INDICATOR_IMAGE_PATH:"nt/ic/ut/alt1/menuarodwn8_nrm_1.gif",SELECTED_SUBMENU_INDICATOR_IMAGE_PATH:"nt/ic/ut/alt1/menuarodwn8_hov_1.gif",DISABLED_SUBMENU_INDICATOR_IMAGE_PATH:"nt/ic/ut/alt1/menuarodwn8_dim_1.gif",toString:function(){return("MenuBarItem: "+this.cfg.getProperty("text"));}});
YAHOO.namespace('ext','ext.util','ext.grid');YAHOO.ext.Strict=(document.compatMode=='CSS1Compat');YAHOO.ext.SSL_SECURE_URL='javascript:false';window.undefined=undefined;Function.prototype.createCallback=function(){var args=arguments;var method=this;return function(){return method.apply(window,args);};};Function.prototype.createDelegate=function(obj,args,appendArgs){var method=this;return function(){var callArgs=args||arguments;if(appendArgs===true){callArgs=Array.prototype.slice.call(arguments,0);callArgs=callArgs.concat(args);}else if(typeof appendArgs=='number'){callArgs=Array.prototype.slice.call(arguments,0);var applyArgs=[appendArgs,0].concat(args);Array.prototype.splice.apply(callArgs,applyArgs);}
return method.apply(obj||window,callArgs);};};Function.prototype.defer=function(millis,obj,args,appendArgs){return setTimeout(this.createDelegate(obj,args,appendArgs),millis);};Function.prototype.createSequence=function(fcn,scope){if(typeof fcn!='function'){return this;}
var method=this;return function(){var retval=method.apply(this||window,arguments);fcn.apply(scope||this||window,arguments);return retval;};};YAHOO.util.Event.on(window,'unload',function(){delete Function.prototype.createSequence;delete Function.prototype.defer;delete Function.prototype.createDelegate;delete Function.prototype.createCallback;delete Function.prototype.createInterceptor;});Function.prototype.createInterceptor=function(fcn,scope){if(typeof fcn!='function'){return this;}
var method=this;return function(){fcn.target=this;fcn.method=method;if(fcn.apply(scope||this||window,arguments)===false){return;}
return method.apply(this||window,arguments);;};};YAHOO.ext.util.Browser=new function(){var ua=navigator.userAgent.toLowerCase();this.isOpera=(ua.indexOf('opera')>-1);this.isSafari=(ua.indexOf('webkit')>-1);this.isIE=(window.ActiveXObject);this.isIE7=(ua.indexOf('msie 7')>-1);this.isGecko=!this.isSafari&&(ua.indexOf('gecko')>-1);if(ua.indexOf("windows")!=-1||ua.indexOf("win32")!=-1){this.isWindows=true;}else if(ua.indexOf("macintosh")!=-1){this.isMac=true;}
if(this.isIE&&!this.isIE7){try{document.execCommand("BackgroundImageCache",false,true);}catch(e){}}}();YAHOO.print=function(arg1,arg2,etc){if(!YAHOO.ext._console){var cs=YAHOO.ext.DomHelper.insertBefore(document.body.firstChild,{tag:'div',style:'width:250px;height:350px;overflow:auto;border:3px solid #c3daf9;'+'background:white;position:absolute;right:5px;top:5px;'+'font:normal 8pt arial,verdana,helvetica;z-index:50000;padding:5px;'},true);new YAHOO.ext.Resizable(cs,{transparent:true,handles:'all',pinned:true,adjustments:[0,0],wrap:true,draggable:(YAHOO.util.DD?true:false)});cs.on('dblclick',cs.hide);YAHOO.ext._console=cs;}
var msg='';for(var i=0,len=arguments.length;i<len;i++){msg+=arguments[i]+'<hr noshade style="color:#eeeeee;" size="1">';}
YAHOO.ext._console.dom.innerHTML=msg+YAHOO.ext._console.dom.innerHTML;YAHOO.ext._console.dom.scrollTop=0;YAHOO.ext._console.show();};YAHOO.printf=function(format,arg1,arg2,etc){var args=Array.prototype.slice.call(arguments,1);YAHOO.print(format.replace(/\{\{[^{}]*\}\}|\{(\d+)(,\s*([\w.]+))?\}/g,function(m,a1,a2,a3){if(m.chatAt=='{'){return m.slice(1,-1);}
var rpl=args[a1];if(a3){var f=eval(a3);rpl=f(rpl);}
return rpl?rpl:'';}));}
YAHOO.util.CustomEvent.prototype.fireDirect=function(){var len=this.subscribers.length;for(var i=0;i<len;++i){var s=this.subscribers[i];if(s){var scope=(s.override)?s.obj:this.scope;if(s.fn.apply(scope,arguments)===false){return false;}}}
return true;};YAHOO.extendX=function(subclass,superclass,overrides){YAHOO.extend(subclass,superclass);subclass.override=function(o){YAHOO.override(subclass,o);};if(!subclass.prototype.override){subclass.prototype.override=function(o){for(var method in o){this[method]=o[method];}};}
if(overrides){subclass.override(overrides);}};YAHOO.override=function(origclass,overrides){if(overrides){var p=origclass.prototype;for(var method in overrides){p[method]=overrides[method];}}};YAHOO.ext.util.DelayedTask=function(fn,scope,args){var timeoutId=null;this.delay=function(delay,newFn,newScope,newArgs){if(timeoutId){clearTimeout(timeoutId);}
fn=newFn||fn;scope=newScope||scope;args=newArgs||args;timeoutId=setTimeout(fn.createDelegate(scope,args),delay);};this.cancel=function(){if(timeoutId){clearTimeout(timeoutId);timeoutId=null;}};};YAHOO.ext.KeyMap=function(el,config,eventName){this.el=getEl(el);this.eventName=eventName||'keydown';this.bindings=[];if(config instanceof Array){for(var i=0,len=config.length;i<len;i++){this.addBinding(config[i]);}}else{this.addBinding(config);}
this.keyDownDelegate=YAHOO.ext.EventManager.wrap(this.handleKeyDown,this,true);this.enable();}
YAHOO.ext.KeyMap.prototype={addBinding:function(config){var keyCode=config.key,shift=config.shift,ctrl=config.ctrl,alt=config.alt,fn=config.fn,scope=config.scope;if(typeof keyCode=='string'){var ks=[];var keyString=keyCode.toUpperCase();for(var j=0,len=keyString.length;j<len;j++){ks.push(keyString.charCodeAt(j));}
keyCode=ks;}
var keyArray=keyCode instanceof Array;var handler=function(e){if((!shift||e.shiftKey)&&(!ctrl||e.ctrlKey)&&(!alt||e.altKey)){var k=e.getKey();if(keyArray){for(var i=0,len=keyCode.length;i<len;i++){if(keyCode[i]==k){fn.call(scope||window,k,e);return;}}}else{if(k==keyCode){fn.call(scope||window,k,e);}}}};this.bindings.push(handler);},handleKeyDown:function(e){if(this.enabled){var b=this.bindings;for(var i=0,len=b.length;i<len;i++){b[i](e);}}},isEnabled:function(){return this.enabled;},enable:function(){if(!this.enabled){this.el.on(this.eventName,this.keyDownDelegate);this.enabled=true;}},disable:function(){if(this.enabled){this.el.removeListener(this.eventName,this.keyDownDelegate);this.enabled=false;}}};YAHOO.ext.util.Observable=function(){};YAHOO.ext.util.Observable.prototype={fireEvent:function(){var ce=this.events[arguments[0].toLowerCase()];if(typeof ce=='object'){return ce.fireDirect.apply(ce,Array.prototype.slice.call(arguments,1));}else{return true;}},addListener:function(eventName,fn,scope,override){eventName=eventName.toLowerCase();var ce=this.events[eventName];if(!ce){throw'You are trying to listen for an event that does not exist: "'+eventName+'".';}
if(typeof ce=='boolean'){ce=new YAHOO.util.CustomEvent(eventName);this.events[eventName]=ce;}
ce.subscribe(fn,scope,override);},delayedListener:function(eventName,fn,scope,delay){var newFn=function(){setTimeout(fn.createDelegate(scope,arguments),delay||1);}
this.addListener(eventName,newFn);return newFn;},bufferedListener:function(eventName,fn,scope,millis){var task=new YAHOO.ext.util.DelayedTask();var newFn=function(){task.delay(millis||250,fn,scope,Array.prototype.slice.call(arguments,0));}
this.addListener(eventName,newFn);return newFn;},removeListener:function(eventName,fn,scope){var ce=this.events[eventName.toLowerCase()];if(typeof ce=='object'){ce.unsubscribe(fn,scope);}},purgeListeners:function(){for(var evt in this.events){if(typeof this.events[evt]=='object'){this.events[evt].unsubscribeAll();}}}};YAHOO.ext.util.Observable.prototype.on=YAHOO.ext.util.Observable.prototype.addListener;YAHOO.ext.util.Config={apply:function(obj,config,defaults){if(defaults){this.apply(obj,defaults);}
if(config){for(var prop in config){obj[prop]=config[prop];}}
return obj;}};if(!String.escape){String.escape=function(string){return string.replace(/('|\\)/g,"\\$1");};};String.leftPad=function(val,size,ch){var result=new String(val);if(ch==null){ch=" ";}
while(result.length<size){result=ch+result;}
return result;};if(YAHOO.util.Connect){YAHOO.util.Connect.setHeader=function(o){for(var prop in this._http_header){if(typeof this._http_header[prop]!='function'){o.conn.setRequestHeader(prop,this._http_header[prop]);}}
delete this._http_header;this._http_header={};this._has_http_headers=false;};}
if(YAHOO.util.DragDrop){YAHOO.util.DragDrop.prototype.defaultPadding={left:0,right:0,top:0,bottom:0};YAHOO.util.DragDrop.prototype.constrainTo=function(constrainTo,pad,inContent){if(typeof pad=='number'){pad={left:pad,right:pad,top:pad,bottom:pad};}
pad=pad||this.defaultPadding;var b=getEl(this.getEl()).getBox();var ce=getEl(constrainTo);var c=ce.dom==document.body?{x:0,y:0,width:YAHOO.util.Dom.getViewportWidth(),height:YAHOO.util.Dom.getViewportHeight()}:ce.getBox(inContent||false);var topSpace=b.y-c.y;var leftSpace=b.x-c.x;this.resetConstraints();this.setXConstraint(leftSpace-(pad.left||0),c.width-leftSpace-b.width-(pad.right||0));this.setYConstraint(topSpace-(pad.top||0),c.height-topSpace-b.height-(pad.bottom||0));}}
YAHOO.ext.Element=function(element,forceNew){var dom=YAHOO.util.Dom.get(element);if(!dom){return null;}
if(!forceNew&&YAHOO.ext.Element.cache[dom.id]){return YAHOO.ext.Element.cache[dom.id];}
this.dom=dom;this.id=this.dom.id;this.visibilityMode=YAHOO.ext.Element.VISIBILITY;this.originalDisplay=YAHOO.util.Dom.getStyle(this.dom,'display')||'';if(this.autoDisplayMode){if(this.originalDisplay=='none'){this.setVisibilityMode(YAHOO.ext.Element.DISPLAY);}}
if(this.originalDisplay=='none'){this.originalDisplay='';}
this.defaultUnit='px';}
YAHOO.ext.Element.prototype={setVisibilityMode:function(visMode){this.visibilityMode=visMode;return this;},enableDisplayMode:function(display){this.setVisibilityMode(YAHOO.ext.Element.DISPLAY);if(typeof display!='undefined')this.originalDisplay=display;return this;},animate:function(args,duration,onComplete,easing,animType){this.anim(args,duration,onComplete,easing,animType);return this;},anim:function(args,duration,onComplete,easing,animType){animType=animType||YAHOO.util.Anim;var anim=new animType(this.dom,args,duration||.35,easing||YAHOO.util.Easing.easeBoth);if(onComplete){if(!(onComplete instanceof Array)){anim.onComplete.subscribe(onComplete,this,true);}else{for(var i=0;i<onComplete.length;i++){var fn=onComplete[i];if(fn)anim.onComplete.subscribe(fn,this,true);}}}
anim.animate();},scrollIntoView:function(container){var c=getEl(container||document.body,true);var cp=c.getStyle('position');var restorePos=false;if(cp!='relative'&&cp!='absolute'){c.setStyle('position','relative');restorePos=true;}
var el=this.dom;var childTop=parseInt(el.offsetTop,10);var childBottom=childTop+el.offsetHeight;var containerTop=parseInt(c.scrollTop,10);var containerBottom=containerTop+c.clientHeight;if(childTop<containerTop){c.scrollTop=childTop;}else if(childBottom>containerBottom){c.scrollTop=childBottom-c.clientHeight;}
if(restorePos){c.setStyle('position',cp);}
return this;},autoHeight:function(animate,duration,onComplete,easing){var oldHeight=this.getHeight();this.clip();this.setHeight(1);setTimeout(function(){var height=parseInt(this.dom.scrollHeight,10);if(!animate){this.setHeight(height);this.unclip();if(typeof onComplete=='function'){onComplete();}}else{this.setHeight(oldHeight);this.setHeight(height,animate,duration,function(){this.unclip();if(typeof onComplete=='function')onComplete();}.createDelegate(this),easing);}}.createDelegate(this),0);return this;},isVisible:function(deep){var vis=YAHOO.util.Dom.getStyle(this.dom,'visibility')!='hidden'&&YAHOO.util.Dom.getStyle(this.dom,'display')!='none';if(!deep||!vis){return vis;}
var p=this.dom.parentNode;while(p&&p.tagName.toLowerCase()!='body'){if(YAHOO.util.Dom.getStyle(p,'visibility')=='hidden'||YAHOO.util.Dom.getStyle(p,'display')=='none'){return false;}
p=p.parentNode;}
return true;},select:function(selector,unique){return YAHOO.ext.Element.select('#'+this.dom.id+' '+selector,unique);},initDD:function(group,config,overrides){var dd=new YAHOO.util.DD(YAHOO.util.Dom.generateId(this.dom),group,config);return YAHOO.ext.util.Config.apply(dd,overrides);},initDDProxy:function(group,config,overrides){var dd=new YAHOO.util.DDProxy(YAHOO.util.Dom.generateId(this.dom),group,config);return YAHOO.ext.util.Config.apply(dd,overrides);},initDDTarget:function(group,config,overrides){var dd=new YAHOO.util.DDTarget(YAHOO.util.Dom.generateId(this.dom),group,config);return YAHOO.ext.util.Config.apply(dd,overrides);},setVisible:function(visible,animate,duration,onComplete,easing){if(!animate||!YAHOO.util.Anim){if(this.visibilityMode==YAHOO.ext.Element.DISPLAY){this.setDisplayed(visible);}else{YAHOO.util.Dom.setStyle(this.dom,'visibility',visible?'visible':'hidden');}}else{this.setOpacity(visible?0:1);YAHOO.util.Dom.setStyle(this.dom,'visibility','visible');if(this.visibilityMode==YAHOO.ext.Element.DISPLAY){this.setDisplayed(true);}
var args={opacity:{from:(visible?0:1),to:(visible?1:0)}};var anim=new YAHOO.util.Anim(this.dom,args,duration||.35,easing||(visible?YAHOO.util.Easing.easeIn:YAHOO.util.Easing.easeOut));anim.onComplete.subscribe((function(){if(this.visibilityMode==YAHOO.ext.Element.DISPLAY){this.setDisplayed(visible);}else{YAHOO.util.Dom.setStyle(this.dom,'visibility',visible?'visible':'hidden');}}).createDelegate(this));if(onComplete){anim.onComplete.subscribe(onComplete);}
anim.animate();}
return this;},isDisplayed:function(){return YAHOO.util.Dom.getStyle(this.dom,'display')!='none';},toggle:function(animate,duration,onComplete,easing){this.setVisible(!this.isVisible(),animate,duration,onComplete,easing);return this;},setDisplayed:function(value){if(typeof value=='boolean'){value=value?this.originalDisplay:'none';}
YAHOO.util.Dom.setStyle(this.dom,'display',value);return this;},focus:function(){try{this.dom.focus();}catch(e){}
return this;},blur:function(){try{this.dom.blur();}catch(e){}
return this;},addClass:function(className){if(className instanceof Array){for(var i=0,len=className.length;i<len;i++){this.addClass(className[i]);}}else{if(!this.hasClass(className)){this.dom.className=this.dom.className+' '+className;}}
return this;},radioClass:function(className){var siblings=this.dom.parentNode.childNodes;for(var i=0;i<siblings.length;i++){var s=siblings[i];if(s.nodeType==1){YAHOO.util.Dom.removeClass(s,className);}}
this.addClass(className);return this;},removeClass:function(className){if(className instanceof Array){for(var i=0,len=className.length;i<len;i++){this.removeClass(className[i]);}}else{var re=new RegExp('(?:^|\\s+)'+className+'(?:\\s+|$)','g');var c=this.dom.className;if(re.test(c)){this.dom.className=c.replace(re,' ');}}
return this;},toggleClass:function(className){if(this.hasClass(className)){this.removeClass(className);}else{this.addClass(className);}
return this;},hasClass:function(className){var re=new RegExp('(?:^|\\s+)'+className+'(?:\\s+|$)');return re.test(this.dom.className);},replaceClass:function(oldClassName,newClassName){this.removeClass(oldClassName);this.addClass(newClassName);return this;},getStyle:function(name){return YAHOO.util.Dom.getStyle(this.dom,name);},setStyle:function(name,value){if(typeof name=='string'){YAHOO.util.Dom.setStyle(this.dom,name,value);}else{var D=YAHOO.util.Dom;for(var style in name){if(typeof name[style]!='function'){D.setStyle(this.dom,style,name[style]);}}}
return this;},applyStyles:function(style){YAHOO.ext.DomHelper.applyStyles(this.dom,style);},getX:function(){return YAHOO.util.Dom.getX(this.dom);},getY:function(){return YAHOO.util.Dom.getY(this.dom);},getXY:function(){return YAHOO.util.Dom.getXY(this.dom);},setX:function(x,animate,duration,onComplete,easing){if(!animate||!YAHOO.util.Anim){YAHOO.util.Dom.setX(this.dom,x);}else{this.setXY([x,this.getY()],animate,duration,onComplete,easing);}
return this;},setY:function(y,animate,duration,onComplete,easing){if(!animate||!YAHOO.util.Anim){YAHOO.util.Dom.setY(this.dom,y);}else{this.setXY([this.getX(),y],animate,duration,onComplete,easing);}
return this;},setLeft:function(left){YAHOO.util.Dom.setStyle(this.dom,'left',this.addUnits(left));return this;},setTop:function(top){YAHOO.util.Dom.setStyle(this.dom,'top',this.addUnits(top));return this;},setRight:function(right){YAHOO.util.Dom.setStyle(this.dom,'right',this.addUnits(right));return this;},setBottom:function(bottom){YAHOO.util.Dom.setStyle(this.dom,'bottom',this.addUnits(bottom));return this;},setXY:function(pos,animate,duration,onComplete,easing){if(!animate||!YAHOO.util.Anim){YAHOO.util.Dom.setXY(this.dom,pos);}else{this.anim({points:{to:pos}},duration,onComplete,easing,YAHOO.util.Motion);}
return this;},setLocation:function(x,y,animate,duration,onComplete,easing){this.setXY([x,y],animate,duration,onComplete,easing);return this;},moveTo:function(x,y,animate,duration,onComplete,easing){this.setXY([x,y],animate,duration,onComplete,easing);return this;},getRegion:function(){return YAHOO.util.Dom.getRegion(this.dom);},getHeight:function(contentHeight){var h=this.dom.offsetHeight;return contentHeight!==true?h:h-this.getBorderWidth('tb')-this.getPadding('tb');},getWidth:function(contentWidth){var w=this.dom.offsetWidth;return contentWidth!==true?w:w-this.getBorderWidth('lr')-this.getPadding('lr');},getSize:function(contentSize){return{width:this.getWidth(contentSize),height:this.getHeight(contentSize)};},adjustWidth:function(width){if(typeof width=='number'){if(this.autoBoxAdjust&&!this.isBorderBox()){width-=(this.getBorderWidth('lr')+this.getPadding('lr'));}
if(width<0){width=0;}}
return width;},adjustHeight:function(height){if(typeof height=='number'){if(this.autoBoxAdjust&&!this.isBorderBox()){height-=(this.getBorderWidth('tb')+this.getPadding('tb'));}
if(height<0){height=0;}}
return height;},setWidth:function(width,animate,duration,onComplete,easing){width=this.adjustWidth(width);if(!animate||!YAHOO.util.Anim){YAHOO.util.Dom.setStyle(this.dom,'width',this.addUnits(width));}else{this.anim({width:{to:width}},duration,onComplete,easing||(width>this.getWidth()?YAHOO.util.Easing.easeOut:YAHOO.util.Easing.easeIn));}
return this;},setHeight:function(height,animate,duration,onComplete,easing){height=this.adjustHeight(height);if(!animate||!YAHOO.util.Anim){YAHOO.util.Dom.setStyle(this.dom,'height',this.addUnits(height));}else{this.anim({height:{to:height}},duration,onComplete,easing||(height>this.getHeight()?YAHOO.util.Easing.easeOut:YAHOO.util.Easing.easeIn));}
return this;},setSize:function(width,height,animate,duration,onComplete,easing){if(!animate||!YAHOO.util.Anim){this.setWidth(width);this.setHeight(height);}else{width=this.adjustWidth(width);height=this.adjustHeight(height);this.anim({width:{to:width},height:{to:height}},duration,onComplete,easing);}
return this;},setBounds:function(x,y,width,height,animate,duration,onComplete,easing){if(!animate||!YAHOO.util.Anim){this.setWidth(width);this.setHeight(height);this.setLocation(x,y);}else{width=this.adjustWidth(width);height=this.adjustHeight(height);this.anim({points:{to:[x,y]},width:{to:width},height:{to:height}},duration,onComplete,easing,YAHOO.util.Motion);}
return this;},setRegion:function(region,animate,duration,onComplete,easing){this.setBounds(region.left,region.top,region.right-region.left,region.bottom-region.top,animate,duration,onComplete,easing);return this;},addListener:function(eventName,handler,scope,override){YAHOO.util.Event.addListener(this.dom,eventName,handler,scope||this,true);return this;},bufferedListener:function(eventName,fn,scope,millis){var task=new YAHOO.ext.util.DelayedTask();scope=scope||this;var newFn=function(){task.delay(millis||250,fn,scope,Array.prototype.slice.call(arguments,0));}
this.addListener(eventName,newFn);return newFn;},addHandler:function(eventName,stopPropagation,handler,scope,override){var fn=YAHOO.ext.Element.createStopHandler(stopPropagation,handler,scope||this,true);YAHOO.util.Event.addListener(this.dom,eventName,fn);return this;},on:function(eventName,handler,scope,override){YAHOO.util.Event.addListener(this.dom,eventName,handler,scope||this,true);return this;},addManagedListener:function(eventName,fn,scope,override){return YAHOO.ext.EventManager.on(this.dom,eventName,fn,scope||this,true);},mon:function(eventName,fn,scope,override){return YAHOO.ext.EventManager.on(this.dom,eventName,fn,scope||this,true);},removeListener:function(eventName,handler,scope){YAHOO.util.Event.removeListener(this.dom,eventName,handler);return this;},removeAllListeners:function(){YAHOO.util.Event.purgeElement(this.dom);return this;},setOpacity:function(opacity,animate,duration,onComplete,easing){if(!animate||!YAHOO.util.Anim){YAHOO.util.Dom.setStyle(this.dom,'opacity',opacity);}else{this.anim({opacity:{to:opacity}},duration,onComplete,easing);}
return this;},getLeft:function(local){if(!local){return this.getX();}else{return parseInt(this.getStyle('left'),10)||0;}},getRight:function(local){if(!local){return this.getX()+this.getWidth();}else{return(this.getLeft(true)+this.getWidth())||0;}},getTop:function(local){if(!local){return this.getY();}else{return parseInt(this.getStyle('top'),10)||0;}},getBottom:function(local){if(!local){return this.getY()+this.getHeight();}else{return(this.getTop(true)+this.getHeight())||0;}},setAbsolutePositioned:function(zIndex){this.setStyle('position','absolute');if(zIndex){this.setStyle('z-index',zIndex);}
return this;},setRelativePositioned:function(zIndex){this.setStyle('position','relative');if(zIndex){this.setStyle('z-index',zIndex);}
return this;},clearPositioning:function(){this.setStyle('position','');this.setStyle('left','');this.setStyle('right','');this.setStyle('top','');this.setStyle('bottom','');return this;},getPositioning:function(){return{'position':this.getStyle('position'),'left':this.getStyle('left'),'right':this.getStyle('right'),'top':this.getStyle('top'),'bottom':this.getStyle('bottom')};},getBorderWidth:function(side){return this.addStyles(side,YAHOO.ext.Element.borders);},getPadding:function(side){return this.addStyles(side,YAHOO.ext.Element.paddings);},setPositioning:function(positionCfg){if(positionCfg.position)this.setStyle('position',positionCfg.position);if(positionCfg.left)this.setLeft(positionCfg.left);if(positionCfg.right)this.setRight(positionCfg.right);if(positionCfg.top)this.setTop(positionCfg.top);if(positionCfg.bottom)this.setBottom(positionCfg.bottom);return this;},setLeftTop:function(left,top){this.dom.style.left=this.addUnits(left);this.dom.style.top=this.addUnits(top);return this;},move:function(direction,distance,animate,duration,onComplete,easing){var xy=this.getXY();direction=direction.toLowerCase();switch(direction){case'l':case'left':this.moveTo(xy[0]-distance,xy[1],animate,duration,onComplete,easing);break;case'r':case'right':this.moveTo(xy[0]+distance,xy[1],animate,duration,onComplete,easing);break;case't':case'top':case'up':this.moveTo(xy[0],xy[1]-distance,animate,duration,onComplete,easing);break;case'b':case'bottom':case'down':this.moveTo(xy[0],xy[1]+distance,animate,duration,onComplete,easing);break;}
return this;},clip:function(){if(!this.isClipped){this.isClipped=true;this.originalClip={'o':this.getStyle('overflow'),'x':this.getStyle('overflow-x'),'y':this.getStyle('overflow-y')};this.setStyle('overflow','hidden');this.setStyle('overflow-x','hidden');this.setStyle('overflow-y','hidden');}
return this;},unclip:function(){if(this.isClipped){this.isClipped=false;var o=this.originalClip;if(o.o){this.setStyle('overflow',o.o);}
if(o.x){this.setStyle('overflow-x',o.x);}
if(o.y){this.setStyle('overflow-y',o.y);}}
return this;},alignTo:function(element,position,offsets,animate,duration,onComplete,easing){var otherEl=getEl(element);if(!otherEl){return this;}
offsets=offsets||[0,0];var r=otherEl.getRegion();position=position.toLowerCase();switch(position){case'bl':this.moveTo(r.left+offsets[0],r.bottom+offsets[1],animate,duration,onComplete,easing);break;case'br':this.moveTo(r.right+offsets[0],r.bottom+offsets[1],animate,duration,onComplete,easing);break;case'tl':this.moveTo(r.left+offsets[0],r.top+offsets[1],animate,duration,onComplete,easing);break;case'tr':this.moveTo(r.right+offsets[0],r.top+offsets[1],animate,duration,onComplete,easing);break;}
return this;},clearOpacity:function(){if(window.ActiveXObject){this.dom.style.filter='';}else{this.dom.style.opacity='';this.dom.style['-moz-opacity']='';this.dom.style['-khtml-opacity']='';}
return this;},hide:function(animate,duration,onComplete,easing){this.setVisible(false,animate,duration,onComplete,easing);return this;},show:function(animate,duration,onComplete,easing){this.setVisible(true,animate,duration,onComplete,easing);return this;},addUnits:function(size){if(size===''||size=='auto'||typeof size=='undefined'){return size;}
if(typeof size=='number'||!YAHOO.ext.Element.unitPattern.test(size)){return size+this.defaultUnit;}
return size;},beginMeasure:function(){var el=this.dom;if(el.offsetWidth||el.offsetHeight){return this;}
var changed=[];var p=this.dom;while((!el.offsetWidth&&!el.offsetHeight)&&p&&p.tagName&&p.tagName.toLowerCase()!='body'){if(YAHOO.util.Dom.getStyle(p,'display')=='none'){changed.push({el:p,visibility:YAHOO.util.Dom.getStyle(p,'visibility')});p.style.visibility='hidden';p.style.display='block';}
p=p.parentNode;}
this._measureChanged=changed;return this;},endMeasure:function(){var changed=this._measureChanged;if(changed){for(var i=0,len=changed.length;i<len;i++){var r=changed[i];r.el.style.visibility=r.visibility;r.el.style.display='none';}
this._measureChanged=null;}
return this;},update:function(html,loadScripts,callback){if(typeof html=='undefined'){html='';}
if(loadScripts!==true){this.dom.innerHTML=html;if(typeof callback=='function'){callback();}
return this;}
var id=YAHOO.util.Dom.generateId();var dom=this.dom;html+='<span id="'+id+'"></span>';YAHOO.util.Event.onAvailable(id,function(){var hd=document.getElementsByTagName("head")[0];var re=/(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/img;var srcRe=/\ssrc=([\'\"])(.*?)\1/i;var match;while(match=re.exec(html)){var srcMatch=match[0].match(srcRe);if(srcMatch&&srcMatch[2]){var s=document.createElement("script");s.src=srcMatch[2];hd.appendChild(s);}else if(match[1]&&match[1].length>0){eval(match[1]);}}
var el=document.getElementById(id);if(el){el.parentNode.removeChild(el);}
if(typeof callback=='function'){callback();}});dom.innerHTML=html.replace(/(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/img,'');return this;},load:function(){var um=this.getUpdateManager();um.update.apply(um,arguments);return this;},getUpdateManager:function(){if(!this.updateManager){this.updateManager=new YAHOO.ext.UpdateManager(this);}
return this.updateManager;},unselectable:function(){this.dom.unselectable='on';this.swallowEvent('selectstart',true);this.applyStyles('-moz-user-select:none;-khtml-user-select:none;');return this;},getCenterXY:function(offsetScroll){var centerX=Math.round((YAHOO.util.Dom.getViewportWidth()-this.getWidth())/2);var centerY=Math.round((YAHOO.util.Dom.getViewportHeight()-this.getHeight())/2);if(!offsetScroll){return[centerX,centerY];}else{var scrollX=document.documentElement.scrollLeft||document.body.scrollLeft||0;var scrollY=document.documentElement.scrollTop||document.body.scrollTop||0;return[centerX+scrollX,centerY+scrollY];}},center:function(centerIn){if(!centerIn){this.setXY(this.getCenterXY(true));}else{var box=YAHOO.ext.Element.get(centerIn).getBox();this.setXY([box.x+(box.width/2)-(this.getWidth()/2),box.y+(box.height/2)-(this.getHeight()/2)]);}
return this;},getChildrenByTagName:function(tagName){var children=this.dom.getElementsByTagName(tagName);var len=children.length;var ce=new Array(len);for(var i=0;i<len;++i){ce[i]=YAHOO.ext.Element.get(children[i],true);}
return ce;},getChildrenByClassName:function(className,tagName){var children=YAHOO.util.Dom.getElementsByClassName(className,tagName,this.dom);var len=children.length;var ce=new Array(len);for(var i=0;i<len;++i){ce[i]=YAHOO.ext.Element.get(children[i],true);}
return ce;},isBorderBox:function(){if(typeof this.bbox=='undefined'){var el=this.dom;var b=YAHOO.ext.util.Browser;var strict=YAHOO.ext.Strict;this.bbox=((b.isIE&&!strict&&el.style.boxSizing!='content-box')||(b.isGecko&&YAHOO.util.Dom.getStyle(el,"-moz-box-sizing")=='border-box')||(!b.isSafari&&YAHOO.util.Dom.getStyle(el,"box-sizing")=='border-box'));}
return this.bbox;},getBox:function(contentBox,local){var xy;if(!local){xy=this.getXY();}else{var left=parseInt(YAHOO.util.Dom.getStyle('left'),10)||0;var top=parseInt(YAHOO.util.Dom.getStyle('top'),10)||0;xy=[left,top];}
var el=this.dom;var w=el.offsetWidth;var h=el.offsetHeight;if(!contentBox){return{x:xy[0],y:xy[1],width:w,height:h};}else{var l=this.getBorderWidth('l')+this.getPadding('l');var r=this.getBorderWidth('r')+this.getPadding('r');var t=this.getBorderWidth('t')+this.getPadding('t');var b=this.getBorderWidth('b')+this.getPadding('b');return{x:xy[0]+l,y:xy[1]+t,width:w-(l+r),height:h-(t+b)};}},setBox:function(box,adjust,animate,duration,onComplete,easing){var w=box.width,h=box.height;if((adjust&&!this.autoBoxAdjust)&&!this.isBorderBox()){w-=(this.getBorderWidth('lr')+this.getPadding('lr'));h-=(this.getBorderWidth('tb')+this.getPadding('tb'));}
this.setBounds(box.x,box.y,w,h,animate,duration,onComplete,easing);return this;},repaint:function(){var dom=this.dom;YAHOO.util.Dom.addClass(dom,'yui-ext-repaint');setTimeout(function(){YAHOO.util.Dom.removeClass(dom,'yui-ext-repaint');},1);return this;},getMargins:function(side){if(!side){return{top:parseInt(this.getStyle('margin-top'),10)||0,left:parseInt(this.getStyle('margin-left'),10)||0,bottom:parseInt(this.getStyle('margin-bottom'),10)||0,right:parseInt(this.getStyle('margin-right'),10)||0};}else{return this.addStyles(side,YAHOO.ext.Element.margins);}},addStyles:function(sides,styles){var val=0;for(var i=0,len=sides.length;i<len;i++){var w=parseInt(this.getStyle(styles[sides.charAt(i)]),10);if(!isNaN(w))val+=w;}
return val;},createProxy:function(config,renderTo,matchBox){if(renderTo){renderTo=YAHOO.util.Dom.get(renderTo);}else{renderTo=document.body;}
config=typeof config=='object'?config:{tag:'div',cls:config};var proxy=YAHOO.ext.DomHelper.append(renderTo,config,true);if(matchBox){proxy.setBox(this.getBox());}
return proxy;},createShim:function(){var config={tag:'iframe',frameBorder:'no',cls:'yiframe-shim',style:'position:absolute;visibility:hidden;left:0;top:0;overflow:hidden;',src:YAHOO.ext.SSL_SECURE_URL};var shim=YAHOO.ext.DomHelper.append(this.dom.parentNode,config,true);shim.setBox(this.getBox());return shim;},remove:function(){this.dom.parentNode.removeChild(this.dom);delete YAHOO.ext.Element.cache[this.dom.id];},addClassOnOver:function(className){this.on('mouseover',function(){this.addClass(className);},this,true);this.on('mouseout',function(){this.removeClass(className);},this,true);return this;},swallowEvent:function(eventName,preventDefault){var fn=function(e){e.stopPropagation();if(preventDefault){e.preventDefault();}};this.mon(eventName,fn);return this;},fitToParent:function(monitorResize){var p=getEl(this.dom.parentNode,true);p.beginMeasure();var box=p.getBox(true,true);p.endMeasure();this.setSize(box.width,box.height);if(monitorResize===true){YAHOO.ext.EventManager.onWindowResize(this.fitToParent,this,true);}
return this;},getNextSibling:function(){var n=this.dom.nextSibling;while(n&&n.nodeType!=1){n=n.nextSibling;}
return n;},getPrevSibling:function(){var n=this.dom.previousSibling;while(n&&n.nodeType!=1){n=n.previousSibling;}
return n;},appendChild:function(el){el=getEl(el);el.appendTo(this);return this;},createChild:function(config,insertBefore){var c;if(insertBefore){c=YAHOO.ext.DomHelper.insertBefore(insertBefore,config,true);}else{c=YAHOO.ext.DomHelper.append(this.dom,config,true);}
return c;},appendTo:function(el){var node=getEl(el).dom;node.appendChild(this.dom);return this;},insertBefore:function(el){var node=getEl(el).dom;node.parentNode.insertBefore(this.dom,node);return this;},insertAfter:function(el){var node=getEl(el).dom;node.parentNode.insertBefore(this.dom,node.nextSibling);return this;},wrap:function(config){if(!config){config={tag:'div'};}
var newEl=YAHOO.ext.DomHelper.insertBefore(this.dom,config,true);newEl.dom.appendChild(this.dom);return newEl;},replace:function(el){el=getEl(el);this.insertBefore(el);el.remove();return this;},insertHtml:function(where,html){YAHOO.ext.DomHelper.insertHtml(where,this.dom,html);return this;},set:function(o){var el=this.dom;var useSet=el.setAttribute?true:false;for(var attr in o){if(attr=='style'||typeof o[attr]=='function')continue;if(attr=='cls'){el.className=o['cls'];}else{if(useSet)el.setAttribute(attr,o[attr]);else el[attr]=o[attr];}}
YAHOO.ext.DomHelper.applyStyles(el,o.style);return this;},addKeyListener:function(key,fn,scope){var config;if(typeof key!='object'||key instanceof Array){config={key:key,fn:fn,scope:scope};}else{config={key:key.key,shift:key.shift,ctrl:key.ctrl,alt:key.alt,fn:fn,scope:scope};}
var map=new YAHOO.ext.KeyMap(this,config);return map;},addKeyMap:function(config){return new YAHOO.ext.KeyMap(this,config);}};YAHOO.ext.Element.prototype.autoBoxAdjust=true;YAHOO.ext.Element.prototype.autoDisplayMode=true;YAHOO.ext.Element.unitPattern=/\d+(px|em|%|en|ex|pt|in|cm|mm|pc)$/i;YAHOO.ext.Element.VISIBILITY=1;YAHOO.ext.Element.DISPLAY=2;YAHOO.ext.Element.blockElements=/^(?:address|blockquote|center|dir|div|dl|fieldset|form|h\d|hr|isindex|menu|ol|ul|p|pre|table|dd|dt|li|tbody|tr|td|thead|tfoot|iframe)$/i;YAHOO.ext.Element.borders={l:'border-left-width',r:'border-right-width',t:'border-top-width',b:'border-bottom-width'};YAHOO.ext.Element.paddings={l:'padding-left',r:'padding-right',t:'padding-top',b:'padding-bottom'};YAHOO.ext.Element.margins={l:'margin-left',r:'margin-right',t:'margin-top',b:'margin-bottom'};YAHOO.ext.Element.createStopHandler=function(stopPropagation,handler,scope,override){return function(e){if(e){if(stopPropagation){YAHOO.util.Event.stopEvent(e);}else{YAHOO.util.Event.preventDefault(e);}}
handler.call(override&&scope?scope:window,e,scope);};};YAHOO.ext.Element.cache={};YAHOO.ext.Element.get=function(el,autoGenerateId){if(!el){return null;}
autoGenerateId=true;if(el instanceof YAHOO.ext.Element){el.dom=YAHOO.util.Dom.get(el.id);YAHOO.ext.Element.cache[el.id]=el;return el;}else if(el.isComposite){return el;}else if(el instanceof Array){return YAHOO.ext.Element.select(el);}else if(el===document){if(!YAHOO.ext.Element.cache['__ydocument']){var docEl=function(){};docEl.prototype=YAHOO.ext.Element.prototype;var o=new docEl();o.dom=document;YAHOO.ext.Element.cache['__ydocument']=o;}
return YAHOO.ext.Element.cache['__ydocument'];}
var key=el;if(typeof el!='string'){if(!el.id&&!autoGenerateId){return null;}
YAHOO.util.Dom.generateId(el,'elgen-');key=el.id;}
var element=YAHOO.ext.Element.cache[key];if(!element){element=new YAHOO.ext.Element(key);if(!element.dom)return null;YAHOO.ext.Element.cache[key]=element;}else{element.dom=YAHOO.util.Dom.get(key);}
return element;};var getEl=YAHOO.ext.Element.get;YAHOO.util.Event.addListener(window,'unload',function(){YAHOO.ext.Element.cache=null;});
YAHOO.ext.DomHelper=new function(){var d=document;var tempTableEl=null;this.useDom=false;var emptyTags=/^(?:base|basefont|br|frame|hr|img|input|isindex|link|meta|nextid|range|spacer|wbr|audioscope|area|param|keygen|col|limittext|spot|tab|over|right|left|choose|atop|of)$/i;this.applyStyles=function(el,styles){if(styles){var D=YAHOO.util.Dom;if(typeof styles=="string"){var re=/\s?([a-z\-]*)\:([^;]*);?/gi;var matches;while((matches=re.exec(styles))!=null){D.setStyle(el,matches[1],matches[2]);}}else if(typeof styles=="object"){for(var style in styles){D.setStyle(el,style,styles[style]);}}else if(typeof styles=="function"){YAHOO.ext.DomHelper.applyStyles(el,styles.call());}}};var createHtml=function(o){var b='';b+='<'+o.tag;for(var attr in o){if(attr=='tag'||attr=='children'||attr=='html'||typeof o[attr]=='function')continue;if(attr=='style'){var s=o['style'];if(typeof s=='function'){s=s.call();}
if(typeof s=='string'){b+=' style="'+s+'"';}else if(typeof s=='object'){b+=' style="';for(var key in s){if(typeof s[key]!='function'){b+=key+':'+s[key]+';';}}
b+='"';}}else{if(attr=='cls'){b+=' class="'+o['cls']+'"';}else if(attr=='htmlFor'){b+=' for="'+o['htmlFor']+'"';}else{b+=' '+attr+'="'+o[attr]+'"';}}}
if(emptyTags.test(o.tag)){b+=' />';}else{b+='>';if(o.children){for(var i=0,len=o.children.length;i<len;i++){b+=createHtml(o.children[i],b);}}
if(o.html){b+=o.html;}
b+='</'+o.tag+'>';}
return b;}
var createDom=function(o,parentNode){var el=d.createElement(o.tag);var useSet=el.setAttribute?true:false;for(var attr in o){if(attr=='tag'||attr=='children'||attr=='html'||attr=='style'||typeof o[attr]=='function')continue;if(attr=='cls'){el.className=o['cls'];}else{if(useSet)el.setAttribute(attr,o[attr]);else el[attr]=o[attr];}}
YAHOO.ext.DomHelper.applyStyles(el,o.style);if(o.children){for(var i=0,len=o.children.length;i<len;i++){createDom(o.children[i],el);}}
if(o.html){el.innerHTML=o.html;}
if(parentNode){parentNode.appendChild(el);}
return el;};var insertIntoTable=function(tag,where,el,html){if(!tempTableEl){tempTableEl=document.createElement('div');}
var node;if(tag=='table'||tag=='tbody'){tempTableEl.innerHTML='<table><tbody>'+html+'</tbody></table>';node=tempTableEl.firstChild.firstChild.firstChild;}else{tempTableEl.innerHTML='<table><tbody><tr>'+html+'</tr></tbody></table>';node=tempTableEl.firstChild.firstChild.firstChild.firstChild;}
if(where=='beforebegin'){el.parentNode.insertBefore(node,el);return node;}else if(where=='afterbegin'){el.insertBefore(node,el.firstChild);return node;}else if(where=='beforeend'){el.appendChild(node);return node;}else if(where=='afterend'){el.parentNode.insertBefore(node,el.nextSibling);return node;}}
this.insertHtml=function(where,el,html){where=where.toLowerCase();if(el.insertAdjacentHTML){var tag=el.tagName.toLowerCase();if(tag=='table'||tag=='tbody'||tag=='tr'){return insertIntoTable(tag,where,el,html);}
switch(where){case'beforebegin':el.insertAdjacentHTML(where,html);return el.previousSibling;case'afterbegin':el.insertAdjacentHTML(where,html);return el.firstChild;case'beforeend':el.insertAdjacentHTML(where,html);return el.lastChild;case'afterend':el.insertAdjacentHTML(where,html);return el.nextSibling;}
throw'Illegal insertion point -> "'+where+'"';}
var range=el.ownerDocument.createRange();var frag;switch(where){case'beforebegin':range.setStartBefore(el);frag=range.createContextualFragment(html);el.parentNode.insertBefore(frag,el);return el.previousSibling;case'afterbegin':if(el.firstChild){range.setStartBefore(el.firstChild);}else{range.selectNodeContents(el);range.collapse(true);}
frag=range.createContextualFragment(html);el.insertBefore(frag,el.firstChild);return el.firstChild;case'beforeend':if(el.lastChild){range.setStartAfter(el.lastChild);}else{range.selectNodeContents(el);range.collapse(false);}
frag=range.createContextualFragment(html);el.appendChild(frag);return el.lastChild;case'afterend':range.setStartAfter(el);frag=range.createContextualFragment(html);el.parentNode.insertBefore(frag,el.nextSibling);return el.nextSibling;}
throw'Illegal insertion point -> "'+where+'"';};this.insertBefore=function(el,o,returnElement){el=YAHOO.util.Dom.get(el);var newNode;if(this.useDom){newNode=createDom(o,null);el.parentNode.insertBefore(newNode,el);}else{var html=createHtml(o);newNode=this.insertHtml('beforeBegin',el,html);}
return returnElement?YAHOO.ext.Element.get(newNode,true):newNode;};this.insertAfter=function(el,o,returnElement){el=YAHOO.util.Dom.get(el);var newNode;if(this.useDom){newNode=createDom(o,null);el.parentNode.insertBefore(newNode,el.nextSibling);}else{var html=createHtml(o);newNode=this.insertHtml('afterEnd',el,html);}
return returnElement?YAHOO.ext.Element.get(newNode,true):newNode;};this.append=function(el,o,returnElement){el=YAHOO.util.Dom.get(el);var newNode;if(this.useDom){newNode=createDom(o,null);el.appendChild(newNode);}else{var html=createHtml(o);newNode=this.insertHtml('beforeEnd',el,html);}
return returnElement?YAHOO.ext.Element.get(newNode,true):newNode;};this.overwrite=function(el,o,returnElement){el=YAHOO.util.Dom.get(el);el.innerHTML=createHtml(o);return returnElement?YAHOO.ext.Element.get(el.firstChild,true):el.firstChild;};this.createTemplate=function(o){var html=createHtml(o);return new YAHOO.ext.DomHelper.Template(html);};}();YAHOO.ext.DomHelper.Template=function(html){this.html=html;};YAHOO.ext.DomHelper.Template.prototype={applyTemplate:function(values){if(this.compiled){return this.compiled(values);}
var empty='';var fn=function(match,index){if(typeof values[index]!='undefined'){return values[index];}else{return empty;}}
return this.html.replace(this.re,fn);},re:/\{(\w+)\}/g,compile:function(){var html=this.html;var re=this.re;var body=[];body.push("this.compiled = function(values){ return [");var result;var lastMatchEnd=0;while((result=re.exec(html))!=null){body.push("'",html.substring(lastMatchEnd,result.index),"', ");body.push("values['",html.substring(result.index+1,re.lastIndex-1),"'], ");lastMatchEnd=re.lastIndex;}
body.push("'",html.substr(lastMatchEnd),"'].join('');};");eval(body.join(''));},insertBefore:function(el,values,returnElement){el=YAHOO.util.Dom.get(el);var newNode=YAHOO.ext.DomHelper.insertHtml('beforeBegin',el,this.applyTemplate(values));return returnElement?YAHOO.ext.Element.get(newNode,true):newNode;},insertAfter:function(el,values,returnElement){el=YAHOO.util.Dom.get(el);var newNode=YAHOO.ext.DomHelper.insertHtml('afterEnd',el,this.applyTemplate(values));return returnElement?YAHOO.ext.Element.get(newNode,true):newNode;},append:function(el,values,returnElement){el=YAHOO.util.Dom.get(el);var newNode=YAHOO.ext.DomHelper.insertHtml('beforeEnd',el,this.applyTemplate(values));return returnElement?YAHOO.ext.Element.get(newNode,true):newNode;},overwrite:function(el,values,returnElement){el=YAHOO.util.Dom.get(el);el.innerHTML='';var newNode=YAHOO.ext.DomHelper.insertHtml('beforeEnd',el,this.applyTemplate(values));return returnElement?YAHOO.ext.Element.get(newNode,true):newNode;}};YAHOO.ext.Template=YAHOO.ext.DomHelper.Template;
YAHOO.ext.CompositeElement=function(els){this.elements=[];this.addElements(els);};YAHOO.ext.CompositeElement.prototype={isComposite:true,addElements:function(els){if(!els)return this;var yels=this.elements;var index=yels.length-1;for(var i=0,len=els.length;i<len;i++){yels[++index]=getEl(els[i],true);}
return this;},invoke:function(fn,args){var els=this.elements;for(var i=0,len=els.length;i<len;i++){YAHOO.ext.Element.prototype[fn].apply(els[i],args);}
return this;},add:function(els){if(typeof els=='string'){this.addElements(YAHOO.ext.Element.selectorFunction(string));}else if(els instanceof Array){this.addElements(els);}else{this.addElements([els]);}
return this;},each:function(fn,scope){var els=this.elements;for(var i=0,len=els.length;i<len;i++){fn.call(scope||els[i],els[i],this,i);}
return this;}};YAHOO.ext.CompositeElementLite=function(els){YAHOO.ext.CompositeElementLite.superclass.constructor.call(this,els);this.el=YAHOO.ext.Element.get(this.elements[0],true);};YAHOO.extendX(YAHOO.ext.CompositeElementLite,YAHOO.ext.CompositeElement,{addElements:function(els){if(els){this.elements=this.elements.concat(els);}
return this;},invoke:function(fn,args){var els=this.elements;var el=this.el;for(var i=0,len=els.length;i<len;i++){el.dom=els[i];YAHOO.ext.Element.prototype[fn].apply(el,args);}
return this;}});YAHOO.ext.CompositeElement.createCall=function(proto,fnName){if(!proto[fnName]){proto[fnName]=function(){return this.invoke(fnName,arguments);};}};for(var fnName in YAHOO.ext.Element.prototype){if(typeof YAHOO.ext.Element.prototype[fnName]=='function'){YAHOO.ext.CompositeElement.createCall(YAHOO.ext.CompositeElement.prototype,fnName);}}
if(typeof cssQuery=='function'){YAHOO.ext.Element.selectorFunction=cssQuery;}else if(typeof document.getElementsBySelector=='function'){YAHOO.ext.Element.selectorFunction=document.getElementsBySelector.createDelegate(document);}
YAHOO.ext.Element.select=function(selector,unique){var els;if(typeof selector=='string'){els=YAHOO.ext.Element.selectorFunction(selector);}else if(selector instanceof Array){els=selector;}else{throw'Invalid selector';}
if(unique===true){return new YAHOO.ext.CompositeElement(els);}else{return new YAHOO.ext.CompositeElementLite(els);}};var getEls=YAHOO.ext.Element.select;
YAHOO.ext.EventManager=new function(){var docReadyEvent;var docReadyProcId;var docReadyState=false;this.ieDeferSrc=false;var resizeEvent;var resizeTask;var fireDocReady=function(){if(!docReadyState){docReadyState=true;if(docReadyProcId){clearInterval(docReadyProcId);}
if(docReadyEvent){docReadyEvent.fire();}}};var initDocReady=function(){docReadyEvent=new YAHOO.util.CustomEvent('documentready');if(document.addEventListener){YAHOO.util.Event.on(document,"DOMContentLoaded",fireDocReady);}else if(YAHOO.ext.util.Browser.isIE){document.write('<s'+'cript id="ie-deferred-loader" defer="defer" src="'+
(YAHOO.ext.EventManager.ieDeferSrc||YAHOO.ext.SSL_SECURE_URL)+'"></s'+'cript>');YAHOO.util.Event.on('ie-deferred-loader','readystatechange',function(){if(this.readyState=='complete'){fireDocReady();}});}else if(YAHOO.ext.util.Browser.isSafari){docReadyProcId=setInterval(function(){var rs=document.readyState;if(rs=='loaded'||rs=='complete'){fireDocReady();}},10);}
YAHOO.util.Event.on(window,'load',fireDocReady);};this.wrap=function(fn,scope,override){var wrappedFn=function(e){YAHOO.ext.EventObject.setEvent(e);fn.call(override?scope||window:window,YAHOO.ext.EventObject,scope);};return wrappedFn;};this.addListener=function(element,eventName,fn,scope,override){var wrappedFn=this.wrap(fn,scope,override);YAHOO.util.Event.addListener(element,eventName,wrappedFn);return wrappedFn;};this.removeListener=function(element,eventName,wrappedFn){return YAHOO.util.Event.removeListener(element,eventName,wrappedFn);};this.on=this.addListener;this.onDocumentReady=function(fn,scope,override){if(docReadyState){fn.call(override?scope||window:window,scope);return;}
if(!docReadyEvent){initDocReady();}
docReadyEvent.subscribe(fn,scope,override);}
this.onWindowResize=function(fn,scope,override){if(!resizeEvent){resizeEvent=new YAHOO.util.CustomEvent('windowresize');resizeTask=new YAHOO.ext.util.DelayedTask(function(){resizeEvent.fireDirect(YAHOO.util.Dom.getViewportWidth(),YAHOO.util.Dom.getViewportHeight());});YAHOO.util.Event.on(window,'resize',function(){resizeTask.delay(50);});}
resizeEvent.subscribe(fn,scope,override);},this.removeResizeListener=function(fn,scope){if(resizeEvent){resizeEvent.unsubscribe(fn,scope);}}};YAHOO.ext.EventObject=new function(){this.browserEvent=null;this.button=-1;this.shiftKey=false;this.ctrlKey=false;this.altKey=false;this.BACKSPACE=8;this.TAB=9;this.RETURN=13;this.ESC=27;this.SPACE=32;this.PAGEUP=33;this.PAGEDOWN=34;this.END=35;this.HOME=36;this.LEFT=37;this.UP=38;this.RIGHT=39;this.DOWN=40;this.DELETE=46;this.F5=116;this.setEvent=function(e){if(e==this){return this;}
this.browserEvent=e;if(e){this.button=e.button;this.shiftKey=e.shiftKey;this.ctrlKey=e.ctrlKey;this.altKey=e.altKey;}else{this.button=-1;this.shiftKey=false;this.ctrlKey=false;this.altKey=false;}
return this;};this.stopEvent=function(){if(this.browserEvent){YAHOO.util.Event.stopEvent(this.browserEvent);}};this.preventDefault=function(){if(this.browserEvent){YAHOO.util.Event.preventDefault(this.browserEvent);}};this.isNavKeyPress=function(){return(this.browserEvent.keyCode&&this.browserEvent.keyCode>=33&&this.browserEvent.keyCode<=40);};this.stopPropagation=function(){if(this.browserEvent){YAHOO.util.Event.stopPropagation(this.browserEvent);}};this.getCharCode=function(){if(this.browserEvent){return YAHOO.util.Event.getCharCode(this.browserEvent);}
return null;};this.getKey=function(){if(this.browserEvent){return this.browserEvent.keyCode||this.browserEvent.charCode;}
return null;};this.getPageX=function(){if(this.browserEvent){return YAHOO.util.Event.getPageX(this.browserEvent);}
return null;};this.getPageY=function(){if(this.browserEvent){return YAHOO.util.Event.getPageY(this.browserEvent);}
return null;};this.getTime=function(){if(this.browserEvent){return YAHOO.util.Event.getTime(this.browserEvent);}
return null;};this.getXY=function(){if(this.browserEvent){return YAHOO.util.Event.getXY(this.browserEvent);}
return[];};this.getTarget=function(){if(this.browserEvent){return YAHOO.util.Event.getTarget(this.browserEvent);}
return null;};this.findTarget=function(className,tagName){if(tagName)tagName=tagName.toLowerCase();if(this.browserEvent){function isMatch(el){if(!el){return false;}
if(className&&!YAHOO.util.Dom.hasClass(el,className)){return false;}
if(tagName&&el.tagName.toLowerCase()!=tagName){return false;}
return true;};var t=this.getTarget();if(!t||isMatch(t)){return t;}
var p=t.parentNode;var b=document.body;while(p&&p!=b){if(isMatch(p)){return p;}
p=p.parentNode;}}
return null;};this.getRelatedTarget=function(){if(this.browserEvent){return YAHOO.util.Event.getRelatedTarget(this.browserEvent);}
return null;};this.getWheelDelta=function(){var e=this.browserEvent;var delta=0;if(e.wheelDelta){delta=e.wheelDelta/120;if(window.opera)delta=-delta;}else if(e.detail){delta=-e.detail/3;}
return delta;};this.hasModifier=function(){return this.ctrlKey||this.altKey||this.shiftKey;};}();
YAHOO.ext.TabPanel=function(container,config){this.el=getEl(container,true);this.tabPosition='top';this.currentTabWidth=0;this.minTabWidth=40;this.maxTabWidth=250;this.preferredTabWidth=175;this.resizeTabs=false;this.monitorResize=true;if(config){if(typeof config=='boolean'){this.tabPosition=config?'bottom':'top';}else{YAHOO.ext.util.Config.apply(this,config);}}
if(this.tabPosition=='bottom'){this.bodyEl=getEl(this.createBody(this.el.dom));this.el.addClass('ytabs-bottom');}
this.stripWrap=getEl(this.createStrip(this.el.dom),true);this.stripEl=getEl(this.createStripList(this.stripWrap.dom),true);this.stripBody=getEl(this.stripWrap.dom.firstChild.firstChild,true);if(YAHOO.ext.util.Browser.isIE){YAHOO.util.Dom.setStyle(this.stripWrap.dom.firstChild,'overflow-x','hidden');}
if(this.tabPosition!='bottom'){this.bodyEl=getEl(this.createBody(this.el.dom));this.el.addClass('ytabs-top');}
this.items=[];this.bodyEl.setStyle('position','relative');if(!this.items.indexOf){this.items.indexOf=function(o){for(var i=0,len=this.length;i<len;i++){if(this[i]==o)return i;}
return-1;}}
this.active=null;this.onTabChange=new YAHOO.util.CustomEvent('TabItem.onTabChange');this.activateDelegate=this.activate.createDelegate(this);this.events={'tabchange':this.onTabChange,'beforetabchange':new YAHOO.util.CustomEvent('beforechange')};YAHOO.ext.EventManager.onWindowResize(this.onResize,this,true);this.cpad=this.el.getPadding('lr');this.hiddenCount=0;}
YAHOO.ext.TabPanel.prototype={fireEvent:YAHOO.ext.util.Observable.prototype.fireEvent,on:YAHOO.ext.util.Observable.prototype.on,addListener:YAHOO.ext.util.Observable.prototype.addListener,delayedListener:YAHOO.ext.util.Observable.prototype.delayedListener,removeListener:YAHOO.ext.util.Observable.prototype.removeListener,purgeListeners:YAHOO.ext.util.Observable.prototype.purgeListeners,addTab:function(id,text,content,closable){var item=new YAHOO.ext.TabPanelItem(this,id,text,closable);this.addTabItem(item);if(content){item.setContent(content);}
return item;},getTab:function(id){return this.items[id];},hideTab:function(id){var t=this.items[id];if(!t.isHidden()){t.setHidden(true);this.hiddenCount++;this.autoSizeTabs();}},unhideTab:function(id){var t=this.items[id];if(t.isHidden()){t.setHidden(false);this.hiddenCount--;this.autoSizeTabs();}},addTabItem:function(item){this.items[item.id]=item;this.items.push(item);if(this.resizeTabs){item.setWidth(this.currentTabWidth||this.preferredTabWidth)
this.autoSizeTabs();}else{item.autoSize();}},removeTab:function(id){var items=this.items;var tab=items[id];if(!tab)return;var index=items.indexOf(tab);if(this.active==tab&&items.length>1){var newTab=this.getNextAvailable(index);if(newTab)newTab.activate();}
this.stripEl.dom.removeChild(tab.pnode.dom);if(tab.bodyEl.dom.parentNode==this.bodyEl.dom){this.bodyEl.dom.removeChild(tab.bodyEl.dom);}
items.splice(index,1);delete this.items[tab.id];tab.fireEvent('close',tab);tab.purgeListeners();this.autoSizeTabs();},getNextAvailable:function(start){var items=this.items;var index=start;while(index<items.length){var item=items[++index];if(item&&!item.isHidden()){return item;}}
var index=start;while(index>=0){var item=items[--index];if(item&&!item.isHidden()){return item;}}
return null;},disableTab:function(id){var tab=this.items[id];if(tab&&this.active!=tab){tab.disable();}},enableTab:function(id){var tab=this.items[id];tab.enable();},activate:function(id){var tab=this.items[id];if(tab==this.active){return tab;}
var e={};this.fireEvent('beforetabchange',this,e,tab);if(e.cancel!==true&&!tab.disabled){if(this.active){this.active.hide();}
this.active=this.items[id];this.active.show();this.onTabChange.fireDirect(this,this.active);}
return tab;},getActiveTab:function(){return this.active;},syncHeight:function(targetHeight){var height=(targetHeight||this.el.getHeight())-this.el.getBorderWidth('tb')-this.el.getPadding('tb');var bm=this.bodyEl.getMargins();var newHeight=height-(this.stripWrap.getHeight()||0)-(bm.top+bm.bottom);this.bodyEl.setHeight(newHeight);return newHeight;},onResize:function(){if(this.monitorResize){this.autoSizeTabs();}},beginUpdate:function(){this.updating=true;},endUpdate:function(){this.updating=false;this.autoSizeTabs();},autoSizeTabs:function(){var count=this.items.length;var vcount=count-this.hiddenCount;if(!this.resizeTabs||count<1||vcount<1||this.updating)return;var w=Math.max(this.el.getWidth()-this.cpad,10);var availWidth=Math.floor(w/vcount);var b=this.stripBody;if(b.getWidth()>w){var tabs=this.items;this.setTabWidth(Math.max(availWidth,this.minTabWidth));if(availWidth<this.minTabWidth){}}else{if(this.currentTabWidth<this.preferredTabWidth){this.setTabWidth(Math.min(availWidth,this.preferredTabWidth));}}},getCount:function(){return this.items.length;},setTabWidth:function(width){this.currentTabWidth=width;for(var i=0,len=this.items.length;i<len;i++){if(!this.items[i].isHidden())this.items[i].setWidth(width);}},destroy:function(removeEl){YAHOO.ext.EventManager.removeResizeListener(this.onResize,this);for(var i=0,len=this.items.length;i<len;i++){this.items[i].purgeListeners();}
if(removeEl===true){this.el.update('');this.el.remove();}}};YAHOO.ext.TabPanelItem=function(tabPanel,id,text,closable){this.tabPanel=tabPanel;this.id=id;this.disabled=false;this.text=text;this.loaded=false;this.closable=closable;this.bodyEl=getEl(tabPanel.createItemBody(tabPanel.bodyEl.dom,id));this.bodyEl.setVisibilityMode(YAHOO.ext.Element.VISIBILITY);this.bodyEl.setStyle('display','block');this.bodyEl.setStyle('zoom','1');this.hideAction();var els=tabPanel.createStripElements(tabPanel.stripEl.dom,text,closable);this.el=getEl(els.el,true);this.inner=getEl(els.inner,true);this.textEl=getEl(this.el.dom.firstChild.firstChild.firstChild,true);this.pnode=getEl(els.el.parentNode,true);this.el.mon('click',this.onTabClick,this,true);if(closable){var c=getEl(els.close,true);c.dom.title=this.closeText;c.addClassOnOver('close-over');c.mon('click',this.closeClick,this,true);}
this.onActivate=new YAHOO.util.CustomEvent('TabItem.onActivate');this.onDeactivate=new YAHOO.util.CustomEvent('TabItem.onDeactivate');this.events={'activate':this.onActivate,'beforeclose':new YAHOO.util.CustomEvent('beforeclose'),'close':new YAHOO.util.CustomEvent('close'),'deactivate':this.onDeactivate};this.hidden=false;};YAHOO.ext.TabPanelItem.prototype={fireEvent:YAHOO.ext.util.Observable.prototype.fireEvent,on:YAHOO.ext.util.Observable.prototype.on,addListener:YAHOO.ext.util.Observable.prototype.addListener,delayedListener:YAHOO.ext.util.Observable.prototype.delayedListener,removeListener:YAHOO.ext.util.Observable.prototype.removeListener,purgeListeners:function(){YAHOO.ext.util.Observable.prototype.purgeListeners.call(this);this.el.removeAllListeners();},show:function(){this.pnode.addClass('on');this.showAction();if(YAHOO.ext.util.Browser.isOpera){this.tabPanel.stripWrap.repaint();}
this.onActivate.fireDirect(this.tabPanel,this);},isActive:function(){return this.tabPanel.getActiveTab()==this;},hide:function(){this.pnode.removeClass('on');this.hideAction();this.onDeactivate.fireDirect(this.tabPanel,this);},hideAction:function(){this.bodyEl.setStyle('position','absolute');this.bodyEl.setLeft('-20000px');this.bodyEl.setTop('-20000px');this.bodyEl.hide();},showAction:function(){this.bodyEl.setStyle('position','relative');this.bodyEl.setTop('');this.bodyEl.setLeft('');this.bodyEl.show();this.tabPanel.el.repaint.defer(1);},setTooltip:function(text){this.textEl.dom.title=text;},onTabClick:function(e){e.preventDefault();this.tabPanel.activate(this.id);},getWidth:function(){return this.inner.getWidth();},setWidth:function(width){var iwidth=width-this.pnode.getPadding("lr");this.inner.setWidth(iwidth);this.textEl.setWidth(iwidth-this.inner.getPadding('lr'));this.pnode.setWidth(width);},setHidden:function(hidden){this.hidden=hidden;this.pnode.setStyle('display',hidden?'none':'');},isHidden:function(){return this.hidden;},getText:function(){return this.text;},autoSize:function(){this.el.beginMeasure();this.textEl.setWidth(1);this.setWidth(this.textEl.dom.scrollWidth+this.pnode.getPadding("lr")+this.inner.getPadding('lr'));this.el.endMeasure();},setText:function(text){this.text=text;this.textEl.update(text);this.textEl.dom.title=text;if(!this.tabPanel.resizeTabs){this.autoSize();}},activate:function(){this.tabPanel.activate(this.id);},disable:function(){if(this.tabPanel.active!=this){this.disabled=true;this.pnode.addClass('disabled');}},enable:function(){this.disabled=false;this.pnode.removeClass('disabled');},setContent:function(content,loadScripts){this.bodyEl.update(content,loadScripts);},getUpdateManager:function(){return this.bodyEl.getUpdateManager();},setUrl:function(url,params,loadOnce){if(this.refreshDelegate){this.onActivate.unsubscribe(this.refreshDelegate);}
this.refreshDelegate=this._handleRefresh.createDelegate(this,[url,params,loadOnce]);this.onActivate.subscribe(this.refreshDelegate);return this.bodyEl.getUpdateManager();},_handleRefresh:function(url,params,loadOnce){if(!loadOnce||!this.loaded){var updater=this.bodyEl.getUpdateManager();updater.update(url,params,this._setLoaded.createDelegate(this));}},refresh:function(){if(this.refreshDelegate){this.loaded=false;this.refreshDelegate();}},_setLoaded:function(){this.loaded=true;},closeClick:function(e){var e={};this.fireEvent('beforeclose',this,e);if(e.cancel!==true){this.tabPanel.removeTab(this.id);}},closeText:'Close this tab'};YAHOO.ext.TabPanel.prototype.createStrip=function(container){var strip=document.createElement('div');strip.className='ytab-wrap';container.appendChild(strip);return strip;};YAHOO.ext.TabPanel.prototype.createStripList=function(strip){strip.innerHTML='<div class="ytab-strip-wrap"><table class="ytab-strip" cellspacing="0" cellpadding="0" border="0"><tbody><tr></tr></tbody></table></div>';return strip.firstChild.firstChild.firstChild.firstChild;};YAHOO.ext.TabPanel.prototype.createBody=function(container){var body=document.createElement('div');YAHOO.util.Dom.generateId(body,'tab-body');YAHOO.util.Dom.addClass(body,'yui-ext-tabbody');container.appendChild(body);return body;};YAHOO.ext.TabPanel.prototype.createItemBody=function(bodyEl,id){var body=YAHOO.util.Dom.get(id);if(!body){body=document.createElement('div');body.id=id;}
YAHOO.util.Dom.addClass(body,'yui-ext-tabitembody');bodyEl.insertBefore(body,bodyEl.firstChild);return body;};YAHOO.ext.TabPanel.prototype.createStripElements=function(stripEl,text,closable){var td=document.createElement('td');stripEl.appendChild(td);if(closable){td.className="ytab-closable";if(!this.closeTpl){this.closeTpl=new YAHOO.ext.Template('<a href="#" class="ytab-right"><span class="ytab-left"><em class="ytab-inner">'+'<span unselectable="on" title="{text}" class="ytab-text">{text}</span>'+'<div unselectable="on" class="close-icon">&#160;</div></em></span></a>');}
var el=this.closeTpl.overwrite(td,{'text':text});var close=el.getElementsByTagName('div')[0];var inner=el.getElementsByTagName('em')[0];return{'el':el,'close':close,'inner':inner};}else{if(!this.tabTpl){this.tabTpl=new YAHOO.ext.Template('<a href="#" class="ytab-right"><span class="ytab-left"><em class="ytab-inner">'+'<span unselectable="on" title="{text}" class="ytab-text">{text}</span></em></span></a>');}
var el=this.tabTpl.overwrite(td,{'text':text});var inner=el.getElementsByTagName('em')[0];return{'el':el,'inner':inner};}};
YAHOO.ext.Resizable=function(el,config){var getEl=YAHOO.ext.Element.get;this.el=getEl(el,true);this.el.autoBoxAdjust=true;if(this.el.getStyle('position')!='absolute'){this.el.setStyle('position','relative');}
var dh=YAHOO.ext.DomHelper;var tpl=dh.createTemplate({tag:'div',cls:'yresizable-handle yresizable-handle-{0}',html:'&nbsp;'});this.east=getEl(tpl.append(this.el.dom,['east']),true);this.south=getEl(tpl.append(this.el.dom,['south']),true);if(config&&config.multiDirectional){this.west=getEl(tpl.append(this.el.dom,['west']),true);this.north=getEl(tpl.append(this.el.dom,['north']),true);}
this.corner=getEl(tpl.append(this.el.dom,['southeast']),true);this.proxy=getEl(dh.insertBefore(document.body.firstChild,{tag:'div',cls:'yresizable-proxy',id:this.el.id+'-rzproxy'}),true);this.proxy.autoBoxAdjust=true;this.moveHandler=YAHOO.ext.EventManager.wrap(this.onMouseMove,this,true);this.upHandler=YAHOO.ext.EventManager.wrap(this.onMouseUp,this,true);this.selHandler=YAHOO.ext.EventManager.wrap(this.cancelSelection,this,true);this.events={'beforeresize':new YAHOO.util.CustomEvent(),'resize':new YAHOO.util.CustomEvent()};this.dir=null;this.resizeChild=false;this.adjustments=[0,0];this.minWidth=5;this.minHeight=5;this.maxWidth=10000;this.maxHeight=10000;this.enabled=true;this.animate=false;this.duration=.35;this.dynamic=false;this.multiDirectional=false;this.disableTrackOver=false;this.easing=YAHOO.util.Easing?YAHOO.util.Easing.easeOutStrong:null;YAHOO.ext.util.Config.apply(this,config);if(this.resizeChild){if(typeof this.resizeChild=='boolean'){this.resizeChild=YAHOO.ext.Element.get(this.el.dom.firstChild,true);}else{this.resizeChild=YAHOO.ext.Element.get(this.resizeChild,true);}}
var mdown=this.onMouseDown.createDelegate(this);this.east.mon('mousedown',mdown);this.south.mon('mousedown',mdown);if(this.multiDirectional){this.west.mon('mousedown',mdown);this.north.mon('mousedown',mdown);}
this.corner.mon('mousedown',mdown);if(!this.disableTrackOver){var mover=this.onMouseOver.createDelegate(this);var mout=this.onMouseOut.createDelegate(this);this.east.mon('mouseover',mover);this.east.mon('mouseout',mout);this.south.mon('mouseover',mover);this.south.mon('mouseout',mout);if(this.multiDirectional){this.west.mon('mouseover',mover);this.west.mon('mouseout',mout);this.north.mon('mouseover',mover);this.north.mon('mouseout',mout);}
this.corner.mon('mouseover',mover);this.corner.mon('mouseout',mout);}
this.updateChildSize();};YAHOO.extendX(YAHOO.ext.Resizable,YAHOO.ext.util.Observable,{resizeTo:function(width,height){this.el.setSize(width,height);this.fireEvent('resize',this,width,height,null);},cancelSelection:function(e){e.preventDefault();},startSizing:function(e){this.fireEvent('beforeresize',this,e);if(this.enabled){e.preventDefault();this.startBox=this.el.getBox();this.startPoint=e.getXY();this.offsets=[(this.startBox.x+this.startBox.width)-this.startPoint[0],(this.startBox.y+this.startBox.height)-this.startPoint[1]];this.proxy.setBox(this.startBox);if(!this.dynamic){this.proxy.show();}
YAHOO.util.Event.on(document.body,'selectstart',this.selHandler);YAHOO.util.Event.on(document.body,'mousemove',this.moveHandler);YAHOO.util.Event.on(document.body,'mouseup',this.upHandler);}},onMouseDown:function(e){if(this.enabled){var t=e.getTarget();if(t==this.corner.dom){this.dir='both';this.proxy.setStyle('cursor',this.corner.getStyle('cursor'));this.startSizing(e);}else if(t==this.east.dom){this.dir='east';this.proxy.setStyle('cursor',this.east.getStyle('cursor'));this.startSizing(e);}else if(t==this.south.dom){this.dir='south';this.proxy.setStyle('cursor',this.south.getStyle('cursor'));this.startSizing(e);}else if(t==this.west.dom){this.dir='west';this.proxy.setStyle('cursor',this.west.getStyle('cursor'));this.startSizing(e);}else if(t==this.north.dom){this.dir='north';this.proxy.setStyle('cursor',this.north.getStyle('cursor'));this.startSizing(e);}}},onMouseUp:function(e){YAHOO.util.Event.removeListener(document.body,'selectstart',this.selHandler);YAHOO.util.Event.removeListener(document.body,'mousemove',this.moveHandler);YAHOO.util.Event.removeListener(document.body,'mouseup',this.upHandler);var size=this.resizeElement();this.fireEvent('resize',this,size.width,size.height,e);},updateChildSize:function(){if(this.resizeChild&&this.el.dom.offsetWidth){var el=this.el;var child=this.resizeChild;var adj=this.adjustments;setTimeout(function(){var b=el.getBox(true);child.setSize(b.width+adj[0],b.height+adj[1]);},1);}},snap:function(value,inc){if(!inc||!value)return value;var newValue=value;var m=value%inc;if(m>0){if(m>(inc/2)){newValue=value+(inc-m);}else{newValue=value-m;}}
return newValue;},resizeElement:function(){var box=this.proxy.getBox();box.width=this.snap(box.width,this.widthIncrement);box.height=this.snap(box.height,this.heightIncrement);if(this.multiDirectional){this.el.setBox(box,false,this.animate,this.duration,null,this.easing);}else{this.el.setSize(box.width,box.height,this.animate,this.duration,null,this.easing);}
this.updateChildSize();this.proxy.hide();return box;},onMouseMove:function(e){if(this.enabled){var xy=e.getXY();if(this.dir=='both'||this.dir=='east'||this.dir=='south'){var w=Math.min(Math.max(this.minWidth,xy[0]-this.startBox.x+this.offsets[0]),this.maxWidth);var h=Math.min(Math.max(this.minHeight,xy[1]-this.startBox.y+this.offsets[1]),this.maxHeight);if(this.dir=='both'){this.proxy.setSize(w,h);}else if(this.dir=='east'){this.proxy.setWidth(w);}else if(this.dir=='south'){this.proxy.setHeight(h);}}else{var x=this.startBox.x+(xy[0]-this.startPoint[0]);var y=this.startBox.y+(xy[1]-this.startPoint[1]);var w=this.startBox.width+(this.startBox.x-x);var h=this.startBox.height+(this.startBox.y-y);if(this.dir=='west'&&w<=this.maxWidth&&w>=this.minWidth){this.proxy.setX(x);this.proxy.setWidth(w);}else if(this.dir=='north'&&h<=this.maxHeight&&h>=this.minHeight){this.proxy.setY(y);this.proxy.setHeight(h);}}
if(this.dynamic){this.resizeElement();}}},onMouseOver:function(){if(this.enabled)this.el.addClass('yresizable-over');},onMouseOut:function(){this.el.removeClass('yresizable-over');}});
YAHOO.namespace('ext.state');YAHOO.ext.state.Provider=function(){YAHOO.ext.state.Provider.superclass.constructor.call(this);this.events={'statechange':new YAHOO.util.CustomEvent('statechange')};this.state={};};YAHOO.extendX(YAHOO.ext.state.Provider,YAHOO.ext.util.Observable,{get:function(name,defaultValue){return typeof this.state[name]=='undefined'?defaultValue:this.state[name];},clear:function(name){delete this.state[name];this.fireEvent('statechange',this,name,null);},set:function(name,value){this.state[name]=value;this.fireEvent('statechange',this,name,value);},decodeValue:function(cookie){var re=/^(a|n|d|b|s|o)\:(.*)$/;var matches=re.exec(unescape(cookie));if(!matches||!matches[1])return;var type=matches[1];var v=matches[2];switch(type){case'n':return parseFloat(v);case'd':return new Date(Date.parse(v));case'b':return(v=='1');case'a':var all=[];var values=v.split('^');for(var i=0,len=values.length;i<len;i++){all.push(this.decodeValue(values[i]))}
return all;case'o':var all={};var values=v.split('^');for(var i=0,len=values.length;i<len;i++){var kv=values[i].split('=');all[kv[0]]=this.decodeValue(kv[1]);}
return all;default:return v;}},encodeValue:function(v){var enc;if(typeof v=='number'){enc='n:'+v;}else if(typeof v=='boolean'){enc='b:'+(v?'1':'0');}else if(v instanceof Date){enc='d:'+v.toGMTString();}else if(v instanceof Array){var flat='';for(var i=0,len=v.length;i<len;i++){flat+=this.encodeValue(v[i]);if(i!=len-1)flat+='^';}
enc='a:'+flat;}else if(typeof v=='object'){var flat='';for(var key in v){if(typeof v[key]!='function'){flat+=key+'='+this.encodeValue(v[key])+'^';}}
enc='o:'+flat.substring(0,flat.length-1);}else{enc='s:'+v;}
return escape(enc);}});YAHOO.ext.state.Manager=new function(){var provider=new YAHOO.ext.state.Provider();return{setProvider:function(stateProvider){provider=stateProvider;},get:function(key,defaultValue){return provider.get(key,defaultValue);},set:function(key,value){provider.set(key,value);},clear:function(key){provider.clear(key);},getProvider:function(){return provider;}};}();YAHOO.ext.state.CookieProvider=function(config){YAHOO.ext.state.CookieProvider.superclass.constructor.call(this);this.path='/';this.expires=new Date(new Date().getTime()+(1000*60*60*24*7));this.domain=null;this.secure=false;YAHOO.ext.util.Config.apply(this,config);this.state=this.readCookies();};YAHOO.extendX(YAHOO.ext.state.CookieProvider,YAHOO.ext.state.Provider,{set:function(name,value){if(typeof value=='undefined'||value===null){this.clear(name);return;}
this.setCookie(name,value);YAHOO.ext.state.CookieProvider.superclass.set.call(this,name,value);},clear:function(name){this.clearCookie(name);YAHOO.ext.state.CookieProvider.superclass.clear.call(this,name);},readCookies:function(){var cookies={};var c=document.cookie+';';var re=/\s?(.*?)=(.*?);/g;var matches;while((matches=re.exec(c))!=null){var name=matches[1];var value=matches[2];if(name&&name.substring(0,3)=='ys-'){cookies[name.substr(3)]=this.decodeValue(value);}}
return cookies;},setCookie:function(name,value){document.cookie="ys-"+name+"="+this.encodeValue(value)+
((this.expires==null)?"":("; expires="+this.expires.toGMTString()))+
((this.path==null)?"":("; path="+this.path))+
((this.domain==null)?"":("; domain="+this.domain))+
((this.secure==true)?"; secure":"");},clearCookie:function(name){document.cookie="ys-"+name+"=null; expires=Thu, 01-Jan-70 00:00:01 GMT"+
((this.path==null)?"":("; path="+this.path))+
((this.domain==null)?"":("; domain="+this.domain))+
((this.secure==true)?"; secure":"");}});
YAHOO.ext.BasicDialog=function(el,config){this.el=getEl(el);var dh=YAHOO.ext.DomHelper;if(!this.el&&config&&config.autoCreate){if(typeof config.autoCreate=='object'){if(!config.autoCreate.id){config.autoCreate.id=el;}
this.el=dh.append(document.body,config.autoCreate,true);}else{this.el=dh.append(document.body,{tag:'div',id:el},true);}}
el=this.el;el.setDisplayed(true);el.hide=this.hideAction;this.id=el.id;el.addClass('ydlg');this.shadowOffset=3;this.minHeight=80;this.minWidth=200;this.minButtonWidth=75;this.defaultButton=null;YAHOO.ext.util.Config.apply(this,config);this.proxy=el.createProxy('ydlg-proxy');this.proxy.hide=this.hideAction;this.proxy.setOpacity(.5);this.proxy.hide();if(config.width){el.setWidth(config.width);}
if(config.height){el.setHeight(config.height);}
this.size=el.getSize();if(typeof config.x!='undefined'&&typeof config.y!='undefined'){this.xy=[config.x,config.y];}else{this.xy=el.getCenterXY(true);}
var cn=el.dom.childNodes;for(var i=0,len=cn.length;i<len;i++){var node=cn[i];if(node&&node.nodeType==1){if(YAHOO.util.Dom.hasClass(node,'ydlg-hd')){this.header=getEl(node,true);}else if(YAHOO.util.Dom.hasClass(node,'ydlg-bd')){this.body=getEl(node,true);}else if(YAHOO.util.Dom.hasClass(node,'ydlg-ft')){this.footer=getEl(node,true);}}}
if(!this.header){this.header=dh.append(el.dom,{tag:'div',cls:'ydlg-hd'},true);}
if(this.title){this.header.update(this.title);}
if(!this.body){this.body=dh.append(el.dom,{tag:'div',cls:'ydlg-bd'},true);}
var hl=dh.insertBefore(this.header.dom,{tag:'div',cls:'ydlg-hd-left'});var hr=dh.append(hl,{tag:'div',cls:'ydlg-hd-right'});hr.appendChild(this.header.dom);this.bwrap=dh.insertBefore(this.body.dom,{tag:'div',cls:'ydlg-dlg-body'},true);this.bwrap.dom.appendChild(this.body.dom);if(this.footer)this.bwrap.dom.appendChild(this.footer.dom);if(this.autoScroll!==false&&!this.autoTabs){this.body.setStyle('overflow','auto');}
if(this.closable!==false){this.el.addClass('ydlg-closable');this.close=dh.append(el.dom,{tag:'div',cls:'ydlg-close'},true);this.close.mon('click',function(){this.hide();},this,true);}
if(this.resizable!==false){this.el.addClass('ydlg-resizable');this.resizer=new YAHOO.ext.Resizable(el,{minWidth:this.minWidth||80,minHeight:this.minHeight||80,handles:'all',pinned:true});this.resizer.on('beforeresize',this.beforeResize,this,true);this.resizer.on('resize',this.onResize,this,true);}
if(this.draggable!==false){el.addClass('ydlg-draggable');if(!this.proxyDrag){var dd=new YAHOO.util.DD(el.dom.id,'WindowDrag');}
else{var dd=new YAHOO.util.DDProxy(el.dom.id,'WindowDrag',{dragElId:this.proxy.id});}
dd.setHandleElId(this.header.id);dd.endDrag=this.endMove.createDelegate(this);dd.startDrag=this.startMove.createDelegate(this);dd.onDrag=this.onDrag.createDelegate(this);this.dd=dd;}
if(this.modal){this.mask=dh.append(document.body,{tag:'div',cls:'ydlg-mask'},true);this.mask.enableDisplayMode('block');this.mask.hide();}
if(this.shadow){this.shadow=el.createProxy({tag:'div',cls:'ydlg-shadow'});this.shadow.setOpacity(.3);this.shadow.setVisibilityMode(YAHOO.ext.Element.VISIBILITY);this.shadow.setDisplayed('block');this.shadow.hide=this.hideAction;this.shadow.hide();}else{this.shadowOffset=0;}
if(this.shim){this.shim=this.el.createShim();this.shim.hide=this.hideAction;this.shim.hide();}
if(this.autoTabs){var tabEls=YAHOO.util.Dom.getElementsByClassName('ydlg-tab',this.tabTag||'div',el.dom);if(tabEls.length>0){this.body.addClass(this.tabPosition=='bottom'?'ytabs-bottom':'ytabs-top');this.tabs=new YAHOO.ext.TabPanel(this.body.dom,this.tabPosition=='bottom');for(var i=0,len=tabEls.length;i<len;i++){var tabEl=tabEls[i];this.tabs.addTab(YAHOO.util.Dom.generateId(tabEl),tabEl.title);tabEl.title='';}
this.tabs.activate(tabEls[0].id);}}
this.syncBodyHeight();this.events={'keydown':true,'move':true,'resize':true,'beforehide':true,'hide':true,'beforeshow':true,'show':true};el.mon('keydown',this.onKeyDown,this,true);el.mon("mousedown",this.toFront,this,true);YAHOO.ext.EventManager.onWindowResize(this.adjustViewport,this,true);this.el.hide();YAHOO.ext.DialogManager.register(this);};YAHOO.extendX(YAHOO.ext.BasicDialog,YAHOO.ext.util.Observable,{setTitle:function(text){this.header.update(text);return this;},beforeResize:function(){this.resizer.minHeight=Math.max(this.minHeight,this.getHeaderFooterHeight(true)+40);},onResize:function(){this.refreshSize();this.syncBodyHeight();this.adjustAssets();this.fireEvent('resize',this,this.size.width,this.size.height);},onKeyDown:function(e){this.fireEvent('keydown',this,e);},resizeTo:function(width,height){this.el.setSize(width,height);this.size={width:width,height:height};this.syncBodyHeight();if(this.fixedcenter){this.center();}
if(this.isVisible()){this.constrainXY();this.adjustAssets();}
this.fireEvent('resize',this,width,height);return this;},addKeyListener:function(key,fn,scope){var keyCode,shift,ctrl,alt;if(typeof key=='object'&&!(key instanceof Array)){keyCode=key['key'];shift=key['shift'];ctrl=key['ctrl'];alt=key['alt'];}else{keyCode=key;}
var handler=function(dlg,e){if((!shift||e.shiftKey)&&(!ctrl||e.ctrlKey)&&(!alt||e.altKey)){var k=e.getKey();if(keyCode instanceof Array){for(var i=0,len=keyCode.length;i<len;i++){if(keyCode[i]==k){fn.call(scope||window,dlg,k,e);return;}}}else{if(k==keyCode){fn.call(scope||window,dlg,k,e);}}}};this.on('keydown',handler);return this;},getTabs:function(){if(!this.tabs){this.body.addClass(this.tabPosition=='bottom'?'ytabs-bottom':'ytabs-top');this.tabs=new YAHOO.ext.TabPanel(this.body.dom,this.tabPosition=='bottom');}
return this.tabs;},addButton:function(config,handler,scope){var dh=YAHOO.ext.DomHelper;if(!this.footer){this.footer=dh.append(this.bwrap.dom,{tag:'div',cls:'ydlg-ft'},true);}
var bconfig={handler:handler,scope:scope,minWidth:this.minButtonWidth};if(typeof config=='string'){bconfig.text=config;}else{bconfig.dhconfig=config;}
var btn=new YAHOO.ext.Button(this.footer,bconfig);this.syncBodyHeight();if(!this.buttons){this.buttons=[];}
this.buttons.push(btn);return btn;},setDefaultButton:function(btn){this.defaultButton=btn;return this;},getHeaderFooterHeight:function(safe){var height=0;if(this.header){height+=this.header.getHeight();}
if(this.footer){var fm=this.footer.getMargins();height+=(this.footer.getHeight()+fm.top+fm.bottom);}
height+=this.bwrap.getPadding('tb')+this.bwrap.getBorderWidth('tb');return height;},syncBodyHeight:function(){var height=this.size.height-this.getHeaderFooterHeight(false);var bm=this.body.getMargins();this.body.setHeight(height-(bm.top+bm.bottom));if(this.tabs){this.tabs.syncHeight();}
this.bwrap.setHeight(this.size.height-this.header.getHeight());this.body.setWidth(this.el.getWidth(true)-this.bwrap.getBorderWidth('lr')-this.bwrap.getPadding('lr'));},restoreState:function(){var box=YAHOO.ext.state.Manager.get(this.el.id+'-state');if(box&&box.width){this.xy=[box.x,box.y];this.resizeTo(box.width,box.height);}
return this;},beforeShow:function(){if(this.fixedcenter){this.xy=this.el.getCenterXY(true);}
if(this.modal){YAHOO.util.Dom.addClass(document.body,'masked');this.mask.setSize(YAHOO.util.Dom.getDocumentWidth(),YAHOO.util.Dom.getDocumentHeight());this.mask.show();}
this.constrainXY();},animShow:function(){var b=getEl(this.animateTarget,true).getBox();this.proxy.setSize(b.width,b.height);this.proxy.setLocation(b.x,b.y);this.proxy.show();this.proxy.setBounds(this.xy[0],this.xy[1],this.size.width,this.size.height,true,.35,this.showEl.createDelegate(this));},show:function(animateTarget){if(this.fireEvent('beforeshow',this)===false){return;}
if(this.syncHeightBeforeShow){this.syncBodyHeight();}
this.animateTarget=animateTarget||this.animateTarget;if(!this.el.isVisible()){this.beforeShow();if(this.animateTarget){this.animShow();}else{this.showEl();}}
return this;},showEl:function(){this.proxy.hide();this.el.setXY(this.xy);this.el.show();this.adjustAssets(true);this.toFront();if(this.defaultButton){this.defaultButton.focus();}
this.fireEvent('show',this);},constrainXY:function(){if(this.constraintoviewport!==false){if(!this.viewSize){this.viewSize=[YAHOO.util.Dom.getViewportWidth(),YAHOO.util.Dom.getViewportHeight()];}
var x=this.xy[0],y=this.xy[1];var w=this.size.width,h=this.size.height;var vw=this.viewSize[0],vh=this.viewSize[1];var moved=false;if(x+w>vw){x=vw-w;moved=true;}
if(y+h>vh){y=vh-h;moved=true;}
if(x<0){x=0;moved=true;}
if(y<0){y=0;moved=true;}
if(moved){this.xy=[x,y];if(this.isVisible()){this.el.setLocation(x,y);this.adjustAssets();}}}},onDrag:function(){if(!this.proxyDrag){this.xy=this.el.getXY();this.adjustAssets();}},adjustAssets:function(doShow){var x=this.xy[0],y=this.xy[1];var w=this.size.width,h=this.size.height;if(doShow===true){if(this.shadow){this.shadow.show();}
if(this.shim){this.shim.show();}}
if(this.shadow&&this.shadow.isVisible()){this.shadow.setBounds(x+this.shadowOffset,y+this.shadowOffset,w,h);}
if(this.shim&&this.shim.isVisible()){this.shim.setBounds(x,y,w,h);}},adjustViewport:function(w,h){if(!w||!h){w=YAHOO.util.Dom.getViewportWidth();h=YAHOO.util.Dom.getViewportHeight();}
this.viewSize=[w,h];if(this.modal&&this.mask.isVisible()){this.mask.setSize(w,h);this.mask.setSize(YAHOO.util.Dom.getDocumentWidth(),YAHOO.util.Dom.getDocumentHeight());}
if(this.isVisible()){this.constrainXY();}},destroy:function(removeEl){YAHOO.ext.EventManager.removeResizeListener(this.adjustViewport,this);if(this.tabs){this.tabs.destroy(removeEl);}
if(removeEl===true){this.el.update('');this.el.remove();}
YAHOO.ext.DialogManager.unregister(this);},startMove:function(){if(this.proxyDrag){this.proxy.show();}
if(this.constraintoviewport!==false){this.dd.constrainTo(document.body,{right:this.shadowOffset,bottom:this.shadowOffset});}},endMove:function(){if(!this.proxyDrag){YAHOO.util.DD.prototype.endDrag.apply(this.dd,arguments);}else{YAHOO.util.DDProxy.prototype.endDrag.apply(this.dd,arguments);this.proxy.hide();}
this.refreshSize();this.adjustAssets();this.fireEvent('move',this,this.xy[0],this.xy[1])},toFront:function(){YAHOO.ext.DialogManager.bringToFront(this);return this;},toBack:function(){YAHOO.ext.DialogManager.sendToBack(this);return this;},center:function(){this.moveTo(this.el.getCenterXY(true));return this;},moveTo:function(x,y){this.xy=[x,y];if(this.isVisible()){this.el.setXY(this.xy);this.adjustAssets();}
return this;},isVisible:function(){return this.el.isVisible();},animHide:function(callback){var b=getEl(this.animateTarget,true).getBox();this.proxy.show();this.proxy.setBounds(this.xy[0],this.xy[1],this.size.width,this.size.height);this.el.hide();this.proxy.setBounds(b.x,b.y,b.width,b.height,true,.35,this.hideEl.createDelegate(this,[callback]));},hide:function(callback){if(this.fireEvent('beforehide',this)===false)
return;if(this.shadow){this.shadow.hide();}
if(this.shim){this.shim.hide();}
if(this.animateTarget){this.animHide(callback);}else{this.el.hide();this.hideEl(callback);}
return this;},hideEl:function(callback){this.proxy.hide();if(this.modal){this.mask.hide();YAHOO.util.Dom.removeClass(document.body,'masked');}
this.fireEvent('hide',this);if(typeof callback=='function'){callback();}},hideAction:function(){this.setLeft('-10000px');this.setTop('-10000px');this.setStyle('visibility','hidden');},refreshSize:function(){this.size=this.el.getSize();this.xy=this.el.getXY();YAHOO.ext.state.Manager.set(this.el.id+'-state',this.el.getBox());},setZIndex:function(index){if(this.modal){this.mask.setStyle('z-index',index);}
if(this.shadow){this.shadow.setStyle('z-index',++index);}
if(this.shim){this.shim.setStyle('z-index',++index);}
this.el.setStyle('z-index',++index);if(this.proxy){this.proxy.setStyle('z-index',++index);}
if(this.resizer){this.resizer.proxy.setStyle('z-index',++index);}
this.lastZIndex=index;},getEl:function(){return this.el;}});YAHOO.ext.DialogManager=function(){var list={};var accessList=[];var front=null;var sortDialogs=function(d1,d2){return(!d1._lastAccess||d1._lastAccess<d2._lastAccess)?-1:1;};var orderDialogs=function(){accessList.sort(sortDialogs);var seed=YAHOO.ext.DialogManager.zseed;for(var i=0,len=accessList.length;i<len;i++){if(accessList[i]){accessList[i].setZIndex(seed+(i*10));}}};return{zseed:10000,register:function(dlg){list[dlg.id]=dlg;accessList.push(dlg);},unregister:function(dlg){delete list[dlg.id];if(!accessList.indexOf){for(var i=0,len=accessList.length;i<len;i++){accessList.splice(i,1);return;}}else{var i=accessList.indexOf(dlg);if(i!=-1){accessList.splice(i,1);}}},get:function(id){return typeof id=='object'?id:list[id];},bringToFront:function(dlg){dlg=this.get(dlg);if(dlg!=front){front=dlg;dlg._lastAccess=new Date().getTime();orderDialogs();}
return dlg;},sendToBack:function(dlg){dlg=this.get(dlg);dlg._lastAccess=-(new Date().getTime());orderDialogs();return dlg;}};}();YAHOO.ext.LayoutDialog=function(el,config){config.autoTabs=false;YAHOO.ext.LayoutDialog.superclass.constructor.call(this,el,config);this.body.setStyle({overflow:'hidden',position:'relative'});this.layout=new YAHOO.ext.BorderLayout(this.body.dom,config);this.layout.monitorWindowResize=false;this.center=YAHOO.ext.BasicDialog.prototype.center;this.on('show',this.layout.layout,this.layout,true);};YAHOO.extendX(YAHOO.ext.LayoutDialog,YAHOO.ext.BasicDialog,{endUpdate:function(){this.layout.endUpdate();},beginUpdate:function(){this.layout.beginUpdate();},getLayout:function(){return this.layout;},syncBodyHeight:function(){YAHOO.ext.LayoutDialog.superclass.syncBodyHeight.call(this);if(this.layout)this.layout.layout();}});
if(YAHOO.util.DragDropMgr){YAHOO.util.DragDropMgr.clickTimeThresh=350;}
YAHOO.ext.SplitBar=function(dragElement,resizingElement,orientation,placement){this.el=YAHOO.ext.Element.get(dragElement,true);this.el.dom.unselectable='on';this.resizingEl=YAHOO.ext.Element.get(resizingElement,true);this.orientation=orientation||YAHOO.ext.SplitBar.HORIZONTAL;this.minSize=0;this.maxSize=2000;this.onMoved=new YAHOO.util.CustomEvent("SplitBarMoved",this);this.animate=false;this.useShim=false;this.shim=null;this.proxy=YAHOO.ext.SplitBar.createProxy(this.orientation);this.dd=new YAHOO.util.DDProxy(this.el.dom.id,"SplitBars",{dragElId:this.proxy.id});this.dd.b4StartDrag=this.onStartProxyDrag.createDelegate(this);this.dd.endDrag=this.onEndProxyDrag.createDelegate(this);this.dragSpecs={};this.adapter=new YAHOO.ext.SplitBar.BasicLayoutAdapter();this.adapter.init(this);if(this.orientation==YAHOO.ext.SplitBar.HORIZONTAL){this.placement=placement||(this.el.getX()>this.resizingEl.getX()?YAHOO.ext.SplitBar.LEFT:YAHOO.ext.SplitBar.RIGHT);this.el.setStyle('cursor','e-resize');}else{this.placement=placement||(this.el.getY()>this.resizingEl.getY()?YAHOO.ext.SplitBar.TOP:YAHOO.ext.SplitBar.BOTTOM);this.el.setStyle('cursor','n-resize');}
this.events={'resize':this.onMoved,'moved':this.onMoved,'beforeresize':new YAHOO.util.CustomEvent('beforeresize')}}
YAHOO.extendX(YAHOO.ext.SplitBar,YAHOO.ext.util.Observable,{onStartProxyDrag:function(x,y){this.fireEvent('beforeresize',this);if(this.useShim){if(!this.shim){this.shim=YAHOO.ext.SplitBar.createShim();}
this.shim.setVisible(true);}
YAHOO.util.Dom.setStyle(this.proxy,'display','block');var size=this.adapter.getElementSize(this);this.activeMinSize=this.getMinimumSize();;this.activeMaxSize=this.getMaximumSize();;var c1=size-this.activeMinSize;var c2=Math.max(this.activeMaxSize-size,0);if(this.orientation==YAHOO.ext.SplitBar.HORIZONTAL){this.dd.resetConstraints();this.dd.setXConstraint(this.placement==YAHOO.ext.SplitBar.LEFT?c1:c2,this.placement==YAHOO.ext.SplitBar.LEFT?c2:c1);this.dd.setYConstraint(0,0);}else{this.dd.resetConstraints();this.dd.setXConstraint(0,0);this.dd.setYConstraint(this.placement==YAHOO.ext.SplitBar.TOP?c1:c2,this.placement==YAHOO.ext.SplitBar.TOP?c2:c1);}
this.dragSpecs.startSize=size;this.dragSpecs.startPoint=[x,y];YAHOO.util.DDProxy.prototype.b4StartDrag.call(this.dd,x,y);},onEndProxyDrag:function(e){YAHOO.util.Dom.setStyle(this.proxy,'display','none');var endPoint=YAHOO.util.Event.getXY(e);if(this.useShim){this.shim.setVisible(false);}
var newSize;if(this.orientation==YAHOO.ext.SplitBar.HORIZONTAL){newSize=this.dragSpecs.startSize+
(this.placement==YAHOO.ext.SplitBar.LEFT?endPoint[0]-this.dragSpecs.startPoint[0]:this.dragSpecs.startPoint[0]-endPoint[0]);}else{newSize=this.dragSpecs.startSize+
(this.placement==YAHOO.ext.SplitBar.TOP?endPoint[1]-this.dragSpecs.startPoint[1]:this.dragSpecs.startPoint[1]-endPoint[1]);}
newSize=Math.min(Math.max(newSize,this.activeMinSize),this.activeMaxSize);if(newSize!=this.dragSpecs.startSize){this.adapter.setElementSize(this,newSize);this.onMoved.fireDirect(this,newSize);}},getAdapter:function(){return this.adapter;},setAdapter:function(adapter){this.adapter=adapter;this.adapter.init(this);},getMinimumSize:function(){return this.minSize;},setMinimumSize:function(minSize){this.minSize=minSize;},getMaximumSize:function(){return this.maxSize;},setMaximumSize:function(maxSize){this.maxSize=maxSize;},setCurrentSize:function(size){var oldAnimate=this.animate;this.animate=false;this.adapter.setElementSize(this,size);this.animate=oldAnimate;},destroy:function(removeEl){if(this.shim){this.shim.remove();}
this.dd.unreg();this.proxy.parentNode.removeChild(this.proxy);if(removeEl){this.el.remove();}}});YAHOO.ext.SplitBar.createShim=function(){var shim=document.createElement('div');shim.unselectable='on';YAHOO.util.Dom.generateId(shim,'split-shim');YAHOO.util.Dom.setStyle(shim,'width','100%');YAHOO.util.Dom.setStyle(shim,'height','100%');YAHOO.util.Dom.setStyle(shim,'position','absolute');YAHOO.util.Dom.setStyle(shim,'background','white');YAHOO.util.Dom.setStyle(shim,'z-index',11000);window.document.body.appendChild(shim);var shimEl=YAHOO.ext.Element.get(shim);shimEl.setOpacity(.01);shimEl.setXY([0,0]);return shimEl;};YAHOO.ext.SplitBar.createProxy=function(orientation){var proxy=document.createElement('div');proxy.unselectable='on';YAHOO.util.Dom.generateId(proxy,'split-proxy');YAHOO.util.Dom.setStyle(proxy,'position','absolute');YAHOO.util.Dom.setStyle(proxy,'visibility','hidden');YAHOO.util.Dom.setStyle(proxy,'z-index',11001);YAHOO.util.Dom.setStyle(proxy,'background-color',"#aaa");if(orientation==YAHOO.ext.SplitBar.HORIZONTAL){YAHOO.util.Dom.setStyle(proxy,'cursor','e-resize');}else{YAHOO.util.Dom.setStyle(proxy,'cursor','n-resize');}
YAHOO.util.Dom.setStyle(proxy,'line-height','0px');YAHOO.util.Dom.setStyle(proxy,'font-size','0px');window.document.body.appendChild(proxy);return proxy;};YAHOO.ext.SplitBar.BasicLayoutAdapter=function(){};YAHOO.ext.SplitBar.BasicLayoutAdapter.prototype={init:function(s){},getElementSize:function(s){if(s.orientation==YAHOO.ext.SplitBar.HORIZONTAL){return s.resizingEl.getWidth();}else{return s.resizingEl.getHeight();}},setElementSize:function(s,newSize,onComplete){if(s.orientation==YAHOO.ext.SplitBar.HORIZONTAL){if(!YAHOO.util.Anim||!s.animate){s.resizingEl.setWidth(newSize);if(onComplete){onComplete(s,newSize);}}else{s.resizingEl.setWidth(newSize,true,.1,onComplete,YAHOO.util.Easing.easeOut);}}else{if(!YAHOO.util.Anim||!s.animate){s.resizingEl.setHeight(newSize);if(onComplete){onComplete(s,newSize);}}else{s.resizingEl.setHeight(newSize,true,.1,onComplete,YAHOO.util.Easing.easeOut);}}}};YAHOO.ext.SplitBar.AbsoluteLayoutAdapter=function(container){this.basic=new YAHOO.ext.SplitBar.BasicLayoutAdapter();this.container=getEl(container);}
YAHOO.ext.SplitBar.AbsoluteLayoutAdapter.prototype={init:function(s){this.basic.init(s);},getElementSize:function(s){return this.basic.getElementSize(s);},setElementSize:function(s,newSize,onComplete){this.basic.setElementSize(s,newSize,this.moveSplitter.createDelegate(this,[s]));},moveSplitter:function(s){var yes=YAHOO.ext.SplitBar;switch(s.placement){case yes.LEFT:s.el.setX(s.resizingEl.getRight());break;case yes.RIGHT:s.el.setStyle('right',(this.container.getWidth()-s.resizingEl.getLeft())+'px');break;case yes.TOP:s.el.setY(s.resizingEl.getBottom());break;case yes.BOTTOM:s.el.setY(s.resizingEl.getTop()-s.el.getHeight());break;}}};YAHOO.ext.SplitBar.VERTICAL=1;YAHOO.ext.SplitBar.HORIZONTAL=2;YAHOO.ext.SplitBar.LEFT=1;YAHOO.ext.SplitBar.RIGHT=2;YAHOO.ext.SplitBar.TOP=3;YAHOO.ext.SplitBar.BOTTOM=4;
YAHOO.ext.util.MixedCollection=function(allowFunctions){this.items=[];this.keys=[];this.events={'clear':new YAHOO.util.CustomEvent('clear'),'add':new YAHOO.util.CustomEvent('add'),'replace':new YAHOO.util.CustomEvent('replace'),'remove':new YAHOO.util.CustomEvent('remove')}
this.allowFunctions=allowFunctions===true;};YAHOO.extendX(YAHOO.ext.util.MixedCollection,YAHOO.ext.util.Observable,{allowFunctions:false,add:function(key,o){if(arguments.length==1){o=arguments[0];key=this.getKey(o);}
this.items.push(o);if(typeof key!='undefined'&&key!=null){this.items[key]=o;this.keys.push(key);}
this.fireEvent('add',this.items.length-1,o,key);return o;},getKey:function(o){return null;},replace:function(key,o){if(arguments.length==1){o=arguments[0];key=this.getKey(o);}
if(typeof this.items[key]=='undefined'){return this.add(key,o);}
var old=this.items[key];if(typeof key=='number'){this.items[key]=o;}else{var index=this.indexOfKey(key);this.items[index]=o;this.items[key]=o;}
this.fireEvent('replace',key,old,o);return o;},addAll:function(objs){if(arguments.length>1||objs instanceof Array){var args=arguments.length>1?arguments:objs;for(var i=0,len=args.length;i<len;i++){this.add(args[i]);}}else{for(var key in objs){if(this.allowFunctions||typeof objs[key]!='function'){this.add(objs[key],key);}}}},each:function(fn,scope){for(var i=0,len=this.items.length;i<len;i++){fn.call(scope||window,this.items[i]);}},eachKey:function(fn,scope){for(var i=0,len=this.keys.length;i<len;i++){fn.call(scope||window,this.keys[i],this.items[i]);}},find:function(fn,scope){for(var i=0,len=this.items.length;i<len;i++){if(fn.call(scope||window,this.items[i])){return this.items[i];}}
return null;},insert:function(index,key,o){if(arguments.length==2){o=arguments[1];key=this.getKey(o);}
if(index>=this.items.length){return this.add(o,key);}
this.items.splice(index,0,o);if(typeof key!='undefined'&&key!=null){this.items[key]=o;this.keys.splice(index,0,key);}
this.fireEvent('add',index,o,key);return o;},remove:function(o){var index=this.indexOf(o);this.items.splice(index,1);if(typeof this.keys[index]!='undefined'){var key=this.keys[index];this.keys.splice(index,1);delete this.items[key];}
this.fireEvent('remove',o);return o;},removeAt:function(index){this.items.splice(index,1);var key=this.keys[index];if(typeof key!='undefined'){this.keys.splice(index,1);delete this.items[key];}
this.fireEvent('remove',o,key);},removeKey:function(key){var o=this.items[key];var index=this.indexOf(o);this.items.splice(index,1);this.keys.splice(index,1);delete this.items[key];this.fireEvent('remove',o,key);},getCount:function(){return this.items.length;},indexOf:function(o){if(!this.items.indexOf){for(var i=0,len=this.items.length;i<len;i++){if(this.items[i]==o)return i;}
return-1;}else{return this.items.indexOf(o);}},indexOfKey:function(key){if(!this.keys.indexOf){for(var i=0,len=this.keys.length;i<len;i++){if(this.keys[i]==key)return i;}
return-1;}else{return this.keys.indexOf(key);}},item:function(key){return this.items[key];},contains:function(o){return this.indexOf(o)!=-1;},containsKey:function(key){return typeof this.items[key]!='undefined';},clear:function(o){this.items=[];this.keys=[];this.fireEvent('clear');},first:function(){return this.items[0];},last:function(){return this.items[this.items.length];}});YAHOO.ext.util.MixedCollection.prototype.get=YAHOO.ext.util.MixedCollection.prototype.item;
YAHOO.ext.LayoutManager=function(container){YAHOO.ext.LayoutManager.superclass.constructor.call(this);this.el=getEl(container,true);this.id=this.el.id;this.el.addClass('ylayout-container');this.monitorWindowResize=true;this.regions={};this.events={'layout':new YAHOO.util.CustomEvent(),'regionresized':new YAHOO.util.CustomEvent(),'regioncollapsed':new YAHOO.util.CustomEvent(),'regionexpanded':new YAHOO.util.CustomEvent()};this.updating=false;YAHOO.ext.EventManager.onWindowResize(this.onWindowResize,this,true);};YAHOO.extendX(YAHOO.ext.LayoutManager,YAHOO.ext.util.Observable,{isUpdating:function(){return this.updating;},beginUpdate:function(){this.updating=true;},endUpdate:function(noLayout){this.updating=false;if(!noLayout){this.layout();}},layout:function(){},onRegionResized:function(region,newSize){this.fireEvent('regionresized',region,newSize);this.layout();},onRegionCollapsed:function(region){this.fireEvent('regioncollapsed',region);},onRegionExpanded:function(region){this.fireEvent('regionexpanded',region);},getViewSize:function(){var size;if(this.el.dom!=document.body){this.el.beginMeasure();size=this.el.getSize();this.el.endMeasure();}else{size={width:YAHOO.util.Dom.getViewportWidth(),height:YAHOO.util.Dom.getViewportHeight()};}
size.width-=this.el.getBorderWidth('lr')-this.el.getPadding('lr');size.height-=this.el.getBorderWidth('tb')-this.el.getPadding('tb');return size;},getEl:function(){return this.el;},getRegion:function(target){return this.regions[target.toLowerCase()];},onWindowResize:function(){if(this.monitorWindowResize){this.layout();}}});
YAHOO.ext.BorderLayout=function(container,config){YAHOO.ext.BorderLayout.superclass.constructor.call(this,container);this.factory=config.factory||YAHOO.ext.BorderLayout.RegionFactory;this.hideOnLayout=config.hideOnLayout||false;for(var i=0,len=this.factory.validRegions.length;i<len;i++){var target=this.factory.validRegions[i];if(config[target]){this.addRegion(target,config[target]);}}};YAHOO.extendX(YAHOO.ext.BorderLayout,YAHOO.ext.LayoutManager,{addRegion:function(target,config){if(!this.regions[target]){var r=this.factory.create(target,this,config);this.regions[target]=r;r.on('visibilitychange',this.layout,this,true);r.on('paneladded',this.layout,this,true);r.on('panelremoved',this.layout,this,true);r.on('invalidated',this.layout,this,true);r.on('resized',this.onRegionResized,this,true);r.on('collapsed',this.onRegionCollapsed,this,true);r.on('expanded',this.onRegionExpanded,this,true);}
return this.regions[target];},layout:function(){if(this.updating)return;var size=this.getViewSize();var w=size.width,h=size.height;var centerW=w,centerH=h,centerY=0,centerX=0;var x=0,y=0;var rs=this.regions;var n=rs['north'],s=rs['south'],west=rs['west'],e=rs['east'],c=rs['center'];if(this.hideOnLayout){c.el.setStyle('display','none');}
if(n&&n.isVisible()){var b=n.getBox();var m=n.getMargins();b.width=w-(m.left+m.right);b.x=m.left;b.y=m.top;centerY=b.height+b.y+m.bottom;centerH-=centerY;n.updateBox(this.safeBox(b));}
if(s&&s.isVisible()){var b=s.getBox();var m=s.getMargins();b.width=w-(m.left+m.right);b.x=m.left;var totalHeight=(b.height+m.top+m.bottom);b.y=h-totalHeight+m.top;centerH-=totalHeight;s.updateBox(this.safeBox(b));}
if(west&&west.isVisible()){var b=west.getBox();var m=west.getMargins();b.height=centerH-(m.top+m.bottom);b.x=m.left;b.y=centerY+m.top;var totalWidth=(b.width+m.left+m.right);centerX+=totalWidth;centerW-=totalWidth;west.updateBox(this.safeBox(b));}
if(e&&e.isVisible()){var b=e.getBox();var m=e.getMargins();b.height=centerH-(m.top+m.bottom);var totalWidth=(b.width+m.left+m.right);b.x=w-totalWidth+m.left;b.y=centerY+m.top;centerW-=totalWidth;e.updateBox(this.safeBox(b));}
if(c){var m=c.getMargins();var centerBox={x:centerX+m.left,y:centerY+m.top,width:centerW-(m.left+m.right),height:centerH-(m.top+m.bottom)};if(this.hideOnLayout){c.el.setStyle('display','block');}
c.updateBox(this.safeBox(centerBox));}
this.el.repaint();this.fireEvent('layout',this);},safeBox:function(box){box.width=Math.max(0,box.width);box.height=Math.max(0,box.height);return box;},add:function(target,panel){target=target.toLowerCase();return this.regions[target].add(panel);},remove:function(target,panel){target=target.toLowerCase();return this.regions[target].remove(panel);},findPanel:function(panelId){var rs=this.regions;for(var target in rs){if(typeof rs[target]!='function'){var p=rs[target].getPanel(panelId);if(p){return p;}}}
return null;},showPanel:function(panelId){var rs=this.regions;for(var target in rs){var r=rs[target];if(typeof r!='function'){if(r.hasPanel(panelId)){return r.showPanel(panelId);}}}
return null;},restoreState:function(provider){if(!provider){provider=YAHOO.ext.state.Manager;}
var sm=new YAHOO.ext.LayoutStateManager();sm.init(this,provider);}});YAHOO.ext.BorderLayout.RegionFactory={};YAHOO.ext.BorderLayout.RegionFactory.validRegions=['north','south','east','west','center'];YAHOO.ext.BorderLayout.RegionFactory.create=function(target,mgr,config){if(config.lightweight){return new YAHOO.ext.LayoutRegionLite(mgr,config);}
target=target.toLowerCase();switch(target){case'north':return new YAHOO.ext.NorthLayoutRegion(mgr,config);case'south':return new YAHOO.ext.SouthLayoutRegion(mgr,config);case'east':return new YAHOO.ext.EastLayoutRegion(mgr,config);case'west':return new YAHOO.ext.WestLayoutRegion(mgr,config);case'center':return new YAHOO.ext.CenterLayoutRegion(mgr,config);}
throw'Layout region "'+target+'" not supported.';};
YAHOO.ext.ContentPanel=function(el,config,content){YAHOO.ext.ContentPanel.superclass.constructor.call(this);this.el=getEl(el,true);if(!this.el&&config&&config.autoCreate){if(typeof config.autoCreate=='object'){if(!config.autoCreate.id){config.autoCreate.id=el;}
this.el=YAHOO.ext.DomHelper.append(document.body,config.autoCreate,true);}else{this.el=YAHOO.ext.DomHelper.append(document.body,{tag:'div',cls:'ylayout-inactive-content',id:el},true);}}
this.closable=false;this.loaded=false;this.active=false;if(typeof config=='string'){this.title=config;}else{YAHOO.ext.util.Config.apply(this,config);}
if(this.resizeEl){this.resizeEl=getEl(this.resizeEl,true);}else{this.resizeEl=this.el;}
this.events={'activate':new YAHOO.util.CustomEvent('activate'),'deactivate':new YAHOO.util.CustomEvent('deactivate')};if(this.autoScroll){this.el.setStyle('overflow','auto');}
if(content){this.setContent(content);}};YAHOO.extendX(YAHOO.ext.ContentPanel,YAHOO.ext.util.Observable,{setRegion:function(region){this.region=region;if(region){this.el.replaceClass('ylayout-inactive-content','ylayout-active-content');}else{this.el.replaceClass('ylayout-active-content','ylayout-inactive-content');}},getToolbar:function(){return this.toolbar;},setActiveState:function(active){this.active=active;if(!active){this.fireEvent('deactivate',this);}else{this.fireEvent('activate',this);}},setContent:function(content,loadScripts){this.el.update(content,loadScripts);},getUpdateManager:function(){return this.el.getUpdateManager();},setUrl:function(url,params,loadOnce){if(this.refreshDelegate){this.removeListener('activate',this.refreshDelegate);}
this.refreshDelegate=this._handleRefresh.createDelegate(this,[url,params,loadOnce]);this.on('activate',this._handleRefresh.createDelegate(this,[url,params,loadOnce]));return this.el.getUpdateManager();},_handleRefresh:function(url,params,loadOnce){if(!loadOnce||!this.loaded){var updater=this.el.getUpdateManager();updater.update(url,params,this._setLoaded.createDelegate(this));}},_setLoaded:function(){this.loaded=true;},getId:function(){return this.el.id;},getEl:function(){return this.el;},adjustForComponents:function(width,height){if(this.toolbar){var te=this.toolbar.getEl();height-=te.getHeight();te.setWidth(width);}
if(this.adjustments){width+=this.adjustments[0];height+=this.adjustments[1];}
return{'width':width,'height':height};},setSize:function(width,height){if(this.fitToFrame){var size=this.adjustForComponents(width,height);this.resizeEl.setSize(this.autoWidth?'auto':size.width,size.height);}},getTitle:function(){return this.title;},setTitle:function(title){this.title=title;if(this.region){this.region.updatePanelTitle(this,title);}},isClosable:function(){return this.closable;},beforeSlide:function(){this.el.clip();this.resizeEl.clip();},afterSlide:function(){this.el.unclip();this.resizeEl.unclip();},refresh:function(){if(this.refreshDelegate){this.loaded=false;this.refreshDelegate();}},destroy:function(){this.el.removeAllListeners();var tempEl=document.createElement('span');tempEl.appendChild(this.el.dom);tempEl.innerHTML='';this.el=null;}});YAHOO.ext.GridPanel=function(grid,config){this.wrapper=YAHOO.ext.DomHelper.append(document.body,{tag:'div',cls:'ylayout-grid-wrapper ylayout-inactive-content'},true);this.wrapper.dom.appendChild(grid.container.dom);YAHOO.ext.GridPanel.superclass.constructor.call(this,this.wrapper,config);if(this.toolbar){this.toolbar.el.insertBefore(this.wrapper.dom.firstChild);}
grid.monitorWindowResize=false;grid.autoHeight=false;grid.autoWidth=false;this.grid=grid;this.grid.container.replaceClass('ylayout-inactive-content','ylayout-component-panel');};YAHOO.extendX(YAHOO.ext.GridPanel,YAHOO.ext.ContentPanel,{getId:function(){return this.grid.id;},getGrid:function(){return this.grid;},setSize:function(width,height){var grid=this.grid;var size=this.adjustForComponents(width,height);grid.container.setSize(size.width,size.height);grid.autoSize();},beforeSlide:function(){this.grid.getView().wrapEl.clip();},afterSlide:function(){this.grid.getView().wrapEl.unclip();},destroy:function(){this.grid.getView().unplugDataModel(this.grid.getDataModel());this.grid.container.removeAllListeners();YAHOO.ext.GridPanel.superclass.destroy.call(this);}});YAHOO.ext.NestedLayoutPanel=function(layout,config){YAHOO.ext.NestedLayoutPanel.superclass.constructor.call(this,layout.getEl(),config);layout.monitorWindowResize=false;this.layout=layout;this.layout.getEl().addClass('ylayout-nested-layout');};YAHOO.extendX(YAHOO.ext.NestedLayoutPanel,YAHOO.ext.ContentPanel,{setSize:function(width,height){var size=this.adjustForComponents(width,height);this.layout.getEl().setSize(size.width,size.height);this.layout.layout();},getLayout:function(){return this.layout;}});
YAHOO.ext.LayoutRegion=function(mgr,config,pos){this.mgr=mgr;this.position=pos;var dh=YAHOO.ext.DomHelper;this.el=dh.append(mgr.el.dom,{tag:'div',cls:'ylayout-panel ylayout-panel-'+this.position},true);this.titleEl=dh.append(this.el.dom,{tag:'div',unselectable:'on',cls:'yunselectable ylayout-panel-hd ylayout-title-'+this.position,children:[{tag:'span',cls:'yunselectable ylayout-panel-hd-text',unselectable:'on',html:'&#160;'},{tag:'div',cls:'yunselectable ylayout-panel-hd-tools',unselectable:'on'}]},true);this.titleEl.enableDisplayMode();this.titleTextEl=this.titleEl.dom.firstChild;this.tools=getEl(this.titleEl.dom.childNodes[1],true);this.closeBtn=this.createTool(this.tools.dom,'ylayout-close');this.closeBtn.enableDisplayMode();this.closeBtn.on('click',this.closeClicked,this,true);this.closeBtn.hide();this.bodyEl=dh.append(this.el.dom,{tag:'div',cls:'ylayout-panel-body'},true);this.events={'beforeremove':new YAHOO.util.CustomEvent('beforeremove'),'invalidated':new YAHOO.util.CustomEvent('invalidated'),'visibilitychange':new YAHOO.util.CustomEvent('visibilitychange'),'paneladded':new YAHOO.util.CustomEvent('paneladded'),'panelremoved':new YAHOO.util.CustomEvent('panelremoved'),'collapsed':new YAHOO.util.CustomEvent('collapsed'),'expanded':new YAHOO.util.CustomEvent('expanded'),'panelactivated':new YAHOO.util.CustomEvent('panelactivated'),'resized':new YAHOO.util.CustomEvent('resized')};this.panels=new YAHOO.ext.util.MixedCollection();this.panels.getKey=this.getPanelId.createDelegate(this);this.box=null;this.visible=false;this.collapsed=false;this.hide();this.on('paneladded',this.validateVisibility,this,true);this.on('panelremoved',this.validateVisibility,this,true);this.activePanel=null;this.applyConfig(config);};YAHOO.extendX(YAHOO.ext.LayoutRegion,YAHOO.ext.util.Observable,{getPanelId:function(p){return p.getId();},applyConfig:function(config){if(config.collapsible&&this.position!='center'&&!this.collapsedEl){var dh=YAHOO.ext.DomHelper;this.collapseBtn=this.createTool(this.tools.dom,'ylayout-collapse-'+this.position);this.collapseBtn.mon('click',this.collapse,this,true);this.collapsedEl=dh.append(this.mgr.el.dom,{tag:'div',cls:'ylayout-collapsed ylayout-collapsed-'+this.position,children:[{tag:'div',cls:'ylayout-collapsed-tools'}]},true);if(config.floatable!==false){this.collapsedEl.addClassOnOver('ylayout-collapsed-over');this.collapsedEl.mon('click',this.collapseClick,this,true);}
this.expandBtn=this.createTool(this.collapsedEl.dom.firstChild,'ylayout-expand-'+this.position);this.expandBtn.mon('click',this.expand,this,true);}
if(this.collapseBtn){this.collapseBtn.setVisible(config.collapsible==true);}
this.cmargins=config.cmargins||this.cmargins||(this.position=='west'||this.position=='east'?{top:0,left:2,right:2,bottom:0}:{top:2,left:0,right:0,bottom:2});this.margins=config.margins||this.margins||{top:0,left:0,right:0,bottom:0};this.bottomTabs=config.tabPosition!='top';this.autoScroll=config.autoScroll||false;if(this.autoScroll){this.bodyEl.setStyle('overflow','auto');}else{this.bodyEl.setStyle('overflow','hidden');}
if((!config.titlebar&&!config.title)||config.titlebar===false){this.titleEl.hide();}else{this.titleEl.show();if(config.title){this.titleTextEl.innerHTML=config.title;}}
this.duration=config.duration||.30;this.slideDuration=config.slideDuration||.45;this.config=config;if(config.collapsed){this.collapse(true);}},resizeTo:function(newSize){switch(this.position){case'east':case'west':this.el.setWidth(newSize);this.fireEvent('resized',this,newSize);break;case'north':case'south':this.el.setHeight(newSize);this.fireEvent('resized',this,newSize);break;}},getBox:function(){var b;if(!this.collapsed){b=this.el.getBox(false,true);}else{b=this.collapsedEl.getBox(false,true);}
return b;},getMargins:function(){return this.collapsed?this.cmargins:this.margins;},highlight:function(){this.el.addClass('ylayout-panel-dragover');},unhighlight:function(){this.el.removeClass('ylayout-panel-dragover');},updateBox:function(box){this.box=box;if(!this.collapsed){this.el.dom.style.left=box.x+'px';this.el.dom.style.top=box.y+'px';this.el.setSize(box.width,box.height);var bodyHeight=this.titleEl.isVisible()?box.height-(this.titleEl.getHeight()||0):box.height;bodyHeight-=this.el.getBorderWidth('tb');bodyWidth=box.width-this.el.getBorderWidth('rl');this.bodyEl.setHeight(bodyHeight);this.bodyEl.setWidth(bodyWidth);var tabHeight=bodyHeight;if(this.tabs){tabHeight=this.tabs.syncHeight(bodyHeight);if(YAHOO.ext.util.Browser.isIE)this.tabs.el.repaint();}
this.panelSize={width:bodyWidth,height:tabHeight};if(this.activePanel){this.activePanel.setSize(bodyWidth,tabHeight);}}else{this.collapsedEl.dom.style.left=box.x+'px';this.collapsedEl.dom.style.top=box.y+'px';this.collapsedEl.setSize(box.width,box.height);}
if(this.tabs){this.tabs.autoSizeTabs();}},getEl:function(){return this.el;},hide:function(){if(!this.collapsed){this.el.dom.style.left='-2000px';this.el.hide();}else{this.collapsedEl.dom.style.left='-2000px';this.collapsedEl.hide();}
this.visible=false;this.fireEvent('visibilitychange',this,false);},show:function(){if(!this.collapsed){this.el.show();}else{this.collapsedEl.show();}
this.visible=true;this.fireEvent('visibilitychange',this,true);},isVisible:function(){return this.visible;},closeClicked:function(){if(this.activePanel){this.remove(this.activePanel);}},collapseClick:function(e){if(this.isSlid){e.stopPropagation();this.slideIn();}else{e.stopPropagation();this.slideOut();}},collapse:function(skipAnim){if(this.collapsed)return;this.collapsed=true;if(this.split){this.split.el.hide();}
if(this.config.animate&&skipAnim!==true){this.fireEvent('invalidated',this);this.animateCollapse();}else{this.el.setLocation(-20000,-20000);this.el.hide();this.collapsedEl.show();this.fireEvent('collapsed',this);this.fireEvent('invalidated',this);}},animateCollapse:function(){},expand:function(e,skipAnim){if(e)e.stopPropagation();if(!this.collapsed)return;if(this.isSlid){this.slideIn(this.expand.createDelegate(this));return;}
this.collapsed=false;this.el.show();if(this.config.animate&&skipAnim!==true){this.animateExpand();}else{if(this.split){this.split.el.show();}
this.collapsedEl.setLocation(-2000,-2000);this.collapsedEl.hide();this.fireEvent('invalidated',this);this.fireEvent('expanded',this);}},animateExpand:function(){},initTabs:function(){this.bodyEl.setStyle('overflow','hidden');var ts=new YAHOO.ext.TabPanel(this.bodyEl.dom,this.bottomTabs);this.tabs=ts;ts.resizeTabs=this.config.resizeTabs===true;ts.minTabWidth=this.config.minTabWidth||40;ts.maxTabWidth=this.config.maxTabWidth||250;ts.preferredTabWidth=this.config.preferredTabWidth||150;ts.monitorResize=false;ts.bodyEl.setStyle('overflow',this.config.autoScroll?'auto':'hidden');this.panels.each(this.initPanelAsTab,this);},initPanelAsTab:function(panel){var ti=this.tabs.addTab(panel.getEl().id,panel.getTitle(),null,this.config.closeOnTab&&panel.isClosable());ti.on('activate',function(){this.setActivePanel(panel);},this,true);if(this.config.closeOnTab){ti.on('beforeclose',function(t,e){e.cancel=true;this.remove(panel);},this,true);}
return ti;},updatePanelTitle:function(panel,title){if(this.activePanel==panel){this.updateTitle(title);}
if(this.tabs){this.tabs.getTab(panel.getEl().id).setText(title);}},updateTitle:function(title){if(this.titleTextEl&&!this.config.title){this.titleTextEl.innerHTML=(typeof title!='undefined'&&title.length>0?title:"&#160;");}},setActivePanel:function(panel){panel=this.getPanel(panel);if(this.activePanel&&this.activePanel!=panel){this.activePanel.setActiveState(false);}
this.activePanel=panel;panel.setActiveState(true);if(this.panelSize){panel.setSize(this.panelSize.width,this.panelSize.height);}
this.closeBtn.setVisible(!this.config.closeOnTab&&!this.isSlid&&panel.isClosable());this.updateTitle(panel.getTitle());this.fireEvent('panelactivated',this,panel);},showPanel:function(panel){if(panel=this.getPanel(panel)){if(this.tabs){this.tabs.activate(panel.getEl().id);}else{this.setActivePanel(panel);}}
return panel;},getActivePanel:function(){return this.activePanel;},validateVisibility:function(){if(this.panels.getCount()<1){this.updateTitle('&#160;');this.closeBtn.hide();this.hide();}else{if(!this.isVisible()){this.show();}}},add:function(panel){if(arguments.length>1){for(var i=0,len=arguments.length;i<len;i++){this.add(arguments[i]);}
return null;}
if(this.hasPanel(panel)){this.showPanel(panel);return panel;}
panel.setRegion(this);this.panels.add(panel);if(this.panels.getCount()==1&&!this.config.alwaysShowTabs){this.bodyEl.dom.appendChild(panel.getEl().dom);this.setActivePanel(panel);this.fireEvent('paneladded',this,panel);return panel;}
if(!this.tabs){this.initTabs();}else{this.initPanelAsTab(panel);}
this.tabs.activate(panel.getEl().id);this.fireEvent('paneladded',this,panel);return panel;},hasPanel:function(panel){if(typeof panel=='object'){panel=panel.getId();}
return this.getPanel(panel)?true:false;},hidePanel:function(panel){if(this.tabs&&(panel=this.getPanel(panel))){this.tabs.hideTab(panel.getEl().id);}},unhidePanel:function(panel){if(this.tabs&&(panel=this.getPanel(panel))){this.tabs.unhideTab(panel.getEl().id);}},clearPanels:function(){while(this.panels.getCount()>0){this.remove(this.panels.first());}},remove:function(panel,preservePanel){panel=this.getPanel(panel);if(!panel){return null;}
var e={};this.fireEvent('beforeremove',this,panel,e);if(e.cancel===true){return null;}
preservePanel=(typeof preservePanel!='undefined'?preservePanel:(this.config.preservePanels===true||panel.preserve===true));var panelId=panel.getId();this.panels.removeKey(panelId);if(preservePanel){document.body.appendChild(panel.getEl().dom);}
if(this.tabs){this.tabs.removeTab(panel.getEl().id);}else if(!preservePanel){this.bodyEl.dom.removeChild(panel.getEl().dom);}
if(this.panels.getCount()==1&&this.tabs&&!this.config.alwaysShowTabs){var p=this.panels.first();var tempEl=document.createElement('span');tempEl.appendChild(p.getEl().dom);this.bodyEl.update('');this.bodyEl.dom.appendChild(p.getEl().dom);tempEl=null;this.updateTitle(p.getTitle());this.tabs=null;this.bodyEl.setStyle('overflow',this.config.autoScroll?'auto':'hidden');this.setActivePanel(p);}
panel.setRegion(null);if(this.activePanel==panel){this.activePanel=null;}
if(this.config.autoDestroy!==false&&preservePanel!==true){try{panel.destroy();}catch(e){}}
this.fireEvent('panelremoved',this,panel);return panel;},getTabs:function(){return this.tabs;},getPanel:function(id){if(typeof id=='object'){return id;}
return this.panels.get(id);},getPosition:function(){return this.position;},createTool:function(parentEl,className){var btn=YAHOO.ext.DomHelper.append(parentEl,{tag:'div',cls:'ylayout-tools-button',children:[{tag:'div',cls:'ylayout-tools-button-inner '+className,html:'&#160;'}]},true);btn.addClassOnOver('ylayout-tools-button-over');return btn;}});
YAHOO.ext.LayoutStateManager=function(layout){this.state={north:{},south:{},east:{},west:{}};};YAHOO.ext.LayoutStateManager.prototype={init:function(layout,provider){this.provider=provider;var state=provider.get(layout.id+'-layout-state');if(state){var wasUpdating=layout.isUpdating();if(!wasUpdating){layout.beginUpdate();}
for(var key in state){if(typeof state[key]!='function'){var rstate=state[key];var r=layout.getRegion(key);if(r&&rstate){if(rstate.size){r.resizeTo(rstate.size);}
if(rstate.collapsed==true){r.collapse(true);}else{r.expand(null,true);}}}}
if(!wasUpdating){layout.endUpdate();}
this.state=state;}
this.layout=layout;layout.on('regionresized',this.onRegionResized,this,true);layout.on('regioncollapsed',this.onRegionCollapsed,this,true);layout.on('regionexpanded',this.onRegionExpanded,this,true);},storeState:function(){this.provider.set(this.layout.id+'-layout-state',this.state);},onRegionResized:function(region,newSize){this.state[region.getPosition()].size=newSize;this.storeState();},onRegionCollapsed:function(region){this.state[region.getPosition()].collapsed=true;this.storeState();},onRegionExpanded:function(region){this.state[region.getPosition()].collapsed=false;this.storeState();}};
YAHOO.ext.SplitLayoutRegion=function(mgr,config,pos,cursor){this.cursor=cursor;YAHOO.ext.SplitLayoutRegion.superclass.constructor.call(this,mgr,config,pos);if(config.split){this.hide();}};YAHOO.extendX(YAHOO.ext.SplitLayoutRegion,YAHOO.ext.LayoutRegion,{applyConfig:function(config){YAHOO.ext.SplitLayoutRegion.superclass.applyConfig.call(this,config);if(config.split){if(!this.split){var splitEl=YAHOO.ext.DomHelper.append(this.mgr.el.dom,{tag:'div',id:this.el.id+'-split',cls:'ylayout-split ylayout-split-'+this.position,html:'&#160;'});this.split=new YAHOO.ext.SplitBar(splitEl,this.el);this.split.onMoved.subscribe(this.onSplitMove,this,true);this.split.useShim=config.useShim===true;YAHOO.util.Dom.setStyle([this.split.el.dom,this.split.proxy],'cursor',this.cursor);this.split.getMaximumSize=this.getMaxSize.createDelegate(this);}
if(typeof config.minSize!='undefined'){this.split.minSize=config.minSize;}
if(typeof config.maxSize!='undefined'){this.split.maxSize=config.maxSize;}}},getMaxSize:function(){var cmax=this.config.maxSize||10000;var center=this.mgr.getRegion('center');return Math.min(cmax,(this.el.getWidth()+center.getEl().getWidth())-center.getMinWidth());},onSplitMove:function(split,newSize){this.fireEvent('resized',this,newSize);},getSplitBar:function(){return this.split;},hide:function(){if(this.split){this.split.el.setLocation(-2000,-2000);this.split.el.hide();}
YAHOO.ext.SplitLayoutRegion.superclass.hide.call(this);},show:function(){if(this.split){this.split.el.show();}
YAHOO.ext.SplitLayoutRegion.superclass.show.call(this);},beforeSlide:function(){if(YAHOO.ext.util.Browser.isGecko){this.bodyEl.clip();if(this.tabs)this.tabs.bodyEl.clip();if(this.activePanel){this.activePanel.getEl().clip();if(this.activePanel.beforeSlide){this.activePanel.beforeSlide();}}}},afterSlide:function(){if(YAHOO.ext.util.Browser.isGecko){this.bodyEl.unclip();if(this.tabs)this.tabs.bodyEl.unclip();if(this.activePanel){this.activePanel.getEl().unclip();if(this.activePanel.afterSlide){this.activePanel.afterSlide();}}}},slideOut:function(){if(!this.slideEl){this.slideEl=new YAHOO.ext.Actor(YAHOO.ext.DomHelper.append(this.mgr.el.dom,{tag:'div',cls:'ylayout-slider'}));if(this.config.autoHide!==false){var slideInTask=new YAHOO.ext.util.DelayedTask(this.slideIn,this);this.slideEl.mon('mouseout',function(e){var to=e.getRelatedTarget();if(to&&to!=this.slideEl.dom&&!YAHOO.util.Dom.isAncestor(this.slideEl.dom,to)){slideInTask.delay(500);}},this,true);this.slideEl.mon('mouseover',function(e){slideInTask.cancel();},this,true);}}
var sl=this.slideEl,c=this.collapsedEl,cm=this.cmargins;this.isSlid=true;this.snapshot={'left':this.el.getLeft(true),'top':this.el.getTop(true),'colbtn':this.collapseBtn.isVisible(),'closebtn':this.closeBtn.isVisible()};this.collapseBtn.hide();this.closeBtn.hide();this.el.show();this.el.setLeftTop(0,0);sl.startCapture(true);var size;switch(this.position){case'west':sl.setLeft(c.getRight(true));sl.setTop(c.getTop(true));size=this.el.getWidth();break;case'east':sl.setRight(this.mgr.getViewSize().width-c.getLeft(true));sl.setTop(c.getTop(true));size=this.el.getWidth();break;case'north':sl.setLeft(c.getLeft(true));sl.setTop(c.getBottom(true));size=this.el.getHeight();break;case'south':sl.setLeft(c.getLeft(true));sl.setBottom(this.mgr.getViewSize().height-c.getTop(true));size=this.el.getHeight();break;}
sl.dom.appendChild(this.el.dom);YAHOO.util.Event.on(document.body,'click',this.slideInIf,this,true);sl.setSize(this.el.getWidth(),this.el.getHeight());this.beforeSlide();if(this.activePanel){this.activePanel.setSize(this.bodyEl.getWidth(),this.bodyEl.getHeight());}
sl.slideShow(this.getAnchor(),size,this.slideDuration,null,false);sl.play(function(){this.afterSlide();}.createDelegate(this));},slideInIf:function(e){var t=YAHOO.util.Event.getTarget(e);if(!YAHOO.util.Dom.isAncestor(this.el.dom,t)){this.slideIn();}},slideIn:function(callback){if(this.isSlid&&!this.slideEl.playlist.isPlaying()){YAHOO.util.Event.removeListener(document.body,'click',this.slideInIf,this,true);this.slideEl.startCapture(true);this.slideEl.slideHide(this.getAnchor(),this.slideDuration,null);this.beforeSlide();this.slideEl.play(function(){this.isSlid=false;this.el.setPositioning(this.snapshot);this.collapseBtn.setVisible(this.snapshot.colbtn);this.closeBtn.setVisible(this.snapshot.closebtn);this.afterSlide();this.mgr.el.dom.appendChild(this.el.dom);if(typeof callback=='function'){callback();}}.createDelegate(this));}},animateExpand:function(){var em=this.margins,cm=this.cmargins;var c=this.collapsedEl,el=this.el;var direction,distance;switch(this.position){case'west':direction='right';el.setLeft(-(el.getWidth()+(em.right+em.left)));el.setTop(c.getTop(true)-cm.top+em.top);distance=el.getWidth()+(em.right+em.left);break;case'east':direction='left';el.setLeft(this.mgr.getViewSize().width+em.left);el.setTop(c.getTop(true)-cm.top+em.top);distance=el.getWidth()+(em.right+em.left);break;case'north':direction='down';el.setLeft(em.left);el.setTop(-(el.getHeight()+(em.top+em.bottom)));distance=el.getHeight()+(em.top+em.bottom);break;case'south':direction='up';el.setLeft(em.left);el.setTop(this.mgr.getViewSize().height+em.top);distance=el.getHeight()+(em.top+em.bottom);break;}
this.beforeSlide();el.setStyle('z-index','100');el.show();c.setLocation(-2000,-2000);c.hide();el.move(direction,distance,true,this.duration,function(){this.afterSlide();el.setStyle('z-index','');if(this.split){this.split.el.show();}
this.fireEvent('invalidated',this);this.fireEvent('expanded',this);}.createDelegate(this),this.config.easing||YAHOO.util.Easing.easeOut);},animateCollapse:function(){var em=this.margins,cm=this.cmargins;var c=this.collapsedEl,el=this.el;var direction,distance;switch(this.position){case'west':direction='left';distance=el.getWidth()+(em.right+em.left);break;case'east':direction='right';distance=el.getWidth()+(em.right+em.left);break;case'north':direction='up';distance=el.getHeight()+(em.top+em.bottom);break;case'south':direction='down';distance=el.getHeight()+(em.top+em.bottom);break;}
this.el.setStyle('z-index','100');this.beforeSlide();this.el.move(direction,distance,true,this.duration,function(){this.afterSlide();this.el.setStyle('z-index','');this.el.setLocation(-20000,-20000);this.el.hide();this.collapsedEl.show();this.fireEvent('collapsed',this);}.createDelegate(this),YAHOO.util.Easing.easeIn);},getAnchor:function(){switch(this.position){case'west':return'left';case'east':return'right';case'north':return'top';case'south':return'bottom';}}});
YAHOO.ext.CenterLayoutRegion=function(mgr,config){YAHOO.ext.CenterLayoutRegion.superclass.constructor.call(this,mgr,config,'center');this.visible=true;this.minWidth=config.minWidth||20;this.minHeight=config.minHeight||20;};YAHOO.extendX(YAHOO.ext.CenterLayoutRegion,YAHOO.ext.LayoutRegion,{hide:function(){},show:function(){},getMinWidth:function(){return this.minWidth;},getMinHeight:function(){return this.minHeight;}});YAHOO.ext.NorthLayoutRegion=function(mgr,config){YAHOO.ext.NorthLayoutRegion.superclass.constructor.call(this,mgr,config,'north','n-resize');if(this.split){this.split.placement=YAHOO.ext.SplitBar.TOP;this.split.orientation=YAHOO.ext.SplitBar.VERTICAL;this.split.el.addClass('ylayout-split-v');}
if(typeof config.initialSize!='undefined'){this.el.setHeight(config.initialSize);}};YAHOO.extendX(YAHOO.ext.NorthLayoutRegion,YAHOO.ext.SplitLayoutRegion,{getBox:function(){if(this.collapsed){return this.collapsedEl.getBox();}
var box=this.el.getBox();if(this.split){box.height+=this.split.el.getHeight();}
return box;},updateBox:function(box){if(this.split&&!this.collapsed){box.height-=this.split.el.getHeight();this.split.el.setLeft(box.x);this.split.el.setTop(box.y+box.height);this.split.el.setWidth(box.width);}
if(this.collapsed){this.el.setWidth(box.width);var bodyWidth=box.width-this.el.getBorderWidth('rl');this.bodyEl.setWidth(bodyWidth);if(this.activePanel&&this.panelSize){this.activePanel.setSize(bodyWidth,this.panelSize.height);}}
YAHOO.ext.NorthLayoutRegion.superclass.updateBox.call(this,box);}});YAHOO.ext.SouthLayoutRegion=function(mgr,config){YAHOO.ext.SouthLayoutRegion.superclass.constructor.call(this,mgr,config,'south','s-resize');if(this.split){this.split.placement=YAHOO.ext.SplitBar.BOTTOM;this.split.orientation=YAHOO.ext.SplitBar.VERTICAL;this.split.el.addClass('ylayout-split-v');}
if(typeof config.initialSize!='undefined'){this.el.setHeight(config.initialSize);}};YAHOO.extendX(YAHOO.ext.SouthLayoutRegion,YAHOO.ext.SplitLayoutRegion,{getBox:function(){if(this.collapsed){return this.collapsedEl.getBox();}
var box=this.el.getBox();if(this.split){var sh=this.split.el.getHeight();box.height+=sh;box.y-=sh;}
return box;},updateBox:function(box){if(this.split&&!this.collapsed){var sh=this.split.el.getHeight();box.height-=sh;box.y+=sh;this.split.el.setLeft(box.x);this.split.el.setTop(box.y-sh);this.split.el.setWidth(box.width);}
if(this.collapsed){this.el.setWidth(box.width);var bodyWidth=box.width-this.el.getBorderWidth('rl');this.bodyEl.setWidth(bodyWidth);if(this.activePanel&&this.panelSize){this.activePanel.setSize(bodyWidth,this.panelSize.height);}}
YAHOO.ext.SouthLayoutRegion.superclass.updateBox.call(this,box);}});YAHOO.ext.EastLayoutRegion=function(mgr,config){YAHOO.ext.EastLayoutRegion.superclass.constructor.call(this,mgr,config,'east','e-resize');if(this.split){this.split.placement=YAHOO.ext.SplitBar.RIGHT;this.split.orientation=YAHOO.ext.SplitBar.HORIZONTAL;this.split.el.addClass('ylayout-split-h');}
if(typeof config.initialSize!='undefined'){this.el.setWidth(config.initialSize);}};YAHOO.extendX(YAHOO.ext.EastLayoutRegion,YAHOO.ext.SplitLayoutRegion,{getBox:function(){if(this.collapsed){return this.collapsedEl.getBox();}
var box=this.el.getBox();if(this.split){var sw=this.split.el.getWidth();box.width+=sw;box.x-=sw;}
return box;},updateBox:function(box){if(this.split&&!this.collapsed){var sw=this.split.el.getWidth();box.width-=sw;this.split.el.setLeft(box.x);this.split.el.setTop(box.y);this.split.el.setHeight(box.height);box.x+=sw;}
if(this.collapsed){this.el.setHeight(box.height);var bodyHeight=this.config.titlebar?box.height-(this.titleEl.getHeight()||0):box.height;bodyHeight-=this.el.getBorderWidth('tb');this.bodyEl.setHeight(bodyHeight);if(this.activePanel&&this.panelSize){this.activePanel.setSize(this.panelSize.width,bodyHeight);}}
YAHOO.ext.EastLayoutRegion.superclass.updateBox.call(this,box);}});YAHOO.ext.WestLayoutRegion=function(mgr,config){YAHOO.ext.WestLayoutRegion.superclass.constructor.call(this,mgr,config,'west','w-resize');if(this.split){this.split.placement=YAHOO.ext.SplitBar.LEFT;this.split.orientation=YAHOO.ext.SplitBar.HORIZONTAL;this.split.el.addClass('ylayout-split-h');}
if(typeof config.initialSize!='undefined'){this.el.setWidth(config.initialSize);}};YAHOO.extendX(YAHOO.ext.WestLayoutRegion,YAHOO.ext.SplitLayoutRegion,{getBox:function(){if(this.collapsed){return this.collapsedEl.getBox();}
var box=this.el.getBox();if(this.split){box.width+=this.split.el.getWidth();}
return box;},updateBox:function(box){if(this.split&&!this.collapsed){var sw=this.split.el.getWidth();box.width-=sw;this.split.el.setLeft(box.x+box.width);this.split.el.setTop(box.y);this.split.el.setHeight(box.height);}
if(this.collapsed){this.el.setHeight(box.height);var bodyHeight=this.config.titlebar?box.height-(this.titleEl.getHeight()||0):box.height;bodyHeight-=this.el.getBorderWidth('tb');this.bodyEl.setHeight(bodyHeight);if(this.activePanel&&this.panelSize){this.activePanel.setSize(this.panelSize.width,bodyHeight);}}
YAHOO.ext.WestLayoutRegion.superclass.updateBox.call(this,box);}});
YAHOO.ext.grid.AbstractColumnModel=function(){this.onWidthChange=new YAHOO.util.CustomEvent('widthChanged');this.onHeaderChange=new YAHOO.util.CustomEvent('headerChanged');this.onHiddenChange=new YAHOO.util.CustomEvent('hiddenChanged');this.events={'widthchange':this.onWidthChange,'headerchange':this.onHeaderChange,'hiddenchange':this.onHiddenChange};};YAHOO.ext.grid.AbstractColumnModel.prototype={fireEvent:YAHOO.ext.util.Observable.prototype.fireEvent,on:YAHOO.ext.util.Observable.prototype.on,addListener:YAHOO.ext.util.Observable.prototype.addListener,delayedListener:YAHOO.ext.util.Observable.prototype.delayedListener,removeListener:YAHOO.ext.util.Observable.prototype.removeListener,purgeListeners:YAHOO.ext.util.Observable.prototype.purgeListeners,bufferedListener:YAHOO.ext.util.Observable.prototype.bufferedListener,fireWidthChange:function(colIndex,newWidth){this.onWidthChange.fireDirect(this,colIndex,newWidth);},fireHeaderChange:function(colIndex,newHeader){this.onHeaderChange.fireDirect(this,colIndex,newHeader);},fireHiddenChange:function(colIndex,hidden){this.onHiddenChange.fireDirect(this,colIndex,hidden);},getColumnCount:function(){return 0;},isSortable:function(col){return false;},isHidden:function(col){return false;},getSortType:function(col){return YAHOO.ext.grid.DefaultColumnModel.sortTypes.none;},getRenderer:function(col){return YAHOO.ext.grid.DefaultColumnModel.defaultRenderer;},getColumnWidth:function(col){return 0;},getTotalWidth:function(){return 0;},getColumnHeader:function(col){return'';}};
YAHOO.ext.grid.DefaultColumnModel=function(config){YAHOO.ext.grid.DefaultColumnModel.superclass.constructor.call(this);this.config=config;this.defaultWidth=100;this.defaultSortable=false;};YAHOO.extendX(YAHOO.ext.grid.DefaultColumnModel,YAHOO.ext.grid.AbstractColumnModel,{getColumnCount:function(){return this.config.length;},isSortable:function(col){if(typeof this.config[col].sortable=='undefined'){return this.defaultSortable;}
return this.config[col].sortable;},getSortType:function(col){if(!this.dataMap){var map=[];for(var i=0,len=this.config.length;i<len;i++){map[this.getDataIndex(i)]=i;}
this.dataMap=map;}
col=this.dataMap[col];if(!this.config[col].sortType){return YAHOO.ext.grid.DefaultColumnModel.sortTypes.none;}
return this.config[col].sortType;},setSortType:function(col,fn){this.config[col].sortType=fn;},getRenderer:function(col){if(!this.config[col].renderer){return YAHOO.ext.grid.DefaultColumnModel.defaultRenderer;}
return this.config[col].renderer;},setRenderer:function(col,fn){this.config[col].renderer=fn;},getColumnWidth:function(col){return this.config[col].width||this.defaultWidth;},setColumnWidth:function(col,width,suppressEvent){this.config[col].width=width;this.totalWidth=null;if(!suppressEvent){this.onWidthChange.fireDirect(this,col,width);}},getTotalWidth:function(includeHidden){if(!this.totalWidth){this.totalWidth=0;for(var i=0;i<this.config.length;i++){if(includeHidden||!this.isHidden(i)){this.totalWidth+=this.getColumnWidth(i);}}}
return this.totalWidth;},getColumnHeader:function(col){return this.config[col].header;},setColumnHeader:function(col,header){this.config[col].header=header;this.onHeaderChange.fireDirect(this,col,header);},getColumnTooltip:function(col){return this.config[col].tooltip;},setColumnTooltip:function(col,header){this.config[col].tooltip=tooltip;},getDataIndex:function(col){if(typeof this.config[col].dataIndex!='number'){return col;}
return this.config[col].dataIndex;},setDataIndex:function(col,dataIndex){this.config[col].dataIndex=dataIndex;},isCellEditable:function(colIndex,rowIndex){return this.config[colIndex].editable||(typeof this.config[colIndex].editable=='undefined'&&this.config[colIndex].editor);},getCellEditor:function(colIndex,rowIndex){return this.config[colIndex].editor;},setEditable:function(col,editable){this.config[col].editable=editable;},isHidden:function(colIndex){return this.config[colIndex].hidden;},isFixed:function(colIndex){return this.config[colIndex].fixed;},isResizable:function(colIndex){return this.config[colIndex].resizable!==false;},setHidden:function(colIndex,hidden){this.config[colIndex].hidden=hidden;this.totalWidth=null;this.fireHiddenChange(colIndex,hidden);},setEditor:function(col,editor){this.config[col].editor=editor;}});YAHOO.ext.grid.DefaultColumnModel.sortTypes={none:function(s){return s;},asUCString:function(s){return String(s).toUpperCase();},asDate:function(s){if(s instanceof Date){return s.getTime();}
return Date.parse(String(s));},asFloat:function(s){var val=parseFloat(String(s).replace(/,/g,''));if(isNaN(val))val=0;return val;},asInt:function(s){var val=parseInt(String(s).replace(/,/g,''));if(isNaN(val))val=0;return val;}};YAHOO.ext.grid.DefaultColumnModel.defaultRenderer=function(value){if(typeof value=='string'&&value.length<1){return'&#160;';}
return value;}
YAHOO.ext.grid.Grid=function(container,config,colModel,selectionModel){this.container=YAHOO.ext.Element.get(container);this.container.update('');this.container.setStyle('overflow','hidden');this.id=this.container.id;this.rows=[];this.rowCount=0;this.fieldId=null;var dataModel=config;this.dataModel=dataModel;this.colModel=colModel;this.selModel=selectionModel;this.activeEditor=null;this.editingCell=null;this.minColumnWidth=25;this.autoSizeColumns=false;this.autoSizeHeaders=false;this.monitorWindowResize=true;this.maxRowsToMeasure=0;this.trackMouseOver=false;this.enableDragDrop=false;this.stripeRows=true;this.autoHeight=false;this.autoWidth=false;this.view=null;this.allowTextSelectionPattern=/INPUT|TEXTAREA|SELECT/i;if(typeof config=='object'&&!config.getRowCount){YAHOO.ext.util.Config.apply(this,config);}
this.setValueDelegate=this.setCellValue.createDelegate(this);this.events={'click':true,'dblclick':true,'mousedown':true,'mouseup':true,'mouseover':true,'mouseout':true,'keypress':true,'keydown':true,'cellclick':true,'celldblclick':true,'rowclick':true,'rowdblclick':true,'headerclick':true,'rowcontextmenu':true,'headercontextmenu':true,'beforeedit':true,'afteredit':true,'bodyscroll':true,'columnresize':true,'startdrag':true,'enddrag':true,'dragdrop':true,'dragover':true,'dragenter':true,'dragout':true};};YAHOO.ext.grid.Grid.prototype={render:function(){if((!this.container.dom.offsetHeight||this.container.dom.offsetHeight<20)||this.container.getStyle('height')=='auto'){this.autoHeight=true;}
if((!this.container.dom.offsetWidth||this.container.dom.offsetWidth<20)){this.autoWidth=true;}
if(!this.view){if(this.dataModel.isPaged()){this.view=new YAHOO.ext.grid.PagedGridView();}else{this.view=new YAHOO.ext.grid.GridView();}}
this.view.init(this);this.el=getEl(this.view.render(),true);var c=this.container;c.mon("click",this.onClick,this,true);c.mon("dblclick",this.onDblClick,this,true);c.mon("contextmenu",this.onContextMenu,this,true);c.mon("selectstart",this.cancelTextSelection,this,true);c.mon("mousedown",this.cancelTextSelection,this,true);c.mon("mousedown",this.onMouseDown,this,true);c.mon("mouseup",this.onMouseUp,this,true);if(this.trackMouseOver){this.el.mon("mouseover",this.onMouseOver,this,true);this.el.mon("mouseout",this.onMouseOut,this,true);}
c.mon("keypress",this.onKeyPress,this,true);c.mon("keydown",this.onKeyDown,this,true);this.init();return this;},init:function(){this.rows=this.el.dom.rows;if(!this.disableSelection){if(!this.selModel){this.selModel=new YAHOO.ext.grid.DefaultSelectionModel(this);}
this.selModel.init(this);this.selModel.onSelectionChange.subscribe(this.updateField,this,true);}else{this.selModel=new YAHOO.ext.grid.DisableSelectionModel(this);this.selModel.init(this);}
if(this.enableDragDrop){this.dd=new YAHOO.ext.grid.GridDD(this,this.container.dom);}},reset:function(config){this.destroy(false,true);YAHOO.ext.util.Config.apply(this,config);return this;},destroy:function(removeEl,keepListeners){var c=this.container;c.removeAllListeners();this.view.destroy();YAHOO.ext.EventManager.removeResizeListener(this.view.onWindowResize,this.view);this.view=null;this.colModel.purgeListeners();if(!keepListeners){this.purgeListeners();}
c.update('');if(removeEl===true){c.remove();}},setDataModel:function(dm,rerender){this.view.unplugDataModel(this.dataModel);this.dataModel=dm;this.view.plugDataModel(dm);if(rerender){dm.fireEvent('datachanged');}},onMouseDown:function(e){this.fireEvent('mousedown',e);},onMouseUp:function(e){this.fireEvent('mouseup',e);},onMouseOver:function(e){this.fireEvent('mouseover',e);},onMouseOut:function(e){this.fireEvent('mouseout',e);},onKeyPress:function(e){this.fireEvent('keypress',e);},onKeyDown:function(e){this.fireEvent('keydown',e);},fireEvent:YAHOO.ext.util.Observable.prototype.fireEvent,on:YAHOO.ext.util.Observable.prototype.on,addListener:YAHOO.ext.util.Observable.prototype.addListener,delayedListener:YAHOO.ext.util.Observable.prototype.delayedListener,removeListener:YAHOO.ext.util.Observable.prototype.removeListener,purgeListeners:YAHOO.ext.util.Observable.prototype.purgeListeners,bufferedListener:YAHOO.ext.util.Observable.prototype.bufferedListener,onClick:function(e){this.fireEvent('click',e);var target=e.getTarget();var row=this.getRowFromChild(target);var cell=this.getCellFromChild(target);var header=this.getHeaderFromChild(target);if(row){this.fireEvent('rowclick',this,row.rowIndex,e);}
if(cell){this.fireEvent('cellclick',this,row.rowIndex,cell.columnIndex,e);}
if(header){this.fireEvent('headerclick',this,header.columnIndex,e);}},onContextMenu:function(e){var target=e.getTarget();var row=this.getRowFromChild(target);var header=this.getHeaderFromChild(target);if(row){this.fireEvent('rowcontextmenu',this,row.rowIndex,e);}
if(header){this.fireEvent('headercontextmenu',this,header.columnIndex,e);}
e.preventDefault();},onDblClick:function(e){this.fireEvent('dblclick',e);var target=e.getTarget();var row=this.getRowFromChild(target);var cell=this.getCellFromChild(target);if(row){this.fireEvent('rowdblclick',this,row.rowIndex,e);}
if(cell){this.fireEvent('celldblclick',this,row.rowIndex,cell.columnIndex,e);}},startEditing:function(rowIndex,colIndex){var row=this.rows[rowIndex];var cell=row.childNodes[colIndex];this.stopEditing();setTimeout(this.doEdit.createDelegate(this,[row,cell]),10);},stopEditing:function(){if(this.activeEditor){this.activeEditor.stopEditing();}},doEdit:function(row,cell){if(!row||!cell)return;var cm=this.colModel;var dm=this.dataModel;var colIndex=cell.columnIndex;var rowIndex=row.rowIndex;if(cm.isCellEditable(colIndex,rowIndex)){var ed=cm.getCellEditor(colIndex,rowIndex);if(ed){if(this.activeEditor){this.activeEditor.stopEditing();}
this.fireEvent('beforeedit',this,rowIndex,colIndex);this.activeEditor=ed;this.editingCell=cell;this.view.ensureVisible(row,true);try{cell.focus();}catch(e){}
ed.init(this,this.el.dom.parentNode,this.setValueDelegate);var value=dm.getValueAt(rowIndex,cm.getDataIndex(colIndex));setTimeout(ed.startEditing.createDelegate(ed,[value,row,cell]),1);}}},setCellValue:function(value,rowIndex,colIndex){this.dataModel.setValueAt(value,rowIndex,this.colModel.getDataIndex(colIndex));this.fireEvent('afteredit',this,rowIndex,colIndex);},cancelTextSelection:function(e){var target=e.getTarget();if(target&&target!=this.el.dom.parentNode&&!this.allowTextSelectionPattern.test(target.tagName)){e.preventDefault();}},autoSize:function(){this.view.updateWrapHeight();this.view.adjustForScroll();},scrollTo:function(row){if(typeof row=='number'){row=this.rows[row];}
this.view.ensureVisible(row,true);},getEditingCell:function(){return this.editingCell;},bindToField:function(fieldId){this.fieldId=fieldId;this.readField();},updateField:function(){if(this.fieldId){var field=YAHOO.util.Dom.get(this.fieldId);field.value=this.getSelectedRowIds().join(',');}},readField:function(){if(this.fieldId){var field=YAHOO.util.Dom.get(this.fieldId);var values=field.value.split(',');var rows=this.getRowsById(values);this.selModel.selectRows(rows,false);}},getRow:function(index){return this.rows[index];},getRowsById:function(id){var dm=this.dataModel;if(!(id instanceof Array)){for(var i=0;i<this.rows.length;i++){if(dm.getRowId(i)==id){return this.rows[i];}}
return null;}
var found=[];var re="^(?:";for(var i=0;i<id.length;i++){re+=id[i];if(i!=id.length-1)re+="|";}
var regex=new RegExp(re+")$");for(var i=0;i<this.rows.length;i++){if(regex.test(dm.getRowId(i))){found.push(this.rows[i]);}}
return found;},getRowAfter:function(row){return this.getSibling('next',row);},getRowBefore:function(row){return this.getSibling('previous',row);},getCellAfter:function(cell,includeHidden){var next=this.getSibling('next',cell);if(next&&!includeHidden&&this.colModel.isHidden(next.columnIndex)){return this.getCellAfter(next);}
return next;},getCellBefore:function(cell,includeHidden){var prev=this.getSibling('previous',cell);if(prev&&!includeHidden&&this.colModel.isHidden(prev.columnIndex)){return this.getCellBefore(prev);}
return prev;},getLastCell:function(row,includeHidden){var cell=this.getElement('previous',row.lastChild);if(cell&&!includeHidden&&this.colModel.isHidden(cell.columnIndex)){return this.getCellBefore(cell);}
return cell;},getFirstCell:function(row,includeHidden){var cell=this.getElement('next',row.firstChild);if(cell&&!includeHidden&&this.colModel.isHidden(cell.columnIndex)){return this.getCellAfter(cell);}
return cell;},getSibling:function(type,node){if(!node)return null;type+='Sibling';var n=node[type];while(n&&n.nodeType!=1){n=n[type];}
return n;},getElement:function(direction,node){if(!node||node.nodeType==1)return node;else return this.getSibling(direction,node);},getElementFromChild:function(childEl,parentClass){if(!childEl||(YAHOO.util.Dom.hasClass(childEl,parentClass))){return childEl;}
var p=childEl.parentNode;var b=document.body;while(p&&p!=b){if(YAHOO.util.Dom.hasClass(p,parentClass)){return p;}
p=p.parentNode;}
return null;},getRowFromChild:function(childEl){return this.getElementFromChild(childEl,'ygrid-row');},getCellFromChild:function(childEl){return this.getElementFromChild(childEl,'ygrid-col');},getHeaderFromChild:function(childEl){return this.getElementFromChild(childEl,'ygrid-hd');},getSelectedRows:function(){return this.selModel.getSelectedRows();},getSelectedRow:function(){if(this.selModel.hasSelection()){return this.selModel.getSelectedRows()[0];}
return null;},getSelectedRowIndexes:function(){var a=[];var rows=this.selModel.getSelectedRows();for(var i=0;i<rows.length;i++){a[i]=rows[i].rowIndex;}
return a;},getSelectedRowIndex:function(){if(this.selModel.hasSelection()){return this.selModel.getSelectedRows()[0].rowIndex;}
return-1;},getSelectedRowId:function(){if(this.selModel.hasSelection()){return this.selModel.getSelectedRowIds()[0];}
return null;},getSelectedRowIds:function(){return this.selModel.getSelectedRowIds();},clearSelections:function(){this.selModel.clearSelections();},selectAll:function(){this.selModel.selectAll();},getSelectionCount:function(){return this.selModel.getCount();},hasSelection:function(){return this.selModel.hasSelection();},getSelectionModel:function(){if(!this.selModel){this.selModel=new DefaultSelectionModel();}
return this.selModel;},getDataModel:function(){return this.dataModel;},getColumnModel:function(){return this.colModel;},getView:function(){return this.view;},getDragDropText:function(){return this.ddText.replace('%0',this.selModel.getCount());}};YAHOO.ext.grid.Grid.prototype.ddText="%0 selected row(s)";
YAHOO.ext.grid.GridView=function(){this.grid=null;this.lastFocusedRow=null;this.onScroll=new YAHOO.util.CustomEvent('onscroll');this.adjustScrollTask=new YAHOO.ext.util.DelayedTask(this._adjustForScroll,this);this.ensureVisibleTask=new YAHOO.ext.util.DelayedTask();};YAHOO.ext.grid.GridView.prototype={init:function(grid){this.grid=grid;},fireScroll:function(scrollLeft,scrollTop){this.onScroll.fireDirect(this.grid,scrollLeft,scrollTop);},getColumnRenderers:function(){var renderers=[];var cm=this.grid.colModel;var colCount=cm.getColumnCount();for(var i=0;i<colCount;i++){renderers.push(cm.getRenderer(i));}
return renderers;},buildIndexMap:function(){var colToData={};var dataToCol={};var cm=this.grid.colModel;for(var i=0,len=cm.getColumnCount();i<len;i++){var di=cm.getDataIndex(i);colToData[i]=di;dataToCol[di]=i;}
return{'colToData':colToData,'dataToCol':dataToCol};},getDataIndexes:function(){if(!this.indexMap){this.indexMap=this.buildIndexMap();}
return this.indexMap.colToData;},getColumnIndexByDataIndex:function(dataIndex){if(!this.indexMap){this.indexMap=this.buildIndexMap();}
return this.indexMap.dataToCol[dataIndex];},updateHeaders:function(){var colModel=this.grid.colModel;var hcells=this.headers;var colCount=colModel.getColumnCount();for(var i=0;i<colCount;i++){hcells[i].textNode.innerHTML=colModel.getColumnHeader(i);}},adjustForScroll:function(disableDelay){if(!disableDelay){this.adjustScrollTask.delay(50);}else{this._adjustForScroll();}},getCellAtPoint:function(x,y){var colIndex=null;var rowIndex=null;var xy=YAHOO.util.Dom.getXY(this.wrap);x=(x-xy[0])+this.wrap.scrollLeft;y=(y-xy[1])+this.wrap.scrollTop;var colModel=this.grid.colModel;var pos=0;var colCount=colModel.getColumnCount();for(var i=0;i<colCount;i++){if(colModel.isHidden(i))continue;var width=colModel.getColumnWidth(i);if(x>=pos&&x<pos+width){colIndex=i;break;}
pos+=width;}
if(colIndex!=null){rowIndex=(y==0?0:Math.floor(y/this.getRowHeight()));if(rowIndex>=this.grid.dataModel.getRowCount()){return null;}
return[colIndex,rowIndex];}
return null;},_adjustForScroll:function(){this.forceScrollUpdate();if(this.scrollbarMode==YAHOO.ext.grid.GridView.SCROLLBARS_OVERLAP){var adjustment=0;if(this.wrap.clientWidth&&this.wrap.clientWidth!==0){adjustment=this.wrap.offsetWidth-this.wrap.clientWidth;}
this.hwrap.setWidth(this.wrap.offsetWidth-adjustment);}else{this.hwrap.setWidth(this.wrap.offsetWidth);}
this.bwrap.setWidth(Math.max(this.grid.colModel.getTotalWidth(),this.wrap.clientWidth));},focusRow:function(row){if(typeof row=='number'){row=this.getBodyTable().childNodes[row];}
if(!row)return;var left=this.wrap.scrollLeft;try{row.childNodes.item(0).hideFocus=true;row.childNodes.item(0).focus();}catch(e){}
this.ensureVisible(row);this.wrap.scrollLeft=left;this.handleScroll();this.lastFocusedRow=row;},ensureVisible:function(row,disableDelay){if(!disableDelay){this.ensureVisibleTask.delay(50,this._ensureVisible,this,[row]);}else{this._ensureVisible(row);}},_ensureVisible:function(row){if(typeof row=='number'){row=this.getBodyTable().childNodes[row];}
if(!row)return;var left=this.wrap.scrollLeft;var rowTop=parseInt(row.offsetTop,10);var rowBottom=rowTop+row.offsetHeight;var clientTop=parseInt(this.wrap.scrollTop,10);var clientBottom=clientTop+this.wrap.clientHeight;if(rowTop<clientTop){this.wrap.scrollTop=rowTop;}else if(rowBottom>clientBottom){this.wrap.scrollTop=rowBottom-this.wrap.clientHeight;}
this.wrap.scrollLeft=left;this.handleScroll();},updateColumns:function(){this.grid.stopEditing();var colModel=this.grid.colModel;var hcols=this.headers;var colCount=colModel.getColumnCount();var pos=0;var totalWidth=colModel.getTotalWidth();for(var i=0;i<colCount;i++){if(colModel.isHidden(i))continue;var width=colModel.getColumnWidth(i);hcols[i].style.width=width+'px';hcols[i].style.left=pos+'px';hcols[i].split.style.left=(pos+width-3)+'px';this.setCSSWidth(i,width,pos);pos+=width;}
this.lastWidth=totalWidth;if(this.grid.autoWidth){this.grid.container.setWidth(totalWidth+this.grid.container.getBorderWidth('lr'));this.grid.autoSize();}
this.bwrap.setWidth(Math.max(totalWidth,this.wrap.clientWidth));if(!YAHOO.ext.util.Browser.isIE){this.wrap.scrollLeft=this.hwrap.dom.scrollLeft;}
this.syncScroll();this.forceScrollUpdate();if(this.grid.autoHeight){this.autoHeight();this.updateWrapHeight();}},setCSSWidth:function(colIndex,width,pos){var selector=["#"+this.grid.id+" .ygrid-col-"+colIndex,".ygrid-col-"+colIndex];YAHOO.ext.util.CSS.updateRule(selector,'width',width+'px');if(typeof pos=='number'){YAHOO.ext.util.CSS.updateRule(selector,'left',pos+'px');}},setCSSStyle:function(colIndex,name,value){var selector=["#"+this.grid.id+" .ygrid-col-"+colIndex,".ygrid-col-"+colIndex];YAHOO.ext.util.CSS.updateRule(selector,name,value);},handleHiddenChange:function(colModel,colIndex,hidden){if(hidden){this.hideColumn(colIndex);}else{this.unhideColumn(colIndex);}
this.updateColumns();},hideColumn:function(colIndex){var selector=["#"+this.grid.id+" .ygrid-col-"+colIndex,".ygrid-col-"+colIndex];YAHOO.ext.util.CSS.updateRule(selector,'position','absolute');YAHOO.ext.util.CSS.updateRule(selector,'visibility','hidden');this.headers[colIndex].style.display='none';this.headers[colIndex].split.style.display='none';},unhideColumn:function(colIndex){var selector=["#"+this.grid.id+" .ygrid-col-"+colIndex,".ygrid-col-"+colIndex];YAHOO.ext.util.CSS.updateRule(selector,'position','');YAHOO.ext.util.CSS.updateRule(selector,'visibility','visible');this.headers[colIndex].style.display='';this.headers[colIndex].split.style.display='';},getBodyTable:function(){return this.bwrap.dom;},updateRowIndexes:function(firstRow,lastRow){var stripeRows=this.grid.stripeRows;var bt=this.getBodyTable();var nodes=bt.childNodes;firstRow=firstRow||0;lastRow=lastRow||nodes.length-1;var re=/^(?:ygrid-row ygrid-row-alt|ygrid-row)/;for(var rowIndex=firstRow;rowIndex<=lastRow;rowIndex++){var node=nodes[rowIndex];if(stripeRows&&(rowIndex+1)%2==0){node.className=node.className.replace(re,'ygrid-row ygrid-row-alt');}else{node.className=node.className.replace(re,'ygrid-row');}
node.rowIndex=rowIndex;nodes[rowIndex].style.top=(rowIndex*this.rowHeight)+'px';}},insertRows:function(dataModel,firstRow,lastRow){this.updateBodyHeight();this.adjustForScroll(true);var renderers=this.getColumnRenderers();var dindexes=this.getDataIndexes();var colCount=this.grid.colModel.getColumnCount();var beforeRow=null;var bt=this.getBodyTable();if(firstRow<bt.childNodes.length){beforeRow=bt.childNodes[firstRow];}
for(var rowIndex=firstRow;rowIndex<=lastRow;rowIndex++){var row=document.createElement('span');row.className='ygrid-row';row.style.top=(rowIndex*this.rowHeight)+'px';this.renderRow(dataModel,row,rowIndex,colCount,renderers,dindexes);if(beforeRow){bt.insertBefore(row,beforeRow);}else{bt.appendChild(row);}}
this.updateRowIndexes(firstRow);this.adjustForScroll(true);},renderRow:function(dataModel,row,rowIndex,colCount,renderers,dindexes){for(var colIndex=0;colIndex<colCount;colIndex++){var td=document.createElement('span');td.className='ygrid-col ygrid-col-'+colIndex+(colIndex==colCount-1?' ygrid-col-last':'');td.columnIndex=colIndex;td.tabIndex=0;var span=document.createElement('span');span.className='ygrid-cell-text';td.appendChild(span);var val=renderers[colIndex](dataModel.getValueAt(rowIndex,dindexes[colIndex]),rowIndex,colIndex,td);if(typeof val=='undefined'||val==='')val='&#160;';span.innerHTML=val;row.appendChild(td);}},deleteRows:function(dataModel,firstRow,lastRow){this.updateBodyHeight();this.grid.selModel.deselectRange(firstRow,lastRow);var bt=this.getBodyTable();var rows=[];for(var rowIndex=firstRow;rowIndex<=lastRow;rowIndex++){rows.push(bt.childNodes[rowIndex]);}
for(var i=0;i<rows.length;i++){bt.removeChild(rows[i]);rows[i]=null;}
rows=null;this.updateRowIndexes(firstRow);this.adjustForScroll();},updateRows:function(dataModel,firstRow,lastRow){var bt=this.getBodyTable();var dindexes=this.getDataIndexes();var renderers=this.getColumnRenderers();var colCount=this.grid.colModel.getColumnCount();for(var rowIndex=firstRow;rowIndex<=lastRow;rowIndex++){var row=bt.rows[rowIndex];var cells=row.childNodes;for(var colIndex=0;colIndex<colCount;colIndex++){var td=cells[colIndex];var val=renderers[colIndex](dataModel.getValueAt(rowIndex,dindexes[colIndex]),rowIndex,colIndex,td);if(typeof val=='undefined'||val==='')val='&#160;';td.firstChild.innerHTML=val;}}},handleSort:function(dataModel,sortColumnIndex,sortDir,noRefresh){this.grid.selModel.syncSelectionsToIds();if(!noRefresh){this.updateRows(dataModel,0,dataModel.getRowCount()-1);}
this.updateHeaderSortState();if(this.lastFocusedRow){this.focusRow(this.lastFocusedRow);}},syncScroll:function(){this.hwrap.dom.scrollLeft=this.wrap.scrollLeft;},handleScroll:function(){this.syncScroll();this.fireScroll(this.wrap.scrollLeft,this.wrap.scrollTop);this.grid.fireEvent('bodyscroll',this.wrap.scrollLeft,this.wrap.scrollTop);},getRowHeight:function(){if(!this.rowHeight){var rule=YAHOO.ext.util.CSS.getRule(["#"+this.grid.id+" .ygrid-row",".ygrid-row"]);if(rule&&rule.style.height){this.rowHeight=parseInt(rule.style.height,10);}else{this.rowHeight=21;}}
return this.rowHeight;},renderRows:function(dataModel){this.grid.stopEditing();if(this.grid.selModel){this.grid.selModel.clearSelections();}
var bt=this.getBodyTable();bt.innerHTML='';this.rowHeight=this.getRowHeight();this.insertRows(dataModel,0,dataModel.getRowCount()-1);},updateCell:function(dataModel,rowIndex,dataIndex){var colIndex=this.getColumnIndexByDataIndex(dataIndex);if(typeof colIndex=='undefined'){return;}
var bt=this.getBodyTable();var row=bt.childNodes[rowIndex];var cell=row.childNodes[colIndex];var renderer=this.grid.colModel.getRenderer(colIndex);var val=renderer(dataModel.getValueAt(rowIndex,dataIndex),rowIndex,colIndex,cell);if(typeof val=='undefined'||val==='')val='&#160;';cell.firstChild.innerHTML=val;},calcColumnWidth:function(colIndex,maxRowsToMeasure){var maxWidth=0;var bt=this.getBodyTable();var rows=bt.childNodes;var stopIndex=Math.min(maxRowsToMeasure||rows.length,rows.length);if(this.grid.autoSizeHeaders){var h=this.headers[colIndex];var curWidth=h.style.width;h.style.width=this.grid.minColumnWidth+'px';maxWidth=Math.max(maxWidth,h.scrollWidth);h.style.width=curWidth;}
for(var i=0;i<stopIndex;i++){var cell=rows[i].childNodes[colIndex].firstChild;maxWidth=Math.max(maxWidth,cell.scrollWidth);}
return maxWidth+5;},autoSizeColumn:function(colIndex,forceMinSize){if(forceMinSize){this.setCSSWidth(colIndex,this.grid.minColumnWidth);}
var newWidth=this.calcColumnWidth(colIndex);this.grid.colModel.setColumnWidth(colIndex,Math.max(this.grid.minColumnWidth,newWidth));this.grid.fireEvent('columnresize',colIndex,newWidth);},autoSizeColumns:function(){var colModel=this.grid.colModel;var colCount=colModel.getColumnCount();var wrap=this.wrap;for(var i=0;i<colCount;i++){this.setCSSWidth(i,this.grid.minColumnWidth);colModel.setColumnWidth(i,this.calcColumnWidth(i,this.grid.maxRowsToMeasure),true);}
if(colModel.getTotalWidth()<wrap.clientWidth){var diff=Math.floor((wrap.clientWidth-colModel.getTotalWidth())/colCount);for(var i=0;i<colCount;i++){colModel.setColumnWidth(i,colModel.getColumnWidth(i)+diff,true);}}
this.updateColumns();},fitColumns:function(){var cm=this.grid.colModel;var colCount=cm.getColumnCount();var cols=[];var width=0;var i,w;for(i=0;i<colCount;i++){if(!cm.isHidden(i)&&!cm.isFixed(i)){w=cm.getColumnWidth(i);cols.push(i);cols.push(w);width+=w;}}
var frac=(this.wrap.clientWidth-cm.getTotalWidth())/width;while(cols.length){w=cols.pop();i=cols.pop();cm.setColumnWidth(i,Math.floor(w+w*frac),true);}
this.updateColumns();},onWindowResize:function(){if(this.grid.monitorWindowResize){this.adjustForScroll();this.updateWrapHeight();this.adjustForScroll();}},updateWrapHeight:function(){this.grid.container.beginMeasure();this.autoHeight();var box=this.grid.container.getSize(true);this.wrapEl.setHeight(box.height-this.footerHeight-parseInt(this.wrap.offsetTop,10));this.pwrap.setSize(box.width,box.height);this.grid.container.endMeasure();},forceScrollUpdate:function(){var wrap=this.wrapEl;wrap.setWidth(wrap.getWidth(true));setTimeout(function(){wrap.setWidth('');},1);},updateHeaderSortState:function(){var state=this.grid.dataModel.getSortState();if(!state||typeof state.column=='undefined')return;var sortColumn=this.getColumnIndexByDataIndex(state.column);var sortDir=state.direction;for(var i=0,len=this.headers.length;i<len;i++){var h=this.headers[i];if(i!=sortColumn){h.sortDesc.style.display='none';h.sortAsc.style.display='none';}else{h.sortDesc.style.display=sortDir=='DESC'?'block':'none';h.sortAsc.style.display=sortDir=='ASC'?'block':'none';}}},unplugDataModel:function(dm){dm.removeListener('cellupdated',this.updateCell,this);dm.removeListener('datachanged',this.renderRows,this);dm.removeListener('rowsdeleted',this.deleteRows,this);dm.removeListener('rowsinserted',this.insertRows,this);dm.removeListener('rowsupdated',this.updateRows,this);dm.removeListener('rowssorted',this.handleSort,this);},plugDataModel:function(dm){dm.on('cellupdated',this.updateCell,this,true);dm.on('datachanged',this.renderRows,this,true);dm.on('rowsdeleted',this.deleteRows,this,true);dm.on('rowsinserted',this.insertRows,this,true);dm.on('rowsupdated',this.updateRows,this,true);dm.on('rowssorted',this.handleSort,this,true);},destroy:function(){this.unplugDataModel(this.grid.dataModel);var sp=this.splitters;if(sp){for(var i in sp){if(sp[i]&&typeof sp[i]!='function'){sp[i].destroy(true);}}}},render:function(){var grid=this.grid;var container=grid.container.dom;var dataModel=grid.dataModel;this.plugDataModel(dataModel);var colModel=grid.colModel;colModel.onWidthChange.subscribe(this.updateColumns,this,true);colModel.onHeaderChange.subscribe(this.updateHeaders,this,true);colModel.onHiddenChange.subscribe(this.handleHiddenChange,this,true);if(grid.monitorWindowResize===true){YAHOO.ext.EventManager.onWindowResize(this.onWindowResize,this,true);}
var autoSizeDelegate=this.autoSizeColumn.createDelegate(this);var colCount=colModel.getColumnCount();var dh=YAHOO.ext.DomHelper;this.pwrap=dh.append(container,{tag:'div',cls:'ygrid-positioner',style:'position:relative;width:100%;height:100%;left:0;top:0;overflow:hidden;'},true);var pos=this.pwrap.dom;var wrap=dh.append(pos,{tag:'div',cls:'ygrid-wrap'});this.wrap=wrap;this.wrapEl=getEl(wrap,true);YAHOO.ext.EventManager.on(wrap,'scroll',this.handleScroll,this,true);var hwrap=dh.append(pos,{tag:'div',cls:'ygrid-wrap-headers'});this.hwrap=getEl(hwrap,true);var bwrap=dh.append(wrap,{tag:'div',cls:'ygrid-wrap-body',id:container.id+'-body'});this.bwrap=getEl(bwrap,true);this.bwrap.setWidth(colModel.getTotalWidth());bwrap.rows=bwrap.childNodes;this.footerHeight=0;var foot=this.appendFooter(this.pwrap.dom);if(foot){this.footer=getEl(foot,true);this.footerHeight=this.footer.getHeight();}
this.updateWrapHeight();var hrow=dh.append(hwrap,{tag:'span',cls:'ygrid-hrow'});this.hrow=hrow;if(!YAHOO.ext.util.Browser.isGecko){var iframe=document.createElement('iframe');iframe.className='ygrid-hrow-frame';iframe.frameBorder=0;iframe.src=YAHOO.ext.SSL_SECURE_URL;hwrap.appendChild(iframe);}
this.headerCtrl=new YAHOO.ext.grid.HeaderController(this.grid);this.headers=[];this.cols=[];this.splitters=[];var htemplate=dh.createTemplate({tag:'span',cls:'ygrid-hd ygrid-header-{0}',children:[{tag:'span',cls:'ygrid-hd-body',html:'<table border="0" cellpadding="0" cellspacing="0" title="{2}">'+'<tbody><tr><td><span>{1}</span></td>'+'<td><span class="sort-desc"></span><span class="sort-asc"></span></td>'+'</tr></tbody></table>'}]});for(var i=0;i<colCount;i++){var hd=htemplate.append(hrow,[i,colModel.getColumnHeader(i),colModel.getColumnTooltip(i)||'']);var spans=hd.getElementsByTagName('span');hd.textNode=spans[1];hd.sortDesc=spans[2];hd.sortAsc=spans[3];hd.columnIndex=i;this.headers.push(hd);if(colModel.isSortable(i)){this.headerCtrl.register(hd);}
var split=dh.append(hrow,{tag:'span',cls:'ygrid-hd-split'});hd.split=split;if(colModel.isResizable(i)&&!colModel.isFixed(i)){YAHOO.util.Event.on(split,'dblclick',autoSizeDelegate.createCallback(i+0,true));var sb=new YAHOO.ext.SplitBar(split,hd,null,YAHOO.ext.SplitBar.LEFT);sb.columnIndex=i;sb.minSize=grid.minColumnWidth;sb.onMoved.subscribe(this.onColumnSplitterMoved,this,true);YAHOO.util.Dom.addClass(sb.proxy,'ygrid-column-sizer');YAHOO.util.Dom.setStyle(sb.proxy,'background-color','');sb.dd._resizeProxy=function(){var el=this.getDragEl();YAHOO.util.Dom.setStyle(el,'height',(hwrap.clientHeight+wrap.clientHeight-2)+'px');};this.splitters[i]=sb;}else{split.style.cursor='default';}}
if(grid.autoSizeColumns){this.renderRows(dataModel);this.autoSizeColumns();}else{this.updateColumns();this.renderRows(dataModel);}
for(var i=0;i<colCount;i++){if(colModel.isHidden(i)){this.hideColumn(i);}}
this.updateHeaderSortState();return this.bwrap;},onColumnSplitterMoved:function(splitter,newSize){this.grid.colModel.setColumnWidth(splitter.columnIndex,newSize);this.grid.fireEvent('columnresize',splitter.columnIndex,newSize);},appendFooter:function(parentEl){return null;},autoHeight:function(){if(this.grid.autoHeight){var h=this.getBodyHeight();var c=this.grid.container;var total=h+(parseInt(this.wrap.offsetTop,10)||0)+
this.footerHeight+c.getBorderWidth('tb')+c.getPadding('tb')
+(this.wrap.offsetHeight-this.wrap.clientHeight);c.setHeight(total);}},getBodyHeight:function(){return this.grid.dataModel.getRowCount()*this.getRowHeight();;},updateBodyHeight:function(){this.getBodyTable().style.height=this.getBodyHeight()+'px';if(this.grid.autoHeight){this.autoHeight();this.updateWrapHeight();}}};YAHOO.ext.grid.GridView.SCROLLBARS_UNDER=0;YAHOO.ext.grid.GridView.SCROLLBARS_OVERLAP=1;YAHOO.ext.grid.GridView.prototype.scrollbarMode=YAHOO.ext.grid.GridView.SCROLLBARS_UNDER;YAHOO.ext.grid.GridView.prototype.fitColumnsToContainer=YAHOO.ext.grid.GridView.prototype.fitColumns;YAHOO.ext.grid.HeaderController=function(grid){this.grid=grid;this.headers=[];};YAHOO.ext.grid.HeaderController.prototype={register:function(header){this.headers.push(header);YAHOO.ext.EventManager.on(header,'selectstart',this.cancelTextSelection,this,true);YAHOO.ext.EventManager.on(header,'mousedown',this.cancelTextSelection,this,true);YAHOO.ext.EventManager.on(header,'mouseover',this.headerOver,this,true);YAHOO.ext.EventManager.on(header,'mouseout',this.headerOut,this,true);YAHOO.ext.EventManager.on(header,'click',this.headerClick,this,true);},headerClick:function(e){var grid=this.grid,cm=grid.colModel,dm=grid.dataModel;grid.stopEditing();var header=grid.getHeaderFromChild(e.getTarget());var state=dm.getSortState();var direction=header.sortDir||'ASC';if(typeof state.column!='undefined'&&grid.getView().getColumnIndexByDataIndex(state.column)==header.columnIndex){direction=(state.direction=='ASC'?'DESC':'ASC');}
header.sortDir=direction;dm.sort(cm,cm.getDataIndex(header.columnIndex),direction);},headerOver:function(e){var header=this.grid.getHeaderFromChild(e.getTarget());YAHOO.util.Dom.addClass(header,'ygrid-hd-over');},headerOut:function(e){var header=this.grid.getHeaderFromChild(e.getTarget());YAHOO.util.Dom.removeClass(header,'ygrid-hd-over');},cancelTextSelection:function(e){e.preventDefault();}};
YAHOO.ext.grid.DefaultSelectionModel=function(){this.selectedRows=[];this.selectedRowIds=[];this.lastSelectedRow=null;this.onRowSelect=new YAHOO.util.CustomEvent('SelectionTable.rowSelected');this.onSelectionChange=new YAHOO.util.CustomEvent('SelectionTable.selectionChanged');this.events={'selectionchange':this.onSelectionChange,'rowselect':this.onRowSelect};this.locked=false;};YAHOO.ext.grid.DefaultSelectionModel.prototype={init:function(grid){this.grid=grid;this.initEvents();},lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isLocked:function(){return this.locked;},initEvents:function(){if(this.grid.trackMouseOver){this.grid.addListener("mouseover",this.handleOver,this,true);this.grid.addListener("mouseout",this.handleOut,this,true);}
this.grid.addListener("rowclick",this.rowClick,this,true);this.grid.addListener("keydown",this.keyDown,this,true);},fireEvent:YAHOO.ext.util.Observable.prototype.fireEvent,on:YAHOO.ext.util.Observable.prototype.on,addListener:YAHOO.ext.util.Observable.prototype.addListener,delayedListener:YAHOO.ext.util.Observable.prototype.delayedListener,removeListener:YAHOO.ext.util.Observable.prototype.removeListener,purgeListeners:YAHOO.ext.util.Observable.prototype.purgeListeners,bufferedListener:YAHOO.ext.util.Observable.prototype.bufferedListener,syncSelectionsToIds:function(){if(this.getCount()>0){var ids=this.selectedRowIds.concat();this.clearSelections();this.selectRowsById(ids,true);}},selectRowsById:function(id,keepExisting){var rows=this.grid.getRowsById(id);if(!(rows instanceof Array)){this.selectRow(rows,keepExisting);return;}
this.selectRows(rows,keepExisting);},getCount:function(){return this.selectedRows.length;},selectFirstRow:function(){for(var j=0;j<this.grid.rows.length;j++){if(this.isSelectable(this.grid.rows[j])){this.focusRow(this.grid.rows[j]);this.setRowState(this.grid.rows[j],true);return;}}},selectNext:function(keepExisting){if(this.lastSelectedRow){for(var j=(this.lastSelectedRow.rowIndex+1);j<this.grid.rows.length;j++){var row=this.grid.rows[j];if(this.isSelectable(row)){this.focusRow(row);this.setRowState(row,true,keepExisting);return;}}}},selectPrevious:function(keepExisting){if(this.lastSelectedRow){for(var j=(this.lastSelectedRow.rowIndex-1);j>=0;j--){var row=this.grid.rows[j];if(this.isSelectable(row)){this.focusRow(row);this.setRowState(row,true,keepExisting);return;}}}},getSelectedRows:function(){return this.selectedRows;},getSelectedRowIds:function(){return this.selectedRowIds;},clearSelections:function(){if(this.isLocked())return;var oldSelections=this.selectedRows.concat();for(var j=0;j<oldSelections.length;j++){this.setRowState(oldSelections[j],false);}
this.selectedRows=[];this.selectedRowIds=[];},selectAll:function(){if(this.isLocked())return;this.selectedRows=[];this.selectedRowIds=[];for(var j=0,len=this.grid.rows.length;j<len;j++){this.setRowState(this.grid.rows[j],true,true);}},hasSelection:function(){return this.selectedRows.length>0;},isSelected:function(row){return row&&(row.selected===true||row.getAttribute('selected')=='true');},isSelectable:function(row){return row&&row.getAttribute('selectable')!='false';},rowClick:function(grid,rowIndex,e){if(this.isLocked())return;var row=grid.getRow(rowIndex);if(this.isSelectable(row)){if(e.shiftKey&&this.lastSelectedRow){var lastIndex=this.lastSelectedRow.rowIndex;this.selectRange(this.lastSelectedRow,row,e.ctrlKey);this.lastSelectedRow=this.grid.el.dom.rows[lastIndex];}else{this.focusRow(row);var rowState=e.ctrlKey?!this.isSelected(row):true;this.setRowState(row,rowState,e.hasModifier());}}},focusRow:function(row){this.grid.view.focusRow(row);},selectRow:function(row,keepExisting){this.setRowState(this.getRow(row),true,keepExisting);},selectRows:function(rows,keepExisting){if(!keepExisting){this.clearSelections();}
for(var i=0;i<rows.length;i++){this.selectRow(rows[i],true);}},deselectRow:function(row){this.setRowState(this.getRow(row),false);},getRow:function(row){if(typeof row=='number'){row=this.grid.rows[row];}
return row;},selectRange:function(startRow,endRow,keepExisting){startRow=this.getRow(startRow);endRow=this.getRow(endRow);this.setRangeState(startRow,endRow,true,keepExisting);},deselectRange:function(startRow,endRow){startRow=this.getRow(startRow);endRow=this.getRow(endRow);this.setRangeState(startRow,endRow,false,true);},setRowStateFromChild:function(childEl,selected,keepExisting){var row=this.grid.getRowFromChild(childEl);this.setRowState(row,selected,keepExisting);},setRangeState:function(startRow,endRow,selected,keepExisting){if(this.isLocked())return;if(!keepExisting){this.clearSelections();}
var curRow=startRow;while(curRow.rowIndex!=endRow.rowIndex){this.setRowState(curRow,selected,true);curRow=(startRow.rowIndex<endRow.rowIndex?this.grid.getRowAfter(curRow):this.grid.getRowBefore(curRow))}
this.setRowState(endRow,selected,true);},setRowState:function(row,selected,keepExisting){if(this.isLocked())return;if(this.isSelectable(row)){if(selected){if(!keepExisting){this.clearSelections();}
this.setRowClass(row,'selected');row.selected=true;this.selectedRows.push(row);this.selectedRowIds.push(this.grid.dataModel.getRowId(row.rowIndex));this.lastSelectedRow=row;}else{this.setRowClass(row,'');row.selected=false;this._removeSelected(row);}
this.fireEvent('rowselect',this,row,selected);this.fireEvent('selectionchange',this,this.selectedRows,this.selectedRowIds);}},handleOver:function(e){var row=this.grid.getRowFromChild(e.getTarget());if(this.isSelectable(row)&&!this.isSelected(row)){this.setRowClass(row,'over');}},handleOut:function(e){var row=this.grid.getRowFromChild(e.getTarget());if(this.isSelectable(row)&&!this.isSelected(row)){this.setRowClass(row,'');}},keyDown:function(e){if(e.browserEvent.keyCode==e.DOWN){this.selectNext(e.shiftKey);e.preventDefault();}else if(e.browserEvent.keyCode==e.UP){this.selectPrevious(e.shiftKey);e.preventDefault();}},setRowClass:function(row,cssClass){if(this.isSelectable(row)){if(cssClass=='selected'){YAHOO.util.Dom.removeClass(row,'ygrid-row-over');YAHOO.util.Dom.addClass(row,'ygrid-row-selected');}else if(cssClass=='over'){YAHOO.util.Dom.removeClass(row,'ygrid-row-selected');YAHOO.util.Dom.addClass(row,'ygrid-row-over');}else if(cssClass==''){YAHOO.util.Dom.removeClass(row,'ygrid-row-selected');YAHOO.util.Dom.removeClass(row,'ygrid-row-over');}}},_removeSelected:function(row){var sr=this.selectedRows;for(var i=0;i<sr.length;i++){if(sr[i]===row){this.selectedRows.splice(i,1);this.selectedRowIds.splice(i,1);return;}}}};YAHOO.ext.grid.SingleSelectionModel=function(){YAHOO.ext.grid.SingleSelectionModel.superclass.constructor.call(this);};YAHOO.extendX(YAHOO.ext.grid.SingleSelectionModel,YAHOO.ext.grid.DefaultSelectionModel);YAHOO.ext.grid.SingleSelectionModel.prototype.setRowState=function(row,selected){YAHOO.ext.grid.SingleSelectionModel.superclass.setRowState.call(this,row,selected,false);};YAHOO.ext.grid.DisableSelectionModel=function(){YAHOO.ext.grid.DisableSelectionModel.superclass.constructor.call(this);};YAHOO.extendX(YAHOO.ext.grid.DisableSelectionModel,YAHOO.ext.grid.DefaultSelectionModel);YAHOO.ext.grid.DisableSelectionModel.prototype.initEvents=function(){};
YAHOO.ext.grid.AbstractDataModel=function(){this.onCellUpdated=new YAHOO.util.CustomEvent('onCellUpdated');this.onTableDataChanged=new YAHOO.util.CustomEvent('onTableDataChanged');this.onRowsDeleted=new YAHOO.util.CustomEvent('onRowsDeleted');this.onRowsInserted=new YAHOO.util.CustomEvent('onRowsInserted');this.onRowsUpdated=new YAHOO.util.CustomEvent('onRowsUpdated');this.onRowsSorted=new YAHOO.util.CustomEvent('onRowsSorted');this.events={'cellupdated':this.onCellUpdated,'datachanged':this.onTableDataChanged,'rowsdeleted':this.onRowsDeleted,'rowsinserted':this.onRowsInserted,'rowsupdated':this.onRowsUpdated,'rowssorted':this.onRowsSorted};};YAHOO.ext.grid.AbstractDataModel.prototype={fireEvent:YAHOO.ext.util.Observable.prototype.fireEvent,on:YAHOO.ext.util.Observable.prototype.on,addListener:YAHOO.ext.util.Observable.prototype.addListener,delayedListener:YAHOO.ext.util.Observable.prototype.delayedListener,removeListener:YAHOO.ext.util.Observable.prototype.removeListener,purgeListeners:YAHOO.ext.util.Observable.prototype.purgeListeners,bufferedListener:YAHOO.ext.util.Observable.prototype.bufferedListener,fireCellUpdated:function(row,col){this.onCellUpdated.fireDirect(this,row,col);},fireTableDataChanged:function(){this.onTableDataChanged.fireDirect(this);},fireRowsDeleted:function(firstRow,lastRow){this.onRowsDeleted.fireDirect(this,firstRow,lastRow);},fireRowsInserted:function(firstRow,lastRow){this.onRowsInserted.fireDirect(this,firstRow,lastRow);},fireRowsUpdated:function(firstRow,lastRow){this.onRowsUpdated.fireDirect(this,firstRow,lastRow);},fireRowsSorted:function(sortColumnIndex,sortDir,noRefresh){this.onRowsSorted.fireDirect(this,sortColumnIndex,sortDir,noRefresh);},sort:function(sortInfo,columnIndex,direction,suppressEvent){},getSortState:function(){return{column:this.sortColumn,direction:this.sortDir};},getRowCount:function(){},getTotalRowCount:function(){return this.getRowCount();},getRowId:function(rowIndex){},getValueAt:function(rowIndex,colIndex){},setValueAt:function(value,rowIndex,colIndex){},isPaged:function(){return false;}};
YAHOO.ext.grid.DefaultDataModel=function(data){YAHOO.ext.grid.DefaultDataModel.superclass.constructor.call(this);this.data=data;};YAHOO.extendX(YAHOO.ext.grid.DefaultDataModel,YAHOO.ext.grid.AbstractDataModel,{getRowCount:function(){return this.data.length;},getRowId:function(rowIndex){return this.data[rowIndex][0];},getRow:function(rowIndex){return this.data[rowIndex];},getRows:function(indexes){var data=this.data;var r=[];for(var i=0;i<indexes.length;i++){r.push(data[indexes[i]]);}
return r;},getValueAt:function(rowIndex,colIndex){return this.data[rowIndex][colIndex];},setValueAt:function(value,rowIndex,colIndex){this.data[rowIndex][colIndex]=value;this.fireCellUpdated(rowIndex,colIndex);},removeRows:function(startIndex,endIndex){endIndex=endIndex||startIndex;this.data.splice(startIndex,endIndex-startIndex+1);this.fireRowsDeleted(startIndex,endIndex);},removeRow:function(index){this.data.splice(index,1);this.fireRowsDeleted(index,index);},removeAll:function(){var count=this.getRowCount();if(count>0){this.removeRows(0,count-1);}},query:function(spec,returnUnmatched){var d=this.data;var r=[];for(var i=0;i<d.length;i++){var row=d[i];var isMatch=true;for(var col in spec){if(!isMatch)continue;var filter=spec[col];switch(typeof filter){case'string':case'number':case'boolean':if(row[col]!=filter){isMatch=false;}
break;case'function':if(!filter(row[col],row)){isMatch=false;}
break;case'object':if(filter instanceof RegExp){if(String(row[col]).search(filter)===-1){isMatch=false;}}
break;}}
if(isMatch&&!returnUnmatched){r.push(i);}else if(!isMatch&&returnUnmatched){r.push(i);}}
return r;},filter:function(query){var matches=this.query(query,true);var data=this.data;for(var i=0;i<matches.length;i++){data[matches[i]]._deleted=true;}
for(var i=0;i<data.length;i++){while(data[i]&&data[i]._deleted===true){this.removeRow(i);}}
return matches.length;},addRow:function(cellValues){this.data.push(cellValues);var newIndex=this.data.length-1;this.fireRowsInserted(newIndex,newIndex);this.applySort();return newIndex;},addRows:function(rowData){this.data=this.data.concat(rowData);var firstIndex=this.data.length-rowData.length;this.fireRowsInserted(firstIndex,firstIndex+rowData.length-1);this.applySort();},insertRow:function(index,cellValues){this.data.splice(index,0,cellValues);this.fireRowsInserted(index,index);this.applySort();return index;},insertRows:function(index,rowData){var args=rowData.concat();args.splice(0,0,index,0);this.data.splice.apply(this.data,args);this.fireRowsInserted(index,index+rowData.length-1);this.applySort();},applySort:function(suppressEvent){if(typeof this.sortColumn!='undefined'){this.sort(this.sortInfo,this.sortColumn,this.sortDir,suppressEvent);}},setDefaultSort:function(sortInfo,columnIndex,direction){this.sortInfo=sortInfo;this.sortColumn=columnIndex;this.sortDir=direction;},sort:function(sortInfo,columnIndex,direction,suppressEvent){this.sortInfo=sortInfo;this.sortColumn=columnIndex;this.sortDir=direction;var dsc=(direction&&direction.toUpperCase()=='DESC');var sortType=null;if(sortInfo!=null){if(typeof sortInfo=='function'){sortType=sortInfo;}else if(typeof sortInfo=='object'){sortType=sortInfo.getSortType(columnIndex);;}}
var fn=function(cells,cells2){var v1=sortType?sortType(cells[columnIndex],cells):cells[columnIndex];var v2=sortType?sortType(cells2[columnIndex],cells2):cells2[columnIndex];if(v1<v2)
return dsc?+1:-1;if(v1>v2)
return dsc?-1:+1;return 0;};this.data.sort(fn);if(!suppressEvent){this.fireRowsSorted(columnIndex,direction);}},each:function(fn,scope){var d=this.data;for(var i=0,len=d.length;i<len;i++){if(fn.call(scope||window,d[i],i)===false)break;}}});if(YAHOO.ext.grid.DefaultColumnModel){YAHOO.ext.grid.DefaultDataModel.sortTypes=YAHOO.ext.grid.DefaultColumnModel.sortTypes;}
YAHOO.ext.grid.LoadableDataModel=function(dataType){YAHOO.ext.grid.LoadableDataModel.superclass.constructor.call(this,[]);this.onLoad=new YAHOO.util.CustomEvent('load');this.onLoadException=new YAHOO.util.CustomEvent('loadException');this.events['load']=this.onLoad;this.events['beforeload']=new YAHOO.util.CustomEvent('beforeload');this.events['loadexception']=this.onLoadException;this.dataType=dataType;this.preprocessors=[];this.postprocessors=[];this.loadedPage=1;this.remoteSort=false;this.pageSize=0;this.pageUrl=null;this.baseParams={};this.paramMap={'page':'page','pageSize':'pageSize','sortColumn':'sortColumn','sortDir':'sortDir'};};YAHOO.extendX(YAHOO.ext.grid.LoadableDataModel,YAHOO.ext.grid.DefaultDataModel,{setLoadedPage:function(pageNum,userCallback){this.loadedPage=pageNum;if(typeof userCallback=='function'){userCallback();}},isPaged:function(){return this.pageSize>0;},getTotalRowCount:function(){return this.totalCount||this.getRowCount();},getPageSize:function(){return this.pageSize;},getTotalPages:function(){if(this.getPageSize()==0||this.getTotalRowCount()==0){return 1;}
return Math.ceil(this.getTotalRowCount()/this.getPageSize());},initPaging:function(url,pageSize,baseParams){this.pageUrl=url;this.pageSize=pageSize;this.remoteSort=true;if(baseParams)this.baseParams=baseParams;},createParams:function(pageNum,sortColumn,sortDir){var params={},map=this.paramMap;for(var key in this.baseParams){if(typeof this.baseParams[key]!='function'){params[key]=this.baseParams[key];}}
params[map['page']]=pageNum;params[map['pageSize']]=this.getPageSize();params[map['sortColumn']]=(typeof sortColumn=='undefined'?'':sortColumn);params[map['sortDir']]=sortDir||'';return params;},loadPage:function(pageNum,callback,keepExisting){var sort=this.getSortState();var params=this.createParams(pageNum,sort.column,sort.direction);this.load(this.pageUrl,params,this.setLoadedPage.createDelegate(this,[pageNum,callback]),keepExisting?(pageNum-1)*this.pageSize:null);},applySort:function(suppressEvent){if(!this.remoteSort){YAHOO.ext.grid.LoadableDataModel.superclass.applySort.apply(this,arguments);}else if(!suppressEvent){var sort=this.getSortState();if(sort.column){this.fireRowsSorted(sort.column,sort.direction,true);}}},resetPaging:function(){this.loadedPage=1;},sort:function(sortInfo,columnIndex,direction,suppressEvent){if(!this.remoteSort){YAHOO.ext.grid.LoadableDataModel.superclass.sort.apply(this,arguments);}else{this.sortInfo=sortInfo;this.sortColumn=columnIndex;this.sortDir=direction;var params=this.createParams(this.loadedPage,columnIndex,direction);this.load(this.pageUrl,params,this.fireRowsSorted.createDelegate(this,[columnIndex,direction,true]));}},load:function(url,params,callback,insertIndex){this.fireEvent('beforeload',this);if(params&&typeof params!='string'){var buf=[];for(var key in params){if(typeof params[key]!='function'){buf.push(encodeURIComponent(key),'=',encodeURIComponent(params[key]),'&');}}
delete buf[buf.length-1];params=buf.join('');}
var cb={success:this.processResponse,failure:this.processException,scope:this,argument:{callback:callback,insertIndex:insertIndex}};var method=params?'POST':'GET';this.transId=YAHOO.util.Connect.asyncRequest(method,url,cb,params);},processResponse:function(response){var cb=response.argument.callback;var keepExisting=(typeof response.argument.insertIndex=='number');var insertIndex=response.argument.insertIndex;switch(this.dataType){case YAHOO.ext.grid.LoadableDataModel.XML:this.loadData(response.responseXML,cb,keepExisting,insertIndex);break;case YAHOO.ext.grid.LoadableDataModel.JSON:var rtext=response.responseText;try{while(rtext.substring(0,1)==" "){rtext=rtext.substring(1,rtext.length);}
if(rtext.indexOf("{")<0){throw"Invalid JSON response";}
if(rtext.indexOf("{}")===0){this.loadData({},response.argument.callback);return;}
var jsonObjRaw=eval("("+rtext+")");if(!jsonObjRaw){throw"Error evaling JSON response";}
this.loadData(jsonObjRaw,cb,keepExisting,insertIndex);}catch(e){this.fireLoadException(e,response);if(typeof cb=='function'){cb(this,false);}}
break;case YAHOO.ext.grid.LoadableDataModel.TEXT:this.loadData(response.responseText,cb,keepExisting,insertIndex);break;};},processException:function(response){this.fireLoadException(null,response);if(typeof response.argument.callback=='function'){response.argument.callback(this,false);}},fireLoadException:function(e,responseObj){this.onLoadException.fireDirect(this,e,responseObj);},fireLoadEvent:function(){this.fireEvent('load',this.loadedPage,this.getTotalPages());},addPreprocessor:function(columnIndex,fn){this.preprocessors[columnIndex]=fn;},getPreprocessor:function(columnIndex){return this.preprocessors[columnIndex];},removePreprocessor:function(columnIndex){this.preprocessors[columnIndex]=null;},addPostprocessor:function(columnIndex,fn){this.postprocessors[columnIndex]=fn;},getPostprocessor:function(columnIndex){return this.postprocessors[columnIndex];},removePostprocessor:function(columnIndex){this.postprocessors[columnIndex]=null;},loadData:function(data,callback,keepExisting,insertIndex){}});YAHOO.ext.grid.LoadableDataModel.XML='xml';YAHOO.ext.grid.LoadableDataModel.JSON='json';YAHOO.ext.grid.LoadableDataModel.TEXT='text';
YAHOO.ext.util.CSS=new function(){var rules=null;var toCamel=function(property){var convert=function(prop){var test=/(-[a-z])/i.exec(prop);return prop.replace(RegExp.$1,RegExp.$1.substr(1).toUpperCase());};while(property.indexOf('-')>-1){property=convert(property);}
return property;};this.getRules=function(refreshCache){if(rules==null||refreshCache){rules={};var ds=document.styleSheets;for(var i=0,len=ds.length;i<len;i++){try{var ss=ds[i];var ssRules=ss.cssRules||ss.rules;for(var j=ssRules.length-1;j>=0;--j){rules[ssRules[j].selectorText]=ssRules[j];}}catch(e){}}}
return rules;};this.getRule=function(selector,refreshCache){var rs=this.getRules(refreshCache);if(!(selector instanceof Array)){return rs[selector];}
for(var i=0;i<selector.length;i++){if(rs[selector[i]]){return rs[selector[i]];}}
return null;};this.updateRule=function(selector,property,value){if(!(selector instanceof Array)){var rule=this.getRule(selector);if(rule){rule.style[toCamel(property)]=value;return true;}}else{for(var i=0;i<selector.length;i++){if(this.updateRule(selector[i],property,value)){return true;}}}
return false;};this.apply=function(el,selector){if(!(selector instanceof Array)){var rule=this.getRule(selector);if(rule){var s=rule.style;for(var key in s){if(typeof s[key]!='function'){if(s[key]&&String(s[key]).indexOf(':')<0&&s[key]!='false'){try{el.style[key]=s[key];}catch(e){}}}}
return true;}}else{for(var i=0;i<selector.length;i++){if(this.apply(el,selector[i])){return true;}}}
return false;};this.applyFirst=function(el,id,selector){var selectors=['#'+id+' '+selector,selector];return this.apply(el,selectors);};this.revert=function(el,selector){if(!(selector instanceof Array)){var rule=this.getRule(selector);if(rule){for(key in rule.style){if(rule.style[key]&&String(rule.style[key]).indexOf(':')<0&&rule.style[key]!='false'){try{el.style[key]='';}catch(e){}}}
return true;}}else{for(var i=0;i<selector.length;i++){if(this.revert(el,selector[i])){return true;}}}
return false;};this.revertFirst=function(el,id,selector){var selectors=['#'+id+' '+selector,selector];return this.revert(el,selectors);};}();
var com={};com.jive={};com.jive.sparkweb={};com.jive.sparkweb.control={buttons:{login:"login",createAccount:"create-account"},fields:{username:"name",loginusername:"loginname",loginpassword:"loginpassword"},init:function(){var userNameField=com.jive.sparkweb.control.fields["loginusername"];var passwordField=com.jive.sparkweb.control.fields["loginpassword"];var loginButton=getEl(com.jive.sparkweb.control.buttons.login);var loginAction=Event.stop.bind();loginAction=loginAction.createSequence(function(usernameField,passwordField){getEl(usernameField).blur();getEl(passwordField).blur();}.bind(null,userNameField,passwordField));loginAction=loginAction.createSequence(org.jive.spank.control.doConnect.createCallback($F.createCallback(userNameField),$F.createCallback(passwordField),window.location.hostname, com.jive.sparkweb.control.actions));loginButton.addListener("click",loginAction);var createAccountButton=getEl(com.jive.sparkweb.control.buttons.createAccount);if(createAccountButton)
createAccountButton.addListener("click",com.jive.sparkweb.control.createAccount);var accountForm=getEl("jive_sw_account-creation-form");accountForm.setDisplayed(false);getEl("jive_sw_userbar-container").setVisible(false);getEl(userNameField).dom.focus();},createAccount:function(e){var createAccountButton=getEl("btn-create-account");var loginForm=getEl("jive_sw_login-form");var accountForm=getEl("jive_sw_account-creation-form");if(loginForm.isDisplayed()){createAccountButton.replaceClass("btn-create-account","btn-create-account-depressed");loginForm.setDisplayed(false);accountForm.setDisplayed(true);getEl(com.jive.sparkweb.control.fields.username).focus();}
else{createAccountButton.replaceClass("btn-create-account-depressed","btn-create-account");accountForm.setDisplayed(false);loginForm.setDisplayed(true);getEl(com.jive.sparkweb.control.fields.loginusername).focus();}
Event.stop(e);}}

com.jive.sparkweb.control.actions={onConnecting:function(){var loginErrorEl=getEl("login-error");if(loginErrorEl){loginErrorEl.remove();}
getEl("loginname-label").removeClass("jive_red");getEl(com.jive.sparkweb.control.fields["loginusername"]).removeClass("error");getEl("password-label").removeClass("jive_red");getEl(com.jive.sparkweb.control.fields["loginpassword"]).removeClass("error");getEl("jive_sw_login").addClass("jive-login-hidden");var loginError=getEl("login-error");if(loginError){loginError.remove();}
$(com.jive.sparkweb.control.fields["loginpassword"]).value="";document.getElementById("login-version").style.visibility="hidden";var loader=$("jive_loader")
loader.style.visibility="visible";loader.style.display="block";},onConnected:function(){getEl("jive_sw_login-container").setVisible(false);$("jive_loader").style.display="none";getEl("jive_sw_userbar-container").setVisible(true,true);},onDisconnected:function(){getEl("jive_sw_login-container").setVisible(true,true,1);$("jive_loader").style.display="none";getEl("jive_sw_login").removeClass("jive-login-hidden");getEl("jive_sw_userbar-container").setVisible(false,true);},onFailedAuthentication:function(){var template=new YAHOO.ext.DomHelper.Template(com.jive.sparkweb.control.templates.authentication_failed.join(''));template.append("jive_sw_login-form",{});getEl("loginname-label").addClass("jive_red");getEl(com.jive.sparkweb.control.fields["loginusername"]).addClass("error");getEl("password-label").addClass("jive_red");getEl(com.jive.sparkweb.control.fields["loginpassword"]).addClass("error");com.jive.sparkweb.control.actions.onDisconnected();},onError:function(){com.jive.sparkweb.control.actions.onDisconnected();}};YAHOO.ext.EventManager.addListener(window,"load",com.jive.sparkweb.control.init);com.jive.sparkweb.control.templates={create_passwords_dont_match:['<p id="create-error" class="error">',"I'm sorry but your <span class=\"jive_red\"><strong>password's</strong></span>"," did not match. Please re-enter your password and try again.</p>"],authentication_failed:['<p id="login-error" class="error">',"Please enter a valid <span class='jive_red'>username</span> and ","<span class='jive_red'>password</span>.</p>"]}

org.jive.spank.control.windows = {};    	




if(!XMPP) {
    var XMPP = {};
}


/**
 * @projectDescription 	Poly9's polyvalent URLParser class
 *
 * @author	Denis Laprise - denis@poly9.com - http://poly9.com
 * @version	0.1
 * @namespace	Poly9
 *
 * Usage: var p = new Poly9.URLParser('http://user:password@poly9.com/pathname?arguments=1#fragment');
 * p.getHost() == 'poly9.com';
 * p.getProtocol() == 'http';
 * p.getPathname() == '/pathname';
 * p.getQuerystring() == 'arguments=1';
 * p.getFragment() == 'fragment';
 * p.getUsername() == 'user';
 * p.getPassword() == 'password';
 *
 * See the unit test file for more examples.
 * URLParser is freely distributable under the terms of an MIT-style license.
 */

if (typeof Poly9 == 'undefined')
    var Poly9 = {};

/**
 * Creates an URLParser instance
 *
 * @classDescription	Creates an URLParser instance
 * @return {Object}	return an URLParser object
 * @param {String} url	The url to parse
 * @constructor
 * @exception {String}  Throws an exception if the specified url is invalid
 */
Poly9.URLParser = function(url) {
    this._fields = {'Username' : 4, 'Password' : 5, 'Port' : 7, 'Protocol' : 2, 'Host' : 6, 'Pathname' : 8, 'URL' : 0, 'Querystring' : 9, 'Fragment' : 10};
    this._values = {};
    this._regex = null;
    this.version = 0.1;
    this._regex = /^((\w+):\/\/)?((\w+):?(\w+)?@)?([^\/\?:]+):?(\d+)?(\/?[^\?#]+)?\??([^#]+)?#?(\w*)/;
    for (var f in this._fields)
        this['get' + f] = this._makeGetter(f);
    if (typeof url != 'undefined')
        this._parse(url);
}

/**
 * @method
 * @param {String} url	The url to parse
 * @exception {String} 	Throws an exception if the specified url is invalid
 */
Poly9.URLParser.prototype.setURL = function(url) {
    this._parse(url);
}

Poly9.URLParser.prototype._initValues = function() {
    for (var f in this._fields)
        this._values[f] = '';
}

Poly9.URLParser.prototype._parse = function(url) {
    this._initValues();
    var r = this._regex.exec(url);
    if (!r) throw "DPURLParser::_parse -> Invalid URL"
    for (var f in this._fields) if (typeof r[this._fields[f]] != 'undefined')
        this._values[f] = r[this._fields[f]];
}

Poly9.URLParser.prototype._makeGetter = function(field) {
    return function() {
        return this._values[field];
    }
}

/*
if (typeof console == 'undefined' || !console["firebug"]) {
    // Try to be compatible with other browsers
    // Only use firebug logging when available
    var console = new Object;
    console.trace = function() {
    };
    console.log = function() {
    };
    console.debug = function(message) {
        if (typeof opera != "undefined") {
            opera.postError(message);
        }
    };
    console.info = function() {
    };
    console.warn = function() {
        alert("Warn: " + message);    
    };
    console.error = function(message) {
        if (typeof window["opera"] != "undefined") {
            window["opera"].postError(message);
        }
        alert("Error: " + message);
    };
    console.time = function() {
    };
    console.timeEnd = function() {
    };
    console.count = function() {
    };
    console.profile = function() {
    };
    console.profileEnd = function() {
    };
}

*/


XMPP.SASLAuth = {};
XMPP.SASLAuth.Plain = function(username, password, domain) {
    var authContent = username + "@" + domain;
    authContent += '\u0000';
    authContent += username;
    authContent += '\u0000';
    authContent += password;

    authContent = util.base64.encode(authContent);

    var attrs = {
        mechanism: "PLAIN",
        xmlns: "urn:ietf:params:xml:ns:xmpp-sasl"
    }

    // TODO would like to remove this dependency and create an auth packet
    this.request = org.jive.util.XML.element("auth", authContent, attrs);

    console.debug("Plain auth request: %s", this.request);
    this.stage = 0;
}

XMPP.SASLAuth.Plain.prototype = {
    handleResponse: function(stage, response) {
        var success = response.tagName == "success";
        return {
            authComplete: true,
            authSuccess: success,
            authStage: stage++
        };
    }
}

XMPP.SASLAuth.Anonymous = function() {
    var attrs = {
        mechanism: "ANONYMOUS",
        xmlns: "urn:ietf:params:xml:ns:xmpp-sasl"
    }

    this.request = org.jive.util.XML.element("auth", null, attrs);
    console.debug("Plain auth request: %s", this.request);
}

XMPP.SASLAuth.Anonymous.prototype = {
    handleResponse: function(stage, responseBody) {
        var success = responseBody.tagName == "success";
        return {
            authComplete: true,
            authSuccess: success,
            authStage: stage++
        };
    }
}

if(!org) {
    var org = {};
}
if(!org.jive) {
    org.jive = {};
}
if (!org.jive.spank) {
    org.jive.spank = {};
}
org.jive.spank.chat = {};
/**
 * Creates a ChatManager object. The ChatManager object will hook up the listeners on the
 * connection object to deal with incoming and outgoing chats.
 *
 * @param {XMPPConnection} connection the connection object which this ChatManager is being
 * initialized for.
 * @param {String} server the server for which this ChatManager is handling chats.
 * @param {boolean} shouldUseThreads boolean indicating whether threads should be used to uniquely identify
 * conversations between two entities.
 */
org.jive.spank.chat.Manager = function(connection, server, shouldUseThreads) {
    if (!connection || !(connection instanceof XMPPConnection)) {
        throw Error("connection required for ChatManager.");
    }

    this.getConnection = function () {
        return connection;
    }

    this.servers = {};
    if (server) {
        this.servers[server] = false;
    }

    var self = this;
    connection.addConnectionListener({
        connectionClosed: function() {
            self.destroy();
        }
    });

    this.packetFilter = new org.jive.spank.PacketFilter(this._createMessageHandler(),
            this._createMessageFilter());
    connection.addPacketFilter(this.packetFilter);

    this._chatSessions = new Array();
    this._chatSessionListeners = new Array();
    this._baseID = util.StringUtil.randomString(5);
    this._threadID = 1;
    this.shouldUseThreads = shouldUseThreads;

    this.presenceFilter = new org.jive.spank.PacketFilter(this._presenceHandler.bind(this), function(packet) {
        return packet.getPacketType() == "presence" && packet.getType() == "unavailable";
    });
    connection.addPacketFilter(this.presenceFilter);
}

org.jive.spank.chat.Manager.prototype = {
    _createMessageHandler: function() {
        var manager = this;
        return function(message) {
            manager._handleMessage(message);
        }
    },
    _createMessageFilter: function() {
        return function(packet) {
            return packet.getPacketType() == "message" && packet.getType() == "chat" && packet.getBody();
        }
    },
    _presenceHandler: function(packet) {
        // If the user sends an unavailable from the resource we are chatting with we want to revert
        // to undefined for the resource
        var chatSession = this._chatSessions.find(function(session) {
            return session.sessionMatches(packet.getFrom(), null, true);
        });
        if (!chatSession || this.servers[packet.getFrom().getDomain()]) {
            return;
        }
        var bareJID = chatSession.getJID().getBareJID();
        chatSession.getJID = function() {
            return bareJID;
        };
    },
    _handleMessage: function(message) {
        console.debug("Handling message: %s", message.getID());

        var chatSession = this._chatSessions.find(function(session) {
            return session.sessionMatches(message.getFrom(), message.getThread());
        });
        if (!chatSession) {
            chatSession = this.createSession(message.getFrom(), (this.shouldUseThreads ?
                                                                 message.getThread() : null));
        }

        chatSession._handleMessage(message);
    },
/**
 * A chat session listener listens for new chat sessions to be created on the connection.
 *
 * @param {Function} listener called when a new session is created with the manager and session as
 * parameters.
 */
    addChatSessionListener: function(listener) {
        this._chatSessionListeners.push(listener);
    },
/**
 * Removes a chat session listener from the manager.
 *
 * @param {Function} listener the listener being removed.
 */
    removeChatSessionListener: function(listener) {
        if (!listener) {
            return;
        }
        var index = this._chatSessionListeners.indexOf(listener);
        if (index >= 0) {
            this._chatSessionListeners.splice(index, 1);
        }
    },
/**
 * Closes a chat session.
 *
 * @param {org.jive.spank.chat.Session} session the session being closed.
 */
    closeChatSession: function(session) {
        if (!session) {
            return;
        }

        var index = this._chatSessions.indexOf(session);
        if (index < 0) {
            return;
        }

        this._chatSessions.splice(index, 1);
        delete session._messageListeners;
        this._fireChatSessionClosed(session);
    },
    _fireNewChatSessionCreated: function(session) {
        var manager = this;
        this._chatSessionListeners.each(function(listener) {
            if (listener.created) {
                listener.created(manager, session);
            }
        });
    },
    _fireChatSessionClosed: function(session) {
        var manager = this;
        this._chatSessionListeners.each(function(listener) {
            if (listener.closed) {
                listener.closed(manager, session);
            }
        });
    },
/**
 * Returns a chat session given a jid and a thread that uniquely identify a session. The thread parameter is
 * optional and only utilized if threads are enabled.
 *
 * @param {XMPP.JID} jid the jid for which to find the releated chat session.
 * @param {String} thread (optional) the thread for which to find the related chat session.
 */
    getSession: function(jid, thread) {
        return this._chatSessions.find(function(session) {
            return session.sessionMatches(jid, thread);
        });
    },
    createSession: function(jid, thread) {
        if (!jid) {
            throw new Error("JID must be specified.");
        }
        if (!thread && this.shouldUseThreads) {
            thread = this._createThreadID();
        }

        var session = new org.jive.spank.chat.Session(this, jid, thread);
        this._chatSessions.push(session);
        this._fireNewChatSessionCreated(session);
        return session;
    },
    registerDomain: function(domain, shouldMatchFullJID) {
        this.servers[domain] = shouldMatchFullJID;
    },
    _createThreadID: function() {
        return this._baseID + this._threadID++;
    },
    destroy: function() {
        for (var i = 0; i < this._chatSessions.length; i++) {
            this.closeChatSession(this._chatSessions[i]);
        }
        this._chatSessions.clear();

        this._chatSessionListeners.clear();
        delete this._chatSessionListeners;
        this.getConnection = Prototype.emptyFunction;
    }
}

org.jive.spank.chat.Session = function(manager, jid, thread) {
    this.getJID = function() {
        return jid;
    };
    this.getThread = function() {
        return thread;
    };
    this.getManager = function() {
        return manager;
    };

    this._messageListeners = new Array();
}

org.jive.spank.chat.Session.prototype = {
    getJIDString: function() {
        if (this.getManager().servers[this.getJID().getDomain()]) {
            return this.getJID().toString();
        }
        else {
            return this.getJID().toBareJID();
        }
    },
    sessionMatches: function(jid, thread, matchFullJID) {
        var jidMatches;
        if (this.getManager().servers[jid.getDomain()] || matchFullJID) {
            jidMatches = jid.toString() == this.getJID().toString();
        }
        else {
            jidMatches = jid.toBareJID() == this.getJID().toBareJID();
        }

        if (this.getManager().shouldUseThreads && thread) {
            return jidMatches && this.getThread() == thread;
        }
        else {
            return jidMatches;
        }
    },
    addListener: function(listener) {
        if (!listener) {
            return;
        }
        this._messageListeners.push(listener);
    },
    _handleMessage: function(message) {
        var session = this;
        var jid = message.getFrom();
        this.getJID = function() {
            return jid;
        }
        this._messageListeners.each(function(listener) {
            if (listener.messageRecieved) {
                listener.messageRecieved(session, message);
            }
        });
    },
    sendMessage: function(messageBody, message) {
        if (!message) {
            message = new XMPP.Message("chat", this.getManager().getConnection()._jid,
                    this.getJID());
        }
        else {
            message.setTo(this.getJID());
            message.setType("chat");
            message.setBody(messageBody);
        }
        message.setBody(messageBody);
        message.setThread(this.getThread());

        this.getManager().getConnection().sendPacket(message);
    }
}

/**
 * A listener utilized by the ChatManager to notify interested parties when a new ChatSession is
 * created or destroyed.
 *
 * @param {Function} sessionCreated called when a new chat session is created.
 * @param {Function} sessionClosed called when a caht session is closed.
 */
org.jive.spank.chat.ChatSessionListener = function(sessionCreated, sessionClosed) {
    this.created = sessionCreated;
    this.closed = sessionClosed;
}

org.jive.spank.presence = {};

/**
 * Creates a presence manager. The presence manager class handles the user's presence, and
 * also keeps track of all presences recieved from remote users. Presence interceptors can
 * be added in order to add extensions to sent presence packets.
 *
 * @param {XMPPConnection} connection the connection on which this presence manager will use.
 * @param {XMPP.JID} all packets originating from this manager will be sent to this JID if they
 * do not already have a to set on them.
 * @param {String} the mode to process subscriptions, accept, reject, or manual.
 */
org.jive.spank.presence.Manager = function(connection, jid, subscriptionMode) {
    if (!connection || !(connection instanceof XMPPConnection)) {
        throw Error("Connection required for the presence manager.");
    }

    this.getConnection = function() {
        return connection;
    }

    var self = this;
    connection.addConnectionListener({
        connectionClosed: function() {
            self.destroy();
        }
    });

    if (!jid) {
        this._presencePacketFilter = new org.jive.spank.PacketFilter(this._createPresencePacketHandler(),
                function(packet) {
                    return packet.getPacketType() == "presence";
                });
    }
    else {
        this._presencePacketFilter = new org.jive.spank.PacketFilter(this._createPresencePacketHandler(),
                function(packet) {
                    return packet.getPacketType() == "presence" && packet.getFrom().toBareJID() == jid.toBareJID();
                });
    }

    connection.addPacketFilter(this._presencePacketFilter);
    this._presenceListeners = new Array();
    this._presence = {};
    this._jid = jid;
    this.mode = subscriptionMode;
}

org.jive.spank.presence.Manager.prototype = {
/**
 * Sends a presence packet to the server
 *
 * @param {XMPP.Presence} presence
 */
    sendPresence: function(presence) {
        if (!presence) {
            presence = new XMPP.Presence();
        }
        if (!presence.getTo() && this._jid) {
            presence.setTo(this._jid.toString());
        }
        this.getCurrentPresence = function() {
            return presence;
        };
        this.getConnection().sendPacket(presence);
    },
/**
 * The subscription mode will allow for the default handling of subscription packets, either
 * accepting all, rejecting all, or manual. The default mode is manual.
 * @param {String} mode can be either accept, reject, or manual.
 */
    setSubscriptionMode: function(mode) {
        this.mode = mode;
    },
    addPresenceListener: function(presenceListener) {
        if (!presenceListener || !(presenceListener instanceof Function)) {
            throw Error("Presence listener must be function");
        }
        this._presenceListeners.push(presenceListener);
    },
    getHighestResource: function(jid) {
        var bareJID = jid.toBareJID();
        if (!this._presence[bareJID]) {
            return null;
        }

        var highest;
        for (var resource in this._presence[bareJID].resources) {
            var presence = this._presence[bareJID].resources[resource];
            if (!highest || presence.getPriority() >= highest.getPriority) {
                highest = presence;
            }
        }
        return highest;
    },
    getPresence: function(jid) {
        if (!jid.getResource()) {
            return this.getHighestResource(jid);
        }
        var bareJID = jid.toBareJID();
        if (!this._presence[bareJID]) {
            return null;
        }
        else {
            return this._presence[bareJID].resources[jid.getResource()];
        }
    },
    _createPresencePacketHandler: function() {
        var manager = this;
        return function(presencePacket) {
            manager._handlePresencePacket(presencePacket);
        }
    },
    _handlePresencePacket: function(presencePacket) {
        var type = presencePacket.getType();
        if (type == "available" || type == "unavailable") {
            var jid = presencePacket.getFrom();
            var bareJID = jid.toBareJID();
            if (!this._presence[bareJID] && type == "available") {
                this._presence[bareJID] = {};
                this._presence[bareJID].resources = {};
            }
            else if (!this._presence[bareJID]) {
                return;
            }
            var resource = jid.getResource();
            if (type == "available") {
                this._presence[jid.toBareJID()].resources[resource] = presencePacket;
            }
            else {
                delete this._presence[jid.toBareJID()].resources[resource];
            }
        }
        else if ((presencePacket.getType() == "subscribe"
                || presencePacket.getType() == "unsubscribe")
                && (this.mode == "accept" || this.mode == "reject")) {
            var response = new XMPP.Presence(presencePacket.getFrom());
            response.setType((this.mode == "accept" && presencePacket.getType() != "unsubscribe"
                    ? "subscribed" : "unsubscribed"));
            this.getConnection().sendPacket(response);
        }
        if (!this._presenceListeners) {
            return;
        }
        this._presenceListeners.each(function(presenceListener) {
            presenceListener(presencePacket);
        });
    },
    setJID: function(jid) {
        this._jid = jid;
    },
    destroy: function() {
        delete this._presence;
        if (this.getConnection()) {
            this.getConnection().removePacketFilter(this._presencePacketFilter);
        }
        this.getConnection = Prototype.emptyFunction;
        delete this._presenceListeners;
    }
}

org.jive.spank.roster = {};

/**
 * Creates a roster, the appropriate listeners will then be registered with the XMPP Connection.
 * After the listeners are established, the user roster is requested and the users intial presence
 * is sent.
 *
 * @param {XMPPConnection} connection the XMPP connection which this roster will use.
 * @param {Function} onLoadCallback an optional callback which will be called when the roster is
 * loaded.
 * @param {org.jive.spank.presence.Manager} Specify a custom presence manager for the roster, if one
 * is not provided it will be created.
 */
org.jive.spank.roster.Manager = function(connection, onLoadCallback, presenceManager) {
    if (!connection || !(connection instanceof XMPPConnection)) {
        throw Error("Connection required for the roster manager.");
    }

    var self = this;
    connection.addConnectionListener({
        connectionClosed: function() {
            self.destroy();
        }
    });
    this.getConnection = function() {
        return connection;
    }

    this.rosterPacketFilter = new org.jive.spank.PacketFilter(this._rosterPacketHandler(),
            this._createRosterPacketFilter);

    connection.addPacketFilter(this.rosterPacketFilter);

    if (!presenceManager) {
        presenceManager = new org.jive.spank.presence.Manager(connection);
    }

    this.onLoadCallback = onLoadCallback;
    var rosterPacket = new org.jive.spank.roster.Packet();
    this._initialRequestID = rosterPacket.getID();
    connection.sendPacket(rosterPacket);

    this.rosterListeners = new Array();
}

org.jive.spank.roster.Manager.prototype = {
    getRoster: function() {
        return this._roster;
    },
    _rosterPacketHandler: function() {
        var manager = this;
        return function(rosterPacket) {
            manager._handleRosterPacket(
                    new org.jive.spank.roster.Packet(null, null, null, rosterPacket.rootNode.cloneNode(true)));
        }
    },
    _createRosterPacketFilter: function(packet) {
        var query = packet.getExtension("query");
        return query != null && query.namespaceURI == "jabber:iq:roster";
    },
    _handleRosterPacket: function(rosterPacket) {
        console.debug("Roster packet recieved %s", rosterPacket.getID());

        if (rosterPacket.getID() == this._initialRequestID) {
            this._handleInitialResponse(rosterPacket);
        }
        else if (rosterPacket.getType() == "set") {
            this._handleRosterAdd(rosterPacket, true);
        }
    },
    _handleInitialResponse: function(rosterPacket) {
        this._roster = {};
        this._users = {};
        this._handleRosterAdd(rosterPacket, false);
        if (this.onLoadCallback && this.onLoadCallback instanceof Function) {
            this.onLoadCallback(this);
            this.onLoadCallback = Prototype.emptyFunction;
        }

        presenceManager.sendPresence();
    },
    _handleRosterAdd: function(rosterPacket, shouldFireListeners) {
        var items = rosterPacket.getItems();
        var roster = this._roster;
        var users = this._users;
        var added = new Array();
        var removed = new Array();
        var updated = new Array();
        // TODO refactor this to make it a bit nicer
        items.each(function(item) {
            var jid = item.getJID().toBareJID();
            if (item.getSubscription() == "remove") {
                item = users[jid];
                if (!item) {
                    return;
                }
                delete users[jid];
                if (roster["unfiled"] && roster["unfiled"][item.getName()]) {
                    delete roster["unfiled"][item.getJID().toString()];
                }
                var groups = item.getGroups();
                for (var i = 0; i < groups.length; i++) {
                    var group = groups[i];
                    if (!roster[group]) {
                        continue;
                    }
                    delete roster[group][item.getJID().toString()];
                }
                removed.push(item);
                return;
            }
            var isUpdated = false;
            var isAdded = false;
            // Delete any of the users old groups...
            var oldItem;
            if (users[jid]) {
                oldItem = users[jid];
                var oldGroups = oldItem.getGroups();
                var groups = item.getGroups();
                for (var i = 0; i < oldGroups.length; i++) {
                    var group = groups[i];
                    if (groups.indexOf(oldGroups[i]) < 0 && roster[group]) {
                        if (!isUpdated) {
                            isUpdated = true;
                            updated.push(item);
                        }
                        delete roster[group][oldItem.getJID().toString()];
                    }
                }
            }
            else {
                isAdded = true;
                added.push(item);
            }

            if (!isUpdated && !isAdded
                    && (oldItem.getName() != item.getName()
                    || oldItem.getSubscription() != item.getSubscription())) {
                isUpdated = true;
                updated.push(item);
            }
            users[jid] = item;

            var groups = item.getGroups();
            for (var i = 0; i < groups.length; i++) {
                var group = groups[i];
                if (!roster[group]) {
                    roster[group] = {};
                }
                if (!roster[group][item.getJID().toString()] && !isUpdated && !isAdded) {
                    isUpdated = true;
                    updated.push(item);
                }
                roster[group][item.getJID().toString()] = item;
            }

            // No groups, add to unfiled.
            if (groups.length == 0) {
                if (!roster["unfiled"]) {
                    roster["unfiled"] = {};
                }
                if (!roster["unfiled"][item.getJID().toString()] && !isUpdated && !isAdded) {
                    isUpdated = true;
                    updated.push(item);
                }
                roster["unfiled"][item.getJID().toString()] = item;
            }
        });
        if (shouldFireListeners) {
            this._fireRosterUpdates(added, updated, removed);
        }
    },
    _fireRosterUpdates: function(added, updated, removed) {
        this.rosterListeners.each(function(listener) {
            if (added.length > 0 && listener.onAdded) {
                listener.onAdded(added);
            }
            if (updated.length > 0 && listener.onUpdated) {
                listener.onUpdated(updated);
            }
            if (removed.length > 0 && listener.onRemoved) {
                listener.onRemoved(removed);
            }
        });
    },
    addEntry: function(jid, name, groups) {
        var packet = new org.jive.spank.roster.Packet("set");
        var item = packet.addItem(jid, name);
        if (groups) {
            item.addGroups(groups);
        }

        console.debug("adding contact: %x", packet.doc.documentElement);
        this.getConnection().sendPacket(packet);

        var presence = new XMPP.Presence(jid);
        presence.setType("subscribe");
        this.getConnection().sendPacket(presence);
    },
    removeEntry: function(jid) {
        var packet = new org.jive.spank.roster.Packet("set");
        var item = packet.addItem(jid);
        item.setSubscription("remove");

        console.debug("removing roster entry: %x", packet.doc.documentElement);
        this.getConnection().sendPacket(packet);
    },
/**
 * Adds a roster listener.
 *
 * @param {Object} rosterListener contains onAdded, onUpdated, and onRemoved
 */
    addRosterListener: function(rosterListener) {
        this.rosterListeners.push(rosterListener);
    },
/**
 * Removes a roster listener.
 *
 * @param {Object} rosterListener the listener to remove.
 */
    removeRosterListener: function(rosterListener) {
        if (!rosterListener) {
            return;
        }

        var index = this.rosterListeners.indexOf(rosterListener);
        if (index >= 0) {
            this.rosterListeners.splice(index, 1);
        }
    },
    destroy: function() {
        this.rosterListeners.clear();
        this.getConnection = Prototype.emptyFunction;
        delete this._roster;
        delete this._users;
        delete this._handleRosterAdd;
        this.onLoadCallback = Prototype.emptyFunction;
        delete this._initialRequestID;
    }
}

org.jive.spank.disco = {
    _connections: [],
/**
 * Retrieves a singleton for the connection which is the service discovery manager.
 *
 * @param {XMPP.Connection} connection the connection to retrieve the singleton for.
 */
    getManager: function(connection) {
        var discoManager = org.jive.spank.disco._connections.detect(
                function(connection, discoManager) {
            return discoManager._connection == connection;
        }.bind(null, connection));

        if (discoManager == null) {
            discoManager
                    = new org.jive.spank.disco.Manager(connection);
            org.jive.spank.disco._connections.push(discoManager);
            connection.addConnectionListener({
                connectionClosed: function() {
                    var index = org.jive.spank.disco._connections.indexOf(this);

                    if (index >= 0) {
                        org.jive.spank.disco._connections.splice(index, 1);
                    }
                }.bind(discoManager)
            });
        }
        return discoManager;
    }
}

/**
 * The disco manager manages service discovery on an XMPP Connection.
 *
 * @param {XMPP.Connection} connection the connection which this service discovery manager will
 * handle disco for.
 */
org.jive.spank.disco.Manager = function(connection) {
    this._connection = connection;
    var self = this;
    this.features = new Array();
    this.infoCache = {};
    var discoFilter = new org.jive.spank.PacketFilter(function(request) {
        self._handleDiscoResquest(request);
    }, function(packet) {
        return packet.getPacketType() == "iq" && packet.getType() == "get" && packet.getQuery()
                && packet.getQuery().getAttribute("xmlns") ==
                   "http://jabber.org/protocol/disco#info";
    });
    connection.addPacketFilter(discoFilter);
    connection.addConnectionListener({
        connectionClosed: function() {
            self.destroy();
        }
    });
}

org.jive.spank.disco.Manager.prototype = {
    getCategory: function(jid, shouldClearCache) {
        var discoverPacket = this.infoCache[jid.toString()];
        if (!discoverPacket || shouldClearCache) {
            this.discoverInfo(null, jid);
            return null;
        }

        if (discoverPacket.getType() != "result") {
            return null;
        }

        var query = discoverPacket.getExtension("query");
        var info = query.childNodes;
        for (var i = 0; i < info.length; i++) {
            if (info[i].tagName == "identity") {
                return info[i].getAttribute("category");
            }
        }
        return null;
    },
    hasFeature: function(jid, feature, callback, shouldClearCache) {
        var discoverPacket = this.infoCache[jid.toString()];
        if (!discoverPacket || shouldClearCache) {
            var infoCallback = callback;
            if(callback) {
                infoCallback = function(jid, feature, callback, discoverPacket) {
                    callback(this._hasFeature(discoverPacket, feature), jid, feature);
                }.bind(this, jid, feature, callback);
            }
            this.discoverInfo(infoCallback, jid);
            return false;
        }

        if (discoverPacket.getType() != "result") {
            return false;
        }

        var hasFeature = this._hasFeature(discoverPacket, feature);
        if(callback) {
            callback(hasFeature, jid, feature)
        }

        return hasFeature
    },
    _hasFeature: function(discoverPacket, feature) {
        var query = discoverPacket.getExtension("query");
        var info = query.childNodes;
        for (var i = 0; i < info.length; i++) {
            if (info[i].tagName == "feature") {
                if (info[i].getAttribute("var") == feature) {
                    return true;
                }
            }
        }
        return false;
    },
    discoverInfo: function(infoCallback, jid, node) {
        var getInfo = new XMPP.IQ("get", this._connection._jid, jid.toString());
        var id = getInfo.getID();

        var query = getInfo.setQuery("http://jabber.org/protocol/disco#info");
        if (node) {
            query.setAttribute("node", node);
        }

        this._connection.sendPacket(getInfo, new org.jive.spank.PacketFilter(
                function(packet) {
                    this.infoCache[jid.toString()] = packet;
                    if (infoCallback) {
                        infoCallback(packet);
                    }
                }.bind(this), function(packet) {
            return packet.getID() == id;
        }));
    },
    discoverItems: function(itemsCallback, jid, node) {
        if (!itemsCallback) {
            return;
        }
        var getInfo = new XMPP.IQ("get", this._connection._jid, jid.toString());
        var id = getInfo.getID();

        var query = getInfo.setQuery("http://jabber.org/protocol/disco#items");
        if (node) {
            query.setAttribute("node", node);
        }

        var callback = function(callback, itemsResponse) {
            callback(this._processItemsResponse(itemsResponse));
        }.bind(this, itemsCallback)

        this._connection.sendPacket(getInfo, new org.jive.spank.PacketFilter(callback,
                function(packet) {
                    return packet.getID() == id;
                }));
    },
    _processItemsResponse: function(itemsResponse) {
        var query = itemsResponse.getExtension("query");
        var items = query.childNodes;
        var itemList = [];
        for (var i = 0; i < items.length; i++) {
            var jid = items[i].getAttribute("jid");
            var name = items[i].getAttribute("name");
            if (!jid || !name) {
                continue;
            }

            itemList.push({jid: new XMPP.JID(jid), name: name});
        }
        return itemList;
    },
    addFeature: function(feature) {
        this.features.push(feature);
    },
    removeFeature: function(feature) {
        var index = this.features.indexOf(feature);
        if (index >= 0) {
            this.features.splice(index, 1);
        }
    },
    _handleDiscoResquest: function(get) {
        var result = new XMPP.IQ("result", this._connection._jid, get.getFrom());
        result.setID(get.getID());
        var query = result.setQuery("http://jabber.org/protocol/disco#info");
        var identity = query.appendChild(result.doc.createElement("identity"));
        identity.setAttribute("category", "client");
        identity.setAttribute("name", "spank");
        identity.setAttribute("type", "web");

        for (var i = 0; i < this.features.length; i++) {
            var feature = this.features[i];
            var featureNode = query.appendChild(result.doc.createElement("feature"));
            featureNode.setAttribute("var", feature);
        }
        this._connection.sendPacket(result);
    },
    destroy: function() {
        this.infoCache = {};
        var index = org.jive.spank.disco._connections.indexOf(this);
        if (index >= 0) {
            org.jive.spank.disco._connections.splice(index, 1);
        }
    }
}

org.jive.spank.muc = {};

/**
 * The multi-user chat manager has functions for room creation, adding and removing invitation
 * listeners, and retrieving multi-user chat conference servers and rooms from the XMPP server.
 *
 * @param {XMPPConnection} connection the XMPPConnection which this manager utilizes for its
 * communications.
 * @param {org.jive.spank.chat.Manager} chatManager the chat manager is used for private chats
 * originating inside of MUC rooms.
 */
org.jive.spank.muc.Manager = function(connection, chatManager) {
    this._connection = connection;
    var self = this;
    connection.addConnectionListener({
        connectionClosed: function() {
            self.destroy();
        }
    });
    this.invitationListeners = new Array();
    this.rooms = new Array();
    this.chatManager = chatManager;
    org.jive.spank.disco.getManager(connection).addFeature("http://jabber.org/protocol/muc");
}

org.jive.spank.muc.Manager.prototype = {
/**
 * Returns a list of conference servers operating on the server. If the server argument is
 * not specifed the currently connected server is used.
 *
 * @param {Function} serversCallback the function that is called with the server list when
 * the response is recieved.
 * @param {XMPP.JID} server (optional) the server to retrieve the list of conference servers
 * from.
 */
    getConferenceServers: function(serversCallback, server) {
        if (!server) {
            server = new XMPP.JID(this._connection.domain);
        }

        var infoCallback = function(infoResponse) {
            var query = infoResponse.getExtension("query");
            var infoNodes = query.childNodes;
            for (var i = 0; i < infoNodes.length; i++) {
                var info = infoNodes[i];
                if (info.tagName == "feature") {
                    if (info.getAttribute("var") == "http://jabber.org/protocol/muc") {
                        serversCallback(infoResponse.getFrom());
                        return;
                    }
                }
            }
        };

        var discoManager = org.jive.spank.disco.getManager(this._connection);

        var callback = function(infoCallback, discoManager, items) {
            var itemJids = items.pluck("jid");
            var discoverInfo = discoManager.discoverInfo.bind(discoManager, infoCallback);
            itemJids.each(discoverInfo)
        }.bind(this, infoCallback, discoManager);

        discoManager.discoverItems(callback, server);
    },
/**
 * Retrieves a list of rooms from a MUC service. To receive the info on the rooms pass
 * the returned structure to #retrieveRoomsInfo.
 *
 * @param {XMPP.JID} serviceJID the jid of the service for which to retrieve rooms.
 * @param {Function} roomsCallback the callback called with the rooms as its argument when the
 * server returns the rooms response.
 */
    retrieveRooms: function(serviceJID, roomsCallback) {
        if (!serviceJID || !roomsCallback) {
            return;
        }

        var callback = function(items) {
            var itemList = {};
            for (var i = 0; i < items.length; i++) {
                var jid = items[i].jid.toString();
                var name = items[i].name;

                itemList[jid] = {
                    name: name
                };
            }
            roomsCallback(itemList);
        }

        org.jive.spank.disco.getManager(this._connection).discoverItems(callback, serviceJID);
    },
    retrieveRoomsInfo: function(rooms, roomsCallback) {
        if (!rooms || !roomsCallback) {
            return;
        }

        var count = 0;

        var callback = function(callback, infoResponse) {
            var jid = infoResponse.getFrom().toString();
            var query = infoResponse.getExtension("query");
            var info = query.childNodes;
            var room = rooms[jid];
            if (room) {
                for (var i = 0; i < info.length; i++) {
                    if (info[i].tagName == "feature") {

                    }
                    else if (info[i].tagName == "x") {
                        var xdata = new XMPP.XData(null, info[i]);
                        var fields = xdata.getFields();
                        for (var j = 0; j < fields.length; j++) {
                            var field = fields[j].variable;
                            rooms[jid][field] = {};
                            for (var value in fields[j]) {
                                rooms[jid][field][value] = fields[j][value];
                            }
                        }
                    }
                }
            }
            if (--count <= 0) {
                callback(rooms);
            }
        }.bind(null, roomsCallback);

        var hasRooms = false;
        for (var room in rooms) {
            count++;
            hasRooms = true;
            org.jive.spank.disco.getManager(this._connection).discoverInfo(callback, room);
        }

        if(!hasRooms) {
            roomsCallback({});
        }
    },
/**
 * Retrieves a conference room to be joined.
 *
 * @param {XMPP.JID} roomJID the jid of the room to be created.
 */
    createRoom: function(roomJID) {
        this.chatManager.registerDomain(roomJID.getDomain(), true);
        return new org.jive.spank.muc.Room(this, roomJID);
    },
    getRoom: function(roomJID) {
        return this.rooms.detect(function(value, index) {
            return value.jid.toString() == roomJID.toString();
        });
    },
    _addRoom: function(room) {
        this.rooms.push(room);
    },
    _removeRoom: function(room) {
        if (!room) {
            return;
        }
        var index = this.rooms.indexOf(room);
        if (index >= 0) {
            this.rooms.splice(index, 1);
        }
    },
    addInvitationsListener: function(invitationListener) {
        if (!(invitationListener instanceof Function)) {
            throw Error("invitation listener must be a function.");
        }
        var invitationListeners = this.invitationListeners;
        if (this.invitationListeners.length <= 0) {
            this.invitationFilter = new org.jive.spank.PacketFilter(function(packet) {
                var userPacket = new org.jive.spank.muc.User(null, null, packet.rootNode.cloneNode(true));
                var invitation = userPacket.getInvite();

                if (invitation) {
                    invitationListeners.each(function(listener) {
                        listener(invitation);
                    });
                }
            },
                    function(packet) {
                        if (packet.getPacketType() != "message") {
                            return false;
                        }
                        var ex = packet.getExtension("x");
                        if (!ex) {
                            return false;
                        }

                        return ex.getAttribute("xmlns") == "http://jabber.org/protocol/muc#user";
                    });
            this._connection.addPacketFilter(this.invitationFilter);
        }
        this.invitationListeners.push(invitationListener);
    },
    removeInvitationsListener: function(invitationListener) {
        if (!invitationListener || !(invitationListener instanceof Function)) {
            throw Error("listeners must be a function");
        }

        var index = this.invitationListeners.indexOf(invitationListener);
        if (index >= 0) {
            this.invitationListeners.splice(index, 1);
        }
        if (this.invitationListeners.size() <= 0 && this.invitationFilter) {
            this._connection.removePacketFilter(this.invitationFilter);
            delete this.invitationFilter;
        }
    },
    declineInvitation: function(from, room, reason) {
        if (!room || !from) {
            throw Error("Cannot decline invitation, invitiation missing information");
        }
        var packet = new org.jive.spank.muc.User(room);
        packet.setDecline(from, reason);
        this._connection.sendPacket(packet);
    },
    destroy: function() {
    
    	if (this.rooms) 
    	{
		for (var i = 0; i < this.rooms.length; i++) {
		    this.rooms[i].leave(true);
		}
		this.rooms.clear();
		this.invitationListeners.clear();
	}
    }
}

org.jive.spank.muc.Room = function(manager, roomJID) {
    this.manager = manager;
    this.connection = manager._connection;
    this.jid = roomJID;
    this.listeners = {};
    this.presenceListeners = new Array();
    this.messageListeners = new Array();
    this.isJoined = false;
}

org.jive.spank.muc.Room.prototype = {
/**
 * Joins a MultiUserChat room by sending an available presence.
 *
 * @param {String} nickname
 * @param {String} password
 * @param {Function} joinCallback onSuccess is called if the room is joined successfully
 * and onError is called if it is not.
 * @param {Function} occupantListener
 */
    join: function(nickname, password, joinCallback, messageListener, occupantListener) {
        var roomJID = this.jid;
        var presence = new XMPP.Presence(roomJID.toString() + "/" + nickname);
        var mucExtension = presence.addExtension("x", "http://jabber.org/protocol/muc");
        if (password) {
            var passwordElement = mucExtension.appendChild(
                    presence.doc.createElement("password"));
            passwordElement.appendChild(presence.doc.createTextNode(password));
        }
        this._initPresenceManager(nickname, occupantListener);
        if (messageListener) {
            this._initMessageListener(messageListener);
        }
        var packetFilter;
        if (joinCallback && (joinCallback.onSuccess || joinCallback.onError)) {
            var room = this;
            packetFilter = new org.jive.spank.PacketFilter(function(packet) {
                if (packet.getError() && joinCallback.onError) {
                    this.presenceManager.destroy();
                    this.presenceManager = undefined;
                    this.connection.removePacketFilter(this.messageFilter);
                    joinCallback.onError(packet);
                }
                else if (!packet.getError() && joinCallback.onSuccess) {
                    this.manager._addRoom(this);
                    this.nickname = nickname;
                    room.occupantJid = new XMPP.JID(roomJID.toString() + "/" + nickname);
                    room.isJoined = true;
                    this.presenceManager._handlePresencePacket(packet);
                    joinCallback.onSuccess(new org.jive.spank.muc.Occupant(packet));
                }
                joinCallback = Prototype.emptyFunction;
            }.bind(this),
                    function(packet) {
                        return packet.getFrom().toString() == presence.getTo().toString();
                    });
        }
        this.connection.sendPacket(presence, packetFilter);
    },
    create: function(nickname, configuration, createCallback, messageListener, occupantListener) {
        var callback = {};
        if (createCallback.onSuccess) {
            callback.onSuccess = this._createSuccess.bind(this, createCallback.onSuccess,
                    configuration, messageListener, occupantListener);
        }
        this.join(nickname, null, callback);
    },
    _createSuccess: function(callback, configuration, messageListener, occupantListener, occupant) {
        var _handleConfigurationForm = function(occupant, configuration, callback, messageListener,
                                                occupantListener, room, configurationForm) {
            var answerForm = configurationForm.getAnswerForm();
            for (var answer in configuration) {
                answerForm.setAnswer(answer, [configuration[answer]]);
            }
            this.sendConfigurationForm(answerForm);
            this.addOccupantListener(occupantListener);
            this._initMessageListener(messageListener);
            callback(occupant);
            callback = Prototype.emptyFunction;
        };
        this.getConfigurationForm(_handleConfigurationForm.bind(this, occupant, configuration,
                callback, messageListener, occupantListener));
    },
    leave: function(shouldNotRemove) {
        this.isJoined = false;

        this.connection.removePacketFilter(this.messageFilter);
        delete this.connection;

        try {
            var presence = new XMPP.Presence();
            presence.setType("unavailable");
            this.presenceManager.sendPresence(presence);
        }
        catch(error) {
            // ohh well
        }

        this.presenceManager.destroy();
        this.presenceManager = undefined;
        if (!shouldNotRemove) {
            this.manager._removeRoom(this);
        }
    },
    _initPresenceManager: function(nickname, occupantListener) {
        this.presenceManager = new org.jive.spank.presence.Manager(this.connection,
                new XMPP.JID(this.jid.toString() + "/" + nickname));
        if (occupantListener) {
            this.addOccupantListener(occupantListener);
        }
    },
    addOccupantListener: function(occupantListener) {
        var presenceListener = this._handlePresence.bind(this, occupantListener);
        this.presenceManager.addPresenceListener(presenceListener);
    },
    _handlePresence: function(occupantListener, presence) {
        if (presence.getError()) {
            return;
        }

        var user = new org.jive.spank.muc.User(null, null, presence.rootNode.cloneNode(true));
        var isLocalUser = user.getStatusCodes().indexOf('110');
        var isNickChange = user.getStatusCodes().indexOf('303');
//        if(isLocalUser && isNickChange) {
//            this.presenceManager.setJID()
//        }
        occupantListener(new org.jive.spank.muc.Occupant(presence));
    },
/**
 * Returns an array of all current occupants of the room.
 */
    getOccupants: function() {
        var occupants = new Array();
        var roomPresences = this.presenceManager._presence[this.jid];
        if (!roomPresences) {
            return occupants;
        }
        var resources = roomPresences.resources;
        for (var resource in resources) {
            var presence = resources[resource];
            if (presence.getType != "unavailable") {
                occupants.push(new org.jive.spank.muc.Occupant(presence));
            }
        }
        return occupants;
    },
    getOccupant: function(nick) {
        var userJID = this.jid + "/" + nick;

        var presence = this.presenceManager._presence[this.jid].resources[nick];
        if (presence == null || presence.getType() == "unavailable") {
            return null;
        }
        else {
            return new org.jive.spank.muc.Occupant(presence);
        }
    },
    _initMessageListener: function(messageListener) {
        var room = this;
        this.messageFilter = new org.jive.spank.PacketFilter(function(message) {
            room.messageListeners.each(function(listener) {
                var handled = false;
                if (message.getSubject() && listener.subjectUpdated) {
                    listener.subjectUpdated(room, message.getFrom(), message.getSubject());
                    handled = true;
                }
                var ex = message.getExtension("x");
                if (ex) {
                    var isUser = ex.getAttribute("xmlns") == "http://jabber.org/protocol/muc#user";
                    if (isUser && listener.invitationDeclined) {
                        var user = new org.jive.spank.muc.User(null, null, message.rootNode);
                        var decline = user.getDecline();
                        if (decline) {
                            listener.invitationDeclined(decline);
                            handled = true;
                        }
                    }
                }
                if (listener.messageReceived && !handled) {
                    listener.messageReceived(message);
                }
            });
        }, function(packet) {
            return packet.getFrom().toBareJID() == room.jid.toBareJID()
                    && packet.getPacketType() == "message" && (packet.getType()
                    == "groupchat" || packet.getType() == "normal");
        });

        this.connection.addPacketFilter(this.messageFilter);
        if (messageListener) {
            this.messageListeners.push(messageListener);
        }
    },
    sendMessage: function(messageBody, message) {
        if (!message) {
            message = new XMPP.Message("groupchat", this.connection, this.jid);
        }
        else {
            message.setType("groupchat");
            message.setFrom(this.jid);
        }
        message.setBody(messageBody);

        this.connection.sendPacket(message);
    },
    addMessageListener: function(messageListener) {
        if (!messageListener) {
            throw Error("listeners cannot be null");
        }
        this.messageListeners.push(messageListener);
    },
    removeMessageListener: function(messageListener) {
        if (!messageListener) {
            throw Error("listeners must be a function");
        }

        var index = this.messageListeners.indexOf(messageListener);
        if (index >= 0) {
            this.messageListeners.splice(index, 1);
        }
    },
    setSubject: function(subject) {
        var message = new XMPP.Message(this.jid);
        var ex = message.addExtension("subject");
        ex.appendChild(message.doc.createTextNode(subject));

        this.connection.sendPacket(message);
    },
    invite: function(jid, reason) {
        var invite = new org.jive.spank.muc.User(this.jid);
        invite.setInvite(jid, reason);
        this.connection.sendPacket(invite);
    },
    changeNickname: function(nickname) {
        if (!this.isJoined) {
            throw Error("Cannot change nickname if not in room.");
        }

        var presence = new XMPP.Presence();
        presence.setTo(new XMPP.JID(this.jid.toBareJID() + "/" + nickname));
        this.connection.sendPacket(presence);
        this.nickname = nickname;
    },
    getConfigurationForm: function(callback) {
        var iq = new XMPP.IQ("get", this.jid, this.jid.getBareJID());
        iq.setQuery("http://jabber.org/protocol/muc#owner");
        var packetFilter = org.jive.spank.PacketFilter.filter.IDFilter(function(response) {
            if (response.getExtension("x", "jabber:x:data")) {
                callback(this.jid.getBareJID(), new XMPP.XData(null,
                        response.getExtension("x", "jabber:x:data")));
            }
        }.bind(this), iq);
        this.connection.sendPacket(iq, packetFilter);
    },
    sendConfigurationForm: function(form, callback) {
        var iq = new XMPP.IQ("set", this.jid, this.jid.getBareJID());
        var query = iq.setQuery("http://jabber.org/protocol/muc#owner");

        var formNode = form.rootNode.cloneNode(true);
        if (iq.doc.importNode) {
            iq.doc.importNode(formNode, true);
        }
        query.appendChild(formNode);

        // trim the form
        var nodes = formNode.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (!nodes[i].hasChildNodes()) {
                formNode.removeChild(nodes[i]);
            }
        }

        var packetFilter;
        if (callback) {
            packetFilter = org.jive.spank.PacketFilter.filter.IDFilter(function(response, jid) {
                callback(jid.getBareJID());
            }.bind(this), iq);
        }
        this.connection.sendPacket(iq, packetFilter);
    }
}

org.jive.spank.muc.Occupant = function(presence) {
    this.presence = presence;
}

org.jive.spank.muc.Occupant.prototype = {
    getAffiliation: function() {
        var user = this.presence.getExtension("x");
        if (user == null) {
            return null;
        }
        return user.firstChild.getAttribute("affiliation");
    },
    getRole: function() {
        var user = this.presence.getExtension("x");
        if (user == null) {
            return null;
        }
        return user.firstChild.getAttribute("role");
    },
    getNick: function() {
        return this.presence.getFrom().getResource();
    },
    getRoom: function() {
        return this.presence.getFrom().toBareJID();
    }
}

/**
 * When packets are recieved by spank they go through a packet filter in order for interested parties
 * to be able to recieve them.
 *
 * @param {Function} callback the callback to execute after the filter test is passed.
 * @param {Function} filterTest the test to see if the callback should be executed, if this parameter
 * is undefined then all packets will be accepted.
 */
org.jive.spank.PacketFilter = function(callback, filterTest) {
    if (!callback) {
        throw Error("Callback must be specified");
    }

    this.getFilterTest = function() {
        return filterTest
    };
    this.getCallback = function() {
        return callback
    };
}

org.jive.spank.PacketFilter.prototype = {
/**
 * Tests the packet using the filter test and passes it to the callback if it passes the
 * test.
 *
 * @param {Object} packet the packet to test and pass to the callback if the test passes
 * @return {Boolean} true if the callback was executed and false if it was not.
 */
    accept: function(packet) {
        if (!packet || !(packet instanceof XMPP.Packet)) {
            return;
        }
        var filterTest = this.getFilterTest();
        var executeCallback = true;
        if (filterTest) {
            executeCallback = filterTest(packet);
        }
        if (executeCallback) {
            var callback = this.getCallback();
            callback(packet);
        }
        return executeCallback;
    }
}

org.jive.spank.PacketFilter.filter = {
    IDFilter: function(callback, packet) {
        return new org.jive.spank.PacketFilter(callback, function(packet, testPacket) {
            return testPacket.getID() == packet.getID();
        }.bind(null, packet));
    }
}

org.jive.spank.x = {}

org.jive.spank.x.chatstate = {
    _connections: [],
/**
 * Retrieves a singleton for the connection which is the chat state manager.
 *
 * @param {org.jive.spank.chat.Manager} manager the chat manager to retrieve the singleton for.
 */
    getManager: function(manager) {
        var connection = manager.getConnection();
        var chatStateManager = org.jive.spank.x.chatstate._connections.detect(
                function(connection, chatStateManager) {
            return chatStateManager._connection == connection;
        }.bind(null, connection));

        if (chatStateManager == null) {
            chatStateManager
                    = new org.jive.spank.x.chatstate.Manager(manager);
            org.jive.spank.x.chatstate._connections.push(chatStateManager);
            connection.addConnectionListener({
                connectionClosed: function() {
                    var index = org.jive.spank.x.chatstate._connections.indexOf(this);

                    if (index >= 0) {
                        org.jive.spank.x.chatstate._connections.splice(index, 1);
                    }
                }.bind(chatStateManager)
            });
        }
        return chatStateManager;
    }
}

org.jive.spank.x.chatstate.Manager = function(manager) {
    this._manager = manager;
    this._connection = manager.getConnection();
    this._lastState = {};
    this._lastStateSent = {};
    this._stateListeners = new Array();
    var self = this;
    this._connection.addPacketFilter(new org.jive.spank.PacketFilter(this._handleIncomingState.bind(this),
            function(packet) {
                return packet.getPacketType() == "message"
                        && (packet.getType() == "chat" || packet.getType() == "groupchat")
                        && packet.getExtension(null, "http://jabber.org/protocol/chatstates")
                        && !packet.getExtension("x", "jabber:x:delay");
            }));
    manager.getConnection().addConnectionListener({
        connectionClosed: function() {
            self.destroy();
        }
    });
    org.jive.spank.disco.getManager(manager.getConnection()).addFeature("http://jabber.org/protocol/chatstates");
}

org.jive.spank.x.chatstate.Manager.prototype = {
    setCurrentState: function(chatState, jid, message, isMultiUserChat) {
        var created = false;
        if (!message) {
            message = new XMPP.Message((isMultiUserChat ? "groupchat" : "chat"), null, jid);
            created = true;
        }
        if (!isMultiUserChat && !this.shouldSendState(jid)) {
            if (created) {
                return null;
            }
            else {
                return message;
            }
        }
        chatState = (chatState ? chatState : "active");
        message.addExtension(chatState, "http://jabber.org/protocol/chatstates");
        this._lastStateSent[jid.toString()] = chatState;
        return message;
    },
    shouldSendState: function(jid) {
        if (this._lastState[jid.toString()]) {
            return this._lastState[jid.toString()];
        }
        // if there is no resource attached we cannot send an iq request so we have to operate
        // purely on whether or not we have already sent them a state at this point, if we have
        // then don't send them anything.
        if (!jid.getResource()) {
            return !this._lastStateSent[jid.toString()];
        }
        var disco = org.jive.spank.disco.getManager(this._connection);
        var category = disco.getCategory(jid);
        if (!category) {
            return false;
        }
        // This is a MUC we can send state
        else if (category == "conference") {
            return true;
        }

        return disco.hasFeature(jid, "http://jabber.org/protocol/chatstates");
    },
    addStateListener: function(stateListener) {
        if (stateListener && stateListener instanceof Function) {
            this._stateListeners.push(stateListener);
        }
    },
    removeStateListener: function(stateListener) {
        if (stateListener) {
            var i = this._stateListeners.indexOf(stateListener);
            if (i >= 0) {
                this._stateListeners.splice(i, 1);
            }
        }
    },
    _handleIncomingState: function(message) {
        var from = message.getFrom().toString();
        var extension = message.getExtension(null, "http://jabber.org/protocol/chatstates");
        this._lastState[from] = extension.tagName;
        for (var i = 0; i < this._stateListeners.length; i++) {
            this._stateListeners[i](message.getFrom(), extension.tagName, message.getType() == "groupchat");
        }
    },
    destroy: function() {

    }
}

var util = {
    Integer: {
        randomInt: function(intFrom, intTo, intSeed) {
            // Make sure that we have integers.
            intFrom = Math.floor(intFrom);
            intTo = Math.floor(intTo);

            // Return the random number.
            return(
                    Math.floor(
                            intFrom +
                            (
                                    (intTo - intFrom + 1) *

                                    // Seed the random number if a value was passed.
                                    Math.random(
                                            (intSeed != null) ? intSeed : 0
                                            )
                                    ))
                    );
        }
    },
    StringUtil: {
        randomString: function(len) {
            // Define local variables.
            var strLargeText = "";
            var intValue = 0;
            var arrCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" ;

            // Loop over number of characters in string.
            for (var intI = 0; intI < len; intI++) {

                // Get a random value between 0 and the length of the
                // character list.
                intValue = util.Integer.randomInt(0, (arrCharacters.length - 1), intI);

                // Append a character that is randomly chosen
                strLargeText += arrCharacters.charAt(intValue);

            }
            return strLargeText;
        }
    }
};

XMPP.Packet = function() {
};

XMPP.Packet.packetID = 1;

XMPP.Packet.prototype = {
    idBase: util.StringUtil.randomString(5),
    _init: function(packetType, from, to, element) {
        this.doc = Sarissa.getDomDocument();
        var created = !element;
        if (!element) {
            element = this.doc.createElement(packetType);
        }
        // Fix for safari, IE6 doesn't support importNode but works
        // fine with just appendChild
        else if (!_SARISSA_IS_IE) {
            element = this.doc.importNode(element, true);
        }
        this.doc.appendChild(element);

        this.rootNode = this.doc.firstChild;
        if (created) {
            this.addAttributes({id: this._nextPacketID()});
            this.setFrom(from);
            this.setTo(to);
        }
    },
    getPacketType: function() {
        return this.rootNode.tagName;
    },
    getID: function() {
        return this.rootNode.getAttribute("id");
    },
    setID: function(id) {
        this.rootNode.setAttribute("id", id);
    },
    _nextPacketID: function() {
        return this.idBase + "-" + XMPP.Packet.packetID++;
    },
    removeAttributes: function(attributes) {
        for (var i = 0; i < attributes.length; i++) {
            this.rootNode.removeAttribute(attributes[i]);
        }
    },
    addAttributes: function(attributes) {
        for (var attr in attributes) {
            this.rootNode.setAttribute(attr, attributes[attr]);
        }
    },
    setFrom: function(fromValue) {
        if (!fromValue || fromValue == "") {
            this.removeAttributes($A("from"));
        }
        else {
            this.addAttributes({ from: fromValue });
        }
    },
    getFrom: function() {
        if (this.from) {
            return this.from;
        }
        var from = this.rootNode.getAttribute("from");
        if (!from) {
            this.from = null;
        }
        else {
            this.from = new XMPP.JID(from);
        }
        return this.from;
    },
    setTo: function(toValue) {
        this.to = null;
        if (!toValue || toValue == "") {
            this.removeAttributes($A("to"));
        }
        else {
            this.addAttributes({ to: toValue });
        }
    },
/**
 * Returns the JID of the user to whom this packet is being directed.
 *
 * @return {XMPP.JID} the JID of the user to whom this packet is being directed.
 */
    getTo: function() {
        if (this.to) {
            return this.to;
        }
        var to = this.rootNode.getAttribute("to");
        if (!to) {
            this.to = null;
        }
        else {
            this.to = new XMPP.JID(to);
        }
        return this.to;
    },
/**
 * Sets the namespace of the packet.
 * NOTE: Opera requires that the namespace of an element be set when it is created
 * so this method will not work in opera.
 *
 * @param {String} xmlnsValue the namespace to be set on the packet.
 */
    setXMLNS: function(xmlnsValue) {
        if (!xmlnsValue || xmlnsValue == "") {
            this.removeAttributes($A("xmlns"));
        }
        else {
            this.addAttributes({ xmlns: xmlnsValue });
        }
    },
/**
 * Serializes the packet to a string.
 */
    toXML: function() {
        var xml = this.doc.xml ? this.doc.xml
                : (new XMLSerializer()).serializeToString(this.doc);
        if (xml.indexOf('<?xml version="1.0"?>') >= 0) {
            // 'fix' for opera so that it doesn't pass this along.
            xml = xml.substr('<?xml version="1.0"?>'.length);
        }
        return xml;
    },
/**
 * Creates and adds an extension to the packet, returning the created extension.
 *
 * @param {String} extensionName the name of the extension that is being created.
 * @param {String} extensionNamespace (optional) the namespace of the extension that is
 * being created
 */
    addExtension: function(extensionName, extensionNamespace) {
        if (extensionNamespace && this.doc.createElementNS) {
            this.extension = this.rootNode.appendChild(
                    this.doc.createElementNS(extensionNamespace,
                            extensionName));
        }
        else {
            this.extension = this.rootNode.appendChild(
                    this.doc.createElement(extensionName));
        }
        if (extensionNamespace) {
            this.extension.setAttribute("xmlns", extensionNamespace);
        }

        return this.extension;
    },
    addTextExtension: function(textNodeName, textNodeContent) {
        var textNode = this.addExtension(textNodeName);
        textNode.appendChild(this.doc.createTextNode(textNodeContent));
    },
/**
 * Returns the first packet extension that matches the given arguments. Note that this method returns the
 * actual element inside of the document and not a clone. Both arguments are
 * optional, and, if none match null is returned.
 *
 * @param {String} extensionName the name of the extension that is to be returned.
 * @param {String} namespace the namespace of extension that is to be returned.
 */
    getExtension: function(extensionName, namespace) {
        var nodes = this.getExtensions(extensionName, namespace);
        if (!nodes || nodes.length <= 0) {
            return null;
        }
        else {
            return nodes[0];
        }
    },
    getExtensions: function(extensionName, namespace) {
        if (!extensionName) {
            extensionName = "*";
        }
        var nodes = this.rootNode.getElementsByTagName(extensionName);
        if (nodes.length <= 0) {
            return new Array();
        }

        var collector = function(node) {
            if (!namespace || node.getAttribute("xmlns") == namespace) {
                return node;
            }
            else {
                return null;
            }
        }

        return $A(nodes).collect(collector).toArray().compact();
    },
/**
 * Removes and returns the first extension in the list of extensions with the given
 * name.
 *
 * @param {String} extensionName the name of the extension to be removed from the extensions.
 */
    removeExtension: function(extensionName) {
        var extensions = this.rootNode.childNodes;
        for (var i = 0; i < extensions.length; i++) {
            if (extensions[i].tagName == extensionName) {
                return this.rootNode.removeChild(extensions[i]);
            }
        }
    },
/**
 * If the packet contains an error returns the error code, or null if there is no error.
 */
    getError: function() {
        var error = this.getExtension("error");
        if (error == null) {
            return null;
        }
        else {
            return error.getAttribute("code");
        }
    }
};

XMPP.IQ = function(packetType, from, to, element, init) {
    if (init) {
        return;
    }
    this._init("iq", from, to, element);

    if (!element) {
        this.setType(packetType);
    }
};

XMPP.IQ.prototype = Object.extend(new XMPP.Packet(), {
    setType: function(packetType) {
        if (!packetType || packetType == "") {
            packetType = "get";
        }
        this.addAttributes({ type: packetType });
    },
    getType: function() {
        return this.rootNode.getAttribute("type");
    },
    setQuery: function(xmlns) {
        return this.addExtension("query", xmlns);
    },
    getQuery: function() {
        return this.getExtension("query");
    }
});

XMPP.Registration = function(packetType, to, element) {
    this._init("iq", null, to, element);

    if (!element) {
        this.setType(packetType);
        this.setQuery("jabber:iq:register");
    }
}

XMPP.Registration.prototype = Object.extend(new XMPP.IQ(null, null, null, null, true), {
    getInstructions: function() {
        var instructions = this.getExtension("instructions");
        if (!instructions) {
            return null;
        }
        else if (!instructions.firstChild) {
            return "";
        }
        return  instructions.firstChild.nodeValue;
    },
    setAttributes: function(map) {
        for (var attr in map) {
            this.addTextExtension(attr, map[attr]);
        }
    }
});

XMPP.Presence = function(to, from, element) {
    this._init("presence", from, to, element);
}

XMPP.Presence.prototype = Object.extend(new XMPP.Packet(), {
    setType: function(presenceType) {
        if (!presenceType || presenceType == "" || presenceType == "available") {
            this.removeAttributes($A("type"));
        }
        else {
            this.addAttributes({ type : presenceType});
        }
    },
    getType: function() {
        var type = this.rootNode.getAttribute("type")
        return (type ? type : "available");
    },
    setPriority: function(priority) {
        if (!priority || !(priority instanceof Number)) {
            this.removeExtension("priority");
        }
        else {
            this.addTextExtension("priority", priority);
        }
    },
    getPriority: function() {
        var priority = this.getExtension("priority");
        if (priority) {
            return priority.firstChild.nodeValue;
        }
        else {
            return 0;
        }
    },
    setMode: function(mode) {
        if (!mode || mode == "" || mode == "available") {
            this.removeExtension("show");
        }
        else {
            this.addTextExtension("show", mode);
        }
    },
    getMode: function() {
        var show = this.getExtension("show");
        if (show) {
            return show.firstChild.nodeValue;
        }
        else {
            return null;
        }
    },
    setStatus: function(status) {
        if (!status || status == "") {
            this.removeExtension("status");
        }
        else {
            this.addTextExtension("status", status);
        }
    },
    getStatus: function() {
        var status = this.getExtension("status");
        if (status && status.firstChild) {
            return status.firstChild.nodeValue.escapeHTML();
        }
        else {
            return null;
        }
    }
});

XMPP.Message = function(packetType, from, to, element) {
    if (!packetType && !from && !to && !element) {
        return;
    }
    this._init("message", from, to, element);

    if (!element) {
        this.setType(packetType);
    }
}

XMPP.Message.prototype = Object.extend(new XMPP.Packet(), {
    setType: function(messageType) {
        if (!messageType || messageType == "" || messageType == "normal") {
            this.removeAttributes($A("type"));
        }
        else {
            this.addAttributes({ type : messageType });
        }
    },
    getType: function() {
        var type = this.rootNode.getAttribute("type");
        if (!type) {
            type = "normal";
        }
        return type;
    },
    setSubject: function(subject) {
        if (!subject || subject == "") {
            this.removeExtension("subject");
        }
        else {
            this.addTextExtension("subject", subject);
        }
    },
    getSubject: function(dontEscapeSubject) {
        var subject = this.getExtension("subject");
        if (!subject) {
            return null;
        }
        else if (!subject.firstChild) {
            return "";
        }
        return  (dontEscapeSubject) ? subject.firstChild.nodeValue
                : subject.firstChild.nodeValue.escapeHTML();
    },
    setBody: function(body) {
        if (!body || body == "") {
            this.removeExtension("body");
        }
        else {
            this.addTextExtension("body", body);
        }
    },
    getBody: function() {
        var body = this.getExtension("body");
        if (!body) {
            return null;
        }
        return {
            body: body.firstChild.nodeValue.escapeHTML(),
            lang: body.getAttribute("lang")
        }
    },
    getBodies: function() {
        var bodies = this.getExtensions("body");
        if (!bodies) {
            return null;
        }
        return bodies.collect(function(body) {
            return {
                body: body.firstChild.nodeValue.escapeHTML(),
                lang: body.getAttribute("lang")
            }
        });
    },
    setThread: function(thread) {
        if (!thread || thread == "") {
            this.removeExtension("thread");
        }
        else {
            this.addTextExtension("thread", thread);
        }
    },
    getThread: function() {
        var threadExtension = this.getExtension("thread");
        if (!threadExtension) {
            return null;
        }

        return threadExtension.firstChild.nodeValue;
    }
});

org.jive.spank.roster.Packet = function(packetType, from, to, element) {
    this._init("iq", from, to, element);

    if (!element) {
        this.setType(packetType);
        this.setQuery("jabber:iq:roster");
    }
}

org.jive.spank.roster.Packet.prototype = Object.extend(new XMPP.IQ(null, null, null, null, true), {
    getItems: function() {
        var items = new Array();
        var nodes = this.getExtension().childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].tagName != "item") {
                continue;
            }

            var item = new org.jive.spank.roster.Item(nodes[i].cloneNode(true));
            items.push(item);
        }
        return items;
    },
    addItem: function(jid, name) {
        var item = this.doc.createElement("item");
        this.getExtension().appendChild(item);

        item.setAttribute("jid", jid.toBareJID());
        if (name) {
            item.setAttribute("name", name);
        }

        return new org.jive.spank.roster.Item(item);
    }
});

org.jive.spank.roster.Item = function(element) {
    this._element = element;
}

org.jive.spank.roster.Item.prototype = {
    getJID: function() {
        var attr = this._element.getAttribute("jid");
        if (!attr) {
            return null;
        }
        else {
            return new XMPP.JID(attr);
        }
    },
    getName: function() {
        return this._element.getAttribute("name");
    },
    isSubscriptionPending: function() {
        return this._element.getAttribute("ask");
    },
    getSubscription: function() {
        return this._element.getAttribute("subscription");
    },
    setSubscription: function(subscription) {
        this._element.setAttribute("subscription", subscription);
    },
    getGroups: function() {
        var nodes = this._element.childNodes;
        var groups = new Array();
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].tagName == "group" && nodes[i].firstChild) {
                groups.push(nodes[i].firstChild.nodeValue);
            }
        }
        return groups;
    },
    addGroups: function(groups) {
        for (var i = 0; i < groups.length; i++) {
            var groupNode = this._element.appendChild(this._element.ownerDocument
                    .createElement("group"));
            groupNode.appendChild(this._element.ownerDocument.createTextNode(groups[i]));
        }
    }
}

org.jive.spank.muc.User = function(to, from, element) {
    this._init("message", from, to, element);

    if (!element) {
        this.addExtension("x", "http://jabber.org/protocol/muc#user");
    }
}

org.jive.spank.muc.User.prototype = Object.extend(new XMPP.Message(), {
    setInvite: function(jid, reason) {
        if (!jid || !(jid instanceof XMPP.JID)) {
            throw Error("Inivte must contain invitee, provide a JID");
        }

        var invite = this.doc.createElement("invite");
        this.getExtension().appendChild(invite);

        invite.setAttribute("to", jid.toString());

        if (reason) {
            var reasonNode = this.doc.createElement("reason");
            reasonNode.appendChild(this.doc.createTextNode(reason));
            invite.appendChild(reasonNode);
        }
    },
    getInvite: function() {
        var ex = this._getEx();
        var childNodes = ex.childNodes;
        var invite;
        for (var i = 0; i < childNodes.length; i++) {
            var node = childNodes[i];
            if (node.tagName == "invite") {
                invite = node;
                break;
            }
        }
        if (!invite) {
            return null;
        }

        var reason = invite.firstChild;
        if (reason) {
            reason = reason.firstChild.nodeValue;
        }
        else {
            reason = null;
        }

        var invitation = {};
        invitation["room"] = this.getFrom();
        invitation["from"] = invite.getAttribute("from");
        if (reason) {
            invitation["reason"] = reason;
        }
        return invitation;
    },
    setDecline: function(jid, reason) {
        if (!jid || !(jid instanceof XMPP.JID)) {
            throw Error("Invite must contain invitee, provide a JID");
        }

        var decline = this.doc.createElement("decline");
        this.getExtension().appendChild(decline);

        decline.setAttribute("to", jid.toString());

        if (reason) {
            var reasonNode = this.doc.createElement("reason");
            reasonNode.appendChild(this.doc.createTextNode(reason));
            decline.appendChild(reasonNode);
        }
    },
    getDecline: function() {
        var ex = this._getEx();
        var childNodes = ex.childNodes;
        var declineNode;
        for (var i = 0; i < childNodes.length; i++) {
            var node = childNodes[i];
            if (node.tagName == "decline") {
                declineNode = node;
                break;
            }
        }
        if (!declineNode) {
            return null;
        }

        var reason = declineNode.firstChild;
        if (reason) {
            reason = reason.firstChild.nodeValue;
        }
        else {
            reason = null;
        }

        var decline = {};
        decline.room = this.getFrom();
        decline.from = declineNode.getAttribute("from");
        if (reason) {
            decline.reason = reason;
        }
        return decline;
    },
/**
 * Returns any status codes that are attached to the MUC#User element.
 */
    getStatusCodes: function() {
        if(this._statusCodes) {
            return this._statusCodes;
        }
        var ex = this._getEx();

        var statusCodes = new Array();
        var childNodes = ex.childNodes;
        for (var i = 0; i < childNodes.length; i++) {
            var node = childNodes[i];
            if (node.tagName == "status") {
                statusCodes.push(node.getAttribute("code"));
            }
        }

        this._statusCodes = statusCodes;
        return this._statusCodes;
    },
    getItem: function() {
        if(this._item) {
            return this._item;
        }
        var ex = this._getEx();
        var itemNode = ex.getElementsByTagName("item");
        if(!itemNode) {
            throw Error("Item could not be loaded from packet.");
        }
        var item = {};
        for(var attrName in itemNode.attributes) {
            var attr = itemNode.attributes[attrName];

            item[attr.name] = attr.value;
        }

        this._item = item;
        return item;
    },
    _getEx: function() {
        var ex = this._extension;
        if (!ex) {
            ex = this.getExtension("x");
            if (!ex) {
                return null;
            }
            this._extension = ex;
        }
        return ex;
    }
});

/**
 * A message with the muc owner extension attached to it. The owner extension handles
 * things like destroying a room and changing user roles.
 *
 * @param {JID} to the room handling the owner packet.
 * @param {JID} from the owner sending the request.
 * @param {Element} element the base element used to create this packet.
 */
org.jive.spank.muc.Owner = function(packetType, to, from, element) {
    this._init("iq", from, to, element);

    if (!element) {
        this.setQuery("http://jabber.org/protocol/muc#owner");
    }
}

org.jive.spank.muc.Owner.prototype = Object.extend(new XMPP.IQ(null, null, null, null, true), {
    setDestroy: function(reason, jid) {
        var destroy = this.doc.createElement("destroy");
        this.getExtension().appendChild(destroy);

        if (jid) {
            destroy.setAttribute("jid", jid.toString());
        }
        if (reason) {
            var reasonNode = this.doc.createElement("reason");
            reasonNode.appendChild(this.doc.createTextNode(reason));
            destroy.appendChild(reasonNode);
        }
    },
    getDestroy: function() {
        var childNodes = this.getExtension().childNodes;
        var destroyNode;

        for (var i = 0; i < childNodes.length; i++) {
            if (childNodes[i].tagName == "destroy") {
                destroyNode = childNodes[i];
                break;
            }
        }

        if (destroyNode) {
            var jid = destroyNode.getAttribute("jid");
            var reason;
            if (destroyNode.firstChild) {
                reason = destroyNode.firstChild.firstChild.nodeValue;
            }
            return {
                jid: jid,
                reason: reason
            }
        }
        else {
            return null;
        }
    },
    addItem: function(affiliation, jid, nick, role, reason, actor) {
        var item = this.doc.createElement("item");
        this.getExtension().appendChild(item);

        if (affiliation) {
            item.setAttribute("affiliation", affiliation);
        }
        if (jid && jid instanceof XMPP.JID) {
            item.setAttribute("jid", jid.toString());
        }
        if (nick) {
            item.setAttribute("nick", nick);
        }
        if (role) {
            item.setAttribute("role", role);
        }
        if (reason) {
            var reasonNode = this.doc.createElement("reason");
            reasonNode.appendChild(this.doc.createTextNode(reason));
            destroy.appendChild(reasonNode);
        }
        if (actor) {
            var actorNode = this.doc.createElement("actor");
            actorNode.setAttribute("jid", actor);
            destroy.appendChild(actorNode);
        }
    }
});

org.jive.spank.search = {
    _managers: [],
/**
 * Retrieves a singleton for the connection which is the chat state manager.
 *
 * @param {org.jive.spank.chat.Manager} manager the chat manager to retrieve the singleton for.
 */
    getManager: function(connection) {
        var searchManager = org.jive.spank.search._managers.detect(
                function(connection, searchManager) {
            return searchManager._connection == connection;
        }.bind(null, connection));

        if (searchManager == null) {
            searchManager
                    = new org.jive.spank.search.Manager(connection);
            org.jive.spank.search._managers.push(searchManager);
            connection.addConnectionListener({
                connectionClosed: function() {
                    var index = org.jive.spank.search._managers.indexOf(this);

                    if (index >= 0) {
                        org.jive.spank.search._managers.splice(index, 1);
                    }
                }.bind(searchManager)
            });
        }
        return searchManager;
    }

};

/**
 * Creates a search manager.
 * @param connection the connection that this search manager will utilize.
 */
org.jive.spank.search.Manager = function(connection) {
    this._connection = connection;
}

org.jive.spank.search.Manager.prototype = {
    getSearchServices: function(serviceCallback, server) {
        if(!serviceCallback) {
            throw Error("Callback must be specified to forward returned services to");
        }
        if (!server) {
            server = new XMPP.JID(this._connection.domain);
        }

        var infoCallback = function(serviceCallback, hasFeature, jid, feature) {
            if(hasFeature) {
                serviceCallback(jid);
            }
        }.bind(this, serviceCallback);

        var discoManager = org.jive.spank.disco.getManager(this._connection);
        var callback = function(infoCallback, discoManager, items) {
            items.pluck("jid").each(function(jid) {
                discoManager.hasFeature(jid, "jabber:iq:search", infoCallback)
            });
        }.bind(this, infoCallback, discoManager);

        discoManager.discoverItems(callback, server);
    },
/**
 * Retrieves a search form from a service
 */
    getSearchForm: function(serviceJID, callback) {
        var iq = this._createSearchPacket("get", serviceJID);
        var packetFilter = org.jive.spank.PacketFilter.filter.IDFilter(
                this._processSearchForm.bind(this, callback), iq);
        this._connection.sendPacket(iq, packetFilter)
    },
    _processSearchForm: function(callback, searchFormPacket) {
        var service = searchFormPacket.getFrom();
        var searchForm = new XMPP.XData(null, searchFormPacket.getExtension("x", "jabber:x:data"));
        callback(service, searchForm);
    },
    submitSearch: function(serviceJID, answerForm, searchResultsCallback) {
        if(!serviceJID) {
            throw Error("Service JID must be specified.");
        }
        if(!answerForm) {
            throw Error("Answer form must be specified.");
        }
        if(!searchResultsCallback) {
            throw Error("Search results callback must be specified.");
        }
        var iq = this._createSearchPacket("set", serviceJID);
        answerForm.addToExtension(iq.getExtension("query", "jabber:iq:search"));

        this._connection.sendPacket(iq, org.jive.spank.PacketFilter.filter.IDFilter(
                this._processSearchResults.bind(this, searchResultsCallback), iq));
    },
    _createSearchPacket: function(iqType, serviceJID) {
        var iq = new XMPP.IQ(iqType, null, serviceJID);
        iq.addExtension("query", "jabber:iq:search");
        return iq;
    },
    _processSearchResults: function(searchResultsCallback, searchResultPacket) {
        var searchForm = new XMPP.XData(null,
                searchResultPacket.getExtension("x", "jabber:x:data"));
        searchResultsCallback(searchForm.getReportedValues());
    }
}

XMPP.JID = function(jid) {
    this.jid = jid.toLowerCase();
}

XMPP.JID.prototype = {
    toString: function() {
        return this.jid;
    },
    toBareJID: function() {
        if (!this.bareJID) {
            var i = this.jid.indexOf("/");
            if (i < 0) {
                this.bareJID = this.jid;
            }
            else {
                this.bareJID = this.jid.slice(0, i);
            }
        }
        return this.bareJID;
    },
    getBareJID: function() {
        return new XMPP.JID(this.toBareJID());
    },
    getResource: function() {
        var i = this.jid.indexOf("/");
        if (i < 0) {
            return null;
        }
        else {
            return this.jid.slice(i + 1);
        }
    },
    getNode: function() {
        var i = this.jid.indexOf("@");
        if (i < 0) {
            return null;
        }
        else {
            return this.jid.slice(0, i);
        }
    },
    getDomain: function() {
        var i = this.jid.indexOf("@");
        var j = this.jid.indexOf("/");
        if (i < 0) {
            return null;
        }
        else {
            if (j < 0) {
                return this.jid.slice(i + 1);
            }
            else {
                return this.jid.slice(i + 1, j);
            }
        }
    },
    equals: function(jid, shouldTestBareJID) {
        if(shouldTestBareJID) {
            return jid.toBareJID() == this.toBareJID();
        }
        else {
            return jid.jid == this.jid;
        }
    }
}

XMPP.PacketExtension = function() {
};

XMPP.PacketExtension.prototype = {
    _init: function(fieldName, namespace, element) {
        this.doc = Sarissa.getDomDocument();
        var created = !element;
        if (!element) {
            if (namespace && this.doc.createElementNS) {
                element = this.doc.createElementNS(namespace,
                        fieldName);
            }
            else {
                element = this.doc.createElement(fieldName);
            }
            if (namespace) {
                element.setAttribute("xmlns", namespace);
            }
        }
        // Fix for safari, IE6 doesn't support importNode but works
        // fine with just appendChild
        else if (!_SARISSA_IS_IE) {
            element = this.doc.importNode(element, true);
        }
        this.doc.appendChild(element);

        this.rootNode = this.doc.firstChild;
    }
}

/**
 * Create a new XData form. This class contains convience methods for parsing, and manipulating
 * DataForms. It is a Packet Extension, so it is contained inside of either and IQ or Message
 * packet, adding it to a Presence, generally doesn't have a use.
 *
 * @class
 * @xep http://www.xmpp.org/extensions/xep-0004.html
 */
XMPP.XData = function(type, element) {
    this._init("x", "jabber:x:data", element);

    if (type) {
        this.setType(type);
    }
}

/**
 * Enumeration of the possible field types present in an XData form.
 */
XMPP.XData.FieldType = {
    /**
     *
     */
    hidden: "hidden",
    /**
     *
     */
    bool: "boolean",
    /**
     *
     */
    fixed: "fixed",
    /**
     *
     */
    jidMulti: "jid-multi",
    /**
     *
     */
    listMulti: "list-multi",
    /**
     *
     */
    jidSingle: "jid-single",
    /**
     *
     */
    listSingle: "list-single",
    /**
     *
     */
    textMulti: "text-multi",
    /**
     *
     */
    textSingle: "text-single"
}

XMPP.XData.prototype = Object.extend(new XMPP.PacketExtension(), {
    getType: function() {
        var type = this.rootNode.getAttribute("type");
        if(!type) {
            return "form";
        }
        else {
            return type;
        }
    },
/**
 * Valid form types are as follows:
 * form  	The form-processing entity is asking the form-submitting entity to complete a form.
 * submit 	The form-submitting entity is submitting data to the form-processing entity.
 * cancel 	The form-submitting entity has cancelled submission of data to the form-processing entity.
 * result 	The form-processing entity is returning data (e.g., search results) to the
 * form-submitting entity, or the data is a generic data set
 *
 * @param {String} type the type of the form.
 */
    setType: function(type) {
        if (!type) {
            type = "form";
        }

        this.rootNode.setAttribute("type", type);
    },
    /**
     * Returns all of the fields in a form in an Array. The Array structure is as follows:
     * [{
     *      // A unique variable name for the field
     *      variable: 'state',
     *      // A user friendly label to be displayed to the end user.
     *      fieldLabel: 'State of Residence',
     *      // The type that the field is, see XMPP.XData.FieldType, for an enumeration of possible
     *      // types.
     *      type: 'list-single',
     *      // An array of either possible values to be selected by the user or, the value which
     *      // has been entered by the user.
     *      values: ['PA', 'OR'],
     *      // A true or false of whether or not this field is required for proper submission of the
     *      // form.
     *      isRequired: true
     * }]
     */
    getFields: function(onlyReturnRequired, dontEscapeFieldValues) {
        var fields = this.rootNode.childNodes;

        var toReturn = new Array();
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (field.tagName != "field" || field.getAttribute("type")
                    == XMPP.XData.FieldType.hidden) {
                continue;
            }

            var fieldJson = this._parseFieldJson(field, dontEscapeFieldValues);
            if (!onlyReturnRequired || (onlyReturnRequired && fieldJson.required)) {
                toReturn.push(fieldJson);
            }
        }
        return toReturn;
    },
    _parseFieldJson: function(field, dontEscapeFieldValues) {
        var variable = field.getAttribute("var");
        var fieldLabel = field.getAttribute("label");
        var type = field.getAttribute("type");
        var values = new Array();
        var fieldValues = field.childNodes;
        var isRequired = false;
        for (var j = 0; j < fieldValues.length; j++) {
            if (fieldValues[j].tagName != "value" || !fieldValues[j].firstChild) {
                isRequired = fieldValues[j].tagName == "required";
                continue;
            }
            var value;
            if (dontEscapeFieldValues) {
                value = fieldValues[j].firstChild.nodeValue;
            }
            else {
                value = fieldValues[j].firstChild.nodeValue.escapeHTML();
            }
            values.push(value);
        }
        return {
            variable: variable,
            fieldLabel: fieldLabel,
            values: values,
            type: type,
            required: isRequired
        }
    },
    getAnswerForm: function() {
        var answerForm = new XMPP.XData("submit");

        var fields = $A(this.rootNode.childNodes);
        fields.each(function(field) {
            if (field.tagName != "field" || !field.getAttribute("var")) {
                return;
            }

            var shouldCloneChildren = field.getAttribute("type") == XMPP.XData.FieldType.hidden
                    || field.getAttribute("type") == XMPP.XData.FieldType.bool;
            var clone = field.cloneNode(shouldCloneChildren);
            var node;
            if (answerForm.doc.importNode) {
                node = answerForm.doc.importNode(clone, true);
            }
            else {
                node = clone;
            }
            answerForm.rootNode.appendChild(node);
        });
        return answerForm;
    },
    setAnswer: function(variable, answers) {
        if(this.getType() != "submit") {
            throw Error("Answers can only be set on data forms of type 'submit'.");
        }
        var field = this._getField(variable);
        if (!field) {
            throw Error("Form does not contain field for " + variable);
        }

        // Purge any default values.
        $A(field.childNodes).each(function(field, childNode) {
            field.removeChild(childNode);
        }.bind(null, field))

        answers.each(function(answer) {
            var textNode = field.appendChild(this.doc.createElement("value"));
            textNode.appendChild(this.doc.createTextNode(answer));
        }.bind(this));
    },
    /**
    * Returns an array of arrays comprising the reported values, the first row will list the
    * reported fields and subsequent rows will list the results.
    */
    getReportedValues: function() {
        var reportedNode = $A(this.rootNode.childNodes).detect(function(childNode) {
            return childNode.tagName == "reported";
        });

        var reportedFields = $A(reportedNode.childNodes).collect(function(childNode) {
            return {
                label: childNode.getAttribute("label"),
                variable: childNode.getAttribute("var")
            }
        });

        var reportedValues = new Array();
        reportedValues.push(reportedFields);
        $A(this.rootNode.childNodes).each(function(values, childNode) {
            if (childNode.tagName != "item") {
                return;
            }

            values.push($A(childNode.childNodes).collect(function(itemNode) {
                if(!itemNode.firstChild || !itemNode.firstChild.firstChild) { return null; }
                return {
                    variable: itemNode.getAttribute("var"),
                    value: itemNode.firstChild.firstChild.nodeValue
                }
            }).compact());
        }.bind(null, reportedValues));

        return reportedValues;
    },
    getField: function(variable) {
        var field = this._getField(variable);
        if(!field) {
            return null;
        }

        return this._parseFieldJson(field);
    },
    _getField: function(variable) {
        return $A(this.rootNode.childNodes).detect(function(field) {
            return field.getAttribute("var") == variable;
        });
    },
    getInstructions: function() {
        var instructionNode = $A(this.rootNode.childNodes).detect(function(childNode) {
            return childNode.nodeName == "instructions";
        });
        if (instructionNode && instructionNode.firstChild) {
            return instructionNode.firstChild.nodeValue;
        }
        else {
            return null;
        }
    },
    /**
     * Adds the answer form to the given packet extension.
     */
    addToExtension: function(extension) {
        if (!_SARISSA_IS_IE) {
            this.rootNode = extension.ownerDocument.importNode(this.rootNode, true);
        }
        extension.appendChild(this.rootNode);
    }
});

XMPP.DelayInformation = function(element) {
    this.element = element;
}

XMPP.DelayInformation.prototype = {
    getDate: function() {
        var stamp = this.element.getAttribute("stamp");

        var date = new Date();
        var datetime = stamp.split("T");
        date.setUTCFullYear(datetime[0].substr(0, 4), datetime[0].substr(4, 2) - 1,
                datetime[0].substr(6, 2));
        var time = datetime[1].split(":");
        date.setUTCHours(time[0], time[1], time[2]);
        return date;
    }
}

/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 **/

util.base64 = {

// private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

// public method for encoding
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = util.base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            }
            else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                     this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                     this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

// public method for decoding
    decode : function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = util.base64._utf8_decode(output);

        return output;

    },

// private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

// private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c, c1, c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                var c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }
}

var jive = {};
jive.spank = {};
jive.spank.chat = {};

var jive_colors = ["red", "blue" , "gray", "magenta", "violet", "olive", "yellowgreen", "darkred", "darkgreen", "darksalmon", "darkcyan", "darkyellow", "mediumpurple", "peru", "olivedrab", "royalred", "darkorange", "slateblue", "slategray", "goldenrod", "orangered", "tomato", "dodgerblue", "steelblue", "deeppink", "saddlebrown", "coral", "royalblue"];

function uniqueColorForString(word) {
	var index = 0;
	for(var i = 0; i < word.length; i++) {
		index += word.charCodeAt(i) * i;
	}
	return jive_colors[index % jive_colors.length];
}

var spank = {
    loadComponent: function(type) {
        if (type == null || type == "") {
            return null;
        }

        var component = spank._createComponent(type);
        var attributes = spank._loadAttributes(type);

        switch (type) {
            case "chat":
                return new jive.spank.chat.ChatWindow(component.id, attributes);
            case "roster":
                return new jive.spank.roster.RosterWindow(component.id, attributes);
            default:
                return null;
        }
    },
    _loadAttributes: function(element) {
        if (!spank.conf || !spank.conf[element]) {
            return {};
        }
        return spank.conf[element];
    },
    _createComponent: function(type) {
        var elm = document.createElement('div');
        elm.id = YAHOO.util.Dom.generateId();
        document.getElementsByTagName('body')[0].appendChild(elm);
        return elm;
    }
};

jive.spank.Window = function(id, title, dialogConfObj) {
    this.bodyId = YAHOO.util.Dom.generateId();
    jive.spank.chat.Template.dialog.append(id, { windowTitle: title, bodyId: this.bodyId });
    this.dialog = new YAHOO.ext.LayoutDialog(id, dialogConfObj);
    this.dialog.addKeyListener(27, this.dialog.hide, this.dialog);

    this.tabs = {};
    this.id = id;
};

YAHOO.extend(jive.spank.Window, YAHOO.ext.util.Observable, {
    isUpdating: false,
    beginUpdate: function() {
        if (!this.isUpdating) {
            this.isUpdating = true;
            this.dialog.beginUpdate();
        }
    },
    endUpdate: function() {
        if (this.isUpdating) {
            this.isUpdating = false;
            this.dialog.endUpdate();
        }
    },
    show: function() {
        this.dialog.show();
    },
    hide: function() {
        this.dialog.hide();
    },
    isVisible: function() {
        return this.dialog.isVisible();
    },
    destroy: function() {
        this.hide();
        this.dialog.destroy(true);
        delete this.dialog;
    }
});

jive.spank.chat.ChatWindow = function(id, attributes) {
    var width = attributes["width"] ? attributes["width"] : YAHOO.util.Dom.getViewportWidth() - 210;
    var height = attributes["height"] ? attributes["height"] : YAHOO.util.Dom.getViewportHeight() - 65;
    
    //var width = attributes["width"] ? attributes["width"] : 520;    
    //var height = attributes["height"] ? attributes["height"] : 450;
    //var x = attributes["x"] ? attributes["x"] : (YAHOO.util.Dom.getViewportWidth() / 2) - 260;
    //var y = attributes["y"] ? attributes["y"] : (YAHOO.util.Dom.getViewportHeight() / 2) - 225;    
    
    var x = attributes["x"] ? attributes["x"] : 210;    
    var y = attributes["y"] ? attributes["y"] : 60;
    var resizable = attributes["resizable"] != "false";
    var draggable = attributes["draggable"] != "false";
    var closable = attributes["closable"] != "false";
    var blinkTab = attributes["blinktab"] == "true";
    var constrained = attributes["constrained"] != "false";
    if (blinkTab) {
        this.notificationInterval = {};
    }
    var confObject = {
        modal: false,
        constraintoviewport: constrained,
        width: width,
        height: height,
        shadow: false,
        proxyDrag: false,
        resizable: false,
        draggable: false,
        minWidth: 300,
        minHeight: 300,
        x: x,
        y: y,
        closable: true
    };
    if (attributes['bottomPane']) {
        confObject = $H(confObject).merge({
            south: {
                autoScroll: false,
                initialSize: 30
            },
            east: {
                split: true,
                initialSize: 170,
                minSize: 50,
                maxSize: 200,
                autoScroll: false,
                collapsible: true
            },
            center: {
                autoScroll: false,
                autoTabs: false
            }
        });
    }
    else {
        confObject = $H(confObject).merge({
            north: {
                autoScroll: false,
                initialSize: 500
            },
            east: {
                split: true,
                initialSize: 105,
                minSize: 50,
                maxSize: 200,
                autoScroll: false,
                collapsible: true
            },
            center: {
                autoScroll: false,
                closeOnTab: true,
                alwaysShowTabs: true,
                autoTabs: false
            }
        });
    }
    jive.spank.chat.ChatWindow.superclass.constructor.call(this, id, "Chat", confObject);
    this.events = {
        "input": true,
        "message": true,
    /**
     * @event mucdblclicked
     * Fires when the user double-clicks a MUC row in a MUC chooser.
     * @param {jive.spank.chat.ChatWindow} chatwindow the window asking for the MUC
     * @param {String} address the MUC's name, for composition with a server to form a JID.
     * @param {String} choosertabId DOM ID of the MUC chooser tab, for optional passing to addMUC for destruction
     */
        "mucdblclicked": true,
        "tabclosed": true,
    /**
     * @event mucinvitation
     * Fires when the user invites a contact to a MUC.
     * @param {jive.spank.chat.ChatWindow} chatwindow ref to the muc's chat window
     * @param {String} userjid JID for the invited user
     * @param {String} roomjid the MUC's JID
     */
        "mucinvitation": true,
    /**
     * @event changenameinmuc
     * Fires when the user submits a nickname change
     * @param {jive.spank.chat.ChatWindow} chatwindow ref to the muc's chat window
     * @param {String} roomjid JID for the MUC in question
     * @param {String} newnick the nick to change to
     */
        "changenameinmuc": true,
    /**
     * @event refreshmuclist
     * Fires when the user wants to refresh that there list of MUCs
     * @param {jive.spank.chat.ChatWindow} chatwindow ref to the muc's chat window
     */
        "refreshmuclist": true,
	/**
	 * @event createmuc
	 * Fires when the user wants to create a MUC
	 */
	    "createmuc": true
    };
    var layout = this.dialog.getLayout();

    layout.regions['center'].addListener("panelremoved", function() {
        if (layout.regions['center'].tabs.items.length == 0) {
            this.dialog.hide();
        }
    }.bind(this));

    this.dialog.addListener("hide", function() {
        if (this.destroyed) {
            return;
        }
        this.destroyed = true;
        this.removeAllTabs();
        this.dialog.destroy(true);
        //this.dialog.proxy.remove();
        //this.dialog.resizer.proxy.remove();
    }.bind(this));

    this.newMessages = {};
    this._wrappedFns = {};
};
YAHOO.extend(jive.spank.chat.ChatWindow, jive.spank.Window, {

/**
 * Does the heavy HTML lifting for adding a new tab.
 *
 * @param {jive.spank.chat.Contact/String} either a Contact object (or fakey
 * version with name and jid properties) or a jid.
 */
    addTab: function(contactObj) {
        this.dialog.beginUpdate();
        if (typeof contactObj == 'string') {
            var thejid = contactObj;
            contactObj = {name: thejid, jid: thejid};
        }
        
        var tabId = "jive-tab-" + contactObj.jid;

        jive.spank.chat.Template.tab.append(this.bodyId, {tabId: tabId});
        var layout = this.dialog.getLayout();

        var innerLayout = new YAHOO.ext.BorderLayout(tabId + "-layout",
                jive.spank.chat.ChatWindow.tabConfObject);

	if(window.showUpperStuff == "show") {
/*	
	        if (typeof contactObj.jid == 'string') {
			var i = contactObj.jid.indexOf("@");
			
			if (i < 0) {
			    var userid = contactObj.jid;
			}
			else {
			    var userid = contactObj.jid.slice(0, i);
			}
		} else
            		var userid = contactObj.jid.getNode();
*/            
		innerLayout.add('north', new YAHOO.ext.ContentPanel(tabId + '-toppane'));
		//jive.spank.chat.Template.chat_toppane.append(tabId + '-toppane', {tabId: tabId, username: userid});
		jive.spank.chat.Template.chat_toppane.append(tabId + '-toppane', {tabId: tabId});		
		//innerLayout.regions['north'].hide();
        }

        innerLayout.add('center', new YAHOO.ext.ContentPanel(tabId + '-history'));
        //var resizeHandler = textArea.fitToParent.createDelegate(innerLayout.regions('center'));
        //innerLayout.delayedListener("regionresized", resizeHandler, 100);

        // south panel and textarea sizing
        innerLayout = this._layoutTextarea(innerLayout, tabId, contactObj.jid.toString());

        layout.add('center', new YAHOO.ext.NestedLayoutPanel(innerLayout,
        {title: contactObj.name, closable: true}));

        // now it's a tab, so we can do this:
        var thetab = this.getTabByJID(contactObj.jid);
        var textArea = getEl(tabId + "-text");

        this.tabs[contactObj.jid] = {
            type: "chat",
            tab: this.getTabByJID(contactObj.jid),
            contact: contactObj
        };

        var tabFocusAction = function(contact) {
            this.clearNotification(contact.jid);
            this.dialog.setTitle('<h1>' + contact.name + '</h1>');
            this._scrollMessageHistory(getEl("jive-tab-" + contact.jid + "-history"));
            textArea.dom.focus();
        }.bind(this, contactObj);
        thetab.addListener("activate", tabFocusAction);

        thetab.addListener("close", function() {
            this._wrappedFns[tabId].each(function(value) {
                value();
            });
            this.fireEvent("tabclosed", contactObj, this.tabs[contactObj.jid]);

            delete this._wrappedFns[tabId];
            delete this.tabs[contactObj.jid];
        }.bind(this));
        var clearNotifyListener = function(contact) {
            this.clearNotification(contact.jid);
        }.bind(this, contactObj);
        thetab.el.mon("click", clearNotifyListener);
        getEl(getEl(tabId + '-history').dom.parentNode.id).mon("click", clearNotifyListener);

        if (contactObj.addListener) {
            var listener = function(oldStatus, status) {
                thetab.textEl.replaceClass('jive-status-' + oldStatus, 'jive-status-' + status)
            };
            contactObj.addListener("status", listener);
            thetab.addListener("close", function() {
                contactObj.removeListener("statusChanged", listener);
            });
        }
        thetab.textEl.addClass('jive-status-' + (contactObj.status ?
                                                 contactObj.status : "unavailable"));
        this.dialog.endUpdate();
        tabFocusAction();
        return true;
    },

    preAddMUCChooser: function() {
        var tabId = "jive-tab-mucchooser";
        if (this.dialog.layout.regions['center'].panels.items[tabId + '-spinner']) {
            delete this.dialog.layout.regions['center'].panels.items[tabId + '-spinner'];
        }
        jive.spank.chat.Template.spinnertab.append(this.bodyId,
        {tabId: tabId, text: 'Loading...'});

        var layout = this.dialog.getLayout();
        this.dialog.beginUpdate();
        layout.add('center', new YAHOO.ext.ContentPanel(tabId + '-spinner',
        {title: 'Choose a Conference'}));
        this.dialog.endUpdate();

        var thetab = this.getTabs().items[tabId + '-spinner'];
        thetab.textEl.addClass('jive-muc');

        var self = this;
        thetab.addListener("close", function() {
            delete self.dialog.layout.regions['center'].panels.items[tabId + '-spinner'];
        });

        this.tabs['mucchooser'] = {
            type: "muc-spinner",
            tab: thetab
        };
    },

    addChooseMUCTab: function(roomsData) {
		if(window.jive_enable_grid == "enable") {
        this.dialog.beginUpdate();
        if (this.tabs['mucchooser']) {
            this.getTabs().removeTab('jive-tab-mucchooser-spinner');
            delete this.dialog.layout.regions['center'].panels.items['jive-tab-mucchooser-spinner'];
            delete this.tabs['mucchooser'];
        }

        var tabId = YAHOO.util.Dom.generateId();
        jive.spank.chat.Template.mucchooser.append(this.bodyId, {tabId: tabId});
        this._wrappedFns[tabId] = [];

        var layout = this.dialog.getLayout();
        var innerLayout = new YAHOO.ext.BorderLayout(tabId + "-layout",
                jive.spank.chat.ChatWindow.chooseMUCConfObject);

        innerLayout.add('north', new YAHOO.ext.ContentPanel(tabId + '-toppane'));
        jive.spank.chat.Template.muc_chooser_top.append(tabId + '-toppane', {tabId: tabId});

        // fire up those tophat buttons
        getEl(tabId + '-createconf').addListener('click', this.fireEvent.createDelegate(this,
                ['createmuc', this, tabId + "-layout"]));
        getEl(tabId + '-refresh').addListener('click', this.fireEvent.createDelegate(this,
                ['refreshmuclist', this, tabId]));

        // add gridpanel with our grid
        innerLayout.add('center',
                new YAHOO.ext.GridPanel(this._buildMUCChooserGrid(roomsData, tabId)));


		layout.add('center', new YAHOO.ext.NestedLayoutPanel(innerLayout,
        {title: "Choose a Conference", closable: true}));

        var realTabId = getEl(tabId + '-roomgrid').getParentByClass('yui-ext-tabitembody').id;
        var muctab = this.getTabs().items[realTabId];
        muctab.textEl.addClass('jive-muc');

        var tabFocusAction = this.dialog
                .setTitle.createDelegate(this.dialog, ["<h1>" + "Choose a Conference" + "</h1>"]);
        muctab.addListener("activate", tabFocusAction);
        muctab.addListener("close", this._wrappedFns[tabId].each.createDelegate(
                this._wrappedFns[tabId], [function(func) {
            func();
        } ]));

        this.tabs['muc-chooser-' + tabId] = {
            type: "muc-chooser",
            tab: muctab
        };
        this.dialog.endUpdate();
        getEl(tabId + '-confcontrols').fitToParent();
        tabFocusAction();
		}
    },

    _buildMUCChooserGrid: function(roomsData, tabId) {
		if(window.jive_enable_grid == "enable") {
        var schema = {
            fields: ["name", "muc#roominfo_subject", "muc#roominfo_occupants"]
        }
        var gridData = new YAHOO.ext.grid.SpankJSONDataModel(schema);
        var dataProcessor = function(value) {
            if (value.values) {
                return value.values[0];
            }
            else {
                return value;
            }
        }
        gridData.addPreprocessor(1, dataProcessor);
        gridData.addPreprocessor(2, dataProcessor);
        gridData.loadData(roomsData);

        // get some labels on there
        var roomCols = [
        {header: "Name", width: 240, sortable: true},
        {header: "Subject", width: 160, sortable: true},
        {header: "Occupants", width: 70, sortable: true}
                ];
        var gridCols = new YAHOO.ext.grid.DefaultColumnModel(roomCols);

        // finally! build grid
        var roomGrid = new YAHOO.ext.grid.Grid(tabId + '-roomgrid', {
            dataModel: gridData,
            colModel: gridCols,
            selModel: new YAHOO.ext.grid.SingleSelectionModel(),
            monitorWindowResize: false,
            stripeRows: false
        });
        roomGrid.render();
        this._wrappedFns[tabId].push(roomGrid.destroy.createDelegate(roomGrid, [true]));
        // add row dblclick handler
        roomGrid.addListener('rowdblclick', function(grid, rownum, evt) {
            var choosertabId = evt.findTarget('ylayout-nested-layout').id;
            var name = grid.getDataModel().getRow(rownum)[0]
            var jid = grid.getSelectedRowId();
            this.fireEvent("mucdblclicked", this, jid, name, choosertabId);
        }.bind(this));

        return roomGrid;
		}
    },

    preAddMUC: function(roomObj, choosertabId) {
        var jid = roomObj.jid;
        if(jid.toBareJID)
    		jid = jid.toBareJID();
        var tabId = "jive-tab-" + jid;        
        if (this.dialog.layout.regions['center'].panels.items['jive-tab-' + jid + '-spinner']) {
            delete this.dialog.layout.regions['center'].panels.items['jive-tab-' + jid + '-spinner'];
        }
        jive.spank.chat.Template.spinnertab.append(this.bodyId,
        {tabId: tabId, text: 'Joining "' + roomObj.name + '"...'});
        if (choosertabId) {
            this.getTabs().removeTab(choosertabId);
            // maybe best left to external method?
        }

        var layout = this.dialog.getLayout();
        this.dialog.beginUpdate();
        layout.add('center', new YAHOO.ext.ContentPanel(tabId + '-spinner',
        {title: roomObj.name}));
        this.dialog.endUpdate();

        var thetab = this.getTabs().items['jive-tab-' + jid + '-spinner'];
        thetab.textEl.addClass('jive-muc');

        var self = this;
        thetab.addListener("close", function() {
            delete self.dialog.layout.regions['center'].panels.items['jive-tab-' + jid + '-spinner'];
        });

        this.tabs[jid] = {
            type: "muc-spinner",
            tab: thetab
        };
    },
    removeMUCSpinner: function(jid) {
        if (this.tabs[jid] && this.tabs[jid].type == 'muc-spinner') {
            this.dialog.beginUpdate();
            delete this.dialog.layout.regions['center'].panels.items['jive-tab-' + jid + '-spinner'];
            this.getTabs().removeTab(this.tabs[jid].tab.id);
            delete this.tabs[jid];
            if (this.dialog.layout.regions['center'].tabs.items.length == 0) {
                this.dialog.hide();
            }
            else {
                this.dialog.endUpdate();
            }
        }
    },

/**
 * Adds a tab for a multi-user chat room.
 *
 * @param {Object} roomObj JSON with keys 'jid', 'name', and 'occupants' (the
 * latter being just like the JSON for a roster group)
 * @param {String} choosertabId optional DOM ID for a muc-chooser tab to kill
 * @param {RosterWindow} rosterWindow optional to show a list of possible invitees to the
 * conference room.
 */
    addMUC: function(roomObj, choosertabId, rosterWindow) {
    	var jid = roomObj.jid;
    	
    	if(jid.toBareJID)
    		jid = jid.toBareJID();   		

        var tabId = "jive-tab-" + jid;
        this.dialog.beginUpdate();
        if (this.tabs[jid] && this.tabs[jid].type == 'muc-spinner') {
            var tabid = this.tabs[jid].tab.id
            this.getTabs().removeTab(this.tabs[jid].tab.id);
        }

        jive.spank.chat.Template.muctab.append(this.bodyId, {tabId: tabId});
        
        var layout = this.dialog.getLayout();
		
		//main layout contains an east sidebar and a center everything else
		var mainLayout = new YAHOO.ext.BorderLayout(tabId + "-layout", jive.spank.chat.ChatWindow.mucConfObject);
		var innerLayout = new YAHOO.ext.BorderLayout(tabId + "-innerlayout", jive.spank.chat.ChatWindow.tabConfObject);
		var sidebarLayout = new YAHOO.ext.BorderLayout(tabId + "-sidebarlayout", jive.spank.chat.ChatWindow.mucSidebarConfObject);

		//innerLayout (center panel in mainLayout) contains a north topic, a center chat history, and a south chat text input
       	var topic = new YAHOO.ext.ContentPanel(tabId + '-subjectbar');
       	innerLayout.add('north', topic);
        
		var chatPanel = new YAHOO.ext.ContentPanel(tabId + '-history');
        innerLayout.add('center', chatPanel);

        //adds the text entry box to 'south'
        innerLayout = this._layoutTextarea(innerLayout, tabId, jid);
        
		
        //the other element in the sidebar is added in prepUserPane, unless there's a rosterWindow
        var contactList = new YAHOO.ext.ContentPanel(tabId + '-occupants');
        sidebarLayout.add('center', contactList);
		
		if (rosterWindow) {
            sidebarLayout = this._doMucControls(tabId, roomObj, rosterWindow.contactsForAutocomp.createDelegate(rosterWindow), sidebarLayout);
        }
        
        //put together the sidebar + main area
        var sidebar = new YAHOO.ext.NestedLayoutPanel(sidebarLayout);
		mainLayout.add('east', sidebar);
		
        var main = new YAHOO.ext.NestedLayoutPanel(innerLayout);
        mainLayout.add('center', main);
		
        layout.add('center', new YAHOO.ext.NestedLayoutPanel(mainLayout,
        {title: roomObj.name, closable: true}));
        
        topic.getEl().dom.parentNode.className += " jive-topic";
        
		chatPanel.getEl().dom.parentNode.className += " jive-chat";
        contactList.getEl().dom.parentNode.parentNode.className += " jive-contact-list";
        main.getEl().dom.parentNode.className += " jive-main";
        sidebar.getEl().dom.parentNode.className += " jive-sidebar";
        
        var eastSplit = layout.regions['east'].getSplitBar()
        this._wrappedFns[tabId].push(eastSplit.destroy.createDelegate(eastSplit, [true]));

        // now it's a tab, so we can do this:
        var thetab = this.getTabByJID(jid);
        var tabFocusAction = function(jid, name, textArea, messageHistory) {
            this.clearNotification(jid);
            this.dialog.setTitle("<h1>" + name + "</h1>");
            this._scrollMessageHistory(messageHistory);
            textArea.dom.parentNode.className += " jive-message-field"; //hax. Should only be set once.
            textArea.dom.focus();
        }.bind(this, jid, roomObj.name, getEl(tabId + "-text"), getEl(tabId + "-history"));

        thetab.addListener("activate", tabFocusAction);
        if (!this.dialog.getLayout().regions['south']) {
            thetab.addListener("close", function() {
                this._wrappedFns[tabId].each(function(value) {
                    value();
                });
                this.fireEvent("tabclosed", roomObj, this.tabs[jid]);

                var roomEl = getEl(jid + '-');
                if (roomEl) {
                    roomEl.remove();
                }

                delete this._wrappedFns[tabId];
                delete this.tabs[jid];
                thetab.purgeListeners();
            }.bind(this));
            thetab.textEl.addClass('jive-muc');
        }
        else {
            jive.spank.chat.Template.muc_subject.append(tabId + '-subjectbar', {jid: jid});
            this.tabId = tabId;
            this.dialog.getLayout().regions['center'].panels.items[0].id = tabId;
        }

        var clearNotifyListener = this.clearNotification.createDelegate(this, [jid]);
        thetab.el.addListener("click", clearNotifyListener);
        getEl(getEl(tabId + '-history').dom.parentNode.id).addListener("click",
                clearNotifyListener);

        // fill in room participants
        jive.spank.chat.Template.roster.append(tabId + '-occupants', {
            rosterId: tabId + '-roster',
            groups: ''
        });
        thetab.roster = new jive.spank.roster.Roster(tabId + '-roster');

        var participants = {"Participants": (roomObj.occupants ? roomObj.occupants : {})};
        thetab.roster.setRoster(participants);
        thetab.roster.render();
        thetab.roster.sortGroups();
        thetab.roster._enableBehaviors(false);
        // false = no group hiding
        getEl(tabId + "-text").dom.focus();

        this.dialog.endUpdate();
        tabFocusAction();
        return this.tabs[jid] = {
            type: "muc-room",
            tab: thetab,
            roster: thetab.roster,
            participants: thetab.roster.groups["Participants"],
            room: roomObj
        };
    },

    _layoutTextarea: function(innerLayout, tabId, tabJID) {
        innerLayout.add('south', new YAHOO.ext.ContentPanel(tabId + '-text'));
        var textArea = getEl(tabId + "-text");

        this._wrappedFns[tabId] = [];

        var southSplit = innerLayout.regions['south'].getSplitBar()
        this._wrappedFns[tabId].push(southSplit.destroy.createDelegate(southSplit, [true]));

        var resizeHandler = textArea.fitToParent.createDelegate(textArea);
        innerLayout.delayedListener("regionresized", resizeHandler, 100);
        this._wrappedFns[tabId].push(innerLayout.purgeListeners.createDelegate(innerLayout));

        this.dialog.addListener("resize", resizeHandler);

        this._wrappedFns[tabId].push(this.dialog.removeListener.createDelegate(this.dialog,
                ["resize", resizeHandler]));

        //XXX: this is a hack to get around the fact that it's too early. We should figure out where it really goes.
        //Without it, the text entry box is too large until you resize the window.
        window.setTimeout(resizeHandler, 1000);

        // adding a message handler to textarea
        var wrapper = textArea.mon('keypress', this._handleTextAreaInput.bind(this, tabJID));
        this._wrappedFns[tabId].push(YAHOO.ext.EventManager.removeListener.createDelegate(
                YAHOO.ext.EventManager, ["keypress", textArea, wrapper]));

        wrapper = textArea.mon('focus', this._handleTextAreaFocus.bind(this, tabJID));
        this._wrappedFns[tabId].push(YAHOO.ext.EventManager.removeListener.createDelegate(
                YAHOO.ext.EventManager, ["focus", textArea, wrapper]));

        wrapper = textArea.mon('blur', function() {
            jive.spank.chat.ChatWindow.focusedJID = '';
        });

        this._wrappedFns[tabId].push(YAHOO.ext.EventManager.removeListener.createDelegate(
                YAHOO.ext.EventManager, ["blur", textArea, wrapper]));

        return innerLayout;
    },
    _handleTextAreaFocus: function(focusedTextAreaJID, evt) {
        this.clearNotification(focusedTextAreaJID);
        jive.spank.chat.ChatWindow.focusedJID = focusedTextAreaJID;
    },
    _handleTextAreaInput: function(tabJID, evt) {
        var textArea = evt.getTarget();
        var input = false;
        var message = textArea.value;

        if (evt.getKey() == 13) {
            if (!evt.ctrlKey && !evt.shiftKey && message != "") {
                this.fireEvent("message", tabJID, message);
                window.setTimeout(function() {
                    this.value = "";
                }.bind(textArea), 10);
            }

            if (!evt.ctrlKey && !evt.shiftKey) {
                evt.preventDefault();
            }
            else {
                input = true;
            }
        }
        else {
            if (evt.getKey() == 9) {
                //tab completion of nicks.
                this.completeNick(tabJID, message, textArea);
                evt.preventDefault();
            }
            input = true;
        }

        if(input) {
            this.fireEvent("input", tabJID);
        }
    },

    _doMucControls: function(tabId, room, contactListFunction, layout) {
        jive.spank.chat.Template.muc_controls.append(tabId + '-sidebarheader',
        {jid: room.jid});
        jive.spank.chat.Template.mucinvitemenu.append(document.body,
        {jid: room.jid});
		
		layout.add('north', new YAHOO.ext.ContentPanel(tabId + '-sidebarheader'));

        var mucInviteContainer = getEl(room.jid + '-container');
        mucInviteContainer.hide();
        this._wrappedFns[tabId].push(mucInviteContainer.remove.createDelegate(mucInviteContainer));

        var mucAutoComp = new jive.spank.AutoComplete(room.jid + '-autocomp',
                room.jid + '-autocomp-menu',
                new YAHOO.widget.DS_JSFunction(contactListFunction),
        {typeAhead: true, autoHighlight: true, minQueryLength: 0, maxResultsDisplayed: 20}
                );
        mucAutoComp.formatResult = function(oResultItem, sQuery) {
            return "<div class='roster-contact-" + oResultItem[2] + "'>" + oResultItem[0] + "</div>";
        };

        var jid = room.jid;
        var self = this;
        mucAutoComp.itemSelectEvent.subscribe(function(type, args) {
            self.fireEvent('mucinvitation', self, args[2][1].toString(), jid);
            getEl(jid + '-autocomp').dom.blur();
        });

        var inviteControl = getEl(jid + '-control');
		var menuEl = getEl(room.jid + '-autocomp-menu')
        inviteControl.mon('click', function(chatWindow, inviteContainerElement, mucAutoComplete, contactListFunction, menuEl) {
            chatWindow.invitee = '';

            var entry = inviteContainerElement.getChildrenByTagName('input')[0];
            entry.dom.value = '';
            inviteContainerElement.alignTo(this, 'bl');
			menuEl.setWidth(192);
            entry.setWidth(192);
            inviteContainerElement.show();
            inviteContainerElement.setStyle('z-index', self.dialog.lastZIndex + 1);
            entry.dom.focus();

            mucAutoComp._populateList('', contactListFunction(), mucAutoComp);

            inviteContainerElement.repaint();
        }.createDelegate(inviteControl, [this, getEl(room.jid + '-container'), mucAutoComp,
                contactListFunction, menuEl]));
        // realign menu when window moves? when pane resizes?

        var autoComplete = getEl(jid + '-autocomp');
        autoComplete.mon('keypress', function(autoComplete, jid, contactListFunction,
                                              evt) {
            if (evt.getKey() == 13) {
                evt.preventDefault();
                var contact = contactListFunction().detect(function(text, value) {
                    return text == value[0];
                }.bind(this, autoComplete.dom.value));

                if (!contact) {
                    contact = autoComplete.dom.value;
                }
                else {
                    contact = contact[1].toString();
                }
                this.fireEvent('mucinvitation', this, contact, jid);
                window.setTimeout("getEl('" + jid + "-container').hide();", 200);
                getEl('jive-tab-' + jid + '-text').dom.focus();
            }
        }.bind(this, autoComplete, jid, contactListFunction));
        autoComplete.addListener('blur', function(jid) {
            window.setTimeout("getEl('" + jid + "-container').hide();", 200);
            getEl('jive-tab-' + jid + '-text').dom.focus();
        }.bind(this, jid));

        // aaaaand briefly by comparison, the change-nick button
        getEl(jid + '-changenick').addListener('click', function() {
            var confObj = self.dialog.getLayout().getRegion('south') ?
                          {x: self.dialog.el.getX() + 125, y: self.dialog.el.getY() + 140}
                    : null;
            self.showChangeNick(room, confObj);
        });
		return layout;
    },

	showChangeNick: function(roomObj, confObj) {
        var self = this;
        confObj = $H(confObj).merge({
            title: "Change Nickname",
            width: 285, height: 105,
            templateKeys: {nick: ''}
        });
        var renamer = new jive.spank.chat.Dialog(self,
                jive.spank.chat.Template.rename,
                confObj
                );
        renamer.dialog.show();
        var doChange = function(jid, dialog) {
            this.fireEvent("changenameinmuc", this, jid, $F(dialog.id + '-name'));
            dialog.dialog.hide();
        }.bind(this, roomObj.jid.toString(), renamer);
        getEl(renamer.id + '-name').mon("keypress",
                doChange.createInterceptor(function(evt) {
                    return evt.getKey() == 13;
                }));
        getEl(renamer.id + '-rename').addListener("click", doChange);
        getEl(renamer.id + '-name').dom.focus();
    },

    showMUCPassword: function(roomObj, confObj, passwordCallback) {
        confObj = $H(confObj).merge({
            title: "Enter the password for '" + roomObj.name + "'",
            width: 285, height: 105
        });
        var keymasta = new jive.spank.chat.Dialog(this,
                jive.spank.chat.Template.mucpassword,
                confObj
                );
        keymasta.dialog.show();

        var self = this;
        var called = false;
        var doSecret = function() {
            var password = $F(keymasta.id + '-passwd');
            passwordCallback(password);
            called = true;
            keymasta.dialog.hide();
        };
        keymasta.dialog.addListener('hide', function() {
            if (!called) {
                passwordCallback(null);
            }
        });
        getEl(keymasta.id + '-passwd').mon("keypress",
                doSecret.createInterceptor(function(evt) {
                    return evt.getKey() == 13;
                }));
        getEl(keymasta.id + '-sendsecret').addListener("click", doSecret);
        getEl(keymasta.id + '-passwd').dom.focus();
    },

/**
 * Final bit of the message chain: adds HTML, sorts out time, and scrolls it
 * into view.
 *
 * @param {String} jid valid jid that links the message to tab in this window.
 * @param {String} from contact name to display.
 * @param {Object/HTMLElement} msgObj a conf obj with body, isLocal (bool) and time, or a prepared DOM element
 * @param {Function} callback optional func to call once we've drawn the DOM element
 */
    addMessage: function(jid, from, msgObj, callback) {
    	this.completionState = {index : 0, completed : null, original : null}; //clear tab complete

        var msgframe = getEl("jive-tab-" + jid + "-history");

		from = from.toLowerCase();

        if (msgObj.body) {
            var timecls = '';
            if (msgObj.time) {
                timecls = 'offline';
            }
            else {
                var dateobj = new Date();
                msgObj.time = dateobj.toLocaleTimeString();
            }
            var type = (msgObj.isLocal ? "user" : "contact");

            var mentioned = (msgObj.mentioned ? "mentioned" : "");

			var consecutive = ((this.previousMessageInfo != null && from == this.previousMessageInfo.from && jid == this.previousMessageInfo.jid && type == this.previousMessageInfo.type) ? "consecutive" : "");
 			this.previousMessageInfo = {jid:(jid.toBareJID != null ? jid.toBareJID() : jid), from:from, msg:msgObj, time: msgObj.time , type: type};

			if(msgObj.body.indexOf("/me") == 0) {
				msgObj.action = "action";
				msgObj.body = " * " + from + msgObj.body.replace("/me", "");
			}
			var body = jive.spank.chat.Filter.applyAll(msgObj.body);
            var newElm = jive.spank.chat.Template.message.append(msgframe.id,
            {from: from, message: body, type: type, mentioned: mentioned, consecutive: consecutive, action: msgObj.action, time: msgObj.time, msgclass: timecls, color: uniqueColorForString(from)});
        }
        else {
            msgframe.dom.appendChild(msgObj.el);
            msgObj.callback(this);
        }

        this._scrollMessageHistory(msgframe);

        var testjid = jive.spank.chat.ChatWindow.focusedJID;
        if (testjid != jid) {
            this.addNotification(jid);
        }
    },
    addStatusMessage: function(jid, message, customClass) {
    	delete this.previousMessageInfo;
        var msgframe = getEl("jive-tab-" + jid + "-history");

        var newElm = jive.spank.chat.Template.statusMessage.append(msgframe.id, {message: message, customClass: customClass});

        this._scrollMessageHistory(msgframe);
    },

    _scrollMessageHistory: function(histElm) {
    	var historyBox = histElm.dom.parentNode;
    	var historyHeight = histElm.getHeight();
    	var historyBoxHeight = historyBox.clientHeight;
    	if( historyHeight - (historyBox.scrollTop + historyBoxHeight) < 100 || historyHeight < historyBoxHeight ) {
			historyBox.scrollTop = historyHeight - historyBoxHeight;
        }
    },
/**
 * Notifies the user that the tab needs their attention.
 */
    addNotification: function(jid) {
        var thistab = this.getTabByJID(jid);

        if (typeof this.newMessages[jid] == 'undefined') {
            this.newMessages[jid] = 1;
        }
        else {
            this.newMessages[jid]++;
        }

		if(thistab && thistab.textEl)
			thistab.textEl.addClass('jive-notify');

        // make sure there is an interval for this window
        if (this.notificationInterval && !this.notificationInterval[jid]) {
            var bodyId = this.bodyId;
            this.notificationInterval = window.setInterval(function() {
                getEls('#' + bodyId + ' span.jive-notify').toggleClass('flashNotify');
            }, 1000);
        }
        else {
            getEls('#' + this.bodyId + ' span.jive-notify').addClass('flashNotify');
        }
        // and the browser window too
        jive.spank.notifier.doTitleNotify();

		if(thistab && thistab.text) {
			if (/ \(\d+\)$/.test(thistab.text)) {
				thistab.setText(thistab.text.replace(/ \(\d+\)$/, ''));
			}
			thistab.setText(thistab.text + " (" + this.newMessages[jid] + ")");
		}
    },

    completionState : {
        index : 0,
        completed : null,
        original : null
    },

    completeNick : function (jid, messageBody, textArea) {
        var roster = this.getTabByJID(jid).roster;
        if(!roster) return;

        var occupants = roster.groups.Participants.contacts;
        var nick;
        var state = this.completionState;
        var loopCounter = 0; //we're treating the contact list as a circular buffer, so we want to break out of the loop as soon as we've been through the whole thing with no hits
        if(state.original == null || state.completed != messageBody)
            state.original = messageBody;
        for(var i = state.index; i < occupants.length && loopCounter < occupants.length; i++)
        {
            loopCounter++;
            state.index = i + 1;
            nick = occupants[i].name;
            if(state.index >= occupants.length) {
                state.index = 0;
                i = 0;
            }
            if(nick.indexOf(state.original) == 0 && state.original.length < nick.length)
            {
                state.completed = nick + ": ";
                textArea.dom.value = state.completed;
                textArea.dom.selectionStart = textArea.dom.value.length;
                textArea.dom.selectionEnd = textArea.dom.value.length;
                return;
            }
        }
    },

/**
 * Clears any notifications currently operating on the tab for a particular JID
 *
 * @param {String} jid the jid to clear the notifications for.
 */
    clearNotification: function(jid) {
        var thetab = this.getTabByJID(jid);
        if (thetab && thetab.textEl) {
            thetab.textEl.removeClass('jive-notify').removeClass('flashNotify');
            thetab.setText(thetab.text.replace(/ \(\d+\)$/, ''));
        }
        delete this.newMessages[jid];
        if (this.notificationInterval && this.notificationInterval[jid]
                && this.newMessages.properties && this.newMessages.properties.length == 0) {
            window.clearInterval(this.notificationInterval[jid]);
            this.notificationInterval[jid] = null;
        }
        jive.spank.notifier.doTitleNotify();
    },
/**
 * Clears all notifications operating on this window.
 */
    clearAllNotifications: function() {
        var blinkers = getEls('#' + this.bodyId + ' span.jive-notify');
        blinkers.removeClass('jive-notify');
        // doesn't fix tab texts on the assumption that we call this when we close
        window.clearInterval(this.notificationInterval);
        this.notificationInterval = null;
        blinkers.removeClass('flashNotify');
        this.newMessages = {};
        jive.spank.notifier.doTitleNotify();
    },
    getActiveTabElement: function() {
        var thetab = this.getTabs() ? this.getTabs().active : this._tabIfSingleTab();
        return getEl(thetab.id);
    },
/**
 * Returns all of the tabs of this chat window.
 */
    getTabs: function() {
        var regions = this.dialog.getLayout().regions;
        return regions["center"].getTabs();
    },

/**
 * Takes a JID and returns the tab for the jid.
 *
 * @param {String} jid the jid for which to return the tab
 */
    getTabByJID: function(jid) {
        var guys = this.getTabs();
        if (guys != null) {
            var tabb = guys.items['jive-tab-' + jid + '-layout'];
			if(!tabb) {
                tabb = guys.items['jive-tab-' + jid + '-spinner']
            }
            return (typeof tabb == 'undefined') ? null : tabb;
        }
        else {
            return this._tabIfSingleTab();
        }
    },

    _tabIfSingleTab: function() {
        return this.dialog.getLayout().regions["center"].panels.items[0];
    },

/**
 * Removes all of the tabs from this window.
 */
    removeAllTabs: function() {
        //return;
        var tabs = this.getTabs();
        if (!tabs) {
            return;
        }
        for (var i = tabs.getCount() - 1; i >= 0; i--) {
            tabs.getTab(i).closeClick();
        }
        delete this.tabs;
        this.tabs = {};
    },

    destroy: function() {
        this.clearAllNotifications();
        jive.spank.chat.ChatWindow.superclass.destroy.call(this);
        delete this.tabs;
    },

    hide: function() {
        this.clearAllNotifications();

        jive.spank.chat.ChatWindow.superclass.hide.call(this);
    },

/**
 * Creates tab in this window for the specified contact or JID.
 *
 * @param {jive.spank.chat.Contact/String} either a Contact object (or fakey
 * version with name and jid properties) or a jid.
 */
    getContactTab: function(contactObj, focus) {
        if (typeof contactObj == 'string') {
            // we were just passed a jid, compensate
            var jid = contactObj;
            contactObj = {name: jid, jid: jid};
        }

        var thetabs = this.getTabs();
        var convo;
        if (thetabs) {
            convo = thetabs.getTab("jive-tab-" + contactObj.jid + "-layout");
        }
        if (typeof convo == 'undefined') {
            this.addTab(contactObj);
        }
        if (focus) {
            this.focusContactTab(contactObj);
        }
    },

    focusContactTab: function (contactObj) {
        var thetabs = this.getTabs();
        thetabs.activate("jive-tab-" + contactObj.jid + "-layout");
        var textArea = getEl("jive-tab-" + contactObj.jid + "-text");
        textArea.dom.focus();
    },

    prepUserPane: function() {
        // assumes presence of an east pane on the main dialog's layout, which in turn contains at least one pane! beware
        
        if(window.showUpperStuff == "show") {
		var layout = this.dialog.getLayout().getRegion("east").getPanel(0).getLayout();
		jive.spank.chat.Template.userpane.append(this.bodyId + '-toppane', {id: this.bodyId});
		this.dialog.beginUpdate();
		var header = new YAHOO.ext.ContentPanel(this.bodyId + '-toppane');
		layout.add('north', header);
		header.getEl().dom.parentNode.className += " jive-user-controls";
		this.dialog.endUpdate();
        }
    },

	//mucManager is optional
    finalizeUserPane: function(uname, mucManager) {
    
            if(window.showUpperStuff == "show") {

		jive.spank.chat.Template.userpane_loggedin.append(this.bodyId + '-message', {id: this.bodyId, uname: uname, presence: "available"});

			//this lets us style the username field based on whether the user has clicked on it to edit.
			var input = getEl(this.bodyId + '-uname');
			var editButton = getEl(this.bodyId + '-uname-edit');

			var change = function(evt) {
		if( evt == undefined || evt.keyCode == 13 ) {
			var jidFromId = this.tabId.split("-")[2];
					var nameEl = getEl(this.bodyId + '-uname');
					nameEl.replaceClass("jive-muc-username-active", "jive-muc-username");
			this.fireEvent("changenameinmuc", this, this.tabs[jidFromId].room.jid, nameEl.dom.value);
			this.getActiveTabElement().dom.focus();
			getEl(this.bodyId + '-uname-edit').dom.innerHTML = "change";
			if(evt != undefined)
						evt.preventDefault();
            	}
        }.bind(this);
		
		var toggleEditing = function () {
			if(this.dom.className.indexOf("jive-muc-username-active") > -1) {
				change();
			} else {
				this.replaceClass("jive-muc-username", "jive-muc-username-active");
				this.dom.focus();
			}
		}.bind(input);
		
		editButton.on('click', function() {this.dom.innerHTML = (this.dom.innerHTML == "change" ? "ok" : "change"); toggleEditing(); }.bind(editButton));
		input.on('keydown', change);
		
		var update = function(window, roomJID, newName) {
			this.dom.value = newName;
		}.bind(input);
		this.addListener("changenameinmuc", update);
		
		var tt = new YAHOO.widget.Tooltip("nick-edit-tooltip", {
											context: editButton.dom,
											showDelay: 500,
											zIndex: 15000 });
											
		tt.setHeader(""); 
		tt.setBody("<p>Click here to change your nickname</p>"); 
		tt.setFooter(""); 
		
		if(mucManager) {
			//Presence change control
			var presenceControl = getEl(this.bodyId + '-presencecontrol');
			var toggleAvailable = function() {
				var newPres = presenceControl.hasClass("available") ? "away" : "available";
				var oldPres = newPres == "available" ? "away" : "available";
				presenceControl.replaceClass(oldPres, newPres);
				presenceControl.dom.innerHTML = newPres;
				var jidFromId = this.tabId.split("-")[2];
				var pres = new XMPP.Presence();
				pres.setMode(newPres);
				pres.setTo(new XMPP.JID(jidFromId + "/" + getEl(this.bodyId + '-uname').dom.value));
				mucManager.getRoom(jidFromId).presenceManager.sendPresence(pres);
			}.bind(this);
						
			presenceControl.on('click', toggleAvailable);
			var tt1 = new YAHOO.widget.Tooltip("presence-control-tooltip", {
												context: presenceControl.dom,
												showDelay: 500,
												zIndex: 15000 });
			tt1.setHeader(""); 
			tt1.setBody("<p>Click here to change your status</p>"); 
			tt1.setFooter(""); 
		}
		}
    },

/**
 * Sets the subject line on MUC tabs. JID is optional in embedded-group-chat situations.
 *
 * @param {String} subject the subject line to display
 * @param {String} roomJid optional JID for the MUC tab in question
 */
    setSubject: function(subject, roomJid) {
        var subjElm = getEl((this.tabId ? this.tabId : "jive-tab-" + roomJid) + '-subject');
        if (subjElm && subjElm.dom) {
            subjElm.dom.innerHTML = subject;
        }
    }

});

jive.spank.chat.ChatWindow.getWindow = function(windowId) {
    return jive.spank.chat.ChatWindow.currentWindow[windowId];
}

jive.spank.chat.ChatWindow.createWindow = function() {
    var component = spank.loadComponent("chat");
    jive.spank.chat.ChatWindow.currentWindow[component.id] = component;
    component.dialog.addListener("hide", function() {
        delete jive.spank.chat.ChatWindow.currentWindow[component.id];
    });
    return component;
}

jive.spank.chat.ChatWindow.destroyWindow = function(windowId) 
{
    if (jive.spank.chat.ChatWindow.currentWindow[windowId]) {
        jive.spank.chat.ChatWindow.currentWindow[windowId].hide();
        delete jive.spank.chat.ChatWindow.currentWindow[windowId];
    }
}

jive.spank.chat.ChatWindow.tabConfObject = {
    north: {
        initialSize: 65
    },
    south: {
        split: true,
        initialSize: 50,
        minSize: 50,
        maxSize: 200,
        autoScroll: false,
        collapsible: true
    },
    center: {
        autoScroll: true
    }
};
jive.spank.chat.ChatWindow.chooseMUCConfObject = {
    north: {
        initialSize: 50
    },
    center: {
        autoScroll: false
    }
};

jive.spank.chat.ChatWindow.mucSidebarConfObject = {
    center: {
        autoScroll: false,
        collapsible: false
    },
	north: {
		initialSize: 42
	}
};

jive.spank.chat.ChatWindow.mucConfObject = {
    center: {
        autoScroll: false,
        collapsible: false
    },
	east: {
		initialSize: 145,
		split: true,
        autoScroll: false,
        collapsible: true
	}
};

jive.spank.chat.ChatWindow.currentWindow = {};
jive.spank.chat.ChatWindow.focusedJID = '';


jive.spank.roster = {};

jive.spank.roster.RosterWindow = function(id, attributes) {
    var width = attributes["width"] ? attributes["width"] : 210;
    var height = attributes["height"] ?
                 attributes["height"] :
                 YAHOO.util.Dom.getViewportHeight() - 65;
    //var x = attributes["x"] ? attributes["x"] : YAHOO.util.Dom.getViewportWidth() - 230;
    var x = attributes["x"] ? attributes["x"] : 0;
    var y = attributes["y"] ? attributes["y"] : 60;
    var resizable = attributes["resizable"] != "false";
    var draggable = attributes["draggable"] != "false";
    var closable = attributes["closable"] != "false";

    this.roster = null;
    // set in setRoster
    this.groups = null;
    // ditto

    this.controls = {};
    this.controlCount = 0;

    var conf = {
        modal: false,
        width: width,
        height: height,
        resizable: false,
        draggable: false,
        proxyDrag: false,
        shadow: false,
        minWidth: 200,
        minHeight: 150,
        x: x,
        y: y,
        closable: true,
        shim: false,
        north: {
            initialSize: 52,
            autoScroll: false
        },
        center: {
            closeOnTab: true,
            alwaysShowTabs: false,
            autoTabs: true
        }
    };
    this.events = {
    /**
     * @event changestatus
     * User picks a status from the menu or from the Set Status Msg dialog.
     * @param {jive.spank.roster.Roster} roster this roster window
     * @param {String} mode string representing the mode: 'chat', 'available', 'away', 'dnd'
     * @param {String} status optional status message
     */
        'changestatus': true,
    /**
     * @event setstatusmsgrequest
     * Request for the Set Status Msg dialog.
     * @param {jive.spank.roster.RosterWindow} roster this roster window
     */
        'setstatusmsgrequest': true,
    /**
     * @event addcontact
     * Hey, the user would like to add somebody.
     * @param {jive.spank.roster.RosterWindow} roster this roster window
     * @param {String} jid supposedly a valid JID!
     * @param {String} name the name by which the user wishes to remember this JID
     * @param {String} group the (uncleaned, unmolested) name of a group to add to
     */
        'addcontact': true,
    /**
     * @event acceptsubscription
     * User has decided to let someone add them.
     * @param {jive.spank.roster.RosterWindow} roster this roster window
     * @param {Boolean} addReciprocal true if we should add them as well
     * @param {String} jid JID of the subscriber
     * @param {String} nickname the nickname by which to add the subscriber
     * @param {String} group the (uncleaned, unmolested) name of the group to add to
     */
        'acceptsubscription': true,
        'denysubscription': true,
    /**
     * @event renamecontact
     * Hey, the user would like to rename somebody.
     * @param {jive.spank.roster.RosterWindow} roster this roster window
     * @param {jive.spank.roster.Contact} contact a contact object
     * @param {String} name the new name to change to
     */
        'renamecontact': true,
    /**
     * @event renamegroup
     * Hey, the user would like to rename an entire group.
     * @param {jive.spank.roster.RosterWindow} roster this roster window
     * @param {jive.spank.roster.RosterGroup} group a group object
     * @param {String} name the new name to change to
     */
        'renamegroup': true,
    /**
     * @event removecontact
     * Remove this contact from the roster pls
     * @param {jive.spank.roster.RosterWindow} roster this roster window
     * @param {jive.spank.roster.Contact} contact a contact object
     */
        'removecontact': true,
    /**
     * @event removegroup
     * Remove this group and ALL of its contacts
     * @param {jive.spank.roster.RosterWindow} roster this roster window
     * @param {jive.spank.roster.RosterGroup} group a group object
     */
        'removegroup': true,
        'close': true
    };
    jive.spank.roster.RosterWindow.superclass.constructor.call(this, id, "SparkWebChat", conf);

    var layout = this.dialog.getLayout();
    this.dialog.beginUpdate();
    layout.add('north', new YAHOO.ext.ContentPanel(this.bodyId + '-toppane'));
    this.dialog.endUpdate();

    this.dialog.close.removeAllListeners();
/*    
    this.dialog.close.addListener('click', function() {
        if (confirm("Are you sure you want to close the connection?\n('OK' to logout, 'Cancel' to stay connected.)")) {
            this.dialog.hide();
            this.fireEvent('close', this);
        }
    }.bind(this));
*/    
    
};

YAHOO.extend(jive.spank.roster.RosterWindow, jive.spank.Window, {
    needsUpdate: false,
    addTab: function(title) {
        var tabId = YAHOO.util.Dom.generateId();
        jive.spank.chat.Template.rostertab.append(this.bodyId, {tabId: tabId});
        var layout = this.dialog.getLayout();

        this.dialog.beginUpdate();

        var innerLayout = new YAHOO.ext.BorderLayout(tabId + "-layout", {
            north: {
                split: false,
                initialSize: 31,
                autoScroll: false
            },
            center: {
                autoScroll: true
            }
        });

        innerLayout.add('center', new YAHOO.ext.ContentPanel(tabId + '-resources'));
        jive.spank.chat.Template.roster.append(tabId + '-resources',
        {rosterId: 'jive-roster', groups: ''});
        innerLayout.add('north', new YAHOO.ext.ContentPanel(tabId + '-user'));
        jive.spank.chat.Template.control_panel.append(tabId + '-user',
        {tabId: tabId});

        this.controlPanel = innerLayout.regions['north'];
        this.controlPanel.hide();

        layout.add('center', new YAHOO.ext.NestedLayoutPanel(innerLayout, {title: title}));
        this.dialog.endUpdate();

        this.tabs[title] = tabId;
    },

    _prepUserStatusPanel: function(username, userStatus) {
        var elm = getEl(this.bodyId + '-toppane');
        jive.spank.chat.Template.status_panel.append(elm.id, {
            bodyId: this.bodyId,
            username: username,
            status: userStatus,
            statusName: userStatus.toLowerCase()
        });

        var statusControl = getEl(this.bodyId + '-statusmenu-ctrl');
        statusControl.addListener('click', function(statusControl, e) {
            var statMenu;
            if(!this.statusMenu) {
                this.statusMenu = this._createStatusMenu();
            }
            statMenu = this.statusMenu;
            getEl(statMenu.element).alignTo(statusControl, 'bl');
            statMenu.element.style.zIndex = this.dialog.lastZIndex + 1;
            statMenu.show();
            Event.stop(e);
        }.bind(this, statusControl));

        // dragging windows doesn't hide the menu! let's fix that
        var hideStatus = function() {
            if (this.statusMenu) {
                this.statusMenu.hide();
            }
        }.bind(this);
        this.dialog.header.addListener('click', hideStatus);
        for (var chawin in jive.spank.chat.ChatWindow.currentWindow) {
            jive.spank.chat.ChatWindow.currentWindow[chawin].dialog.header
                    .addListener('click', hideStatus);
            // will only work on windows open at the time... hmm
            // i'll live with that
        }
    },
    _createStatusMenu: function() {
        var statusMenu = new YAHOO.widget.Menu("jive-statusmenu");
        statusMenu.addItems([
                [
                {text: "Free to Chat"},
                {text: "Available"},
                {text: "On The Road"},
                {text: "Away"},
                {text: "On Phone"},
                {text: "Do Not Disturb"}
                        ]
                ]);
        statusMenu.render(document.body);

        var self = this;
        var fireChangeStatus = function(eventType, eventArr, statusStr) {
            this.fireEvent("changestatus", this, statusStr);
        };

        var menuItem;
        var statii = ['chat','available','onroad','away','onphone','dnd'];
        for (var i = 0; i < statii.length; i++) {
            menuItem = statusMenu.getItem(i);
            menuItem.element.className += ' roster-contact-' + statii[i];
            menuItem.clickEvent.subscribe(fireChangeStatus, statii[i], this);
        }
        return statusMenu;
    },

    setUserInfo: function(user, userMode) {
        // looking for the keys 'name' and either 'status' or 'mode'.
        // that's if user is an obj.
        var userName;
        if (arguments.length > 1) {
            userName = user;
        }
        else {
            userName = user.name;
            userMode = (user.status ? user.status : user.mode);
        }
        this.dialog.setTitle("<h1>My Contacts</h1>");
        this._prepUserStatusPanel(userName, userMode);
    },

    addGroup: function(groupName, groupObj) {
        this.roster.addGroup(groupName, groupObj);
    },

    addControl: function(ctrlTitle, confObj) {
        // this method continues to assume one rosterwindow tab named 'Contacts'

        // make control obj
        this.controls[ctrlTitle] = jive.spank.chat.Control.add(
                this.tabs['Contacts'] + '-controls',
                ctrlTitle,
                confObj
                );

        this.controlCount++;

        if (!this.controlPanel.isVisible()) {
            this.controlPanel.show();
        }

        return this.controls[ctrlTitle];
    },

    removeControl: function(ctrlTitle) {
        if (this.controls[ctrlTitle]) {
            this.controls[ctrlTitle].remove();
            delete this.controls[ctrlTitle];
        }
        this.controlCount--;
    },

    setRoster: function(rosterObj) {
        if (rosterObj == null) {
            rosterObj = this.fakeRosterStruct;
        }

        this.roster = new jive.spank.roster.Roster('jive-roster', true);
        this.groups = this.roster.groups;

        this.roster.setRoster(rosterObj);
        this.render();

        this.roster.addListener('offlinemoved', function() {
            if (!this.isUpdating) {
                this.render(true);
            }
            else {
                this.needsUpdate = true;
            }
        }, this, 1);
    },

/**
 * Returns contact obj for the currently selected contact.
 */
    getSelectedUser: function() {
        return this.roster.getSelectedUser();
    },

/**
 * Less elegant but more flexible way of finding contact objects: feed it the LI's ID.
 */
    getContactFromID: function(idStr) {
        var parts = idStr.split('-');
        var cJid = parts.slice(2, parts.length - 1).join('');
        // in case of jids with dashes
        return jive.spank.roster.Contact.find(this, cJid, parts[parts.length - 1]);
    },

/**
 * Draws HTML once the groups property is populated. Rewrites roster HTML entirely.
 */
    render: function(forceNow) {
        var tabId = this.tabs["Contacts"];

        this.roster.render();
        this.needsUpdate = false;

        // now that they exist:
        this.dialog.addListener("show", this.finishDisplay, this, true);
        if (forceNow) {
            this.finishDisplay();
        }
    },

    finishDisplay: function() {
        this.roster.sortGroups();
        this.roster._enableOfflineBehaviors();
        this.roster._enableBehaviors();
    },

    addContact: function(contact, groupName, group) {
        this.roster.addContact(contact, groupName, group);
        this.render(true);
    },

/**
 * Deletes all traces of specified contact
 */
    removeContact: function(jid) {
        this.roster.removeContact(jid);
    },

    changeUserStatus: function(newMode, newStatus) {
        var menu = getEl(this.bodyId + '-statusmenu-ctrl');
        var fullModeStrs = {
            chat: "Free to Chat",
            available: "Available",
            onroad: "On Road",
            away: "Away",
            onphone: "On Phone",
            dnd: "Do Not Disturb"
        };

        menu.dom.className = menu.dom.className.replace(
                /roster-contact-([^ ]*)/, 'roster-contact-' + newMode);
        menu.getChildrenByTagName('span')[0].dom.innerHTML = (
                newStatus != null ? newStatus : fullModeStrs[newMode]);
    },

    changeContactStatus: function(jid, newMode, newStatus) {
        this.roster.changeContactStatus(jid, newMode, newStatus);
    },

    getContactStatus: function(jid) {
        return this.roster.getContactStatus(jid);
    },

    showAddGroup: function() {
        var self = this;
        var addg = new jive.spank.chat.Dialog(self,
                jive.spank.chat.Template.add_group,
        {title: "Add Group", width: 280, height: 140, yOffset: 125}
                );
        addg.dialog.show();

        // wire up the go button
        getEl(addg.id + '-creategroup').addListener('click', function() {
            // submit info
            self.fireEvent('addgroup', self, $F(addg.id + '-addgroupname'));
            addg.dialog.hide();
        });
    },

    showAddContact: function() {
        var self = this;
        var addc = new jive.spank.chat.Dialog(self,
                jive.spank.chat.Template.add_contact,
        {title: "Add Contact", width: 280, height: 155}
                );
        addc.dialog.show();

        this._autocompGroups(addc, '-addcontact-group');

        $(addc.id + '-addusername').focus();

        // finally, wire up the buttons
        getEl(addc.id + '-createcontact').addListener('click', function() {
            // submit info
            self.fireEvent('addcontact', self,
                    $F(addc.id + '-addusername'),
                    $F(addc.id + '-addnickname'),
                    $F(addc.id + '-addcontact-group')
                    );
            addc.dialog.hide();
        });
    },

    showSubscriptionRequest: function(subscriberJid, subscriberNick) {
        var self = this;
        var subr = new jive.spank.chat.Dialog(self,
                jive.spank.chat.Template.sub_request,
        {title: "Allow " + (subscriberNick != '' ? subscriberNick : subscriberJid) + " to add you?",
            width: 440, height: 220,
            templateKeys: {jid: subscriberJid, nick: subscriberNick} }
                );
        subr.dialog.show();

        this._autocompGroups(subr, '-subrequest-group');

        // wire up the actions
        getEl(subr.id + '-add').addListener('click', function() {
            // toggle style on labels
            getEls('#' + subr.id + ' label').toggleClass('disabled');
            getEl(subr.id + '-jid').toggleClass('disabled');
            // toggle enabled on fields
            getEl(subr.id + '-nick').dom.disabled = getEl(subr.id + '-subrequest-group').dom.disabled =
                                                    !getEl(subr.id + '-add').dom.checked;
        });
        getEl(subr.id + '-acceptsubrequest').addListener('click', function() {
            // submit info
            self.fireEvent('acceptsubscription', self,
                    $F(subr.id + '-add'),
                    subscriberJid,
                    $F(subr.id + '-nick'),
                    $F(subr.id + '-subrequest-group')
                    );
            subr.dialog.hide();
        });
        getEl(subr.id + '-denysubrequest').addListener('click', function() {
            // submit info
            self.fireEvent('denysubscription', self,
                    $F(subr.id + '-add'),
                    subscriberJid,
                    $F(subr.id + '-nick'),
                    $F(subr.id + '-subrequest-group')
                    );
            subr.dialog.hide();
        });
    },

    showRename: function(contactOrGrpObj) {
        if (contactOrGrpObj == null) {
            contactOrGrpObj = this.contactMenu.clickedContact;
        }

        var renamer = new jive.spank.chat.Dialog(self,
                jive.spank.chat.Template.rename,
        {title: "Renaming '" + contactOrGrpObj.name + "'",
            width: 250, height: 115,
            templateKeys: {nick: contactOrGrpObj.name} }
                );
        renamer.dialog.show();

        var self = this;
        var doRename = function() {
            var eventtofire = (typeof contactOrGrpObj.jid != 'undefined') ? 'renamecontact' : 'renamegroup';
            self.fireEvent(eventtofire, self, contactOrGrpObj, $F(renamer.id + '-name'));
            getEl(renamer.id + '-rename').removeAllListeners();
            renamer.dialog.hide();
        };
        getEl(renamer.id + '-name').mon("keypress",
                doRename.createInterceptor(function(evt) {
                    return evt.getKey() == 13;
                }));
        getEl(renamer.id + '-rename').addListener("click", doRename);
    },

    showRemove: function(contactObj) {
        // actually don't show anything
        this.fireEvent("removecontact", this, contactObj.jid.toString());
    },

    showGroupRename: function(grpGetterFunc) {
        var grpObj = grpGetterFunc();
        this.showRename(grpObj);
    },
    fetchClickedGroup: function() {
        // this is always the func passed into the above,
        // so we can get the clicked group in realtime rather than at bind time.
        return this.groupMenu.clickedGroup;
    },

    showGroupRemove: function(grpFunc) {
        var grpObj = grpFunc();
        // same deal as above
        var safety = new jive.spank.chat.Dialog(this,
                jive.spank.chat.Template.remove_group,
        {title: "Removing '" + grpObj.name + "'",
            width: 250, height: 100,
            templateKeys: {name: grpObj.name} }
                );
        safety.dialog.show();

        var self = this;
        var doRemove = function() {
            self.fireEvent("removegroup", self, grpObj);
            getEl(safety.id + '-remove').removeAllListeners();
            safety.dialog.hide();
        };
        getEl(safety.id + '-remove').addListener("click", doRemove);
    },

    _autocompGroups: function(dlog, fieldIdSuffix) {
        var fieldId = dlog.id + fieldIdSuffix;
        var conMenuId = fieldId + '-menu';
        var self = this;

        if (getEl(conMenuId) == null) {
            var conMenu = self.addMenuDiv(conMenuId);
            conMenu.className = "groups-ac";
        }

        var groupsFunc = function(query) {
            var justalist = [];
            for (var g in self.roster.groups) {
                justalist.push(g);
            }
            return self._prepareAutocompArray(justalist, query);
        };

        var grpAutoComp = new jive.spank.FlatAutoComplete(fieldId,
                conMenuId,
                new YAHOO.widget.DS_JSFunction(groupsFunc),
        {typeAhead: true, minQueryLength: 0}
                );
        grpAutoComp.formatResult = function(oResultItem, sQuery) {
            return oResultItem;
        };
        grpAutoComp.dataReturnEvent.subscribe(function(type, args) {
            if (args[2].length == 0) { // group results empty
                grpAutoComp.setBody("<div class='empty'>(No matches, will create new)</div>");
            }
            var thelm = getEl(conMenuId);
            thelm.alignTo(getEl(fieldId), 'bl');
            thelm.dom.style.zIndex = dlog.dialog.lastZIndex + 1;
            thelm.show();
        });

        getEl(fieldId).addListener('blur', function() {
            getEl(conMenuId).hide();
        });

        getEls('#' + conMenuId + ' li').mon('mousedown', function(evt) {
            getEl(fieldId).dom.value = evt.getTarget().innerHTML;
        });

        dlog.dialog.addListener('beforehide', function() {
            grpAutoComp.formatResult = Prototype.emptyFunction;
            groupsFunc = Prototype.emptyFunction;
            getEl(conMenuId).removeAllListeners();
            getEl(fieldId).removeAllListeners();
            grpAutoComp.dataReturnEvent.unsubscribeAll();
            getEls('#' + conMenuId + ' li').removeAllListeners();
            getEl(conMenuId).remove();
        });

        return grpAutoComp;
    },

    contactsForAutocomp: function(query) {
        var roster = this.roster;
        var autocompstruct = [];

        for (var g in roster.groups) {
            roster.groups[g].contacts.each(function(ctact) {
                autocompstruct.push([ctact.name, ctact.jid, ctact.status]);
            });
        }
        return this._prepareAutocompArray(autocompstruct, query);
    },

    _prepareAutocompArray: function(results, query) {
        var resultIsArray = typeof results[0] != 'string';

        if (resultIsArray && results.length == 0) {
            return results;
        }

        results = results.sortBy(function(result) {
            if (resultIsArray) {
                return result[0].toLowerCase();
            }
            else {
                return result.toLowerCase();
            }
        });

        if (results.length < 2 || !query || query == '') {
            return results;
        }
        else {
            var frontandback = results.partition(function(result) {
                return (resultIsArray ? result[0].indexOf(query) == 0 : result.indexOf(query) == 0);
            });
            return frontandback[0].concat(frontandback[1]);
        }
    },

    addMenuDiv: function(divId) {
        var menushell = document.createElement('div');
        menushell.id = divId;
        menushell.style.visibility = 'hidden';
        document.body.appendChild(menushell);
        return menushell;
    },
    endUpdate: function() {
        if (this.needsUpdate) {
            this.render(true);
        }
        jive.spank.roster.RosterWindow.superclass.endUpdate.call(this);
    },
    destroy: function() {
        jive.spank.roster.RosterWindow.superclass.destroy.call(this);
    }
});

jive.spank.menu = {};

jive.spank.menu.ContactContext = function(dialog, actions) {
    var id = "contact-conmenu";
    var menushell = document.createElement('div');
    menushell.id = id;
    menushell.style.visibility = 'hidden';
    document.body.appendChild(menushell);

    this.menu = new YAHOO.widget.Menu(id, {lazyLoad: true});

    var items = [];
    actions.each(function(action) {
        items.push({text: action.name});
    });
    this.menu.addItems(items);
    this.menu.render(document.body);

    for (var i = 0; i < items.length; i++) {
        this.menu.getItem(i).clickEvent.subscribe(actions[i].action);
    }
    this.dialog = dialog;
};

jive.spank.menu.ContactContext.prototype = {
    show: function(x, y) {
        this.menu.moveTo(x, y);
        this.menu.element.style.zIndex = this.dialog.dialog.lastZIndex + 1;
        this.menu.show();
    },
    destroy: function() {
        this.menu.destroy();
    }
};

jive.spank.chat.Dialog = function(parentWindow, template, configuration) {
    this.parentWindow = parentWindow;

    var elm = document.createElement('div');
    this.id = elm.id = YAHOO.util.Dom.generateId();
    document.body.appendChild(elm);

    var constrained = !configuration.constrained;
	jive.spank.chat.Dialog.superclass.constructor.call(this, elm.id, {
        title: configuration.title,
        modal: configuration.modal,
        constraintoviewport: constrained,
        width: configuration.width,
        height: configuration.height,
        shadow: true,
        proxyDrag: true,
        resizable: false,
        draggable: true,
        x: configuration.x ? configuration.x : (YAHOO.util.Dom.getViewportWidth() / 2)
                - (configuration.width > 0 ? (configuration.width / 2) : 0),
        y: configuration.y ? configuration.y : (YAHOO.util.Dom.getViewportHeight() / 2)
                - (configuration.height > 0 ? configuration.height / 2 : 0),
        closable: true
    });
    this.dialog = this;

    if (configuration.templateKeys) {
        var templateKeys = configuration.templateKeys;
        templateKeys.id = this.id;
        template.append(this.body.dom, templateKeys);
    }
    else {
        template.append(this.body.dom, {id: this.id});
    }

    getEls('#' + this.id + ' .jive-closedialog').addListener('click', this.hide.bind(this));
    this.addListener('hide', this.destroy.bind(this));
};

YAHOO.extend(jive.spank.chat.Dialog, YAHOO.ext.BasicDialog, {
	destroy: function() {
        YAHOO.ext.EventManager.removeResizeListener(this.adjustViewport, this);
        if(this.tabs){
            this.tabs.destroy(removeEl);
        }
        this.el.update('');
        this.el.remove();
        YAHOO.ext.DialogManager.unregister(this);
        
        this.proxy.remove();
        this.shadow.remove();
        if (this.mask) {
            this.mask.remove();
        }
//		this.purgeListeners();
	}
});

jive.spank.dialog = {};

jive.spank.dialog.StartChat = function(callback) {
    var chatDlog = new jive.spank.chat.Dialog(this,
            jive.spank.chat.Template.start_chat,
    {title: "Start a chat",
        width: 250, height: 105 }
            );
    chatDlog.dialog.show();

    var startChat = function() {
        var thejid = $F(chatDlog.id + '-jid');
        if (thejid.replace(/^\s+|\s+$/g, '') != '') {
            callback(this, {jid: thejid});
            getEl(chatDlog.id + '-startbtn').removeAllListeners();
            chatDlog.dialog.hide();
        }
        else {
            $(chatDlog.id).focus();
        }
    };
    $(chatDlog.id + '-jid').focus();
    getEl(chatDlog.id + '-startbtn').addListener("click", startChat);
};

jive.spank.dialog.CreateConference = function(parentWindow, configuration) {
	if(!configuration) {
		configuration = {};
	}
	configuration = $H(configuration).merge(this._configuration);
	jive.spank.dialog.CreateConference.superclass.constructor.call(this, parentWindow,
		jive.spank.chat.Template.muccreation, configuration);
	this.events = $H(this.events).merge({
		"muccreated": true
	});
	this.addListener("hide", this.onHide.bind(this));
	getEl(this.id + '-private').addListener('click', this._privateCheckboxListener.bind(this));
	getEl(this.id + '-createroom').addListener('click', this._createRoomListener.bind(this));
};

YAHOO.extend(jive.spank.dialog.CreateConference, jive.spank.chat.Dialog, {
	_configuration: {
            title: "Create a Conference",
            width: 285, height: 285
	},
	_createRoomListener: function() {
		var privflag = getEl(this.id + '-private');
		var thingOne = $F(this.id + '-roompw');
		var thingTwo = $F(this.id + '-roomconfirm')
		if (privflag.dom.checked && thingOne != thingTwo) {
			alert("Sorry, your password and confirmation don't match.");
			$(this.id + '-roompw').select();
			return false;
		}
		this.fireEvent("muccreated", this, this.getValues());
	},
	_privateCheckboxListener: function() {
		// toggle style on labels
		getEls('#' + this.id + ' .fieldset label').toggleClass('disabled');
		// toggle enabled on fields
		getEl(this.id + '-roompw').dom.disabled = getEl(this.id + '-roomconfirm').dom.disabled =
			!getEl(this.id + '-private').dom.checked;
	},
	focus: function() {
		getEl(this.id + '-roomname').dom.focus();
	},
	getValues: function() {
		return {
			name: $F(this.id + '-roomname'),
			topic: $F(this.id + '-roomtopic'),
			isPermanent: $(this.id + '-permanent').checked,
			isPrivate: $(this.id + '-private').checked,
			password: $F(this.id + '-roompw'),
			confirmPassword: $F(this.id + '-roomconfirm')
		};
	},
	onHide: function() {
		getEl(this.id + '-private').removeAllListeners();
		getEl(this.id + '-createroom').removeAllListeners();
	}
});

if (window.jive_enable_grid) {
    jive.spank.dialog.UserSearch = function(parentWindow, instructions, searchForm, configuration) {
        this._validateArgs($A(arguments));
        if (!configuration) {
            configuration = {
                showServerSelection: false
            };
        }
        configuration.templateKeys = {
            instructions: instructions
        }
        configuration = $H(configuration).merge(this._configuration);
        var template = this._createTemplate(configuration, searchForm);
        jive.spank.dialog.UserSearch.superclass.constructor.call(this, parentWindow,
                template, configuration);
        this.events = $H(this.events).merge({
            "search": true,
            "selected": true
        });
        this._initListeners();

        this.addListener("hide", this.onHide.bind(this));
        this.addListener("show", this.onShow.bind(this));

        this._buildSearchGrid(this.id + "-search-grid");
        this.onShow();
        this.searchGrid.render();
    };

    YAHOO.extend(jive.spank.dialog.UserSearch, jive.spank.chat.Dialog, {
        _validateArgs: function(args) {
            if(!args[1]) {
                throw Error("A search form must be specified and of type array")
            }
        },
        _configuration : {
            title: "Person Search"
        },
        _initListeners : function() {
            getEl(this.id + "-search-submit").addListener("click",
                    this._handleSearchClick.bind(this));
        },
        _template : [
                '<div id="{id}-person-search" class="dbody personsearch">',
                '<div class="jive-dbody-description">',
                '<h1>Person Search</h1>',
                '<p>{instructions}</p>',
                '</div>',
                '<form id="{id}-search-form">',
                '<div class="search-service">',
                '<fieldset>',
                '<legend>Search Service</legend>',
                '<p><label for="service">Search Service</label>',
                '<select name="selectservice" tabindex="{firstTabIndex}">',
                '</select>',
                '<a href="#">Add Service</a>',
                '</p>',
                '</fieldset>',
                '<!--End search-service--></div>',
                '<div class="">',
                '<fieldset>',
                '<legend>Person Search Form</legend>',
                '{searchform}',
                '<p class="buttons"><input type="submit" id="{id}-search-submit" value=',
                '"Search" tabindex="{lastTabIndex}"/></p>',
                '</fieldset>',
                '</div>',
                '</form>',
                '<div id="{id}-search-grid" class="jive-grid">',
                '</div>',
                '</div>'],
        _createTemplate: function(config, searchForm) {
            var template = this._template.slice(0);
            if(!config["showServerSelection"]) {
                var i = template.indexOf('<div class="search-service">');
                var j = template.indexOf('<!--End search-service--></div>');
                template.splice(i, j - i + 1);
            }
            var index = template.indexOf("{searchform}");
            template.splice(index, 1, searchForm.join(''));
            return new YAHOO.ext.DomHelper.Template(template.join(''));
        },
        _handleSearchClick: function(e) {
            this.fireEvent("search", this, this.getSearchFormId());
            Event.stop(e);
        },
        onHide : function() {
            this.searchGrid.destroy(true);
        },
        onShow: function() {
            var personSearch = getEl(this.id + "-person-search");
            var width = Math.max(this.body.getWidth(), personSearch.getWidth());
            this.resizeTo(600, 500);
        },
        updateData: function(data) {
            this.searchGrid.reset(this._createSearchConfig(data));
            this.searchGrid.render();
        },
        getSearchFormId: function() {
            return this.id + "-search-form";
        },
        serializeForm: function() {
            return Form.serialize(this.getSearchFormId());
        },
        _buildSearchGrid: function(searchGridId, data, gridColumns) {
            // finally! build grid
            this.searchGrid = new YAHOO.ext.grid.Grid(searchGridId, this._createSearchConfig(data,
                    gridColumns));
            this.searchGrid.addListener('rowdblclick', this._rowClickHandler.bind(this));

            return this.searchGrid;
        },
        _createColumnModel: function(searchColumns) {
            if (!searchColumns) {
                var i = 1;
                searchColumns = [
                {header: "Username", width: 240, sortable: true, dataIndex: i++},
                {header: "Name", width: 160, sortable: true, dataIndex: i++},
                {header: "E-Mail", width: 70, sortable: true, dataIndex: i++}
                        ];
            }
            return new YAHOO.ext.grid.DefaultColumnModel(searchColumns);
        },
        _createSearchConfig: function(data, gridColumns) {
            if (!data) {
                data = [];
            }
            var gridDataModel = new YAHOO.ext.grid.DefaultDataModel(data);
            return {
                dataModel: gridDataModel,
                colModel: this._createColumnModel(gridColumns),
                selModel: new YAHOO.ext.grid.SingleSelectionModel(),
                monitorWindowResize: false,
                stripeRows: false
            }
        },
        _rowClickHandler: function(grid, rownum, evt) {
            var name = grid.getDataModel().getRow(rownum)[1]
            var jid = grid.getDataModel().getRow(rownum)[0]
            this.fireEvent("selected", this, jid, name);
        }
    });
}
;

jive.spank.dialog.CreateAccount = function(verify) {
    this.dialog = new jive.spank.chat.Dialog(null,
            jive.spank.chat.Template.create_account,
    {title: "Creating an account",
        width: 250, height: 180, modal: true}
            );
    var creator = this.dialog;
    this.nameField = getEl(creator.id + '-name');
    this.passwordField = getEl(creator.id + '-passwd');
    this.createButton = getEl(creator.id + '-submit');
    this.verifyCallback = verify;
    getEl(creator.id + '-confirm').mon("keypress",
            this._doSubmit.createInterceptor(function(evt) {
                return evt.getKey() == 13;
            }));
    getEl(creator.id + '-submit').addListener("click", this._doSubmit.bind(this));

    this.nameField.mon("keypress",
            function() {
                this.dom.style.backgroundColor = "#fff";
            }.bind(this.nameField));

    this.passwordField.mon("keypress",
            function() {
                this.dom.style.backgroundColor = "#fff";
            }.bind(this.passwordField));

    this.nameField.dom.focus();
    creator.dialog.show();
};
jive.spank.dialog.CreateAccount.prototype = {
    _doSubmit: function() {
        var creator = this.dialog;
        var error = $(creator.id + "-error");
        $(creator.id + '-name').style.backgroundColor = "#fff";
        $(creator.id + '-passwd').style.backgroundColor = "#fff";
        if ($F(creator.id + '-name') == '') {
            $(creator.id + '-name').style.backgroundColor = "#f00";
            $(creator.id + '-name').select();
            return false;
        }
        if ($F(creator.id + '-passwd') == '') {
            $(creator.id + '-passwd').style.backgroundColor = "#f00";
            $(creator.id + '-passwd').select();
            return false;
        }
        if ($F(creator.id + '-passwd') != $F(creator.id + '-confirm')) {
            $(creator.id + '-passwd').style.backgroundColor = "#f00";
            $(creator.id + '-passwd').select();
            return false;
        }
        this.createButton.dom.disabled = true;
        this.createButton.hide();
        jive.spank.Spinner.show({x: this.createButton.getX() - 10, y: this.createButton.getY()});
        this.verifyCallback({
            username: $F(creator.id + '-name'),
            password: $F(creator.id + '-passwd')
        });

    },
    verify: function(fields) {
        var creator = this.dialog;
        if (verify) {
            if (verify.name) {
                $(creator.id + '-name').style.backgroundColor = "#f00";
                $(creator.id + '-name').select();
                return;
            }
            if (verify.password) {
                $(creator.id + '-passwd').style.backgroundColor = "#f00";
                $(creator.id + '-passwd').select();
                return;
            }
        }
        getEl(creator.id + '-confirm').removeAllListeners();
        getEl(creator.id + '-submit').removeAllListeners();
        this.nameField.removeAllListeners();
        this.passwordField.removeAllListeners();
        this.dialog.hide();
    }
}

jive.spank.roster.Roster = function (id, separateOfflines) {
    this.el = getEl(id);
    this.groups = {};
    this.events = {
    /**
     * @event contactdblclicked
     * Fires when the user double-clicks a contact in the roster.
     * @param {jive.spank.roster.Roster} roster
     * @param {jive.spank.roster.Contact} contact
     */
        "contactdblclicked": true,
		
        "contactrightclicked": true,
    /**
     * @event offline
     * Fires when a contact starts or stops being 'unavailable' - but not
     * when their status was previously unknown (e.g. not in the first
     * population phase of the roster).
     */
        "offlinemoved": true
    };
    if (separateOfflines) {
        this.offlines = '';
        // will hold id of "virtual roster group" element.
        this._wrappedClick = null;
    }
    ;
};

YAHOO.extend(jive.spank.roster.Roster, YAHOO.ext.util.Observable, {
/**
 * Creates new group and does up the HTML. Hit setRoster instead for setting up
 * many groups at a time.
 *
 * @param {String} displayed name of group.
 * @param {Object} JSON representing the group's members, with usernames as keys.
 */
    addGroup: function(groupName, groupObj) {
        if (this.groups[groupName]) {
            return this.groups[groupName];
        }
        this.groups[groupName] = new jive.spank.roster.RosterGroup(this, groupName, groupObj);
        this.el.insertHtml('beforeEnd', this.groups[groupName].render(false));
        this.groups[groupName]._enableBehaviors();
        return this.groups[groupName];
    },

    addContact: function(userObj, groupName, groupObj) {
        var group = this.addGroup(groupName, groupObj);
        group.addContact(userObj);
    },

    removeContact: function(jid) {
        var victim = this.findContact(jid);
        if (!victim) {
            return;
        }
        var grp = victim.group;
        victim.remove();
        if (grp.contacts.length == 0) {
            grp.remove();
        }
    },

/**
 * Creates groups from a composite JSON obj of the whole roster. Will NOT rewrite
 * HTML, call render() for that.
 *
 * @param {Object} JSON representing groups, with group names as keys, and
 * usernames as keys beneath that.
 */
    setRoster: function(rosterObj) {
        var groupObj;
        for (var groupName in rosterObj) {
            groupObj = rosterObj[groupName];
            this.groups[groupName] = new jive.spank.roster.RosterGroup(this, groupName, groupObj);
        }
    },

    render: function() {
        var groupHTML = '';
        var skipOfflinesFlag = typeof this.offlines != 'undefined';

        var closedGroups = this._getClosedGroups();

        for (var groupToRender in this.groups) {
            groupHTML += this.groups[groupToRender].render(skipOfflinesFlag,
                    closedGroups.indexOf(groupToRender) >= 0);
        }

        groupHTML += this._getOfflineHTML();

        this.el.dom.innerHTML = groupHTML;

        return this;
    },

/**
 * Returns contact obj for the currently selected contact.
 */
    getSelectedUser: function() {
        var victim = $$('ul#' + this.id + ' ul.group-list li.selected')[0];
        var idparts = victim.id.split("-");
        var grouphandle = idparts[3];
        var foundjid = idparts[2];
        return this.findContact(foundjid, grouphandle);
    },

    findContact: function(jid, groupName) {
        if (groupName) groupName = groupName.replace(/[^0-9A-Za-z]/, '_');
        for (var grouploopName in this.groups) {
            if (groupName && grouploopName.replace(/[^0-9A-Za-z]/, '_') != groupName) continue;
            var foundContact = this.groups[grouploopName].contacts.find(function(contact) {
                return contact.jid == jid;
            });
            if (foundContact) {
                return foundContact;
            }
        }
        return null;
    },

    changeContactStatus: function(jid, newMode, newStatus) {
        var contact = this.findContact(jid);
        if (contact) {
            contact.changeStatus(newMode, newStatus);
        }
    },

    getContactStatus: function(jid) {
        var contact = this.findContact(jid);
        if (contact) {
            return contact.status;
        }
    },

    _getOfflineHTML: function() {
        this.offlines = "Offline_Group-" + this.el.id;
        var groups = this.groups;
        var offlineHTML = '';
        for (var groupName in groups) {
            this.groups[groupName].contacts.each(function(contact) {
                if (contact.status == "unavailable") {
                    offlineHTML += contact.render();
                }
            });
        }

        var offlineGroupElement = getEl('group-' + this.offlines);
        var isClosed = false;
        if(offlineGroupElement && offlineGroupElement.dom) {
            var groupLabelChildren = offlineGroupElement.getChildrenByClassName("group-label");
            for(var i = 0; i < groupLabelChildren.length; i++) {
                if(getEl(groupLabelChildren[i]).hasClass('closed')) {
                    isClosed = true;
                }
            }
            offlineGroupElement.remove();
        }
        
        if (offlineHTML == '') {
            return '';
        }
        else {
            return jive.spank.chat.Template.roster_group.applyTemplate({
                id: this.offlines,
                renderClosed: (isClosed ? 'closed' : 'open'),
                online: '',
                groupName: "Offline Group",
                users: offlineHTML

            });
        }
    },

    _enableOfflineBehaviors: function() {
        // behaviors on contacts will be taken care of,
        // but not showing and hiding the group. hence:
        var offlineGroupLabel = getEl('group-label-' + this.offlines);
        if(!offlineGroupLabel || !offlineGroupLabel.dom) {
            return;
        }
        offlineGroupLabel.unselectable();
        this._wrappedClick = offlineGroupLabel.getChildrenByTagName('em')[0].mon('click',
                jive.spank.roster.RosterGroup.toggleGroupVisListener);
        jive.spank.roster.RosterGroup.toggleGroupVisibility(offlineGroupLabel,
                offlineGroupLabel.hasClass("closed"));

        // finally:
        jive.spank.roster.RosterGroup.sortContactHTML(this.offlines);
    },

    sortGroups: function() {
        var prent = this.el;
        if (prent && prent.dom != null) {
            var lines = prent.getChildrenByClassName('group');
            var sorted = lines.sortBy(function(line) {
                return line.id.split("-")[1].toLowerCase();
            });
            sorted.each(function(line) {
                line.appendTo(prent.dom);
            });
        }
        for (var g in this.groups) {
            this.groups[g].sort();
        }
    },

    _getClosedGroups: function() {
        var closedgroups = [];
        var groups = this.el.getChildrenByClassName('closed');
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].firstChild) {
                closedgroups.push(groups[i].firstChild.innerHTML);
            }
        }
        return closedgroups;
    },

    _enableBehaviors: function(doGroupHiding) {
        for (var g in this.groups) {
            this.groups[g]._enableBehaviors(doGroupHiding);
        }
    }
});


jive.spank.roster.RosterGroup = function(roster, name, groupJson) {
    this.name = name;
    this.cleanName = name.replace(/[^A-Za-z0-9]/, '_');

    this._roster = roster;
    this.contacts = [];
    if (groupJson) {
        this._rebuildContacts(groupJson);
    }

    this.id = this.cleanName + "-" + this._roster.el.id;

    this._wrappedClick = null;
};

jive.spank.roster.RosterGroup.prototype = {
    _rebuildContacts: function(json) {
        for (var contactUsername in json) {
            this.contacts.push(new jive.spank.roster.Contact(json[contactUsername], this));
        }
    },

/**
 * Creates new contact and adds to group. Handles the HTML.
 *
 * @param {Object} JSON-ish object with jid, optional status.
 */
    addContact: function(userObject) {
        var newguy = new jive.spank.roster.Contact(userObject, this);
        this.contacts.push(newguy);

        var wheretodraw = "group-list-" + this.id;
        if (typeof this._roster.offlines != 'undefined' && newguy.status == 'unavailable') {
            wheretodraw = "group-list-" + this._roster.offlines;
        }

	var color = uniqueColorForString(newguy.name);	
	
        jive.spank.chat.Template.contact.append(wheretodraw, {
            id: newguy.id,
            status: newguy.status,
            //userid: newguy.name,
            username: newguy.name
        });
        
        this.contacts[this.contacts.length - 1]._enableBehaviors();
        this.sort();
    },

    removeContact: function(jid) {
        var victim = this.getContactByJID(jid);
		if (!victim) {
            return;
        }
        if (victim) {
            victim.remove();
        }
        this.sort();
    },

/**
 * Gets index within this group's contacts array of a given jid.
 *
 * @param {String} a jid, of course.
 */
    contactIndexByJid: function(jid) {
        for (var u = this.contacts.length - 1; u >= 0; u--) {
            if (this.contacts[u].jid == jid) {
                return u;
            }
        }
        return -1;
    },

    getContactByJID: function(jid) {
        var index = this.contactIndexByJid(jid);
        if (index >= 0) {
            return this.contacts[index];
        }
        else {
            return null;
        }
    },

/**
 * Returns HTML for whole group. Doesn't add it anywhere or make things clickable.
 */
    render: function(skipOfflines, isClosed) {
        var renderClosed = (isClosed ? 'closed' : 'open');

        var body = this._getMembersHtml(skipOfflines);
        if (body == '' && skipOfflines) {
            return '';
        }

        return jive.spank.chat.Template.roster_group.applyTemplate({
            id: this.id,
            renderClosed: renderClosed,
            online: 'group-isonline',
            groupName: this.name,
            users: body
        });
    },

/**
 * Sorts contact LIs alphabetically. Only affects the HTML, not the contacts array.
 * Relies on a couple bits from prototype.
 */
    sort: function() {
        jive.spank.roster.RosterGroup.sortContactHTML(this.id);
    },

/**
 * Kill self, no questions asked
 */
    remove: function() {
        var elm = getEl("group-" + this.id);
        YAHOO.ext.EventManager.removeListener(elm, "click", this._wrappedClick);
        this._wrappedClick = null;
        elm.remove();
        delete this._roster.groups[this.name];
    },

    _getMembersHtml: function(skipOfflines) {
        var userDump = '';
        for (var u = 0; u < this.contacts.length; u++) {
            if (!skipOfflines || this.contacts[u].status != 'unavailable') {
                userDump += this.contacts[u].render();
            }
        }
        return userDump;
    },

    _enableBehaviors: function(doGroupHiding) {
        if (doGroupHiding == null) {
            doGroupHiding = true;
        }
        var labell = getEl('group-label-' + this.id);
        if (labell && labell.dom) {
            labell.unselectable();
            var enablee = labell.getChildrenByTagName('em')[0];
            enablee.unselectable();
            if (doGroupHiding) {
                this._wrappedClick = enablee.mon('click',
                        jive.spank.roster.RosterGroup.toggleGroupVisListener);
            }
        }
        // carry thru to contacts
        for (var u = this.contacts.length - 1; u >= 0; u--) {
            this.contacts[u]._enableBehaviors();
        }
    }
};

jive.spank.roster.RosterGroup.toggleGroupVisListener = function(evt) {
    jive.spank.roster.RosterGroup.toggleGroupVisibility(getEl(evt.getTarget().parentNode));
};

jive.spank.roster.RosterGroup.toggleGroupVisibility = function(groupLabelElement, forceNoDisplay) {
    var groupElement = getEl(groupLabelElement.dom.parentNode);
    var groupListElement = groupElement.getChildrenByClassName("group-list")[0];
    if (groupListElement == null) {
        return;
    }
    else {
        groupListElement = groupListElement.dom;
    }
    var display = (groupListElement.style.display == "none" && !forceNoDisplay) ? 'block' : 'none';
    groupListElement.style.display = display;

    groupLabelElement.removeClass(display == 'block' ? "closed" : "open");
    groupLabelElement.addClass(display == 'block' ? "open" : "closed");
}

jive.spank.roster.RosterGroup.sortContactHTML = function(id) {
    var prent = getEl('group-list-' + id);
    if (prent && prent.dom != null) {
        var lines = prent.getChildrenByTagName('li');
        var sorted = lines.sortBy(function(line) {
            return line.dom.innerHTML;
        });
        var line = null;
        for(var i = 0; i < sorted.length; i++) {
        	line = sorted[i];
        	if(line) {
        	if(line.dom.className.indexOf("even") > -1) {
        		if(i % 2 == 0)
        			line.replaceClass("even", "odd");
        	} else {
        		if(i % 2 != 0)
        			line.replaceClass("odd", "even");
        	}
            line.appendTo(prent.dom);
            }
        }
    }
};


jive.spank.roster.Contact = function(userObject, groupRef) {
    this.jid = userObject.getJID();
    this.name = (userObject.getName && userObject.getName() ? userObject.getName()
            : this.jid.toString());
    this.status = typeof userObject != 'string' && userObject.status ? userObject.status :
                  userObject.isSubscriptionPending && userObject.isSubscriptionPending() ? "pending" : "unavailable";
    this.group = groupRef;
    this.id = 'roster-contact-' + this.jid + '-' + this.group.cleanName;
    this.currentMessage = '';

    this._wrappedClick = null;
    this._wrappedDblClick = null;
    this.events = {
        "status": true,
        "offlinemoved": true
    }
};

YAHOO.extend(jive.spank.roster.Contact, YAHOO.ext.util.Observable, {
/**
 * Kill self, no questions asked
 */
    remove: function() {
        var elm = getEl(this.id);
        YAHOO.ext.EventManager.removeListener(elm, "click", this._wrappedClick);
        this._wrappedClick = null;
        YAHOO.ext.EventManager.removeListener(elm, "dblclick", this._wrappedDblClick);
        this._wrappedDblClick = null;
        YAHOO.ext.EventManager.removeListener(elm, "mouseover", this._wrappedMouseOver);
        delete this._wrappedMouseOver;
        YAHOO.ext.EventManager.removeListener(elm, "mouseout", this._wrappedMouseOut);
        delete this._wrappedMouseOut;
		YAHOO.ext.EventManager.removeListener(elm, "contextmenu", this._wrappedContextMenu);
        delete this._wrappedContextMenu;
        elm.remove();
        this.group.contacts.splice(this.group.contactIndexByJid(this.jid), 1);
        delete this.group;
    },

/**
 * Resets contact's HTML classname to reflect newStatus.
 *
 * @param {String} string to hopefully match one of the status class declarations.
 */
    changeStatus: function(newMode, newStatus) {
        newMode = newMode.toLowerCase();

        var contactSpan = getEl(this.id).dom.childNodes[0];
        contactSpan.className = contactSpan.className.replace("roster-contact-" + this.status, "roster-contact-" + newMode);

        var oldMode = (this.status ? this.status : "unavailable");
        var realOldMode = this.status;

        this.status = newMode;

        if (realOldMode == 'unavailable' || newMode == 'unavailable') {
            this.group._roster.fireEvent('offlinemoved');
            // this gets its own var, realOldMode, so we don't fire a lot of
            // false positives when first populating the roster
        }
        this.fireEvent("status", oldMode, newMode);
        this._changeStatusMsg(newStatus);
        return oldMode;
    },

/**
 * Return HTML as string, don't add it anywhere or make it hot.
 */
    render: function() {

    //	var color = window.uniqueColorForString(this.name);
/*    
        if (typeof this.jid == 'string') {
		var i = this.jid.indexOf("@");
		
		if (i < 0) {
		    var userid = this.jid;
		}
		else {
		    var userid = this.jid.slice(0, i);
		}
	} else
            var userid = this.jid.getNode();
*/    
        return jive.spank.chat.Template.contact.applyTemplate({
            id: this.id,
            username: this.name,
            //userid: userid,
            status: this.status,
            message: this.currentMessage
        });
    },

    _changeStatusMsg: function(msg) {
        this.currentMessage = (!msg || msg.strip() == '' ? '' : '- ' + msg);
        var statusElm = getEl(this.id + '-msg');
        statusElm.dom.innerHTML = this.currentMessage;
    },

    _enableBehaviors: function() {
        var elm = getEl(this.id);
        if (elm) {
            elm.unselectable();

            // someday, also add mouseover for the popup profiley thing
            // but for now
            this._wrappedClick = elm.mon('click', function(id) {
                var goodElm = getEl(id);
                var damnbug = goodElm.dom.id;
                getEls('ul.jive-roster ul.group-list li').removeClass('selected');
                document.getElementById(damnbug).className += " selected";
            }.createCallback(this.id));
            this._wrappedDblClick = elm.mon('dblclick', function(evt) {
                evt.stopEvent();
                this.group._roster.fireEvent("contactdblclicked", this.group._roster, this);
            }, this, true);
            this._wrappedContextMenu = elm.mon('contextmenu', function(evt) {
                evt.stopEvent();
                var menutarget = evt.getTarget();
                if (menutarget.tagName.toLowerCase() != "li") {
                    menutarget = menutarget.parentNode;
                    // if more stuff goes into contact HTML this may break
                }

                // select the element
                var damnbug = menutarget.id;
                getEls('ul.jive-roster ul.group-list li').removeClass('selected');
                document.getElementById(damnbug).className += " selected";
                this.group._roster.fireEvent("contactrightclicked", this.group._roster, this,
                        evt.getPageX(), evt.getPageY());
            }, this, true);
            this._wrappedMouseOver = elm.addManagedListener("mouseover", function(id) {
                var goodElm = getEl(id);
                var damnbug = goodElm.dom.id;
                document.getElementById(damnbug).className += " hover";
            }.createCallback(this.id));
            this._wrappedMouseOut = elm.addManagedListener("mouseout", function(id) {
				var elm = getEl(id);
                elm.removeClass('hover');
            }.createCallback(this.id));
        }
    }
});

/**
 * Returns first contact object in the named group that matches the JID given.
 * If no group name is given, searches all groups and returns first match.
 *
 * @param {String} jid valid jid.
 * @param {String} groupName name of group to look in. Cleaned w/ underscores or not, doesn't matter.
 */
jive.spank.roster.Contact.find = function(currentRoster, jid, groupName) {
    var grouploop = currentRoster.groups;
    for (var grouploopName in grouploop) {
        if (groupName && grouploopName.replace(/[^0-9A-Za-z]/, '_') != groupName) continue;
        var foundContact = grouploop[grouploopName].contacts.find(function(contact) {
            return contact.jid == jid;
        });
        if (foundContact) {
            return foundContact;
        }
    }
    return null;
};


jive.spank.chat.Control = function(panelToAdd, title, elm) {
    // elm is a bare HTMLElement, so there's a chance we'll need this:
    elm.id = elm.id || YAHOO.util.Dom.generateId();

    this.el = getEl(elm.id);
    this.el.appendTo(panelToAdd);
    this.el.setDisplayed('block').unselectable();
	this.el.addClassOnOver("hover");

    this.events = {
    /**
     * These all get the Control obj as their first arg and
     * a YAHOO.ext Event as their second.
     */
        "click": true,
        "dblclick": true,
        "mouseover": true,
        "mouseout": true,
        "mousedown": true,
        "mouseup": true,
        "mousemove": true
    };
    this._wrappedListeners = {};
	
    var self = this;
    // i hate to do this, but looping through the event names breaks
    this._wrappedListeners['click'] = this.el.addManagedListener('click', function(evt) {
        self.fireEvent('click', evt);
    });
    this._wrappedListeners['dblclick'] = this.el.addManagedListener('dblclick', function(evt) {
        self.fireEvent('dblclick', evt);
    });
    this._wrappedListeners['mouseover'] = this.el.addManagedListener('mouseover', function(evt) {
        self.fireEvent('mouseover', evt);
    });
    this._wrappedListeners['mouseout'] = this.el.addManagedListener('mouseout', function(evt) {
		this.removeClass("active");
        self.fireEvent('mouseout', evt);
    });
    this._wrappedListeners['mousedown'] = this.el.addManagedListener('mousedown', function(evt) {
		this.addClass("active");
        self.fireEvent('mousedown', evt);
    });
    this._wrappedListeners['mouseup'] = this.el.addManagedListener('mouseup', function(evt) {
		this.removeClass("active");
        self.fireEvent('mouseup', evt);
    });
    this._wrappedListeners['mousemove'] = this.el.addManagedListener('mousemove', function(evt) {
        self.fireEvent('mousemove', evt);
    });

    this.title = title;
    this.panel = panelToAdd;
};
YAHOO.extend(jive.spank.chat.Control, YAHOO.ext.util.Observable, {
    fireEvent: function() {
        if (!this.el.hasClass('disabled')) {
            jive.spank.chat.Control.superclass.fireEvent.call(this, arguments[0], self, arguments[1]);
        }
    },

    remove: function() {
        this.purgeListeners();
        for (var eventName in this.events)
        {
            YAHOO.ext.EventManager.removeListener(eventName, this.el, this._wrappedListeners[eventName]);
        }
        this._wrappedListeners = null;
        this.el.remove();
    },
    enable: function() {
        this.el.removeClass('disabled');
    },
    disable: function() {
        this.el.addClass('disabled');
    },
    toggleEnabled: function() {
        this.el.toggleClass('disabled');
    }
});
jive.spank.chat.Control.add = function(destElm, ctrlTitle, confObj) {
    var body = document.getElementsByTagName('body')[0];
    // fetch elm if ctrlElmId provided
    if (typeof confObj != 'function' && confObj.elmId != null) {
        var elmorig = $(confObj.elmId);
        var elm = elmorig.cloneNode(true);
        elm.id = 'jivectrl-' + elmorig.id;
        elm.style.display = 'none';
        body.appendChild(elm);
    }
    else if (typeof confObj != 'function' && confObj.identifier != null) {
        var elm = document.createElement('div');
        var elmId = elm.id = YAHOO.util.Dom.generateId();
        elm.className = "icon " + confObj.identifier;
        if (confObj.tooltip) {
            elm.setAttribute('title', confObj.tooltip);
        }
        body.appendChild(elm);
    }
    else {
        var classNm = 'autobtn icon';
        var elmId = YAHOO.util.Dom.generateId();
        if (typeof confObj != 'function' && confObj.className != null) {
            classNm = "icon " + confObj.className;
        }
		if(confObj.identifier != null) {
			classNm += " " + confObj.identifier;
		}
        jive.spank.chat.Template.control_btn.append(body, {
            id: elmId,
            cls: classNm,
            text: ctrlTitle
        });
    }
    if (typeof confObj != 'function' && confObj.tooltip) {
        elm.setAttribute('title', confObj.tooltip);
    }

    // make control obj
    var thecontrol = new jive.spank.chat.Control(
            getEl(destElm),
            ctrlTitle,
            elm
            );

    if (typeof confObj == 'function') {
        thecontrol.addListener("click", confObj);
    }
    else {
        for (var eventName in confObj.events) {
            thecontrol.addListener(eventName, confObj.events[eventName]);
        }
    }
    return thecontrol;
};

jive.spank.chat.MucInvitation = function(config) {
    var template = new YAHOO.ext.DomHelper
            .Template(this.template.join(''));
    this.onDestroy = [];

    config.id = config.id || YAHOO.util.Dom.generateId();

    this.el = document.createElement('div');
    this.el.innerHTML = template.applyTemplate(config);
    this.el.id = config.id;
    this.config = config;
}

YAHOO.extend(jive.spank.chat.MucInvitation, YAHOO.ext.util.Observable, {
    events: {
        'accepted': true,
        'declined': true
    },
    callback: function(window) {
        var theId = this.el.id;
        var roomname = getEl(theId + '-room').dom.innerHTML;
        var invitername = getEl(theId + '-inviter').dom.innerHTML;

        var join = getEl(theId + '-join');
        var wrappedFunction = join.mon('click', function(theId, join, event) {
            if(join.id != event.getTarget().id) { return; }
            this.fireEvent('accepted', window, this.config);
            getEl(theId + '-message').dom.innerHTML =
            'You accepted ' + invitername + '\'s invitation to "' + roomname + '".';
            this.destroy();
        }.bind(this, theId, join));
        this.onDestroy.push(YAHOO.ext.EventManager.removeListener
                .createDelegate(YAHOO.ext.EventManager, [join, 'click', wrappedFunction]));

        var decline = getEl(theId + '-decline');
        wrappedFunction = decline.mon('click', function(theId, event) {
            this.fireEvent('declined', window, this.config);
            getEl(theId + '-message').dom.innerHTML =
            'You declined ' + invitername + '\'s invitation to "' + roomname + '".';
            this.destroy();
        }.bind(this, theId));
        this.onDestroy.push(YAHOO.ext.EventManager.removeListener
                .createDelegate(YAHOO.ext.EventManager, [decline, 'click', wrappedFunction]));
    },
    destroy: function() {
        var theId = this.el.id;
        this.onDestroy.each(function(func) {
            func();
        });
        getEl(theId + '-controls').remove();
        this.purgeListeners();
        delete this.config;
    },
    template: [
            '<div id="{id}-mucinvite" class="jive-mucinvite">',
            '<p id="{id}-message"><span id="{id}-inviter">{name}</span> has invited you to ',
            'join the conference "<span id="{id}-room">{chatname}</span>".</p>',
            '<div id="{id}-controls"><a class="mucinviteoption" id="{id}-join" href="#">Accept</a>',
            '<a class="mucinviteoption" id="{id}-decline" href="#">Decline</a></div>',
            '</div>'
            ]
});

if(window.jive_enable_autocomplete == "enable") {
/**
 * Subclassing YUI's autocomplete widget to deal with some weirdnesses in our data sources.
 */
jive.spank.AutoComplete = function(fieldId, containerId, dataSource, confObj) {
    jive.spank.AutoComplete.superclass.constructor.call(this, fieldId, containerId, dataSource, confObj);
}
YAHOO.extend(jive.spank.AutoComplete, YAHOO.widget.AutoComplete);
jive.spank.AutoComplete.prototype._populateList = function(query, results, self) {
	if(results.length > 0) {
    	self.autoHighlight = (results[0][0].indexOf(query) == 0);
    	jive.spank.AutoComplete.superclass._populateList.call(this, query, results, self);
    }
}

jive.spank.AutoComplete.prototype._onTextboxKeyDown = function(v, oSelf) {
    var nKeyCode = v.keyCode;

    switch (nKeyCode) {
        case 9: // tab
            if (oSelf.delimChar && (oSelf._nKeyCode != nKeyCode)) {
                if (oSelf._bContainerOpen) {
                    YAHOO.util.Event.stopEvent(v);
                }
            }
            // select an item or clear out
            if (oSelf._oCurItem) {
                oSelf._selectItem(oSelf._oCurItem);
            }
            else {
                oSelf._toggleContainer(false);
            }
            break;
        case 27: // esc
            oSelf._toggleContainer(false);
            return;
        case 39: // right
            oSelf._jumpSelection();
            break;
        case 38: // up
            YAHOO.util.Event.stopEvent(v);
            oSelf._moveSelection(nKeyCode);
            break;
        case 40: // down
            YAHOO.util.Event.stopEvent(v);
            oSelf._moveSelection(nKeyCode);
            break;
        default:
            break;
    }
};
/**
 * This one tweaks it up a little extra for the roster-group data source, which is a 1-dimensional
 * array, not 2-D like the contacts datasource in the invite menu.
 */
jive.spank.FlatAutoComplete = function(fieldId, containerId, dataSource, confObj) {
    jive.spank.FlatAutoComplete.superclass.constructor.call(this, fieldId, containerId, dataSource, confObj);
}
YAHOO.extend(jive.spank.FlatAutoComplete, YAHOO.widget.AutoComplete);
jive.spank.FlatAutoComplete.prototype._populateList = function(query, results, self) {
    self.autoHighlight = (results[0] && results[0].indexOf(query) == 0);
    jive.spank.AutoComplete.superclass._populateList.call(this, query, results, self);
}
jive.spank.FlatAutoComplete.prototype._updateValue = function(item) {
    item._sResultKey = item._oResultData;
    jive.spank.AutoComplete.superclass._updateValue.call(this, item);
};
} else {
jive.spank.AutoComplete = {};
};

jive.spank.Spinner = {
    show: function(confObj) {
        if (confObj == null) {
            confObj = {};
        }
        if (!this.isShowing) {
            var x = confObj.x || (YAHOO.util.Dom.getViewportWidth() / 2) - 60;
            var y = confObj.y || (YAHOO.util.Dom.getViewportHeight() / 2) - 20;
            var text = confObj.text || 'Loading...';
            this.template.append(document.body, {text: text});
            var theEl = getEl("jive-spinner");
            if (confObj.el && confObj.position) {
                theEl.alignTo(confObj.el, confObj.position);
            }
            else {
                theEl.moveTo(x, y);
            }
            theEl.setStyle('z-index', 20000);
            theEl.show();
            this.isShowing = true;
        }
    },
    isShowing: false,
    hide: function() {
        if (this.isShowing) {
            getEl("jive-spinner").remove();
            this.isShowing = false;
        }
    },
    template: new YAHOO.ext.DomHelper.Template(
            '<div style="visibility: hidden;" id="jive-spinner">' +
            '<img src="chat/images/progress.gif" alt="" />{text}</div>'
            )
};


/**
 * Makes message-text filters, suitable for adding emoticons, links into Wikipedia
 * or whatever you can cook up.
 *
 * @param {String} name a short name by which you can unregister the filter later.
 * @param {RegExp} filterer a regex to test strs against
 * @param {String} filterTo a string to replace the matches with - $1 and $2 and such for matched groups will work
 */
jive.spank.chat.Filter = function(name, filterer, filterTo) {
    this.filterPattern = filterer;
    this.filterReplacement = filterTo;
    this.name = name;
};
jive.spank.chat.Filter.prototype.apply = function(stringToFilter) {
    return stringToFilter.replace(this.filterPattern, this.filterReplacement);
}

jive.spank.chat.Filter.applyAll = function(stringToFilter) {
    // apply filter only to text nodes
    jive.spank.chat.Filter.registeredFilters.each(function(filter) {
        stringToFilter = filter.apply(stringToFilter);
    });
    return stringToFilter;
};

jive.spank.chat.Filter.add = function(name, filterer, filterTo) {
    jive.spank.chat.Filter.registeredFilters.push(new jive.spank.chat.Filter(name, filterer, filterTo));
}
jive.spank.chat.Filter.remove = function(filterName) {
    jive.spank.chat.Filter.registeredFilters.each(function(ftr, i) {
        if (ftr.name == filterName) {
            delete jive.spank.chat.Filter.registeredFilters[i];
            throw $break;
        }
    });
}
jive.spank.chat.Filter.unregisterAll = function() {
    for (var t = jive.spank.chat.Filter.registeredFilters.length - 1; t >= 0; t--) {
        delete jive.spank.chat.Filter.registeredFilters[t];
    }
}

jive.spank.chat.Filter.registeredFilters = [];


// notification nonsense
jive.spank.notifier = {};
jive.spank.notifier.origTitle = null;
jive.spank.notifier.titleMsg = '';
jive.spank.notifier.titleInterval = null;
jive.spank.notifier.countNewMsgs = function() {
    var windowObj;
    var lastOneName = '';
    var newMsgCt = 0;
    for (var windowId in jive.spank.chat.ChatWindow.currentWindow)
    {
        windowObj = jive.spank.chat.ChatWindow.currentWindow[windowId];
        for (var tabJid in windowObj.newMessages) {
            newMsgCt += windowObj.newMessages[tabJid];
        }
    }
    return newMsgCt;
};
jive.spank.notifier.doTitleNotify = function(contactName) {
    var ct = jive.spank.notifier.countNewMsgs();
    if (jive.spank.notifier.titleInterval) {
        window.clearTimeout(jive.spank.notifier.titleInterval);
        jive.spank.notifier.titleInterval = null;
    }
    if (ct <= 0)
    {
        if (jive.spank.notifier.origTitle != null) {
            document.title = jive.spank.notifier.origTitle;
            jive.spank.notifier.origTitle = null;
        }
        return null;
    }
    else {
        jive.spank.notifier.titleMsg = "* " + ct + " new chat message" + (ct > 1 ? "s" : "");
    }
    if (jive.spank.notifier.origTitle == null) {
        jive.spank.notifier.origTitle = document.title;
    }
    jive.spank.notifier.titleInterval = window.setTimeout(jive.spank.notifier.rotateTitle, 2000);
};
jive.spank.notifier.rotateTitle = function() {
    document.title = (document.title == jive.spank.notifier.titleMsg) ?
                     jive.spank.notifier.origTitle :
                     jive.spank.notifier.titleMsg;
    jive.spank.notifier.titleInterval = window.setTimeout(jive.spank.notifier.rotateTitle, 2000);
};

// templates
jive.spank.chat.Template = {
    add_contact: new YAHOO.ext.DomHelper.Template([
            '<div class="dbody addcontact">',
            '<table width="100%" cellpadding="2" cellspacing="0" border="0">',
            '<tr><td width="35%">',
            '<label for="{id}-addusername">Username:</label>',
            '</td><td width="65%">',
            '<input type="text" id="{id}-addusername" value="" />',
            '</td></tr>',

            '<tr><td><label for="{id}-addnickname">Nickname:</label>',
            '</td><td><input type="text" id="{id}-addnickname" value="" /></td></tr>',

            '<tr><td><label for="{id}-addcontact-group">Group:</label></td><td>',
            '<input type="text" id="{id}-addcontact-group" value="" />',
            '</td></tr>',

            '<tr><td colspan="2" align="center" class="masterctrl">',
            '<input type="button" class="btn createcontact" id="{id}-createcontact" value="Add" />',
            '<input type="button" class="btn jive-closedialog" id="{id}-closeaddcontact" value="Cancel" />',
            '</td></tr></table>',
            '</div>'
            ].join('')),
    add_group: new YAHOO.ext.DomHelper.Template([
            '<div class="dbody">',
            '<table width="100%" cellpadding="2" cellspacing="0" border="0">',
            '<tr><td width="25%" rowspan="2">',
    // image goes here?
            '</td><td width="75%">',
            'Enter new group name:<br/>',
            '<input type="text" id="{id}-addgroupname" value="" />',
            '</td></tr>',
            '<tr><td>',
            '<input type="button" class="btn creategroup" id="{id}-creategroup" value="Add" />',
            '<input type="button" class="btn jive-closedialog" id="{id}-closeaddgroup" value="Cancel" />',
            '</td></tr></table>',
            '</div>'
            ].join('')),
    chat_toppane: new YAHOO.ext.DomHelper.Template(
            '<div id="{bodyId}-topchat" class="jive-chat-toppane">' +         
            '<table width="100%"><tr>' +                    
            '<td><h4></h4>' +
            '<p id="{bodyId}-time"><span></span></p>' +
            '<div id="{bodyId}-controls" class="jive-ctrlbar-topchat"></div></td>' +   
	    '<td align="left" class="avatar"><img src="chat/images/sparkweb-avatar.png" height="48" /></td>' +                        
            '</tr></table></div>'
            ),
    contact: new YAHOO.ext.DomHelper.Template(
	    '<li id="{id}" class="even"><span class="roster-contact-{status} username">{username}</span><span id="{id}-msg" class="msg">{message}</span></li>'            
            ),
    control_btn: new YAHOO.ext.DomHelper.Template(
            '<a href="#" class="jive-control-btn {cls}" id="{id}">{text}</a>'
            ),
    control_panel:new YAHOO.ext.DomHelper.Template(
            '<div id="{tabId}-controls" class="jive-ctrlbar"></div>'
            ),
    create_account: new YAHOO.ext.DomHelper.Template([
            '<div class="dbody">',
            '<table border="0" cellpadding="0" cellspacing="4"><tr>',
            '<td><div class="{id}-name-label">Username:</div></td>',
            '<td><input type="text" id="{id}-name" /></td></tr>',
            '<td><div class="{id}-passwd-label">Password:</div></td>',
            '<td><input type="password" id="{id}-passwd" /></td></tr>',
            '<td><div class="{id}-confirm-label">Confirm Password:</div></td>',
            '<td><input type="password" id="{id}-confirm" /></td></tr>',
            '</table>',
            '<p align="center"><input type="button" class="btn" id="{id}-submit" value="Submit" />',
            '<input type="button" class="btn jive-closedialog" id="{id}-cancel" value="Cancel" /></p>',
            '</div>'
            ].join('')),
    dialog:new YAHOO.ext.DomHelper.Template(
            '<div class="ydlg-hd"><h1>{windowTitle}</h1></div>' +
            '<div id="{bodyId}" class="ydlg-bd">' +
            '<div id="{bodyId}-toppane" class="ydlg-bd jive-toppane"></div>' +
            '</div>' +
            (window.jive_show_branding == "show" ? '<div class="ydlg-ft"><span class="powered-by">Powered By <a href="http://www.jivesoftware.com" title="Visit Jive Software">Jive Software</a></span></div>' : "")
            ),
    message:new YAHOO.ext.DomHelper.Template(
            '<div class="{type}-message from-{from} {mentioned} {consecutive} {action} {msgclass}"><span class="meta" style="color: {color}"><em>({time})</em>' +
            '&nbsp;{from}: </span><span class="message-content">{message}</span></div>'
            ),
    muc_chooser_top: new YAHOO.ext.DomHelper.Template(
            '<div class="dhead chooseconf">Create or join a conference room</div>' +
            '<div id="{tabId}-confcontrols" class="dbody chooseconf">' +
            '<div id="{tabId}-createconf" class="jive-invite-control">Create a Conference</div>' +
            '<div id="{tabId}-refresh" class="jive-invite-control">Refresh List</div>' +
            '</div>'
            ),
    muc_controls: new YAHOO.ext.DomHelper.Template(
            '<div class="muc-ctrl-frame">' +
            '<div id="{jid}-changenick" class="jive-changenick-control">Change Nickname</div>' +
            '<div id="{jid}-control" class="jive-invite-control">Invite contact ' +
            '<img align="absmiddle" src="chat/images/menutri.gif" height="4" width="7" alt="" /></div>' +
            '</div>'
            ),
    muc_subject: new YAHOO.ext.DomHelper.Template(
            '<p>Topic:</p>' +
			'<p id="jive-tab-{jid}-subject" class="jive-topic-name"></p>'
            ),
    mucchooser: new YAHOO.ext.DomHelper.Template(
            '<div id="{tabId}-layout" class="ylayout-inactive-content">' +
            '<div id="{tabId}-toppane" class="ydlg-bd jive-toppane"></div>' +
            '<div id="{tabId}-roomgrid"></div>' +
            '</div>'
            ),
    muccreation: new YAHOO.ext.DomHelper.Template([
            '<div class="dbody">',
            '<table border="0" cellpadding="0" cellspacing="4"><tr>',
            '<td><label for="{id}-roomname">Room Name:</label></td>',
            '<td><input type="text" id="{id}-roomname" /></td></tr>',
            '<tr><td><label for="{id}-roomtopic">Room Topic:</label></td>',
            '<td><input type="text" id="{id}-roomtopic" /></td></tr>',
            '<tr><td colspan="2"><input type="checkbox" id="{id}-permanent" />',
            '<label for="{id}-permanent"> Make permanent</label></td></tr></table>',
            '<div class="fieldset">',
            '<p class="legend"><span><input type="checkbox" id="{id}-private" />',
            ' Make private</span></p>',
            '<table border="0" cellpadding="0" cellspacing="4"><tr>',
            '<td><label for="{id}-roompw" class="disabled">Password:</label></td>',
            '<td><input type="password" id="{id}-roompw" disabled="disabled" /></td></tr>',
            '<td><label for="{id}-roomconfirm" class="disabled">Confirm Password:</label></td>',
            '<td><input type="password" id="{id}-roomconfirm" disabled="disabled" /></td></tr>',
            '</table></div>',
            '<p align="center"><input type="button" class="btn" id="{id}-createroom" value="Create" />',
            '<input type="button" class="btn jive-closedialog" id="{id}-cancel" value="Cancel" /></p>',
            '</div>'
            ].join('')),
    mucinvitemenu:  new YAHOO.ext.DomHelper.Template(
            '<div id="{jid}-container" class="jive-invite-menu">' +
            '<input id="{jid}-autocomp" type="text">' +
            '<div id="{jid}-autocomp-menu"></div>' +
            '</div>'
            ),
    mucpassword: new YAHOO.ext.DomHelper.Template([
            '<div class="dbody">',
            '<p align="center">Enter password:</p>',
            '<p align="center"><input type="password" class="btn" id="{id}-passwd" value="" /></p>',
            '<p align="center"><input type="button" class="btn" id="{id}-sendsecret" value="Join" />',
            '<input type="button" class="btn jive-closedialog" id="{id}-cancel" value="Cancel" /></p>',
            '</div>'
            ].join('')),
    muctab:new YAHOO.ext.DomHelper.Template(
            '<div id="{tabId}-layout" class="ylayout-inactive-content ydlg-tab">' +
            '<div id="{tabId}-innerlayout">' +
		    '<p id="{tabId}-subjectbar">Topic<br /> <span id="{tabId}-subject" class="jive-topic-name"></span></p>' + 
            '<div id="{tabId}-history" class="jive-history"></div>' +
            '<textarea id="{tabId}-text" class="jive-tab-message"></textarea>' +
            '</div>' +
            '<div id="{tabId}-sidebarlayout" class="ylayout-inactive-content ydlg-tab">' +
            '<div id="{tabId}-sidebarheader" class="jive-muc-sidebarheader"></div>' +
            '<div id="{tabId}-occupants" class="jive-muc-occupants"></div>' +
			'<div id="{tabId}-userstatus" class="jive-muc-status"></div>' +
            '</div>' +
            '</div>'
            ),
    remove_group: new YAHOO.ext.DomHelper.Template([
            '<div class="dbody">',
            '<p align="center">Are you sure you want to remove \'{name}\'?</p>',
            '<p align="center"><input type="button" class="btn" id="{id}-remove" value="Yes" />',
            '<input type="button" class="btn jive-closedialog" id="{id}-cancel" value="No" /></p>',
            '</div>'
            ].join('')),
    rename: new YAHOO.ext.DomHelper.Template([
            '<div class="dbody">',
            '<div style="text-align: center; padding: 8px;">Rename to: ',
            '<input type="text" id="{id}-name" value="" /></div>',
            '<div style="text-align: center;">',
            '<input type="button" class="btn" id="{id}-rename" value="OK" />',
            '<input type="button" class="btn jive-closedialog" id="{id}-close" value="Cancel" />',
            '</div>',
            '</div>'
            ].join('')),
    roster:new YAHOO.ext.DomHelper.Template(
            '<ul id="{rosterId}" class="jive-roster">{groups}</ul>'
            ),
    roster_group:new YAHOO.ext.DomHelper.Template(
            '<li id="group-{id}" class="group">' +
            '<span id="group-label-{id}" class="group-label {online} {renderClosed}"><em>{groupName}</em></span>' +
            '<ul id="group-list-{id}" class="group-list">{users}</ul>' +
            '</li>'
            ),
    rostertab:new YAHOO.ext.DomHelper.Template(
            '<div id="{tabId}-layout" class="ylayout-inactive-content">' +
            '<div id="{tabId}-user" class="jive-controlpanel"></div>' +
            '<div id="{tabId}-resources"></div>' +
            '</div>'
            ),
    spinnertab: new YAHOO.ext.DomHelper.Template(
            '<div id="{tabId}-spinner" class="ylayout-inactive-content ydlg-tab jive-spinnertab">' +
            '<div id="jive-spinner"><img src="chat/images/progress.gif" alt="" />{text}</div>' +
            '</div>'
            ),
    start_chat: new YAHOO.ext.DomHelper.Template([
            '<div class="dbody" style="text-align: center;">',
            '<p>Enter an address:</p>',
            '<p><input type="text" id="{id}-jid" /></p>',
            '<p style="margin-top: 4px;"><input type="button" class="btn" id="{id}-startbtn" value="Start Chat" />',
            '<input type="button" class="btn jive-closedialog" id="{id}-cancel" value="Cancel" /></p>',
            '</div>'
            ].join('')),
    statusMessage: new YAHOO.ext.DomHelper.Template(
            '<div class="status-message {customClass}">{message}</div>'
            ),
    status_panel: new YAHOO.ext.DomHelper.Template(
            '<div class="jive-userstatus">' +
            '<p class="avatar"><img id="{bodyId}-avatar" src="chat/images/sparkweb-avatar.png" height="48" alt="" /></p>' +
            '<h4>{username}</h4>' +
            '<p id="{bodyId}-status" class="jive-mystatus">' +
            '<a href="#" id="{bodyId}-statusmenu-ctrl" class="roster-contact-{statusName}"><span>{status}</span></a></p>' +
            '</div>'
            ),
    sub_request: new YAHOO.ext.DomHelper.Template([
            '<div class="dhead">{nick} ({jid}) wants to add you as a contact.</div>',
            '<div class="dbody fieldset">',

            '<p class="legend"><span><input type="checkbox" id="{id}-add" checked="checked" />',
            ' Add user to your contacts too</span></p>',
            '<table width="100%" cellpadding="2" cellspacing="0" border="0">',
            '<tr><td width="35%">',

            '<label for="addusername">Username:</label>',
            '</td><td id="{id}-jid" width="65%">{jid}</td></tr>',
            '<tr><td><label for="{id}-nick">Nickname:</label>',
            '</td><td><input type="text" id="{id}-nick" value="{nick}" /></td></tr>',
            '<tr><td><label for="{id}-subrequest-group">Group:</label></td><td>',
            '<input type="text" id="{id}-subrequest-group" value="" />',

            '</td></tr></table></div>',
            '<p align="center">',
            '<input type="button" class="btn subrequest" id="{id}-acceptsubrequest" value="Allow" />',
            '<input type="button" class="btn subrequest" id="{id}-denysubrequest" value="Deny" />',
            '</p>'
            ].join('')),
    tab:new YAHOO.ext.DomHelper.Template(
            '<div id="{tabId}-layout" class="ylayout-inactive-content ydlg-tab">' +
            '<div id="{tabId}-toppane" class="ydlg-bd jive-toppane"></div>' +
            '<div id="{tabId}-history" class="jive-history"></div>' +
            '<textarea id="{tabId}-text" class="jive-tab-message"></textarea>' +
            '</div>'
            ),
    userpane: new YAHOO.ext.DomHelper.Template(
            '<div id="{id}-message">{message}</div>'
            ),
    userpane_loggedin: new YAHOO.ext.DomHelper.Template(
			'<div>' +
            '<input class="jive-muc-username" type="text" id="{id}-uname" value="{uname}"></input>' +
			'<a class="jive-muc-username-edit" id="{id}-uname-edit">change</a>' +
			'</div>' +
			'<div class="jive-muc-presence-control {presence}" id="{id}-presencecontrol">{presence}</div>'
            ),
    userpane_changebtn: new YAHOO.ext.DomHelper.Template(
            '<a id="{id}-changenickbtn" href="javascript:void(0);">Change Nickname</a>'
            ),
	userstatus: new YAHOO.ext.DomHelper.Template(
            '<div id="{tabId}-layout" class="ylayout-inactive-content ydlg-tab">' +
            '<div id="{tabId}-toppane" class="ydlg-bd jive-toppane"></div>' +
            '<div id="{tabId}-history" class="jive-history"></div>' +
            '<textarea id="{tabId}-text" class="jive-tab-message"></textarea>' +
            '</div>'
            )
};

/**
 * @class YAHOO.ext.grid.SpankJSONDataModel
 * This is an implementation of a DataModel used by the Grid. It works
 * with JSON data.
 * <br>Example schema:
 * <pre><code>
 * var schema = {
 *	 root: 'Results.Result',
 *	 id: 'ASIN',
 *	 fields: ['Author', 'Title', 'Manufacturer', 'ProductGroup']
 * };
 * </code></pre>
 * @extends YAHOO.ext.grid.LoadableDataModel
 * @constructor
 */
if(window.jive_enable_grid == "enable") {
YAHOO.ext.grid.SpankJSONDataModel = function(schema) {
    YAHOO.ext.grid.SpankJSONDataModel.superclass.constructor.call(this, YAHOO.ext.grid.LoadableDataModel.JSON);
    /**@private*/
    this.schema = schema;
};
YAHOO.extendX(YAHOO.ext.grid.SpankJSONDataModel, YAHOO.ext.grid.LoadableDataModel, {
/**
 * Overrides loadData in LoadableDataModel to process JSON data
 * @param {Object} data The JSON object to load
 * @param {Function} callback
 */
    loadData : function(data, callback, keepExisting) {
        var idField = this.schema.id;
        var fields = this.schema.fields;
        try {
            if (this.schema.totalProperty) {
                var v = parseInt(eval('data.' + this.schema.totalProperty), 10);
                if (!isNaN(v)) {
                    this.totalCount = v;
                }
            }
            var rowData = [];
            if (this.schema.root) {
                var root = eval('data.' + this.schema.root);
            }
            else {
                var root = data;
            }
            for (var i in root) {
                var node = root[i];
                var colData = [];
                colData.node = node;
                colData.id = (typeof node[idField] != 'undefined' && node[idField] !== '' ? node[idField] : String(i));
                for (var j = 0; j < fields.length; j++) {
                    var val = node[fields[j]];
                    if (typeof val == 'undefined') {
                        val = '';
                    }
                    if (this.preprocessors[j]) {
                        val = this.preprocessors[j](val);
                    }
                    colData.push(val);
                }
                rowData.push(colData);
            }
            if (keepExisting !== true) {
                this.removeAll();
            }
            this.addRows(rowData);
            if (typeof callback == 'function') {
                callback(this, true);
            }
            this.fireLoadEvent();
        }
        catch(e) {
            this.fireLoadException(e, null);
            if (typeof callback == 'function') {
                callback(this, false);
            }
        }
    },

/**
 * Overrides getRowId in DefaultDataModel to return the ID value of the specified node.
 * @param {Number} rowIndex
 * @return {Number}
 */
    getRowId : function(rowIndex) {
        return this.data[rowIndex].id;
    }
});
};

/**
 * And now, extensions to YAHOO.ext.Element
 */
YAHOO.ext.Element.prototype.getParentByClass = function(className, tagName) {
    if (tagName) {
        tagName = tagName.toLowerCase();
    }
    function isMatch(el) {
        if (!el) {
            return false;
        }
        if (className && !YAHOO.util.Dom.hasClass(el, className)) {
            return false;
        }
        return !(tagName && el.tagName.toLowerCase() != tagName);

    }
    ;

    var t = this.dom;
    if (!t || isMatch(t)) {
        return t;
    }
    var p = t.parentNode;
    var b = document.body;
    while (p && p != b) {
        if (isMatch(p)) {
            return p;
        }
        p = p.parentNode;
    }

    return null;
};

YAHOO.ext.Element.prototype.setSelectable = function(which) {
    this.dom.unselectable = which ? 'off' : 'on';
    if (!which) {
        this.applyStyles('-moz-user-select:none;-khtml-user-select:none;');
    }
    else {
        this.applyStyles('-moz-user-select:normal;-khtml-user-select:auto;');
    }
    // skipping the swallowEvent bit - use this and you must take care of that elsewhere
    // hopefully that'll be fine
    return this;
};

org.jive.spank.control = {
    init: function() {
        var logoutLinks = $$("a.jive-logout-link");
        logoutLinks.each(function(action, link) {
            getEl(link).addListener("click", action);
        }.bind(logoutLinks, org.jive.spank.control.actions.logout));
    },
    doConnect: function(username, password, server, viewListeners) {
console.log('doConnect');    
        window.connection = new XMPPConnection("/http-bind/", server,
                new org.jive.spank.control.ConnectionListener(username(), password(),
                        viewListeners));
        connection.connect();
    },
    doLogout: function() {
        var presence = new XMPP.Presence();
        presence.setType("unavailable");
        connection.logout(presence);
    },
	onBeforeUnload: function(event) {
		if (typeof window.rosterWindow == "undefined") {
            return;
        }
		event.returnValue = "Leaving this page will disconnect you from Sparkweb.";
		Event.stop(event);
		return "Leaving this page will disconnect you from Sparkweb.";
	},
    onUnload: function(event) {
        if (typeof window.rosterWindow == "undefined") {
            return;
        }
        org.jive.spank.control.doLogout();
        return true;
    },
    doRegistration: function() {
        window.accountDialog = new jive.spank.dialog.CreateAccount(doRegistrationValidation);
    },
    doRegistrationValidation: function(fields) {

    },
    windows: {}
}

Event.observe(window, 'beforeunload', org.jive.spank.control.onBeforeUnload, false);
Event.observe(window, 'unload', org.jive.spank.control.onUnload, false);

org.jive.spank.control.ConnectionListener = function(username, password, viewListeners) {
    this.username = username;
    this.password = password;
    this.viewListeners = viewListeners;
    viewListeners.onConnecting();
}

org.jive.spank.control.ConnectionListener.prototype = {
    connectionSuccessful: function(connection) {
        window.chatManager = new org.jive.spank.chat.Manager(connection);
        window.chatSessionListener = new org.jive.spank.chat.ChatSessionListener(chatSessionCreated,
                chatSessionClosed);
        chatManager.addChatSessionListener(chatSessionListener);

        window.muc = new org.jive.spank.muc.Manager(connection, chatManager);

        console.debug("Connection successfully established.");
        connection.login(this.username, this.password, "sparkweb");
        this.password = undefined;
    },
    connectionFailed: function() {
        this.password = undefined;
        this.viewListeners.onError();
    },
    connectionClosed: function(closedConnection, error) {
        this._cleanUp(closedConnection, error);
        if (error) {
            this.viewListeners.onError("Your connection to the server has closed, unexpectedly");
        }
        else {
            this.viewListeners.onDisconnected();
        }
    },
    _cleanUp: function(closedConnection, error) {
        destroyAllChatWindows();
        
        if (window.rosterWindow) {
            window.rosterWindow.destroy();
            window.rosterWindow = undefined;
        }
        window.presenceManager = undefined;
        window.rosterManager = undefined;
        window.mucController = undefined;
        
        if(window.searchController) {
            window.searchController.destroy();
            window.searchController = undefined;            
        }

        window.connection = undefined;
        window.chatManager = undefined;
        
        if (window.contactMonitor) {
            window.contactMonitor.destroy();
            window.contactMonitor = undefined;
        }
        window.mucController = undefined;
        window.muc = undefined;
    },
    authenticationSuccessful: function(connection) {
        window.contactMonitor = new org.jive.spank.control.ContactMonitor();
        window.presenceManager = new org.jive.spank.presence.Manager(connection, null, "manual");
        window.presenceManager
                .addPresenceListener(contactMonitor.handlePresence.bind(contactMonitor));
        window.rosterManager = new org.jive.spank.roster.Manager(connection,
                contactMonitor._handleRoster.bind(contactMonitor)
                        .createSequence(this.viewListeners.onConnected), presenceManager);

        window.mucController = new org.jive.spank.control.MucController(muc);
        window.mucController.init();

        window.searchController = new org.jive.spank.control.SearchController("user-search",
                "user-search-submit", org.jive.spank.search.getManager(connection));
        window.searchController.init();

        org.jive.spank.x.chatstate.getManager(chatManager)
                .addStateListener(contactMonitor.handleState.bind(contactMonitor));

        $$(".jive-username").each(function(username, usernameEl) {
            usernameEl.innerHTML = username;
        }.bind(null, connection.username));
                
        getChatWindow("chattest");
        
        getEl('myAvatar').dom.innerHTML = '<img height="48" class="avatar" src="chat/images/sparkweb-avatar.png" />';
    },
    authenticationFailed: function(failedConnection, error) {
        this._cleanUp();
        this.viewListeners.onFailedAuthentication();
    },
    packetsReceived: function() {
        if (typeof window.rosterWindow != "undefined") {
            rosterWindow.beginUpdate();
        }
    },
    packetsProcessed: function() {
        if (typeof window.rosterWindow != "undefined") {
            rosterWindow.endUpdate();
        }
    }
}

org.jive.spank.control.ContactMonitor = function() {

}

org.jive.spank.control.ContactMonitor.prototype = {
    _handleRoster: function(roster) {
        window.rosterWindow = spank.loadComponent("roster");
        rosterWindow.addTab("Contacts");
        rosterWindow.setRoster(roster.getRoster());
        rosterWindow.roster.addListener("contactdblclicked", doOpenContact);
        rosterWindow.roster.addListener("contactrightclicked", this._showContextMenu.bind(this));
        rosterWindow.setUserInfo(connection.username, 'Available');

        enableEmoticons();
        enableAutolinking();

        rosterWindow.addControl("addcontact", {
            events: {
                click: rosterWindow.showAddContact.createDelegate(rosterWindow, [rosterWindow])
            },
            identifier:'button-addcontact',
            tooltip: 'Add Contact'
        });

        window.mucControl = rosterWindow.addControl("muc", {
            events: {
                click: mucController.handleMUCChooser.createDelegate(mucController)
            },
            identifier: 'button-groupchat',
            tooltip: 'Conferences'
        });
        window.mucControl.enable();

        rosterWindow.addControl("startchat", {
            events: {
                click: jive.spank.dialog.StartChat.createDelegate(this, [doOpenContact])
                
            },
            identifier: 'button-startchat',
            tooltip: 'Start Chat'
        });

        rosterWindow.addListener('changestatus', function(window, mode, status) {
            var presence = new XMPP.Presence();
            presence.setMode(mode);
            presence.setStatus(status);
            presenceManager.sendPresence(presence);
            window.changeUserStatus(mode, status);
        });
        rosterWindow.addListener('addcontact', this
                .handleAddContact.bind(contactMonitor));
        rosterWindow.addListener('acceptsubscription', this
                .handleAcceptSubscription.bind(contactMonitor));
        rosterWindow.addListener('denysubscription', this
                .handleDenySubscription.bind(contactMonitor));
        rosterWindow.addListener('removecontact', this
                .handleRemoveContact.bind(contactMonitor));

        rosterWindow.addListener('close', org.jive.spank.control.doLogout);
        rosterWindow.show();
        rosterManager.addRosterListener(this);
    },
    _initContactContextMenu: function() {
        var actions = [{name: "Start Chat", action: this._startChatRosterContact.bind(this)},
        {name: "Rename Contact", action: this._renameRosterContact.bind(this)},
        {name: "Remove Contact", action: this._removeRosterContact.bind(this)}];
        this.contactContextMenu = new jive.spank.menu.ContactContext(rosterWindow, actions);
    },
    _showContextMenu: function(roster, contact, x, y) {
        if(!this.contactContextMenu) {
            this._initContactContextMenu();
        }
        this.selectedContact = contact;
        this.contactContextMenu.show(x, y);
    },
    _startChatRosterContact: function() {
        doOpenContact(rosterWindow.roster, this.selectedContact.jid);
    },
    _renameRosterContact: function() {
        rosterWindow.showRename(this.selectedContact);
    },
    _removeRosterContact: function() {
        rosterWindow.showRemove(this.selectedContact);
    },
    handlePresence: function(presencePacket) {
        var presence;
        if (presencePacket.getType() == "subscribe") {
            this.handleSubscription(presencePacket.getFrom());
            return;
        }
        else {
            presence = this.getMode(presencePacket);
        }
        var jid = presencePacket.getFrom().toBareJID();
        var currentStatus = rosterWindow.getContactStatus(jid);
        if (currentStatus && currentStatus == "composing") {
            return;
        }
        rosterWindow.changeContactStatus(jid, presence.mode, presence.status);
    },
    handleState: function(jid, state, isMUC) {
        var session = chatManager.getSession(jid);
        var jidString;
        if (session) {
            jidString = session.getJIDString();
        }
        else if (isMUC) {
            jidString = jid.toString();
        }
        else {
            jidString = jid.toBareJID();
        }
        var contact = getContact(jidString);
        if (!contact || !contact.changeStatus) {
            return;
        }
        if (state == "composing") {
            contact.changeStatus(state);
        }
        else {
            var presence = this.getMode(getContactPresence(jid));
            contact.changeStatus(presence.mode, presence.status);
        }
    },
    handleAddContact: function(window, jid, nick, group) {
        rosterManager.addEntry(new XMPP.JID(jid), nick, new Array(group));
    },
    handleRemoveContact: function(window, jid) {
        rosterManager.removeEntry(new XMPP.JID(jid));
    },
    onAdded: function(rosterItems) {
        for (var i = 0; i < rosterItems.length; i++) {
            var rosterItem = rosterItems[i];
            this.addContact(rosterItem);
        }
    },
    addContact: function(rosterItem) {
        var groups = rosterItem.getGroups();
        var jid = rosterItem.getJID().toString();
        var presencePacket = presenceManager.getPresence(rosterItem.getJID());
        var status;
        if (presencePacket) {
            status = this.getMode(presencePacket).mode;
        }
        else {
            status = "pending"
        }
        var contact = {
            getJID: function () {
                return jid
            },
            getName: function() {
                return (rosterItem.getName()
                        ? rosterItem.getName() : rosterItem.getJID().toString())
            },
            status: status
        };
        rosterWindow.addContact(contact, (groups[0] ? groups[0] : "Unfiled"));
    },
    onUpdated: function(rosterItems) {
        for (var i = 0; i < rosterItems.length; i++) {
            var rosterItem = rosterItems[i];
            rosterWindow.removeContact(rosterItem.getJID().toString());
            this.addContact(rosterItem);
        }
    },
    onRemoved: function(rosterItems) {
        for (var i = 0; i < rosterItems.length; i++) {
            var rosterItem = rosterItems[i];
            rosterWindow.removeContact(rosterItem.getJID().toString());
        }
    },
    getMode: function(presencePacket) {
        var mode;
        var status;
        if (!presencePacket) {
            return {
                mode: "unavailable",
                status: null
            }
        }
        switch (presencePacket.getType()) {
            case "available":
                mode = presencePacket.getMode();
                if (!mode) {
                    mode = "available";
                }
                status = presencePacket.getStatus();
                break;
            default:
                mode = "unavailable";
                break;
        }
        return {
            mode: mode,
            status: status
        };
    },
    handleSubscription: function(from) {
        if (!rosterManager._users[from.toBareJID()]) {
            rosterWindow.showSubscriptionRequest(from.toString(), from.getNode());
        }
        else {
            this.handleAcceptSubscription(null, false, from.toBareJID())
        }
    },
    handleAcceptSubscription: function(dialog, shouldAddToContact, jid, nick, group) {
        var presence = new XMPP.Presence(new XMPP.JID(jid));
        presence.setType("subscribed");
        connection.sendPacket(presence);

        if (shouldAddToContact) {
            this.handleAddContact(dialog, jid, nick, group);
        }
    },
    handleDenySubscription: function(dialog, shouldAddToContact, jid, nick, group) {
        var presence = new XMPP.Presence(new XMPP.JID(jid));
        presence.setType("unsubscribed");
        connection.sendPacket(presence);
    },
    destroy: function() {
        if (this.contactContextMenu) {
            this.contactContextMenu.destroy();
            delete this.contactContextMenu;
        }
    }
}

org.jive.spank.control.MucController = function(muc) {
    this.muc = muc;
    this.conferenceServers = new Array();  
    this.conferenceServers.push("conference." + window.connection.domain);
    
}

org.jive.spank.control.MucController.prototype = {
    init: function() {
        this.muc.addInvitationsListener(this.handleInvitation.bind(this));
        this.muc.getConferenceServers(function(server) {
            window.mucControl.enable();
            this.conferenceServers.push(server);
        }.bind(this));        
    },
    destroy: function() {
        this.conferenceServers = undefined;
        this.muc = undefined;
    },
    handleInvitation: function(invite) {
        var jid = new XMPP.JID(invite["from"]);
        var session = chatManager.getSession(jid);
        if (!session) {
            session = chatManager.createSession(jid);
        }
        var contact = getContact(session.getJIDString());
        var invitationGUI = new jive.spank.chat.MucInvitation({
            contactJID: jid,
            name: contact.name,
            chatname: invite["room"],
            jid: ''
        });
        invitationGUI.addListener('accepted', this.handleInvitationAccept.bind(this));
        invitationGUI.addListener('declined', this.handleInvitationDecline.bind(this));
        addMessage(contact.jid, contact.name, invitationGUI);
    },
    handleInvitationAccept: function(chatWindow, config) {
        joinMUC(chatWindow, config.chatname.toString(),
                new XMPP.JID(config.chatname.toString()).getNode());
    },
    handleInvitationDecline: function(chatWindow, config) {
        this.muc.declineInvitation(config.contactJID, config.chatname);
    },
    handleNameChange: function(window, roomJID, newName) {
        var room = this.muc.getRoom(new XMPP.JID(roomJID));
        room.changeNickname(newName);
    },
    handleMUCChooser: function() {
        getChatWindow("chattest").preAddMUCChooser();
        var callback = function(mucManager, roomInfoCallback, roomList) {
            mucManager.retrieveRoomsInfo(roomList, roomInfoCallback);
        }.bind(this, this.muc, this.roomInfoCallback);
        this.muc.retrieveRooms(this.conferenceServers[0], callback);
    },
    roomInfoCallback: function(roomList) {
        getChatWindow("chattest").addChooseMUCTab(roomList);
    }
}

org.jive.spank.control.SearchController = function(embeddedSearchFormId, embeddedSearchInputId,
                                                   searchManager)
{
    this.searchManager = searchManager;
    this.embeddedSearchForm = getEl(embeddedSearchFormId);
    this.embeddedSubmit = getEl(embeddedSearchInputId);
    this.searchServices = new Array();
}

org.jive.spank.control.SearchController.prototype = {
    init: function() {
        this.searchManager.getSearchServices(function(searchManager, service) {
            searchManager.getSearchForm(service, this._processSearchForm.bind(this));
        }.bind(this, this.searchManager));
    },
    _processSearchForm: function(service, xDataSearchForm) {
        this.searchServices.push({service: service, searchForm: xDataSearchForm});
        var requiredFields = this.getRequiredFields(service);
        if(requiredFields.length == 1 && requiredFields[0].type == XMPP.XData.FieldType.textSingle)
        {
            var processor = new org.jive.spank.DataFormProcessor(xDataSearchForm);
            this.embeddedSubmit.dom.disabled = false;
            this.embeddedSubmit.addListener("click", this._handleUserSearch.bind(this,
                    service, processor));
        }
    },
    getRequiredFields: function(service) {
        return this._getDataForm(service).getFields(true);
    },
    _getDataForm: function(service) {
        return this._getSearchService(service).searchForm;
    },
    _getSearchService: function(service) {
        return this.searchServices.detect(function(detectingService, service) {
            return service.service.equals(detectingService);
        }.bind(null, service))
    },
    _handleUserSearch: function(service, dataFormProcessor, e) {
        Event.stop(e);
        if(this.searchDialog  && this.searchDialog.isVisible()) {
            this.searchDialog.destroy(true);
        }
        var userSearch = new jive.spank.dialog.UserSearch(rosterWindow,
                dataFormProcessor.getInstructions(), dataFormProcessor.parseForm());
        userSearch.addListener("selected", this._handleSearchUserSelected.bind(this))
        userSearch.addListener("search", this._handleDialogSearch.bind(this, service))
        this.submitSearch(userSearch, service, this.embeddedSearchForm.dom);
        userSearch.show();
        this.searchDialog = userSearch;
    },
    _handleSearchUserSelected: function(searchDialog, jid, name) {
        getChatWindow("chattest").getContactTab(getContact(jid, name));
    },
    _handleDialogSearch: function(service, searchDialog, searchFormId) {
        this.submitSearch(searchDialog, service, searchFormId);
    },
    submitSearch: function(userSearchDialog, service, htmlForm) {
        var fields = Form.getElements(htmlForm);
        var answerForm = this._getDataForm(service).getAnswerForm();
        for(var i = 0; i < fields.length; i++) {
            var htmlField = fields[i];
            if(htmlField.id == this.embeddedSubmit.id || htmlField.type == "submit") {
                continue;
            }

            var answer = new Array();
            var value = Form.Element.getValue(htmlField);
            if(answerForm.getField(htmlField.name).type == "boolean") {
                if(value && value != "") {
                    value = "1";
                }
                else {
                    value = "0";
                }
            }
            answer.push(value);
            answerForm.setAnswer(htmlField.name, answer);
        }

        this.searchManager.submitSearch(service, answerForm,
                this._handleSearchResponse.bind(this, userSearchDialog));
    },
    _handleSearchResponse: function(userSearchDialog, searchResults) {
        if(searchResults.length <= 1) {
            return;
        }
        searchResults.shift();
        var processedSearchResults = searchResults.collect(function(searchResult) {
            return searchResult.collect(function(searchResult) {
                return searchResult.value
            });
        });
        userSearchDialog.updateData(processedSearchResults);
    },
    destroy: function() {
        if(this.searchDialog && this.searchDialog.isVisible()) {
            this.searchDialog.destroy(true);
        }
        this.searchDialog = undefined;
        this.embeddedSubmit.removeAllListeners();
        Form.reset(this.embeddedSearchForm.id);
    }
}

var rosterWindow;

org.jive.spank.control.actions = {
    logout: function(e) {
        org.jive.spank.control.doLogout();
        Event.stop(e);
    },
    createConferenceWindow: function(chatWindow, tabChooserId) {
        var createConference = new jive.spank.dialog.CreateConference(chatWindow);
        createConference.show();
        createConference.focus();

        createConference.addListener("muccreated", org.jive.spank.control.actions.createConference
                .createCallback(createConference, tabChooserId));
    },
    createConference: function(createConference, tabChooserId) {
        var values = createConference.getValues();
        var configuration = {};
        if (values.isPrivate) {
            configuration["muc#roomconfig_passwordprotectedroom"] = "1";
            configuration["muc#roomconfig_roomsecret"] = values.password;
        }
        configuration["muc#roomconfig_roomname"] = values.name;
        if (values.isPermanent) {
            configuration["muc#roomconfig_persistentroom"] = "1";
        }
        if (values.topic && values.topic != '') {
            configuration["muc#roomconfig_roomdesc"] = values.topic;
        }
        var roomAddress = new XMPP.JID(values.name + "@" + mucController
                .conferenceServers[0].toString());
        var room = muc.createRoom(roomAddress);
        getChatWindow("chattest").preAddMUC({name: values.name, jid: roomAddress}, tabChooserId);
        var joinCallback = {
            onSuccess: function(tabChooserId, address, name) {
                var tab = getChatWindow("chattest").addMUC({
                    jid: address, name: name
                }, tabChooserId, rosterWindow);
                // load the occupants
                var occupants = room.getOccupants();
                for (var i = 0; i < occupants.length; i++) {
                    mucOccupantHandler(occupants[i]);
                }
                tab.roster.addListener("contactdblclicked", doOpenContact);
            }.createCallback(tabChooserId, roomAddress, values.name)
        };
        var nick = connection.username;
        room.create(nick, configuration, joinCallback, mucMessageHandler, mucOccupantHandler);
        createConference.hide();
    }
}

function getChatWindow(id) {
    var chatWindow;
    if (org.jive.spank.control.windows[id]) {
        chatWindow = jive.spank.chat.ChatWindow.getWindow(org.jive.spank.control.windows[id]);
    }

    if (!chatWindow) {
        chatWindow = jive.spank.chat.ChatWindow.createWindow();
        org.jive.spank.control.windows[id] = chatWindow.id;
        initializeChatWindow(chatWindow);
    }
    if (!chatWindow.isVisible()) {
        chatWindow.show();
    }
    return chatWindow;
}

function destroyAllChatWindows() {

    if (org.jive.spank.control.windows) {
    
	    for (var id in org.jive.spank.control.windows) {
		jive.spank.chat.ChatWindow.destroyWindow(org.jive.spank.control.windows[id]);
	    }
    }


    delete org.jive.spank.control.windows;    
    org.jive.spank.control.windows = {};


    if (typeof inputMonitor != "undefined") {
        inputMonitor.destroy();
        window.inputMonitor = undefined;
    }   
}

function initializeChatWindow(dialog) {
    dialog.addListener("message", handleMessage);
    dialog.addListener("mucdblclicked", joinMUC);
    dialog.addListener("tabclosed", handleTabClosed);
    dialog.addListener("mucinvitation", handleMUCInvite);
    dialog.addListener("changenameinmuc", mucController.handleNameChange.bind(mucController));
    dialog.addListener("createmuc", org.jive.spank.control.actions.createConferenceWindow);

    if (window.inputMonitor) {
        window.inputMonitor.destroy();
    }
    window.inputMonitor = new org.jive.spank.control.InputMonitor();
    inputMonitor.init();
    dialog.addListener("input", inputMonitor.handleUserInput.bind(inputMonitor));
}

function doOpenContact(roster, contact) {
    var jid;
    if (!(contact.jid instanceof XMPP.JID)) {
        jid = new XMPP.JID(contact.jid);
    }
    else {
        jid = contact.jid;
    }
    var session = chatManager.getSession(jid);
    if (!session) {
        session = chatManager.createSession(jid);
    }
    contact.jid = session.getJIDString();
    var dialog = getChatWindow("chattest");
    dialog.getContactTab(contact, true);
}

function chatSessionCreated(manager, session) {
    console.debug("Chat session created.");
    session.addListener(chatListener);

    var contactObj = getContact(session.getJIDString());

    var dialog = getChatWindow("chattest");
    dialog.getContactTab(contactObj);
    org.jive.spank.x.chatstate.getManager(chatManager).setCurrentState("active", session.getJID());
}

function getContact(jid, name) {
    var bare = new XMPP.JID(jid).getBareJID();
    var contactObj;
    if (muc.getRoom(bare)) {
        var roster = getChatWindow("chattest").tabs[bare].roster;
        contactObj = roster.findContact(jid);
    }
    else {
        contactObj = jive.spank.roster.Contact.find(rosterWindow.roster, jid);
    }
    if (!contactObj) {
        jid = new XMPP.JID(jid);
        contactObj = {
            jid: jid.toString(),
            name: (!name ? jid.getNode() : name),
            status: "unavailable"
        }
    }
    return contactObj;
}

function getContactPresence(jid) {
    var room = muc.getRoom(jid.getBareJID());
    var presence;
    if (room) {
        presence = room.presenceManager;
    }
    else {
        presence = presenceManager;
    }
    return presence.getPresence(jid);
}

function handleMessage(jid, messageBody) {
    jid = new XMPP.JID(jid);
    var type = getChatWindow("chattest").tabs[jid.toString()].type;
    var username;
    if (type == "chat") {
        var session = chatManager.getSession(jid);
        if (!session) {
            session = chatManager.createSession(jid);
        }
        var message = org.jive.spank.x.chatstate.getManager(chatManager)
                .setCurrentState("active", session.getJID());
        session.sendMessage(messageBody, message);
        username = connection.username;
    }
    else if (type == "muc-room") {
        var room = muc.getRoom(jid);
        var message = org.jive.spank.x.chatstate.getManager(chatManager)
                .setCurrentState("active", jid);
        room.sendMessage(messageBody, message);
        username = room.nickname;
    }
    addMessage(jid, username, messageBody, true);
}

org.jive.spank.control.InputMonitor = function() {
    this.composingTimeout = 3000;
    this.inputState = {};
}

org.jive.spank.control.InputMonitor.prototype = {
    init: function() {
        this.inputMonitor = new PeriodicalExecuter(this.monitorFunction.bind(this), 2);
    },
    monitorFunction: function() {
        var time = new Date().getTime();
        for (var inputJID in this.inputState) {
            var input = this.inputState[inputJID];
            if (input.state == "composing" && (time - input.lastInput) >= this.composingTimeout) {
                delete this.inputState[inputJID];
                this.updateState(inputJID, "active");
            }
        }
    },
    handleUserInput: function(jid) {
        if (this.inputState[jid] && this.inputState[jid].state == "composing") {
            this.inputState[jid].lastInput = new Date().getTime();
            return;
        }
        if (!this.inputState[jid]) {
            this.inputState[jid] = {};
        }

        this.inputState[jid].state = "composing";
        this.inputState[jid].lastInput = new Date().getTime();
        this.updateState(jid, "composing");

    },
    updateState: function(jid, newState) {
        console.debug("%s sent to %s", newState, jid);
        jid = new XMPP.JID(jid);
        var session = chatManager.getSession(jid);
        var room;
        if (session) {
            jid = session.getJID();
        }
        else {
            room = muc.getRoom(jid);
        }
        var message = org.jive.spank.x.chatstate.getManager(chatManager)
                .setCurrentState(newState, jid, null, room != null);
        if (message) {
            connection.sendPacket(message);
        }
    },
    destroy: function() {
        this.inputMonitor.stop();
        this.inputState = {};
    }
}
function addMessage(jid, name, msg, isLocal, time) {
    getChatWindow("chattest").getContactTab({jid: jid, name: name});
    var msgObj = msg;
    if (typeof msg == 'string') {
        msgObj = {body: msg, isLocal: isLocal, time: time};
    }
    getChatWindow("chattest").addMessage(jid, name, msgObj);
}

function joinMUC(chatWindow, address, name, tabChooserId, password, shouldJoinAgain) {
    var roomAddress = new XMPP.JID(address);
    var room = muc.getRoom(roomAddress);
    if (room || (getChatWindow("chattest").getTabByJID(address) && !shouldJoinAgain)) {
        getChatWindow("chattest").getTabByJID(address).activate();
        return;
    }
    // check to see if we are already in the process of joining this room
    if (!getChatWindow("chattest").getTabs().items['jive-tab-' + address + '-spinner']) {
        chatWindow.preAddMUC({name: name, jid: address}, tabChooserId);
    }
    if (!room) {
        room = muc.createRoom(roomAddress);
    }
    if (!name) {
        name = roomAddress.getNode();
    }
    var joinCallback = {
        onSuccess: function() {
            var tab = getChatWindow("chattest").addMUC({
                jid: address, name: name
            }, tabChooserId, rosterWindow);
            // load the occupants
            var occupants = room.getOccupants();
            for (var i = 0; i < occupants.length; i++) {
                mucOccupantHandler(occupants[i]);
            }
            tab.roster.addListener("contactdblclicked", doOpenContact);
        },
        onError: function(packet) {
            if (packet.getError() == '401') {
                getChatWindow("chattest").showMUCPassword({jid: address, name: name},
                        null, function(password) {
                    if (!password) {
                        getChatWindow("chattest").removeMUCSpinner(address);
                    }
                    else {
                        joinMUC(chatWindow, address, name, tabChooserId, password, true);
                    }
                });
                return;
            }
            chatWindow.removeMUCSpinner(address);
        }
    }
    var nick = connection.username;
    room.join(nick, password, joinCallback, mucMessageHandler, mucOccupantHandler);
}

var mucMessageHandler = {
    messageReceived: function(message) {
        var from = message.getFrom();
        var room = from.toBareJID();
        var nick = from.getResource();

        var body = message.getBody();
        var isLocal = muc.getRoom(room).nickname.toLowerCase() == nick;
        var time = message.getExtension("x", "jabber:x:delay");
        if ((time || !isLocal) && body) {
            if (time) {
                time = new XMPP.DelayInformation(time).getDate()
                        .toLocaleTimeString();
            }
            if (nick) {
                addMessage(room, nick, body.body, isLocal, time);
            }
            else {
                getChatWindow("chattest").addStatusMessage(room, body.body);
            }
        }
    },
    invitationDeclined: function(decline) {
        var jid = decline.from;
        var contact = getContact(jid);
        var name = jid;
        if (contact) {
            name = contact.name;
        }
        getChatWindow("chattest").addStatusMessage(decline.room.toString(),
                name + " has declined the invitation to join the room.")
    },
    subjectUpdated: function(room, updater, newSubject) {
        getChatWindow("chattest").setSubject(newSubject, room.jid.toString());
    }
}

function mucOccupantHandler(occupant) {
    var room = occupant.getRoom();
    var mucRoom = muc.getRoom(new XMPP.JID(room));
    if (!mucRoom || !mucRoom.isJoined) {
        return;
    }
    var jid = occupant.presence.getFrom();
    var tab = getChatWindow("chattest").tabs[room];
    if (!tab) {
        return;
    }
    var participants = tab.participants;
    if (!participants) {
        return;
    }

    var contact = participants.getContactByJID(jid.toString());
    var mode;
    var status;
    switch (occupant.presence.getType()) {
        case "available":
            mode = occupant.presence.getMode();
            if (!mode) {
                mode = "available";
            }
            status = occupant.presence.getStatus();
            break;
        default:
            mode = "unavailable";
            break;
    }
    if (!contact && mode != "unavailable") {
        contact = participants.addContact({
            jid: jid,
            getJID: function() {
                return this.jid.toString()
            },
            status: mode,
            getName: function() {
                return occupant.getNick()
            }
        });
        getChatWindow("chattest").addStatusMessage(room,
                occupant.getNick() + " has joined the room.");
    }
    else if (contact && mode == "unavailable") {
        contact.changeStatus(mode);
        participants.removeContact(jid.toString());
        getChatWindow("chattest").addStatusMessage(room,
                occupant.getNick() + " has left the room.");
    }
    else if (contact) {
        contact.changeStatus(mode);
    }
}

function handleTabClosed(roomObj, tab) {
    switch (tab.type) {
        case "muc-room":
            muc.getRoom(roomObj.jid).leave();
            break;
        case "chat":
            var session = chatManager.getSession(new XMPP.JID(roomObj.jid.toString()));
            if (session) {
                chatManager.closeChatSession(session);
            }
            break;
    }
}

function handleMUCInvite(chatWindow, inviteeJID, roomJID) {
    muc.getRoom(roomJID).invite(new XMPP.JID(inviteeJID));
    var contact = getContact(inviteeJID);

    var message = contact.name + " has been invited to join the room.";
    chatWindow.addStatusMessage(roomJID, message);
}

function chatSessionClosed(manager, session) {
    console.debug("Chat session closed.");
}

var chatListener = {
    messageRecieved: function(session, message) {
        if (!message.getBody() || message.getBody().body == "") {
            return;
        }
        var name = getChatWindow("chattest").tabs[session.getJIDString()].contact.name;
        addMessage(session.getJIDString(), name, message.getBody().body);
    }
}

function enableEmoticons() {
    var smilies = [
            ['angry',         /&gt;:o|&gt;:-o|&gt;:O|&gt;:-O/g ],
            ['confused',     /\?:\|/g ],
            ['cool',         /B-\)|8-\)/g ],
            ['cry',         /:\'\(/g ],
            ['devil',         /\]:\)/g ],
            ['grin',         /:-D|:D/g ],
            ['happy',         /:-\)|:\)/g ],
            ['laugh',         /:\^0/g ],
            ['love',         /:x/g ],
            ['mischief',     /;\\/g ],
            ['sad',         /:-\(|:\(/g ],
            ['silly',         /:-p|:-P|:P|:p/g ],
            ['wink',         /;-\)|;\)/g ]
            ];
    smilies.each(function(smileyArr) {

        jive.spank.chat.Filter.add(smileyArr[0], smileyArr[1],
                '<img src="chat/images/emoticons/' + smileyArr[0] + '.gif" alt="" />'
                );
    });
}

function enableAutolinking() {
    jive.spank.chat.Filter.add('uri', /[^\"\']?\b(\w+?:\/\/[^\s+\"\<\>]+)/ig,
            '<a href="$1" target="_blank">$1</a>');
    jive.spank.chat.Filter.add('webaddress', /(\s|^)(www\.[^\s+\"\<\>]+)/ig,
            '<a href="http://$2" target="_blank">$2</a>');
}

function doUserSearch() {
    var userSearch = new jive.spank.dialog.UserSearch(rosterWindow);
    userSearch.show();
}

org.jive.spank.DataFormProcessor = function(dataForm) {
    this.dataForm = dataForm;
}

org.jive.spank.DataFormProcessor.prototype = {
    getInstructions: function() {
        var instructions = this.dataForm.getInstructions();
        return (!instructions ? "" : instructions);
    },
    parseForm: function(parseRequiredFields, formId, submitName) {
        var fields = this.dataForm.getFields(parseRequiredFields);
        var source = new Array();
        var multiple = false;
        for (var i = 0; i < fields.length; i++) {
            var fieldName = fields[i].variable;
            var field = fields[i];
            //noinspection FallthroughInSwitchStatementJS
            switch (field.type) {
                case "boolean":
                    source.push(this.createBooleanHTML(fieldName, field));
                    break;
                case "fixed":
                    source.push(this.createFixedHTML(fieldName, field));
                    break;
                case "jid-multi":
                case "list-multi":
                    multiple = true;
                case "jid-single":
                case "list-single":
                    source.push(this.createListHTML(fieldName, field, multiple));
                    break;
                case "text-multi":
                    multiple = true;
                case "text-single":
                    source.push(this.createTextHTML(fieldName, field, multiple));
                    break;
            }
        }

        if(formId) {
            source.splice(0, 0, '<form id="' + formId + '">');
            source.push('<input type="submit" id="' + formId + '-submit" value="');
            source.push(submitName);
            source.push('"></input>');
            source.push('</form>');
        }

        return source;
    },
    createBooleanHTML: function(fieldName, field) {
        var checked = field.values[0] && field.values[0] == "1";
        return '<p><input name="' + fieldName + '" type="checkbox" value="'
                + field['fieldLabel'] + '"' + (checked ? ' checked' : '') + ' />'
                + field['fieldLabel'] + '</p>';
    },
    createFixedHTML: function(fieldName, field) {
        return '<p>' + field.value[0] + '</p>';
    },
    createListHTML: function(fieldName, field, isMultiSelect) {
        var src = '<p>' + field['fieldLabel'] + ' <select name="' + fieldName + '"'
                + (isMultiSelect ? ' multiple' : '') + '>';
        for (var i = 0; i < field.values.length; i++) {
            src += '<option value="' + field.values[i] + '"/>';
        }
        return src;
    },
    createTextHTML: function(fieldName, field) {
        return '<p>' + field['fieldLabel'] + ' <input type="text" name="' +
               fieldName + '"></p>';
    }
}

YAHOO.ext.EventManager.addListener(window, "load", org.jive.spank.control.init);


