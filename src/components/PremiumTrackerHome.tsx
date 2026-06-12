import React from 'react';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  MoreHorizontal,
  Plus,
  Stethoscope,
  CalendarClock,
  UtensilsCrossed,
  NotebookPen,
  ChartNoAxesCombined,
  Video
} from 'lucide-react';
import type { TrackerView } from './CareTrackerTab';

type MedicationStatusTone = 'taken' | 'waiting' | 'missed' | 'delayed' | 'planned';

type MedicationCardItem = {
  time: string;
  title: string;
  dose: string;
  relation: string;
  statusLabel: string;
  tone: MedicationStatusTone;
};

const medicationCards: MedicationCardItem[] = [
  { time: '08:00', title: 'Ламотриджин 25 мг', dose: '1 таблетка', relation: 'После еды', statusLabel: 'Принято', tone: 'taken' },
  { time: '10:30', title: 'Ламотриджин 25 мг', dose: '', relation: '', statusLabel: 'Через 45 мин', tone: 'waiting' },
  { time: '14:00', title: 'Магний B6', dose: '', relation: '', statusLabel: 'Запланировано', tone: 'planned' },
  { time: '20:30', title: 'Омега 3', dose: '', relation: 'Перед сном', statusLabel: 'Перед сном', tone: 'delayed' }
];

const miniViews: Array<{ id: TrackerView; label: string; icon: React.ReactNode }> = [
  { id: 'day', label: 'День', icon: <Clock3 size={14} /> },
  { id: 'meds', label: 'Лек.', icon: <Stethoscope size={14} /> },
  { id: 'food', label: 'Еда', icon: <UtensilsCrossed size={14} /> },
  { id: 'queues', label: 'Очереди', icon: <CalendarClock size={14} /> },
  { id: 'report', label: 'Отчет', icon: <FileText size={14} /> },
  { id: 'video', label: 'Видео', icon: <Video size={14} /> }
];

function formatRussianDate(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date);
}

function formatWeekdayShort(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date).replace('.', '').toUpperCase();
}

function buildWeekDays() {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(today.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      date,
      key: date.toISOString().slice(0, 10),
      label: formatWeekdayShort(date),
      day: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      dots: index === 0 ? 1 : index === 1 || index === 2 ? 2 : index === 3 ? 3 : 1
    };
  });
}

function statusToneClasses(tone: MedicationStatusTone) {
  switch (tone) {
    case 'taken':
      return 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/15';
    case 'waiting':
      return 'bg-[#7C5CFF]/12 text-[#6F4CF7] ring-[#7C5CFF]/15';
    case 'missed':
      return 'bg-rose-500/12 text-rose-700 ring-rose-500/15';
    case 'delayed':
      return 'bg-orange-500/12 text-orange-700 ring-orange-500/15';
    case 'planned':
    default:
      return 'bg-slate-500/10 text-slate-600 ring-slate-500/10';
  }
}

function statusDotClass(tone: MedicationStatusTone) {
  switch (tone) {
    case 'taken':
      return 'bg-emerald-500';
    case 'waiting':
      return 'bg-[#7C5CFF]';
    case 'missed':
      return 'bg-rose-500';
    case 'delayed':
      return 'bg-orange-500';
    case 'planned':
    default:
      return 'bg-slate-400';
  }
}

