const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// Настройки для LiveKit и WebRTC
config.resolver.sourceExts.push("cjs")

// Настройки для улучшения стабильности
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Игнорируем запросы к InternalBytecode.js
      if (req.url && req.url.includes("InternalBytecode.js")) {
        res.writeHead(404)
        res.end()
        return
      }
      return middleware(req, res, next)
    }
  },
}

module.exports = config
