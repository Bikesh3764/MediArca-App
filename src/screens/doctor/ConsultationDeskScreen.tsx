import React, { useState } from 'react';
import { api, Appointment } from '../../services/api';
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  User,
  Heart,
  Activity,
  FileText,
  Pill,
  Plus,
  Trash2,
  Calendar,
  Save,
  Check,
} from 'lucide-react';

interface ConsultationDeskScreenProps {
  appointment: Appointment;
  onBack: () => void;
  onCompleted: () => void;
}

export const ConsultationDeskScreen: React.FC<ConsultationDeskScreenProps> = ({
  appointment,
  onBack,
  onCompleted,
}) => {
  const [vitals, setVitals] = useState({
    bp: '',
    pulse: '',
    temp: '',
    spo2: '',
    weight: '',
  });

  const [clinicalNotes, setClinicalNotes] = useState(appointment.clinicalNotes || appointment.consultationNotes || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Prescription items builder
  const [medicines, setMedicines] = useState<Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([
    { name: '', dosage: '500mg', frequency: '1-0-1', duration: '5 days', instructions: 'After food' },
  ]);

  const [savingNotes, setSavingNotes] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      { name: '', dosage: '500mg', frequency: '1-0-1', duration: '5 days', instructions: 'After food' },
    ]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx: number, field: string, val: string) => {
    setMedicines(
      medicines.map((m, i) => (i === idx ? { ...m, [field]: val } : m))
    );
  };

  const handleSaveDraft = async () => {
    setSavingNotes(true);
    setError(null);
    try {
      const res = await api.updateNotes({
        appointmentId: appointment.id,
        vitals,
        clinicalNotes: clinicalNotes.trim(),
        diagnosis: diagnosis.trim(),
        medicines: medicines.filter((m) => m.name.trim()),
        advice: advice.trim(),
        followUpDate: followUpDate || undefined,
      });
      if (res.success) {
        setSuccessMsg('Clinical observations saved.');
        setTimeout(() => setSuccessMsg(null), 2500);
      } else {
        setError(res.message || 'Failed to save notes');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompleting(true);
    setError(null);

    try {
      const activeMeds = medicines.filter((m) => m.name.trim());
      const res = await api.completeConsultation({
        appointmentId: appointment.id,
        vitals,
        clinicalNotes: clinicalNotes.trim(),
        diagnosis: diagnosis.trim() || undefined,
        medicines: activeMeds.length > 0 ? activeMeds : undefined,
        advice: advice.trim() || undefined,
        followUpDate: followUpDate || undefined,
      });

      if (res.success) {
        onCompleted();
      } else {
        setError(res.message || 'Failed to complete consultation');
        setCompleting(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete consultation');
      setCompleting(false);
    }
  };

  const patientName = appointment.patientName || appointment.patient?.user?.fullName || 'Patient';

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
            <span>Queue</span>
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-sm text-[#1d1d1f]">Consultation Desk</h1>
            <p className="text-[11px] text-[#86868b]">Token #{appointment.queueNumber} • {patientName}</p>
          </div>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingNotes}
            className="flex items-center gap-1 text-xs text-[#0066cc] font-medium hover:underline"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingNotes ? 'Saving...' : 'Save Draft'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Banner Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* Patient Identity Card */}
        <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center font-extrabold text-base text-[#0066cc]">
              #{appointment.queueNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-[#1d1d1f]">{patientName}</h2>
                {appointment.patientGender && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] font-medium border border-[#e5e5ea]">
                    {appointment.patientGender} {appointment.patientAge ? `• ${appointment.patientAge}y` : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#86868b] mt-0.5">
                {appointment.patientPhone || appointment.patient?.user?.phone || 'Mobile phone on file'}
              </p>
              {appointment.reasonForVisit && (
                <p className="text-xs text-[#0066cc] mt-1 font-medium">Chief Complaint: "{appointment.reasonForVisit}"</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleComplete} className="space-y-4">
          {/* Vitals Logger */}
          <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <Activity className="w-4 h-4" />
              <h3 className="font-semibold text-sm text-[#1d1d1f]">Patient Vitals</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-[#86868b] mb-1">BP (mmHg)</label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] text-xs font-mono focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#86868b] mb-1">Pulse (bpm)</label>
                <input
                  type="text"
                  placeholder="72"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] text-xs font-mono focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#86868b] mb-1">Temp (°F)</label>
                <input
                  type="text"
                  placeholder="98.6"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] text-xs font-mono focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#86868b] mb-1">SpO2 (%)</label>
                <input
                  type="text"
                  placeholder="99"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] text-xs font-mono focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#86868b] mb-1">Weight (kg)</label>
                <input
                  type="text"
                  placeholder="68"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#e5e5ea] text-xs font-mono focus:outline-none focus:border-[#0066cc]"
                />
              </div>
            </div>
          </div>

          {/* Clinical Observations & Diagnosis */}
          <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 text-[#0066cc]">
              <FileText className="w-4 h-4" />
              <h3 className="font-semibold text-sm text-[#1d1d1f]">Diagnosis & Clinical Notes</h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Primary Clinical Diagnosis</label>
              <input
                type="text"
                placeholder="e.g. Essential Hypertension, Acute Bronchitis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Clinical Observations & Findings</label>
              <textarea
                rows={3}
                placeholder="Record clinical history, physical examination findings, and clinical reasoning..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
              />
            </div>
          </div>

          {/* Prescription Medicines Builder */}
          <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600">
                <Pill className="w-4 h-4" />
                <h3 className="font-semibold text-sm text-[#1d1d1f]">Prescription Medications</h3>
              </div>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0066cc] text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Drug</span>
              </button>
            </div>

            <div className="space-y-3">
              {medicines.map((med, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#86868b]">RX #{idx + 1}</span>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="text-rose-600 text-xs hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Medication name (e.g. Telmisartan)"
                      value={med.name}
                      onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#e5e5ea] bg-white text-xs focus:outline-none focus:border-[#0066cc]"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 40mg)"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#e5e5ea] bg-white text-xs focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Frequency (1-0-1)"
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#e5e5ea] bg-white text-xs focus:outline-none focus:border-[#0066cc]"
                    />
                    <input
                      type="text"
                      placeholder="Duration (7 days)"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#e5e5ea] bg-white text-xs focus:outline-none focus:border-[#0066cc]"
                    />
                    <input
                      type="text"
                      placeholder="Instructions (After food)"
                      value={med.instructions}
                      onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#e5e5ea] bg-white text-xs focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice & Follow-Up */}
          <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Clinical Advice & Diet</label>
              <textarea
                rows={2}
                placeholder="Dietary instructions, salt restriction, hydration, emergency warnings..."
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Follow-Up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#e5e5ea] text-xs bg-white focus:outline-none focus:border-[#0066cc]"
              />
            </div>
          </div>

          {/* Complete Consultation CTA */}
          <button
            type="submit"
            disabled={completing}
            className="w-full py-4 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{completing ? 'Signing & Completing...' : 'Complete Consultation & Sign'}</span>
          </button>
        </form>
      </main>
    </div>
  );
};
