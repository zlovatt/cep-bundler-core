import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import { range, defaultsDeep } from 'lodash';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

var manifestTemplate = (function (_ref) {
  var _ref$bundleName = _ref.bundleName,
      bundleName = _ref$bundleName === void 0 ? 'My Extension' : _ref$bundleName,
      _ref$bundleId = _ref.bundleId,
      bundleId = _ref$bundleId === void 0 ? 'com.test.test.extension' : _ref$bundleId,
      _ref$version = _ref.version,
      version = _ref$version === void 0 ? '1.0.0' : _ref$version,
      hosts = _ref.hosts,
      _ref$bundleVersion = _ref.bundleVersion,
      bundleVersion = _ref$bundleVersion === void 0 ? '1.0.0' : _ref$bundleVersion,
      _ref$cepVersion = _ref.cepVersion,
      cepVersion = _ref$cepVersion === void 0 ? '6.0' : _ref$cepVersion,
      _ref$panelWidth = _ref.panelWidth,
      panelWidth = _ref$panelWidth === void 0 ? '500' : _ref$panelWidth,
      _ref$panelHeight = _ref.panelHeight,
      panelHeight = _ref$panelHeight === void 0 ? '500' : _ref$panelHeight,
      _ref$cefParams = _ref.cefParams,
      cefParams = _ref$cefParams === void 0 ? ['--allow-file-access-from-files', '--allow-file-access', '--enable-nodejs'] : _ref$cefParams,
      iconNormal = _ref.iconNormal,
      iconRollover = _ref.iconRollover,
      iconDarkNormal = _ref.iconDarkNormal,
      iconDarkRollover = _ref.iconDarkRollover,
      lifecycle = _ref.lifecycle;
  var commandLineParams = cefParams.map(function (cefParam) {
    return "<Parameter>".concat(cefParam, "</Parameter>");
  });
  var icons = [{
    icon: iconNormal,
    type: 'Normal'
  }, {
    icon: iconRollover,
    type: 'RollOver'
  }, {
    icon: iconDarkNormal,
    type: 'DarkNormal'
  }, {
    icon: iconDarkRollover,
    type: 'DarkRollOver'
  }].filter(function (_ref2) {
    var icon = _ref2.icon;
    return !!icon;
  }).map(function (_ref3) {
    var icon = _ref3.icon,
        type = _ref3.type;
    return "<Icon Type=\"".concat(type, "\">").concat(icon, "</Icon>");
  }).join('\n            ');
  var startOn = !lifecycle.startOnEvents || lifecycle.startOnEvents.length === 0 ? '' : "\n          <StartOn>\n            ".concat(lifecycle.startOnEvents.map(function (e) {
    return "<Event>".concat(e, "</Event>");
  }).join('\n            '), "\n          </StartOn>");
  return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<ExtensionManifest xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" ExtensionBundleId=\"".concat(bundleId, "\" ExtensionBundleName=\"").concat(bundleName, "\" ExtensionBundleVersion=\"").concat(bundleVersion, "\" Version=\"").concat(cepVersion, "\">\n  <ExtensionList>\n    <Extension Id=\"").concat(bundleId, "\" Version=\"").concat(version, "\"/>\n  </ExtensionList>\n  <ExecutionEnvironment>\n    <HostList>\n      ").concat(hosts.map(function (host) {
    return "<Host Name=\"".concat(host.name, "\" Version=\"").concat(host.version, "\" />");
  }).join('\n      '), "\n    </HostList>\n    <LocaleList>\n      <Locale Code=\"All\"/>\n    </LocaleList>\n    <RequiredRuntimeList>\n      <RequiredRuntime Name=\"CSXS\" Version=\"").concat(cepVersion, "\"/>\n    </RequiredRuntimeList>\n  </ExecutionEnvironment>\n  <DispatchInfoList>\n    <Extension Id=\"").concat(bundleId, "\">\n      <DispatchInfo>\n        <Resources>\n          <MainPath>./panel.html</MainPath>\n          <CEFCommandLine>\n            ").concat(commandLineParams.join('\n            '), "\n          </CEFCommandLine>\n        </Resources>\n        <Lifecycle>\n          <AutoVisible>").concat(lifecycle.autoVisible, "</AutoVisible>").concat(startOn, "\n        </Lifecycle>\n        <UI>\n          <Type>Panel</Type>\n          <Menu>").concat(bundleName, "</Menu>\n          <Geometry>\n            <Size>\n              <Width>").concat(panelWidth, "</Width>\n              <Height>").concat(panelHeight, "</Height>\n            </Size>\n          </Geometry>\n          <Icons>\n            ").concat(icons, "\n          </Icons>\n        </UI>\n      </DispatchInfo>\n    </Extension>\n  </DispatchInfoList>\n</ExtensionManifest>");
});

