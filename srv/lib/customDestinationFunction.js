"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
var http_client_1 = require("@sap-cloud-sdk/http-client");
var connectivity_1 = require("@sap-cloud-sdk/connectivity");
function executeHttpRequest_customDestination(destinationName, requestConfig) {
    return __awaiter(this, void 0, void 0, function () {
        var resp, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, http_client_1.executeHttpRequest({
                            destinationName: destinationName,
                            serviceBindingTransformFn: _serviceBindingTransformFn
                        }, requestConfig)];
                case 1:
                    resp = _a.sent();
                    return [2 /*return*/, resp];
                case 2:
                    error_1 = _a.sent();
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.executeHttpRequest_customDestination = executeHttpRequest_customDestination;
/**
 * Generate token using Cloud SDK methods
 * Return destination object according to SDK standards as well
 * Note:In the example of job scheduler, credentials is stored differently and is unable to use SDK method directly
 * Massaging has to be done before calling getClientCredentialsToken method
 */
var _serviceBindingTransformFn = function (service) { return __awaiter(_this, void 0, void 0, function () {
    var serviceUrl, tempService, token;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                serviceUrl = service.credentials.url;
                tempService = service;
                tempService.credentials = tempService.credentials.uaa;
                return [4 /*yield*/, connectivity_1.getClientCredentialsToken(tempService)];
            case 1:
                token = (_a.sent());
                return [2 /*return*/, _buildClientCredentialsDestination(token.access_token, serviceUrl, service.name)];
        }
    });
}); };
function _buildClientCredentialsDestination(token, url, name) {
    var expiresIn = Math.floor((connectivity_1.decodeJwt(token).exp * 1000 - Date.now()) / 1000).toString(10);
    return {
        url: url,
        name: name,
        authentication: 'OAuth2ClientCredentials',
        authTokens: [
            {
                value: token,
                type: 'bearer',
                expiresIn: expiresIn,
                http_header: { key: 'Authorization', value: "Bearer " + token },
                error: null
            }
        ]
    };
}
