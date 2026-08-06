# Вход по имени пользователя вместо Server URL и Token

Дата: 2026-08-06

## Задача

На экране входа пользователь вводит только своё имя. Адрес сервера берётся из
переменных окружения, токен доступа запрашивается у token server LiveKit Cloud.
Поля «Server URL» и «Token» с экрана убираются.

## Контекст

Сейчас `App.tsx` (240 строк) совмещает экран входа и рендер `LiveKitRoom`.
Пользователь вручную вводит `wss://`-адрес и JWT. Папка `screens/` пустая.
Тестов в проекте нет: jest не установлен, тестовых файлов ноль.

Проект в LiveKit Cloud: `native-meet` (`p_184n6gcyjas`).
Token server включён, ID `nativemeet-25p8ep`.

## Решения и их основания

**Токен запрашивается у token server LiveKit Cloud, а не подписывается в приложении.**
У LiveKit Cloud нет эндпоинта, обменивающего API key/secret на токен: токен — это
JWT, подписанный секретом. Подпись в приложении означала бы секрет в бандле.
Token server решает ту же задачу без секрета на клиенте. Ограничение: он
предназначен для разработки и тестирования, не для продакшена — любой клиент
может запросить токен с любыми правами. Sandbox как продукт помечен deprecated,
но token server остался отдельной настройкой проекта и работает.

**Используется `TokenSource` из `livekit-client`**, а не собственный `fetch`.
`livekit-client@2.21.0` уже стоит транзитивно через `@livekit/react-native@2.9.8`
и содержит `TokenSource.sandboxTokenServer(id)`, который делает
`POST https://cloud-api.livekit.io/api/v2/sandbox/connection-details`
с заголовком `X-Sandbox-ID` и телом `{room_name, participant_name}`, а ответ
разбирает в объект с полями `serverUrl` и `participantToken`. Пакет добавляется
в `dependencies` явно, точной версией `2.21.0` — по соглашению репозитория все
версии закреплены точно. Импортировать транзитивную зависимость без объявления
нельзя: она может исчезнуть при обновлении дерева.

**`serverUrl` из ответа token server игнорируется**, адрес берётся из
`EXPO_PUBLIC_LIVEKIT_URL`. Так адрес остаётся под контролем конфигурации
окружения.

**Комната одна, её имя задаётся переменной окружения.** Второе поле ввода на
экране входа не добавляется.

## Компоненты

### `constants/env.ts`

Единственное место, читающее `process.env`. Обращения к переменным только
литеральные (`process.env.EXPO_PUBLIC_LIVEKIT_URL`): Expo подставляет значения
`EXPO_PUBLIC_*` на этапе сборки, динамический доступ по вычисленному ключу
возвращает `undefined`.

Экспортирует:

- `env: { serverUrl: string; sandboxId: string; roomName: string }` — значения
  как есть, без пустых проверок на месте использования;
- `configError: string | null` — сообщение с перечислением незаданных переменных,
  либо `null`.

### `services/livekitToken.ts`

Единственное место, знающее про token server LiveKit Cloud.

```ts
export async function fetchParticipantToken(participantName: string): Promise<string>
```

Внутри — созданный на уровне модуля `TokenSource.sandboxTokenServer(env.sandboxId)`,
вызов `fetch({ roomName: env.roomName, participantName, participantIdentity })` и
возврат `participantToken`.

`participantIdentity` формируется как `${participantName}-${suffix}`, где
`suffix` — шесть случайных символов из `Math.random().toString(36)`
(криптостойкость здесь не нужна, требуется только различимость).
Identity в LiveKit должен быть уникален:
при совпадении второй участник выбивает первого из комнаты. Имя, видимое
остальным участникам, остаётся тем, что ввёл пользователь, — оно передаётся
отдельным полем `participantName`.

### `screens/JoinScreen.tsx`

Экран входа. Одно поле «Your name», кнопка «Join».

Пропсы:

- `onJoined(token: string): void`
- `error?: string` — ошибка предыдущей попытки подключения к комнате

Локальное состояние: `name`, `isLoading`, `tokenError`. По нажатию кнопки:
имя обрезается по краям и проверяется на непустоту, затем вызывается
`fetchParticipantToken`; при успехе — `onJoined(token)`, при исключении —
сообщение в `tokenError`.

Стили экрана входа переезжают сюда из `App.tsx`.

### `App.tsx`

Состояние `{ token: string | null; error?: string }` и ветвление:

- `token === null` → `<JoinScreen error={error} onJoined={...} />`
- иначе → `<LiveKitRoom serverUrl={env.serverUrl} token={token}>` с `<ActiveRoom />`

Обработчики `onDisconnected` и `onError` сбрасывают `token` в `null`; `onError`
дополнительно записывает текст ошибки в `error`, и он показывается на экране
входа.

### `types/index.ts`

`AppConfig` удаляется — пользовательского ввода URL и токена больше нет.
`ConnectionState` заменяется на `{ token: string | null; error?: string }`;
флаг `connecting` уезжает в локальное состояние `JoinScreen`.
`VideoControlsState` не меняется.

## Переменные окружения

`.env.local`:

```
EXPO_PUBLIC_LIVEKIT_URL=wss://native-meet-1ogbtfoq.livekit.cloud
EXPO_PUBLIC_LIVEKIT_SANDBOX_ID=nativemeet-25p8ep
EXPO_PUBLIC_LIVEKIT_ROOM=<имя комнаты>
```

Удаляются как неиспользуемые: `EXPO_PUBLIC_TOKEN`,
`EXPO_PUBLIC_LIVEKIT_API_KEY`, `EXPO_PUBLIC_LIVEKIT_API_SECRET`.

Добавляется `.env.example` с этими тремя ключами и пустыми значениями: файлы
`.env*.local` в `.gitignore`, и список нужных переменных иначе взять негде.

Значение `EXPO_PUBLIC_LIVEKIT_ROOM` задаёт разработчик. Если переменная не
задана, экран входа показывает ошибку конфигурации и кнопка входа заблокирована.

## Обработка ошибок

Все три случая показываются в существующем блоке `errorContainer` на экране входа:

1. **Незаданные переменные окружения.** `configError` проверяется при рендере
   `JoinScreen`; текст перечисляет отсутствующие переменные, кнопка «Join»
   заблокирована.
2. **Ошибка token server** — не-2xx ответ или сетевой сбой. `TokenSource`
   бросает `Error` с кодом статуса и телом ответа; текст показывается как есть.
3. **Ошибка подключения к комнате.** `onError` у `LiveKitRoom` возвращает
   пользователя на экран входа и передаёт сообщение через пропс `error`.

## Верификация

- `npm run lint`
- `npm run type-check`
- запуск приложения и реальное подключение к комнате под введённым именем

Автотесты не добавляются: инфраструктуры для них в проекте нет, разворачивание
jest выходит за рамки задачи.

## Вне рамок

- Свой token-сервер для продакшена.
- Выбор комнаты пользователем.
- Сохранение введённого имени между запусками.
