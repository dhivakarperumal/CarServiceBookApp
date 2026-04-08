import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api, apiService, Vehicle } from '../../services/api';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from "../../contexts/AuthContext";

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export default function VehiclesScreen() {
   const [vehicles, setVehicles] = useState<Vehicle[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [filterType, setFilterType] = useState("all");
   const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
   const [selectedImage, setSelectedImage] = useState<string | null>(null);
   const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
   const [bookingInProgress, setBookingInProgress] = useState<number | null>(null);
   const { user } = useAuth();

   useEffect(() => {
      fetchVehicles();
   }, []);

   const fetchVehicles = async () => {
      try {
         setLoading(true);
         const data = await apiService.getVehicles();
         // Ensure we display all vehicles when not specifically published
         setVehicles(data || []);
      } catch (error: any) {
         if (error?.response?.status === 404) {
            setVehicles([]);
         } else {
            console.error('Error fetching vehicles:', error);
         }
      } finally {
         setLoading(false);
      }
   };

   const filteredVehicles = useMemo(() => {
      return vehicles.filter(v => {
         const vAny = v as any;
         const typeStr = vAny.type || 'Car';

         const searchMatch =
            (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (vAny.brand || '').toLowerCase().includes(search.toLowerCase()) ||
            (v.model || '').toLowerCase().includes(search.toLowerCase());

         const statusMatch = filterType === "all" || typeStr.toLowerCase() === filterType.toLowerCase();

         return searchMatch && statusMatch;
      });
   }, [vehicles, search, filterType]);

   const parseImages = (imageString: string | undefined | null) => {
      if (!imageString) return [];
      try {
         const images = JSON.parse(imageString);
         if (typeof images === 'object' && !Array.isArray(images)) {
            return Object.values(images).filter(url => typeof url === 'string') as string[];
         }
         return Array.isArray(images) ? images : [imageString];
      } catch {
         return [imageString];
      }
   };

   const formatPrice = (price: any) => {
      const numericPart = String(price).replace(/[^0-9.]/g, '');
      return numericPart ? parseFloat(numericPart).toLocaleString('en-IN') : '0.00';
   };

   const handleBookNow = async (vehicle: Vehicle) => {
      if (!user) {
         Alert.alert("Login Required", "Please login to book vehicle");
         return;
      }
      try {
         setBookingInProgress(vehicle.id);

         const v = vehicle as any;
         const advanceAmount = Number(v.advance_amount_paid || 5000);
         const amountPaise = Math.round(advanceAmount * 100);

         const options = {
            description: `Advance Payment for ${v.brand || 'Vehicle'} ${vehicle.model}`,
            image: 'https://cars.qtechx.com/logo.png',
            currency: 'INR',
            key: 'rzp_test_SGj8n5SyKSE10b',
            amount: amountPaise,
            name: 'Car Store Booking',
            theme: { color: '#0EA5E9' },
            prefill: {
               email: user?.email || '',
               contact: user?.mobile || user?.phone || '',
               name: user?.username || user?.name || ''
            }
         };

         if (!RazorpayCheckout || !RazorpayCheckout.open) {
            Alert.alert(
               "Action Required",
               "Razorpay requires a native build ('npx expo run:android'). Simulating a successful booking for testing in Expo Go."
            );
            const bookingData = {
               uid: user.id?.toString(),
               customerName: user.username || user.name,
               customerPhone: user.mobile || user.phone,
               customerEmail: user.email,
               vehicleId: vehicle.id,
               vehicleName: `${v.brand || ''} ${vehicle.model || ''}`,
               vehicleType: v.type || "Vehicle",
               paymentMethod: "ONLINE_RAZORPAY_MOCK",
               paymentStatus: "Paid",
               paymentId: "pay_mock_" + Math.floor(Math.random() * 1000000),
               status: "Booked",
               advanceAmount: advanceAmount,
               pickupAddress: `Vehicle Pickup at ${v.city || 'Store'}, ${v.pincode || ''}`
            };

            await api.post("/vehicle-bookings", bookingData);
            Alert.alert("Success", "Simulated Booking completed!");
            setSelectedVehicle(null);
            fetchVehicles();
            setBookingInProgress(null);
            return;
         }

         const paymentData = await RazorpayCheckout.open(options);

         if (paymentData.razorpay_payment_id) {
            // Create Booking tracking directly on backend
            const bookingData = {
               uid: user.id?.toString(),
               customerName: user.username || user.name,
               customerPhone: user.mobile || user.phone,
               customerEmail: user.email,
               vehicleId: vehicle.id,
               vehicleName: `${v.brand || ''} ${vehicle.model || ''}`,
               vehicleType: v.type || "Vehicle",
               paymentMethod: "ONLINE_RAZORPAY",
               paymentStatus: "Paid",
               paymentId: paymentData.razorpay_payment_id,
               status: "Booked",
               advanceAmount: advanceAmount,
               pickupAddress: `Vehicle Pickup at ${v.city || 'Store'}, ${v.pincode || ''}`
            };

            await api.post("/vehicle-bookings", bookingData);
            Alert.alert("Success", `Vehicle Booking successful! Options Paid! ID: ${paymentData.razorpay_payment_id}`);
            setSelectedVehicle(null);
            fetchVehicles(); // Refresh listings to mark it as sold out
         }
      } catch (error: any) {
         console.error("Payment error:", error);
         if (error.code !== 0 && error.code !== "0") {
            Alert.alert("Payment Error", error.description || "Failed to process payment.");
         } else {
            Alert.alert("Payment Cancelled", "You have cancelled the Razorpay payment.");
         }
      } finally {
         setBookingInProgress(null);
      }
   };

   const renderVehicleItem = ({ item }: { item: Vehicle }) => {
      const v = item as any;
      const type = v.type || 'Car';
      const images = parseImages(item.image || v.images);
      const mainImage = images[0];
      const isBooked = v.status === "booked";

      return (
         <View
            className={`w-[48%] bg-[#111827] rounded-[18px] mb-5 p-2.5 border border-[#0EA5E9]/20 overflow-hidden ${isBooked ? 'opacity-70' : ''}`}
         >
            {/* Image Area */}
            <View className="h-[110px] bg-[#1F2937] relative w-full overflow-hidden rounded-xl mb-2.5">
               {mainImage ? (
                  <Image
                     source={{ uri: mainImage.startsWith('http') ? mainImage : `https://cars.qtechx.com/${mainImage}` }}
                     className="w-full h-full"
                     resizeMode="cover"
                  />
               ) : (
                  <View className="flex-1 justify-center items-center">
                     <Text className="text-gray-400 text-xs">No Image Available</Text>
                  </View>
               )}

               {/* Badges */}
               <View className="absolute top-2 right-2">
                  {isBooked ? (
                     <View className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 flex-row items-center gap-1">
                        <Ionicons name="close-circle" size={10} color="#fca5a5" />
                        <Text className="text-red-300 text-[9px] font-bold">Sold Out</Text>
                     </View>
                  ) : (
                     <View className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex-row items-center gap-1">
                        <Ionicons name="checkmark-circle" size={10} color="#6ee7b7" />
                        <Text className="text-emerald-300 text-[9px] font-bold">Available</Text>
                     </View>
                  )}
               </View>

               {/* Sold Out Full Overlay */}
               {isBooked && (
                  <View className="absolute inset-0 bg-black/50 justify-center items-center">
                     <View className="px-4 py-2 border-2 border-red-500 rounded-xl bg-black/60 shadow-xl" style={{ transform: [{ rotate: '-12deg' }] }}>
                        <Text className="text-xl font-black text-red-500 uppercase">Sold Out</Text>
                     </View>
                  </View>
               )}
            </View>

            <View className="px-1">
               <Text className="text-white font-bold text-[13px] mb-1" numberOfLines={2}>{item.name}</Text>

               <View className="flex-row items-center gap-1 mb-2">
                  <Text className="text-[9px] text-[#94A3B8] flex-1" numberOfLines={1}>{v.brand} {item.model}</Text>
                  <View className="bg-[#0EA5E9]/20 px-1.5 py-0.5 rounded">
                     <Text className="text-[8px] text-[#0EA5E9] font-bold uppercase">{type}</Text>
                  </View>
               </View>

               <View className="border-b border-[#1F2937] pb-2 mb-2">
                  <Text className="text-[17px] font-bold text-[#0EA5E9]">₹{formatPrice(v.expected_price || item.price)}</Text>
                  <View className="flex-row mt-0.5">
                     <Text className="text-[9px] text-[#64748B] tracking-wider">Adv: <Text className="font-bold text-[#0EA5E9]">₹{formatPrice(v.advance_amount_paid || 5000)}</Text></Text>
                  </View>
               </View>

               {/* Grid Quick Info */}
               <View className="flex-row flex-wrap mb-2">
                  <View className="w-1/2 flex-row items-center gap-1 mb-1">
                     <Ionicons name="calendar-outline" size={10} color="#0EA5E9" />
                     <Text className="text-[9px] text-[#94A3B8]">{v.yom || item.year || 'N/A'}</Text>
                  </View>
                  <View className="w-1/2 flex-row items-center gap-1 mb-1">
                     <Ionicons name="speedometer-outline" size={10} color="#0EA5E9" />
                     <Text className="text-[9px] text-[#94A3B8]">{v.km_driven || 0} km</Text>
                  </View>
                  <View className="w-1/2 flex-row items-center gap-1 mb-1">
                     <Ionicons name="water-outline" size={10} color="#0EA5E9" />
                     <Text className="text-[9px] text-[#94A3B8]">{v.fuel_type || 'N/A'}</Text>
                  </View>
                  <View className="w-1/2 flex-row items-center gap-1 mb-1">
                     <Ionicons name="settings-outline" size={10} color="#0EA5E9" />
                     <Text className="text-[9px] text-[#94A3B8]" numberOfLines={1}>{v.transmission || 'N/A'}</Text>
                  </View>
               </View>

               {/* Location */}
               <View className="flex-row items-center gap-1 mb-1">
                  <Ionicons name="location-outline" size={10} color="#0EA5E9" />
                  <Text className="text-[9px] text-[#94A3B8]" numberOfLines={1}>
                     {v.city}{v.area ? `, ${v.area}` : ""}
                  </Text>
               </View>

               {/* Actions */}
               <View className="gap-1.5 mt-2 mb-1">
                  {isBooked ? (
                     <View className="w-full py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 justify-center items-center">
                        <Text className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Sold Out</Text>
                     </View>
                  ) : (
                     <>
                        <TouchableOpacity
                           onPress={() => handleBookNow(item)}
                           disabled={bookingInProgress === item.id}
                           className="w-full rounded-lg overflow-hidden disabled:opacity-50"
                        >
                           <LinearGradient
                              colors={['#0EA5E9', '#2563EB']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              className="py-1.5 items-center justify-center w-full"
                           >
                              <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                                 {bookingInProgress === item.id ? "Processing..." : "Book Now"}
                              </Text>
                           </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                           onPress={() => setSelectedVehicle(item)}
                           className="w-full py-1.5 rounded-lg bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 items-center justify-center"
                        >
                           <Text className="text-[10px] font-bold text-[#0EA5E9] uppercase tracking-wider">View Details</Text>
                        </TouchableOpacity>
                     </>
                  )}
               </View>
            </View>
         </View>
      );
   };

   return (
      <SafeAreaView className="flex-1 bg-black">
         <View className="flex-1">



            {/* Search & Filters */}
            <View className="px-5 mb-5 mt-5 flex-row gap-3">
               <View className="flex-1 bg-white/10 border border-[#38bdf8]/30 rounded-xl px-4 h-12 flex-row items-center">
                  <Ionicons name="search" size={16} color="#9ca3af" />
                  <TextInput
                     value={search}
                     onChangeText={setSearch}
                     placeholder="Search brand, model, title..."
                     placeholderTextColor="#9ca3af"
                     className="flex-1 ml-2 text-white h-full text-sm"
                  />
               </View>
               <TouchableOpacity
                  onPress={() => setFilterType(prev => prev === 'all' ? 'car' : prev === 'car' ? 'bike' : 'all')}
                  className="bg-white/10 border border-[#38bdf8]/30 px-4 h-12 rounded-xl justify-center items-center"
               >
                  <Ionicons name="filter" size={16} color="#38bdf8" />
                  <Text className="text-[9px] font-black uppercase text-white mt-1">{filterType}</Text>
               </TouchableOpacity>
            </View>

            <View className="px-5 mb-4">
               <Text className="text-[#7dd3fc] font-semibold text-xs">
                  Found {filteredVehicles.length} vehicle(s)
               </Text>
            </View>

            {/* List */}
            {loading ? (
               <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#38bdf8" />
                  <Text className="text-gray-400 mt-4">Loading vehicles...</Text>
               </View>
            ) : (
               <FlatList
                  data={filteredVehicles}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderVehicleItem}
                  numColumns={2}
                  columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 50 }}
                  ListEmptyComponent={() => (
                     <View className="items-center py-20 px-5">
                        <Text className="text-gray-400 text-lg text-center font-medium">No vehicles found matching your criteria</Text>
                        <TouchableOpacity
                           onPress={() => { setSearch(""); setFilterType("all"); }}
                           className="mt-6 px-6 py-2.5 rounded-lg bg-[#38bdf8]"
                        >
                           <Text className="text-white font-bold">Clear Filters</Text>
                        </TouchableOpacity>
                     </View>
                  )}
               />
            )}
         </View>

         {/* Details Modal */}
         <Modal
            visible={!!selectedVehicle}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setSelectedVehicle(null)}
         >
            <View className="flex-1 bg-black">
               {selectedVehicle && (() => {
                  const v = selectedVehicle as any;
                  const images = parseImages(v.image || v.images);
                  const imageList = images.map(img => img.startsWith('http') ? img : `https://cars.qtechx.com/${img}`);
                  const mainImage = selectedImage || imageList[0];

                  return (
                     <>
                        {/* Modal Header */}
                        <View className="pt-12 pb-4 px-5 border-b border-[#38bdf8]/20 bg-slate-900 flex-row items-center justify-between z-10">
                           <View className="flex-1">
                              <Text className="text-xl font-bold text-white mb-0.5">{v.brand} {selectedVehicle.model}</Text>
                              <Text className="text-[#7dd3fc] text-[11px]" numberOfLines={1}>{selectedVehicle.name}</Text>
                           </View>
                           <TouchableOpacity onPress={() => setSelectedVehicle(null)} className="ml-4 p-2 bg-white/10 rounded-full">
                              <Ionicons name="close" size={20} color="#9ca3af" />
                           </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1 bg-slate-900" contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                           {/* Gallery */}
                           {imageList.length > 0 && (
                              <View className="mb-6">
                                 <TouchableOpacity
                                    className="w-full h-64 rounded-2xl bg-slate-800 overflow-hidden mb-3"
                                    activeOpacity={0.9}
                                    onPress={() => setFullscreenImage(mainImage)}
                                 >
                                    <Image source={{ uri: mainImage }} className="w-full h-full" resizeMode="cover" />
                                    <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded">
                                       <Text className="text-white text-[9px]"><Ionicons name="expand" size={8} /> Zoom</Text>
                                    </View>
                                 </TouchableOpacity>

                                 {imageList.length > 1 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                       {imageList.map((img, idx) => (
                                          <TouchableOpacity
                                             key={idx}
                                             onPress={() => setSelectedImage(img)}
                                             className={`w-16 h-16 rounded-xl overflow-hidden mr-2 border-2 ${selectedImage === img || (!selectedImage && idx === 0) ? 'border-[#38bdf8]' : 'border-slate-700'}`}
                                          >
                                             <Image source={{ uri: img }} className="w-full h-full" resizeMode="cover" />
                                          </TouchableOpacity>
                                       ))}
                                    </ScrollView>
                                 ) : null}
                              </View>
                           )}

                           {/* Price Block */}
                           <LinearGradient
                              colors={['rgba(14,165,233,0.15)', 'rgba(6,182,212,0.1)', 'rgba(14,165,233,0.15)']}
                              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                              style={{ borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)' }}
                           >
                              <View className="flex-row justify-between items-end">
                                 <View>
                                    <Text className="text-gray-300 text-[10px] uppercase tracking-wider mb-1">Expected Price</Text>
                                    <Text className="text-3xl font-bold text-[#7dd3fc]">₹{formatPrice(v.expected_price || selectedVehicle.price)}</Text>
                                    {v.negotiable ? <Text className="text-amber-400 text-[9px] mt-1 font-semibold">Negotiable Price</Text> : null}
                                 </View>
                                 <View className="items-end">
                                    <Text className="text-gray-300 text-[9px] uppercase tracking-wider mb-1">Advance Booking</Text>
                                    <View className="bg-[#0ea5e9]/20 px-3 py-1.5 rounded-lg border border-[#38bdf8]/40">
                                       <Text className="text-[#7dd3fc] font-bold text-sm">₹{formatPrice(v.advance_amount_paid || 5000)}</Text>
                                    </View>
                                 </View>
                              </View>
                           </LinearGradient>

                           {/* Tech Specs Grid */}
                           <View className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 mb-6">
                              <Text className="text-white text-base font-bold mb-4 flex-row items-center">
                                 <Ionicons name="settings" size={16} color="#38bdf8" /> Technical Specs
                              </Text>
                              <View className="flex-row flex-wrap justify-between gap-y-3">
                                 {[
                                    { label: 'Engine', val: `${v.engine_cc || 'N/A'} CC`, icon: 'hardware-chip' },
                                    { label: 'Fuel', val: v.fuel_type || 'N/A', icon: 'water' },
                                    { label: 'Trans', val: v.transmission || 'N/A', icon: 'git-network' },
                                    { label: 'Mileage', val: `${v.mileage || 'N/A'}`, icon: 'speedometer' },
                                    { label: 'Driven', val: `${v.km_driven || 0} km`, icon: 'analytics' },
                                    { label: 'Owners', val: v.owners || 'N/A', icon: 'people' },
                                    { label: 'Reg Year', val: v.reg_year || v.yom || 'N/A', icon: 'calendar' },
                                    { label: 'Loan', val: v.loan_status || 'Clear', icon: 'card' }
                                 ].map((item, idx) => (
                                    <View key={idx} className="w-[48%] bg-slate-700/50 p-3 rounded-xl flex-row items-center gap-2">
                                       <Ionicons name={item.icon as any} size={18} color="#9ca3af" />
                                       <View>
                                          <Text className="text-[9px] text-gray-400 uppercase tracking-wider">{item.label}</Text>
                                          <Text className="text-white font-semibold text-xs mt-0.5">{item.val}</Text>
                                       </View>
                                    </View>
                                 ))}
                              </View>
                           </View>

                           {/* Location */}
                           <View className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 mb-6">
                              <Text className="text-white text-base font-bold mb-4 flex-row items-center">
                                 <Ionicons name="location" size={16} color="#fb923c" /> Location
                              </Text>
                              <View className="flex-row gap-4">
                                 <View className="flex-1">
                                    <Text className="text-gray-400 text-[10px] mb-1">City</Text>
                                    <Text className="text-white font-semibold">{v.city || 'N/A'}</Text>
                                 </View>
                                 <View className="flex-1">
                                    <Text className="text-gray-400 text-[10px] mb-1">Area</Text>
                                    <Text className="text-white font-semibold">{v.area || 'N/A'}</Text>
                                 </View>
                              </View>
                           </View>
                        </ScrollView>

                        {/* Sticky Footer */}
                        <View className="absolute bottom-0 w-full p-5 bg-slate-900 border-t border-[#38bdf8]/20 flex-row gap-3 shadow-2xl">
                           <TouchableOpacity
                              onPress={() => setSelectedVehicle(null)}
                              className="flex-1 py-3.5 rounded-xl border border-gray-600 justify-center items-center"
                           >
                              <Text className="text-white font-semibold">Close</Text>
                           </TouchableOpacity>
                           <TouchableOpacity
                              disabled={v.status === 'booked' || bookingInProgress === selectedVehicle.id}
                              onPress={() => handleBookNow(selectedVehicle)}
                              className="flex-1 rounded-xl overflow-hidden disabled:opacity-50"
                           >
                              <LinearGradient
                                 colors={['#0ea5e9', '#06b6d4']}
                                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                 className="w-full h-full justify-center items-center py-3.5"
                              >
                                 <Text className="text-white font-bold text-sm">
                                    {bookingInProgress === selectedVehicle.id ? "Processing..." : "Book Now"}
                                 </Text>
                              </LinearGradient>
                           </TouchableOpacity>
                        </View>
                     </>
                  );
               })()}
            </View>
         </Modal>

         {/* Fullscreen Viewer */}
         <Modal visible={!!fullscreenImage} transparent={true} animationType="fade">
            <View className="flex-1 bg-black/95 justify-center items-center">
               <TouchableOpacity
                  className="absolute top-12 right-6 p-2 bg-white/10 rounded-full z-50"
                  onPress={() => setFullscreenImage(null)}
               >
                  <Ionicons name="close" size={24} color="white" />
               </TouchableOpacity>
               {fullscreenImage && (
                  <Image
                     source={{ uri: fullscreenImage }}
                     style={{ width: '100%', height: '80%' }}
                     resizeMode="contain"
                  />
               )}
            </View>
         </Modal>
      </SafeAreaView>
   );
}