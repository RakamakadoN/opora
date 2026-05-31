import React, { useState } from 'react';
import { useProfile, ARTICLES_DATABASE, DiagnosticStatus } from '../context/ProfileContext';
import Markdown from 'react-markdown';
import { 
  User, 
  Baby, 
  Settings, 
  Tag, 
  BookOpen, 
  Heart, 
  Bookmark, 
  MapPin, 
  Sparkles, 
  Star, 
  Trash2, 
  CheckCircle,
  HelpCircle,
  X,
  Phone,
  CalendarDays,
  List,
  Sun,
  Moon,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const CENTERS_PRESET = [
  { id: 1, name: 'Asyl Miras (Фонд Булата Утемуратова)', city: 'Алматы, Астана и др.', desc: 'Бесплатные центры раннего вмешательства (до 3 лет) и другие программы.', tags: ['Бесплатно', 'Раннее вмешательство'], type: 'center', rating: 4.9 },
  { id: 2, name: 'Центр коррекции "Жас Урпак"', city: 'Астана', desc: 'Терапия АВА, логопед, ЛФК, нейропсихолог. Опыт работы более 10 лет.', tags: ['ABA', 'Платный', 'Логопед'], type: 'clinic', rating: 4.7 },
  { id: 3, name: 'Ресурсный центр инклюзии', city: 'Алматы', desc: 'Консультации и поддержка для родителей при поступлении в школу.', tags: ['Школа', 'Юр.поддержка'], type: 'org', rating: 4.8 },
  { id: 4, name: 'Кабинеты ПМПК (государственные)', city: 'Все регионы', desc: 'Первичная постановка на учет и назначение часов коррекции.', tags: ['Государство', 'Диагностика'], type: 'gov', rating: 4.0 },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// 0 = Monday, 6 = Sunday 
function getFirstDayOfMonth(year: number, month: number) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; 
}

function formatDateToISOString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function ProfileTab() {
  const { user, logout } = useAuth();
  const { 
    profile, 
    profiles,
    activeProfileId,
    switchProfile,
    addProfile,
    updateProfile, 
    deleteProfile,
    savedArticles, 
    toggleSaveArticle, 
    savedCenters, 
    toggleSaveCenter,
    diaryEntries,
    addDiaryEntry,
    deleteDiaryEntry,
    theme,
    toggleTheme,
    updateSensoryPassport,
    progressEntries,
    addProgressEntry,
    deleteProgressEntry
  } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile.childName);
  const [editedAge, setEditedAge] = useState(profile.childAge);
  const [editedStatus, setEditedStatus] = useState<DiagnosticStatus>(profile.diagnosticStatus);
  const [editedCity, setEditedCity] = useState(profile.userCity);

  // Multiple children adding state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(3);
  const [newStatus, setNewStatus] = useState<DiagnosticStatus>("Только подозреваем");
  const [newCity, setNewCity] = useState("Алматы");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Emotional Check-in slider
  const [burnoutScore, setBurnoutScore] = useState<number>(5); // scale 1-10
  const [parentMood, setParentMood] = useState('Нормально');
  const [parentDifficulties, setParentDifficulties] = useState('');
  const [journalViewMode, setJournalViewMode] = useState<'input' | 'history'>('input');
  
  // Has already checked in today?
  const { parentJournalEntries, addParentJournalEntry } = useProfile();
  
  const todayEntry = parentJournalEntries.find(e => new Date(e.date).toDateString() === new Date().toDateString());
  const [hasCheckedIn, setHasCheckedIn] = useState(!!todayEntry);
  
  React.useEffect(() => {
    setHasCheckedIn(!!todayEntry);
    if (todayEntry) {
      setBurnoutScore(todayEntry.burnoutScore);
    }
  }, [todayEntry]);

  // Modal control for reading saved article
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [progressType, setProgressType] = useState<'success' | 'trigger' | 'routine'>('success');
  const [progressTitle, setProgressTitle] = useState('');
  const [progressDetails, setProgressDetails] = useState('');

  // Diary input state
  const [newDiaryContent, setNewDiaryContent] = useState('');
  const [diaryViewMode, setDiaryViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Sensory passport states
  const [editingPassport, setEditingPassport] = useState(false);
  const [passportSound, setPassportSound] = useState<string[]>([]);
  const [passportLight, setPassportLight] = useState<string[]>([]);
  const [passportTactile, setPassportTactile] = useState<string[]>([]);
  const [passportCom, setPassportCom] = useState("simple-words");
  const [passportComfort, setPassportComfort] = useState("");
  const [passportReward, setPassportReward] = useState("");
  const [passportShareStatus, setPassportShareStatus] = useState("");

  // Sync edit fields when profile changes
  React.useEffect(() => {
    setEditedName(profile.childName);
    setEditedAge(profile.childAge);
    setEditedStatus(profile.diagnosticStatus);
    setEditedCity(profile.userCity);
    setShowDeleteConfirm(false);

    const cp = profile.sensoryPassport || {
      soundSensitivity: ["headphones", "breaks"],
      lightSensitivity: ["sunglasses"],
      tactileSensitivity: ["tell-show-do"],
      communicationStyle: "simple-words",
      comfortTriggers: "Успокаивается, когда держит в руках любимую игрушку.",
      favoriteReward: "Мыльные пузыри или наклейки"
    };
    setPassportSound(cp.soundSensitivity || []);
    setPassportLight(cp.lightSensitivity || []);
    setPassportTactile(cp.tactileSensitivity || []);
    setPassportCom(cp.communicationStyle || "simple-words");
    setPassportComfort(cp.comfortTriggers || "");
    setPassportReward(cp.favoriteReward || "");
    setEditingPassport(false);
  }, [profile]);

  const saveProfileData = () => {
    updateProfile({
      childName: editedName,
      childAge: editedAge,
      diagnosticStatus: editedStatus,
      userCity: editedCity
    });
    setIsEditing(false);
  };

  const handleAddNewProfile = () => {
    if (!newName.trim()) return;
    addProfile({
      childName: newName.trim(),
      childAge: newAge,
      diagnosticStatus: newStatus,
      userCity: newCity || "Алматы"
    });
    setNewName('');
    setNewAge(3);
    setNewStatus("Только подозреваем");
    setNewCity("Алматы");
    setIsAddingNew(false);
  };

  const getWellnessMessage = (score: number) => {
    if (score <= 3) return { text: "Похоже, накапливается усталость. Напоминаем: вы заслуживаете отдыха. 10 минут тишины без чувства вины — это тоже забота о малыше.", color: "text-amber-700 bg-amber-50 border-amber-200" };
    if (score <= 6) return { text: "Вы держитесь молодцом. Уровень стресса средний. Не забывайте делать глубокий вдох и хвалить себя за каждый маленький шаг.", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    return { text: "Отличный баланс! Вы чувствуете опору и ресурсное состояние. Поделитесь этой теплотой с близкими.", color: "text-blue-700 bg-blue-50 border-blue-200" };
  };

  const savedArticlesData = ARTICLES_DATABASE.filter(a => savedArticles.includes(a.id));
  const savedCentersData = CENTERS_PRESET.filter(c => savedCenters.includes(c.id));

  const selectedArticle = ARTICLES_DATABASE.find(a => a.id === selectedArticleId);
  const childProgressEntries = progressEntries
    .filter(entry => entry.childId === profile.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddProgressEntry = () => {
    if (!progressTitle.trim() || !progressDetails.trim()) return;
    addProgressEntry({
      childId: profile.id,
      type: progressType,
      title: progressTitle.trim(),
      details: progressDetails.trim(),
      tags: [],
      energy: progressType === 'trigger' ? 2 : 4
    });
    setProgressTitle('');
    setProgressDetails('');
    setProgressType('success');
  };

  const labelPassportValues = (values: string[], labels: Record<string, string>, fallback: string) => (
    values.length ? values.map(value => labels[value] || value).join(', ') : fallback
  );

  const buildSensoryPassportText = () => {
    const sound = labelPassportValues(passportSound, {
      headphones: 'наушники',
      breaks: 'паузы врача',
      music: 'спокойная фоновая музыка'
    }, 'нет выраженной чувствительности');
    const light = labelPassportValues(passportLight, {
      sunglasses: 'очки от лампы',
      dimmed: 'приглушенный свет',
      gradual: 'плавное включение приборов'
    }, 'нет выраженной светочувствительности');
    const tactile = labelPassportValues(passportTactile, {
      'tell-show-do': 'принцип Tell-Show-Do',
      'weighted-blanket': 'утяжеленный плед'
    }, 'стандартный контакт');
    const communication = {
      'simple-words': 'короткие и понятные пошаговые фразы',
      visuals: 'визуальные карточки PECS / рисунки',
      silence: 'минимум лишних разговоров',
      praise: 'постоянная похвала и поощрение'
    }[passportCom] || passportCom;

    return [
      `Сенсорный паспорт: ${profile.childName || 'ребенок'}, ${profile.childAge} лет`,
      `Статус: ${profile.diagnosticStatus}`,
      `Город: ${profile.userCity}`,
      '',
      `Звуки: ${sound}.`,
      `Свет: ${light}.`,
      `Контакт: ${tactile}.`,
      `Общение: ${communication}.`,
      passportComfort ? `Что успокаивает: ${passportComfort}.` : '',
      passportReward ? `Мотивация после визита: ${passportReward}.` : '',
      '',
      'Просьба говорить спокойно, короткими фразами, заранее объяснять каждое действие и давать паузы.'
    ].filter(Boolean).join('\n');
  };

  const handleSharePassport = async () => {
    const text = buildSensoryPassportText();
    const title = `Сенсорный паспорт: ${profile.childName || 'ребенок'}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        setPassportShareStatus('Открыли меню отправки');
      } else {
        await navigator.clipboard.writeText(text);
        setPassportShareStatus('Скопировано. Можно вставить в WhatsApp или сообщение врачу.');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setPassportShareStatus('Скопировано. Можно вставить в WhatsApp или сообщение врачу.');
      } catch {
        setPassportShareStatus('Не удалось поделиться. Попробуйте еще раз.');
      }
    }

    window.setTimeout(() => setPassportShareStatus(''), 3500);
  };

  return (
    <div className="h-full flex flex-col pt-12 pb-10">
      
      {/* Dynamic Ambient Header */}
      <div className="opora-profile-header px-6 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-serif text-2xl font-medium text-opora-navy">Профиль</h1>
          {!isAddingNew && (
            <button 
              onClick={() => {
                if (isEditing) {
                  saveProfileData();
                } else {
                  setEditedName(profile.childName);
                  setEditedAge(profile.childAge);
                  setEditedStatus(profile.diagnosticStatus);
                  setEditedCity(profile.userCity);
                  setIsEditing(true);
                }
              }}
              className="text-sm font-semibold px-4 py-2 rounded-2xl bg-opora-navy text-white hover:bg-opacity-90 transition-colors"
            >
              {isEditing ? "Готово" : "Изменить"}
            </button>
          )}
        </div>
        <p className="text-opora-text text-sm leading-relaxed mb-3">Данные ребенка, сенсорный паспорт, заметки и сохраненные материалы.</p>
        <div className="mb-3 rounded-2xl border border-opora-sage/15 bg-white/70 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-opora-sage">Аккаунт</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-opora-navy">{user?.fullName || 'Родитель'}</p>
              <p className="truncate text-xs text-opora-text">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="shrink-0 rounded-xl bg-opora-sand px-3 py-2 text-xs font-extrabold text-opora-navy"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Child Selector Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {profiles.map((p) => {
            const isActive = p.id === activeProfileId && !isAddingNew;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setIsEditing(false);
                  setIsAddingNew(false);
                  switchProfile(p.id);
                }}
                className={`px-3.5 py-2 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all shrink-0 border ${
                  isActive 
                    ? "bg-opora-navy text-white border-opora-navy shadow-sm" 
                    : "bg-white text-opora-navy border-black/5 hover:border-opora-sage/40"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-opora-peach' : 'bg-opora-sage'}`} />
                <span>{p.childName}</span>
              </button>
            );
          })}
          
          <button
            onClick={() => {
              setIsEditing(false);
              setIsAddingNew(true);
            }}
            className={`px-3.5 py-2 rounded-2xl text-sm font-bold font-serif border border-dashed hover:bg-opora-sage/10 transition-all shrink-0 flex items-center gap-1.5 ${
              isAddingNew
                ? "bg-opora-sage/20 text-opora-navy border-opora-sage/40"
                : "bg-white text-opora-sage border-opora-sage/30"
            }`}
          >
            <span>+ Добавить ребенка</span>
          </button>
        </div>
      </div>

      <div className="px-6 space-y-6">
        
        {isAddingNew ? (
          /* Add Profile Card */
          <div className="opora-profile-card bg-white p-5 rounded-2xl border border-opora-sage/20 shadow-sm relative overflow-hidden animate-fade-in">
            <h3 className="text-base font-semibold text-opora-navy mb-3">Новый профиль ребенка</h3>
            <div className="space-y-3 w-full">
              <div>
                <label className="block text-xs uppercase tracking-wider text-black/40 font-semibold mb-1">Имя ребенка</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Например, Саят"
                  className="w-full text-base bg-opora-sand rounded-xl px-2.5 py-1.5 text-opora-navy font-medium border border-transparent focus:border-opora-sage outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-black/40 font-semibold mb-1">Возраст (лет)</label>
                <input 
                  type="number" 
                  min={0}
                  max={18}
                  value={newAge} 
                  onChange={e => setNewAge(Number(e.target.value))}
                  className="w-full text-base bg-opora-sand rounded-xl px-2.5 py-1.5 text-opora-navy font-medium border border-transparent focus:border-opora-sage outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-black/40 font-semibold mb-1">Город</label>
                <input 
                  type="text" 
                  value={newCity} 
                  onChange={e => setNewCity(e.target.value)}
                  placeholder="Например, Астана"
                  className="w-full text-base bg-opora-sand rounded-xl px-2.5 py-1.5 text-opora-navy font-medium border border-transparent focus:border-opora-sage outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-black/40 font-semibold mb-1">Статус пути</label>
                <select 
                  value={newStatus} 
                  onChange={e => setNewStatus(e.target.value as DiagnosticStatus)}
                  className="w-full text-sm bg-opora-sand rounded-xl px-2.5 py-1.5 text-opora-navy font-medium border border-transparent focus:border-opora-sage outline-none"
                >
                  <option value="Только подозреваем">Только подозреваем аутизм</option>
                  <option value="В процессе диагностики">В процессе диагностики</option>
                  <option value="Диагноз подтвержден">Диагноз подтвержден</option>
                  <option value="Проходим адаптацию и подбор терапии">Адаптация и терапия</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleAddNewProfile}
                  disabled={!newName.trim()}
                  className="flex-1 bg-opora-navy text-white text-sm font-semibold py-2.5 rounded-2xl hover:bg-opacity-95 transition-all disabled:opacity-50"
                >
                  Создать
                </button>
                <button 
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 bg-opora-sand text-opora-navy text-sm font-semibold py-2.5 rounded-2xl hover:bg-black/5 transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Profile Card */
          <div className="opora-profile-card bg-white p-5 rounded-2xl border border-opora-sage/20 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-4 z-10 relative">
              <div className="w-12 h-12 rounded-2xl bg-opora-peach flex items-center justify-center text-opora-navy font-bold font-serif text-lg shrink-0">
                {profile.childName ? profile.childName[0] : "Д"}
              </div>
              
              <div className="flex-1 space-y-3 min-w-0">
                {!isEditing ? (
                  <div>
                    <h3 className="text-lg font-semibold text-opora-navy flex items-center gap-1.5 truncate">
                      {profile.childName} 
                      <span className="text-sm text-opora-sage font-normal shrink-0">({profile.childAge} {profile.childAge % 10 === 1 && profile.childAge % 100 !== 11 ? "год" : [2,3,4].includes(profile.childAge % 10) && ![12,13,14].includes(profile.childAge % 100) ? "года" : "лет"})</span>
                    </h3>
                    <div className="mt-1 space-y-1.5">
                      <p className="text-sm text-opora-text flex items-center gap-1.5">
                        <Tag size={13} className="text-opora-sage shrink-0" />
                        <span className="truncate">{profile.diagnosticStatus}</span>
                      </p>
                      <p className="text-sm text-opora-text flex items-center gap-1.5">
                        <MapPin size={13} className="text-opora-sage shrink-0" />
                        <span className="truncate">г. {profile.userCity}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mt-1 w-full">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-black/40 font-semibold mb-1">Имя ребенка</label>
                      <input 
                        type="text" 
                        value={editedName} 
                        onChange={e => setEditedName(e.target.value)}
                        className="w-full text-base bg-opora-sand rounded-xl px-2.5 py-1.5 text-opora-navy font-medium border border-transparent focus:border-opora-sage outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-black/40 font-semibold mb-1">Возраст (лет)</label>
                      <input 
                        type="number" 
                        min={0}
                        max={18}
                        value={editedAge} 
                        onChange={e => setEditedAge(Number(e.target.value))}
                        className="w-full text-base bg-opora-sand rounded-xl px-2.5 py-1.5 text-opora-navy font-medium border border-transparent focus:border-opora-sage outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-black/40 font-semibold mb-1">Город</label>
                      <input 
                        type="text" 
                        value={editedCity} 
                        onChange={e => setEditedCity(e.target.value)}
                        className="w-full text-base bg-opora-sand rounded-xl px-2.5 py-1.5 text-opora-navy font-medium border border-transparent focus:border-opora-sage outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-black/40 font-semibold mb-1">Статус пути</label>
                      <select 
                        value={editedStatus} 
                        onChange={e => setEditedStatus(e.target.value as DiagnosticStatus)}
                        className="w-full text-sm bg-opora-sand rounded-xl px-2.5 py-1.5 text-opora-navy font-medium border border-transparent focus:border-opora-sage outline-none"
                      >
                        <option value="Только подозреваем">Только подозреваем аутизм</option>
                        <option value="В процессе диагностики">В процессе диагностики</option>
                        <option value="Диагноз подтвержден">Диагноз подтвержден</option>
                        <option value="Проходим адаптацию и подбор терапии">Адаптация и терапия</option>
                      </select>
                    </div>

                    {profiles.length > 1 && (
                      <div className="pt-2 border-t border-black/5">
                        {!showDeleteConfirm ? (
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center justify-center gap-1 text-sm font-semibold text-red-500 hover:text-red-650 bg-red-50 py-2 rounded-2xl transition-all"
                          >
                            <Trash2 size={13} /> Удалить этот профиль
                          </button>
                        ) : (
                          <div className="bg-red-50 p-2.5 rounded-2xl border border-red-100 text-center space-y-2">
                            <p className="text-xs font-semibold text-red-650 leading-tight">Вы уверены? Это действие невозможно отменить.</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteProfile(profile.id);
                                  setIsEditing(false);
                                  setShowDeleteConfirm(false);
                                }}
                                className="flex-1 bg-red-500 text-white text-xs font-bold py-1.5 rounded-xl hover:bg-red-600 transition-colors"
                              >
                                Да, удалить
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 bg-white text-opora-navy text-xs font-bold py-1.5 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sensory Passport Card */}
        {!isAddingNew && (
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full translate-x-1/2 -translate-y-1/2 blur-xl"></div>
            
            <div className="flex items-center justify-between mb-3 border-b border-rose-50 pb-3">
              <h3 className="font-serif text-lg text-opora-navy flex items-center gap-2">
                <Heart size={18} className="text-rose-500 fill-rose-500" />
                <span>Сенсорный паспорт</span>
              </h3>
              <div className="flex items-center gap-2">
                {!editingPassport && (
                  <button
                    type="button"
                    onClick={handleSharePassport}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-opora-sage/10 text-opora-sage hover:bg-opora-sage/20 transition-colors cursor-pointer"
                  >
                    <Share2 size={13} /> Поделиться
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (editingPassport) {
                      // Save changes
                      updateSensoryPassport(profile.id, {
                        soundSensitivity: passportSound,
                        lightSensitivity: passportLight,
                        tactileSensitivity: passportTactile,
                        communicationStyle: passportCom,
                        comfortTriggers: passportComfort.trim(),
                        favoriteReward: passportReward.trim()
                      });
                      setEditingPassport(false);
                    } else {
                      setEditingPassport(true);
                    }
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  {editingPassport ? "Сохранить" : "Редактировать"}
                </button>
              </div>
            </div>

            {!editingPassport ? (
              <div className="space-y-4">
                {passportShareStatus && (
                  <div className="opora-success-note text-xs font-semibold leading-relaxed px-3 py-2 rounded-xl border">
                    {passportShareStatus}
                  </div>
                )}
                <p className="text-xs text-opora-text/80 leading-relaxed">
                  Этот паспорт прикрепляется к записи к врачам (стоматологам, окулистам), чтобы они заранее знали особенности восприятия {profile.childName} и подготовили кабинет.
                </p>

                <div className="space-y-3">
                  <div className="text-xs">
                    <span className="font-bold text-opora-navy block mb-1">🔉 Звуки:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {passportSound.length > 0 ? (
                        passportSound.map(x => (
                          <span key={x} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium text-[11px]">
                            {x === 'headphones' ? 'Наушники' : x === 'breaks' ? 'Паузы врача' : x === 'music' ? 'Фоновая музыка' : x}
                          </span>
                        ))
                      ) : (
                        <span className="text-opora-text/45 italic">Нет выраженной чувствительности</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="font-bold text-opora-navy block mb-1">🕶️ Свет:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {passportLight.length > 0 ? (
                        passportLight.map(x => (
                          <span key={x} className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-medium text-[11px]">
                            {x === 'sunglasses' ? 'Очки от лампы' : x === 'dimmed' ? 'Приглушенный свет' : x === 'gradual' ? 'Плавный приборный свет' : x}
                          </span>
                        ))
                      ) : (
                        <span className="text-opora-text/45 italic">Нет выраженной светочувствительности</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="font-bold text-opora-navy block mb-1">🧸 Контакт:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {passportTactile.length > 0 ? (
                        passportTactile.map(x => (
                          <span key={x} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-medium text-[11px]">
                            {x === 'tell-show-do' ? 'Принцип Tell-Show-Do' : x === 'weighted-blanket' ? 'Утяжеленный плед' : x}
                          </span>
                        ))
                      ) : (
                        <span className="text-opora-text/45 italic">Стандартный контакт</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs p-2.5 bg-opora-sand/50 rounded-xl space-y-1">
                    <span className="text-[10px] text-opora-text/60 font-bold uppercase tracking-wider block">Общение:</span>
                    <p className="font-semibold text-opora-navy text-xs">
                      {passportCom === 'simple-words' && 'Короткие и понятные пошаговые фразы'}
                      {passportCom === 'visuals' && 'Визуальные карточки PECS'}
                      {passportCom === 'silence' && 'Минимальное количество звуковых команд'}
                      {passportCom === 'praise' && 'Активное голосовое хваление'}
                    </p>
                  </div>

                  {passportComfort && (
                    <div className="text-xs p-2.5 bg-rose-50/30 rounded-xl space-y-1">
                      <span className="text-[10px] text-rose-700/60 font-bold uppercase tracking-wider block">Что успокаивает ребенка при тревоге:</span>
                      <p className="text-opora-navy leading-normal">{passportComfort}</p>
                    </div>
                  )}

                  {passportReward && (
                    <div className="text-xs p-2.5 bg-emerald-50/40 rounded-xl space-y-1">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Ожидаемая мотивация / мороженое 🍦:</span>
                      <p className="text-emerald-950 font-semibold leading-normal">{passportReward}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in text-xs">
                {/* Sounds checkboxes */}
                <div className="space-y-1.5">
                  <span className="font-bold text-opora-navy block">🔊 Звуковая адаптация:</span>
                  <div className="space-y-1">
                    {[
                      { id: 'headphones', label: 'Одеть наушники' },
                      { id: 'breaks', label: 'Частые паузы' },
                      { id: 'music', label: 'Детская музыка' }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={passportSound.includes(opt.id)}
                          onChange={() => setPassportSound(p => p.includes(opt.id) ? p.filter(x => x !== opt.id) : [...p, opt.id])}
                          className="rounded text-rose-500 focus:ring-rose-400"
                        />
                        <span className="font-medium text-opora-navy">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Light sensitivity */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-opora-navy block">🕶️ Яркий свет ламп:</span>
                  <div className="space-y-1">
                    {[
                      { id: 'sunglasses', label: 'Выдать тёмные очки от лампы' },
                      { id: 'dimmed', label: 'Приглушить свет прожекторов' },
                      { id: 'gradual', label: 'Постепенное включение приборов' }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={passportLight.includes(opt.id)}
                          onChange={() => setPassportLight(p => p.includes(opt.id) ? p.filter(x => x !== opt.id) : [...p, opt.id])}
                          className="rounded text-rose-500 focus:ring-rose-400"
                        />
                        <span className="font-medium text-opora-navy">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tactile contact */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-opora-navy block">🧸 Тактильный метод:</span>
                  <div className="space-y-1">
                    {[
                      { id: 'tell-show-do', label: 'Методика Tell-Show-Do' },
                      { id: 'weighted-blanket', label: 'Использовать утяжеленный плед' }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={passportTactile.includes(opt.id)}
                          onChange={() => setPassportTactile(p => p.includes(opt.id) ? p.filter(x => x !== opt.id) : [...p, opt.id])}
                          className="rounded text-rose-500 focus:ring-rose-400"
                        />
                        <span className="font-medium text-opora-navy">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Com style */}
                <div className="space-y-1">
                  <span className="font-bold text-opora-navy block">🗣️ Способ коммуникации:</span>
                  <select
                    value={passportCom}
                    onChange={(e) => setPassportCom(e.target.value)}
                    className="w-full bg-opora-sand rounded-xl px-2.5 py-2 text-xs text-opora-navy font-semibold outline-none border border-transparent focus:border-rose-400"
                  >
                    <option value="simple-words">Простые и конкретные фразы</option>
                    <option value="visuals">Карточки PECS / рисунки</option>
                    <option value="silence">Минимум лишних разговоров</option>
                    <option value="praise">Постоянная похвала и поощрение</option>
                  </select>
                </div>

                {/* Coping actions */}
                <div className="space-y-1">
                  <span className="font-bold text-opora-navy block">🧸 Что успокаивает ребенка при тревоге:</span>
                  <input
                    type="text"
                    value={passportComfort}
                    onChange={(e) => setPassportComfort(e.target.value)}
                    placeholder="Держать маму за руку, любимый динозавр..."
                    className="w-full bg-opora-sand rounded-xl px-2.5 py-2 text-xs text-opora-navy placeholder:text-black/30 outline-none border border-transparent focus:border-rose-400 font-medium"
                  />
                </div>

                {/* Reward triggers */}
                <div className="space-y-1">
                  <span className="font-bold text-opora-navy block">🍭 Желаемое вознаграждение (для врача):</span>
                  <input
                    type="text"
                    value={passportReward}
                    onChange={(e) => setPassportReward(e.target.value)}
                    placeholder="Напр. мороженое 🍦, наклейка с поездом, мыльные пузыри..."
                    className="w-full bg-opora-sand rounded-xl px-2.5 py-2 text-xs text-opora-navy placeholder:text-black/30 outline-none border border-transparent focus:border-rose-400 font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateSensoryPassport(profile.id, {
                      soundSensitivity: passportSound,
                      lightSensitivity: passportLight,
                      tactileSensitivity: passportTactile,
                      communicationStyle: passportCom,
                      comfortTriggers: passportComfort.trim(),
                      favoriteReward: passportReward.trim()
                    });
                    setEditingPassport(false);
                  }}
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-xs transition-opacity mt-2 cursor-pointer"
                >
                  Применить изменения
                </button>
              </div>
            )}
          </div>
        )}

        {/* App Settings Card with Light/Dark Theme Switcher */}
        <div className="bg-white p-5 rounded-2xl border border-opora-sage/20 shadow-sm">
          <h3 className="font-serif text-lg text-opora-navy mb-2 flex items-center gap-1.5">
            <Settings size={18} className="text-opora-sage" /> Настройки оформления
          </h3>
          <p className="text-sm text-opora-text leading-relaxed mb-4">
            Настройте внешний вид приложения. Цветовая палитра «Опора» адаптируется под выбранный режим для защиты ваших глаз.
          </p>

          <div className="flex items-center justify-between bg-opora-sand p-3.5 rounded-2xl border border-black/[0.03]">
            <span className="text-sm font-semibold text-opora-navy flex items-center gap-2">
              {theme === 'dark' ? <Moon size={16} className="text-opora-sage" /> : <Sun size={16} className="text-opora-sage" />}
              <span>{theme === 'dark' ? 'Темная тема' : 'Светлая тема'}</span>
            </span>
            
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              style={{ backgroundColor: theme === 'dark' ? 'var(--color-opora-sage)' : '#CBD5E1' }}
              aria-label="Toggle Theme"
            >
              <span
                className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                style={{ transform: theme === 'dark' ? 'translateX(24px)' : 'translateX(0px)' }}
              />
            </button>
          </div>
        </div>

        {/* Wow Feature: PARENTAL WELLNESS / EMOTIONAL BURNOUT CHECKIN */}
        <div className="bg-white p-5 rounded-2xl border border-opora-sage/20 shadow-sm">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="font-serif text-lg text-opora-navy flex items-center gap-1.5">
              <Heart size={18} className="text-red-400 fill-red-400" /> Эмоциональный журнал
            </h3>
            <div className="flex bg-opora-sand rounded-2xl p-1 shadow-inner">
              <button
                onClick={() => setJournalViewMode('input')}
                className={`p-1.5 rounded-xl transition-all ${journalViewMode === 'input' ? 'bg-white text-opora-navy shadow-sm' : 'text-black/30 hover:text-opora-navy'}`}
              >
                <Sun size={14} />
              </button>
              <button
                onClick={() => setJournalViewMode('history')}
                className={`p-1.5 rounded-xl transition-all ${journalViewMode === 'history' ? 'bg-white text-opora-navy shadow-sm' : 'text-black/30 hover:text-opora-navy'}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-opora-text leading-relaxed mb-4">
            Диагноз ребенка — марафон. Заботиться о себе так же важно, как и о ребенке.
          </p>

          {journalViewMode === 'history' ? (
            <div className="space-y-3">
              {parentJournalEntries.length === 0 ? (
                <div className="text-center text-sm text-opora-text/60 py-4 bg-opora-sand/50 rounded-2xl border border-dashed border-opora-sage/20">
                  Здесь сохраняется ваша история состояний.
                </div>
              ) : (
                parentJournalEntries.map(entry => (
                  <div key={entry.id} className="p-3 bg-opora-sand/30 rounded-2xl border border-black/[0.04]">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-xs font-semibold text-opora-navy opacity-60">
                        {new Date(entry.date).toLocaleDateString('ru-RU')}
                      </span>
                      <span className="text-[10px] bg-opora-peach/30 px-2 py-0.5 rounded-full font-bold text-opora-navy">
                        Ресурс: {entry.burnoutScore}/10
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-opora-navy mb-1">
                      {entry.moodOption}
                    </div>
                    {entry.difficulties && (
                      <div className="text-xs text-opora-text bg-white p-2 rounded-xl mt-2 border border-black/5">
                        <span className="font-semibold block mb-0.5 opacity-60 text-[10px] uppercase">Что было сложно:</span>
                        {entry.difficulties}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : !hasCheckedIn ? (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2 text-sm text-opora-navy">
                <label className="font-semibold block">Как вы сегодня?</label>
                <div className="flex flex-wrap gap-2">
                  {['Спокойно', 'Тревожно', 'Чувствую вину', 'Радостно', 'Истощение'].map(m => (
                    <button
                      key={m}
                      onClick={() => setParentMood(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        parentMood === m 
                          ? 'bg-opora-navy text-white shadow-sm' 
                          : 'bg-opora-sand text-opora-navy hover:bg-opora-sage/20'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-sm text-opora-navy block mb-2">Общий уровень ресурса:</label>
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[11px] text-opora-text/80 font-medium bg-opora-sand px-2 py-1 rounded-md">Выгорание</span>
                  <span className="text-opora-navy font-bold text-base bg-opora-peach/40 px-3 py-1 rounded-2xl shadow-sm border border-opora-peach/50 w-12 text-center">{burnoutScore}</span>
                  <span className="text-[11px] text-opora-text/80 font-medium bg-opora-sand px-2 py-1 rounded-md">В норме</span>
                </div>
                
                <div className="relative mx-1">
                   <input 
                     type="range" 
                     min="1" 
                     max="10" 
                     value={burnoutScore}
                     onChange={e => setBurnoutScore(Number(e.target.value))}
                     className="w-full accent-opora-sage cursor-pointer inline-block h-2 bg-opora-sand rounded-2xl shadow-inner outline-none"
                   />
                   <div 
                     className="absolute left-0 top-0 h-2 bg-gradient-to-r from-red-300 via-amber-300 to-emerald-400 rounded-2xl pointer-events-none opacity-40 mix-blend-multiply" 
                     style={{width: '100%'}} 
                   />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-sm text-opora-navy block">Что было особенно тяжело?</label>
                <textarea
                  value={parentDifficulties}
                  onChange={(e) => setParentDifficulties(e.target.value)}
                  placeholder="Вспышка в магазине, непонимание врачей, усталость..."
                  className="w-full text-sm bg-opora-sand rounded-2xl px-3 py-2.5 text-opora-navy border border-black/5 focus:border-opora-sage outline-none resize-none h-16 transition-colors"
                />
              </div>

              <button 
                onClick={() => {
                  addParentJournalEntry({
                    moodOption: parentMood,
                    burnoutScore,
                    difficulties: parentDifficulties.trim()
                  });
                  setHasCheckedIn(true);
                }}
                className="w-full bg-opora-navy font-medium text-sm text-white py-3 px-4 rounded-2xl shadow-md cursor-pointer shadow-opora-navy/20 hover:bg-opacity-95 hover:-translate-y-0.5 active:translate-y-0 transition-all text-center"
              >
                Сохранить запись
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className={`p-4 rounded-2xl text-sm border leading-relaxed ${getWellnessMessage(burnoutScore).color}`}>
                {getWellnessMessage(burnoutScore).text}
              </div>
              <div className="p-4 bg-opora-sand/50 rounded-2xl border border-black/[0.04]">
                <div className="text-xs font-bold text-opora-navy/60 uppercase mb-1">Ваша запись на сегодня</div>
                <div className="text-sm font-semibold text-opora-navy">{todayEntry?.moodOption || parentMood}</div>
                {todayEntry?.difficulties && (
                  <div className="text-sm text-opora-text mt-1">{todayEntry.difficulties}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Achievement Diary */}
        <div className="bg-white p-5 rounded-2xl border border-opora-sage/20 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-opora-peach/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="font-serif text-lg text-opora-navy flex items-center gap-1.5">
              <Star size={18} className="text-opora-peach fill-opora-peach" /> Дневник достижений
            </h3>
            <div className="flex bg-opora-sand rounded-2xl p-1 shadow-inner">
              <button
                onClick={() => setDiaryViewMode('list')}
                className={`p-1.5 rounded-xl transition-all ${diaryViewMode === 'list' ? 'bg-white text-opora-navy shadow-sm' : 'text-black/30 hover:text-opora-navy'}`}
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setDiaryViewMode('calendar')}
                className={`p-1.5 rounded-xl transition-all ${diaryViewMode === 'calendar' ? 'bg-white text-opora-navy shadow-sm' : 'text-black/30 hover:text-opora-navy'}`}
              >
                <CalendarDays size={14} />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-opora-text leading-relaxed mb-4 relative z-10">
            Записывайте даже самые маленькие успехи {profile.childName}. Это поможет вам видеть прогресс в моменты сомнений.
          </p>

          <div className="space-y-3 mb-5 relative z-10">
            <textarea
              value={newDiaryContent}
              onChange={(e) => setNewDiaryContent(e.target.value)}
              placeholder="Что сегодня получилось у ребенка?"
              className="w-full text-sm bg-opora-sand rounded-2xl px-3 py-2.5 text-opora-navy border border-black/5 focus:border-opora-sage outline-none resize-none h-20 transition-colors"
            />
            <button
              onClick={() => {
                if (newDiaryContent.trim()) {
                  addDiaryEntry(profile.id, newDiaryContent.trim());
                  setNewDiaryContent('');
                }
              }}
              disabled={!newDiaryContent.trim()}
              className="w-full bg-opora-navy text-white text-sm font-semibold py-2.5 rounded-2xl hover:bg-opacity-95 transition-all disabled:opacity-50"
            >
              Добавить запись
            </button>
          </div>

          <div className="relative z-10">
            {(() => {
              const currentChildEntries = diaryEntries.filter(e => e.childId === profile.id);
              
              if (currentChildEntries.length === 0) {
                return (
                  <div className="text-center text-sm text-opora-text/60 py-4 bg-opora-sand/50 rounded-2xl border border-dashed border-opora-sage/20">
                    Здесь будет лента ваших побед.
                  </div>
                );
              }

              if (diaryViewMode === 'calendar') {
                const year = calendarDate.getFullYear();
                const month = calendarDate.getMonth();
                const daysInMonth = getDaysInMonth(year, month);
                const firstDayStr = getFirstDayOfMonth(year, month);
                
                return (
                  <div className="space-y-4">
                    <div className="bg-opora-sand/30 border border-black/[0.04] p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-3">
                        <button 
                          onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                          className="p-1 hover:bg-black/5 rounded-xl text-opora-navy font-bold flex items-center justify-center text-sm"
                        >
                          &lt;
                        </button>
                        <span className="text-sm font-bold text-opora-navy">
                          {MONTH_NAMES[month]} {year}
                        </span>
                        <button 
                          onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                          className="p-1 hover:bg-black/5 rounded-xl text-opora-navy font-bold flex items-center justify-center text-sm"
                        >
                          &gt;
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {WEEK_DAYS.map(d => (
                          <div key={d} className="text-center text-[11px] font-bold text-opora-text/60 uppercase">{d}</div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayStr }).map((_, i) => (
                          <div key={`empty-${i}`} className="w-full aspect-square" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const d = new Date(year, month, dayNum);
                          const dateStr = formatDateToISOString(d);
                          
                          // Quick hack since entry.date is ISO
                          const hasEntry = currentChildEntries.some(e => e.date.startsWith(dateStr));
                          const isSelected = selectedCalendarDate === dateStr;
                          const isToday = formatDateToISOString(new Date()) === dateStr;
                          
                          return (
                            <button 
                              key={dateStr}
                              onClick={() => setSelectedCalendarDate(isSelected ? null : dateStr)}
                              className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all relative ${
                                isSelected ? 'bg-opora-sage text-white shadow-md' : 
                                hasEntry ? 'bg-opora-sage/20 text-opora-navy hover:bg-opora-sage/30' : 
                                isToday ? 'border border-opora-sage/50 text-opora-navy font-bold' : 'text-opora-text hover:bg-black/5'
                              }`}
                            >
                              <span className={isSelected || isToday ? 'font-bold' : ''}>{dayNum}</span>
                              {hasEntry && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-opora-sage rounded-full"></span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filtered entries for selected date */}
                    {(selectedCalendarDate ? currentChildEntries.filter(e => e.date.startsWith(selectedCalendarDate)) : currentChildEntries).map(entry => (
                       <div key={entry.id} className="relative pl-5 border-l-2 border-opora-sage/20 pb-5 last:pb-0 group mt-2 first:mt-0">
                         <div className="absolute w-2.5 h-2.5 bg-opora-sage rounded-full -left-[6px] top-0.5 border-2 border-white"></div>
                         <div className="flex justify-between items-start mb-1.5 -mt-1">
                           <span className="text-xs font-bold text-opora-sage bg-opora-sage/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                             {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                           </span>
                           <button 
                             onClick={() => deleteDiaryEntry(entry.id)}
                             className="opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                           >
                             <Trash2 size={12} />
                           </button>
                         </div>
                         <p className="text-sm text-opora-navy leading-relaxed break-words whitespace-pre-wrap">{entry.content}</p>
                       </div>
                     ))}
                     
                     {selectedCalendarDate && currentChildEntries.filter(e => e.date.startsWith(selectedCalendarDate)).length === 0 && (
                       <div className="text-center text-xs text-opora-text/60 py-3 bg-opora-sand/50 rounded-2xl border border-dashed border-opora-sage/20">
                         За этот день записей нет
                       </div>
                     )}
                  </div>
                );
              }

              // List View
              return (
                <div className="space-y-0 relative z-10">
                  {currentChildEntries.map(entry => (
                    <div key={entry.id} className="relative pl-5 border-l-2 border-opora-sage/20 pb-5 last:pb-0 group mt-2 first:mt-0">
                      <div className="absolute w-2.5 h-2.5 bg-opora-sage rounded-full -left-[6px] top-0.5 border-2 border-white"></div>
                      <div className="flex justify-between items-start mb-1.5 -mt-1">
                        <span className="text-xs font-bold text-opora-sage bg-opora-sage/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                        </span>
                        <button 
                          onClick={() => deleteDiaryEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-sm text-opora-navy leading-relaxed break-words whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-opora-sage/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-lg text-opora-navy flex items-center gap-1.5">
              <Sparkles size={18} className="text-opora-sage" /> Динамика ребенка
            </h3>
            <span className="text-[11px] font-bold text-opora-sage uppercase tracking-wider">
              {childProgressEntries.length} записей
            </span>
          </div>

          <p className="text-sm text-opora-text leading-relaxed mb-4">
            Фиксируйте один маленький шаг вперед, один триггер и одну рабочую стратегию. Это помогает видеть реальную динамику, а не только усталость дня.
          </p>

          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'success', label: 'Получилось' },
                { id: 'trigger', label: 'Было трудно' },
                { id: 'routine', label: 'Нам помогло' }
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setProgressType(option.id as 'success' | 'trigger' | 'routine')}
                  className={`px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${
                    progressType === option.id
                      ? 'bg-opora-navy text-white'
                      : 'bg-opora-sand text-opora-navy'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={progressTitle}
              onChange={(e) => setProgressTitle(e.target.value)}
              placeholder="Короткий заголовок записи"
              className="w-full text-sm bg-opora-sand rounded-2xl px-3 py-2.5 text-opora-navy border border-black/5 focus:border-opora-sage outline-none"
            />
            <textarea
              value={progressDetails}
              onChange={(e) => setProgressDetails(e.target.value)}
              placeholder="Что произошло, что помогло или что стоит запомнить?"
              className="w-full text-sm bg-opora-sand rounded-2xl px-3 py-2.5 text-opora-navy border border-black/5 focus:border-opora-sage outline-none resize-none h-20"
            />
            <button
              type="button"
              onClick={handleAddProgressEntry}
              disabled={!progressTitle.trim() || !progressDetails.trim()}
              className="w-full bg-opora-navy text-white text-sm font-semibold py-2.5 rounded-2xl hover:bg-opacity-95 transition-all disabled:opacity-50"
            >
              Добавить в динамику
            </button>
          </div>

          {childProgressEntries.length === 0 ? (
            <div className="text-center text-sm text-opora-text/60 py-4 bg-opora-sand/50 rounded-2xl border border-dashed border-opora-sage/20">
              Первые короткие записи появятся здесь.
            </div>
          ) : (
            <div className="space-y-3">
              {childProgressEntries.slice(0, 6).map(entry => (
                <div key={entry.id} className="p-4 rounded-2xl bg-opora-sand/45 border border-black/[0.04]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        entry.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : entry.type === 'trigger'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-blue-50 text-blue-700'
                      }`}>
                        {entry.type === 'success' ? 'Получилось' : entry.type === 'trigger' ? 'Было трудно' : 'Нам помогло'}
                      </span>
                      <p className="text-sm font-semibold text-opora-navy mt-2">{entry.title}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Удалить запись динамики: ${entry.title}`}
                      onClick={() => deleteProgressEntry(entry.id)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-sm text-opora-text mt-2 leading-relaxed">{entry.details}</p>
                  <p className="text-[11px] text-opora-sage font-semibold mt-2">
                    {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personalized Stage milestones indicator */}
        <div className="bg-opora-sage/10 p-5 rounded-2xl border border-opora-sage/20 relative">
          <div className="absolute top-4 right-4 text-opora-sage opacity-25">
            <Sparkles size={20} />
          </div>
          <h3 className="text-base font-semibold text-opora-navy mb-1.5 flex items-center gap-1">
            <CheckCircle size={15} /> Рекомендация для возраста {profile.childAge} лет:
          </h3>
          <p className="text-sm text-opora-text leading-relaxed">
            {profile.childAge <= 3 ? (
              "Фокусируйтесь на развитии невербальной коммуникации со специалистом по раннему вмешательству. Игры в сенсорных зонах отлично снизят общую возбудимость."
            ) : profile.childAge <= 6 ? (
              "Отличный период для начала интенсивных регулярных ABA-занятий и консультаций для социализации ребенка в малых инклюзивных группах детских садов."
            ) : (
              "Старайтесь уделить внимание плавной подготовке к школьному расписанию, прохождению комиссии ПМПК для выделения ассистента-тьютора."
            )}
          </p>
        </div>

        {/* Saved Articles Section */}
        <div>
          <h3 className="font-serif text-lg text-opora-navy mb-3 flex items-center gap-1.5">
            <Bookmark size={17} className="text-opora-sage" /> Сохраненные материалы ({savedArticlesData.length})
          </h3>
          
          {savedArticlesData.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-opora-sage/30 text-center text-sm text-opora-text/60">
              Вы еще не сохраняли статьи. Закладки на полезных материалах появятся здесь.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {savedArticlesData.map(article => (
                <div 
                  key={article.id} 
                  className="bg-white p-4 rounded-2xl border border-opora-sage/20 hover:border-opora-sage/50 transition-colors shadow-sm cursor-pointer flex justify-between items-start"
                  onClick={() => setSelectedArticleId(article.id)}
                >
                  <div className="flex-1 pr-3">
                    <span className="text-xs font-semibold text-opora-sage font-sans tracking-wide">
                      {article.category} • {article.readTime}
                    </span>
                    <h4 className="font-medium text-sm text-opora-navy mt-1 leading-snug line-clamp-1">
                      {article.title}
                    </h4>
                    <p className="text-[11px] text-opora-text line-clamp-1 mt-0.5">
                      {article.summary}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveArticle(article.id);
                    }}
                    className="p-1 hover:bg-red-50 text-red-400 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Centers Directory */}
        <div>
          <h3 className="font-serif text-lg text-opora-navy mb-3 flex items-center gap-1.5">
            <MapPin size={17} className="text-opora-sage" /> Сохраненные учреждения ({savedCentersData.length})
          </h3>
          
          {savedCentersData.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-opora-sage/30 text-center text-sm text-opora-text/60">
              Вы еще не сохраняли специализированные центры.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {savedCentersData.map(center => (
                <div key={center.id} className="bg-white p-4 rounded-2xl border border-opora-sage/20 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-sm text-opora-navy leading-snug">
                        {center.name}
                      </h4>
                      <div className="flex items-center gap-0.5 text-yellow-600 font-bold text-xs bg-yellow-50 px-1.5 py-0.5 rounded">
                        <Star size={10} className="fill-yellow-500 text-yellow-500" /> {center.rating}
                      </div>
                    </div>
                    <p className="text-xs text-opora-sage flex items-center gap-1 mb-2">
                      <MapPin size={9} /> {center.city}
                    </p>
                    <p className="text-[11px] text-opora-text line-clamp-2 leading-relaxed">
                      {center.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-black/5 mt-3 pt-2">
                    <button className="flex items-center gap-1 text-xs text-opora-navy hover:text-opacity-80 font-medium">
                      <Phone size={10} /> Контакты
                    </button>
                    <button 
                      onClick={() => toggleSaveCenter(center.id)}
                      className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Expandable Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-center items-end p-0"
            onClick={() => setSelectedArticleId(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-t-3xl w-full max-w-[390px] max-h-[85vh] overflow-y-auto px-6 pt-5 pb-10 shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 border-b border-black/5">
                <span className="text-sm font-semibold text-opora-sage tracking-wider uppercase">
                  {selectedArticle.category} • {selectedArticle.readTime}
                </span>
                <button 
                  onClick={() => setSelectedArticleId(null)}
                  className="p-1 hover:bg-opora-sand rounded-full text-opora-navy"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="font-serif text-xl font-semibold text-opora-navy leading-snug">
                {selectedArticle.title}
              </h3>

              <p className="text-sm text-opora-text p-3 bg-opora-peach/30 rounded-2xl leading-relaxed italic">
                {selectedArticle.summary}
              </p>

              <div className="text-sm text-opora-navy space-y-4 leading-relaxed font-sans markdown-body">
                <Markdown components={{
                  a: ({node, ...props}) => <a {...props} className="text-opora-sage underline hover:text-opora-navy font-semibold" target="_blank" rel="noopener noreferrer" />
                }}>
                  {selectedArticle.content}
                </Markdown>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => toggleSaveArticle(selectedArticle.id)}
                  className="w-full bg-opora-navy text-white text-sm font-medium py-3 rounded-2xl hover:bg-opacity-95 transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <Bookmark size={14} className={savedArticles.includes(selectedArticle.id) ? "fill-white" : ""} />
                  {savedArticles.includes(selectedArticle.id) ? "Убрать из сохраненных" : "Сохранить материал"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
