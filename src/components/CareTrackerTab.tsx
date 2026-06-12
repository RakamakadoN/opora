import React from 'react';
import {
  AlertTriangle,
  BellRing,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Plus,
  Route,
  Salad,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Utensils,
  Video
} from 'lucide-react';
import {
  useProfile,
  type DietRule,
  type FoodLog,
  type MedicationPlan,
  type ReactionLog
} from '../context/ProfileContext';
import {
  buildDoctorTrackerReport,
  getMedicationEventStatus,
  sortMedicationEventsForDay
} from '../lib/careTracker';
import {
  buildVideoReportPreview,
  formatVideoReportPreview,
  type VideoReportType
} from '../lib/videoReports';
import {
  buildFamilyCalendarEventsFromSources,
  expandFamilyEventOccurrences,
  getChildColorToken,
  type FamilyCalendarOccurrence,
  type FamilyEventType,
  type FamilyEventSource
} from '../lib/familyCalendar';
import { PremiumTrackerHome } from './PremiumTrackerHome';
import {
  buildMapsRouteUrl,
  getGovernmentQueueReminder,
  getGovernmentQueueStatus,
  sortGovernmentQueueRecords,
  type GovernmentQueueStatus
} from '../lib/governmentQueueMonitor';

export type TrackerView = 'calendar' | 'day' | 'meds' | 'food' | 'queues' | 'report' | 'video';
type CalendarChildFilter = 'all' | string;

const todayDate = () => new Date().toISOString().slice(0, 10);
const nowLocalInput = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const ruleTypeLabels: Record<DietRule['type'], string> = {
  allergen: 'Аллерген',
  medical: 'По назначению',
  sensory: 'Сенсорное',
  preference: 'Предпочтение',
  other: 'Другое'
};

const eventSourceLabels: Record<FamilyEventSource, string> = {
  manual: 'Вручную',
  medication_plan: 'Лекарство',
  medical_booking: 'Врач',
  government_queue: 'Госочередь',
  parent_task: 'Задача'
};