var panelTemplate = (function (_ref) {
  var _ref$title = _ref.title,
      title = _ref$title === void 0 ? 'CEP Panel' : _ref$title,
      href = _ref.href;
  return "<!DOCTYPE html>\n<html>\n  <head>\n    <title>".concat(title, "</title>\n  </head>\n  <body>\n    <script>\n      window.location.href = \"").concat(href, "\";\n    </script>\n  </body>\n</html>");
});

var debugTemplate = (function () {
  var bundleId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'com.test.extension';
  var hosts = arguments.length > 1 ? arguments[1] : undefined;
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ExtensionList>\n  <Extension Id=\"".concat(bundleId, "\">\n  <HostList>\n    ").concat(hosts.map(function (host, i) {
    return "<Host Name=\"".concat(host.name.trim(), "\" Port=\"").concat('' + (3000 + i + 1), "\" />");
  }).join('\n    '), "\n  </HostList>\n  </Extension>\n</ExtensionList>");
});

function templateDebug(formatter) {
  return range(4, 16).map(formatter).join(os.EOL);
}

function enablePlayerDebugMode() {
  // enable unsigned extensions for the foreseable future
  if (process.platform === 'darwin') {
    execSync(templateDebug(function (i) {
      return "defaults write com.adobe.CSXS.".concat(i, " PlayerDebugMode 1");
    }));
  } else if (process.platform === 'win32') {
    execSync(templateDebug(function (i) {
      return "REG ADD HKCU\\Software\\Adobe\\CSXS.".concat(i, " /f /v PlayerDebugMode /t REG_SZ /d 1");
    }));
  }
}
function disablePlayerDebugMode() {
  // disable unsigned extensions for the foreseable future
  if (process.platform === 'darwin') {
    execSync(templateDebug(function (i) {
      return "defaults write com.adobe.CSXS.".concat(i, " PlayerDebugMode 0");
    }));
  } else if (process.platform === 'win32') {
    execSync(templateDebug(function (i) {
      return "REG DELETE HKCU\\Software\\Adobe\\CSXS.".concat(i, " /f /v PlayerDebugMode");
    }));
  }
}

function camelToSnake(str) {
  return str.replace(/([A-Z])/g, function (part) {
    return "_".concat(part.toLowerCase());
  });
}

function isTruthy(str) {
  return typeof str === 'string' && (str === '1' || str.toLowerCase() === 'true');
}

