/* eslint-disable */
// TS7 forces esModuleInterop; identity import helpers keep the prod semantics (tsc 5, interop off).
const helpers = {
    __importStar: function (mod) {
        return mod;
    },
    __importDefault: function (mod) {
        return mod;
    },
    __decorate: function (decorators, target, key, desc) {
        var c = arguments.length,
            r = c < 3 ? target : desc === null ? (desc = Object.getOwnPropertyDescriptor(target, key)) : desc,
            d;
        if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i])) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return (c > 3 && r && Object.defineProperty(target, key, r), r);
    },
    __metadata: function (k, v) {
        if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function') return Reflect.metadata(k, v);
    },
    __param: function (paramIndex, decorator) {
        return function (target, key) {
            decorator(target, key, paramIndex);
        };
    },
};

// tslib copies its own helpers onto the global object when loaded; the no-op setter keeps ours.
for (const [name, fn] of Object.entries(helpers)) {
    Object.defineProperty(globalThis, name, { get: () => fn, set: () => {}, configurable: false });
}
