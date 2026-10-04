import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api, DoctorProfile, ClinicProfile, getFileUrl, ALL_SPECIALTIES } from '../services/api';
import { INDIAN_STATES, getCitiesForState } from '../utils/indiaStates';
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
  SlidersHorizontal,
  X,
  IndianRupee,
  Award,
} from 'lucide-react';

const SPECIALTIES = ['All', ...ALL_SPECIALTIES];

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
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [maxFee, setMaxFee] = useState<number>(3000);
  const [minExp, setMinExp] = useState<number>(0);
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicProfile | null>(null);

  const availableCities = useMemo(() => {
    if (selectedState === 'All') return [];
    return getCitiesForState(selectedState);
  }, [selectedState]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedState !== 'All') count++;
    if (selectedCity !== 'All') count++;
    if (maxFee < 3000) count++;
    if (minExp > 0) count++;
    return count;
  }, [selectedState, selectedCity, maxFee, minExp]);

  // Fetch doctors
  const fetchDoctors = useCallback(async (
    query = searchQuery,
    specialty = selectedSpecialty,
    state = selectedState,
    city = selectedCity,
    fee = maxFee,
    exp = minExp
  ) => {
    try {
      const params: any = {};
      if (query.trim()) params.search = query.trim();
      if (specialty !== 'All') params.specialty = specialty;
      if (state !== 'All') params.state = state;
      if (city !== 'All') params.city = city;
      if (fee < 3000) params.maxFee = fee;
      if (exp > 0) params.minExp = exp;

      const res = await api.getDoctors(params);
      if (res.success && Array.isArray(res.data)) {
        setDoctors(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  }, [searchQuery, selectedSpecialty, selectedState, selectedCity, maxFee, minExp]);

  // Fetch public clinics
  const fetchClinics = useCallback(async (
    query = searchQuery,
    state = selectedState,
    city = selectedCity
  ) => {
    try {
      const params: any = {};
      if (query.trim()) params.search = query.trim();
      if (state !== 'All') params.state = state;
      if (city !== 'All') params.city = city;

      const res = await api.getPublicClinics(params);
      if (res.success && Array.isArray(res.data)) {
        setClinics(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch clinics:', err);
    }
  }, [searchQuery, selectedState, selectedCity]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDoctors(), fetchClinics()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchDoctors, fetchClinics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeSection === 'doctors') {
      fetchDoctors();
    } else {
      fetchClinics();
    }
  }, [selectedSpecialty, selectedState, selectedCity, maxFee, minExp, activeSection, fetchDoctors, fetchClinics]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSection === 'doctors') {
      fetchDoctors();
    } else {
      fetchClinics();
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

        {/* Search Input & Filter Button */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center">
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

          <button
            type="button"
            onClick={() => setShowFiltersModal(true)}
            className={`relative p-2.5 rounded-full border transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
              activeFiltersCount > 0
                ? 'bg-[#0066cc] border-[#0066cc] text-white'
                : 'bg-white border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7]'
            }`}
            title="Filter Options"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#ff3b30] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Badges */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar text-xs">
            {selectedState !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-[#0066cc]/10 text-[#0066cc] font-medium px-2.5 py-1 rounded-full shrink-0 border border-[#0066cc]/20">
                State: {selectedState}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedState('All');
                    setSelectedCity('All');
                  }}
                  className="hover:text-[#004d99]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCity !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-[#0066cc]/10 text-[#0066cc] font-medium px-2.5 py-1 rounded-full shrink-0 border border-[#0066cc]/20">
                City: {selectedCity}
                <button
                  type="button"
                  onClick={() => setSelectedCity('All')}
                  className="hover:text-[#004d99]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {maxFee < 3000 && (
              <span className="inline-flex items-center gap-1 bg-[#0066cc]/10 text-[#0066cc] font-medium px-2.5 py-1 rounded-full shrink-0 border border-[#0066cc]/20">
                {maxFee === 0 ? 'Free (₹0)' : `Fee ≤ ₹${maxFee}`}
                <button
                  type="button"
                  onClick={() => setMaxFee(3000)}
                  className="hover:text-[#004d99]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {minExp > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#0066cc]/10 text-[#0066cc] font-medium px-2.5 py-1 rounded-full shrink-0 border border-[#0066cc]/20">
                Exp: {minExp}+ yrs
                <button
                  type="button"
                  onClick={() => setMinExp(0)}
                  className="hover:text-[#004d99]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedState('All');
                setSelectedCity('All');
                setMaxFee(3000);
                setMinExp(0);
              }}
              className="text-xs text-[#86868b] hover:text-[#1d1d1f] font-semibold underline shrink-0 px-1"
            >
              Clear All
            </button>
          </div>
        )}

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
      {/* Filter Bottom Sheet Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#0066cc]" />
                <h3 className="text-base font-bold text-[#1d1d1f]">Filter & Refine</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="p-1 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* State Selection */}
              <div>
                <label className="block text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2">
                  State / Union Territory
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity('All');
                  }}
                  className="w-full bg-[#f5f5f7] text-[#1d1d1f] text-sm rounded-xl px-3.5 py-2.5 border border-[#e5e5ea] focus:border-[#0066cc] outline-none"
                >
                  <option value="All">All Indian States</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* City Selection */}
              <div>
                <label className="block text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2">
                  City
                </label>
                <select
                  value={selectedCity}
                  disabled={selectedState === 'All'}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-[#f5f5f7] text-[#1d1d1f] text-sm rounded-xl px-3.5 py-2.5 border border-[#e5e5ea] focus:border-[#0066cc] outline-none disabled:opacity-50"
                >
                  <option value="All">
                    {selectedState === 'All' ? 'Select state first' : 'All Cities in ' + selectedState}
                  </option>
                  {availableCities.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>

              {/* Max Consultation Fee Slider */}
              {activeSection === 'doctors' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
                      Max Consultation Fee
                    </label>
                    <span className="text-sm font-bold text-[#0066cc]">
                      {maxFee >= 3000 ? 'Any Fee' : maxFee === 0 ? 'Free (₹0)' : `Up to ₹${maxFee}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="100"
                    value={maxFee}
                    onChange={(e) => setMaxFee(Number(e.target.value))}
                    className="w-full accent-[#0066cc]"
                  />
                  <div className="flex justify-between text-[11px] text-[#86868b] mt-1">
                    <span>₹0</span>
                    <span>₹1500</span>
                    <span>₹3000+</span>
                  </div>
                </div>
              )}

              {/* Minimum Experience */}
              {activeSection === 'doctors' && (
                <div>
                  <label className="block text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2">
                    Minimum Experience
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Any', value: 0 },
                      { label: '3+ yrs', value: 3 },
                      { label: '5+ yrs', value: 5 },
                      { label: '10+ yrs', value: 10 },
                    ].map((exp) => (
                      <button
                        key={exp.value}
                        type="button"
                        onClick={() => setMinExp(exp.value)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                          minExp === exp.value
                            ? 'bg-[#0066cc] border-[#0066cc] text-white'
                            : 'bg-[#f5f5f7] border-[#e5e5ea] text-[#1d1d1f] hover:bg-[#ebebed]'
                        }`}
                      >
                        {exp.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[#e5e5ea] bg-[#f9f9fb] flex items-center gap-3">
              <AppleButton
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  setSelectedState('All');
                  setSelectedCity('All');
                  setMaxFee(3000);
                  setMinExp(0);
                }}
              >
                Reset All
              </AppleButton>
              <AppleButton
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => setShowFiltersModal(false)}
              >
                Apply Filters
              </AppleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