function getConfig(pkg) {
  var debugPortEnvs = Object.keys(process.env).filter(function (key) {
    return key.indexOf('DEBUG_PORT_') === 0;
  });

  if (!pkg.cep) {
    pkg.cep = {};
  }

  var config = defaultsDeep({
    bundleName: process.env.NAME,
    bundleId: process.env.ID,
    bundleVersion: process.env.VERSION,
    hosts: process.env.HOSTS,
    iconNormal: process.env.ICON_NORMAL,
    iconRollover: process.env.ICON_ROLLOVER,
    iconDarkNormal: process.env.ICON_DARK_NORMAL,
    iconDarkRollover: process.env.ICON_DARK_ROLLOVER,
    panelWidth: process.env.PANEL_WIDTH,
    panelHeight: process.env.PANEL_HEIGHT,
    debugPorts: debugPortEnvs.length > 0 ? debugPortEnvs.reduce(function (obj, key) {
      obj[key] = parseInt(process.env[key], 10);
      return obj;
    }, {}) : undefined,
    debugInProduction: isTruthy(process.env.DEBUG_IN_PRODUCTION),
    cefParams: !process.env.CEF_PARAMS ? undefined : process.env.CEF_PARAMS.split(',')
  }, {
    bundleName: pkg.cep && pkg.cep.name,
    bundleId: pkg.cep && pkg.cep.id,
    bundleVersion: pkg.cep && pkg.cep.version,
    hosts: pkg.cep && pkg.cep.hosts,
    iconNormal: pkg.cep.iconNormal,
    iconRollover: pkg.cep.iconRollover,
    iconDarkNormal: pkg.cep.iconDarkNormal,
    iconDarkRollover: pkg.cep.iconDarkRollover,
    panelWidth: pkg.cep.panelWidth,
    panelHeight: pkg.cep.panelHeight,
    debugPorts: pkg.cep.debugPorts,
    debugInProduction: pkg.cep.debugInProduction,
    lifecycle: pkg.cep.lifecycle,
    cefParams: pkg.cep.cefParams
  }, {
    bundleVersion: pkg.version
  }, {
    bundleName: 'Parcel CEP Extension',
    bundleId: 'com.mycompany.myextension',
    bundleVersion: '0.0.1',
    hosts: '*',
    panelWidth: 500,
    panelHeight: 500,
    debugInProduction: false,
    debugPorts: {
      PHXS: 3001,
      IDSN: 3002,
      AICY: 3003,
      ILST: 3004,
      PPRO: 3005,
      PRLD: 3006,
      AEFT: 3007,
      FLPR: 3008,
      AUDT: 3009,
      DRWV: 3010,
      MUST: 3011,
      KBRG: 3012
    },
    lifecycle: {
      autoVisible: true,
      startOnEvents: []
    },
    cefParams: ['--allow-file-access-from-files', '--allow-file-access', '--enable-nodejs', '--mixed-context']
  });
  return config;
}
function objectToProcessEnv(object) {
  // assign object to process.env so they can be used in the code
  Object.keys(object).forEach(function (key) {
    var envKey = camelToSnake(key).toUpperCase();
    var value = typeof object[key] === 'string' ? object[key] : JSON.stringify(object[key]);
    process.env[envKey] = value;
  });
}
function writeExtensionTemplates(_ref) {
  var env = _ref.env,
      port = _ref.port,
      hosts = _ref.hosts,
      out = _ref.out,
      htmlFilename = _ref.htmlFilename,
      bundleName = _ref.bundleName,
      bundleId = _ref.bundleId,
      bundleVersion = _ref.bundleVersion,
      iconNormal = _ref.iconNormal,
      iconRollover = _ref.iconRollover,
      iconDarkNormal = _ref.iconDarkNormal,
      iconDarkRollover = _ref.iconDarkRollover,
      panelWidth = _ref.panelWidth,
      panelHeight = _ref.panelHeight,
      debugInProduction = _ref.debugInProduction,
      lifecycle = _ref.lifecycle,
      cefParams = _ref.cefParams;
  var manifestContents = manifestTemplate({
    bundleName: bundleName,
    bundleId: bundleId,
    version: bundleVersion,
    hosts: hosts,
    bundleVersion: bundleVersion,
    iconNormal: iconNormal,
    iconRollover: iconRollover,
    iconDarkNormal: iconDarkNormal,
    iconDarkRollover: iconDarkRollover,
    panelWidth: panelWidth,
    panelHeight: panelHeight,
    lifecycle: lifecycle,
    cefParams: cefParams
  });
  var manifestDir = path.join(out, 'CSXS');
  var manifestFile = path.join(manifestDir, 'manifest.xml');
  return Promise.resolve().then(function () {
    return fs.ensureDir(manifestDir);
  }).then(function () {
    return fs.writeFile(manifestFile, manifestContents);
  }).then(function () {
    var chain = Promise.resolve();

    if (debugInProduction || env !== 'production') {
      var debugContents = debugTemplate(bundleId, hosts);
      chain = chain.then(function () {
        return fs.writeFile(path.join(out, '.debug'), debugContents);
      });
    }

    var href = env == 'production' ? htmlFilename : "http://localhost:".concat(port);
    var panelContents = panelTemplate({
      title: bundleName,
      href: href
    });
    chain = chain.then(function () {
      return fs.writeFile(path.join(out, 'panel.html'), panelContents);
    });
    return chain;
  });
}
function parseHosts(hostsString) {
  if (hostsString == '*') hostsString = "PHXS, IDSN, AICY, ILST, PPRO, PRLD, AEFT, FLPR, AUDT, DRWV, MUST, KBRG";
  var hosts = hostsString.split(/(?![^)(]*\([^)(]*?\)\)),(?![^\[]*\])/).map(function (host) {
    return host.trim();
  }).map(function (host) {
    var _host$split = host.split('@'),
        _host$split2 = _slicedToArray(_host$split, 2),
        name = _host$split2[0],
        version = _host$split2[1];

    if (version == '*' || !version) {
      version = '[0.0,99.9]';
    } else if (version) {
      version = version;
    }

    return {
      name: name,
      version: version
    };
  });
  return hosts;
}
function getExtenstionPath() {
  if (process.platform == 'darwin') {
    return path.join(os.homedir(), '/Library/Application Support/Adobe/CEP/extensions');
  } else if (process.platform == 'win32') {
    return path.join(process.env.APPDATA, 'Adobe/CEP/extensions');
  }
}

