import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import { Calendar, Clock, CheckCircle2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface SlotBookingProps {
  onSlotBooked: (appointmentData: any) => void;
  onBack: () => void;
}

export const SlotBooking: React.FC<SlotBookingProps> = ({ onSlotBooked, onBack }) => {
  const { language, t } = useLanguage();
  const { activePatientId, selectedPractitionerId, selectedDepartmentId, selectedHospitalId, setActiveAppointmentId, setActiveTokenNumber } = useDemo();

  const [selectedSlot, setSelectedSlot] = useState<string>('09:15 AM');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-28');
  const [isBooking, setIsBooking] = useState<boolean>(false);

  const slots = [
    { time: '09:00 AM', status: 'ALMOST_FULL', availableCount: 1 },
    { time: '09:15 AM', status: 'AVAILABLE', availableCount: 4, isRecommended: true },
    { time: '09:30 AM', status: 'AVAILABLE', availableCount: 3 },
    { time: '09:45 AM', status: 'AVAILABLE', availableCount: 5 },
    { time: '10:00 AM', status: 'ALMOST_FULL', availableCount: 2 },
    { time: '10:15 AM', status: 'FULL', availableCount: 0 },
    { time: '10:30 AM', status: 'AVAILABLE', availableCount: 3 },
    { time: '10:45 AM', status: 'AVAILABLE', availableCount: 4 }
  ];

  const handleBookAppointment = async () => {
    setIsBooking(true);
    try {
      const res = await api.createAppointment({
        patientId: activePatientId,
        practitionerId: selectedPractitionerId,
        departmentId: selectedDepartmentId,
        hospitalId: selectedHospitalId,
        slotDate: selectedDate,
        slotTime: selectedSlot
      });

      if (res.appointment) {
        setActiveAppointmentId(res.appointment.id);
      }
      if (res.token) {
        setActiveTokenNumber(res.token.tokenNumber);
      }

      onSlotBooked(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'hi' ? 'पीछे जाएं' : 'Back'}
        </button>
        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-3 py-1 rounded-full">
          Step 6 of 12: Appointment Slot
        </span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="text-center max-w-lg mx-auto mb-6">
          <div className="w-12 h-12 bg-ayush-100 dark:bg-ayush-950 text-ayush-700 dark:text-ayush-400 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {t.selectSlot}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'hi' ? 'आज की तारीख के उपलब्ध ओपीडी स्लॉट चुनें।' : 'Select today\'s OPD time slot for instant token allocation.'}
          </p>
        </div>

        {/* Date Selector */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setSelectedDate('2026-08-28')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              selectedDate === '2026-08-28'
                ? 'bg-ayush-700 text-white border-ayush-700 shadow'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 border-slate-200'
            }`}
          >
            Today (28 Aug 2026) — Active OPD
          </button>
        </div>

        {/* Time Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {slots.map(slot => {
            const isSelected = selectedSlot === slot.time;
            const isFull = slot.status === 'FULL';
            return (
              <button
                key={slot.time}
                disabled={isFull}
                onClick={() => setSelectedSlot(slot.time)}
                className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                  isFull
                    ? 'border-slate-200 bg-slate-100/60 dark:bg-slate-900 text-slate-400 cursor-not-allowed opacity-60'
                    : isSelected
                    ? 'border-ayush-600 bg-ayush-50 dark:bg-ayush-950/80 ring-4 ring-ayush-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-ayush-400 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {slot.time}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-ayush-600" />}
                </div>

                <div className="mt-2 text-[10px]">
                  {isFull ? (
                    <span className="text-red-500 font-bold">Slot Full</span>
                  ) : slot.status === 'ALMOST_FULL' ? (
                    <span className="text-amber-600 font-medium">1-2 Slots left</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">Available</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirm Slot Button */}
        <button
          onClick={handleBookAppointment}
          disabled={isBooking}
          className="w-full py-4 bg-ayush-700 hover:bg-ayush-800 text-white font-extrabold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
        >
          {isBooking ? (
            <span>Generating Appointment & Token...</span>
          ) : (
            <>
              <span>{language === 'hi' ? 'स्लॉट बुक करें और केस-टेकिंग शुरू करें' : 'Confirm Slot & Start AI Case-Taking'}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
