import { randomUUID } from 'node:crypto'
import { parseArgs } from 'node:util'

const DEFAULT_URL = 'http://localhost:8080'

const DEFAULT_COUNT = 200

const SEED = 20261121

const NOTES_PATH = '/api/notes'

const TITLES = [
  'Покупки на неделю',
  'Переезд',
  'Отпуск в Калининграде',
  'Ремонт кухни',
  'Подготовка к собеседованию',
  'Книги на осень',
  'День рождения Маши',
  'Дача: весенние работы',
  'Запуск лендинга',
  'Медицинский осмотр',
  'Курс по TypeScript',
  'Список фильмов',
  'Документы для визы',
  'Генеральная уборка',
  'Подарки к Новому году',
  'Велопоход выходного дня',
  'Ретроспектива спринта',
  'Налоговый вычет',
  'Утренняя рутина',
  'Идеи для блога'
]

const TODOS = [
  'Молоко',
  'Хлеб',
  'Купить батарейки для пульта',
  'Позвонить маме',
  'Записаться к стоматологу на следующую неделю',
  'Заказать коробки',
  'Проверить сроки действия паспорта',
  'Собрать аптечку',
  'Оплатить интернет',
  'Забрать посылку из пункта выдачи',
  'Согласовать окно выкладки с командой поддержки и предупредить пользователей заранее',
  'Обновить зависимости',
  'Прочитать главу 4',
  'Написать черновик статьи',
  'Полить цветы',
  'Сдать отчёт',
  'Купить билеты на поезд',
  'Забронировать гостиницу рядом с вокзалом',
  'Сделать бэкап фотографий',
  'Разобрать почту',
  'Почистить фильтр кофемашины',
  'Выбрать краску для стен',
  'Повторить алгоритмы сортировки',
  'Подготовить вопросы работодателю'
]

const SUFFIXES = ['', '', '', ' — срочно', ' (вторая попытка)', ' 2.0', ': план Б']

const createRandom = (seed) => {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0

    let value = state

    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const random = createRandom(SEED)

const pick = (items) => items[Math.floor(random() * items.length)]

const toTodoCount = () => {
  const roll = random()

  if (roll < 0.08) {
    return 0
  }

  if (roll < 0.7) {
    return 1 + Math.floor(random() * 5)
  }

  if (roll < 0.95) {
    return 6 + Math.floor(random() * 10)
  }

  return 20 + Math.floor(random() * 30)
}

const toTitle = (index) => {
  const roll = random()

  if (roll < 0.06) {
    return ''
  }

  if (roll < 0.1) {
    return `${pick(TITLES)}: очень длинное название, чтобы проверить перенос строк в карточке и заголовке редактора`
  }

  return `${pick(TITLES)}${pick(SUFFIXES)} №${index + 1}`
}

const toNote = (index) => {
  const count = toTodoCount()
  const completedShare = random()
  const title = toTitle(index)

  const todos = Array.from({ length: count }, () => ({
    id: randomUUID().replaceAll('-', ''),
    text: pick(TODOS),
    done: random() < completedShare
  }))

  return { title: title || (count ? '' : pick(TITLES)), todos }
}

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: DEFAULT_URL },
    count: { type: 'string', default: String(DEFAULT_COUNT) }
  }
})

const baseUrl = values.url.replace(/\/$/u, '')

const count = Number.parseInt(values.count, 10)

if (!Number.isInteger(count) || count < 1) {
  throw new RangeError(`--count must be a positive integer, received ${values.count}`)
}

let created = 0

for (let index = 0; index < count; index++) {
  const response = await fetch(baseUrl + NOTES_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(toNote(index))
  })

  if (!response.ok) {
    throw new Error(`POST ${NOTES_PATH} failed with ${response.status}: ${await response.text()}`)
  }

  created++
}

console.log(`Created ${created} notes at ${baseUrl}`)
