import os from 'os'
import path from 'path'
import { execSync } from 'child_process'
import fs from 'fs-extra'
import { range, defaultsDeep } from 'lodash'

import manifestTemplate from './templates/manifest'
import panelTemplate from './templates/html'
import debugTemplate from './templates/.debug'

function templateDebug(formatter) {
  return range(4, 16)
    .map(formatter)
    .join(os.EOL)
}

export function enablePlayerDebugMode() {
  // enable unsigned extensions for the foreseable future
  if (process.platform === 'darwin') {
    execSync(
      templateDebug(i => `defaults write com.adobe.CSXS.${i} PlayerDebugMode 1`)
    )
  } else if (process.platform === 'win32') {
    execSync(
      templateDebug(
        i => `REG ADD HKCU\\Software\\Adobe\\CSXS.${i} /f /v PlayerDebugMode /t REG_SZ /d 1`
      )
    )
  }
}

export function disablePlayerDebugMode() {
  // disable unsigned extensions for the foreseable future
  if (process.platform === 'darwin') {
    execSync(
      templateDebug(i => `defaults write com.adobe.CSXS.${i} PlayerDebugMode 0`)
    )
  } else if (process.platform === 'win32') {
    execSync(
      templateDebug(
        i => `REG DELETE HKCU\\Software\\Adobe\\CSXS.${i} /f /v PlayerDebugMode`
      )
    )
  }
}

function camelToSnake(str) {
  return str.replace(/([A-Z])/g, (part) => `_${part.toLowerCase()}`)
}

function isTruthy(str) {
  return typeof str === 'string' && (str === '1' || str.toLowerCase() === 'true')
}

export function getConfig(pkg) {
  const debugPortEnvs = Object.keys(process.env)
    .filter((key) => key.indexOf('CEP_DEBUG_PORT_') === 0)
  if (!pkg.cep) {
    pkg.cep = {}
  }
  const config = defaultsDeep(
    {
      bundleName: process.env.CEP_BUNDLE_NAME,
      bundleId: process.env.CEP_BUNDLE_ID,
      bundleVersion: process.env.CEP_BUNDLE_VERSION,
      hosts: process.env.CEP_HOSTS,
      iconNormal: process.env.CEP_ICON_NORMAL,
      iconRollover: process.env.CEP_ICON_ROLLOVER,
      iconDarkNormal: process.env.CEP_ICON_DARK_NORMAL,
      iconDarkRollover: process.env.CEP_ICON_DARK_ROLLOVER,
      panelWidth: process.env.CEP_PANEL_WIDTH,
      panelHeight: process.env.CEP_PANEL_HEIGHT,
      debugPorts: debugPortEnvs.length > 0
        ? debugPortEnvs.reduce((obj, key) => {
          obj[key] = parseInt(process.env[key], 10)
          return obj
        }, {})
        : undefined,
      debugInProduction: isTruthy(process.env.CEP_DEBUG_IN_PRODUCTION),
      cefParams: !process.env.CEP_CEF_PARAMS ? undefined : process.env.CEP_CEF_PARAMS.split(',')
    },
    {
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
    },
    {
      bundleVersion: pkg.version,
    },
    {
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
        KBRG: 3012,
      },
      lifecycle: { autoVisible: true, startOnEvents: [] },
      cefParams: [
        '--allow-file-access-from-files',
        '--allow-file-access',
        '--enable-nodejs',
        '--mixed-context'
      ]
    }
  )
  return config
}

export function objectToProcessEnv(object) {
  // assign object to process.env so they can be used in the code
  Object.keys(object).forEach(key => {
    const envKey = camelToSnake(key).toUpperCase()
    const value = typeof object[key] === 'string'
      ? object[key]
      : JSON.stringify(object[key])
    process.env[envKey] = value
  })
}

export function writeExtensionTemplates({
  env,
  port,
  hosts,
  out,
  htmlFilename,
  bundleName,
  bundleId,
  bundleVersion,
  iconNormal,
  iconRollover,
  iconDarkNormal,
  iconDarkRollover,
  panelWidth,
  panelHeight,
  debugInProduction,
  lifecycle,
  cefParams
}) {
  const manifestContents = manifestTemplate({
    bundleName,
    bundleId,
    version: bundleVersion,
    hosts,
    bundleVersion,
    iconNormal,
    iconRollover,
    iconDarkNormal,
    iconDarkRollover,
    panelWidth,
    panelHeight,
    lifecycle,
    cefParams
  })
  const manifestDir = path.join(out, 'CSXS')
  const manifestFile = path.join(manifestDir, 'manifest.xml')
  return Promise.resolve()
    .then(() => fs.ensureDir(manifestDir))
    .then(() => fs.writeFile(manifestFile, manifestContents))
    .then(() => {
      let chain = Promise.resolve()
      if (debugInProduction || env !== 'production') {
        const debugContents = debugTemplate(bundleId, hosts)
        chain = chain.then(() => fs.writeFile(path.join(out, '.debug'), debugContents))
      }
      const href = env === 'production' ? htmlFilename : `http://localhost:${port}`
      const panelContents = panelTemplate({
        title: bundleName,
        href
      })
      chain = chain.then(() => fs.writeFile(path.join(out, 'panel.html'), panelContents))
      return chain
    })
}

