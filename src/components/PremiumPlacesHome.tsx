import React from 'react';
import {
  BookOpen,
  Building2,
  ChevronRight,
  Coffee,
  Cross,
  MapPinned,
  MoreHorizontal,
  Phone,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Smile,
  Scissors,
  Waves,
} from 'lucide-react';
import type { DirectoryFilter } from './DirectoryTab';

const categoryItems = [
  { icon: <Stethoscope size={22} />, label: 'Диагностика', tone: 'violet', hint: '562' },
  { icon: <Building2 size={22} />, label: 'Центры развития', tone: 'mint', hint: '1 024' },
  { icon: <MapPinned size={22} />, label: 'Специалисты', tone: 'sky', hint: '2 341' },
  { icon: <Cross size={22} />, label: 'Стоматологи', tone: 'amber', hint: '432' },
  { icon: <Scissors size={22} />, label: 'Стрижка', tone: 'rose', hint: '189' },
  { icon: <Sparkles size={22} />, label: 'Магазины', tone: 'yellow', hint: '312' },
  { icon: <Coffee size={22} />, label: 'Кафе', tone: 'teal', hint: '268' },
  { icon: <Smile size={22} />, label: 'Досуг', tone: 'lilac', hint: '415' },
  { icon: <BookOpen size={22} />, label: 'Сенсорные комнаты', tone: 'cyan', hint: '128' },
  { icon: <Waves size={22} />, label: 'Бассейны', tone: 'blue', hint: '97' }
] as const;

const categoryToneClasses: Record<string, string> = {
  violet: 'from-[#F7F0FF] to-[#EFE7FF] text-[#7C5CFF]',
  mint: 'from-[#EEF9F4] to-[#E4F6EE] text-[#2FB58A]',
  sky: 'from-[#EEF6FF] to-[#E4F0FF] text-[#4A89F3]',
  amber: 'from-[#FFF7E9] to-[#FFF1D7] text-[#E8A11B]',
  rose: 'from-[#FFF0F2] to-[#FFE7EE] text-[#EC6E93]',
  yellow: 'from-[#FFF9EA] to-[#FFF1C8] text-[#E5AF1D]',
  teal: 'from-[#EAF8F7] to-[#DFF3F1] text-[#1DA9A3]',
  lilac: 'from-[#F4ECFF] to-[#EDE2FF] text-[#8C69FF]',
  cyan: 'from-[#EDF9FB] to-[#DFF5F7] text-[#26A8B8]',
  blue: 'from-[#EEF5FF] to-[#E4EDFF] text-[#5D84F7]'
};

const cityPoints = [
  { name: 'Астана', x: '62%', y: '28%', count: '812 мест', tone: 'violet' },
  { name: 'Алматы', x: '76%', y: '66%', count: '1 250 мест', tone: 'rose' },
  { name: 'Шымкент', x: '47%', y: '78%', count: '215 мест', tone: 'amber' },
  { name: 'Караганда', x: '53%', y: '52%', count: '324 места', tone: 'mint' }
] as const;

function MapBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.75)_26%,rgba(247,240,255,0.64)_48%,rgba(236,250,247,0.55)_72%,rgba(231,236,255,0.4)_100%)]" />
      <svg viewBox="0 0 1200 760" className="absolute inset-0 h-full w-full opacity-90">
        <defs>
          <linearGradient id="kazMapGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#EEDCFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#B7D8FF" stopOpacity="0.52" />
          </linearGradient>
          <linearGradient id="kazRoute" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#67CFC0" stopOpacity="0.34" />
          </linearGradient>
        </defs>
        <rect width="1200" height="760" fill="url(#kazMapGlow)" />
        <path d="M90 538 L220 370 L315 406 L408 258 L540 306 L621 206 L782 232 L900 154 L1026 220 L1110 368 L1030 510 L900 560 L794 676 L682 640 L512 690 L374 590 L250 618 Z" fill="#FFFFFF" fillOpacity="0.38" stroke="#D9CAF8" strokeOpacity="0.34" strokeWidth="6" />
        <path d="M122 544 C184 465, 244 430, 320 404 C405 376, 482 330, 548 308 C620 282, 712 251, 800 228 C879 207, 956 182, 1032 233" fill="none" stroke="url(#kazRoute)" strokeWidth="5" strokeDasharray="15 18" />
        <path d="M232 624 C288 574, 360 545, 453 532 C560 516, 652 484, 730 420 C814 352, 880 296, 980 270" fill="none" stroke="#8D7AFF" strokeOpacity="0.24" strokeWidth="4" strokeDasharray="10 14" />
        <path d="M340 666 C392 610, 444 574, 516 550 C606 520, 688 470, 766 404 C846 337, 930 312, 1080 316" fill="none" stroke="#5ED0C2" strokeOpacity="0.22" strokeWidth="4" strokeDasharray="12 16" />
        <path d="M98 540 L178 498 L258 560 L300 488 L404 522 L526 468 L640 536 L782 490 L910 540 L1064 450" fill="none" stroke="#FFBE6B" strokeOpacity="0.14" strokeWidth="4" strokeDasharray="18 18" />
      </svg>

      <div className="absolute right-[-10%] top-[-6%] h-[68%] w-[58%] bg-[radial-gradient(circle_at_50%_50%,rgba(181,148,255,0.42)_0%,rgba(181,148,255,0.24)_35%,rgba(181,148,255,0)_72%)] blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-6%] h-[65%] w-[70%] bg-[radial-gradient(circle_at_50%_50%,rgba(104,199,184,0.18)_0%,rgba(104,199,184,0.08)_36%,rgba(104,199,184,0)_72%)] blur-3xl" />

      <div className="absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.58)_52%,rgba(255,255,255,0.88)_100%)]" />
    </div>
  );
}

