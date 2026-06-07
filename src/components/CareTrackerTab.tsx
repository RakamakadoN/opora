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
  Stethoscope,
  Trash2,
  Utensils
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
  buildFamilyCalendarEventsFromSources,
  expandFamilyEventOccurrences,
  getChildColorToken,
  type FamilyCalendarOccurrence,
  type FamilyEventType,
  type FamilyEventSource
} from '../lib/familyCalendar';
import {
  buildMapsRouteUrl,
  getGovernmentQueueReminder,
  getGovernmentQueueStatus,
  sortGovernmentQueueRecords,
  type GovernmentQueueStatus
} from '../lib/governmentQueueMonitor';

type TrackerView = 'calendar' | 'day' | 'meds' | 'food' | 'queues' | 'report';
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

export function CareTrackerTab() {
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

  return (
    <div className="h-full flex flex-col pt-12 pb-10">
      <div className="px-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">Семейный журнал</p>
            <h1 className="font-serif text-2xl font-medium text-opora-navy">Трекер заботы</h1>
            <p className="mt-1 text-sm leading-relaxed text-opora-text">
              Лекарства, питание, реакции и отчет врачу по каждому ребенку.
            </p>
          </div>
          <div className="rounded-2xl bg-opora-sage/10 p-3 text-opora-sage">
            <ClipboardList size={24} />
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
          <div className="mb-1 flex items-center gap-2 font-extrabold">
            <AlertTriangle size={15} />
            Не меняет назначения
          </div>
          Трекер хранит расписание и факты. При пропуске или сомнении не компенсируйте дозу без врача.
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {profiles.map(child => (
            <button
              key={child.id}
              type="button"
              onClick={() => setSelectedChildId(child.id)}
              className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                selectedChildId === child.id ? 'bg-opora-navy text-white shadow-sm' : 'bg-white/80 text-opora-navy'
              }`}
            >
              {child.childName}
            </button>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-white/80 p-1 shadow-sm">
          {[
            { id: 'calendar', label: 'Семья', icon: CalendarDays },
            { id: 'day', label: 'День', icon: Clock },
            { id: 'meds', label: 'Лек.', icon: BellRing },
            { id: 'food', label: 'Еда', icon: Salad },
            { id: 'queues', label: 'Очереди', icon: CalendarCheck },
            { id: 'report', label: 'Отчет', icon: FileText }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id as TrackerView)}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold ${
                  view === item.id ? 'bg-opora-sage text-white' : 'text-opora-text'
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
        {view === 'calendar' && (
          <section className="space-y-4">
            <Panel title="Общее расписание" icon={<CalendarDays size={18} />}>
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setCalendarChildFilter('all')}
                  className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                    calendarChildFilter === 'all' ? 'bg-opora-navy text-white shadow-sm' : 'bg-opora-sand text-opora-navy'
                  }`}
                >
                  Все дети
                </button>
                {profiles.map(child => {
                  const color = getChildColorClasses(child.id);
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setCalendarChildFilter(child.id)}
                      className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                        calendarChildFilter === child.id ? 'bg-opora-navy text-white shadow-sm' : 'bg-opora-sand text-opora-navy'
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                      {child.childName}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => {
                  const dayItems = visibleSchedule.filter(occurrence => occurrence.occurrenceDate === day);
                  const isSelected = selectedCalendarDate === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedCalendarDate(day)}
                      className={`min-h-[72px] rounded-xl border px-1.5 py-2 text-center transition-all ${
                        isSelected ? 'border-opora-sage bg-opora-sage text-white' : 'border-opora-sage/10 bg-white text-opora-navy'
                      }`}
                    >
                      <span className="block text-[9px] font-extrabold uppercase opacity-70">{formatWeekday(day)}</span>
                      <span className="mt-1 block text-sm font-extrabold">{new Date(`${day}T00:00:00.000Z`).getUTCDate()}</span>
                      <span className="mt-2 flex min-h-2 items-center justify-center gap-0.5">
                        {dayItems.slice(0, 3).map(item => {
                          const color = getChildColorClasses(item.childIds[0] || 'family');
                          return <span key={item.occurrenceId} className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : color.marker}`} />;
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Семейное событие" icon={<Plus size={18} />}>
              {familyCalendarError && (
                <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                  Серверный календарь временно недоступен: {familyCalendarError}
                </div>
              )}
              <FormField label="Название">
                <input value={familyEventTitle} onChange={e => setFamilyEventTitle(e.target.value)} placeholder="Например, логопед или документы" className={inputClass} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Ребенок">
                  <select value={familyEventChildId} onChange={e => setFamilyEventChildId(e.target.value)} className={inputClass}>
                    <option value="all">Вся семья</option>
                    {profiles.map(child => <option key={child.id} value={child.id}>{child.childName}</option>)}
                  </select>
                </FormField>
                <FormField label="Тип">
                  <select value={familyEventType} onChange={e => setFamilyEventType(e.target.value as FamilyEventType)} className={inputClass}>
                    <option value="family">Семья</option>
                    <option value="therapy">Терапия</option>
                    <option value="school">Школа</option>
                    <option value="documents">Документы</option>
                    <option value="home">Дом</option>
                    <option value="appointment">Визит</option>
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Дата и время">
                  <input type="datetime-local" value={familyEventStartsAt} onChange={e => setFamilyEventStartsAt(e.target.value)} className={inputClass} />
                </FormField>
                <FormField label="Повтор">
                  <select value={familyEventRepeat} onChange={e => setFamilyEventRepeat(e.target.value as typeof familyEventRepeat)} className={inputClass}>
                    <option value="none">Нет</option>
                    <option value="daily">Каждый день</option>
                    <option value="weekly">Каждую неделю</option>
                    <option value="monthly">Каждый месяц</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Напоминание за минут">
                <input inputMode="numeric" value={familyEventNotifyMinutes} onChange={e => setFamilyEventNotifyMinutes(e.target.value)} className={inputClass} />
              </FormField>
              <FormField label="Заметка">
                <textarea value={familyEventDescription} onChange={e => setFamilyEventDescription(e.target.value)} placeholder="Что взять, куда идти, кому позвонить" className={`${inputClass} min-h-20 resize-none`} />
              </FormField>
              <button
                type="button"
                onClick={handleAddFamilyEvent}
                disabled={familyEventSaving || isFamilyCalendarLoading}
                className="mt-2 w-full rounded-2xl bg-opora-navy px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
              >
                {familyEventSaving ? 'Сохраняем...' : 'Сохранить в общий календарь'}
              </button>
            </Panel>

            <Panel title={formatAgendaTitle(selectedCalendarDate)} icon={<Clock size={18} />}>
              {selectedDaySchedule.length ? (
                <div className="space-y-3">
                  {selectedDaySchedule.map(occurrence => (
                    <FamilyCalendarCard
                      key={occurrence.occurrenceId}
                      occurrence={occurrence}
                      childNamesById={childNamesById}
                      onComplete={occurrence.source === 'manual' && occurrence.occurrenceStatus === 'scheduled'
                        ? () => completeCalendarOccurrence(occurrence.id, occurrence.occurrenceDate)
                        : undefined}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState text="На выбранный день нет лекарств, визитов, очередей или задач." />
              )}
            </Panel>
          </section>
        )}

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
                      <div key={item.id} className="rounded-2xl border border-opora-sage/15 bg-white px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-opora-navy">{item.planName}</p>
                            <p className="text-xs text-opora-text">{formatTime(item.plannedAt)} · {item.doseText}</p>
                            {'foodRelation' in item && <p className="mt-1 text-[11px] font-bold text-opora-sage">{item.foodRelation}</p>}
                          </div>
                          <StatusPill status={status} />
                        </div>
                        {plan && !savedEvent && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => handleRecordMedication(plan, item.plannedAt, 'taken')} className="rounded-xl bg-opora-sage px-3 py-2 text-xs font-extrabold text-white">
                              Принято
                            </button>
                            <button type="button" onClick={() => handleRecordMedication(plan, item.plannedAt, 'skipped')} className="rounded-xl bg-opora-sand px-3 py-2 text-xs font-extrabold text-opora-navy">
                              Пропущено
                            </button>
                          </div>
                        )}
                        {savedEvent && (
                          <button type="button" onClick={() => deleteMedicationEvent(savedEvent.id)} className="mt-2 flex items-center gap-1 text-[11px] font-bold text-opora-text">
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
          <section className="space-y-4">
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
              <button type="button" onClick={handleAddPlan} className="mt-2 w-full rounded-2xl bg-opora-navy px-4 py-3 text-sm font-extrabold text-white">
                Сохранить расписание
              </button>
            </Panel>

            <Panel title="Активные назначения" icon={<BellRing size={18} />}>
              {childPlans.length ? childPlans.map(plan => (
                <ListCard key={plan.id} title={plan.name} subtitle={`${plan.doseText} · ${plan.scheduleText}`} onDelete={() => deleteMedicationPlan(plan.id)}>
                  <p className="text-xs text-opora-text">Связь с едой: {plan.foodRelation || 'не указана'}</p>
                  <p className="text-xs text-opora-text">Окно приема: {plan.reminderWindowMinutes} мин · повтор через {plan.repeatEveryMinutes} мин</p>
                </ListCard>
              )) : <EmptyState text="Пока нет активных назначений для выбранного ребенка." />}
            </Panel>
          </section>
        )}

        {view === 'food' && (
          <section className="space-y-4">
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
              <button type="button" onClick={handleAddDietRule} className="mt-2 w-full rounded-2xl bg-opora-navy px-4 py-3 text-sm font-extrabold text-white">
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
              <button type="button" onClick={handleAddFoodLog} className="mt-2 w-full rounded-2xl bg-opora-sage px-4 py-3 text-sm font-extrabold text-white">
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
                <FormField label="Возможная связь">
                  <input value={reactionTrigger} onChange={e => setReactionTrigger(e.target.value)} placeholder="новый продукт" className={inputClass} />
                </FormField>
              </div>
              <button type="button" onClick={handleAddReactionLog} className="mt-2 w-full rounded-2xl bg-opora-navy px-4 py-3 text-sm font-extrabold text-white">
                Записать реакцию
              </button>
            </Panel>

            <Panel title="Активные ограничения" icon={<Salad size={18} />}>
              {childDietRules.length ? childDietRules.map(rule => (
                <ListCard key={rule.id} title={rule.title} subtitle={ruleTypeLabels[rule.type]} onDelete={() => deleteDietRule(rule.id)}>
                  <p className="text-xs text-opora-text">{rule.details}</p>
                </ListCard>
              )) : <EmptyState text="Диетические ограничения пока не указаны." />}
            </Panel>
          </section>
        )}

        {view === 'report' && (
          <section className="space-y-4">
            <Panel title="Отчет врачу" icon={<FileText size={18} />}>
              <p className="mb-3 text-xs leading-relaxed text-opora-text">
                Отчет собирает последние записи выбранного ребенка. Его можно скопировать и отправить врачу перед приемом.
              </p>
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-opora-sand/70 p-4 text-xs leading-relaxed text-opora-navy">
                {reportText}
              </pre>
              <button type="button" onClick={handleCopyReport} className="mt-3 w-full rounded-2xl bg-opora-navy px-4 py-3 text-sm font-extrabold text-white">
                {reportCopied ? 'Скопировано' : 'Скопировать отчет'}
              </button>
            </Panel>

            <Panel title="Последние записи" icon={<ClipboardList size={18} />}>
              {[...childFoodLogs.slice(0, 3), ...childReactionLogs.slice(0, 3)].length ? (
                <div className="space-y-2">
                  {childFoodLogs.slice(0, 3).map(log => (
                    <ListCard key={log.id} title={log.foodText} subtitle={formatTime(log.eatenAt)} onDelete={() => deleteFoodLog(log.id)}>
                      <p className="text-xs text-opora-text">{[log.texture, log.reaction].filter(Boolean).join(' · ') || 'Без реакции'}</p>
                    </ListCard>
                  ))}
                  {childReactionLogs.slice(0, 3).map(log => (
                    <ListCard key={log.id} title={log.title} subtitle={`${formatTime(log.happenedAt)} · ${log.intensity}/5`} onDelete={() => deleteReactionLog(log.id)}>
                      <p className="text-xs text-opora-text">{log.possibleTrigger || 'Связь не указана'}</p>
                    </ListCard>
                  ))}
                </div>
              ) : <EmptyState text="Пока нет записей питания или реакций." />}
            </Panel>
          </section>
        )}

        {view === 'queues' && (
          <section className="space-y-4">
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
              <button type="button" onClick={handleAddQueueRecord} className="mt-2 w-full rounded-2xl bg-opora-navy px-4 py-3 text-sm font-extrabold text-white">
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
                      <div key={record.id} className="rounded-2xl border border-opora-sage/15 bg-white px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-extrabold text-opora-navy">{record.serviceTitle}</p>
                            <p className="text-xs font-bold text-opora-sage">{record.institutionName}</p>
                            {record.appointmentAt && <p className="mt-1 text-xs text-opora-text">{formatDateTime(record.appointmentAt)}</p>}
                          </div>
                          <QueueStatusPill status={status} />
                        </div>
                        {reminder && (
                          <div className="mt-3 rounded-xl bg-opora-sage/10 px-3 py-2 text-xs font-extrabold text-opora-sage">
                            {reminder.message}
                          </div>
                        )}
                        {(record.queueNumber || record.currentQueueNumber) && (
                          <p className="mt-3 text-xs text-opora-text">
                            Очередь: {record.currentQueueNumber || 'неизвестно'} из {record.queueNumber || 'не указано'}
                          </p>
                        )}
                        {record.note && <p className="mt-2 text-xs leading-relaxed text-opora-text">{record.note}</p>}
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <a
                            href={record.institutionAddress ? buildMapsRouteUrl(record.institutionAddress) : undefined}
                            target="_blank"
                            rel="noreferrer"
                            aria-disabled={!record.institutionAddress}
                            className={`flex min-h-10 items-center justify-center rounded-xl px-2 text-[11px] font-extrabold ${
                              record.institutionAddress ? 'bg-opora-sage text-white' : 'pointer-events-none bg-opora-sand text-opora-text/50'
                            }`}
                          >
                            <Route size={14} className="mr-1" /> Маршрут
                          </a>
                          <button
                            type="button"
                            onClick={() => updateGovernmentQueueRecord(record.id, { status: 'completed' })}
                            className="flex min-h-10 items-center justify-center rounded-xl bg-opora-sand px-2 text-[11px] font-extrabold text-opora-navy"
                          >
                            <CheckCircle2 size={14} className="mr-1" /> Готово
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGovernmentQueueRecord(record.id)}
                            className="flex min-h-10 items-center justify-center rounded-xl bg-rose-50 px-2 text-[11px] font-extrabold text-rose-700"
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

const inputClass = 'w-full rounded-2xl border border-opora-sage/20 bg-white px-3 py-2.5 text-sm font-semibold text-opora-navy outline-none focus:border-opora-sage';

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-opora-navy">
        <span className="rounded-xl bg-opora-sage/10 p-2 text-opora-sage">{icon}</span>
        <h2 className="text-sm font-extrabold">{title}</h2>
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
    <div className={`rounded-2xl border border-opora-sage/15 border-l-4 bg-white px-4 py-3 ${primaryColor.line}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-extrabold text-opora-navy">{occurrence.title}</p>
          <p className="mt-1 text-xs font-bold text-opora-sage">
            {occurrence.allDay ? 'Весь день' : formatTime(occurrence.occurrenceStartsAt)}
            {occurrence.occurrenceEndsAt ? `-${formatTime(occurrence.occurrenceEndsAt)}` : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-opora-sand px-2.5 py-1 text-[10px] font-extrabold text-opora-navy">
          {eventSourceLabels[occurrence.source]}
        </span>
      </div>
      {occurrence.description && <p className="mt-2 text-xs leading-relaxed text-opora-text">{occurrence.description}</p>}
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
          <span className="inline-flex items-center rounded-full border border-opora-sage/10 bg-opora-sand px-2.5 py-1 text-[10px] font-extrabold text-opora-navy">
            Вся семья
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-opora-text">
          {occurrence.recurrenceLabel ? `${occurrence.recurrenceLabel} · ` : ''}Напоминания на сервере
        </span>
        {onComplete && (
          <button type="button" onClick={onComplete} className="rounded-xl bg-opora-sage px-3 py-2 text-[11px] font-extrabold text-white">
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
      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-opora-text">{label}</span>
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
        <div key={label} className="rounded-2xl bg-white/80 px-2 py-3 text-center shadow-sm">
          <p className="text-lg font-extrabold text-opora-navy">{value}</p>
          <p className="text-[10px] font-bold text-opora-text">{label}</p>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof getMedicationEventStatus> }) {
  const config = {
    planned: ['Запланировано', 'bg-opora-sand text-opora-navy'],
    on_time: ['Вовремя', 'bg-emerald-100 text-emerald-800'],
    late: ['Поздно', 'bg-amber-100 text-amber-800'],
    skipped: ['Пропущено', 'bg-rose-100 text-rose-800']
  }[status];
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${config[1]}`}>{config[0]}</span>;
}

function QueueStatusPill({ status }: { status: GovernmentQueueStatus }) {
  const config = {
    waiting: ['Ожидаем', 'bg-opora-sand text-opora-navy'],
    soon: ['Скоро', 'bg-amber-100 text-amber-800'],
    ready: ['Подошла', 'bg-emerald-100 text-emerald-800'],
    completed: ['Готово', 'bg-slate-100 text-slate-700'],
    cancelled: ['Отменено', 'bg-rose-100 text-rose-800']
  }[status];
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${config[1]}`}>{config[0]}</span>;
}

function ListCard({ title, subtitle, children, onDelete }: { title: string; subtitle: string; children?: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="mb-2 rounded-2xl border border-opora-sage/15 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-extrabold text-opora-navy">{title}</p>
          <p className="text-xs font-bold text-opora-sage">{subtitle}</p>
        </div>
        <button type="button" onClick={onDelete} className="shrink-0 rounded-xl bg-opora-sand p-2 text-opora-text">
          <Trash2 size={15} />
        </button>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-opora-sand/60 px-4 py-4 text-center text-xs font-bold leading-relaxed text-opora-text">
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
