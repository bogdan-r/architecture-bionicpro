# Reports Application with PKCE Security

Это приложение демонстрирует использование PKCE (Proof Key for Code Exchange) для улучшения безопасности OAuth 2.0 Authorization Code Flow.

## Архитектура

- **Frontend**: React приложение с TypeScript
- **Backend**: Node.js API с Express
- **Authentication**: Keycloak с PKCE
- **Database**: PostgreSQL для Keycloak

## Компоненты

### 1. PKCE Implementation
- Генерация `code_verifier` и `code_challenge`
- Безопасное хранение параметров в session storage
- Интеграция с Keycloak для PKCE flow

### 2. API Backend
- JWT валидация токенов
- Проверка роли `prothetic_user`
- Генерация mock данных отчётов
- Middleware для аутентификации и авторизации

### 3. Frontend
- Интеграция с Keycloak через PKCE
- Отображение отчётов
- Обработка ошибок аутентификации

## Запуск приложения

### Предварительные требования
- Docker и Docker Compose
- Node.js (для локальной разработки)

### 1. Запуск всех сервисов
```bash
docker-compose up --build
```

### 2. Доступ к сервисам
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **Keycloak**: http://localhost:8080

## Тестирование

### 1. Тестовые пользователи

#### Пользователи с ролью `prothetic_user` (имеют доступ к отчётам):
- **Username**: prothetic1, **Password**: prothetic123
- **Username**: prothetic2, **Password**: prothetic123
- **Username**: prothetic3, **Password**: prothetic123

#### Обычные пользователи (НЕ имеют доступ к отчётам):
- **Username**: user1, **Password**: password123
- **Username**: user2, **Password**: password123

#### Администраторы:
- **Username**: admin1, **Password**: admin123

### 2. Тестирование безопасности

#### Тест 1: Доступ с ролью prothetic_user
1. Войдите как `prothetic1` с паролем `prothetic123`
2. Нажмите "Download Report"
3. Ожидаемый результат: отчёты загружаются успешно

#### Тест 2: Доступ без роли prothetic_user
1. Войдите как `user1` с паролем `password123`
2. Нажмите "Download Report"
3. Ожидаемый результат: ошибка 403 "Role 'prothetic_user' required"

#### Тест 3: Доступ без токена
1. Откройте http://localhost:8000/reports в браузере
2. Ожидаемый результат: ошибка 401 "Access token required"

#### Тест 4: Доступ с невалидным токеном
1. Отправьте запрос с невалидным токеном
2. Ожидаемый результат: ошибка 401 "Invalid or expired token"

## API Endpoints

### GET /health
Проверка состояния API
```bash
curl http://localhost:8000/health
```

### GET /reports
Получение отчётов (требует аутентификации и роль prothetic_user)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/reports
```

## Безопасность

### PKCE Flow
1. Клиент генерирует `code_verifier` (случайная строка)
2. Клиент создаёт `code_challenge` (SHA256 хеш от code_verifier)
3. Клиент отправляет `code_challenge` в запросе авторизации
4. Сервер возвращает authorization code
5. Клиент отправляет authorization code + `code_verifier` для получения токена
6. Сервер проверяет, что хеш от `code_verifier` совпадает с `code_challenge`

### JWT Validation
- Проверка подписи токена через JWKS
- Валидация audience и issuer
- Проверка срока действия токена
- Проверка ролей пользователя

