(function() {
  // ================================ Constants ================================
  var CONTEXT_2D_ATTRIBUTES = [
    'fillStyle',
    'font',
    'globalAlpha',
    'globalCompositeOperation',
    'lineCap',
    'lineDashOffset',
    'lineJoin',
    'lineWidth',
    'miterLimit',
    'shadowBlur',
    'shadowColor',
    'shadowOffsetX',
    'shadowOffsetY',
    'strokeStyle',
    'textAlign',
    'textBaseline'
  ];

  var NUMBER_PRECISION = 1000;

  // ================================ Utils ================================

  function each(arr, func) {
    var len = arr.length,
        n;

    for (n=0; n<len; n++) {
      func(n, arr[n]);
    }
  }

  function isFunction(func) {
    return func && {}.toString.call(func) === '[object Function]';
  }
  
  // ================================ Canteen Class ================================

  /**
   * Canteen Constructor
   * @constructor
   */
  var Canteen = function(context) {
    var that = this;

    this._stack = [];
    this.context = context;

    // add observable attributes
    each(CONTEXT_2D_ATTRIBUTES, function(n, key) {
      Object.defineProperty(that, key, {
        get: function() {
          return that.context[key];
        },
        set: function(val) {
          that._pushAttr(key, val);
          that.context[key] = val;
        }
      }); 
    });
  };

  // Canteen methods 
  Canteen.prototype = { 
    /**
     * get a stack of operations
     * @method stack
     * @param {Object} config
     * @param {String} [config.loose=false] - Canteen returns stacks in two different modes, strict and loose.
     *  strict mode returns method calls with arguments, and property name changes with values.  Loose mode
     *  only returns method calls and property name changes
     * @returns {Array}
     * @public
     */  
    stack: function(config) {
      var loose = config && config.loose,
          ret = [];

      if (loose) {
        each(this._stack, function(n, el) {
          ret.push(el.method || el.attr);
        });
      } 
      else {
        ret = this._stack;
      }

      return ret;
    },
    /**
     * serialize a stack into a string
     * @method json
     * @param {Object} config
     * @param {String} [config.loose=false] - Canteen returns stacks in two different modes, strict and loose.
     *  strict mode returns method calls with arguments, and property name changes with values.  Loose mode
     *  only returns method calls and property name changes
     * @returns {String}
     * @public
     */  
    json: function(config) {
      return JSON.stringify(this.stack(config));
    },
    /**
     * convert a stack into a small hash string for easy comparisons
     * @method hash
     * @param {Object} config
     * @param {String} [config.loose=false] - Canteen returns stacks in two different modes, strict and loose.
     *  strict mode returns method calls with arguments, and property name changes with values.  Loose mode
     *  only returns method calls and property name changes
     * @public
     * @returns {String}
     */  
    hash: function(config) {
      return Canteen.md5(this.json(config));
    },
    /**
     * clear the stack
     * @method clean
     * @public
     */  
    clean: function() {
      this._stack = [];
    },
    /**
     * push instruction method onto the stack
     * @method _pushMethod
     * @param {String} method
     * @param {arguments} args
     * @private
     */
    _pushMethod: function(method, args) {
      var roundedArgs = [],
          len = args.length,
          n, arg;

      for (n=0; n<len; n++) {
        arg = args[n];
        // need to round number values because not all browsers round to the same digit
        // for irrational numbers like PI
        if (typeof arg === 'number') {
          arg = Math.round(arg * NUMBER_PRECISION) / NUMBER_PRECISION;
        }
        roundedArgs.push(arg);
      }

      this._stack.push({
        method: method,
        arguments: Array.prototype.slice.call(roundedArgs, 0)
      }); 

      this._slice();
    },
    /**
     * push instruction attribute onto the stack
     * @method _pushAttr
     * @param {String} attr
     * @param {*} val
     * @private
     */
    _pushAttr: function(attr, val) {
      // need to round number values because not all browsers round to the same digit
      // for irrational numbers like PI
      if (typeof val === 'number') {
        val = Math.round(val * NUMBER_PRECISION) / NUMBER_PRECISION;
      }

      this._stack.push({
        attr: attr,
        val: val
      }); 

      this._slice();
    },
    /**
     * slice the stack if needed.  This means making sure that it doesn't exceed
     *  the STACK_SIZE.  if it does, then shorten the stack starting from the beginning
     * @method _slice
     * @private
     */
    _slice: function() {
      var stack = this._stack,
          len = stack.length,
          exceded = len - Canteen.globals.STACK_SIZE;
      if (exceded > 0) {
        this._stack = stack.slice(exceded);
      }
    }
  }; 

  // generate observable methods and add them to the Canteen prototype
  (function(){
    var proto = CanvasRenderingContext2D.prototype,
      key, val;

    function addMethod(key, val) {
      Canteen.prototype[key] = function() {
        this._pushMethod(key, arguments);
        return this.context[key].apply(this.context, arguments);
      };
    }

    for (key in proto) {
      val = proto[key];
      if (isFunction(val)) {
        addMethod(key, val);
      }    
    }
  })();

  // ================================ Global Config ================================
  /**
   * global config.  You can directly change these values in order to configure Canteen
   * @static
   * @example 
   *  // change stack size to 3000
   *  Canteen.globals.STACK_SIZE = 3000;
   */ 
  Canteen.globals = {
    STACK_SIZE: 10000
  };

  // ================================ Initialization ================================

  // override the canvas context getContext method in order to automatically instantiate
  // a Canteen instance and wrap the native context object
  (function(){
    var origGetContext = HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.getContext = function() {
      var context = origGetContext.apply(this, arguments);

      // if the context already has a canteen instance, then return it
      if (context.canteen) {
        return context.canteen
      }
      // if the context does not have a canteen instance, then instantiate one
      // and return it
      else {
        context.canteen = new Canteen(context);
        return context.canteen;
      }
    }
  })();

  // make the Canteen namespace global so that developers can configure
  // it via Canteen.globals, or override methods if desired
  window.Canteen = Canteen;
})();