function CategoryCard({ icon, label, hint, tone }: { icon: React.ReactNode; label: string; hint: string; tone: string }) {
  return (
    <button
      type="button"
      className={`group flex min-h-[112px] flex-col items-start justify-between rounded-[28px] border border-white/80 bg-gradient-to-br ${tone} p-4 text-left shadow-[0_12px_28px_rgba(124,92,255,0.06)] backdrop-blur-2xl transition-transform active:scale-[0.99]`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/72 text-[#13273F] shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
        {icon}
      </span>
      <div>
        <p className="text-[15px] font-extrabold leading-tight text-[#13273F]">{label}</p>
        <p className="mt-1 text-[12px] font-semibold text-[#6F7B8E]">{hint}</p>
      </div>
    </button>
  );
}

export function PremiumPlacesHome({ onOpenFilter }: { onOpenFilter: (filter: DirectoryFilter) => void }) {
  return (
    <div className="relative min-h-0 flex-1 px-4 pb-28 pt-2 sm:px-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-5rem] h-72 w-72 rounded-full bg-[#EEE7FF]/80 blur-3xl" />
        <div className="absolute right-[-5rem] top-[14rem] h-72 w-72 rounded-full bg-[#E4F4F1]/60 blur-3xl" />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-3 pt-1">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#7C5CFF] backdrop-blur-2xl"
          aria-label="Назад"
        >
          <ChevronRight className="rotate-180" size={22} />
        </button>

        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/72">Проверено семьями</p>
          <h1 className="mt-2 text-[32px] font-black tracking-tight text-[#13273F]">Места</h1>
        </div>

        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#7C5CFF] backdrop-blur-2xl"
          aria-label="Меню"
        >
          <MoreHorizontal size={22} />
        </button>
      </div>

      <section className="relative z-10 mt-5 overflow-hidden rounded-[32px] border border-white/85 bg-white/68 p-4 shadow-[0_18px_48px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
        <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(245,238,255,0.9)_42%,rgba(236,249,246,0.9)_100%)] p-4">
          <MapBackdrop />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="max-w-[62%]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/72 text-[#7C5CFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <MapPinned size={22} />
                  </div>
                  <div>
                    <h2 className="text-[26px] font-black leading-[1.02] tracking-tight text-[#13273F]">Дружелюбные места</h2>
                    <p className="mt-1 text-sm font-medium text-[#6F7B8E]">Где ребенку было спокойно</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/82 text-[#7C5CFF] shadow-[0_12px_24px_rgba(124,92,255,0.12)] backdrop-blur-xl"
                aria-label="Открыть карту"
                onClick={() => onOpenFilter('all')}
              >
                <ScanSearch size={20} />
              </button>
            </div>

            <div className="relative mt-3 flex min-h-[220px] items-end">
              {cityPoints.map(city => (
                <div
                  key={city.name}
                  className="absolute"
                  style={{ left: city.x, top: city.y, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-[0_0_0_10px_rgba(124,92,255,0.08)]`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${city.tone === 'rose' ? 'bg-[#F08BA6]' : city.tone === 'mint' ? 'bg-[#49D29D]' : city.tone === 'amber' ? 'bg-[#F3B23E]' : 'bg-[#7C5CFF]'}`} />
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/80 bg-white/72 px-3 py-2 shadow-[0_10px_20px_rgba(124,92,255,0.06)] backdrop-blur-xl">
                    <p className="text-[11px] font-extrabold text-[#13273F]">{city.name}</p>
                    <p className="text-[10px] font-semibold text-[#6F7B8E]">{city.count}</p>
                  </div>
                </div>
              ))}

              <div className="absolute left-4 bottom-5 rounded-[22px] border border-white/80 bg-white/74 px-4 py-3 shadow-[0_14px_28px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F2EEFF] text-[#7C5CFF]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[12px] font-extrabold text-[#13273F]">3 421 место</p>
                    <p className="text-[11px] font-semibold text-[#6F7B8E]">проверено родителями</p>
                  </div>
                </div>
              </div>

              <div className="absolute right-4 bottom-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/82 text-[#7C5CFF] shadow-[0_18px_34px_rgba(124,92,255,0.16)] backdrop-blur-2xl">
                <ChevronRight size={22} />
              </div>
            </div>

            <div className="relative mt-4 flex items-end justify-between gap-3">
              <div className="rounded-full bg-white/76 px-4 py-2 text-[11px] font-bold text-[#7C5CFF] shadow-[0_10px_22px_rgba(124,92,255,0.08)] backdrop-blur-xl">
                3421 место проверено родителями
              </div>
              <button
                type="button"
                onClick={() => onOpenFilter('all')}
                className="rounded-full bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_28px_rgba(124,92,255,0.24)]"
              >
                Показать на карте
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {categoryItems.map(item => (
            <CategoryCard
              key={item.label}
              icon={item.icon}
              label={item.label}
              hint={item.hint}
              tone={categoryToneClasses[item.tone]}
            />
          ))}
        </div>
      </section>

      <section className="relative z-10 mt-5 rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(242,238,255,0.9)_48%,rgba(236,250,247,0.9)_100%)] p-4 shadow-[0_16px_36px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/72">❤️ Проверено семьями</p>
            <h2 className="mt-2 text-[22px] font-black tracking-tight text-[#13273F]">Живая база доверия</h2>
            <p className="mt-2 text-sm font-medium text-[#6F7B8E]">Здесь другие семьи уже делятся тем, что было спокойно и бережно.</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/78 text-[#7C5CFF]">
            <HeartIcon />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[22px] bg-white/70 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Отзывы</p>
            <p className="mt-1 text-[18px] font-black text-[#13273F]">18 240</p>
          </div>
          <div className="rounded-[22px] bg-white/70 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Места</p>
            <p className="mt-1 text-[18px] font-black text-[#13273F]">3 421</p>
          </div>
          <div className="rounded-[22px] bg-white/70 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Эксперты</p>
            <p className="mt-1 text-[18px] font-black text-[#13273F]">1 250</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A94AA]" size={19} />
          <input
            type="text"
            readOnly
            value=""
            placeholder="Поиск по названию, специализации или адресу"
            className="w-full rounded-[26px] border border-white/80 bg-white/76 px-12 py-4 text-[15px] font-semibold text-[#13273F] shadow-[0_12px_28px_rgba(124,92,255,0.06)] backdrop-blur-2xl placeholder:text-[#A0A9BB]"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: 'Город', icon: '📍' },
            { label: 'Есть опыт с РАС', icon: '🧩' },
            { label: 'Рядом', icon: '📏' },
            { label: 'Фильтры', icon: '⚙️' }
          ].map(pill => (
            <button
              key={pill.label}
              type="button"
              className="shrink-0 rounded-full border border-white/80 bg-white/74 px-4 py-3 text-sm font-extrabold text-[#13273F] shadow-[0_10px_20px_rgba(124,92,255,0.06)] backdrop-blur-xl"
            >
              <span className="mr-2">{pill.icon}</span>
              {pill.label}
            </button>
          ))}
        </div>
      </section>

      <section className="relative z-10 mt-5 rounded-[32px] border border-white/80 bg-white/72 p-4 shadow-[0_18px_42px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
        <div className="flex gap-4">
          <div className="relative h-[236px] w-[132px] shrink-0 overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#FBF9FF_0%,#F4ECFF_45%,#E9F6F3_100%)] p-3">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.5)_28%,rgba(255,255,255,0)_70%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/82 text-[#7C5CFF] shadow-[0_10px_18px_rgba(124,92,255,0.1)]">
                <HeartIcon />
              </div>
              <div className="rounded-[20px] bg-white/80 p-3 shadow-[0_10px_20px_rgba(124,92,255,0.08)] backdrop-blur-xl">
                <p className="text-[11px] font-extrabold text-[#13273F]">18 семей</p>
                <p className="text-[11px] font-semibold text-[#6F7B8E]">рекомендуют</p>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[22px] font-black leading-tight tracking-tight text-[#13273F]">Детская стоматология «Улыбка»</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-500/12 px-3 py-1.5 text-[11px] font-extrabold text-emerald-700">✅ Проверено семьями</span>
                  <span className="rounded-full bg-[#F2EEFF] px-3 py-1.5 text-[11px] font-extrabold text-[#6F4CF7]">📍 Алматы</span>
                  <span className="rounded-full bg-[#EAF8F7] px-3 py-1.5 text-[11px] font-extrabold text-[#1DA9A3]">🧩 Есть опыт с РАС</span>
                  <span className="rounded-full bg-[#EEF5FF] px-3 py-1.5 text-[11px] font-extrabold text-[#5D84F7]">💬 Неговорящие дети</span>
                  <span className="rounded-full bg-[#FFF3E8] px-3 py-1.5 text-[11px] font-extrabold text-[#E29433]">🔇 Тихая зона</span>
                  <span className="rounded-full bg-[#F5F1FF] px-3 py-1.5 text-[11px] font-extrabold text-[#7C5CFF]">⏸ Можно делать паузы</span>
                  <span className="rounded-full bg-[#FFF8E8] px-3 py-1.5 text-[11px] font-extrabold text-[#D99A19]">🎵 Спокойная музыка</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[15px] leading-relaxed text-[#445268]">
              «Дали привыкнуть к кабинету, не торопили, разрешили сделать паузу. Ребенок пошел на второй прием без стресса.»
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <button type="button" className="rounded-full border border-white/80 bg-white/74 px-4 py-3 text-sm font-extrabold text-[#6F4CF7] shadow-[0_10px_20px_rgba(124,92,255,0.06)]">
                <Phone size={16} className="mr-1.5 inline-block" />
                Позвонить
              </button>
              <button type="button" className="rounded-full border border-white/80 bg-white/74 px-4 py-3 text-sm font-extrabold text-[#6F4CF7] shadow-[0_10px_20px_rgba(124,92,255,0.06)]">
                🗺 Маршрут
              </button>
              <button type="button" className="rounded-full border border-white/80 bg-white/74 px-4 py-3 text-sm font-extrabold text-[#6F4CF7] shadow-[0_10px_20px_rgba(124,92,255,0.06)]">
                🤝 Опыт родителей
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeartIcon() {
  return <span className="text-[18px] leading-none">❤️</span>;
}
