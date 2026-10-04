import React, { useState, useEffect, useCallback } from 'react';
import {
  api,
  DoctorSlot,
  calculateSlotMetrics,
  format12Hour,
  DoctorAffiliationClinic,
  parseDoctorSlots,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  IndianRupee,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Building2,
  Sparkles,
  Users,
} from 'lucide-react';

interface ManageScheduleScreenProps {
  onBack: () => void;
}

export const ManageScheduleScreen: React.FC<ManageScheduleScreenProps> = ({ onBack }) => {
  const { user } = useAuth();

  const [clinics, setClinics] = useState<DoctorAffiliationClinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [slots, setSlots] = useState<DoctorSlot[]>([
    {
      id: 'slot_1',
      name: 'Morning Shift (09:00 AM – 12:00 PM)',
      startTime: '09:00',
      endTime: '12:00',
      maxPatients: 30,
      avgConsultationMinutes: 6.0,
    },
  ]);

  const [consultationFee, setConsultationFee] = useState<number>(800);

  const loadDoctorAffiliations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDoctorAffiliations();
      if (res.success && res.data?.clinics && res.data.clinics.length > 0) {
        setClinics(res.data.clinics);
        setSelectedClinicId(res.data.clinics[0].clinicId);
        if (res.data.clinics[0].slots && res.data.clinics[0].slots.length > 0) {
          setSlots(res.data.clinics[0].slots);
        }
        if (res.data.clinics[0].consultationFee) {
          setConsultationFee(res.data.clinics[0].consultationFee);
        }
      } else if (user?.doctorProfile) {
        setSlots(parseDoctorSlots(user.doctorProfile));
        setConsultationFee(user.doctorProfile.consultationFee || 800);
      }
    } catch {
      if (user?.doctorProfile) {
        setSlots(parseDoctorSlots(user.doctorProfile));
        setConsultationFee(user.doctorProfile.consultationFee || 800);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDoctorAffiliations();
  }, [loadDoctorAffiliations]);

  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    const matched = clinics.find((c) => c.clinicId === clinicId);
    if (matched) {
      if (matched.slots && matched.slots.length > 0) {
        setSlots(matched.slots);
      }
      if (matched.consultationFee) {
        setConsultationFee(matched.consultationFee);
      }
    }
  };

  const handleAddSlot = () => {
    const nextIdx = slots.length + 1;
    const startTime = '14:00';
    const endTime = '17:00';
    const maxPatients = 25;
    const { avgConsultationMinutes } = calculateSlotMetrics(startTime, endTime, maxPatients);

    setSlots([
      ...slots,
      {
        id: `slot_${Date.now()}`,
        name: `Evening Shift ${nextIdx} (${format12Hour(startTime)} – ${format12Hour(endTime)})`,
        startTime,
        endTime,
        maxPatients,
        avgConsultationMinutes,
      },
    ]);
  };

  const handleRemoveSlot = (id: string) => {
    if (slots.length <= 1) {
      setError('You must retain at least one consultation shift.');
      return;
    }
    setSlots(slots.filter((s) => s.id !== id));
  };

  const handleSlotFieldChange = (
    id: string,
    field: 'name' | 'startTime' | 'endTime' | 'maxPatients',
    val: any
  ) => {
    setSlots(
      slots.map((s) => {
        if (s.id !== id) return s;

        const updated = { ...s, [field]: val };
        if (field === 'startTime' || field === 'endTime' || field === 'maxPatients') {
          const { avgConsultationMinutes } = calculateSlotMetrics(
            field === 'startTime' ? val : updated.startTime,
            field === 'endTime' ? val : updated.endTime,
            field === 'maxPatients' ? Number(val) : updated.maxPatients
          );
          updated.avgConsultationMinutes = avgConsultationMinutes;
        }
        return updated;
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        clinicId: selectedClinicId || undefined,
        consultationFee,
        slots,
      };

      const res = await api.updateDoctorSchedule(payload);
      if (res.success) {
        setSuccessMsg('Clinic shifts and consultation fees updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
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
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e5e5ea] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Console</span>
          </button>
          <h1 className="font-semibold text-sm text-[#1d1d1f]">Manage Shift Schedules</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-5 space-y-4">
        {/* Banner Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)}><span className="text-sm">×</span></button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)}><span className="text-sm">×</span></button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Clinic Selector & Fee */}
          <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-indigo-700">
              <Building2 className="w-5 h-5" />
              <h2 className="font-semibold text-base text-[#1d1d1f]">Practice Location & Fee</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {clinics.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Target Clinic</label>
                  <select
                    value={selectedClinicId}
                    onChange={(e) => handleClinicChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm bg-white focus:outline-none focus:border-[#0066cc]"
                  >
                    {clinics.map((c) => (
                      <option key={c.clinicId} value={c.clinicId}>
                        {c.clinicName} ({c.city || 'Clinical Unit'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Consultation Fee (₹)</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shift Slots Builder */}
          <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base text-[#1d1d1f]">Shift Slots & Capacities</h2>
                <p className="text-xs text-[#86868b]">Patients are issued sequential tokens based on shift capacity</p>
              </div>
              <button
                type="button"
                onClick={handleAddSlot}
                className="px-3.5 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Shift</span>
              </button>
            </div>

            <div className="space-y-3">
              {slots.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0066cc]">SHIFT #{idx + 1}</span>
                    {slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(s.id)}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove Shift"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">Shift Label</label>
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => handleSlotFieldChange(s.id, 'name', e.target.value)}
                      placeholder="e.g. Morning Shift"
                      className="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] bg-white text-xs focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-[#86868b] mb-1">Start Time</label>
                      <input
                        type="time"
                        value={s.startTime}
                        onChange={(e) => handleSlotFieldChange(s.id, 'startTime', e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] bg-white text-xs focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#86868b] mb-1">End Time</label>
                      <input
                        type="time"
                        value={s.endTime}
                        onChange={(e) => handleSlotFieldChange(s.id, 'endTime', e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] bg-white text-xs focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#86868b] mb-1">Max Patients</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={s.maxPatients}
                        onChange={(e) => handleSlotFieldChange(s.id, 'maxPatients', Number(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] bg-white text-xs focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>
                  </div>

                  {/* Calculated Metrics pill */}
                  <div className="flex items-center justify-between text-[11px] text-[#86868b] pt-1 border-t border-[#e5e5ea]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
                      <span>Hours: {format12Hour(s.startTime)} – {format12Hour(s.endTime)}</span>
                    </div>
                    <div>
                      Avg duration: <strong className="text-[#1d1d1f] font-mono">{s.avgConsultationMinutes || 3} mins</strong>/patient
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-sm font-medium transition-colors shadow-sm"
          >
            {saving ? 'Saving Schedule...' : 'Save Practice Schedule'}
          </button>
        </form>
      </main>
    </div>
  );
};
