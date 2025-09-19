# Native Meet - LiveKit React Native Demo

Приложение для видеозвонков, построенное с использованием LiveKit React Native SDK, Expo и TypeScript.

## Особенности

- 🎥 Видеозвонки в реальном времени
- 🎙️ Аудио чат
- 📱 Кроссплатформенность (iOS/Android)
- 🔧 Простая настройка с Expo
- 🎛️ Управление камерой и микрофоном
- 📝 Полная типизация TypeScript
- ♿ Поддержка accessibility
- 🛡️ Обработка ошибок и валидация

## Установка и настройка

### 1. Установите зависимости

```bash
npm install
```

### 2. Настройте LiveKit сервер

Для работы приложения вам понадобится LiveKit сервер. Вы можете:

- Использовать [LiveKit Cloud](https://cloud.livekit.io/)
- Запустить [локальный сервер LiveKit](https://docs.livekit.io/realtime/self-hosting/deployment/)

### 3. Получите токен доступа

Для подключения к комнате вам нужен JWT токен. Вы можете:

- Сгенерировать токен через [LiveKit CLI](https://docs.livekit.io/realtime/server/generating-tokens/)
- Использовать веб-интерфейс LiveKit Cloud
- Создать токен программно на вашем сервере

### 4. Запуск приложения

⚠️ **Важно**: Это приложение использует нативные модули LiveKit и требует Expo Development Build, а не Expo Go.

```bash
# Первоначальная настройка (создание нативных папок)
npx expo prebuild --clean

# Для разработки с Development Client
npx expo start --dev-client

# Для симулятора iOS (только на macOS)
npx expo run:ios

# Для эмулятора Android
npx expo run:android

# Для веб-версии (ограниченная функциональность)
npx expo start --web

# Облачная сборка для iOS (с помощью EAS)
eas build --platform ios --profile development
```

#### Первый запуск:

1. **Android**: `npx expo run:android` (автоматически установит Development Client)
2. **iOS**: Требуется macOS или облачная сборка через EAS
3. **Веб**: Работает, но без видео/аудио функций

## Использование

1. Запустите приложение
2. Введите URL вашего LiveKit сервера (например: `wss://your-server.livekit.cloud`)
3. Введите действительный токен доступа
4. Нажмите "Connect" для подключения к комнате

## Конфигурация

### Разрешения

Приложение автоматически запрашивает следующие разрешения:

**iOS:**

- `NSCameraUsageDescription` - доступ к камере
- `NSMicrophoneUsageDescription` - доступ к микрофону

**Android:**

- `android.permission.CAMERA` - доступ к камере
- `android.permission.RECORD_AUDIO` - доступ к микрофону
- `android.permission.MODIFY_AUDIO_SETTINGS` - изменение настроек аудио
- `android.permission.INTERNET` - доступ к интернету
- `android.permission.ACCESS_NETWORK_STATE` - проверка состояния сети
- `android.permission.WAKE_LOCK` - предотвращение блокировки экрана

### Плагины Expo

Проект настроен с использованием:

- `@livekit/react-native-expo-plugin` - основной плагин LiveKit для Expo

## Структура проекта

```
native-meet/
├── App.tsx              # Главный компонент приложения (TypeScript)
├── types/               # Типы TypeScript
│   └── index.ts         # Основные интерфейсы и типы
├── app.json             # Конфигурация Expo
├── tsconfig.json        # Конфигурация TypeScript
├── expo-env.d.ts        # Типы для Expo
├── package.json         # Зависимости проекта
├── assets/              # Ресурсы приложения
│   ├── icon.png
│   ├── splash-icon.png
│   └── ...
└── README.md           # Документация
```

## TypeScript

Проект полностью типизирован с использованием TypeScript:

- **Строгая типизация** - все компоненты и функции имеют явные типы
- **Интерфейсы** - определены в `types/index.ts` для всех основных структур данных
- **Type Safety** - предотвращение ошибок времени выполнения
- **IntelliSense** - улучшенная поддержка в IDE

### Основные типы:

- `AppConfig` - конфигурация подключения
- `ConnectionState` - состояние соединения
- `VideoControlsState` - состояние элементов управления
- `ParticipantInfo` - информация об участниках

## Возможности приложения

### Экран подключения

- Ввод URL сервера LiveKit
- Ввод токена доступа
- Валидация данных перед подключением

### Экран видеозвонка

- Отображение видео всех участников
- Управление микрофоном (включение/выключение)
- Управление камерой (включение/выключение)
- Отображение количества участников
- Кнопка отключения от комнаты

## Разработка

### Требования

- Node.js 16+
- Expo CLI
- EAS CLI: `npm install -g eas-cli`
- iOS Simulator (для iOS разработки, только macOS)
- Android Emulator или устройство (для Android разработки)
- Android Studio (для Android разработки)
- Xcode (для iOS разработки, только macOS)

### Отладка

```bash
# Показать логи
npx expo logs

# Очистить кэш
npx expo start -c

# Проверить типы TypeScript
npx tsc --noEmit

# Проверить типы в режиме наблюдения
npx tsc --noEmit --watch
```

## Полезные ссылки

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit React Native SDK](https://docs.livekit.io/client-sdk-js/react-native/)
- [Expo Documentation](https://docs.expo.dev/)
- [LiveKit Cloud](https://cloud.livekit.io/)

## Устранение неполадок

### Ошибка "The package '@livekit/react-native' doesn't seem to be linked"

Эта ошибка возникает при попытке использовать Expo Go вместо Development Build:

1. **Для Android**:

   ```bash
   npx expo run:android
   ```

2. **Для iOS (только macOS)**:

   ```bash
   npx expo run:ios
   ```

3. **Для iOS на Windows/Linux**:
   ```bash
   eas build --platform ios --profile development
   ```

### Другие проблемы

- **Проблемы с нативными модулями**: Выполните `npx expo prebuild --clean`
- **Кэш проблемы**: Используйте `npx expo start -c --dev-client`
- **Metro bundler ошибки**: Перезапустите сервер разработки

## Поддержка

Если у вас возникли проблемы:

1. Проверьте, что вы используете Development Build, а не Expo Go
2. Убедитесь, что все зависимости установлены корректно
3. Проверьте, что ваш LiveKit сервер доступен
4. Проверьте правильность токена доступа
5. Обратитесь к документации LiveKit

## Лицензия

MIT License
