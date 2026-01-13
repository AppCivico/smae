/* eslint-disable no-template-curly-in-string */
export default {
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
};