function MedicationStatusPill({ item }: { item: MedicationCardItem }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${statusToneClasses(item.tone)}`}>
      <span className={`h-2 w-2 rounded-full ${statusDotClass(item.tone)}`} />
      {item.statusLabel}
    </div>
  );
}

export function PremiumTrackerHome({ onOpenView }: { onOpenView: (view: TrackerView) => void }) {
  const weekDays = React.useMemo(() => buildWeekDays(), []);
  const today = new Date();
  const todayLabel = formatRussianDate(today);

  return (
    <div className="relative flex min-h-0 flex-col overflow-hidden px-4 pb-32 pt-3 sm:px-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-6rem] top-[-4rem] h-72 w-72 rounded-full bg-[#E8E0FF]/80 blur-3xl" />
        <div className="absolute right-[-5rem] top-[12rem] h-72 w-72 rounded-full bg-[#D9F4EF]/70 blur-3xl" />
        <div className="absolute bottom-[-2rem] left-[25%] h-56 w-56 rounded-full bg-white/70 blur-3xl" />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/75">Трекер</p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-[1.03] tracking-tight text-[#13273F]">Опора</h1>
          <p className="mt-2 text-sm font-medium text-[#6F7B8E]">Лекарства и назначения</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#7C5CFF] backdrop-blur-2xl"
            aria-label="Уведомления"
          >
            <Bell size={21} />
            <span className="absolute right-0 top-0 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#7C5CFF] px-1 text-[11px] font-extrabold text-white shadow-sm">
              3
            </span>
          </button>
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#7C5CFF] backdrop-blur-2xl"
            aria-label="Меню"
          >
            <MoreHorizontal size={22} />
          </button>
        </div>
      </div>

      <section className="relative z-10 mt-5 rounded-[32px] border border-white/80 bg-white/66 p-4 shadow-[0_18px_45px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
        <div className="flex gap-4">
          <div className="relative h-24 w-24 shrink-0">
            <img
              src="/opora-child-avatar.png"
              alt="Амаль"
              className="h-full w-full rounded-[28px] object-cover ring-4 ring-white/85"
            />
            <div className="absolute -bottom-2 left-5 h-4 w-12 rounded-full bg-[#7C5CFF]/15 blur-sm" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[30px] font-extrabold leading-none tracking-tight text-[#13273F]">Амаль</h2>
                  <span className="mt-1 text-[#54617B]">
                    <ChevronRight size={17} />
                  </span>
                </div>
                <p className="mt-2 text-[15px] font-semibold text-[#5D6880]">6 лет 2 месяца · РАС</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0EBFF] text-[#7C5CFF]">
                <Clock3 size={18} />
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#F2EEFF] px-4 py-2 text-sm font-bold text-[#7C5CFF]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7C5CFF]/15">
                <span className="h-2.5 w-2.5 rounded-full bg-[#7C5CFF]" />
              </span>
              Активный профиль
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="rounded-[28px] border border-white/75 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <div className="flex items-center gap-2 text-[#6F4CF7]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1EBFF]">
                <Clock3 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#6C748B]">Ближайший прием</p>
                <p className="text-[15px] font-semibold text-[#13273F]">Сегодня, {todayLabel}</p>
              </div>
            </div>
            <p className="mt-4 text-4xl font-black tracking-tight text-[#13273F]">10:30</p>
            <p className="mt-3 text-lg font-semibold text-[#13273F]">Ламотриджин 25 мг</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F2EEFF] px-4 py-2 text-sm font-bold text-[#7C5CFF]">
              Через 45 мин
            </div>
          </div>

          <div className="relative min-h-[184px] overflow-hidden rounded-[28px] border border-white/75 bg-gradient-to-br from-[#F5EEFF] via-[#F9FBFF] to-[#ECE9FF] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div className="absolute inset-0 opacity-90">
              <svg viewBox="0 0 400 280" className="h-full w-full">
                <defs>
                  <linearGradient id="premiumSky" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
                    <stop offset="48%" stopColor="#EAE3FF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#CFC2FF" stopOpacity="0.88" />
                  </linearGradient>
                  <linearGradient id="premiumPeak" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#AE9CFF" stopOpacity="0.82" />
                  </linearGradient>
                </defs>
                <rect width="400" height="280" fill="url(#premiumSky)" />
                <circle cx="308" cy="64" r="42" fill="#FFFFFF" fillOpacity="0.75" />
                <path d="M0 220 L88 146 L150 194 L218 126 L290 184 L400 138 L400 280 L0 280 Z" fill="url(#premiumPeak)" />
                <path d="M0 238 L70 202 L118 220 L176 168 L242 226 L310 182 L400 212 L400 280 L0 280 Z" fill="#BDA9FF" fillOpacity="0.42" />
                <path d="M0 280 L400 280" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="3" />
              </svg>
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-end">
                <p className="max-w-28 text-right text-[11px] font-semibold leading-relaxed text-[#6A6487]/75">
                  Декоративная иллюстрация гор в стиле бренда
                </p>
              </div>
              <div className="flex items-end justify-end">
                <div className="rounded-full bg-white/55 px-3 py-1.5 text-[11px] font-bold text-[#6F4CF7] backdrop-blur-xl">
                  Спокойный медицинский wellness
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F4F0] text-[#45A69B] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <CalendarDays size={22} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Общее расписание</p>
              <h2 className="text-[24px] font-extrabold tracking-tight text-[#13273F]">Неделя, {todayLabel}</h2>
            </div>
          </div>
          <button type="button" className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-[#4F5D78] backdrop-blur-xl">
            Сегодня
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <button
              key={day.key}
              type="button"
              className={`flex min-h-[98px] flex-col items-center justify-between rounded-[24px] border px-2 py-3 text-center shadow-[0_10px_24px_rgba(124,92,255,0.06)] transition-transform active:scale-[0.99] ${
                day.isToday
                  ? 'border-transparent bg-[linear-gradient(180deg,#8B74FF_0%,#6950F3_100%)] text-white'
                  : 'border-white/80 bg-white/72 text-[#13273F] backdrop-blur-xl'
              }`}
            >
              <span className={`text-[11px] font-extrabold tracking-[0.12em] ${day.isToday ? 'text-white/80' : 'text-[#79859B]'}`}>
                {day.label}
              </span>
              <span className="text-[28px] font-black leading-none">{day.day}</span>
              <span className="flex items-center justify-center gap-1">
                {Array.from({ length: day.dots }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full ${day.isToday ? 'bg-white' : index === 0 ? 'bg-[#7C5CFF]' : 'bg-[#68C7B8]'}`}
                  />
                ))}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="relative z-10 mt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2EEFF] text-[#7C5CFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <Stethoscope size={22} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Сегодняшние назначения</p>
              <h2 className="text-[24px] font-extrabold tracking-tight text-[#13273F]">Медикаменты и статусы</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenView('meds')}
            className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(180deg,#F5F1FF_0%,#ECE5FF_100%)] px-4 py-2 text-sm font-extrabold text-[#6F4CF7] shadow-[0_10px_22px_rgba(124,92,255,0.12)]"
          >
            Добавить
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C5CFF] text-white">
              <Plus size={16} />
            </span>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {medicationCards.map(item => (
            <button
              key={`${item.time}-${item.title}`}
              type="button"
              className="group flex w-full items-center gap-4 rounded-[28px] border border-white/80 bg-white/72 px-4 py-4 text-left shadow-[0_12px_28px_rgba(124,92,255,0.06)] backdrop-blur-2xl transition-transform active:scale-[0.995]"
            >
              <div className="min-w-[72px]">
                <p className="text-[24px] font-black leading-none tracking-tight text-[#13273F]">{item.time}</p>
                <p className="mt-2 text-sm font-semibold text-[#7A869B]">{item.relation || 'После еды'}</p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-extrabold leading-tight text-[#13273F]">{item.title}</p>
                {item.dose && <p className="mt-1 text-sm font-semibold text-[#6D7690]">{item.dose}</p>}
                {!item.dose && <p className="mt-1 text-sm font-semibold text-[#6D7690]">{item.relation || ' '}</p>}
              </div>

              <div className="flex flex-col items-end gap-3">
                <MedicationStatusPill item={item} />
                <ChevronRight size={20} className="text-[#95A1B9] transition-transform group-active:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="relative z-10 mt-6 rounded-[28px] border border-white/80 bg-white/72 p-4 shadow-[0_14px_34px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2EEFF] text-[#7C5CFF]">
              <FileText size={21} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Назначение врача</p>
              <h3 className="text-[18px] font-extrabold tracking-tight text-[#13273F]">Из документа от 01.06.2026</h3>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full bg-[linear-gradient(180deg,#F5F1FF_0%,#ECE5FF_100%)] px-5 py-3 text-sm font-extrabold text-[#6F4CF7] shadow-[0_10px_22px_rgba(124,92,255,0.12)]"
          >
            Посмотреть
          </button>
        </div>
      </section>

      <div className="relative z-10 mt-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Ещё разделы</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {miniViews.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenView(item.id)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/80 bg-white/72 px-4 py-2 text-sm font-bold text-[#4F5D78] shadow-[0_10px_22px_rgba(124,92,255,0.06)] backdrop-blur-2xl"
            >
              <span className="text-[#7C5CFF]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenView('meds')}
        className="fixed bottom-28 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] text-white shadow-[0_18px_34px_rgba(124,92,255,0.34)]"
        aria-label="Добавить запись"
      >
        <Plus size={28} strokeWidth={2.8} />
      </button>
    </div>
  );
}
