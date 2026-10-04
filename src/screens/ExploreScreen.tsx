import React, { useState, useEffect, useMemo } from 'react';
import { api, DoctorProfile, ClinicProfile, getFileUrl } from '../services/api';
import { AppleCard } from '../components/ui/AppleCard';
import { AppleButton } from '../components/ui/AppleButton';
import clinicLobbyBg from '../assets/clinic-lobby-bg.jpg';
import doctorHeroAlt from '../assets/doctor-hero-alt.jpg';
import {
  Search,
  MapPin,
  Clock,
  RefreshCw,
  User,
  Building2,
  Phone,
  ChevronRight,
  ArrowLeft,
  QrCode,
  Sparkles,
} from 'lucide-react';

const SPECIALTIES = [
  'All',
  'General Physician',
  'Cardiology',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'ENT',
  'Neurology',
  'Ophthalmology',
];

interface ExploreScreenProps {
  onSelectDoctor: (doctor: DoctorProfile) => void;
  onQuickBook: (doctor: DoctorProfile) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onSelectDoctor,
  onQuickBook,
}) => {
  // Navigation section: 'clinics' or 'doctors'
  const [activeSection, setActiveSection] = useState<'clinics' | 'doctors'>('clinics');

  // Data states
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [clinics, setClinics] = useState<ClinicProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedClinic, setSelectedClinic] = useState<ClinicProfile | null>(null);

  // Fetch doctors
  const fetchDoctors = async (query = '', specialty = 'All') => {
    try {
      const params: any = {};
      if (query.trim()) params.search = query.trim();
      if (specialty !== 'All') params.specialty = specialty;

      const res = await api.getDoctors(params);
      if (res.success && Array.isArray(res.data)) {
        setDoctors(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  // Fetch public clinics
  const fetchClinics = async (query = '') => {
    try {
      const params: any = {};
      if (query.trim()) params.search = query.trim();

      const res = await api.getPublicClinics(params);
      if (res.success && Array.isArray(res.data)) {
        setClinics(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch clinics:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDoctors(searchQuery, selectedSpecialty),
      fetchClinics(searchQuery),
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeSection === 'doctors') {
      fetchDoctors(searchQuery, selectedSpecialty);
    } else {
      fetchClinics(searchQuery);
    }
  }, [selectedSpecialty, activeSection]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSection === 'doctors') {
      fetchDoctors(searchQuery, selectedSpecialty);
    } else {
      fetchClinics(searchQuery);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Filtered clinics based on client-side search query as well
  const filteredClinics = useMemo(() => {
    if (!searchQuery.trim()) return clinics;
    const q = searchQuery.toLowerCase();
    return clinics.filter((c) => {
      const name = (c.clinicName || c.name || '').toLowerCase();
      const city = (c.city || '').toLowerCase();
      const addr = (c.address || '').toLowerCase();
      return name.includes(q) || city.includes(q) || addr.includes(q);
    });
  }, [clinics, searchQuery]);

  // Doctors for selected clinic
  const clinicDoctors = useMemo(() => {
    if (!selectedClinic) return [];
    if (selectedClinic.doctors && selectedClinic.doctors.length > 0) {
      return selectedClinic.doctors.map((cd) => cd.doctor).filter(Boolean);
    }
    // Fallback: match by clinic ID or name from all doctors
    return doctors.filter((doc) =>
      doc.schedules?.some(
        (s) =>
          s.clinicId === selectedClinic.id ||
          s.clinicName?.toLowerCase() === (selectedClinic.clinicName || selectedClinic.name || '').toLowerCase()
      )
    );
  }, [selectedClinic, doctors]);

  const formatDoctorName = (name?: string) => {
    if (!name) return 'Dr. Specialist';
    const trimmed = name.trim();
    if (trimmed.toLowerCase().startsWith('dr.')) {
      return trimmed;
    }
    return `Dr. ${trimmed}`;
  };

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Top Header & Sticky Search Area */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/95 backdrop-blur-md px-4 pt-3 pb-2.5 border-b border-[#e5e5ea] space-y-2.5">
        {/* Apple Segmented Switcher: Clinics vs Doctors */}
        <div className="bg-[#e5e5ea]/80 p-0.5 rounded-full flex items-center max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveSection('clinics');
              setSelectedClinic(null);
            }}
            className={`flex-1 py-1.5 px-4 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              activeSection === 'clinics'
                ? 'bg-white text-[#1d1d1f]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Clinics
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection('doctors');
              setSelectedClinic(null);
            }}
            className={`flex-1 py-1.5 px-4 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              activeSection === 'doctors'
                ? 'bg-white text-[#1d1d1f]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Doctors
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#86868b] pointer-events-none" />
          <input
            type="text"
            placeholder={
              activeSection === 'clinics'
                ? 'Search clinics or locations...'
                : 'Search doctors or specialties...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-[#1d1d1f] text-sm rounded-full pl-10 pr-10 py-2 border border-[#d2d2d7] focus:border-[#0066cc] outline-none transition-all placeholder:text-[#86868b]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                if (activeSection === 'doctors') {
                  fetchDoctors('', selectedSpecialty);
                } else {
                  fetchClinics('');
                }
              }}
              className="absolute right-3 text-xs text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        {/* Specialty Filter (Only visible in Doctors mode) */}
        {activeSection === 'doctors' && (
          <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar -mx-4 px-4">
            {SPECIALTIES.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all select-none cursor-pointer active:scale-95 ${
                  selectedSpecialty === spec
                    ? 'bg-[#0066cc] text-white'
                    : 'bg-white text-[#1d1d1f] border border-[#e5e5ea] active:bg-[#f0f0f0]'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-3.5">
        {/* Status / Count Bar */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-[#86868b]">
            {activeSection === 'clinics'
              ? selectedClinic
                ? `${selectedClinic.clinicName || selectedClinic.name}`
                : `${filteredClinics.length} ${filteredClinics.length === 1 ? 'Clinic' : 'Clinics'}`
              : `${doctors.length} ${doctors.length === 1 ? 'Doctor' : 'Doctors'}`}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-xs text-[#0066cc] font-semibold active:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[20px] p-5 border border-[#e5e5ea] animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : activeSection === 'clinics' ? (
          /* ================= CLINICS VIEW ================= */
          selectedClinic ? (
            /* Selected Clinic's Doctor View */
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={() => setSelectedClinic(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e5e5ea] text-xs font-semibold text-[#1d1d1f] active:scale-95 active:bg-[#f5f5f7] transition-all cursor-pointer mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#0066cc]" />
                All Clinics
              </button>

              {/* Clinic Banner Card */}
              <AppleCard className="bg-white border-[#e0e0e0] space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                      {selectedClinic.clinicName || selectedClinic.name}
                    </h3>
                    <p className="text-xs text-[#48484a] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                      <span>{selectedClinic.address}, {selectedClinic.city}</span>
                    </p>
                  </div>
                  {selectedClinic.checkinCode && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2.5 py-1 rounded-full border border-[#0066cc]/20 shrink-0">
                      <QrCode className="w-3 h-3" />
                      {selectedClinic.checkinCode}
                    </span>
                  )}
                </div>

                {selectedClinic.phone && (
                  <p className="text-xs text-[#86868b] flex items-center gap-1.5 pt-1 border-t border-[#f0f0f2]">
                    <Phone className="w-3 h-3 text-[#0066cc]" />
                    <span>{selectedClinic.phone}</span>
                  </p>
                )}
              </AppleCard>

              {/* Doctors at this clinic */}
              {clinicDoctors.length === 0 ? (
                <div className="bg-white rounded-[20px] p-8 text-center border border-[#e5e5ea]">
                  <User className="w-8 h-8 text-[#86868b] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#1d1d1f]">No doctors listed</p>
                  <p className="text-xs text-[#86868b] mt-1">
                    No practicing doctors currently active here.
                  </p>
                </div>
              ) : (
                clinicDoctors.map((doc) => {
                  const avatar = doc.user?.avatarUrl;
                  const docName = formatDoctorName(doc.user?.fullName);

                  return (
                    <AppleCard
                      key={doc.id}
                      interactive
                      onClick={() => onSelectDoctor(doc)}
                      className="p-3 sm:p-3.5 group flex gap-3.5 items-stretch"
                    >
                      {/* Big Doctor Photo on Left (Flipkart Style) */}
                      <div className="relative w-28 sm:w-32 aspect-[4/3] min-w-[112px] sm:min-w-[128px] rounded-2xl overflow-hidden border border-[#e5e5ea] shrink-0 self-center bg-[#f0f0f2]">
                        {avatar ? (
                          <img
                            src={getFileUrl(avatar)}
                            alt={docName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.doc-fallback-img');
                              if (fallback) (fallback as HTMLElement).style.display = 'block';
                            }}
                          />
                        ) : null}
                        <img
                          src={doctorHeroAlt}
                          alt={docName}
                          className={`doc-fallback-img w-full h-full object-cover ${avatar ? 'hidden' : 'block'}`}
                        />
                      </div>

                      {/* Content on Right */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="text-[15px] sm:text-base font-bold text-[#1d1d1f] leading-snug truncate">
                              {docName}
                            </h4>
                            <span className="text-[10px] font-semibold text-[#1d1d1f] bg-[#f5f5f7] px-2 py-0.5 rounded-full border border-[#e5e5ea] shrink-0 whitespace-nowrap">
                              {doc.experienceYears || 1} yrs exp
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-[#0066cc] mt-0.5 truncate">
                            {doc.specialty}
                          </p>

                          <p className="text-[11px] text-[#86868b] mt-0.5 truncate">
                            {doc.qualifications}
                          </p>
                        </div>

                        {/* Bottom Fee & Book Row */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#f0f0f2]">
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-[#1d1d1f]">
                              ₹{doc.consultationFee || 500}
                            </span>
                            <span className="text-[10px] text-[#86868b]">fee</span>
                          </div>

                          <AppleButton
                            variant="primary"
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              onQuickBook(doc);
                            }}
                          >
                            Book Visit
                          </AppleButton>
                        </div>
                      </div>
                    </AppleCard>
                  );
                })
              )}
            </div>
          ) : (
            /* Clinics List Cards */
            <div className="space-y-3.5">
              {filteredClinics.length === 0 ? (
                <div className="bg-white rounded-[20px] p-8 text-center border border-[#e5e5ea]">
                  <Building2 className="w-10 h-10 text-[#86868b] mx-auto mb-2" />
                  <h4 className="text-base font-semibold text-[#1d1d1f]">No Clinics Found</h4>
                  <p className="text-xs text-[#86868b] mt-1">
                    Check spelling or try a different search.
                  </p>
                </div>
              ) : (
                filteredClinics.map((clinic) => {
                  const name = clinic.clinicName || clinic.name || 'MediArca Clinic';
                  const docCount =
                    clinic.doctors?.length || clinic._count?.doctors || 0;

                  return (
                    <AppleCard
                      key={clinic.id}
                      interactive
                      onClick={() => setSelectedClinic(clinic)}
                      className="p-3 sm:p-3.5 group flex gap-3.5 items-stretch"
                    >
                      {/* Big Clinic Photo on Left (Flipkart Style) */}
                      <div className="relative w-28 sm:w-32 aspect-[4/3] min-w-[112px] sm:min-w-[128px] rounded-2xl overflow-hidden border border-[#e5e5ea] shrink-0 self-center bg-[#f0f0f2]">
                        <img
                          src={clinicLobbyBg}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 p-1 rounded-lg bg-black/40 backdrop-blur-md text-white">
                          <Building2 className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Content on Right */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[15px] sm:text-base font-bold text-[#1d1d1f] leading-snug tracking-tight truncate group-hover:text-[#0066cc] transition-colors">
                              {name}
                            </h3>
                            <span className="text-[10px] font-semibold text-[#1d1d1f] bg-[#f5f5f7] px-2 py-0.5 rounded-full border border-[#e5e5ea] shrink-0 whitespace-nowrap">
                              {docCount === 1 ? '1 Doctor' : `${docCount} Doctors`}
                            </span>
                          </div>

                          <p className="text-xs text-[#48484a] flex items-center gap-1.5 mt-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                            <span className="truncate">{clinic.address}, {clinic.city}</span>
                          </p>

                          {clinic.phone && (
                            <p className="text-[11px] text-[#86868b] flex items-center gap-1 mt-1 truncate">
                              <Phone className="w-3 h-3 text-[#0066cc] shrink-0" />
                              <span className="truncate">{clinic.phone}</span>
                            </p>
                          )}
                        </div>

                        {/* Footer Action */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#f0f0f2]">
                          <span className="text-xs font-semibold text-[#0066cc]">
                            View Doctors
                          </span>
                          <div className="p-1 rounded-full bg-[#f5f5f7] group-hover:bg-[#0066cc] group-hover:text-white transition-colors">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </AppleCard>
                  );
                })
              )}
            </div>
          )
        ) : (
          /* ================= DOCTORS VIEW ================= */
          <div className="space-y-3.5">
            {doctors.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-[20px] border border-[#e5e5ea]">
                <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-3 border border-[#e5e5ea]">
                  <Search className="w-5 h-5 text-[#86868b]" />
                </div>
                <h4 className="text-base font-semibold text-[#1d1d1f]">No Doctors Found</h4>
                <p className="text-xs text-[#86868b] mt-1">
                  Try another specialty or clear your filter.
                </p>
              </div>
            ) : (
              doctors.map((doctor) => {
                const docName = formatDoctorName(doctor.user?.fullName);
                const avatar = doctor.user?.avatarUrl;
                const primaryClinic = doctor.schedules?.[0]?.clinicName || 'MediArca Healthcare';
                const city = doctor.schedules?.[0]?.clinicCity || '';

                return (
                  <AppleCard
                    key={doctor.id}
                    interactive
                    onClick={() => onSelectDoctor(doctor)}
                    className="p-3 sm:p-3.5 group flex gap-3.5 items-stretch"
                  >
                    {/* Big Doctor Photo on Left (Flipkart Style) */}
                    <div className="relative w-28 sm:w-32 aspect-[4/3] min-w-[112px] sm:min-w-[128px] rounded-2xl overflow-hidden border border-[#e5e5ea] shrink-0 self-center bg-[#f0f0f2]">
                      {avatar ? (
                        <img
                          src={getFileUrl(avatar)}
                          alt={docName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.doc-main-fallback-img');
                            if (fallback) (fallback as HTMLElement).style.display = 'block';
                          }}
                        />
                      ) : null}
                      <img
                        src={doctorHeroAlt}
                        alt={docName}
                        className={`doc-main-fallback-img w-full h-full object-cover ${avatar ? 'hidden' : 'block'}`}
                      />
                    </div>

                    {/* Content on Right */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h3 className="text-[15px] sm:text-base font-bold text-[#1d1d1f] leading-snug truncate">
                            {docName}
                          </h3>
                          <span className="text-[10px] font-semibold text-[#1d1d1f] bg-[#f5f5f7] px-2 py-0.5 rounded-full border border-[#e5e5ea] shrink-0 whitespace-nowrap">
                            {doctor.experienceYears || 1} yrs exp
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-[#0066cc] mt-0.5 truncate">
                          {doctor.specialty}
                        </p>

                        <p className="text-[11px] text-[#86868b] mt-0.5 truncate">
                          {doctor.qualifications}
                        </p>

                        <p className="text-[11px] text-[#48484a] flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3 h-3 text-[#0066cc] shrink-0" />
                          <span className="truncate">{primaryClinic} {city ? `• ${city}` : ''}</span>
                        </p>
                      </div>

                      {/* Bottom Price & Book Row */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#f0f0f2]">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-[#1d1d1f]">
                            ₹{doctor.consultationFee || 500}
                          </span>
                          <span className="text-[10px] text-[#86868b]">fee</span>
                        </div>

                        <AppleButton
                          variant="primary"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onQuickBook(doctor);
                          }}
                        >
                          Book Visit
                        </AppleButton>
                      </div>
                    </div>
                  </AppleCard>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
