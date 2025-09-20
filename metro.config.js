const path = require("path")

const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// Настройки для LiveKit и WebRTC
config.resolver.sourceExts.push("cjs")

// Настройка алиасов путей
config.resolver.alias = {
  "@": path.resolve(__dirname, "."),
  "@components": path.resolve(__dirname, "./components"),
  "@assets": path.resolve(__dirname, "./assets"),
  "@types": path.resolve(__dirname, "./types"),
  "@constants": path.resolve(__dirname, "./constants"),
  "@screens": path.resolve(__dirname, "./screens"),
}

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
