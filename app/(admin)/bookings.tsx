import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
   ActivityIndicator,
   Alert,
   Modal,
   RefreshControl,
   SafeAreaView, ScrollView,
   Text,
   TextInput,
   TouchableOpacity,
   View
} from 'react-native';
import { apiService } from '../../services/api';
import { COLORS } from '../../theme/colors';

/* ─── CONSTANTS ─── */
const BOOKING_STATUS = ["Booked", "Call Verified", "Approved", "Cancelled", "Service Completed"];
const APPT_STATUS = ["Appointment Booked", "Confirmed", "In Progress", "Completed", "Cancelled"];
const TIME_SLOTS = ["Morning (9AM–12PM)", "Afternoon (12PM–4PM)", "Evening (4PM–7PM)"];

const bookingStatusColors: any = {
   "Approved": { bg: "#1e1b4b", text: "#818cf8", border: "#312e81" },
   "Service Completed": { bg: "#064e3b", text: "#34d399", border: "#065f46" },
   "Cancelled": { bg: "#450a0a", text: "#f87171", border: "#7f1d1d" },
   "Call Verified": { bg: "#082f49", text: "#38bdf8", border: "#0c4a6e" },
   "Booked": { bg: "#1e293b", text: "#94a3b8", border: "#334155" },
};

const apptStatusColors: any = {
   "Appointment Booked": { bg: "#172554", text: "#60a5fa", border: "#1e3a8a" },
   "Confirmed": { bg: "#064e3b", text: "#34d399", border: "#065f46" },
   "In Progress": { bg: "#451a03", text: "#fb923c", border: "#7c2d12" },
   "Completed": { bg: "#052e16", text: "#4ade80", border: "#14532d" },
   "Cancelled": { bg: "#450a0a", text: "#f87171", border: "#7f1d1d" },
};

