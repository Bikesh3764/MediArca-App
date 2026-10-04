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
  Timer,
  Calendar,
  MapPin,
  Phone,
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
      name: 'Shift 1 (Morning)',
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
    const startTime = '15:00';
    const endTime = '19:00';
    const maxPatients = 25;
    const avgConsultationMinutes = 20;

    setSlots([
      ...slots,
      {
        id: `slot_${Date.now()}`,
        name: `Shift ${nextIdx} (Evening)`,
        startTime,
        endTime,
        maxPatients,
        avgConsultationMinutes,
      },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    if (slots.length <= 1) {
      setError('You must configure at least one checking shift for this clinic.');
      return;
    }
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleDay = (day: string) => {
    setWorkingDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) {
          setError('You must select at least one practicing day for this clinic.');
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
      setError('Please enter a valid consultation fee in ₹ INR (must be 0 or greater).');
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
        setError(`Please specify both start and end time for ${s.name || `Shift ${i + 1}`}.`);
        return;
      }
      if (!s.maxPatients || s.maxPatients < 1) {
        setError(`Max patient capacity for ${s.name || `Shift ${i + 1}`} must be at least 1.`);
        return;
      }
      if (!s.avgConsultationMinutes || s.avgConsultationMinutes < 1) {
        setError(`Average consultation time for ${s.name || `Shift ${i + 1}`} must be at least 1 minute.`);
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
            ? `Practice schedule & consultation fee (₹${consultationFee}) for ${selectedClinic.clinicName} updated successfully!`
            : `Independent practice schedule & consultation fee (₹${consultationFee}) updated successfully!`
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
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="font-bold text-sm text-[#1d1d1f]">Clinic Shift Schedules & Fee</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Banner Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1 font-medium">{error}</span>
            <button type="button" onClick={() => setError(null)} className="p-1">
              <span className="text-sm">×</span>
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1 font-medium">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)} className="p-1">
              <span className="text-sm">×</span>
            </button>
          </div>
        )}

        {/* Warning if No Affiliated Clinics Exist */}
        {!loading && clinics.length === 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wide">
                  Clinic Affiliation Required for Online Bookings
                </h4>
                <p className="text-amber-800/90 mt-1 leading-relaxed">
                  You are not currently linked to an active clinic facility. While you can set your base shifts and fees below, online patient bookings and live queue tokens require affiliation with at least one verified clinic partner.
                </p>
              </div>
            </div>

            {onNavigateToAffiliations && (
              <div className="pt-1">
                <AppleButton
                  variant="primary"
                  size="sm"
                  onClick={onNavigateToAffiliations}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs w-full sm:w-auto"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1" />
                  <span>Affiliate with a Clinic Now</span>
                </AppleButton>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-[#86868b] bg-white rounded-2xl border border-[#e5e5ea]">
            Loading practice shifts and clinic configuration...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Target Clinic Facility Selector */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e5ea] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5 uppercase tracking-wide">
                  <Building2 className="w-4 h-4 text-[#0066cc]" />
                  <span>Practicing Facility</span>
                </label>
                {clinics.length > 1 && (
                  <span className="text-[11px] font-semibold text-[#0066cc]">
                    {clinics.length} Facilities Available
                  </span>
                )}
              </div>

              {clinics.length > 1 ? (
                <select
                  value={selectedClinicId}
                  onChange={(e) => handleClinicChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-xs font-semibold bg-[#f5f5f7] focus:bg-white focus:outline-none focus:border-[#0066cc] cursor-pointer"
                >
                  {clinics.map((c) => (
                    <option key={c.clinicId} value={c.clinicId}>
                      {c.clinicName} ({c.city || 'Clinical Unit'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] flex items-center justify-between">
                  <span className="font-bold">
                    {selectedClinic ? selectedClinic.clinicName : 'Independent Practice / Direct Consultations'}
                  </span>
                  {selectedClinic?.city && (
                    <span className="text-[#86868b]">{selectedClinic.city}</span>
                  )}
                </div>
              )}

              {selectedClinic && (
                <div className="pt-2 border-t border-[#f5f5f7] text-[11px] text-[#86868b] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span>{selectedClinic.address}{selectedClinic.city ? `, ${selectedClinic.city}` : ''}</span>
                  </div>
                  {selectedClinic.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#86868b]" />
                      <span>{selectedClinic.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Capacity & Shift Pacing Overview Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e5ea] shadow-xs flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#0066cc] uppercase tracking-wider bg-[#0066cc]/10 px-2 py-0.5 rounded-full border border-[#0066cc]/20">
                  {selectedClinic ? selectedClinic.clinicName : 'Practice'} Capacity
                </span>
                <h3 className="text-xl font-bold text-[#1d1d1f] mt-1.5 tracking-tight">
                  {totalMaxDailyPatients} Max Daily Patients
                </h3>
                <p className="text-xs text-[#86868b] mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
                  <span>Configured across {slots.length} shift{slots.length > 1 ? 's' : ''}</span>
                </p>
              </div>

              <div className="text-right bg-[#f5f5f7] p-2.5 rounded-xl border border-[#e5e5ea]">
                <span className="text-[10px] font-semibold text-[#86868b] uppercase block">Pace Mode</span>
                <span className="text-xs font-bold text-[#0066cc] flex items-center gap-1 mt-0.5">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Doctor Paced</span>
                </span>
              </div>
            </div>

            {/* Practicing Days of the Week Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e5ea] shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f5f5f7]">
                <div>
                  <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0066cc]" />
                    <span>Practicing Days of the Week</span>
                  </h3>
                  <p className="text-[11px] text-[#86868b]">
                    Select which days you attend patients at {selectedClinic ? selectedClinic.clinicName : 'this facility'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleSelectPresetDays('all')}
                    className="px-2.5 py-1 rounded-lg bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[10px] font-semibold text-[#1d1d1f] transition-colors cursor-pointer"
                  >
                    Mon – Sun
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetDays('mon-sat')}
                    className="px-2.5 py-1 rounded-lg bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[10px] font-semibold text-[#1d1d1f] transition-colors cursor-pointer"
                  >
                    Mon – Sat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetDays('weekdays')}
                    className="px-2.5 py-1 rounded-lg bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[10px] font-semibold text-[#1d1d1f] transition-colors cursor-pointer"
                  >
                    Mon – Fri
                  </button>
                </div>
              </div>

              {/* Day Toggle Buttons */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all text-center select-none active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0066cc] text-white shadow-xs'
                          : 'bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#86868b] border border-[#e5e5ea]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#86868b] pt-1">
                <span>
                  Active: <strong className="text-[#0066cc]">{workingDays.length} day{workingDays.length > 1 ? 's' : ''} / week</strong> ({workingDays.join(', ')})
                </span>
              </div>
            </div>

            {/* Shifts Builder */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e5ea] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0066cc]" />
                    <span>Checking Shifts & Timings</span>
                  </h3>
                  <p className="text-[11px] text-[#86868b]">
                    Working hours, average consultation duration, and patient intake limit
                  </p>
                </div>

                <AppleButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSlot}
                  className="flex items-center gap-1 text-xs py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Shift</span>
                </AppleButton>
              </div>

              <div className="space-y-3">
                {slots.map((slot, idx) => {
                  const { durationMinutes } = calculateSlotMetrics(
                    slot.startTime,
                    slot.endTime,
                    slot.maxPatients
                  );

                  return (
                    <div
                      key={slot.id || idx}
                      className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3 hover:border-[#0066cc]/40 transition-all"
                    >
                      {/* Shift Header */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#e5e5ea]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={slot.name}
                            onChange={(e) => handleSlotChange(idx, 'name', e.target.value)}
                            placeholder="e.g. Shift 1 (Morning)"
                            className="text-xs font-bold text-[#1d1d1f] bg-transparent focus:outline-none focus:border-b focus:border-[#0066cc] px-1 py-0.5 flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2 py-0.5 rounded-full border border-[#0066cc]/20">
                            {format12Hour(slot.startTime)} – {format12Hour(slot.endTime)}
                          </span>

                          {slots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50"
                              title="Remove shift"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inputs Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-[#86868b] mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            required
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(idx, 'startTime', e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] bg-white text-xs font-semibold focus:outline-none focus:border-[#0066cc]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-[#86868b] mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            required
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(idx, 'endTime', e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] bg-white text-xs font-semibold focus:outline-none focus:border-[#0066cc]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-[#86868b] mb-1">
                            Avg Time (mins)
                          </label>
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
                            className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] bg-white text-xs font-bold text-[#0066cc] focus:outline-none focus:border-[#0066cc]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-[#86868b] mb-1">
                            Max Patients
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={200}
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
                            className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] bg-white text-xs font-bold text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                          />
                        </div>
                      </div>

                      {/* Shift Pacing Helper Bar */}
                      <div className="pt-2 border-t border-[#e5e5ea] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#86868b]">
                        <div>
                          Duration: <strong className="text-[#1d1d1f]">{durationMinutes}m</strong> •
                          Pace: <strong className="text-[#0066cc]">~{slot.avgConsultationMinutes || 15}m</strong> •
                          Quota: <strong className="text-[#1d1d1f]">{slot.maxPatients} pts</strong>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAutoPace(idx)}
                            className="px-2 py-0.5 rounded-lg bg-white border border-[#e5e5ea] text-[#0066cc] text-[10px] font-semibold hover:bg-blue-50 flex items-center gap-1 active:scale-95"
                          >
                            <Sparkles className="w-3 h-3 text-[#0066cc]" />
                            <span>Calc Pace</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAutoCapacity(idx)}
                            className="px-2 py-0.5 rounded-lg bg-white border border-[#e5e5ea] text-[#48484a] text-[10px] font-semibold hover:bg-gray-100 flex items-center gap-1 active:scale-95"
                          >
                            <Users className="w-3 h-3 text-[#48484a]" />
                            <span>Calc Cap</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consultation Fee in Indian Rupees (₹ INR) for this Clinic */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e5ea] shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#f5f5f7]">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1d1d1f]">
                    Consultation Fee at {selectedClinic ? selectedClinic.clinicName : 'Practice'}
                  </h3>
                  <p className="text-[11px] text-[#86868b]">
                    Configured specifically for patients booking appointments at this healthcare venue
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                  Consultation Fee Amount (₹ INR)
                </label>
                <div className="relative max-w-xs">
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
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#e5e5ea] text-sm font-bold bg-[#fafafc] focus:bg-white focus:outline-none focus:border-[#0066cc] transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#86868b] mt-1.5">
                  Patients will see <strong>₹{consultationFee || 0}</strong> when booking an appointment token for your desk{selectedClinic ? ` at ${selectedClinic.clinicName}` : ''}.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <AppleButton
                variant="primary"
                size="lg"
                type="submit"
                disabled={saving}
                className="w-full shadow-xs"
              >
                {saving
                  ? 'Saving Schedule...'
                  : selectedClinic
                  ? `Save Schedule for ${selectedClinic.clinicName} (₹${consultationFee || 0})`
                  : `Save Independent Schedule (₹${consultationFee || 0})`}
              </AppleButton>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
