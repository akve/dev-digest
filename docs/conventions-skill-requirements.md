# Conventions → Skill: вимоги фічі

## Мета
Додати фічу, яка знаходить house conventions у репозиторії, дає користувачу підтвердити/відхилити знайдені інсайти, і перетворює підтверджені інсайти у скіл, прив'язаний до агента.

## User Stories
- Як юзер, я можу запустити аналіз репозиторію на conventions.
- Як юзер, я можу побачити всі знайдені conventions.
- Як юзер, я можу зробити `accept/reject` конкретного інсайту.
- Як юзер, я можу редагувати конкретний інсайт.
- Як юзер, я можу перейти в модал редагування скіла з вибраних інсайтів.
- Як юзер, я можу редагувати майбутній текст скіла з інсайтами та метадані.
- Як юзер, я можу зберегти скіл або відмовитись від створення.

## Backend: Data Model
- Створити таблицю `conventions`.
- Таблиця зберігає кандидатів conventions та їхній стан (мінімум: `approved/rejected/pending`), evidence та confidence.

## Backend: API
- Додати роут `POST /repos/:id/conventions/extract`.
- Роут запускає extraction pipeline для конкретного репозиторію.

## Pipeline Extraction

### 1) Відбір зразків (без моделі)
Відбір робиться повністю кодом:
- конфіги: `eslint`, `tsconfig`, `prettier`;
- топ-12 файлів через готовий метод `repoIntel.getConventionSamples()`.

### 2) LLM-аналіз (дешева модель)
- Викликати дешеву модель для аналізу репозиторію (частина функціоналу вже може існувати).
- Очікуваний формат відповіді моделі: список кандидатів:
  - `{ category, rule, evidence, confidence }`;
  - `evidence` включає як мінімум `file` + `line` (або діапазон рядків).

### 3) Валідація доказів (code-based guardrail)
Для кожного кандидата обов'язково перевіряти:
- чи існує файл з evidence;
- чи існує зазначений рядок (або рядки) коду.

Кандидати без валідних доказів мають відкидатись до показу в UI/збереження.

## UI: Conventions List

### Сторінка
- Контекст: `Skills Lab > Conventions`.
- Заголовок: `Conventions in <repo-name>`.
- Підзаголовок з метриками скану: `Detected from N sample files`, `last scan ...`.

### Дії сторінки
- Кнопка `Re-scan`.
- Кнопка `Create skill`.
- Масова дія: `Deselect all`.
- Лічильник стану: `X of Y accepted`.

### Картка кандидата
Кожен кандидат у вигляді card з:
- текстом правила (headline);
- evidence (`file:path` + рядок/діапазон рядків);
- прев'ю фрагмента коду;
- confidence (відсоток + прогрес-бар);
- діями праворуч: `approve` / `reject` (toggle state, явний візуальний стан accepted).

## UI: Create Skill Modal

Модалка `Create skill from conventions`:
- Інфо-банер: merged з `N accepted conventions` для поточного репозиторію; все нижче editable до збереження.
- Поля:
  - `Name` (required),
  - `Description`,
  - `Type` (default: `convention`),
  - `Enabled` (toggle, чи додавати блок у prompts агента),
  - `Skill body` (великий markdown editor).
- `Skill body` prefilled із approved conventions, але повністю редагований.
- Індикатори редактора: `unsaved`, token count.
- Дії: `Cancel` та `Create skill`.

## Створення та прив'язка скіла
- З усіх approved кандидатів зібрати один скіл: `repo-conventions`.
- Прилінкувати цей скіл до агента механізмом з лабораторної.

## Опційне розширення
- Як еволюційний варіант: не обмежуватись одним скілом, а створювати багато скілів зі знахідок (наприклад, по категоріях/доменах).

## Definition of Done (мінімум)
- Є таблиця `conventions`.
- Працює `POST /repos/:id/conventions/extract`.
- Семпли беруться кодом (конфіги + `repoIntel.getConventionSamples()` top-12).
- Модель повертає кандидатів у погодженому форматі.
- Evidence-валидація відсікає невалідні кандидати.
- В UI можна `approve/reject`, бачити список та confidence/evidence.
- Модалка створення скіла дозволяє редагувати метадані + body.
- `Create skill` створює `repo-conventions` і лінкує до агента.
