# 🔄 Изменение порта на 3015

## 📝 Что изменено

Все Docker конфигурации обновлены для использования порта **3015** вместо 3000:

### ✅ Обновленные файлы:

1. **Dockerfile**

   - `EXPOSE 3015`
   - `ENV PORT 3015`

2. **docker-compose.yml**

   - `ports: - "3015:3015"`
   - Health check: `http://localhost:3015/api/health`
   - Default URL: `http://localhost:3015`

3. **docker-compose.prod.yml**

   - `ports: - "3015:3015"`
   - Health check: `http://localhost:3015/api/health`

4. **nginx.conf**

   - Upstream: `server app:3015`

5. **deploy.sh**
   - Health check URL: `http://localhost:3015/api/health`
   - Success message: `http://localhost:3015`

## 🚀 Запуск

Теперь приложение будет доступно на порту **3015**:

```bash
# Локальный запуск
docker-compose up -d

# Продакшен
docker-compose -f docker-compose.prod.yml up -d

# Автоматический деплой
./deploy.sh
```

## 🌐 Доступ

- **Локально**: http://localhost:3015
- **С Nginx**: http://localhost (проксирует на 3015)
- **Прямой доступ**: http://your-server:3015

## ⚠️ Важно

При деплое на хостинг убедитесь, что:

1. Порт 3015 открыт в файрволе
2. В настройках хостинга указан правильный порт
3. Переменная `NUXT_PUBLIC_SITE_URL` указывает на правильный домен