function getSymlinkExtensionPath(_ref2) {
  var bundleId = _ref2.bundleId;
  var extensionPath = getExtenstionPath();
  return path.join(extensionPath, bundleId);
}

function symlinkExtension(_ref3) {
  var bundleId = _ref3.bundleId,
      out = _ref3.out;
  var target = getSymlinkExtensionPath({
    bundleId: bundleId
  });
  return Promise.resolve().then(function () {
    return fs.ensureDir(getExtenstionPath());
  }).then(function () {
    return fs.remove(target);
  }).then(function () {
    if (process.platform === 'win32') {
      return fs.symlink(path.join(out, '/'), target, 'junction');
    } else {
      return fs.symlink(path.join(out, '/'), target);
    }
  });
}
function copyDependencies(_ref4) {
  var root = _ref4.root,
      out = _ref4.out,
      pkg = _ref4.pkg;
  return Promise.resolve().then(function () {
    var chain = Promise.resolve();
    var deps = pkg.dependencies || {};
    Object.keys(deps).forEach(function (dep) {
      try {
        var src = path.join(root, 'node_modules', dep);
        var dest = path.join(out, 'node_modules', dep);

        if (!fs.existsSync(dest)) {
          chain = chain.then(function () {
            if (!fs.existsSync(dest)) {
              return fs.copy(src, dest);
            }
          });
        }
      } catch (err) {
        console.error('Error while copying', err);
      }

      chain = chain.then(function () {
        return copyDependencies({
          root: root,
          out: out,
          pkg: fs.readJsonSync(path.join(root, 'node_modules', dep, 'package.json'))
        });
      });
    });
    return chain;
  });
}
function copyIcons(_ref5) {
  var root = _ref5.root,
      out = _ref5.out,
      config = _ref5.config;
  var iconPaths = [config.iconNormal, config.iconRollover, config.iconDarkNormal, config.iconDarkRollover].filter(function (icon) {
    return icon !== undefined;
  }).map(function (icon) {
    return {
      source: path.resolve(root, icon),
      output: path.join(out, path.relative(root, icon))
    };
  });
  return Promise.all(iconPaths.map(function (icon) {
    return fs.copy(icon.source, icon.output)["catch"](function () {
      console.error("Could not copy ".concat(icon.source, ". Ensure the path is correct."));
    });
  }));
}
function compile(opts) {
  opts.env = opts.hasOwnProperty('env') ? opts.env : process.env.NODE_ENV;
  opts.root = opts.hasOwnProperty('root') ? opts.root : process.cwd();
  opts.htmlFilename = opts.hasOwnProperty('htmlFilename') ? opts.htmlFilename : 'index.html';
  opts.pkg = opts.hasOwnProperty('pkg') ? opts.pkg : require(path.join(opts.root, '/package.json'));
  var config = getConfig(opts.pkg);
  var hosts = parseHosts(config.hosts);
  var chain = Promise.resolve();

  if (opts.env === 'development') {
    enablePlayerDebugMode();

    if (!config.noSymlink) {
      chain = chain.then(function () {
        return symlinkExtension({
          bundleId: config.bundleId,
          out: opts.out
        });
      });
    }
  }

  chain = chain.then(function () {
    return copyDependencies({
      root: opts.root,
      out: opts.out,
      pkg: opts.pkg
    });
  }).then(function () {
    var _writeExtensionTempla;

    return writeExtensionTemplates((_writeExtensionTempla = {
      env: opts.env,
      hosts: hosts,
      port: opts.devPort,
      htmlFilename: opts.htmlFilename,
      bundleName: config.bundleName,
      bundleId: config.bundleId,
      bundleVersion: config.bundleVersion,
      iconNormal: config.iconNormal,
      iconRollover: config.iconRollover,
      iconDarkNormal: config.iconDarkNormal,
      iconDarkRollover: config.iconDarkRollover,
      panelWidth: config.panelWidth,
      panelHeight: config.panelHeight,
      debugInProduction: config.debugInProduction,
      cefParams: config.cefParams,
      lifecycle: config.lifecycle
    }, _defineProperty(_writeExtensionTempla, "cefParams", config.cefParams), _defineProperty(_writeExtensionTempla, "out", opts.out), _writeExtensionTempla));
  }).then(function () {
    return copyIcons({
      root: opts.root,
      out: opts.out,
      config: config
    });
  });
  return chain;
}

export { compile, copyDependencies, copyIcons, disablePlayerDebugMode, enablePlayerDebugMode, getConfig, getExtenstionPath, objectToProcessEnv, parseHosts, symlinkExtension, writeExtensionTemplates };
//# sourceMappingURL=cep-bundler-core.esm.js.map