/* ─── MAIN COMPONENT ─── */
export default function AdminBookings() {
   const router = useRouter();
   const [activeTab, setActiveTab] = useState<'booking' | 'appointment'>('booking');

   /* Bookings state */
   const [bookings, setBookings] = useState<any[]>([]);
   const [bookingLoading, setBookingLoading] = useState(true);
   const [bookingRefreshing, setBookingRefreshing] = useState(false);
   const [bookingSearch, setBookingSearch] = useState('');
   const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
   const [statusPopup, setStatusPopup] = useState<{ booking: any; type: 'status' | 'approved' | 'cancel' } | null>(null);
   const [trackNumber, setTrackNumber] = useState('');
   const [cancelReason, setCancelReason] = useState('');

   /* Appointments state */
   const [appointments, setAppointments] = useState<any[]>([]);
   const [apptLoading, setApptLoading] = useState(true);
   const [apptRefreshing, setApptRefreshing] = useState(false);
   const [apptSearch, setApptSearch] = useState('');
   const [apptStatusFilter, setApptStatusFilter] = useState('all');
   const [assignFilter, setAssignFilter] = useState('all');
   const [technicians, setTechnicians] = useState<any[]>([]);
   const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
   const [pendingChanges, setPendingChanges] = useState<any>({});
   const [saving, setSaving] = useState(false);

   /* ─── DATA FETCHING ─── */
   const fetchBookings = async () => {
      try {
         const data = await apiService.getBookings();
         setBookings((data || []).sort((a: any, b: any) =>
            new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()
         ));
      } catch { Alert.alert('Error', 'Failed to load bookings'); }
      finally { setBookingLoading(false); setBookingRefreshing(false); }
   };

   const fetchAppointments = async () => {
      try {
         const [list, staffData] = await Promise.all([
            apiService.getAppointments(),
            apiService.getStaff(),
         ]);
         setAppointments([...list].sort((a: any, b: any) =>
            new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()
         ));
         setTechnicians((staffData || []).filter((s: any) =>
            ['mechanic', 'technician', 'employee', 'staff', 'technicians', 'mechanics'].includes(s.role?.toLowerCase())
         ));
      } catch (err: any) {
         console.error('fetchAppointments error:', err?.response?.status, err?.message);
      } finally {
         setApptLoading(false);
         setApptRefreshing(false);
      }
   };


   useEffect(() => { fetchBookings(); fetchAppointments(); }, []);


   /* ─── BOOKINGS LOGIC ─── */
   const filteredBookings = useMemo(() => bookings.filter(b => {
      const matchSearch =
         (b.bookingId || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
         (b.name || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
         (b.phone || '').includes(bookingSearch);
      const matchStatus = bookingStatusFilter === 'All' || b.status === bookingStatusFilter;
      return matchSearch && matchStatus;
   }), [bookings, bookingSearch, bookingStatusFilter]);

   const updateBookingStatus = async (booking: any, newStatus: string, extra = {}) => {
      try {
         const targetId = booking.id || booking._id;
         await apiService.api.put(`/bookings/${targetId}`, { status: newStatus, ...extra });
         setBookings(prev => prev.map(b => (b.id === targetId || b._id === targetId) ? { ...b, status: newStatus, ...extra } : b));
         Alert.alert('Updated', `Status → ${newStatus}`);
      } catch { Alert.alert('Error', 'Failed to update'); }
      finally { setStatusPopup(null); setTrackNumber(''); setCancelReason(''); }
   };

   const handleBookingStatusChange = (booking: any, s: string) => {
      if (booking.status === 'Service Completed') return;
      if (s === 'Approved') { setStatusPopup({ type: 'approved', booking }); return; }
      if (s === 'Cancelled') { setStatusPopup({ type: 'cancel', booking }); return; }
      updateBookingStatus(booking, s);
   };

   /* ─── APPOINTMENTS LOGIC ─── */
   const filteredAppts = useMemo(() => appointments.filter(a => {
      const search = apptSearch.toLowerCase();
      const matchSearch = !apptSearch ||
         (a.appointmentId || '').toLowerCase().includes(search) ||
         (a.id || '').toString().includes(search) ||
         (a._id || '').toString().includes(search) ||
         (a.name || '').toLowerCase().includes(search) ||
         (a.phone || '').includes(search) ||
         (a.brand || '').toLowerCase().includes(search) ||
         (a.model || '').toLowerCase().includes(search) ||
         (a.registrationNumber || a.vehicleNumber || '').toLowerCase().includes(search);

      const aStatus = (a.status || a.serviceStatus || a.appointmentStatus || '').toLowerCase();
      const matchStatus = apptStatusFilter === 'all' || aStatus.includes(apptStatusFilter.toLowerCase());

      const matchAssign = assignFilter === 'all' ||
         (assignFilter === 'assigned' ? !!(a.assignedEmployeeId || a.assignedEmployeeName) : !(a.assignedEmployeeId || a.assignedEmployeeName));
      return matchSearch && matchStatus && matchAssign;
   }), [appointments, apptSearch, apptStatusFilter, assignFilter]);

   const openApptModal = (apt: any) => {
      setSelectedAppt(apt);
      setPendingChanges({});
   };

   const handleSaveChanges = async () => {
      if (!selectedAppt || Object.keys(pendingChanges).length === 0) return;
      setSaving(true);
      try {
         const targetId = selectedAppt.id || selectedAppt._id;
         await apiService.api.put(`/appointments/${targetId}`, pendingChanges);
         setAppointments(prev => prev.map(a => (a.id === targetId || a._id === targetId) ? { ...a, ...pendingChanges } : a));
         Alert.alert('Success', 'Appointment updated successfully');
         setSelectedAppt(null);
         setPendingChanges({});
      } catch { Alert.alert('Error', 'Update failed'); }
      finally { setSaving(false); }
   };

   const currentStatus = pendingChanges.status ?? selectedAppt?.status;
   const canAssign = ['Appointment Booked', 'Confirmed', 'In Progress'].includes(currentStatus);

   /* ─── LOADING ─── */
   if (bookingLoading && apptLoading) {
      return (
         <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
         </View>
      );
   }

   return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>

         {/* ── HEADER ── */}
         <View style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
            <View style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 }}>Reservations</Text>
               <TouchableOpacity
                  onPress={() => router.push(activeTab === 'appointment' ? '/(adminPages)/add-appointment' as any : '/(adminPages)/add-booking' as any)}
                  style={{ width: 40, height: 40, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
               >
                  <Ionicons name="add" size={24} color="white" />
               </TouchableOpacity>
            </View>

            {/* TABS */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 16, flexDirection: 'row', gap: 12 }}>
               {(['booking', 'appointment'] as const).map(tab => (
                  <TouchableOpacity
                     key={tab}
                     onPress={() => setActiveTab(tab)}
                     style={{
                        flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center',
                        backgroundColor: activeTab === tab ? 'white' : 'rgba(255,255,255,0.05)',
                        borderWidth: 1, borderColor: activeTab === tab ? 'white' : 'rgba(255,255,255,0.1)',
                        flexDirection: 'row', justifyContent: 'center', gap: 8
                     }}
                  >
                     <Ionicons
                        name={tab === 'booking' ? 'calendar-outline' : 'time-outline'}
                        size={14}
                        color={activeTab === tab ? 'black' : 'rgba(255,255,255,0.3)'}
                     />
                     <Text style={{ color: activeTab === tab ? 'black' : 'rgba(255,255,255,0.3)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {tab === 'booking' ? `Bookings (${bookings.length})` : `Appointments (${appointments.length})`}
                     </Text>
                  </TouchableOpacity>
               ))}
            </View>

            {/* SEARCH */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 16, flexDirection: 'row', gap: 12 }}>
               <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                  <Ionicons name="search" size={16} color="#475569" />
                  <TextInput
                     placeholder={activeTab === 'booking' ? 'Search booking ID, name...' : 'Search APT ID, name...'}
                     placeholderTextColor="#334155"
                     value={activeTab === 'booking' ? bookingSearch : apptSearch}
                     onChangeText={activeTab === 'booking' ? setBookingSearch : setApptSearch}
                     style={{ flex: 1, marginLeft: 12, color: 'white', fontWeight: '600', fontSize: 13 }}
                  />
               </View>
               {activeTab === 'appointment' && (
                  <TouchableOpacity
                     onPress={() => setAssignFilter(prev => prev === 'all' ? 'unassigned' : prev === 'unassigned' ? 'assigned' : 'all')}
                     style={{ width: 52, height: 52, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: assignFilter !== 'all' ? COLORS.primary : 'rgba(255,255,255,0.08)' }}
                  >
                     <Ionicons name="people-outline" size={20} color={assignFilter !== 'all' ? COLORS.primary : '#475569'} />
                  </TouchableOpacity>
               )}
            </View>
         </View>

         {/* ── BOOKINGS TAB ── */}
         {activeTab === 'booking' && (
            <ScrollView
               style={{ flex: 1 }}
               contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
               showsVerticalScrollIndicator={false}
               refreshControl={<RefreshControl refreshing={bookingRefreshing} onRefresh={() => { setBookingRefreshing(true); fetchBookings(); }} tintColor={COLORS.primary} />}
            >
               {filteredBookings.length === 0 ? (
                  <View style={{ paddingVertical: 80, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 32, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)' }}>
                     <MaterialCommunityIcons name="calendar-blank" size={48} color="#1e293b" />
                     <Text style={{ color: 'rgba(255,255,255,0.15)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', marginTop: 16, letterSpacing: 2 }}>No bookings found</Text>
                  </View>
               ) : filteredBookings.map(b => {
                  const sc = bookingStatusColors[b.status] || bookingStatusColors['Booked'];
                  return (
                     <View key={b.id} style={{ marginBottom: 16, backgroundColor: '#0f172a', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <View style={{ padding: 20 }}>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                              <View>
                                 <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>{b.bookingId || `#${b.id}`}</Text>
                                 <Text style={{ color: 'white', fontSize: 17, fontWeight: '900', marginTop: 2, textTransform: 'uppercase', letterSpacing: -0.3 }}>{b.name || 'Customer'}</Text>
                              </View>
                              <View style={{ backgroundColor: sc.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: sc.border }}>
                                 <Text style={{ color: sc.text, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{b.status}</Text>
                              </View>
                           </View>

                           <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                 <Ionicons name="car-outline" size={12} color={COLORS.primary} />
                                 <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{b.brand} {b.model}</Text>
                              </View>
                              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                 <Ionicons name="call-outline" size={12} color="#818cf8" />
                                 <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700' }}>{b.phone}</Text>
                              </View>
                           </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(0,0,0,0.3)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' }}>
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Ionicons name="time-outline" size={13} color="#475569" />
                              <Text style={{ color: '#475569', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{new Date(b.created_at || b.createdAt).toLocaleDateString('en-GB')}</Text>
                           </View>
                           <TouchableOpacity
                              onPress={() => setStatusPopup({ type: 'status', booking: b })}
                              style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}
                           >
                              <Text style={{ color: 'black', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Update Status</Text>
                           </TouchableOpacity>
                        </View>
                     </View>
                  );
               })}
            </ScrollView>
         )}

         {/* ── APPOINTMENTS TAB ── */}
         {activeTab === 'appointment' && (
            <ScrollView
               style={{ flex: 1 }}
               contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
               showsVerticalScrollIndicator={false}
               refreshControl={<RefreshControl refreshing={apptRefreshing} onRefresh={() => { setApptRefreshing(true); fetchAppointments(); }} tintColor={COLORS.primary} />}
            >
               {filteredAppts.length === 0 ? (
                  <View style={{ paddingVertical: 80, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 32, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)' }}>
                     <MaterialCommunityIcons name="calendar-clock" size={48} color="#1e293b" />
                     <Text style={{ color: 'rgba(255,255,255,0.15)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', marginTop: 16, letterSpacing: 2 }}>No appointments found</Text>
                  </View>
               ) : filteredAppts.map(apt => {
                  const sc = apptStatusColors[apt.status || apt.serviceStatus || apt.appointmentStatus || 'Appointment Booked'] || apptStatusColors['Appointment Booked'];
                  const isAssigned = !!(apt.assignedEmployeeName || apt.assignedEmployeeId);
                  return (
                     <View key={apt.id || apt._id} style={{ marginBottom: 16, backgroundColor: '#0f172a', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <View style={{ padding: 20 }}>
                           {/* Row 1: ID + Status */}
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                              <View>
                                 <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>{apt.appointmentId || `APT-${apt.id}`}</Text>
                                 <Text style={{ color: 'white', fontSize: 17, fontWeight: '900', marginTop: 2, textTransform: 'uppercase', letterSpacing: -0.3 }}>{apt.name}</Text>
                                 <Text style={{ color: '#475569', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{apt.phone}</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                 <View style={{ backgroundColor: sc.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: sc.border }}>
                                    <Text style={{ color: sc.text, fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{(apt.status || apt.serviceStatus || apt.appointmentStatus || 'Appointment Booked')}</Text>
                                 </View>
                                 {apt.emergencyService && (
                                    <View style={{ backgroundColor: '#450a0a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#7f1d1d' }}>
                                       <Text style={{ color: '#f87171', fontSize: 7, fontWeight: '900', textTransform: 'uppercase' }}>URGENT</Text>
                                    </View>
                                 )}
                              </View>
                           </View>

                           {/* Row 2: Vehicle + Reg */}
                           <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                 <Ionicons name="car-outline" size={16} color={COLORS.primary} />
                                 <View>
                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{apt.brand} {apt.model}</Text>
                                    <Text style={{ color: '#475569', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{apt.registrationNumber || apt.vehicleNumber || 'NO REG'}</Text>
                                 </View>
                              </View>
                              <View style={{ backgroundColor: 'rgba(14,165,233,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(14,165,233,0.2)' }}>
                                 <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{apt.serviceType}</Text>
                              </View>
                           </View>

                           {/* Row 3: Schedule */}
                           <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                 <Ionicons name="calendar-outline" size={13} color="#64748b" />
                                 <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700' }}>{apt.preferredDate ? new Date(apt.preferredDate).toLocaleDateString('en-GB') : 'N/A'}</Text>
                              </View>
                              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                 <Ionicons name="time-outline" size={13} color="#64748b" />
                                 <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700' }} numberOfLines={1}>{apt.preferredTimeSlot || 'N/A'}</Text>
                              </View>
                           </View>

                           {/* Row 4: Mechanic Assignment */}
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isAssigned ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isAssigned ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.08)' }}>
                                 <Ionicons name={isAssigned ? 'person-outline' : 'person-add-outline'} size={13} color={isAssigned ? COLORS.primary : '#475569'} />
                              </View>
                              <Text style={{ color: isAssigned ? '#94a3b8' : '#475569', fontSize: 11, fontWeight: isAssigned ? '700' : '600', fontStyle: isAssigned ? 'normal' : 'italic' }}>
                                 {isAssigned ? apt.assignedEmployeeName : 'Unassigned'}
                              </Text>
                           </View>
                        </View>

                        {/* Footer Actions */}
                        <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(0,0,0,0.3)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', gap: 10 }}>
                           <TouchableOpacity
                              onPress={() => openApptModal(apt)}
                              style={{ flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
                           >
                              <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>Manage / Assign</Text>
                           </TouchableOpacity>
                        </View>
                     </View>
                  );
               })}
            </ScrollView>
         )}

         {/* ────────────────────────────
          BOOKING STATUS MODAL
      ──────────────────────────── */}
         <Modal visible={!!statusPopup} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
               <View style={{ backgroundColor: '#0f172a', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingBottom: 52, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
                  <View style={{ width: 48, height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, alignSelf: 'center', marginBottom: 32 }} />

                  {statusPopup?.type === 'status' && (
                     <>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: 24 }}>Update Status</Text>
                        <View style={{ gap: 10 }}>
                           {BOOKING_STATUS.map(s => (
                              <TouchableOpacity
                                 key={s}
                                 onPress={() => handleBookingStatusChange(statusPopup.booking, s)}
                                 style={{ padding: 18, borderRadius: 18, backgroundColor: statusPopup.booking.status === s ? 'white' : 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: statusPopup.booking.status === s ? 'white' : 'rgba(255,255,255,0.06)' }}
                              >
                                 <Text style={{ color: statusPopup.booking.status === s ? 'black' : 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{s}</Text>
                                 {statusPopup.booking.status === s && <Ionicons name="checkmark-circle" size={20} color="black" />}
                              </TouchableOpacity>
                           ))}
                        </View>
                     </>
                  )}

                  {statusPopup?.type === 'approved' && (
                     <>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>Authorize Booking</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 24 }}>Enter a tracking reference</Text>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 }}>
                           <TextInput placeholder="TRACK NUMBER" placeholderTextColor="#334155" value={trackNumber} onChangeText={setTrackNumber} style={{ padding: 20, color: 'white', fontWeight: '900', fontSize: 16, textAlign: 'center', textTransform: 'uppercase' }} />
                        </View>
                        <TouchableOpacity onPress={() => updateBookingStatus(statusPopup!.booking, 'Approved', { trackNumber })} style={{ backgroundColor: 'white', padding: 20, borderRadius: 20, alignItems: 'center' }}>
                           <Text style={{ color: 'black', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}>Confirm Approval</Text>
                        </TouchableOpacity>
                     </>
                  )}

                  {statusPopup?.type === 'cancel' && (
                     <>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>Cancel Booking</Text>
                        <Text style={{ color: '#f87171', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 24 }}>Reason Required</Text>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 }}>
                           <TextInput placeholder="DETAILED REASON" placeholderTextColor="#334155" value={cancelReason} onChangeText={setCancelReason} multiline numberOfLines={4} style={{ padding: 20, color: 'white', fontWeight: '600', fontSize: 13, minHeight: 100, textAlignVertical: 'top' }} />
                        </View>
                        <TouchableOpacity onPress={() => updateBookingStatus(statusPopup!.booking, 'Cancelled', { cancelReason })} style={{ backgroundColor: '#ef4444', padding: 20, borderRadius: 20, alignItems: 'center' }}>
                           <Text style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}>Confirm Cancellation</Text>
                        </TouchableOpacity>
                     </>
                  )}

                  <TouchableOpacity onPress={() => { setStatusPopup(null); setTrackNumber(''); setCancelReason(''); }} style={{ marginTop: 20, padding: 14, alignItems: 'center' }}>
                     <Text style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2 }}>Dismiss</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         {/* ────────────────────────────
          APPOINTMENT MANAGE/ASSIGN MODAL
      ──────────────────────────── */}
         <Modal visible={!!selectedAppt} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
               <View style={{ backgroundColor: '#0f172a', borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', height: '92%', width: '100%' }}>
                  {/* Modal Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, paddingTop: 28, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(14,165,233,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(14,165,233,0.2)' }}>
                           <Ionicons name="construct-outline" size={20} color={COLORS.primary} />
                        </View>
                        <View>
                           <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', textTransform: 'uppercase' }}>Appointment</Text>
                           <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>{selectedAppt?.appointmentId || `APT-${selectedAppt?.id}`}</Text>
                        </View>
                     </View>
                     <TouchableOpacity onPress={() => { setSelectedAppt(null); setPendingChanges({}); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="close" size={18} color="white" />
                     </TouchableOpacity>
                  </View>

                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

                     {/* Customer Info */}
                     <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Customer Info</Text>
                     <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, marginBottom: 24, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                           <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="person-outline" size={14} color="#64748b" /></View>
                           <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{selectedAppt?.name}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                           <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="call-outline" size={14} color="#818cf8" /></View>
                           <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>{selectedAppt?.phone}</Text>
                        </View>
                        {selectedAppt?.address && (
                           <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}><Ionicons name="location-outline" size={14} color="#34d399" /></View>
                              <Text style={{ color: '#94a3b8', fontSize: 12, flex: 1, lineHeight: 18 }}>{selectedAppt?.address}, {selectedAppt?.city} {selectedAppt?.pincode}</Text>
                           </View>
                        )}
                     </View>

                     {/* Vehicle Details */}
                     <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Vehicle Details</Text>
                     <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                        {[
                           { l: 'Type', v: selectedAppt?.vehicleType },
                           { l: 'Brand', v: selectedAppt?.brand },
                           { l: 'Model', v: selectedAppt?.model },
                           { l: 'Reg. No', v: selectedAppt?.registrationNumber },
                           { l: 'Fuel', v: selectedAppt?.fuelType },
                           { l: 'Year', v: selectedAppt?.yearOfManufacture },
                        ].map(item => (
                           <View key={item.l} style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                              <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{item.l}</Text>
                              <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>{item.v || 'N/A'}</Text>
                           </View>
                        ))}
                     </View>

                     {/* Status Update */}
                     <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Service Management</Text>
                     <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Current Status</Text>
                        <View style={{ gap: 8 }}>
                           {APPT_STATUS.map(s => {
                              const active = currentStatus === s;
                              return (
                                 <TouchableOpacity
                                    key={s}
                                    onPress={() => {
                                       const update: any = { status: s };
                                       if (s === 'Cancelled') { update.assignedEmployeeId = null; update.assignedEmployeeName = null; }
                                       setPendingChanges((prev: any) => ({ ...prev, ...update }));
                                    }}
                                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: active ? 'white' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: active ? 'white' : 'rgba(255,255,255,0.06)' }}
                                 >
                                    <Text style={{ color: active ? 'black' : 'rgba(255,255,255,0.35)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{s}</Text>
                                    {active && <Ionicons name="checkmark-circle" size={18} color="black" />}
                                 </TouchableOpacity>
                              );
                           })}
                        </View>
                     </View>

                     {/* Assign Technician */}
                     <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: canAssign ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.06)', marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                           <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Assign Technician</Text>
                           {!canAssign && (
                              <View style={{ backgroundColor: '#451a03', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                 <Text style={{ color: '#fb923c', fontSize: 7, fontWeight: '900', textTransform: 'uppercase' }}>Invalid status for assignment</Text>
                              </View>
                           )}
                        </View>
                        <View style={{ gap: 8, opacity: canAssign ? 1 : 0.4 }}>
                           {/* Unassigned option */}
                           <TouchableOpacity
                              disabled={!canAssign}
                              onPress={() => setPendingChanges((prev: any) => ({ ...prev, assignedEmployeeId: null, assignedEmployeeName: null }))}
                              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: !(pendingChanges.assignedEmployeeId ?? (selectedAppt?.assignedEmployeeId || selectedAppt?.assignedEmployee?._id)) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
                           >
                              <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 11, fontStyle: 'italic' }}>Unassigned</Text>
                              {!(pendingChanges.assignedEmployeeId ?? (selectedAppt?.assignedEmployeeId || selectedAppt?.assignedEmployee?._id)) && <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.5)" />}
                           </TouchableOpacity>
                           {technicians.map((t: any) => {
                              const tId = t.id || t._id;
                              const selected = (pendingChanges.assignedEmployeeId ?? (selectedAppt?.assignedEmployeeId || selectedAppt?.assignedEmployee?._id)) === tId;
                              return (
                                 <TouchableOpacity
                                    key={tId}
                                    disabled={!canAssign}
                                    onPress={() => setPendingChanges((prev: any) => ({ ...prev, assignedEmployeeId: tId, assignedEmployeeName: t.name }))}
                                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: selected ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: selected ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.06)' }}
                                 >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                       <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(14,165,233,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                          <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: '900' }}>{t.name?.charAt(0)?.toUpperCase()}</Text>
                                       </View>
                                       <Text style={{ color: selected ? COLORS.primary : 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 12 }}>{t.name}</Text>
                                    </View>
                                    {selected && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
                                 </TouchableOpacity>
                              );
                           })}
                        </View>
                     </View>

                     {/* Time Slot */}
                     <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Time Slot</Text>
                        <View style={{ gap: 8 }}>
                           {TIME_SLOTS.map(slot => {
                              const active = (pendingChanges.preferredTimeSlot ?? selectedAppt?.preferredTimeSlot) === slot;
                              return (
                                 <TouchableOpacity
                                    key={slot}
                                    onPress={() => setPendingChanges((prev: any) => ({ ...prev, preferredTimeSlot: slot }))}
                                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: active ? 'white' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: active ? 'white' : 'rgba(255,255,255,0.06)' }}
                                 >
                                    <Text style={{ color: active ? 'black' : 'rgba(255,255,255,0.35)', fontWeight: '700', fontSize: 11 }}>{slot}</Text>
                                    {active && <Ionicons name="checkmark-circle" size={18} color="black" />}
                                 </TouchableOpacity>
                              );
                           })}
                        </View>
                     </View>

                     {/* Issue Description */}
                     {selectedAppt?.otherIssue && (
                        <View style={{ backgroundColor: 'rgba(251,191,36,0.05)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(251,191,36,0.1)', marginBottom: 16 }}>
                           <Text style={{ color: '#f59e0b', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Customer Problem</Text>
                           <Text style={{ color: '#fbbf24', fontSize: 13, fontStyle: 'italic', lineHeight: 20 }}>"{selectedAppt.otherIssue}"</Text>
                        </View>
                     )}
                  </ScrollView>

                  {/* Footer Actions */}
                  <View style={{ flexDirection: 'row', paddingHorizontal: 28, paddingVertical: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', gap: 12 }}>
                     <TouchableOpacity
                        onPress={() => { setSelectedAppt(null); setPendingChanges({}); }}
                        style={{ flex: 1, paddingVertical: 18, borderRadius: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                     >
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>Cancel</Text>
                     </TouchableOpacity>
                     <TouchableOpacity
                        onPress={handleSaveChanges}
                        disabled={saving || Object.keys(pendingChanges).length === 0}
                        style={{ flex: 2, paddingVertical: 18, borderRadius: 20, alignItems: 'center', backgroundColor: Object.keys(pendingChanges).length === 0 ? 'rgba(255,255,255,0.1)' : 'white', opacity: saving ? 0.6 : 1 }}
                     >
                        {saving
                           ? <ActivityIndicator size="small" color="black" />
                           : <Text style={{ color: Object.keys(pendingChanges).length === 0 ? 'rgba(255,255,255,0.2)' : 'black', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 }}>Save Changes</Text>
                        }
                     </TouchableOpacity>
                  </View>
               </View>
            </View>
         </Modal>

      </SafeAreaView>
   );
}
