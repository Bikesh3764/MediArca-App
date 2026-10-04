import React, { useState, useEffect, useCallback } from 'react';
import {
  api,
  DoctorSlot,
  calculateSlotMetrics,
  format12Hour,
  DoctorAffiliationClinic,
  parseDoctorSlots,
  timeToMinutes,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AppleButton } from '../../components/ui/AppleButton';
import {
  Clock,
  IndianRupee,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Building2,
  Sparkles,
  Users,
  Calendar,
  MapPin,
  Phone,
  Timer,
  Info,
} from 'lucide-react';

interface ManageScheduleScreenProps {
  onBack: () => void;
  initialClinicId?: string;
  onNavigateToAffiliations?: () => void;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_INDEX_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const FEE_PRESETS = [300, 500, 700, 1000, 1500];

export const ManageScheduleScreen: React.FC<ManageScheduleScreenProps> = ({
  onBack,
  initialClinicId,
  onNavigateToAffiliations,
}) => {
  const { user, refreshUser } = useAuth();

  const [clinics, setClinics] = useState<DoctorAffiliationClinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>(initialClinicId || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [workingDays, setWorkingDays] = useState<string[]>([
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ]);

  const [slots, setSlots] = useState<DoctorSlot[]>([
    {
      id: 'slot_1',
      name: 'Morning Shift',
      startTime: '09:00',
      endTime: '13:00',
      maxPatients: 25,
      avgConsultationMinutes: 20,
    },
  ]);

  const [consultationFee, setConsultationFee] = useState<number>(500);

  const syncClinicData = useCallback(
    (clinic: DoctorAffiliationClinic) => {
      if (clinic.slots && clinic.slots.length > 0) {
        setSlots(
          clinic.slots.map((s) => ({
            ...s,
            avgConsultationMinutes: Number(s.avgConsultationMinutes) || 15,
            maxPatients: Number(s.maxPatients) || 25,
          }))
        );
      } else if (user?.doctorProfile) {
        setSlots(parseDoctorSlots(user.doctorProfile));
      }

      if (clinic.workingDays && Array.isArray(clinic.workingDays) && clinic.workingDays.length > 0) {
        setWorkingDays(clinic.workingDays);
      } else if (clinic.daysOfWeek && Array.isArray(clinic.daysOfWeek) && clinic.daysOfWeek.length > 0) {
        const mapped = clinic.daysOfWeek.map((idx: number) => {
          const found = Object.entries(DAY_INDEX_MAP).find(([, val]) => val === idx);
          return found ? found[0] : 'Mon';
        });
        setWorkingDays(mapped);
      } else {
        setWorkingDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
      }

      setConsultationFee(clinic.consultationFee ?? user?.doctorProfile?.consultationFee ?? 500);
      setError(null);
      setSuccessMsg(null);
    },
    [user]
  );

  const loadDoctorAffiliations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDoctorAffiliations();
      const activeClinics = res.success && res.data?.clinics ? res.data.clinics : [];
      setClinics(activeClinics);

      let targetClinic: DoctorAffiliationClinic | undefined;

      if (initialClinicId && activeClinics.some((c) => c.clinicId === initialClinicId)) {
        targetClinic = activeClinics.find((c) => c.clinicId === initialClinicId);
        setSelectedClinicId(initialClinicId);
      } else if (activeClinics.length > 0) {
        targetClinic = activeClinics[0];
        setSelectedClinicId(activeClinics[0].clinicId);
      }

      if (targetClinic) {
        syncClinicData(targetClinic);
      } else if (user?.doctorProfile) {
        setSlots(parseDoctorSlots(user.doctorProfile));
        setConsultationFee(user.doctorProfile.consultationFee || 500);
      }
    } catch {
      if (user?.doctorProfile) {
        setSlots(parseDoctorSlots(user.doctorProfile));
        setConsultationFee(user.doctorProfile.consultationFee || 500);
      }
    } finally {
      setLoading(false);
    }
  }, [initialClinicId, syncClinicData, user]);

  useEffect(() => {
    loadDoctorAffiliations();
  }, [loadDoctorAffiliations]);

  const selectedClinic = clinics.find((c) => c.clinicId === selectedClinicId);

  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    const matched = clinics.find((c) => c.clinicId === clinicId);
    if (matched) {
      syncClinicData(matched);
    }
  };

  const handleSlotChange = (index: number, field: keyof DoctorSlot, value: any) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAutoPace = (index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const slot = next[index];
      const { avgConsultationMinutes } = calculateSlotMetrics(
        slot.startTime,
        slot.endTime,
        Number(slot.maxPatients) || 1
      );
      next[index] = { ...slot, avgConsultationMinutes };
      return next;
    });
  };

  const handleAutoCapacity = (index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const slot = next[index];
      const startMins = timeToMinutes(slot.startTime);
      let endMins = timeToMinutes(slot.endTime);
      if (endMins <= startMins) endMins += 24 * 60;
      const duration = Math.max(1, endMins - startMins);
      const pace = Math.max(1, Number(slot.avgConsultationMinutes) || 15);
      const calculatedCap = Math.max(1, Math.floor(duration / pace));
      next[index] = { ...slot, maxPatients: calculatedCap };
      return next;
    });
  };

  const handleAddSlot = () => {
    const nextIdx = slots.length + 1;
    const startTime = '16:00';
    const endTime = '20:00';
    const maxPatients = 20;
    const avgConsultationMinutes = 15;

    setSlots([
      ...slots,
      {
        id: `slot_${Date.now()}`,
        name: nextIdx === 2 ? 'Evening Shift' : `Shift ${nextIdx}`,
        startTime,
        endTime,
        maxPatients,
        avgConsultationMinutes,
      },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    if (slots.length <= 1) {
      setError('You must maintain at least one consultation shift.');
      return;
    }
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleDay = (day: string) => {
    setWorkingDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) {
          setError('Select at least one practicing day.');
          return prev;
        }
        setError(null);
        return prev.filter((d) => d !== day);
      } else {
        setError(null);
        return DAYS_OF_WEEK.filter((d) => prev.includes(d) || d === day);
      }
    });
  };

  const handleSelectPresetDays = (preset: 'all' | 'weekdays' | 'mon-sat') => {
    setError(null);
    if (preset === 'all') setWorkingDays([...DAYS_OF_WEEK]);
    else if (preset === 'weekdays') setWorkingDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    else if (preset === 'mon-sat') setWorkingDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  };

  const totalMaxDailyPatients = slots.reduce((sum, s) => sum + (Number(s.maxPatients) || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (clinics.length > 0 && !selectedClinic) {
      setError('Please select an affiliated clinic first.');
      return;
    }

    if (isNaN(Number(consultationFee)) || Number(consultationFee) < 0) {
      setError('Please enter a valid consultation fee in ₹ INR.');
      return;
    }

    if (workingDays.length === 0) {
      setError('Please select at least one practicing day of the week.');
      return;
    }

    // Validate slots
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.startTime || !s.endTime) {
        setError(`Please specify start and end times for ${s.name || `Shift ${i + 1}`}.`);
        return;
      }
      if (!s.maxPatients || s.maxPatients < 1) {
        setError(`Maximum capacity for ${s.name || `Shift ${i + 1}`} must be at least 1 patient.`);
        return;
      }
      if (!s.avgConsultationMinutes || s.avgConsultationMinutes < 1) {
        setError(`Average duration for ${s.name || `Shift ${i + 1}`} must be at least 1 minute.`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        clinicId: selectedClinic ? selectedClinic.clinicId : undefined,
        consultationFee: Number(consultationFee),
        workingDays,
        daysOfWeek: workingDays.map((d) => DAY_INDEX_MAP[d] ?? 1),
        slots: slots.map((s) => ({
          ...s,
          days: workingDays,
          maxPatients: Number(s.maxPatients),
          avgConsultationMinutes: Number(s.avgConsultationMinutes),
        })),
      };

      const res = await api.updateDoctorSchedule(payload);
      if (res.success) {
        await refreshUser();
        setSuccessMsg(
          selectedClinic
            ? `Schedule and fee (₹${consultationFee}) updated for ${selectedClinic.clinicName}.`
            : `Schedule and fee (₹${consultationFee}) saved successfully.`
        );

        if (selectedClinic) {
          setClinics((prev) =>
            prev.map((c) =>
              c.clinicId === selectedClinic.clinicId
                ? {
                    ...c,
                    slots,
                    consultationFee: Number(consultationFee),
                    workingDays,
                    daysOfWeek: workingDays.map((d) => DAY_INDEX_MAP[d] ?? 1),
                  }
                : c
            )
          );
        }
      } else {
        setError(res.message || 'Failed to update schedule');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24 text-[#1d1d1f]">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#e5e5ea] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Console</span>
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm text-[#1d1d1f] tracking-tight">Shift Schedules & Fees</h1>
            {selectedClinic && (
              <p className="text-[10px] text-[#86868b] truncate max-w-[200px]">
                {selectedClinic.clinicName}
              </p>
            )}
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Banner Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1 font-medium">{error}</span>
            <button type="button" onClick={() => setError(null)} className="p-1 text-rose-600 hover:text-rose-800">
              <span className="text-sm font-bold">×</span>
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1 font-medium">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)} className="p-1 text-emerald-600 hover:text-emerald-800">
              <span className="text-sm font-bold">×</span>
            </button>
          </div>
        )}

        {/* Warning if No Affiliated Clinics Exist */}
        {!loading && clinics.length === 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-2.5 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-amber-950">
                  Clinic Affiliation Recommended
                </h4>
                <p className="text-amber-800/90 leading-relaxed text-[11px]">
                  You are not yet linked to an active clinic facility. To accept online patient bookings and issue tokens, affiliate with a verified clinic partner.
                </p>
              </div>
            </div>

            {onNavigateToAffiliations && (
              <div className="pt-0.5">
                <AppleButton
                  variant="primary"
                  size="sm"
                  onClick={onNavigateToAffiliations}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs w-full sm:w-auto"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1" />
                  <span>Affiliate with a Clinic</span>
                </AppleButton>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-[#86868b] bg-white rounded-2xl border border-[#e5e5ea]">
            Loading shift schedules...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Facility Selector Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5 uppercase tracking-wide">
                  <Building2 className="w-3.5 h-3.5 text-[#0066cc]" />
                  <span>Practicing Facility</span>
                </label>
                {clinics.length > 1 && (
                  <span className="text-[11px] font-semibold text-[#0066cc]">
                    {clinics.length} Facilities
                  </span>
                )}
              </div>

              {clinics.length > 1 ? (
                <div className="relative">
                  <select
                    value={selectedClinicId}
                    onChange={(e) => handleClinicChange(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#e5e5ea] text-xs font-semibold bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:border-[#0066cc] cursor-pointer appearance-none transition-all"
                  >
                    {clinics.map((c) => (
                      <option key={c.clinicId} value={c.clinicId}>
                        {c.clinicName} ({c.city || 'Clinical Unit'})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868b] text-xs">
                    ▼
                  </div>
                </div>
              ) : (
                <div className="text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] flex items-center justify-between">
                  <span className="font-bold truncate">
                    {selectedClinic ? selectedClinic.clinicName : 'Independent Practice / Direct Consultations'}
                  </span>
                  {selectedClinic?.city && (
                    <span className="text-[#86868b] shrink-0 text-[11px] ml-2">{selectedClinic.city}</span>
                  )}
                </div>
              )}

              {selectedClinic && (
                <div className="pt-2 border-t border-[#f5f5f7] text-[11px] text-[#86868b] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-[#0066cc] shrink-0" />
                    <span className="truncate">{selectedClinic.address}{selectedClinic.city ? `, ${selectedClinic.city}` : ''}</span>
                  </div>
                  {selectedClinic.phone && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Phone className="w-3 h-3 text-[#86868b]" />
                      <span>{selectedClinic.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Daily Capacity Overview - Clean Apple HIG Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center font-bold shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider block">
                      Daily Patient Intake
                    </span>
                    <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                      {totalMaxDailyPatients} Max Patients
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2.5 py-1 rounded-full border border-[#0066cc]/20">
                    {slots.length} Shift{slots.length > 1 ? 's' : ''} Configured
                  </span>
                  <p className="text-[10px] text-[#86868b] mt-1">
                    {workingDays.length} Active Days/Week
                  </p>
                </div>
              </div>
            </div>

            {/* Practicing Days Selector Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5 uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span>Practicing Days</span>
                  </h3>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    Select days you attend patients at this facility
                  </p>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectPresetDays('all')}
                    className="px-2 py-0.5 rounded-lg bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[10px] font-semibold text-[#1d1d1f] transition-all cursor-pointer"
                  >
                    All 7
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetDays('mon-sat')}
                    className="px-2 py-0.5 rounded-lg bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[10px] font-semibold text-[#1d1d1f] transition-all cursor-pointer"
                  >
                    Mon–Sat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetDays('weekdays')}
                    className="px-2 py-0.5 rounded-lg bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[10px] font-semibold text-[#1d1d1f] transition-all cursor-pointer"
                  >
                    Mon–Fri
                  </button>
                </div>
              </div>

              {/* 7 Day Buttons */}
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`h-10 rounded-xl text-xs font-bold transition-all text-center select-none active:scale-95 cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#0066cc] text-white shadow-xs'
                          : 'bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#86868b] border border-[#e5e5ea]'
                      }`}
                    >
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-[#86868b] pt-0.5 flex items-center justify-between">
                <span>
                  Active: <strong className="text-[#0066cc]">{workingDays.length} days/week</strong>
                </span>
                <span className="text-[10px] text-[#86868b]">
                  {workingDays.join(', ')}
                </span>
              </div>
            </div>

            {/* Shifts Builder */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5 uppercase tracking-wide">
                    <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span>Consultation Shifts</span>
                  </h3>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    Shift timings, consultation pace, and token quota
                  </p>
                </div>

                <AppleButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSlot}
                  className="flex items-center gap-1 text-xs py-1 px-3 text-[#0066cc] border-[#0066cc]/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Shift</span>
                </AppleButton>
              </div>

              <div className="space-y-3.5">
                {slots.map((slot, idx) => {
                  const { durationMinutes } = calculateSlotMetrics(
                    slot.startTime,
                    slot.endTime,
                    slot.maxPatients
                  );
                  const durationHours = (durationMinutes / 60).toFixed(1).replace('.0', '');

                  return (
                    <div
                      key={slot.id || idx}
                      className="p-4 rounded-2xl bg-[#fafafc] border border-[#e5e5ea] space-y-3.5 hover:border-[#0066cc]/40 transition-all shadow-2xs"
                    >
                      {/* Shift Header */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#e5e5ea]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#0066cc] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={slot.name}
                            onChange={(e) => handleSlotChange(idx, 'name', e.target.value)}
                            placeholder="e.g. Morning Shift"
                            className="text-xs font-bold text-[#1d1d1f] bg-transparent focus:outline-none focus:border-b focus:border-[#0066cc] px-1 py-0.5 flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2.5 py-0.5 rounded-full border border-[#0066cc]/20">
                            {format12Hour(slot.startTime)} – {format12Hour(slot.endTime)}
                          </span>

                          {slots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Remove shift"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Working Hours: Spacious 2-Column Time Inputs */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-[#1d1d1f] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#86868b]" />
                            <span>Working Hours</span>
                          </span>
                          <span className="text-[10px] font-semibold text-[#86868b]">
                            {durationHours} Hours Total ({durationMinutes} mins)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-medium text-[#86868b] mb-1">
                              Start Time
                            </label>
                            <input
                              type="time"
                              required
                              value={slot.startTime}
                              onChange={(e) => handleSlotChange(idx, 'startTime', e.target.value)}
                              className="w-full h-11 px-3 rounded-xl border border-[#e5e5ea] bg-white text-sm font-semibold text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium text-[#86868b] mb-1">
                              End Time
                            </label>
                            <input
                              type="time"
                              required
                              value={slot.endTime}
                              onChange={(e) => handleSlotChange(idx, 'endTime', e.target.value)}
                              className="w-full h-11 px-3 rounded-xl border border-[#e5e5ea] bg-white text-sm font-semibold text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Consultation Pace & Patient Quota: Spacious 2-Column Grid */}
                      <div className="pt-2 border-t border-[#e5e5ea]">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] font-medium text-[#86868b]">
                                Avg Time / Patient
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAutoPace(idx)}
                                className="text-[10px] font-bold text-[#0066cc] hover:underline flex items-center gap-0.5 cursor-pointer"
                                title="Auto-calculate pace based on quota"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Auto</span>
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                min={1}
                                max={180}
                                required
                                value={slot.avgConsultationMinutes || ''}
                                onChange={(e) =>
                                  handleSlotChange(
                                    idx,
                                    'avgConsultationMinutes',
                                    e.target.value === '' ? '' : Math.max(1, Number(e.target.value))
                                  )
                                }
                                placeholder="20"
                                className="w-full h-11 pl-3 pr-10 rounded-xl border border-[#e5e5ea] bg-white text-sm font-bold text-[#0066cc] focus:outline-none focus:border-[#0066cc] transition-all"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#86868b] pointer-events-none">
                                mins
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] font-medium text-[#86868b]">
                                Max Patients Quota
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAutoCapacity(idx)}
                                className="text-[10px] font-bold text-[#0066cc] hover:underline flex items-center gap-0.5 cursor-pointer"
                                title="Auto-calculate quota based on pace"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Auto</span>
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                min={1}
                                max={300}
                                required
                                value={slot.maxPatients || ''}
                                onChange={(e) =>
                                  handleSlotChange(
                                    idx,
                                    'maxPatients',
                                    e.target.value === '' ? '' : Math.max(1, Number(e.target.value))
                                  )
                                }
                                placeholder="25"
                                className="w-full h-11 pl-3 pr-10 rounded-xl border border-[#e5e5ea] bg-white text-sm font-bold text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] transition-all"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#86868b] pointer-events-none">
                                pts
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Shift Metric Summary */}
                      <div className="pt-2 border-t border-[#e5e5ea] flex items-center justify-between text-[11px] text-[#86868b]">
                        <span>
                          Pace: <strong className="text-[#0066cc]">~{slot.avgConsultationMinutes || 15}m</strong> per patient
                        </span>
                        <span>
                          Capacity: <strong className="text-[#1d1d1f]">{slot.maxPatients} Tokens</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consultation Fee Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#f5f5f7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wide">
                      Consultation Fee
                    </h3>
                    <p className="text-[11px] text-[#86868b]">
                      Charged to patients booking at {selectedClinic ? selectedClinic.clinicName : 'this facility'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold text-emerald-700">
                    ₹{consultationFee || 0}
                  </span>
                </div>
              </div>

              {/* Preset Fee Chips */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868b] mb-1.5">
                  Quick Amount Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEE_PRESETS.map((fee) => {
                    const isSelected = consultationFee === fee;
                    return (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setConsultationFee(fee)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] border border-[#e5e5ea]'
                        }`}
                      >
                        ₹{fee}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Fee Input */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868b] mb-1.5">
                  Custom Fee Amount (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1d1d1f]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    required
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    placeholder="500"
                    className="w-full h-11 pl-8 pr-4 rounded-xl border border-[#e5e5ea] text-sm font-bold bg-[#fafafc] text-[#1d1d1f] focus:bg-white focus:outline-none focus:border-[#0066cc] transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#86868b] mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-[#86868b] shrink-0" />
                  <span>
                    Tokens will be booked at <strong>₹{consultationFee || 0}</strong> for your desk at this clinic.
                  </span>
                </p>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="pt-2">
              <AppleButton
                variant="primary"
                size="lg"
                type="submit"
                disabled={saving}
                className="w-full shadow-xs text-sm"
              >
                {saving
                  ? 'Saving Schedule...'
                  : selectedClinic
                  ? `Save Schedule for ${selectedClinic.clinicName} (₹${consultationFee || 0})`
                  : `Save Schedule (₹${consultationFee || 0})`}
              </AppleButton>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
