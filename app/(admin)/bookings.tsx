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

// Keep colors consistent with existing theme requirements
const bookingStatusColors: any = {
   "Approved": { bg: "bg-indigo-950", text: "text-indigo-400", border: "border-indigo-900" },
   "Service Completed": { bg: "bg-emerald-950", text: "text-emerald-400", border: "border-emerald-900" },
   "Cancelled": { bg: "bg-rose-950", text: "text-rose-400", border: "border-rose-900" },
   "Call Verified": { bg: "bg-sky-950", text: "text-sky-400", border: "border-sky-900" },
   "Booked": { bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700" },
};

const apptStatusColors: any = {
   "Appointment Booked": { bg: "bg-blue-950", text: "text-blue-400", border: "border-blue-900" },
   "Confirmed": { bg: "bg-emerald-950", text: "text-emerald-400", border: "border-emerald-900" },
   "In Progress": { bg: "bg-orange-950", text: "text-orange-400", border: "border-orange-900" },
   "Completed": { bg: "bg-green-950", text: "text-green-400", border: "border-green-900" },
   "Cancelled": { bg: "bg-rose-950", text: "text-rose-400", border: "border-rose-900" },
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
         <View className="flex-1 bg-slate-950 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
         </View>
      );
   }

   return (
      <SafeAreaView className="flex-1 bg-slate-950">
         {/* ── HEADER ── */}
         <View className="border-b border-white/5">
            <View className="px-6 pt-10 pb-4 flex-row justify-between items-center">
               <Text className="text-white text-[22px] font-black uppercase tracking-tight">Reservations</Text>
               <TouchableOpacity
                  onPress={() => router.push(activeTab === 'appointment' ? '/(adminPages)/add-appointment' as any : '/(adminPages)/add-booking' as any)}
                  className="w-10 h-10 rounded-xl items-center justify-center shadow-md bg-white border border-white/10"
               >
                  <Ionicons name="add" size={24} color="black" />
               </TouchableOpacity>
            </View>

            {/* TABS */}
            <View className="px-6 pb-4 flex-row gap-3">
               {(['booking', 'appointment'] as const).map(tab => (
                  <TouchableOpacity
                     key={tab}
                     onPress={() => setActiveTab(tab)}
                     className={`flex-1 py-3.5 rounded-2xl items-center flex-row justify-center gap-2 border ${activeTab === tab ? 'bg-white border-white' : 'bg-white/5 border-white/10'}`}
                  >
                     <Ionicons
                        name={tab === 'booking' ? 'calendar-outline' : 'time-outline'}
                        size={14}
                        color={activeTab === tab ? 'black' : 'rgba(255,255,255,0.3)'}
                     />
                     <Text className={`font-black text-[10px] uppercase tracking-widest ${activeTab === tab ? 'text-black' : 'text-white/30'}`}>
                        {tab === 'booking' ? `Bookings (${bookings.length})` : `Appointments (${appointments.length})`}
                     </Text>
                  </TouchableOpacity>
               ))}
            </View>

            {/* SEARCH */}
            <View className="px-6 pb-4 flex-row gap-3">
               <View className="flex-1 bg-white/5 rounded-2xl flex-row items-center px-4 h-14 border border-white/10">
                  <Ionicons name="search" size={16} color="#475569" />
                  <TextInput
                     placeholder={activeTab === 'booking' ? 'Search booking ID, name...' : 'Search APT ID, name...'}
                     placeholderTextColor="#334155"
                     value={activeTab === 'booking' ? bookingSearch : apptSearch}
                     onChangeText={activeTab === 'booking' ? setBookingSearch : setApptSearch}
                     className="flex-1 ml-3 text-white font-semibold text-xs"
                  />
               </View>
               {activeTab === 'appointment' && (
                  <TouchableOpacity
                     onPress={() => setAssignFilter(prev => prev === 'all' ? 'unassigned' : prev === 'unassigned' ? 'assigned' : 'all')}
                     style={{ borderColor: assignFilter !== 'all' ? COLORS.primary : 'rgba(255,255,255,0.1)' }}
                     className="w-[52px] h-[52px] bg-white/5 rounded-2xl items-center justify-center border"
                  >
                     <Ionicons name="people-outline" size={20} color={assignFilter !== 'all' ? COLORS.primary : '#475569'} />
                  </TouchableOpacity>
               )}
            </View>
         </View>

         {/* ── BOOKINGS TAB ── */}
         {activeTab === 'booking' && (
            <ScrollView
               className="flex-1"
               contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
               showsVerticalScrollIndicator={false}
               refreshControl={<RefreshControl refreshing={bookingRefreshing} onRefresh={() => { setBookingRefreshing(true); fetchBookings(); }} tintColor={COLORS.primary} />}
            >
               {filteredBookings.length === 0 ? (
                  <View className="py-20 items-center bg-white/5 rounded-[32px] border border-dashed border-white/10">
                     <MaterialCommunityIcons name="calendar-blank" size={48} color="#1e293b" />
                     <Text className="text-white/10 font-black text-[10px] uppercase mt-4 tracking-[2px]">No bookings found</Text>
                  </View>
               ) : filteredBookings.map(b => {
                  const sc = bookingStatusColors[b.status] || bookingStatusColors['Booked'];
                  return (
                     <View key={b.id} className="mb-4 bg-slate-900 rounded-[28px] border border-white/5 overflow-hidden">
                        <View className="p-5">
                           <View className="flex-row justify-between items-start mb-4">
                              <View>
                                 <Text className="text-white/20 text-[9px] font-black uppercase tracking-[2px]">{b.bookingId || `#${b.id}`}</Text>
                                 <Text className="text-white text-[17px] font-black mt-0.5 uppercase tracking-tight">{b.name || 'Customer'}</Text>
                              </View>
                              <View className={`px-3 py-1.5 rounded-full border ${sc.bg} ${sc.border}`}>
                                 <Text className={`text-[8px] font-black uppercase tracking-widest ${sc.text}`}>{b.status}</Text>
                              </View>
                           </View>

                           <View className="flex-row gap-2 flex-wrap">
                              <View className="bg-white/5 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                                 <Ionicons name="car-outline" size={12} color={COLORS.primary} />
                                 <Text className="text-slate-400 text-[10px] font-bold uppercase">{b.brand} {b.model}</Text>
                              </View>
                              <View className="bg-white/5 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1.5">
                                 <Ionicons name="call-outline" size={12} color="#818cf8" />
                                 <Text className="text-slate-400 text-[10px] font-bold">{b.phone}</Text>
                              </View>
                           </View>
                        </View>

                        <View className="flex-row justify-between items-center px-5 py-3.5 bg-black/30 border-t border-white/5">
                           <View className="flex-row items-center gap-1.5">
                              <Ionicons name="time-outline" size={13} color="#475569" />
                              <Text className="text-slate-600 text-[9px] font-black uppercase">{new Date(b.created_at || b.createdAt).toLocaleDateString('en-GB')}</Text>
                           </View>
                           <TouchableOpacity
                              onPress={() => setStatusPopup({ type: 'status', booking: b })}
                              className="bg-white px-4 py-2.5 rounded-xl"
                           >
                              <Text className="text-black text-[9px] font-black uppercase tracking-widest">Update Status</Text>
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
               className="flex-1"
               contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
               showsVerticalScrollIndicator={false}
               refreshControl={<RefreshControl refreshing={apptRefreshing} onRefresh={() => { setApptRefreshing(true); fetchAppointments(); }} tintColor={COLORS.primary} />}
            >
               {filteredAppts.length === 0 ? (
                  <View className="py-20 items-center bg-white/5 rounded-[32px] border border-dashed border-white/10">
                     <MaterialCommunityIcons name="calendar-clock" size={48} color="#1e293b" />
                     <Text className="text-white/10 font-black text-[10px] uppercase mt-4 tracking-[2px]">No appointments found</Text>
                  </View>
               ) : filteredAppts.map(apt => {
                  const sc = apptStatusColors[apt.status || apt.serviceStatus || apt.appointmentStatus || 'Appointment Booked'] || apptStatusColors['Appointment Booked'];
                  const isAssigned = !!(apt.assignedEmployeeName || apt.assignedEmployeeId);
                  return (
                     <View key={apt.id || apt._id} className="mb-4 bg-slate-900 rounded-[28px] border border-white/5 overflow-hidden">
                        <View className="p-5">
                           {/* Row 1: ID + Status */}
                           <View className="flex-row justify-between items-start mb-3.5">
                              <View>
                                 <Text className="text-white/50 text-[10px] font-black uppercase tracking-widest">{apt.appointmentId || `APT-${apt.id}`}</Text>
                                 <Text className="text-white text-[17px] font-black mt-0.5 uppercase tracking-tight">{apt.name}</Text>
                                 <Text className="text-slate-500 text-[10px] font-bold mt-0.5">{apt.phone}</Text>
                              </View>
                              <View className="items-end gap-1.5">
                                 <View className={`px-2.5 py-1 rounded-full border ${sc.bg} ${sc.border}`}>
                                    <Text className={`text-[7px] font-black uppercase tracking-widest ${sc.text}`}>{(apt.status || apt.serviceStatus || apt.appointmentStatus || 'Appointment Booked')}</Text>
                                 </View>
                                 {apt.emergencyService && (
                                    <View className="bg-rose-950 px-2 py-1 rounded-lg border border-rose-900">
                                       <Text className="text-rose-500 text-[7px] font-black uppercase">URGENT</Text>
                                    </View>
                                 )}
                              </View>
                           </View>

                           {/* Row 2: Vehicle + Reg */}
                           <View className="bg-white/5 rounded-2xl p-3.5 mb-3 flex-row justify-between items-center">
                              <View className="flex-row items-center gap-2.5">
                                 <Ionicons name="car-outline" size={16} color={COLORS.primary} />
                                 <View>
                                    <Text className="text-white text-xs font-bold uppercase">{apt.brand} {apt.model}</Text>
                                    <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{apt.registrationNumber || apt.vehicleNumber || 'NO REG'}</Text>
                                 </View>
                              </View>
                              <View className="bg-sky-500/10 px-2.5 py-1.5 rounded-xl border border-sky-500/20">
                                 <Text className="text-white text-[10px] font-black">{apt.serviceType}</Text>
                              </View>
                           </View>

                           {/* Row 3: Schedule */}
                           <View className="flex-row gap-2.5 mb-3">
                              <View className="flex-1 flex-row items-center gap-1.5">
                                 <Ionicons name="calendar-outline" size={13} color="#64748b" />
                                 <Text className="text-slate-500 text-[10px] font-bold">{apt.preferredDate ? new Date(apt.preferredDate).toLocaleDateString('en-GB') : 'N/A'}</Text>
                              </View>
                              <View className="flex-1 flex-row items-center gap-1.5">
                                 <Ionicons name="time-outline" size={13} color="#64748b" />
                                 <Text className="text-slate-500 text-[10px] font-bold" numberOfLines={1}>{apt.preferredTimeSlot || 'N/A'}</Text>
                              </View>
                           </View>

                           {/* Row 4: Mechanic Assignment */}
                           <View className="flex-row items-center gap-2">
                              <View className={`w-7 h-7 rounded-full items-center justify-center border ${isAssigned ? 'bg-sky-500/15 border-sky-500/30' : 'bg-white/5 border-white/10'}`}>
                                 <Ionicons name={isAssigned ? 'person-outline' : 'person-add-outline'} size={13} color={isAssigned ? COLORS.primary : '#475569'} />
                              </View>
                              <Text className={`text-[11px] ${isAssigned ? 'text-slate-400 font-bold' : 'text-slate-600 font-semibold italic'}`}>
                                 {isAssigned ? apt.assignedEmployeeName : 'Unassigned'}
                              </Text>
                           </View>
                        </View>

                        {/* Footer Actions */}
                        <View className="flex-row px-5 py-3.5 bg-black/30 border-t border-white/5 gap-2.5">
                           <TouchableOpacity
                              onPress={() => openApptModal(apt)}
                              style={{ backgroundColor: COLORS.primary }}
                              className="flex-1 py-3 rounded-xl items-center"
                           >
                              <Text className="text-white text-[9px] font-black uppercase tracking-widest">Manage / Assign</Text>
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
            <View className="flex-1 bg-black/80 justify-end">
               <View className="bg-slate-900 rounded-t-[40px] p-8 pb-12 border-t border-white/10">
                  <View className="w-12 h-1.5 bg-white/10 rounded-full self-center mb-8" />

                  {statusPopup?.type === 'status' && (
                     <>
                        <Text className="text-white text-xl font-black uppercase text-center mb-6">Update Status</Text>
                        <View className="gap-2.5">
                           {BOOKING_STATUS.map(s => (
                              <TouchableOpacity
                                 key={s}
                                 onPress={() => handleBookingStatusChange(statusPopup.booking, s)}
                                 className={`p-4 rounded-2xl flex-row justify-between items-center border ${statusPopup.booking.status === s ? 'bg-white border-white' : 'bg-white/5 border-white/5'}`}
                              >
                                 <Text className={`font-black text-[10px] uppercase tracking-widest ${statusPopup.booking.status === s ? 'text-black' : 'text-white/40'}`}>{s}</Text>
                                 {statusPopup.booking.status === s && <Ionicons name="checkmark-circle" size={20} color="black" />}
                              </TouchableOpacity>
                           ))}
                        </View>
                     </>
                  )}

                  {statusPopup?.type === 'approved' && (
                     <>
                        <Text className="text-white text-xl font-black uppercase text-center mb-2">Authorize Booking</Text>
                        <Text className="text-white/20 text-[9px] uppercase tracking-[2px] text-center mb-6">Enter a tracking reference</Text>
                        <View className="bg-white/5 rounded-2xl border border-white/10 mb-4 h-[72px]">
                           <TextInput placeholder="TRACK NUMBER" placeholderTextColor="#334155" value={trackNumber} onChangeText={setTrackNumber} className="flex-1 px-5 color-white font-black text-base text-center uppercase" />
                        </View>
                        <TouchableOpacity onPress={() => updateBookingStatus(statusPopup!.booking, 'Approved', { trackNumber })} className="bg-white p-5 rounded-2xl items-center">
                           <Text className="text-black font-black uppercase tracking-widest text-[11px]">Confirm Approval</Text>
                        </TouchableOpacity>
                     </>
                  )}

                  {statusPopup?.type === 'cancel' && (
                     <>
                        <Text className="text-white text-xl font-black uppercase text-center mb-2">Cancel Booking</Text>
                        <Text className="text-rose-400 text-[9px] font-black uppercase tracking-widest text-center mb-6">Reason Required</Text>
                        <View className="bg-white/5 rounded-2xl border border-white/10 mb-4 min-h-[100px]">
                           <TextInput placeholder="DETAILED REASON" placeholderTextColor="#334155" value={cancelReason} onChangeText={setCancelReason} multiline numberOfLines={4} className="flex-1 p-5 text-white font-semibold text-xs leading-relaxed" style={{ textAlignVertical: 'top' }} />
                        </View>
                        <TouchableOpacity onPress={() => updateBookingStatus(statusPopup!.booking, 'Cancelled', { cancelReason })} className="bg-rose-500 p-5 rounded-2xl items-center">
                           <Text className="text-white font-black uppercase tracking-widest text-[11px]">Confirm Cancellation</Text>
                        </TouchableOpacity>
                     </>
                  )}

                  <TouchableOpacity onPress={() => { setStatusPopup(null); setTrackNumber(''); setCancelReason(''); }} className="mt-5 p-3 items-center">
                     <Text className="text-white/20 font-black text-[9px] uppercase tracking-widest">Dismiss</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         {/* ────────────────────────────
          APPOINTMENT MANAGE/ASSIGN MODAL
      ──────────────────────────── */}
         <Modal visible={!!selectedAppt} transparent animationType="slide">
            <View className="flex-1 bg-black/90 justify-end">
               <View className="bg-slate-900 rounded-t-[40px] border-t border-white/10 h-[92%] w-full">
                  {/* Modal Header */}
                  <View className="flex-row justify-between items-center px-7 pt-7 pb-5 border-b border-white/5">
                     <View className="flex-row items-center gap-3.5">
                        <View className="w-11 h-11 rounded-2xl bg-sky-500/15 items-center justify-center border border-sky-500/20">
                           <Ionicons name="construct-outline" size={20} color={COLORS.primary} />
                        </View>
                        <View>
                           <Text className="text-white text-base font-black uppercase tracking-tight">Appointment</Text>
                           <Text className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-0.5">{selectedAppt?.appointmentId || `APT-${selectedAppt?.id}`}</Text>
                        </View>
                     </View>
                     <TouchableOpacity onPress={() => { setSelectedAppt(null); setPendingChanges({}); }} className="w-9 h-9 rounded-full bg-white/10 items-center justify-center">
                        <Ionicons name="close" size={18} color="white" />
                     </TouchableOpacity>
                  </View>

                  <ScrollView className="flex-1" contentContainerStyle={{ padding: 28, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                     {/* Customer Info */}
                     <Text className="text-white/20 text-[9px] font-black uppercase tracking-[2px] mb-3">Customer Info</Text>
                     <View className="bg-white/5 rounded-2xl p-4 mb-6 gap-3 border border-white/5">
                        <View className="flex-row items-center gap-3">
                           <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"><Ionicons name="person-outline" size={14} color="#64748b" /></View>
                           <Text className="text-white text-sm font-bold">{selectedAppt?.name}</Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                           <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"><Ionicons name="call-outline" size={14} color="#818cf8" /></View>
                           <Text className="text-slate-400 text-[13px] font-semibold">{selectedAppt?.phone}</Text>
                        </View>
                        {selectedAppt?.address && (
                           <View className="flex-row items-start gap-3">
                              <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center mt-0.5"><Ionicons name="location-outline" size={14} color="#34d399" /></View>
                              <Text className="text-slate-400 text-xs flex-1 leading-5">{selectedAppt?.address}, {selectedAppt?.city} {selectedAppt?.pincode}</Text>
                           </View>
                        )}
                     </View>

                     {/* Vehicle Details */}
                     <Text className="text-white/20 text-[9px] font-black uppercase tracking-[2px] mb-3">Vehicle Details</Text>
                     <View className="flex-row flex-wrap gap-2 mb-6">
                        {[
                           { l: 'Type', v: selectedAppt?.vehicleType },
                           { l: 'Brand', v: selectedAppt?.brand },
                           { l: 'Model', v: selectedAppt?.model },
                           { l: 'Reg. No', v: selectedAppt?.registrationNumber },
                           { l: 'Fuel', v: selectedAppt?.fuelType },
                           { l: 'Year', v: selectedAppt?.yearOfManufacture },
                        ].map(item => (
                           <View key={item.l} className="w-[48%] bg-white/5 p-3.5 rounded-2xl border border-white/5">
                              <Text className="text-white/20 text-[8px] font-black uppercase tracking-widest mb-1">{item.l}</Text>
                              <Text className="text-white text-[13px] font-bold">{item.v || 'N/A'}</Text>
                           </View>
                        ))}
                     </View>

                     {/* Status Update */}
                     <Text className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-3">Service Management</Text>
                     <View className="bg-white/5 rounded-[20px] p-5 border border-white/5 mb-4">
                        <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2.5">Current Status</Text>
                        <View className="gap-2">
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
                                    className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${active ? 'bg-white border-white' : 'bg-white/5 border-white/5'}`}
                                 >
                                    <Text className={`font-black text-[10px] uppercase tracking-widest ${active ? 'text-black' : 'text-white/30'}`}>{s}</Text>
                                    {active && <Ionicons name="checkmark-circle" size={18} color="black" />}
                                 </TouchableOpacity>
                              );
                           })}
                        </View>
                     </View>

                     {/* Assign Technician */}
                     <View className={`bg-white/5 rounded-[20px] p-5 border mb-4 ${canAssign ? 'border-sky-500/20' : 'border-white/5'}`}>
                        <View className="flex-row justify-between items-center mb-3">
                           <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest">Assign Technician</Text>
                           {!canAssign && (
                              <View className="bg-orange-950 px-2 py-1 rounded-lg border border-orange-900">
                                 <Text className="text-orange-400 text-[7px] font-black uppercase tracking-widest">Invalid status for assignment</Text>
                              </View>
                           )}
                        </View>
                        <View className={`gap-2 ${canAssign ? 'opacity-100' : 'opacity-40'}`}>
                           {/* Unassigned option */}
                           <TouchableOpacity
                              disabled={!canAssign}
                              onPress={() => setPendingChanges((prev: any) => ({ ...prev, assignedEmployeeId: null, assignedEmployeeName: null }))}
                              className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${!(pendingChanges.assignedEmployeeId ?? (selectedAppt?.assignedEmployeeId || selectedAppt?.assignedEmployee?._id)) ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/5'}`}
                           >
                              <Text className="text-white/50 font-bold text-[11px] italic">Unassigned</Text>
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
                                    className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${selected ? 'bg-sky-500/15 border-sky-500/30' : 'bg-white/5 border-white/5'}`}
                                 >
                                    <View className="flex-row items-center gap-2.5">
                                       <View className="w-7 h-7 rounded-full bg-sky-500/10 items-center justify-center">
                                          <Text style={{ color: COLORS.primary }} className="text-[11px] font-black">{t.name?.charAt(0)?.toUpperCase()}</Text>
                                       </View>
                                       <Text className={`font-bold text-xs uppercase ${selected ? 'text-sky-500' : 'text-white/60'}`}>{t.name}</Text>
                                    </View>
                                    {selected && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
                                 </TouchableOpacity>
                              );
                           })}
                        </View>
                     </View>

                     {/* Time Slot */}
                     <View className="bg-white/5 rounded-[20px] p-5 border border-white/5 mb-4">
                        <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-3">Time Slot</Text>
                        <View className="gap-2">
                           {TIME_SLOTS.map(slot => {
                              const active = (pendingChanges.preferredTimeSlot ?? selectedAppt?.preferredTimeSlot) === slot;
                              return (
                                 <TouchableOpacity
                                    key={slot}
                                    onPress={() => setPendingChanges((prev: any) => ({ ...prev, preferredTimeSlot: slot }))}
                                    className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${active ? 'bg-white border-white' : 'bg-white/5 border-white/5'}`}
                                 >
                                    <Text className={`font-black text-[11px] uppercase tracking-widest ${active ? 'text-black' : 'text-white/30'}`}>{slot}</Text>
                                    {active && <Ionicons name="checkmark-circle" size={18} color="black" />}
                                 </TouchableOpacity>
                              );
                           })}
                        </View>
                     </View>

                     {/* Issue Description */}
                     {selectedAppt?.otherIssue && (
                        <View className="bg-amber-500/5 rounded-[20px] p-5 border border-amber-500/10 mb-4">
                           <Text className="text-amber-500 text-[9px] font-black uppercase tracking-widest mb-2">Customer Problem</Text>
                           <Text className="text-amber-400 text-[13px] italic leading-5">"{selectedAppt.otherIssue}"</Text>
                        </View>
                     )}
                  </ScrollView>

                  {/* Footer Actions */}
                  <View className="flex-row px-7 py-5 border-t border-white/5 gap-3">
                     <TouchableOpacity
                        onPress={() => { setSelectedAppt(null); setPendingChanges({}); }}
                        className="flex-1 py-4.5 rounded-2xl items-center bg-white/5 border border-white/10"
                     >
                        <Text className="text-white/40 font-black text-[10px] uppercase tracking-widest py-1">Cancel</Text>
                     </TouchableOpacity>
                     <TouchableOpacity
                        onPress={handleSaveChanges}
                        disabled={saving || Object.keys(pendingChanges).length === 0}
                        className={`flex-2 py-4.5 rounded-2xl items-center ${Object.keys(pendingChanges).length === 0 ? 'bg-white/10' : 'bg-white'} ${saving ? 'opacity-60' : 'opacity-100'}`}
                     >
                        {saving
                           ? <ActivityIndicator size="small" color="black" className="py-0.5" />
                           : <Text className={`font-black text-[10px] uppercase tracking-[2px] py-1 ${Object.keys(pendingChanges).length === 0 ? 'text-white/20' : 'text-black'}`}>Save Changes</Text>
                        }
                     </TouchableOpacity>
                  </View>
               </View>
            </View>
         </Modal>

      </SafeAreaView>
   );
}
