import React, { useState, useEffect } from 'react';
import { api, DoctorProfile, getFileUrl } from '../services/api';
import { AppleCard } from '../components/ui/AppleCard';
import { AppleButton } from '../components/ui/AppleButton';
import { DoctorPresenceBadge } from '../components/ui/DoctorPresenceBadge';
import {
  Search,
  MapPin,
  Clock,
  Star,
  RefreshCw,
  User,
  SlidersHorizontal,
  ChevronRight,
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
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors(searchQuery, selectedSpecialty);
  }, [selectedSpecialty]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchDoctors(searchQuery, selectedSpecialty);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDoctors(searchQuery, selectedSpecialty);
  };

  return (
    <div className="flex flex-col min-h-full pb-safe">
      {/* Top Search Header */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 pt-3 pb-2 border-b border-[#e5e5ea]">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#86868b] pointer-events-none" />
          <input
            type="text"
            placeholder="Search doctors, specialties, clinics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-[#1d1d1f] text-sm rounded-full pl-10 pr-10 py-2.5 border border-[#d2d2d7] focus:border-[#0066cc] outline-none shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchDoctors('', selectedSpecialty);
              }}
              className="absolute right-3 text-xs text-[#86868b] hover:text-[#1d1d1f]"
            >
              Clear
            </button>
          )}
        </form>

        {/* Specialty Horizontal Chips */}
        <div className="flex gap-1.5 overflow-x-auto py-2.5 no-scrollbar -mx-4 px-4">
          {SPECIALTIES.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-150 select-none ${
                selectedSpecialty === spec
                  ? 'bg-[#0066cc] text-white shadow-sm'
                  : 'bg-white text-[#1d1d1f] border border-[#e5e5ea] active:bg-[#f0f0f0]'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content List */}
      <div className="p-4 space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
            {doctors.length} Verified {doctors.length === 1 ? 'Doctor' : 'Doctors'}
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-xs text-[#0066cc] font-medium active:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[18px] p-4.5 border border-[#e5e5ea] animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm border border-[#e5e5ea]">
              <Search className="w-5 h-5 text-[#86868b]" />
            </div>
            <h4 className="text-base font-semibold text-[#1d1d1f]">No Doctors Found</h4>
            <p className="text-xs text-[#86868b] mt-1">
              Try searching for a different specialty or clearing your search filter.
            </p>
          </div>
        ) : (
          doctors.map((doctor) => {
            const docName = doctor.user?.fullName || 'Practitioner';
            const avatar = doctor.user?.avatarUrl;
            const primaryClinic = doctor.schedules?.[0]?.clinicName || 'MediArca Clinic';
            const city = doctor.schedules?.[0]?.clinicCity || '';

            return (
              <AppleCard
                key={doctor.id}
                interactive
                onClick={() => onSelectDoctor(doctor)}
                className="space-y-3.5 group"
              >
                {/* Doctor Avatar & Identity */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-13 h-13 rounded-full overflow-hidden bg-[#f5f5f7] border border-[#e5e5ea] shrink-0 flex items-center justify-center">
                      {avatar ? (
                        <img
                          src={getFileUrl(avatar)}
                          alt={docName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-[#86868b]" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#1d1d1f] leading-snug">
                        Dr. {docName}
                      </h3>
                      <p className="text-xs font-semibold text-[#0066cc]">
                        {doctor.specialty}
                      </p>
                      <p className="text-[11px] text-[#86868b] mt-0.5">
                        {doctor.qualifications} • {doctor.experienceYears} yrs exp
                      </p>
                    </div>
                  </div>

                  <DoctorPresenceBadge
                    status={doctor.cabinStatus}
                    steppedOutUntil={doctor.steppedOutUntil}
                    size="sm"
                  />
                </div>

                {/* Clinic & Timing Info */}
                <div className="flex items-center justify-between text-xs text-[#7a7a7a] pt-1 border-t border-[#f0f0f0]">
                  <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                    <MapPin className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                    <span className="truncate">
                      {primaryClinic} {city ? `• ${city}` : ''}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-[#1d1d1f]">
                      ₹{doctor.consultationFee || 500}
                    </span>
                    <span className="text-[10px] text-[#86868b] ml-1">Fee</span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-2 pt-1">
                  <AppleButton
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onQuickBook(doctor);
                    }}
                  >
                    Book Visit
                  </AppleButton>

                  <button
                    onClick={() => onSelectDoctor(doctor)}
                    className="p-2 rounded-full bg-[#f5f5f7] text-[#1d1d1f] active:bg-[#e5e5ea]"
                  >
                    <ChevronRight className="w-4 h-4 text-[#86868b]" />
                  </button>
                </div>
              </AppleCard>
            );
          })
        )}
      </div>
    </div>
  );
};
