# Архитектура работы с тендерами во фронтенде

## 📋 Обзор

Система работы с тендерами полностью переработана для использования единого API слоя с автоматическим управлением токенами и консистентной архитектурой.

## 🔧 Ключевые компоненты

### 1. Единый сервис для тендеров (`/src/services/tenderService.ts`)

**Основные возможности:**
- Автоматическое управление Bearer токенами через единый API слой
- Обработка обновления токенов при 401 ошибке
- Фильтрация тендеров по компании с параметром `?company=ID`
- Автоматическое назначение компании на backend через `request.user.company`

**Методы:**
```typescript
// Получение всех публичных тендеров (статус APPROVED)
fetchAllTenders(filters?: TenderFilters): Promise<TendersResponse>

// Получение тендеров конкретной компании по ID
fetchCompanyTenders(companyId: number): Promise<Tender[]>

// Получение тендеров текущего пользователя (все статусы)
fetchMyTenders(filters?: TenderFilters): Promise<TendersResponse>

// Создание нового тендера (компания назначается автоматически)
createTender(tenderData: CreateTenderRequest): Promise<Tender>
```

### 2. Redux слайсы обновлены

**`/src/store/slices/tendersSlice.ts`:**
- Использует новый `tenderService` вместо прямых API вызовов
- Автоматическая обработка пагинированных ответов
- Русские комментарии для всех критически важных функций

**`/src/store/slices/companiesSlice.ts`:**
- Метод `fetchCompanyTenders` обновлён для использования `tenderService.fetchCompanyTenders()`
- Фильтрация по компании через параметр `company=ID`

### 3. Компоненты интерфейса

**Создание тендера (`/src/pages/SupplierDashboard/CreateTender.tsx`):**
- Использует `tenderService.createTender()` для создания
- Автоматически обновляет Redux store после создания через `dispatch(fetchMyTenders())`
- Поля формы полностью соответствуют backend модели
- Категории загружаются через единый API слой
- Поле `company` НЕ отправляется - назначается автоматически на backend

**Отображение тендеров компании (`/src/pages/CompanyCard/index.tsx`):**
- Использует `fetchCompanyTenders(companyId)` из Redux
- Показывает только тендеры текущей компании
- Автоматическое обновление при загрузке страницы

## 🔄 Процесс создания тендера

```mermaid
graph LR
A[Пользователь заполняет форму] --> B[Валидация на фронтенде]
B --> C[tenderService.createTender()]
C --> D[API слой добавляет Bearer токен]
D --> E[POST /api/tenders/]
E --> F[Backend назначает company автоматически]
F --> G[Ответ с созданным тендером]
G --> H[dispatch(fetchMyTenders())]
H --> I[Обновление Redux store]
I --> J[Перенаправление на /dashboard]
```

## 🎯 Фильтрация тендеров по компании

```typescript
// Для получения тендеров конкретной компании
const companyTenders = await tenderService.fetchCompanyTenders(companyId);

// API запрос: GET /api/tenders/?company=123
// Результат: только тендеры компании с ID = 123
```

## 🔐 Автоматическое управление токенами

Все запросы через `tenderService` автоматически:
1. Добавляют Bearer токен в заголовки
2. При 401 ошибке выполняют refresh токена
3. Повторяют оригинальный запрос с новым токеном
4. При неудачном refresh перенаправляют на страницу входа

## 📝 Соответствие полей backend модели

**Frontend форма → Backend модель:**
- `title` → `Tender.title` (CharField, обязательное)
- `description` → `Tender.description` (TextField, обязательное)
- `categories` → `Tender.categories` (ManyToMany, обязательное)
- `city` → `Tender.city` (CharField, опциональное)
- `deadline_date` → `Tender.deadline_date` (DateField, опциональное)
- `budget_min` → `Tender.budget_min` (DecimalField, опциональное)
- `budget_max` → `Tender.budget_max` (DecimalField, опциональное)

**Автоматически назначаемые поля:**
- `author` ← `request.user` (автоматически на backend)
- `company` ← `request.user.company` (автоматически на backend)
- `status` ← `PENDING` (по умолчанию)

## ✅ Преимущества новой архитектуры

1. **Единообразие:** Все запросы к тендерам идут через один сервис
2. **Безопасность:** Автоматическое управление токенами без дублирования логики
3. **Надёжность:** Повтор запросов при истечении токенов
4. **Консистентность:** Одинаковый подход для всех операций с тендерами
5. **Масштабируемость:** Легко добавлять новые методы работы с тендерами
6. **Документированность:** Русские комментарии для всех ключевых функций

## 🚀 Результат

Фронтенд теперь корректно отображает тендеры с автоматической фильтрацией по компаниям, обеспечивает создание тендеров с автоматическим назначением компании и обновляет локальное состояние после всех операций.