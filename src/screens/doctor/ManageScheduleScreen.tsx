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
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ManageScheduleScreenProps {
  onBack?: () => void;
  initialClinicId?: string;
  onNavigateToAffiliations?: () => void;
}

const FEE_PRESETS = [300, 500, 700, 1000, 1500];

export const ManageScheduleScreen: React.FC<ManageScheduleScreenProps> = ({
  initialClinicId,
}) => {
  const { user, refreshUser } = useAuth();

  const [clinics, setClinics] = useState<DoctorAffiliationClinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>(initialClinicId || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [slots, setSlots] = useState<DoctorSlot[]>([
    {
      id: 'slot_1',
      name: 'Shift 1',
      startTime: '09:00',
      endTime: '13:00',
      maxPatients: 25,
      avgConsultationMinutes: 20,
    },
  ]);

  const [consultationFee, setConsultationFee] = useState<number>(500);

  const selectedClinicIdRef = React.useRef(selectedClinicId);
  selectedClinicIdRef.current = selectedClinicId;

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
      } else {
        setSlots([
          {
            id: 'slot_1',
            name: 'Shift 1',
            startTime: '09:00',
            endTime: '13:00',
            maxPatients: 25,
            avgConsultationMinutes: 20,
          },
        ]);
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
      const currentId = selectedClinicIdRef.current || initialClinicId;

      if (currentId && activeClinics.some((c) => c.clinicId === currentId)) {
        targetClinic = activeClinics.find((c) => c.clinicId === currentId);
        setSelectedClinicId(currentId);
      } else if (activeClinics.length > 0) {
        targetClinic = activeClinics[0];
        setSelectedClinicId(activeClinics[0].clinicId);
      }

      if (targetClinic) {
        syncClinicData(targetClinic);
      } else if (user?.doctorProfile) {
        setSlots(parseDoctorSlots(user.doctorProfile));
        setConsultationFee(user.doctorProfile.consultationFee ?? 500);
      }
    } catch {
      if (user?.doctorProfile) {
        setSlots(parseDoctorSlots(user.doctorProfile));
        setConsultationFee(user.doctorProfile.consultationFee ?? 500);
      }
    } finally {
      setLoading(false);
    }
  }, [initialClinicId, syncClinicData, user]);

  useEffect(() => {
    loadDoctorAffiliations();
  }, [initialClinicId]);

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
        name: `Shift ${nextIdx}`,
        startTime,
        endTime,
        maxPatients,
        avgConsultationMinutes,
      },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    if (slots.length <= 1) {
      setError('At least one consultation shift is required.');
      return;
    }
    setError(null);
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const totalMaxDailyPatients = slots.reduce((sum, s) => sum + (Number(s.maxPatients) || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (clinics.length > 0 && !selectedClinic) {
      setError('Select a facility first.');
      return;
    }

    if (isNaN(Number(consultationFee)) || Number(consultationFee) < 0) {
      setError('Enter a valid fee in ₹ INR.');
      return;
    }

    if (slots.length === 0) {
      setError('At least one consultation shift is required.');
      return;
    }

    // Validate slots if any exist
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.startTime || !s.endTime) {
        setError(`Specify start and end time for ${s.name || `Shift ${i + 1}`}.`);
        return;
      }
      const startMins = timeToMinutes(s.startTime);
      const endMins = timeToMinutes(s.endTime);
      if (endMins <= startMins) {
        setError(`End time must be after start time for ${s.name || `Shift ${i + 1}`}.`);
        return;
      }
      if (!s.maxPatients || Number(s.maxPatients) < 1) {
        setError(`Max capacity for ${s.name || `Shift ${i + 1}`} must be at least 1.`);
        return;
      }
      if (!s.avgConsultationMinutes || Number(s.avgConsultationMinutes) < 1) {
        setError(`Average duration for ${s.name || `Shift ${i + 1}`} must be at least 1 minute.`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        ...(selectedClinic ? { clinicId: selectedClinic.clinicId } : {}),
        slots: slots.map((s) => ({
          id: s.id,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          maxPatients: Number(s.maxPatients),
          avgConsultationMinutes: Number(s.avgConsultationMinutes),
        })),
        consultationFee: Number(consultationFee),
      };

      const res = await api.updateDoctorSchedule(payload);
      if (res.success) {
        await refreshUser();
        setSuccessMsg('Schedule updated.');

        if (selectedClinic) {
          setClinics((prev) =>
            prev.map((c) =>
              c.clinicId === selectedClinic.clinicId
                ? {
                    ...c,
                    slots,
                    consultationFee: Number(consultationFee),
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
      {/* Header - No console/back button */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#e5e5ea] px-4 py-3">
        <div className="max-w-md mx-auto text-center">
          <h1 className="font-bold text-sm text-[#1d1d1f]">Schedule & Fee</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-3.5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1 font-medium">{error}</span>
            <button type="button" onClick={() => setError(null)} className="p-1 text-rose-600 font-bold">
              ×
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1 font-medium">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)} className="p-1 text-emerald-600 font-bold">
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-[#86868b] bg-white rounded-2xl border border-[#e5e5ea]">
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3.5">
            {/* Facility Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] space-y-2">
              <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider block">
                Facility
              </span>

              {clinics.length > 1 ? (
                <select
                  value={selectedClinicId}
                  onChange={(e) => handleClinicChange(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-[#e5e5ea] text-xs font-semibold bg-[#f5f5f7] text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                >
                  {clinics.map((c) => (
                    <option key={c.clinicId} value={c.clinicId}>
                      {c.clinicName} ({c.city || 'Unit'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-bold text-[#1d1d1f] bg-[#f5f5f7] px-3.5 py-2.5 rounded-xl border border-[#e5e5ea]">
                  {selectedClinic ? selectedClinic.clinicName : 'Independent Practice'}
                </div>
              )}
            </div>

            {/* Capacity Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider block">
                  Capacity
                </span>
                <h3 className="text-lg font-bold text-[#1d1d1f]">
                  {totalMaxDailyPatients} Patients / Day
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2.5 py-1 rounded-full">
                {slots.length} Shift{slots.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Shifts Builder */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
                  Shifts
                </span>

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

              {slots.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#fafafc] border border-dashed border-[#e5e5ea] text-center space-y-2">
                  <p className="text-xs text-[#86868b]">No shifts configured.</p>
                  <AppleButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddSlot}
                    className="text-xs py-1 px-3 text-[#0066cc]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Shift</span>
                  </AppleButton>
                </div>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot, idx) => (
                    <div
                      key={slot.id || idx}
                      className="p-3.5 rounded-2xl bg-[#fafafc] border border-[#e5e5ea] space-y-3"
                    >
                      {/* Header with Title and Delete Button */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#e5e5ea]">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-[#0066cc] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={slot.name}
                            onChange={(e) => handleSlotChange(idx, 'name', e.target.value)}
                            placeholder={`Shift ${idx + 1}`}
                            className="text-xs font-bold text-[#1d1d1f] bg-transparent focus:outline-none focus:border-b focus:border-[#0066cc] px-1 py-0.5 flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2 py-0.5 rounded-full">
                            {format12Hour(slot.startTime)} – {format12Hour(slot.endTime)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(idx)}
                            disabled={slots.length <= 1}
                            className={`p-1.5 rounded-lg transition-colors ${
                              slots.length <= 1
                                ? 'text-[#86868b]/40 cursor-not-allowed'
                                : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title={slots.length <= 1 ? 'At least one shift is required' : 'Delete shift'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Start and End Times */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-[#86868b] mb-1">
                            Start
                          </label>
                          <input
                            type="time"
                            required
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(idx, 'startTime', e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-[#e5e5ea] bg-white text-sm font-semibold text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-[#86868b] mb-1">
                            End
                          </label>
                          <input
                            type="time"
                            required
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(idx, 'endTime', e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-[#e5e5ea] bg-white text-sm font-semibold text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                          />
                        </div>
                      </div>

                      {/* Pacing and Quota */}
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#e5e5ea]">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-semibold text-[#86868b]">
                              Avg Mins
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAutoPace(idx)}
                              className="text-[10px] font-bold text-[#0066cc] hover:underline cursor-pointer"
                            >
                              Auto
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
                              className="w-full h-11 pl-3 pr-8 rounded-xl border border-[#e5e5ea] bg-white text-sm font-bold text-[#0066cc] focus:outline-none focus:border-[#0066cc]"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#86868b] pointer-events-none">
                              min
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-semibold text-[#86868b]">
                              Quota
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAutoCapacity(idx)}
                              className="text-[10px] font-bold text-[#0066cc] hover:underline cursor-pointer"
                            >
                              Auto
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
                              className="w-full h-11 pl-3 pr-8 rounded-xl border border-[#e5e5ea] bg-white text-sm font-bold text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#86868b] pointer-events-none">
                              pts
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fee Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
                  Fee
                </span>
                <span className="text-base font-bold text-emerald-700">
                  ₹{consultationFee || 0}
                </span>
              </div>

              {/* Preset Chips */}
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

              {/* Custom Fee Amount */}
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
                  className="w-full h-11 pl-8 pr-4 rounded-xl border border-[#e5e5ea] text-sm font-bold bg-[#fafafc] text-[#1d1d1f] focus:bg-white focus:outline-none focus:border-[#0066cc]"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-1">
              <AppleButton
                variant="primary"
                size="lg"
                type="submit"
                disabled={saving}
                className="w-full shadow-xs text-sm"
              >
                {saving ? 'Saving...' : `Save (₹${consultationFee || 0})`}
              </AppleButton>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
