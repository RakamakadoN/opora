import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useProfile, DiagnosticStatus } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { profile, updateProfile, completeOnboarding } = useProfile();
  const { user, logout } = useAuth();
  
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState(profile.childName);
  const [childAge, setChildAge] = useState(profile.childAge);
  const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus>(profile.diagnosticStatus);

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      updateProfile({
        childName: childName || "Алишер",
        childAge: childAge || 3,
        diagnosticStatus: diagnosticStatus
      });
      completeOnboarding();
      onComplete();
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const selectStatusOption = (status: DiagnosticStatus) => {
    setDiagnosticStatus(status);
    nextStep();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-0 animate-fade-in sm:p-4">
      <div className="opora-device-frame opora-shell opora-mobile-shell relative flex w-full max-w-none flex-col overflow-hidden font-sans sm:h-[844px] sm:max-w-[410px] sm:rounded-[2rem] sm:border sm:border-white/70">
        <div className="opora-onboarding-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        
        {/* Progress Bar & Back button */}
        <div className="flex items-center justify-between pt-2 sm:pt-6">
          {step > 0 ? (
            <button 
              onClick={prevStep} 
            className="rounded-lg p-2 text-opora-navy transition-colors hover:bg-black/5"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="h-8 w-8"></div>
          )}
          
          <div className="flex min-w-0 gap-1.5">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === step ? 'w-7 bg-opora-navy' : 'w-2.5 bg-opora-sage/25'
                }`}
              />
            ))}
          </div>
          <div className="h-8 w-8"></div>
        </div>

        {user && (
          <div className="mt-3 rounded-2xl border border-opora-sage/15 bg-white/75 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-opora-sage">Вы вошли</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-opora-navy">{user.fullName}</p>
                <p className="truncate text-xs text-opora-text">{user.email}</p>
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
        )}

        {/* Content Area */}
        <div className="flex min-w-0 flex-1 flex-col justify-center py-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="min-w-0 space-y-4"
              >
                <div className="bg-opora-peach/70 p-4 rounded-lg w-fit border border-white/50 shadow-sm">
                  <Sparkles className="text-opora-navy" size={28} />
                </div>
                <h1 className="font-serif text-[32px] font-semibold text-opora-navy leading-tight">
                  Добро пожаловать в "Опору"
                </h1>
                <p className="text-opora-text text-[15px] leading-relaxed">
                  Мы создали это пространство, чтобы вы не оставались один на один с тревогой. Здесь путь разбит на понятные шаги, а рядом всегда есть бережная поддержка.
                </p>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="min-w-0 space-y-5"
              >
                <h2 className="font-serif text-[26px] font-semibold text-opora-navy leading-tight">
                  Познакомимся поближе
                </h2>
                <p className="text-sm text-opora-text leading-relaxed">
                  Мы адаптируем контент, терапевтические чек-листы и рекомендации под вашего ребенка. Это останется полностью конфиденциальным.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-opora-navy mb-1.5">Имя ребенка</label>
                    <input 
                      type="text" 
                      value={childName}
                      onChange={e => setChildName(e.target.value)}
                      placeholder="Например, Алишер"
                      className="w-full bg-white border border-black/5 rounded-xl px-4 py-3 text-base text-opora-navy focus:outline-none focus:border-opora-sage placeholder:text-black/25 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-opora-navy mb-1.5">Возраст ребенка (в годах)</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[2, 3, 4, 5, 6].map(age => (
                        <button
                          key={age}
                          type="button"
                          onClick={() => setChildAge(age)}
                          className={`py-2 rounded-lg text-base font-bold border transition-all ${
                            childAge === age 
                              ? 'bg-opora-navy text-white border-opora-navy' 
                              : 'bg-white text-opora-navy border-black/5 hover:border-opora-sage/40'
                          }`}
                        >
                          {age}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-opora-text">Другой возраст:</span>
                      <input 
                        type="number" 
                        min={0}
                        max={18}
                        value={childAge}
                        onChange={e => setChildAge(Number(e.target.value))}
                        className="w-16 text-center bg-white border border-black/5 rounded-lg px-2 py-1 text-sm text-opora-navy font-bold focus:outline-none focus:border-opora-sage"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="min-w-0 space-y-5"
              >
                <h2 className="font-serif text-[26px] font-semibold text-opora-navy leading-tight">
                  На каком этапе вы сейчас находитесь?
                </h2>
                <p className="text-sm text-opora-text leading-relaxed">
                  Это поможет нам предложить наиболее актуальные пошаговые материалы.
                </p>
                
                <div className="space-y-3">
                  {[
                    { label: "Только подозреваем аутизм", status: "Только подозреваем" },
                    { label: "В процессе диагностики у врачей", status: "В процессе диагностики" },
                    { label: "Диагноз официально подтвержден", status: "Диагноз подтвержден" },
                    { label: "Подбираем адаптацию и терапию", status: "Проходим адаптацию и подбор терапии" }
                  ].map((option, idx) => (
                    <button 
                      key={idx}
                      onClick={() => selectStatusOption(option.status as DiagnosticStatus)}
                      className="w-full text-left p-4 bg-white rounded-lg border border-black/5 hover:border-opora-sage/50 transition-colors shadow-sm text-opora-navy active:bg-opora-sand text-base font-bold"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3_ethics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="min-w-0 space-y-5"
              >
                <div className="bg-white p-3 rounded-lg w-fit mb-2 shadow-sm border border-opora-sage/10">
                  <span className="text-opora-navy font-serif font-bold text-lg">Наши принципы</span>
                </div>
                <h2 className="font-serif text-[26px] font-semibold text-opora-navy leading-tight">
                  Этика и Безопасность
                </h2>
                <p className="text-sm text-opora-text leading-relaxed">
                  Мы создаем атмосферу полного доверия. Технологии — инструмент, ответственность — общая.
                </p>
                
                <div className="space-y-3.5 mt-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-opora-sage mt-1.5 shrink-0" />
                      <div className="min-w-0">
                      <p className="text-sm font-semibold text-opora-navy">AI не ставит диагнозы</p>
                      <p className="text-xs text-opora-text/80 leading-relaxed mt-0.5">Приложение не заменяет врачей. Наш помощник объясняет термины и помогает ориентироваться.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-opora-sage mt-1.5 shrink-0" />
                      <div className="min-w-0">
                      <p className="text-sm font-semibold text-opora-navy">Совместные решения</p>
                      <p className="text-xs text-opora-text/80 leading-relaxed mt-0.5">Все решения о терапии должны приниматься исключительно совместно с вашим лечащим специалистом.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-opora-sage mt-1.5 shrink-0" />
                      <div className="min-w-0">
                      <p className="text-sm font-semibold text-opora-navy">Полный контроль данных</p>
                      <p className="text-xs text-opora-text/80 leading-relaxed mt-0.5">Ваши данные принадлежат только вам. Видео и фото не используются и не хранятся без вашего явного согласия.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="min-w-0 space-y-4"
              >
                <h2 className="font-serif text-[26px] font-semibold text-opora-navy leading-tight">
                  Мы с вами.
                </h2>
                <p className="text-opora-text text-base leading-relaxed">
                  В приложении вас ждут пошаговые навигаторы по правам Казахстана и СНГ, умный чат-поддержка, подбор центров и бережная атмосфера.
                </p>
                <div className="bg-white p-5 rounded-lg border border-opora-sage/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles size={64} />
                  </div>
                  <h3 className="mb-2 flex min-w-0 items-center gap-2 text-base font-medium text-opora-navy">
                    <div className="w-2 h-2 rounded-full bg-opora-sage"></div>
                    AI-Спутник готов к работе
                  </h3>
                  <p className="text-sm text-opora-text leading-relaxed">
                    Он умеет объяснять любые термины простым языком, переводить заумные словари врачей и подсказывать мягкие форматы развивающих занятий.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Action */}
        <div className="pb-4">
          {step !== 2 && (
            <button 
              onClick={nextStep}
              className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-opora-navy px-5 py-4 font-bold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98]"
            >
              <span>{step === 0 ? "Начать" : step === 4 ? "Перейти к Навигатору" : "Продолжить"}</span>
              <ArrowRight size={20} />
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
