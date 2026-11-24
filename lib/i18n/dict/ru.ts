import { plural } from "../plural";

const films = (n: number) => plural("ru", n, { one: "фильм", few: "фильма", many: "фильмов", other: "фильма" });
const tickets = (n: number) => plural("ru", n, { one: "билет", few: "билета", many: "билетов", other: "билета" });
/** Genitive after «из»: из 1 билета, из 5 билетов. */
const ticketsOf = (n: number) => plural("ru", n, { one: "билета", few: "билетов", many: "билетов", other: "билета" });

/** Heading split into [before, accent, after] — the accent word is drawn in red. */
export type Parts = [string, string, string?];

export const ru = {
  brand: ["Кино", "урна"] as [string, string],
  meta: {
    title: "Киноурна — что смотрим сегодня",
    description: "Каждый тайно загадывает фильмы, а урна, голосование или вычёркивание решают, что смотреть.",
    roomTitle: "Зал · Киноурна",
    roomDescription: "Заходи — выбираем, что смотреть.",
  },
  footer: {
    data: "Данные о фильмах — ",
    disclaimer: "Этот продукт использует TMDB API, но не одобрен и не сертифицирован TMDB.",
  },
  langLabel: "Язык",
  and: "и",
  quote: (t: string) => `«${t}»`,

  home: {
    tagline: "Сеанс для своих",
    noSignup: "Без регистрации",
    modes: "Жребий · Голосование · Вычёркивание",
    lead: "Помните, как писали фильмы на бумажках и тянули из шапки? Теперь то же самое, только с обложками и без споров.",
    steps: ["Каждый тайно загадывает фильмы", "Открываете урну — все билеты на столе", "Жребий, голосование или вычёркивание"],
    nameLabel: "Как тебя зовут",
    namePlaceholder: "Например, Саша…",
    create: "Создать комнату",
    orCode: "или по коду друга",
    codeLabel: "Код комнаты",
    join: "Войти",
    errName: "Сначала напиши, как тебя зовут.",
    errCode: "Код — это 4 буквы или цифры, например K7QM.",
  },

  join: {
    kicker: "Тебя зовут в зал",
    hostGathers: (name: string) => `${name} собирает компанию, чтобы выбрать фильм.`,
    gathering: "Компания выбирает фильм.",
    late: " Выбор уже идёт — ты сможешь посмотреть, чем всё закончится.",
    namePlaceholder: "Имя…",
    submit: "Войти в зал",
    errName: "Напиши имя — так друзья поймут, кто есть кто.",
  },

  room: {
    toHome: "На главную",
    rail: { lobby: "Зал", collect: "Загадываем", board: "Урна", play: "Выбор", result: "Сеанс" },
    stages: "Этапы",
    round: (n: number) => `Раунд ${n}`,
    inRoom: (names: string) => `В зале: ${names}`,
    shareLabel: (code: string) => `Код комнаты ${code}, поделиться`,
    shareText: (code: string) => `Заходи выбирать фильм — код ${code}`,
    linkCopied: "Ссылка скопирована — кидай в чат",
    codeIs: (code: string) => `Код комнаты: ${code}`,
    missingKicker: "Сеанс не найден",
    missingTitle: (code: string) => `Зала ${code} нет`,
    missingText: "Проверь код. Комнаты, в которых долго ничего не происходит, закрываются сами.",
    createNew: "Создать новую",
    failedKicker: "Не получилось открыть зал",
    retry: "Попробовать ещё раз",
    loading: "Открываем зал",
    hostLabel: "ведущий",
    hostFallback: "ведущий",
    you: " · это ты",
    youShort: " · ты",
    mine: "твой",
    matched: (n: number) => `×${n} совпало`,
    skipAnimation: "Пропустить анимацию",
    back: "Назад",
    backTo: (stage: string) => `Назад, к этапу «${stage}»`,
    /** Toast for guests when the host steps the room back. */
    movedBack: {
      lobby: "Шаг назад — снова в зале.",
      collect: "Шаг назад — снова загадываем. Можно добавить или поменять фильмы.",
      board: "Шаг назад — снова у урны.",
    },
  },

  goBack: {
    title: (stage: string) => `Назад, к этапу «${stage}»?`,
    text: {
      lobby: "Все вернутся в зал: можно поменять настройки или убрать лишних. Загаданные билеты сохранятся.",
      collect: "Все вернутся к загадыванию: кто не успел — допишет, остальные могут поменять свои фильмы. Загаданные билеты сохранятся.",
      board: "Все вернутся к урне — можно выбрать другой режим.",
    },
    lose: {
      vote: "Голоса этого раунда сбросятся.",
      strike: "Вычёркивание начнётся заново.",
      result: "Выбранный фильм сбросится — выбирать будете заново.",
    },
    cancel: "Остаться",
    confirm: "Вернуться",
  },

  lobby: {
    codeKicker: "Код зала",
    invite: "Позвать друзей",
    orSay: "или продиктуй код вслух",
    inRoom: (n: number) => `В зале · ${n}`,
    kick: "убрать",
    sure: "точно?",
    kickLabel: (name: string) => `Убрать ${name} из зала`,
    kickConfirm: (name: string) => `Точно убрать ${name}? Нажми ещё раз`,
    perPlayer: "Сколько фильмов загадывает каждый",
    perPlayerAria: "Фильмов на человека",
    perPlayerValue: (n: number) => `${n} ${films(n)}`,
    allowOwn: "Можно голосовать за свои фильмы",
    allowOwnHint: "Обычно выключено, чтобы каждый не тянул одеяло на себя.",
    aloneNote: "Подожди друзей — или начни, они смогут зайти и позже.",
    readyNote: "Все на месте? Тогда начинаем.",
    keptNote: "Загаданные билеты сохранились — можно продолжать.",
    waitHost: (name: string) => `Ждём, пока ${name} начнёт`,
    start: "Загадывать",
  },

  collect: {
    kicker: "Тайный выбор",
    kickerRound: (n: number) => `Раунд ${n} · тайный выбор`,
    title: (n: number): Parts => [`Загадай ${n} `, films(n)],
    sub: "Никто не увидит твои билеты, пока урну не откроют. Даже ведущий.",
    yourTickets: "Твои билеты",
    whoPicked: "Кто сколько загадал",
    progress: (n: number, of: number) => `${n} из ${of}`,
    allIn: "Все билеты в урне.",
    stillPicking: (names: string) => `Ещё загадывают: ${names}. Можно открыть и так.`,
    waitOthers: (host: string) => `Ждём остальных — урну откроет ${host}`,
    left: (n: number) => `Осталось загадать: ${n}`,
    open: (n: number) => `Открыть урну · ${n}`,
    notAllTitle: "Ещё не все загадали",
    notAllText: "Если открыть урну сейчас, в игру попадут только те билеты, что уже загаданы.",
    wait: "Подождать",
    openAnyway: "Открыть всё равно",
    overLimit: "Лимит уменьшили — убери лишние билеты, иначе в урну попадут только первые.",
    searchLabel: "Найти фильм, сериал или мультфильм",
    placeholder: "Например, «Начало» или Dune…",
    placeholderFull: "Все билеты заполнены — убери один, чтобы заменить",
    searching: "Ищем",
    demo: "Демо-каталог из 16 фильмов. Добавь ключ TMDB — и найдётся всё.",
    added: "уже в билетах",
    add: "добавить",
    nothing: "Ничего не нашлось. Попробуй по-английски или в оригинале.",
    searchFailed: "Поиск не ответил. Попробуй ещё раз.",
    manual: ["Нет нужного? Добавить «", "» просто названием"] as [string, string],
    hint: "Ищем на любом языке: фильмы, сериалы, мультфильмы, аниме.",
  },

  ticket: {
    serial: (n: string) => `Билет № ${n}`,
    empty: (n: string) => `Билет № ${n} — пусто`,
    remove: (t: string) => `Убрать «${t}»`,
    kind: { animation: "мульт", tv: "сериал", movie: "фильм", manual: "своё" },
  },

  board: {
    kicker: "Урна открыта",
    title: (n: number): Parts => [`На столе ${n} `, films(n)],
    sub: "Кто что загадал — узнаете в самом конце.",
    howPick: "Как будем выбирать?",
    hostChooses: (name: string) => `${name} выбирает режим`,
    modeAria: "Режим выбора",
    waitChoice: (name: string) => `Ждём, что выберет ${name}`,
    start: (mode: string) => `Начать · ${mode}`,
  },

  modes: {
    urn: {
      name: "Урна",
      pitch: "Чистый жребий",
      how: "Тянем один билет. Если фильм загадали двое — у него два билета.",
    },
    vote: {
      name: "Голосование",
      pitch: "Что устроит всех",
      how: "Каждый отмечает всё, что готов смотреть. Больше всего голосов — побеждает, ничью решает урна.",
    },
    strike: {
      name: "Вычёркивание",
      pitch: "По кругу, до последнего",
      how: "По очереди каждый убирает один фильм, который точно не хочет. Последний оставшийся — смотрим.",
    },
  },

  urn: {
    kicker: "Режим · урна",
    title: "Кто тянет?",
    text: (n: number, dupes: boolean) =>
      `Тянуть может любой. В барабане ${n} ${tickets(n)}${dupes ? " — совпавшие фильмы лежат в нескольких экземплярах" : ""}.`,
    draw: "Тянуть билет",
    changeNote: "Передумали? Можно выбрать другой способ.",
    otherMode: "Другой режим",
  },

  vote: {
    kicker: "Режим · голосование",
    title: ["Что ", "готов", " смотреть?"] as Parts,
    sub: (allowOwn: boolean) =>
      `Отмечай сколько угодно — хоть всё. ${allowOwn ? "За свои тоже можно." : "Свои билеты отметить нельзя."} Голоса тайные.`,
    marked: " — отмечен",
    late: "Голосование началось до твоего прихода — смотрим, чем кончится.",
    waiting: (names: string) => `Ждём: ${names}`,
    allVoted: "Все проголосовали",
    close: "Подвести итог",
    accepted: "Голос принят",
    change: (n: number) => `Изменить · ${n}`,
    submit: (n: number) => `Голосую · ${n}`,
  },

  strike: {
    kicker: "Режим · вычёркивание",
    yourTurn: ["Твой ", "ход"] as Parts,
    turnOf: (name: string) => `Ход: ${name}`,
    pickPrompt: "Выбери фильм, который точно не хочешь смотреть.",
    watchPrompt: "Смотрим, что уберут.",
    left: (n: number) => `Осталось ${n} ${films(n)} — последний и будем смотреть.`,
    queue: "Очередь",
    then: ", затем",
    someone: "кто-то",
    tapPoster: "Нажми на постер, чтобы выбрать.",
    waitTurn: (name: string) => `Ждём ход: ${name}`,
    skip: "Пропустить ход",
    strikeIt: (t: string) => `Вычеркнуть «${t}»`,
    strikeBtn: "Вычеркнуть",
  },

  result: {
    spinning: "Крутим барабан",
    drawn: "Вытянули!",
    lastOne: "Остался последний",
    counting: "Считаем голоса",
    tonight: "Сегодня смотрим",
    whoseTicket: "Чей билет",
    pickedBy: "Загадали",
    trailer: "Трейлер",
    moreTmdb: "Подробнее на TMDB",
    guestNote: "Приятного просмотра. Ведущий может перетянуть или начать новый раунд.",
    redraw: "Перетянуть",
    otherMode: "Другой режим",
    newRound: "Новый раунд",
    newRoundSure: "Точно? Всё заново",
    howVoted: "Как голосовали",
    tie: (list: string) => `Ничья: ${list} — решила урна.`,
    howStruck: "Как вычёркивали",
    draw: "Жребий",
    chance: (w: number, total: number) => `Шанс был ${w} из ${total} ${ticketsOf(total)}.`,
    redrawn: (list: string) => ` Перетягивали: ${list}.`,
    more: "Читать дальше",
    whoPickedWhat: "Кто что загадал",
  },

  /** The film card that opens from a poster. */
  film: {
    about: (t: string) => `О фильме «${t}»`,
    close: "Закрыть",
    trailer: "Трейлер",
    trailerFrame: (t: string) => `Трейлер «${t}»`,
    makers: (tv: boolean, n: number): string => (tv ? (n > 1 ? "Создатели" : "Создатель") : n > 1 ? "Режиссёры" : "Режиссёр"),
    cast: "В ролях",
    runtime: (min: number) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return [h ? `${h} ч` : "", m ? `${m} мин` : ""].filter(Boolean).join(" ");
    },
    seasons: (n: number) => `${n} ${plural("ru", n, { one: "сезон", few: "сезона", many: "сезонов", other: "сезона" })}`,
    noOverview: "Описания пока нет — зато можно глянуть трейлер.",
    manual: "Этот фильм вписали вручную, без каталога, поэтому подробностей нет.",
    vote: "Готов смотреть",
    unvote: "Снять отметку",
  },

  /** Server errors arrive as codes; `{n}` is filled from the error params. */
  errors: {
    notFound: "Комната не найдена — проверь код.",
    busy: "Слишком много одновременных действий, попробуй ещё раз.",
    needName: "Как тебя зовут?",
    createFailed: "Не получилось создать комнату, попробуй ещё раз.",
    roomFull: "В комнате уже нет мест.",
    noSession: "Сессия не найдена — зайди в комнату заново.",
    notInRoom: "Тебя нет в этой комнате — зайди заново.",
    noTitle: "У фильма нет названия.",
    badTitle: "Название слишком странное.",
    hostOnly: "Это может сделать только ведущий.",
    settingsLocked: "Настройки уже не поменять.",
    filmsLocked: "Сейчас нельзя менять фильмы.",
    alreadyPicked: "Этот фильм уже в твоём списке.",
    limit: "Можно загадать не больше {n}.",
    urnOpened: "Урну уже открыли.",
    needTwo: "В урне меньше двух фильмов — загадайте ещё.",
    unknownMode: "Неизвестный режим.",
    openUrnFirst: "Сначала откройте урну.",
    urnEmpty: "В урне больше не осталось билетов.",
    voteOver: "Голосование уже закончилось.",
    voteLate: "Голосование началось до твоего прихода.",
    strikeOver: "Вычёркивание уже закончилось.",
    notYourTurn: "Сейчас не твой ход.",
    alreadyStruck: "Этот фильм уже вычеркнули.",
    nothingToSkip: "Сейчас нечего пропускать.",
    cantGoBack: "Сейчас туда не вернуться.",
    cantKickSelf: "Себя выгнать нельзя.",
    badAction: "Неизвестное действие.",
    dbMissing:
      "Сервер не подключён к базе: добавь ключи Supabase в Vercel → Settings → Environment Variables и пересобери проект.",
    server: "Что-то сломалось на сервере. Попробуй ещё раз.",
    network: "Нет связи с сервером. Проверь интернет.",
    generic: "Что-то пошло не так.",
    joinFirst: "Сначала войди в комнату.",
  },
};

export type Dict = typeof ru;
export type ErrorCode = keyof Dict["errors"];
