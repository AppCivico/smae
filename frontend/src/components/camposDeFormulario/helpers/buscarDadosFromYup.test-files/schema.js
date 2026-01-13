/* eslint-disable no-template-curly-in-string */
export default {
  type: 'object',
  _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
  _whitelistError: '__vue_devtool_undefined__',
  _blacklistError: '__vue_devtool_undefined__',
  _whitelist: {
    list: {
      _custom: {
        type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
      },
    },
    refs: {
      _custom: {
        type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
      },
    },
  },
  _blacklist: {
    list: {
      _custom: {
        type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
      },
    },
    refs: {
      _custom: {
        type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
      },
    },
  },
  exclusiveTests: {},
  deps: [],
  conditions: [],
  tests: [],
  transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">coerce(value)</span>', tooltipText: '<pre>function coerce(value) { if (typeof value === "string") { try {value = JSON.parse(value); } catch (err) {value = null; } } if (this.isType(value)) return value; return null;}</pre>' } }],
  spec: {
    strip: false, strict: false, abortEarly: true, recursive: true, nullable: false, presence: 'optional',
  },
  fields: {
    acompanhamento_tipo_id: {
      type: 'string',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: {},
      deps: [],
      conditions: [],
      tests: [],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; if (Array.isArray(value)) return value; const strValue = value != null && value.toString ? value.toString() : value; if (strValue === objStringTag) return value; return strValue;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Tipo de acompanhamento',
      },
    },
    acompanhamentos: {
      type: 'array',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: {},
      deps: [],
      conditions: [],
      tests: [],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(values)</span>', tooltipText: '<pre>function(values) { if (typeof values === "string") try { values = JSON.parse(values); } catch (err) { values = null; } return this.isType(values) ? values : null;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Encaminhamentos',
      },
      innerType: {
        type: 'object',
        _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
        _whitelistError: '__vue_devtool_undefined__',
        _blacklistError: '__vue_devtool_undefined__',
        _whitelist: {
          list: {
            _custom: {
              type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
            },
          },
          refs: {
            _custom: {
              type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
            },
          },
        },
        _blacklist: {
          list: {
            _custom: {
              type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
            },
          },
          refs: {
            _custom: {
              type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
            },
          },
        },
        exclusiveTests: {},
        deps: [],
        conditions: [],
        tests: [],
        transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">coerce(value)</span>', tooltipText: '<pre>function coerce(value) { if (typeof value === "string") { try {value = JSON.parse(value); } catch (err) {value = null; } } if (this.isType(value)) return value; return null;}</pre>' } }],
        spec: {
          strip: false, strict: false, abortEarly: true, recursive: true, nullable: false, presence: 'optional',
        },
        fields: {
          encaminhamento: {
            type: 'string',
            _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
            _whitelistError: '__vue_devtool_undefined__',
            _blacklistError: '__vue_devtool_undefined__',
            _whitelist: {
              list: {
                _custom: {
                  type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
                },
              },
              refs: {
                _custom: {
                  type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
                },
              },
            },
            _blacklist: {
              list: {
                _custom: {
                  type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
                },
              },
              refs: {
                _custom: {
                  type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
                },
              },
            },
            exclusiveTests: { max: true, min: true, required: true },
            deps: [],
            conditions: [],
            tests: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }, { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }, { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }],
            transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; if (Array.isArray(value)) return value; const strValue = value != null && value.toString ? value.toString() : value; if (strValue === objStringTag) return value; return strValue;}</pre>' } }],
            spec: {
              strip: false, strict: false, abortEarly: true, recursive: true, nullable: false, presence: 'required', label: 'Encaminhamento',
            },
            _mutate: '__vue_devtool_undefined__',
          },
          responsavel: {
            type: 'string',
            _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
            _whitelistError: '__vue_devtool_undefined__',
            _blacklistError: '__vue_devtool_undefined__',
            _whitelist: {
              list: {
                _custom: {
                  type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
                },
              },
              refs: {
                _custom: {
                  type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
                },
              },
            },
            _blacklist: {
              list: {
                _custom: {
                  type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
                },
              },
              refs: {
                _custom: {
                  type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
                },
              },
            },
            exclusiveTests: {},
            deps: [],
            conditions: [],
            tests: [],
            transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; if (Array.isArray(value)) return value; const strValue = value != null && value.toString ? value.toString() : value; if (strValue === objStringTag) return value; return strValue;}</pre>' } }],
            spec: {
              strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Responsável',
            },
          },
          prazo_encaminhamento: {
            type: 'date',
            _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
            _whitelistError: '__vue_devtool_undefined__',
            _blacklistError: '__vue_devtool_undefined__',
            _whitelist: {
              list: {
                _custom: {
                  type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
                },
              },
              refs: {
                _custom: {
                  type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
                },
              },
            },
            _blacklist: {
              list: {
                _custom: {
                  type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
                },
              },
              refs: {
                _custom: {
                  type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
                },
              },
            },
            exclusiveTests: { max: true, min: true },
            deps: [],
            conditions: [],
            tests: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }, { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }],
            transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; value = parseIsoDate(value); return !isNaN(value) ? new Date(value) : invalidDate;}</pre>' } }],
            spec: {
              strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Prazo para encaminhamento',
            },
          },
          prazo_realizado: {
            type: 'date',
            _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
            _whitelistError: '__vue_devtool_undefined__',
            _blacklistError: '__vue_devtool_undefined__',
            _whitelist: {
              list: {
                _custom: {
                  type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
                },
              },
              refs: {
                _custom: {
                  type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
                },
              },
            },
            _blacklist: {
              list: {
                _custom: {
                  type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
                },
              },
              refs: {
                _custom: {
                  type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
                },
              },
            },
            exclusiveTests: { max: true, min: true },
            deps: [],
            conditions: [],
            tests: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }, { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }],
            transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; value = parseIsoDate(value); return !isNaN(value) ? new Date(value) : invalidDate;}</pre>' } }],
            spec: {
              strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Data de realização',
            },
          },
        },
        _nodes: ['prazo_realizado', 'prazo_encaminhamento', 'responsavel', 'encaminhamento'],
        _excludedEdges: [],
        _sortErrors: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(a, b)</span>', tooltipText: '<pre>(a, b) => { return findIndex(keys, a) - findIndex(keys, b); }</pre>' } },
      },
    },
    apresentar_no_relatorio: {
      type: 'boolean',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: {},
      deps: [],
      conditions: [],
      tests: [],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (!this.isType(value)) { if (/^(true|1)$/i.test(String(value))) return true; if (/^(false|0)$/i.test(String(value))) return false; } return value;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Apresentar em relatório',
      },
    },
    cronograma_paralisado: {
      type: 'boolean',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: {},
      deps: [],
      conditions: [],
      tests: [],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (!this.isType(value)) { if (/^(true|1)$/i.test(String(value))) return true; if (/^(false|0)$/i.test(String(value))) return false; } return value;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Cronograma paralisado',
      },
    },
    data_registro: {
      type: 'date',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: { max: true, min: true, required: true },
      deps: [],
      conditions: [],
      tests: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }, { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }, { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; value = parseIsoDate(value); return !isNaN(value) ? new Date(value) : invalidDate;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: false, presence: 'required', label: 'Data do registro',
      },
      _mutate: '__vue_devtool_undefined__',
    },
    detalhamento: {
      type: 'string',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: { max: true },
      deps: [],
      conditions: [],
      tests: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; if (Array.isArray(value)) return value; const strValue = value != null && value.toString ? value.toString() : value; if (strValue === objStringTag) return value; return strValue;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Detalhamento',
      },
    },
    observacao: {
      type: 'string',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: { max: true },
      deps: [],
      conditions: [],
      tests: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; if (Array.isArray(value)) return value; const strValue = value != null && value.toString ? value.toString() : value; if (strValue === objStringTag) return value; return strValue;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Observação',
      },
    },
    participantes: {
      type: 'string',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: { max: true, required: true },
      deps: [],
      conditions: [],
      tests: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }, { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; if (Array.isArray(value)) return value; const strValue = value != null && value.toString ? value.toString() : value; if (strValue === objStringTag) return value; return strValue;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: false, presence: 'required', label: 'Participantes',
      },
      _mutate: '__vue_devtool_undefined__',
    },
    pauta: {
      type: 'string',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: { max: true },
      deps: [],
      conditions: [],
      tests: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; if (Array.isArray(value)) return value; const strValue = value != null && value.toString ? value.toString() : value; if (strValue === objStringTag) return value; return strValue;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Pauta',
      },
    },
    pontos_atencao: {
      type: 'string',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: { max: true },
      deps: [],
      conditions: [],
      tests: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { if (this.isType(value)) return value; if (Array.isArray(value)) return value; const strValue = value != null && value.toString ? value.toString() : value; if (strValue === objStringTag) return value; return strValue;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Pontos de atenção',
      },
    },
    risco: {
      type: 'array',
      _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
      _whitelistError: '__vue_devtool_undefined__',
      _blacklistError: '__vue_devtool_undefined__',
      _whitelist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      _blacklist: {
        list: {
          _custom: {
            type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
          },
        },
        refs: {
          _custom: {
            type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
          },
        },
      },
      exclusiveTests: {},
      deps: [],
      conditions: [],
      tests: [],
      transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(values)</span>', tooltipText: '<pre>function(values) { if (typeof values === "string") try { values = JSON.parse(values); } catch (err) { values = null; } return this.isType(values) ? values : null;}</pre>' } }],
      spec: {
        strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'optional', label: 'Riscos associados',
      },
      innerType: {
        type: 'number',
        _typeError: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } },
        _whitelistError: '__vue_devtool_undefined__',
        _blacklistError: '__vue_devtool_undefined__',
        _whitelist: {
          list: {
            _custom: {
              type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
            },
          },
          refs: {
            _custom: {
              type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
            },
          },
        },
        _blacklist: {
          list: {
            _custom: {
              type: 'set', displayText: 'Set[0]', value: [], readOnly: true,
            },
          },
          refs: {
            _custom: {
              type: 'map', displayText: 'Map', value: {}, readOnly: true, fields: { abstract: true },
            },
          },
        },
        exclusiveTests: { required: true },
        deps: [],
        conditions: [],
        tests: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">validate(_ref, cb)</span>', tooltipText: '<pre>function validate(_ref, cb) { let {value,path = "",label,options,originalValue,sync } = _ref, rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]); const {name,test,params,message } = config; let {parent,context } = options; function resolve(item) {return Reference.isRef(item) ? item.getValue(value, parent, context) : item; } function createError(overrides = {}) {const nextParams = (0, import_mapValues.default)(_extends2({ value, originalValue, label, path: overrides.path || path}, params, overrides.params), resolve);const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);error.params = nextParams;return error; } let ctx = _extends2({path,parent,type: name,createError,resolve,options,originalValue }, rest); if (!sync) {try { Promise.resolve(test.call(ctx, value, ctx)).then((validOrError) => { if (ValidationError.isError(validOrError)) cb(validOrError); else if (!validOrError) cb(createError()); else cb(null, validOrError); }).catch(cb);} catch (err) { cb(err);}return; } let result; try {var _ref2;result = test.call(ctx, value, ctx);if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === "function") { throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);} } catch (err) {cb(err);return; } if (ValidationError.isError(result)) cb(result); else if (!result) cb(createError()); else cb(null, result); }</pre>' } }],
        transforms: [{ _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(value)</span>', tooltipText: '<pre>function(value) { let parsed = value; if (typeof parsed === "string") { parsed = parsed.replace(/\\s/g, ""); if (parsed === "") return NaN; parsed = +parsed; } if (this.isType(parsed)) return parsed; return parseFloat(parsed);}</pre>' } }],
        spec: {
          strip: false, strict: false, abortEarly: true, recursive: true, nullable: true, presence: 'required', label: 'Risco',
        },
        _mutate: '__vue_devtool_undefined__',
      },
    },
  },
  _nodes: ['risco', 'pontos_atencao', 'pauta', 'participantes', 'observacao', 'detalhamento', 'data_registro', 'cronograma_paralisado', 'apresentar_no_relatorio', 'acompanhamentos', 'acompanhamento_tipo_id'],
  _excludedEdges: [],
  _sortErrors: { _custom: { type: 'function', displayText: '<span style="opacity:.8;margin-right:5px;">function</span> <span style="white-space:nowrap;">(a, b)</span>', tooltipText: '<pre>(a, b) => { return findIndex(keys, a) - findIndex(keys, b); }</pre>' } },
};