export function parseHosts(hostsString) {
  if (hostsString == '*')
    hostsString = `PHXS, IDSN, AICY, ILST, PPRO, PRLD, AEFT, FLPR, AUDT, DRWV, MUST, KBRG`
  const hosts = hostsString
    .split(/(?![^)(]*\([^)(]*?\)\)),(?![^\[]*\])/)
    .map(host => host.trim())
    .map(host => {
      let [name, version] = host.split('@')
      if (version == '*' || !version) {
        version = '[0.0,99.9]'
      } else if (version) {
        version = version
      }
      return {
        name,
        version,
      }
    })
  return hosts
}

export function getExtenstionPath() {
  if (process.platform == 'darwin') {
    return path.join(
      os.homedir(),
      '/Library/Application Support/Adobe/CEP/extensions'
    )
  } else if (process.platform == 'win32') {
    return path.join(process.env.APPDATA, 'Adobe/CEP/extensions')
  }
}

function getSymlinkExtensionPath({ bundleId }) {
  const extensionPath = getExtenstionPath()
  return path.join(extensionPath, bundleId)
}

export function symlinkExtension({ bundleId, out }) {
  const target = getSymlinkExtensionPath({ bundleId })
  return Promise.resolve()
    .then(() => fs.ensureDir(getExtenstionPath()))
    .then(() => fs.remove(target))
    .then(() => {
      if (process.platform === 'win32') {
        return fs.symlink(path.join(out, '/'), target, 'junction')
      } else {
        return fs.symlink(path.join(out, '/'), target)
      }
    })
}

export function copyDependencies({ root, out, pkg }) {
  return Promise.resolve()
    .then(() => {
      let chain = Promise.resolve()
      const deps = pkg.dependencies || {}
      Object.keys(deps).forEach(dep => {
        try {
          const src = path.join(root, 'node_modules', dep)
          const dest = path.join(out, 'node_modules', dep)
          if (!fs.existsSync(dest)) {
            chain = chain.then(() => {
              if (!fs.existsSync(dest)) {
                return fs.copy(src, dest)
              }
            })
          }
        } catch (err) {
          console.error('Error while copying', err)
        }
        chain = chain.then(() => copyDependencies({
          root,
          out,
          pkg: fs.readJsonSync(path.join(root, 'node_modules', dep, 'package.json'))
        }))
      })
      return chain
    })
}

export function copyIcons({ root, out, config }) {
  const iconPaths = [
    config.iconNormal,
    config.iconRollover,
    config.iconDarkNormal,
    config.iconDarkRollover,
  ]
    .filter(icon => icon !== undefined)
    .map(icon => ({
        source: path.resolve(root, icon),
        output: path.join(out, path.relative(root, icon)),
    }))
  return Promise.all(
    iconPaths.map(icon => {
      return fs.copy(icon.source, icon.output)
        .catch(() => {
          console.error(
            `Could not copy ${icon.source}. Ensure the path is correct.`
          )
        })
    })
  )
}

export function compile(opts) {
  opts.env = opts.hasOwnProperty('env') ? opts.env : process.env.NODE_ENV
  opts.root = opts.hasOwnProperty('root') ? opts.root : process.cwd()
  opts.htmlFilename = opts.hasOwnProperty('htmlFilename') ? opts.htmlFilename : 'index.html'
  opts.pkg = opts.hasOwnProperty('pkg') ? opts.pkg : require(path.join(opts.root, '/package.json'))
  const config = getConfig(opts.pkg)
  const hosts = parseHosts(config.hosts)
  let chain = Promise.resolve()
  if (opts.env === 'development') {
    enablePlayerDebugMode()
    if (!config.noSymlink) {
      chain = chain.then(() =>
        symlinkExtension({ bundleId: config.bundleId, out: opts.out })
      )
    }
  }
  chain = chain.then(() =>
    copyDependencies({ root: opts.root, out: opts.out, pkg: opts.pkg })
  ).then(() =>
    writeExtensionTemplates({
      env: opts.env,
      hosts,
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
      lifecycle: config.lifecycle,
      cefParams: config.cefParams,
      out: opts.out,
    })
  )
  .then(() =>
    copyIcons({ root: opts.root, out: opts.out, config })
  )
  return chain
}