const childColorClasses: Record<string, { dot: string; badge: string; line: string; marker: string }> = {
  rose: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-100', line: 'border-l-rose-400', marker: 'bg-rose-400' },
  amber: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 border-amber-100', line: 'border-l-amber-400', marker: 'bg-amber-400' },
  emerald: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', line: 'border-l-emerald-400', marker: 'bg-emerald-400' },
  sky: { dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 border-sky-100', line: 'border-l-sky-400', marker: 'bg-sky-400' },
  violet: { dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 border-violet-100', line: 'border-l-violet-400', marker: 'bg-violet-400' },
  teal: { dot: 'bg-teal-500', badge: 'bg-teal-50 text-teal-700 border-teal-100', line: 'border-l-teal-400', marker: 'bg-teal-400' },
  pink: { dot: 'bg-pink-500', badge: 'bg-pink-50 text-pink-700 border-pink-100', line: 'border-l-pink-400', marker: 'bg-pink-400' },
  indigo: { dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100', line: 'border-l-indigo-400', marker: 'bg-indigo-400' }
};

export function CareTrackerTab({ initialView = 'calendar' }: { initialView?: TrackerView }) {
  const {
    profile,
    profiles,
    medicalBookings,
    parentTasks,
    medicationPlans,
    medicationEvents,
    dietRules,
    foodLogs,
    reactionLogs,
    governmentQueueRecords,
    familyCalendarItems,
    familyCalendarError,
    isFamilyCalendarLoading,
    loadFamilyCalendar,
    createCalendarEvent,
    completeCalendarOccurrence,
    addMedicationPlan,
    deleteMedicationPlan,
    recordMedicationEvent,
    deleteMedicationEvent,
    addDietRule,
    deleteDietRule,
    addFoodLog,
    deleteFoodLog,
    addReactionLog,
    deleteReactionLog,
    addGovernmentQueueRecord,
    updateGovernmentQueueRecord,
    deleteGovernmentQueueRecord
  } = useProfile();

  const [view, setView] = React.useState<TrackerView>('calendar');
  const [selectedChildId, setSelectedChildId] = React.useState(profile.id);
  const [calendarChildFilter, setCalendarChildFilter] = React.useState<CalendarChildFilter>('all');
  const [selectedCalendarDate, setSelectedCalendarDate] = React.useState(todayDate());
  const [planName, setPlanName] = React.useState('');
  const [doseText, setDoseText] = React.useState('');
  const [scheduleTime, setScheduleTime] = React.useState('09:00');
  const [foodRelation, setFoodRelation] = React.useState('после еды');
  const [prescriber, setPrescriber] = React.useState('');
  const [dietType, setDietType] = React.useState<DietRule['type']>('sensory');
  const [dietTitle, setDietTitle] = React.useState('');
  const [dietDetails, setDietDetails] = React.useState('');
  const [foodText, setFoodText] = React.useState('');
  const [foodReaction, setFoodReaction] = React.useState('');
  const [foodTexture, setFoodTexture] = React.useState('');
  const [reactionTitle, setReactionTitle] = React.useState('');
  const [reactionTrigger, setReactionTrigger] = React.useState('');
  const [reactionIntensity, setReactionIntensity] = React.useState<ReactionLog['intensity']>(3);
  const [queueServiceTitle, setQueueServiceTitle] = React.useState('');
  const [queueInstitutionName, setQueueInstitutionName] = React.useState('');
  const [queueInstitutionAddress, setQueueInstitutionAddress] = React.useState('');
  const [queueAppointmentAt, setQueueAppointmentAt] = React.useState(nowLocalInput());
  const [queueNumber, setQueueNumber] = React.useState('');
  const [currentQueueNumber, setCurrentQueueNumber] = React.useState('');
  const [queueNote, setQueueNote] = React.useState('');
  const [familyEventTitle, setFamilyEventTitle] = React.useState('');
  const [familyEventChildId, setFamilyEventChildId] = React.useState<CalendarChildFilter>('all');
  const [familyEventType, setFamilyEventType] = React.useState<FamilyEventType>('family');
  const [familyEventStartsAt, setFamilyEventStartsAt] = React.useState(nowLocalInput());
  const [familyEventDescription, setFamilyEventDescription] = React.useState('');
  const [familyEventRepeat, setFamilyEventRepeat] = React.useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [familyEventNotifyMinutes, setFamilyEventNotifyMinutes] = React.useState('30');
  const [familyEventSaving, setFamilyEventSaving] = React.useState(false);
  const [reportCopied, setReportCopied] = React.useState(false);
  const [videoReportCopied, setVideoReportCopied] = React.useState(false);
  const [videoReportType, setVideoReportType] = React.useState<VideoReportType>('doctor');

  React.useEffect(() => {
    setView(initialView);
  }, [initialView]);

  React.useEffect(() => {
    setSelectedChildId(profile.id);
  }, [profile.id]);

  const activeChild = profiles.find(child => child.id === selectedChildId) || profile;
  const childPlans = medicationPlans.filter(plan => plan.childId === selectedChildId && plan.active);
  const childDietRules = dietRules.filter(rule => rule.childId === selectedChildId && rule.active);
  const childFoodLogs = foodLogs.filter(log => log.childId === selectedChildId);
  const childReactionLogs = reactionLogs.filter(log => log.childId === selectedChildId);
  const childMedicationEvents = medicationEvents.filter(event => event.childId === selectedChildId);
  const childQueueRecords = sortGovernmentQueueRecords(
    governmentQueueRecords.filter(record => record.childId === selectedChildId),
    new Date()
  );
  const childNamesById = new Map(profiles.map(child => [child.id, child.childName]));
  const calendarDays = getCalendarWindow(todayDate());
  const calendarRangeStart = `${calendarDays[0]}T00:00:00.000Z`;
  const calendarRangeEnd = `${addDays(calendarDays[calendarDays.length - 1], 1)}T00:00:00.000Z`;
  React.useEffect(() => {
    loadFamilyCalendar(calendarRangeStart, calendarRangeEnd);
  }, [calendarRangeEnd, calendarRangeStart]);

  const localFamilySchedule = React.useMemo(() => {
    const familyEvents = buildFamilyCalendarEventsFromSources({
      familyId: 'local-family',
      createdByUserId: 'local-parent',
      now: new Date().toISOString(),
      medicationPlans,
      medicalBookings,
      governmentQueueRecords,
      parentTasks
    });

    return expandFamilyEventOccurrences({
      events: familyEvents.events,
      recurrenceRules: familyEvents.recurrenceRules,
      exceptions: [],
      occurrenceStates: [],
      rangeStart: calendarRangeStart,
      rangeEnd: calendarRangeEnd
    });
  }, [calendarRangeEnd, calendarRangeStart, governmentQueueRecords, medicalBookings, medicationPlans, parentTasks]);
  const familySchedule = React.useMemo(() => {
    return [...familyCalendarItems, ...localFamilySchedule].sort((a, b) => a.occurrenceStartsAt.localeCompare(b.occurrenceStartsAt));
  }, [familyCalendarItems, localFamilySchedule]);
  const visibleSchedule = familySchedule.filter(occurrence =>
    calendarChildFilter === 'all' || occurrence.childIds.includes(calendarChildFilter)
  );
  const selectedDaySchedule = visibleSchedule.filter(occurrence => occurrence.occurrenceDate === selectedCalendarDate);

  React.useEffect(() => {
    const refreshQueueStatuses = () => {
      governmentQueueRecords.forEach(record => {
        const nextStatus = getGovernmentQueueStatus(record);
        if (record.status !== nextStatus) {
          updateGovernmentQueueRecord(record.id, { status: nextStatus });
        }
      });
    };

    refreshQueueStatuses();
    const interval = window.setInterval(refreshQueueStatuses, 60_000);
    return () => window.clearInterval(interval);
  }, [governmentQueueRecords]);

  const plannedToday = childPlans.flatMap(plan => plan.reminderTimes.map(time => ({
    id: `${plan.id}-${time}`,
    childId: plan.childId,
    childName: plan.childName,
    planId: plan.id,
    planName: plan.name,
    doseText: plan.doseText,
    plannedAt: new Date(`${todayDate()}T${time}:00`).toISOString(),
    status: 'planned' as const,
    reminderWindowMinutes: plan.reminderWindowMinutes,
    foodRelation: plan.foodRelation
  })));

  const eventsToday = childMedicationEvents.filter(event => event.plannedAt.slice(0, 10) === todayDate());
  const timeline = sortMedicationEventsForDay([
    ...plannedToday.filter(planned => !eventsToday.some(event => event.planId === planned.planId && event.plannedAt === planned.plannedAt)),
    ...eventsToday
  ]);

  const reportText = buildDoctorTrackerReport({
    childName: activeChild.childName,
    periodLabel: 'последние записи в приложении',
    medications: childPlans,
    medicationEvents: childMedicationEvents,
    dietRules: childDietRules,
    foodLogs: childFoodLogs,
    reactions: childReactionLogs
  });
  const videoReportPreview = buildVideoReportPreview({
    reportType: videoReportType,
    child: activeChild,
    periodLabel: 'последние записи в приложении',
    medications: childPlans,
    medicationEvents: childMedicationEvents,
    foodLogs: childFoodLogs,
    reactions: childReactionLogs,
    questions: [
      'Что важно обсудить на следующем приеме?',
      'Какие наблюдения стоит продолжить фиксировать?'
    ]
  });
  const videoReportText = formatVideoReportPreview(videoReportPreview);

  const handleAddPlan = () => {
    if (!planName.trim() || !doseText.trim()) return;
    addMedicationPlan({
      childId: selectedChildId,
      name: planName.trim(),
      doseText: doseText.trim(),
      scheduleText: `Каждый день в ${scheduleTime}`,
      foodRelation: foodRelation.trim(),
      reminderTimes: [scheduleTime],
      reminderWindowMinutes: 30,
      repeatEveryMinutes: 15,
      startDate: todayDate(),
      prescriber: prescriber.trim() || undefined
    });
    setPlanName('');
    setDoseText('');
    setPrescriber('');
  };

  const handleRecordMedication = (plan: MedicationPlan, plannedAt: string, status: 'taken' | 'skipped') => {
    recordMedicationEvent({
      planId: plan.id,
      childId: plan.childId,
      planName: plan.name,
      doseText: plan.doseText,
      plannedAt,
      takenAt: status === 'taken' ? new Date().toISOString() : undefined,
      status,
      skipReason: status === 'skipped' ? 'отмечено родителем' : undefined,
      reminderWindowMinutes: plan.reminderWindowMinutes
    });
  };

  const handleAddDietRule = () => {
    if (!dietTitle.trim() || !dietDetails.trim()) return;
    addDietRule({
      childId: selectedChildId,
      type: dietType,
      title: dietTitle.trim(),
      details: dietDetails.trim()
    });
    setDietTitle('');
    setDietDetails('');
  };

  const handleAddFoodLog = () => {
    if (!foodText.trim()) return;
    addFoodLog({
      childId: selectedChildId,
      eatenAt: new Date().toISOString(),
      foodText: foodText.trim(),
      texture: foodTexture.trim() || undefined,
      reaction: foodReaction.trim() || undefined
    });
    setFoodText('');
    setFoodTexture('');
    setFoodReaction('');
  };

  const handleAddReactionLog = () => {
    if (!reactionTitle.trim()) return;
    addReactionLog({
      childId: selectedChildId,
      happenedAt: new Date().toISOString(),
      title: reactionTitle.trim(),
      intensity: reactionIntensity,
      possibleTrigger: reactionTrigger.trim() || undefined
    });
    setReactionTitle('');
    setReactionTrigger('');
    setReactionIntensity(3);
  };

  const handleAddQueueRecord = () => {
    const parsedQueueNumber = parsePositiveNumber(queueNumber);
    const parsedCurrentQueueNumber = parsePositiveNumber(currentQueueNumber);
    if (!queueServiceTitle.trim()) return;
    if (!queueAppointmentAt && !parsedQueueNumber) return;

    addGovernmentQueueRecord({
      childId: selectedChildId,
      serviceTitle: queueServiceTitle.trim(),
      institutionName: queueInstitutionName.trim() || 'Госучреждение',
      institutionAddress: queueInstitutionAddress.trim(),
      appointmentAt: queueAppointmentAt ? new Date(queueAppointmentAt).toISOString() : undefined,
      queueNumber: parsedQueueNumber,
      currentQueueNumber: parsedCurrentQueueNumber,
      note: queueNote.trim() || undefined
    });
    setQueueServiceTitle('');
    setQueueInstitutionName('');
    setQueueInstitutionAddress('');
    setQueueAppointmentAt(nowLocalInput());
    setQueueNumber('');
    setCurrentQueueNumber('');
    setQueueNote('');
  };

  const handleAddFamilyEvent = async () => {
    const startsAt = new Date(familyEventStartsAt);
    if (!familyEventTitle.trim() || Number.isNaN(startsAt.getTime())) return;
    const childIds = familyEventChildId === 'all' ? [] : [familyEventChildId];
    setFamilyEventSaving(true);
    try {
      await createCalendarEvent({
        title: familyEventTitle.trim(),
        startsAt: startsAt.toISOString(),
        childIds,
        eventType: familyEventType,
        description: familyEventDescription.trim() || undefined,
        notifyMinutesBefore: parsePositiveNumber(familyEventNotifyMinutes) ?? 30,
        recurrenceRule: familyEventRepeat === 'none' ? undefined : {
          frequency: familyEventRepeat,
          intervalCount: 1,
          weekdays: familyEventRepeat === 'weekly' ? [startsAt.getDay()] : undefined,
          monthDay: familyEventRepeat === 'monthly' ? startsAt.getDate() : undefined,
          startsOn: startsAt.toISOString().slice(0, 10)
        }
      });
      setFamilyEventTitle('');
      setFamilyEventDescription('');
      setFamilyEventRepeat('none');
      setFamilyEventStartsAt(nowLocalInput());
    } finally {
      setFamilyEventSaving(false);
    }
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setReportCopied(true);
      window.setTimeout(() => setReportCopied(false), 2500);
    } catch {
      setReportCopied(false);
    }
  };

  const handleCopyVideoReport = async () => {
    try {
      await navigator.clipboard.writeText(videoReportText);
      setVideoReportCopied(true);
      window.setTimeout(() => setVideoReportCopied(false), 2500);
    } catch {
      setVideoReportCopied(false);
    }
  };

  if (view === 'calendar') {
    return <PremiumTrackerHome onOpenView={setView} />;
  }

  return (
    <div className="h-full flex flex-col bg-opora-sand pt-9 pb-10">
      <div className="px-5">
        <div className="overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(243,238,255,0.86)_42%,rgba(236,250,247,0.88)_100%)] p-4 shadow-[0_16px_36px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Семейный журнал</p>
              <h1 className="mt-2 text-[28px] font-black tracking-tight text-[#13273F]">Трекер заботы</h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#6F7B8E]">
                Лекарства, питание, реакции и отчет врачу по каждому ребенку.
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-white/74 text-[#7C5CFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
              <ClipboardList size={24} />
            </div>
          </div>

          <div className="mt-4 rounded-[26px] border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-950 backdrop-blur-xl">
            <div className="mb-1 flex items-center gap-2 font-extrabold">
              <AlertTriangle size={15} />
              Не меняет назначения
            </div>
            Трекер хранит расписание и факты. При пропуске или сомнении не компенсируйте дозу без врача.
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {profiles.map(child => (
            <button
              key={child.id}
              type="button"
              onClick={() => setSelectedChildId(child.id)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-extrabold transition-all backdrop-blur-xl ${
                selectedChildId === child.id ? 'border-transparent bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] text-white shadow-[0_12px_24px_rgba(124,92,255,0.20)]' : 'border-white/80 bg-white/70 text-[#13273F]'
              }`}
            >
              {child.childName}
            </button>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-3 gap-1 rounded-[28px] border border-white/80 bg-white/70 p-1.5 shadow-[0_14px_30px_rgba(124,92,255,0.06)] backdrop-blur-2xl">
          {[
            { id: 'calendar', label: 'Семья', icon: CalendarDays },
            { id: 'day', label: 'День', icon: Clock },
            { id: 'meds', label: 'Лек.', icon: BellRing },
            { id: 'food', label: 'Еда', icon: Salad },
            { id: 'queues', label: 'Очереди', icon: CalendarCheck },
            { id: 'report', label: 'Отчет', icon: FileText },
            { id: 'video', label: 'Видео', icon: Video }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id as TrackerView)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[22px] text-[10px] font-extrabold transition-all ${
                view === item.id ? 'bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] text-white shadow-[0_12px_24px_rgba(124,92,255,0.18)]' : 'text-[#6F7B8E]'
              }`}
            >
              <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {view === 'calendar' && <PremiumTrackerHome onOpenView={setView} />}

        {view === 'day' && (
          <section className="space-y-4">
            <StatsRow plans={childPlans.length} dietRules={childDietRules.length} foodLogs={childFoodLogs.length} reactions={childReactionLogs.length} />
            <Panel title={`Сегодня: ${activeChild.childName}`} icon={<Clock size={18} />}>
              {timeline.length ? (
                <div className="space-y-3">
                  {timeline.map(item => {
                    const savedEvent = 'createdAt' in item ? item : null;
                    const plan = childPlans.find(plan => plan.id === item.planId);
                    const status = getMedicationEventStatus(item);
                    return (
                      <div key={item.id} className="rounded-[26px] border border-white/80 bg-white/72 px-4 py-4 shadow-[0_12px_28px_rgba(124,92,255,0.06)] backdrop-blur-2xl">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-[#13273F]">{item.planName}</p>
                            <p className="text-xs font-medium text-[#6F7B8E]">{formatTime(item.plannedAt)} · {item.doseText}</p>
                            {'foodRelation' in item && <p className="mt-1 text-[11px] font-bold text-[#7C5CFF]">{item.foodRelation}</p>}
                          </div>
                          <StatusPill status={status} />
                        </div>
                        {plan && !savedEvent && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => handleRecordMedication(plan, item.plannedAt, 'taken')} className="rounded-full bg-[linear-gradient(180deg,#49D29D_0%,#2FB58A_100%)] px-3 py-2.5 text-xs font-extrabold text-white shadow-[0_10px_20px_rgba(73,210,157,0.18)]">
                              Принято
                            </button>
                            <button type="button" onClick={() => handleRecordMedication(plan, item.plannedAt, 'skipped')} className="rounded-full border border-white/80 bg-white/70 px-3 py-2.5 text-xs font-extrabold text-[#13273F]">
                              Пропущено
                            </button>
                          </div>
                        )}
                        {savedEvent && (
                          <button type="button" onClick={() => deleteMedicationEvent(savedEvent.id)} className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#6F7B8E]">
                            <Trash2 size={13} /> Удалить отметку
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState text="На сегодня нет расписания. Добавьте препарат во вкладке «Лек.»." />
              )}
            </Panel>
          </section>
        )}

        {view === 'meds' && (
          <section className="space-y-4 px-4 pb-24 pt-4">
            <div className="overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88)_0%,rgba(243,238,255,0.84)_45%,rgba(236,250,247,0.9)_100%)] p-4 shadow-[0_16px_36px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Лекарства</p>
                  <h2 className="mt-2 text-[26px] font-black tracking-tight text-[#13273F]">Расписание и отметки</h2>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#6F7B8E]">Все назначения, окно приема и связь с едой в одном спокойном экране.</p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-white/72 text-[#7C5CFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <Stethoscope size={24} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Активных</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{childPlans.length}</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Сегодня</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{childMedicationEvents.length}</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Окно</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">30м</p>
                </div>
              </div>
            </div>

            <Panel title="Добавить препарат" icon={<Plus size={18} />}>
              <FormField label="Название">
                <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Например, Витамин D" className={inputClass} />
              </FormField>
              <FormField label="Дозировка как в назначении">
                <input value={doseText} onChange={e => setDoseText(e.target.value)} placeholder="1/2 таблетки утром" className={inputClass} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Время">
                  <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className={inputClass} />
                </FormField>
                <FormField label="Связь с едой">
                  <input value={foodRelation} onChange={e => setFoodRelation(e.target.value)} placeholder="после еды" className={inputClass} />
                </FormField>
              </div>
              <FormField label="Врач или источник назначения">
                <input value={prescriber} onChange={e => setPrescriber(e.target.value)} placeholder="Педиатр, невролог..." className={inputClass} />
              </FormField>
              <button type="button" onClick={handleAddPlan} className="mt-2 w-full rounded-full bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(124,92,255,0.18)]">
                Сохранить расписание
              </button>
            </Panel>

            <Panel title="Активные назначения" icon={<BellRing size={18} />}>
              {childPlans.length ? childPlans.map(plan => (
                <ListCard key={plan.id} title={plan.name} subtitle={`${plan.doseText} · ${plan.scheduleText}`} onDelete={() => deleteMedicationPlan(plan.id)}>
                  <p className="text-xs text-[#6F7B8E]">Связь с едой: {plan.foodRelation || 'не указана'}</p>
                  <p className="text-xs text-[#6F7B8E]">Окно приема: {plan.reminderWindowMinutes} мин · повтор через {plan.repeatEveryMinutes} мин</p>
                </ListCard>
              )) : <EmptyState text="Пока нет активных назначений для выбранного ребенка." />}
            </Panel>
          </section>
        )}

        {view === 'food' && (
          <section className="space-y-4 px-4 pb-24 pt-4">
            <div className="overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88)_0%,rgba(236,250,247,0.9)_52%,rgba(243,238,255,0.84)_100%)] p-4 shadow-[0_16px_36px_rgba(104,199,184,0.08)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#45A69B]/75">Еда и реакции</p>
                  <h2 className="mt-2 text-[26px] font-black tracking-tight text-[#13273F]">Мягкая фиксация питания</h2>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#6F7B8E]">Рацион, ограничения и реакции собраны в спокойные карточки.</p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-white/72 text-[#45A69B]">
                  <Utensils size={24} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Ограничения</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{childDietRules.length}</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Приемы</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{childFoodLogs.length}</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Реакции</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{childReactionLogs.length}</p>
                </div>
              </div>
            </div>

            <Panel title="Диетическое правило" icon={<Salad size={18} />}>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Тип">
                  <select value={dietType} onChange={e => setDietType(e.target.value as DietRule['type'])} className={inputClass}>
                    {Object.entries(ruleTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </FormField>
                <FormField label="Название">
                  <input value={dietTitle} onChange={e => setDietTitle(e.target.value)} placeholder="Молочный белок" className={inputClass} />
                </FormField>
              </div>
              <FormField label="Детали">
                <textarea value={dietDetails} onChange={e => setDietDetails(e.target.value)} placeholder="Что исключить, чем заменить, кто назначил" className={`${inputClass} min-h-20 resize-none`} />
              </FormField>
              <button type="button" onClick={handleAddDietRule} className="mt-2 w-full rounded-full bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(124,92,255,0.18)]">
                Добавить ограничение
              </button>
            </Panel>

            <Panel title="Запись еды" icon={<Utensils size={18} />}>
              <FormField label="Что ел ребенок">
                <input value={foodText} onChange={e => setFoodText(e.target.value)} placeholder="Гречка, индейка, яблоко" className={inputClass} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Текстура">
                  <input value={foodTexture} onChange={e => setFoodTexture(e.target.value)} placeholder="пюре, кусочки" className={inputClass} />
                </FormField>
                <FormField label="Реакция">
                  <input value={foodReaction} onChange={e => setFoodReaction(e.target.value)} placeholder="спокойно, отказ" className={inputClass} />
                </FormField>
              </div>
              <button type="button" onClick={handleAddFoodLog} className="mt-2 w-full rounded-full bg-[linear-gradient(180deg,#49D29D_0%,#2FB58A_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(73,210,157,0.18)]">
                Записать еду
              </button>
            </Panel>

            <Panel title="Реакция или симптом" icon={<Stethoscope size={18} />}>
              <FormField label="Что заметили">
                <input value={reactionTitle} onChange={e => setReactionTitle(e.target.value)} placeholder="Сыпь, трудный сон, боль в животе" className={inputClass} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Интенсивность">
                  <input type="number" min={1} max={5} value={reactionIntensity} onChange={e => setReactionIntensity(clampIntensity(e.target.value))} className={inputClass} />
                </FormField>
                <FormField label="Что было перед этим">
                  <input value={reactionTrigger} onChange={e => setReactionTrigger(e.target.value)} placeholder="новый продукт" className={inputClass} />
                </FormField>
              </div>
              <button type="button" onClick={handleAddReactionLog} className="mt-2 w-full rounded-full bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(124,92,255,0.18)]">
                Записать реакцию
              </button>
            </Panel>

            <Panel title="Активные ограничения" icon={<Salad size={18} />}>
              {childDietRules.length ? childDietRules.map(rule => (
                <ListCard key={rule.id} title={rule.title} subtitle={ruleTypeLabels[rule.type]} onDelete={() => deleteDietRule(rule.id)}>
                  <p className="text-xs text-[#6F7B8E]">{rule.details}</p>
                </ListCard>
              )) : <EmptyState text="Диетические ограничения пока не указаны." />}
            </Panel>
          </section>
        )}

        {view === 'report' && (
          <section className="space-y-4 px-4 pb-24 pt-4">
            <div className="overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(243,238,255,0.86)_48%,rgba(232,244,240,0.88)_100%)] p-4 shadow-[0_16px_36px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Отчет врачу</p>
                  <h2 className="mt-2 text-[26px] font-black tracking-tight text-[#13273F]">Готовый текст для приема</h2>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#6F7B8E]">Скопируйте отчет, чтобы быстро передать врачу последние факты без ручной сборки.</p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-white/72 text-[#7C5CFF]">
                  <FileText size={24} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Еда</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{childFoodLogs.length}</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Реакции</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{childReactionLogs.length}</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Текст</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{Math.max(1, Math.round(reportText.length / 1000))}к</p>
                </div>
              </div>
            </div>

            <Panel title="Отчет врачу" icon={<FileText size={18} />}>
              <p className="mb-3 text-xs leading-relaxed text-[#6F7B8E]">
                Отчет собирает последние записи выбранного ребенка. Его можно скопировать и отправить врачу перед приемом.
              </p>
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(244,248,255,0.8)_0%,rgba(255,255,255,0.9)_100%)] p-4 text-xs leading-relaxed text-[#13273F] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                {reportText}
              </pre>
              <button type="button" onClick={handleCopyReport} className="mt-3 w-full rounded-full bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(124,92,255,0.18)]">
                {reportCopied ? 'Скопировано' : 'Скопировать отчет'}
              </button>
            </Panel>

            <Panel title="Последние записи" icon={<ClipboardList size={18} />}>
              {[...childFoodLogs.slice(0, 3), ...childReactionLogs.slice(0, 3)].length ? (
                <div className="space-y-2">
                  {childFoodLogs.slice(0, 3).map(log => (
                    <ListCard key={log.id} title={log.foodText} subtitle={formatTime(log.eatenAt)} onDelete={() => deleteFoodLog(log.id)}>
                      <p className="text-xs text-[#6F7B8E]">{[log.texture, log.reaction].filter(Boolean).join(' · ') || 'Без реакции'}</p>
                    </ListCard>
                  ))}
                  {childReactionLogs.slice(0, 3).map(log => (
                    <ListCard key={log.id} title={log.title} subtitle={`${formatTime(log.happenedAt)} · ${log.intensity}/5`} onDelete={() => deleteReactionLog(log.id)}>
                      <p className="text-xs text-[#6F7B8E]">{log.possibleTrigger || 'Предыдущее событие не указано'}</p>
                    </ListCard>
                  ))}
                </div>
              ) : <EmptyState text="Пока нет записей питания или реакций." />}
            </Panel>
          </section>
        )}

        {view === 'video' && (
          <section className="space-y-4 px-4 pb-24 pt-4">
            <div className="overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(243,238,255,0.88)_52%,rgba(232,244,240,0.86)_100%)] p-4 shadow-[0_16px_36px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Видео</p>
                  <h2 className="mt-2 text-[26px] font-black tracking-tight text-[#13273F]">Сценарий из фактов</h2>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#6F7B8E]">Показываем структуру ролика перед отправкой врачу или близким.</p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-white/72 text-[#7C5CFF]">
                  <Video size={24} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Сцены</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{videoReportPreview.scenes.length}</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Длительность</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">~{videoReportPreview.estimatedDurationSeconds}с</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Безопасность</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{videoReportPreview.safetyIssues.length}</p>
                </div>
              </div>
            </div>

            <Panel title="Видео-отчет" icon={<Video size={18} />}>
              <p className="mb-3 text-xs leading-relaxed text-[#6F7B8E]">
                Предпросмотр показывает сцены будущего ролика. Видео строится только из фактов и не содержит медицинских рекомендаций.
              </p>
              <FormField label="Тип видео">
                <select value={videoReportType} onChange={e => setVideoReportType(e.target.value as VideoReportType)} className={inputClass}>
                  <option value="doctor">Видео-отчет для врача</option>
                  <option value="pre_consultation">Видео перед консультацией</option>
                  <option value="caregiver">Видео для воспитателя/няни</option>
                </select>
              </FormField>
              <div className="mt-3 rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(244,248,255,0.78)_0%,rgba(255,255,255,0.92)_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Шаблон</p>
                    <p className="text-sm font-extrabold text-[#13273F]">{getVideoReportTypeLabel(videoReportType)}</p>
                  </div>
                  <div className="rounded-full bg-white/85 px-3 py-2 text-right text-[11px] font-extrabold text-[#13273F]">
                    ~{videoReportPreview.estimatedDurationSeconds} сек
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Безопасность данных" icon={<ShieldCheck size={18} />}>
              <div className="space-y-2">
                {videoReportPreview.warnings.map(warning => (
                  <div key={warning} className="rounded-[22px] bg-emerald-500/10 px-3 py-3 text-xs font-bold leading-relaxed text-emerald-800">
                    {warning}
                  </div>
                ))}
                {videoReportPreview.safetyIssues.length ? (
                  <div className="rounded-[22px] bg-rose-500/10 px-3 py-3 text-xs font-bold leading-relaxed text-rose-800">
                    Найдены формулировки, которые нужно исправить перед генерацией: {videoReportPreview.safetyIssues.length}.
                  </div>
                ) : (
                  <div className="rounded-[22px] bg-white/72 px-3 py-3 text-xs font-bold leading-relaxed text-[#13273F]">
                    Запрещенные формулировки не найдены. Перед отправкой все равно проверьте сцены вручную.
                  </div>
                )}
              </div>
            </Panel>

            <Panel title="Сцены ролика" icon={<ClipboardList size={18} />}>
              <div className="space-y-3">
                {videoReportPreview.scenes.map((scene, index) => (
                  <div key={scene.id} className="rounded-[26px] border border-white/80 bg-white/72 px-4 py-4 shadow-[0_12px_28px_rgba(124,92,255,0.06)] backdrop-blur-2xl">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Сцена {index + 1}</p>
                        <h3 className="text-sm font-extrabold text-[#13273F]">{scene.title}</h3>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#F4F8FF] px-2.5 py-1 text-[10px] font-extrabold text-[#6F4CF7]">
                        {scene.durationSeconds} сек
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {scene.lines.map(line => (
                        <li key={line} className="text-xs leading-relaxed text-[#6F7B8E]">• {line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleCopyVideoReport} className="mt-3 w-full rounded-full bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(124,92,255,0.18)]">
                {videoReportCopied ? 'Скопировано' : 'Скопировать сценарий'}
              </button>
            </Panel>
          </section>
        )}

        {view === 'queues' && (
          <section className="space-y-4 px-4 pb-24 pt-4">
            <div className="overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(243,238,255,0.84)_48%,rgba(232,244,240,0.86)_100%)] p-4 shadow-[0_16px_36px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#7C5CFF]/70">Очереди и визиты</p>
                  <h2 className="mt-2 text-[26px] font-black tracking-tight text-[#13273F]">Маршрут и ожидание</h2>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#6F7B8E]">Госучреждения, номера очереди и быстрый путь к карте — в одном блоке.</p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-white/72 text-[#45A69B]">
                  <CalendarCheck size={24} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Записей</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">{childQueueRecords.length}</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Ожидание</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">live</p>
                </div>
                <div className="rounded-[22px] bg-white/68 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#98A2B3]">Маршрут</p>
                  <p className="mt-1 text-xl font-black text-[#13273F]">1 tap</p>
                </div>
              </div>
            </div>

            <Panel title="Добавить запись" icon={<CalendarCheck size={18} />}>
              <FormField label="Услуга">
                <input value={queueServiceTitle} onChange={e => setQueueServiceTitle(e.target.value)} placeholder="ПМПК, ЦОН, МСЭ" className={inputClass} />
              </FormField>
              <FormField label="Учреждение">
                <input value={queueInstitutionName} onChange={e => setQueueInstitutionName(e.target.value)} placeholder="Название учреждения" className={inputClass} />
              </FormField>
              <FormField label="Адрес для маршрута">
                <input value={queueInstitutionAddress} onChange={e => setQueueInstitutionAddress(e.target.value)} placeholder="Алматы, Абая 10" className={inputClass} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Дата и время">
                  <input type="datetime-local" value={queueAppointmentAt} onChange={e => setQueueAppointmentAt(e.target.value)} className={inputClass} />
                </FormField>
                <FormField label="Мой номер">
                  <input inputMode="numeric" value={queueNumber} onChange={e => setQueueNumber(e.target.value)} placeholder="42" className={inputClass} />
                </FormField>
              </div>
              <FormField label="Сейчас обслуживают">
                <input inputMode="numeric" value={currentQueueNumber} onChange={e => setCurrentQueueNumber(e.target.value)} placeholder="Если известно" className={inputClass} />
              </FormField>
              <FormField label="Заметка">
                <textarea value={queueNote} onChange={e => setQueueNote(e.target.value)} placeholder="Какие документы взять, кабинет, контакт" className={`${inputClass} min-h-20 resize-none`} />
              </FormField>
              <button type="button" onClick={handleAddQueueRecord} className="mt-2 w-full rounded-full bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(124,92,255,0.18)]">
                Сохранить запись
              </button>
            </Panel>

            <Panel title="Активные очереди и визиты" icon={<BellRing size={18} />}>
              {childQueueRecords.length ? (
                <div className="space-y-2">
                  {childQueueRecords.map(record => {
                    const status = getGovernmentQueueStatus(record);
                    const reminder = getGovernmentQueueReminder(record);
                    return (
                      <div key={record.id} className="rounded-[26px] border border-white/80 bg-white/72 px-4 py-4 shadow-[0_12px_28px_rgba(124,92,255,0.06)] backdrop-blur-2xl">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-extrabold text-[#13273F]">{record.serviceTitle}</p>
                            <p className="text-xs font-bold text-[#7C5CFF]">{record.institutionName}</p>
                            {record.appointmentAt && <p className="mt-1 text-xs text-[#6F7B8E]">{formatDateTime(record.appointmentAt)}</p>}
                          </div>
                          <QueueStatusPill status={status} />
                        </div>
                        {reminder && (
                          <div className="mt-3 rounded-[20px] bg-[#F2EEFF] px-3 py-3 text-xs font-extrabold text-[#6F4CF7]">
                            {reminder.message}
                          </div>
                        )}
                        {(record.queueNumber || record.currentQueueNumber) && (
                          <p className="mt-3 text-xs text-[#6F7B8E]">
                            Очередь: {record.currentQueueNumber || 'неизвестно'} из {record.queueNumber || 'не указано'}
                          </p>
                        )}
                        {record.note && <p className="mt-2 text-xs leading-relaxed text-[#6F7B8E]">{record.note}</p>}
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <a
                            href={record.institutionAddress ? buildMapsRouteUrl(record.institutionAddress) : undefined}
                            target="_blank"
                            rel="noreferrer"
                            aria-disabled={!record.institutionAddress}
                            className={`flex min-h-10 items-center justify-center rounded-full px-2 text-[11px] font-extrabold ${
                              record.institutionAddress ? 'bg-[linear-gradient(180deg,#49D29D_0%,#2FB58A_100%)] text-white shadow-[0_10px_20px_rgba(73,210,157,0.16)]' : 'pointer-events-none bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Route size={14} className="mr-1" /> Маршрут
                          </a>
                          <button
                            type="button"
                            onClick={() => updateGovernmentQueueRecord(record.id, { status: 'completed' })}
                            className="flex min-h-10 items-center justify-center rounded-full bg-white/80 px-2 text-[11px] font-extrabold text-[#13273F]"
                          >
                            <CheckCircle2 size={14} className="mr-1" /> Готово
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGovernmentQueueRecord(record.id)}
                            className="flex min-h-10 items-center justify-center rounded-full bg-rose-500/10 px-2 text-[11px] font-extrabold text-rose-700"
                          >
                            <Trash2 size={14} className="mr-1" /> Удалить
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyState text="Пока нет записей в госучреждения. Добавьте дату визита или номер очереди." />}
            </Panel>
          </section>
        )}
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-[22px] border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-[#13273F] outline-none backdrop-blur-2xl placeholder:text-[#9AA5BA] focus:border-[#7C5CFF]/30';

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[32px] border border-white/80 bg-white/72 p-4 shadow-[0_16px_36px_rgba(124,92,255,0.08)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center gap-3 text-[#13273F]">
        <span className="flex h-10 w-10 items-center justify-center rounded-[22px] bg-[#F2EEFF] text-[#7C5CFF]">{icon}</span>
        <h2 className="text-[15px] font-extrabold tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function FamilyCalendarCard({
  occurrence,
  childNamesById,
  onComplete
}: {
  occurrence: FamilyCalendarOccurrence;
  childNamesById: Map<string, string>;
  onComplete?: () => void;
}) {
  const primaryColor = getChildColorClasses(occurrence.childIds[0] || 'family');
  return (
    <div className={`rounded-[26px] border border-white/80 border-l-4 bg-white/72 px-4 py-4 shadow-[0_12px_28px_rgba(124,92,255,0.06)] backdrop-blur-2xl ${primaryColor.line}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-extrabold text-[#13273F]">{occurrence.title}</p>
          <p className="mt-1 text-xs font-bold text-[#7C5CFF]">
            {occurrence.allDay ? 'Весь день' : formatTime(occurrence.occurrenceStartsAt)}
            {occurrence.occurrenceEndsAt ? `-${formatTime(occurrence.occurrenceEndsAt)}` : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#F4F0FF] px-2.5 py-1 text-[10px] font-extrabold text-[#6F4CF7]">
          {eventSourceLabels[occurrence.source]}
        </span>
      </div>
      {occurrence.description && <p className="mt-2 text-xs leading-relaxed text-[#6F7B8E]">{occurrence.description}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {occurrence.childIds.length ? occurrence.childIds.map(childId => {
          const color = getChildColorClasses(childId);
          return (
            <span key={childId} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${color.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
              {childNamesById.get(childId) || 'Ребенок'}
            </span>
          );
        }) : (
          <span className="inline-flex items-center rounded-full border border-white/80 bg-[#F4F8FF] px-2.5 py-1 text-[10px] font-extrabold text-[#13273F]">
            Вся семья
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#91A0B7]">
          {occurrence.recurrenceLabel ? `${occurrence.recurrenceLabel} · ` : ''}Напоминания на сервере
        </span>
        {onComplete && (
          <button type="button" onClick={onComplete} className="rounded-full bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_10px_18px_rgba(124,92,255,0.18)]">
            Готово
          </button>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#91A0B7]">{label}</span>
      {children}
    </label>
  );
}

function StatsRow({ plans, dietRules, foodLogs, reactions }: { plans: number; dietRules: number; foodLogs: number; reactions: number }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        ['Лек.', plans],
        ['Диета', dietRules],
        ['Еда', foodLogs],
        ['Реакц.', reactions]
      ].map(([label, value]) => (
        <div key={label} className="rounded-[24px] border border-white/80 bg-white/72 px-2 py-3 text-center shadow-[0_10px_22px_rgba(124,92,255,0.06)] backdrop-blur-2xl">
          <p className="text-lg font-black text-[#13273F]">{value}</p>
          <p className="text-[10px] font-bold text-[#7A869B]">{label}</p>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof getMedicationEventStatus> }) {
  const config = {
    planned: ['Запланировано', 'bg-[#F2EEFF] text-[#6F4CF7]'],
    on_time: ['Принято', 'bg-emerald-500/12 text-emerald-700'],
    late: ['Ожидается', 'bg-[#F2EEFF] text-[#6F4CF7]'],
    skipped: ['Пропущено', 'bg-rose-500/12 text-rose-700']
  }[status];
  return <span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-extrabold ${config[1]}`}>{config[0]}</span>;
}

function QueueStatusPill({ status }: { status: GovernmentQueueStatus }) {
  const config = {
    waiting: ['Ожидаем', 'bg-slate-500/10 text-slate-700'],
    soon: ['Скоро', 'bg-[#F2EEFF] text-[#6F4CF7]'],
    ready: ['Подошла', 'bg-emerald-500/12 text-emerald-700'],
    completed: ['Готово', 'bg-slate-500/10 text-slate-700'],
    cancelled: ['Отменено', 'bg-rose-500/12 text-rose-700']
  }[status];
  return <span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-extrabold ${config[1]}`}>{config[0]}</span>;
}

function ListCard({ title, subtitle, children, onDelete }: { title: string; subtitle: string; children?: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="mb-2 rounded-[28px] border border-white/80 bg-white/72 px-4 py-4 shadow-[0_12px_28px_rgba(124,92,255,0.06)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-extrabold text-[#13273F]">{title}</p>
          <p className="text-xs font-bold text-[#7C5CFF]">{subtitle}</p>
        </div>
        <button type="button" onClick={onDelete} className="shrink-0 rounded-full bg-white/80 p-2.5 text-[#8A94AA]">
          <Trash2 size={15} />
        </button>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/60 px-4 py-4 text-center text-xs font-bold leading-relaxed text-[#718096] backdrop-blur-2xl">
      {text}
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatWeekday(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatAgendaTitle(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(`${value}T00:00:00.000Z`));
}

function getVideoReportTypeLabel(type: VideoReportType) {
  return {
    doctor: 'Видео-отчет для врача',
    pre_consultation: 'Видео перед консультацией',
    caregiver: 'Видео для воспитателя/няни'
  }[type];
}

function getCalendarWindow(startDate: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function getChildColorClasses(childId: string) {
  return childColorClasses[getChildColorToken(childId)] || childColorClasses.teal;
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function clampIntensity(value: string): ReactionLog['intensity'] {
  const parsed = Number(value);
  if (parsed <= 1) return 1;
  if (parsed >= 5) return 5;
  return parsed as ReactionLog['intensity'];
}
