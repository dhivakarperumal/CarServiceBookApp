import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { COLORS } from '../../theme/colors';

/* ─── HELPERS ─── */
const normalizeKey = (s: string) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const formatStatusLabel = (status: string) => {
  const k = normalizeKey(status);
  const map: Record<string, string> = {
    orderplaced:     'Order Placed',
    processing:      'Processing',
    packing:         'Packing',
    outfordelivery:  'Out for Delivery',
    delivered:       'Delivered',
    cancelled:       'Cancelled',
  };
  return map[k] || status || '-';
};

const ORDER_STATUS_LIST = [
  { id: 'orderplaced',    label: 'Order Placed' },
  { id: 'processing',     label: 'Processing' },
  { id: 'packing',        label: 'Packing' },
  { id: 'outfordelivery', label: 'Out for Delivery' },
  { id: 'delivered',      label: 'Delivered' },
  { id: 'cancelled',      label: 'Cancelled' },
];

/* ─── STATUS STYLE MAP ─── */
const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  orderplaced:    { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  processing:     { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  packing:        { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  outfordelivery: { bg: 'rgba(6,182,212,0.12)',   text: '#22d3ee', border: 'rgba(6,182,212,0.25)' },
  delivered:      { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  cancelled:      { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
};

const getStatusStyle = (status: string) =>
  STATUS_STYLES[normalizeKey(status)] || { bg: 'rgba(255,255,255,0.05)', text: '#94a3b8', border: 'rgba(255,255,255,0.1)' };

/* ─── STAT CARD ─── */
const StatCard = ({
  title, value, iconName, iconColor,
}: { title: string; value: string | number; iconName: string; iconColor: string }) => (
  <View style={{
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginRight: 12,
    width: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  }}>
    <View style={{
      width: 40, height: 40, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.05)',
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    }}>
      <Ionicons name={iconName as any} size={20} color={iconColor} />
    </View>
    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
      {title}
    </Text>
    <Text style={{ color: 'white', fontSize: 22, fontWeight: '900' }}>{value}</Text>
  </View>
);

/* ─── MAIN ─── */
export default function AllOrders() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [deliveryOnly, setDeliveryOnly] = useState(false);

  /* pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 10;

  /* status update modal */
  const [statusModal, setStatusModal] = useState<{ order: any } | null>(null);

  /* ─── LOAD ─── */
  const loadOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  /* ─── STATS ─── */
  const stats = useMemo(() => {
    const total     = orders.length;
    const delivered = orders.filter(o => normalizeKey(o.status) === 'delivered').length;
    const cancelled = orders.filter(o => normalizeKey(o.status) === 'cancelled').length;
    const paid      = orders.filter(o => normalizeKey(o.paymentStatus) === 'paid').length;
    const revenue   = orders
      .filter(o => normalizeKey(o.status) !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { total, delivered, cancelled, paid, revenue };
  }, [orders]);

  /* ─── FILTER ─── */
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const name = (o.customerName || o.shippingName || '').toLowerCase();
      const id   = (o.orderId || '').toLowerCase();
      const q    = search.toLowerCase();

      if (q && !id.includes(q) && !name.includes(q)) return false;
      if (statusFilter  !== 'all' && normalizeKey(o.status)        !== statusFilter)  return false;
      if (paymentFilter !== 'all' && normalizeKey(o.paymentStatus) !== paymentFilter) return false;
      if (deliveryOnly && !normalizeKey(o.status).includes('delivered'))              return false;
      return true;
    });
  }, [orders, search, statusFilter, paymentFilter, deliveryOnly]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, paymentFilter, deliveryOnly]);

  /* ─── UPDATE STATUS ─── */
  const updateStatus = async (orderId: number, newStatus: string) => {
    if (newStatus === 'cancelled') {
      Alert.prompt(
        'Cancel Order',
        'Enter cancellation reason:',
        async (reason) => {
          if (!reason) return;
          try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus, cancelledReason: reason });
            Alert.alert('Updated', 'Order cancelled');
            loadOrders();
          } catch {
            Alert.alert('Error', 'Failed to update status');
          }
        },
        'plain-text',
      );
      return;
    }
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      Alert.alert('Updated', `Status → ${formatStatusLabel(newStatus)}`);
      setStatusModal(null);
      loadOrders();
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  /* ─── STATUS FILTER CHIP ─── */
  const filterChip = (label: string, value: string, current: string, setter: (v: string) => void) => {
    const active = current === value;
    return (
      <TouchableOpacity
        key={value}
        onPress={() => setter(active ? 'all' : value)}
        style={{
          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
          backgroundColor: active ? 'white' : 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          borderColor: active ? 'white' : 'rgba(255,255,255,0.1)',
        }}
      >
        <Text style={{
          color: active ? 'black' : 'rgba(255,255,255,0.4)',
          fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1,
        }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  /* ─── AVAILABLE NEXT STATUSES ─── */
  const getNextStatuses = (currentStatus: string) => {
    const currentIdx = ORDER_STATUS_LIST.findIndex(s => s.id === normalizeKey(currentStatus));
    const start = currentIdx === -1 ? 0 : currentIdx;
    return ORDER_STATUS_LIST.slice(start).filter(s => {
      const cur = normalizeKey(currentStatus);
      if (cur === 'outfordelivery' || cur === 'delivered') return s.id !== 'cancelled';
      return true;
    });
  };

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor={COLORS.primary} />}
      >
        {/* ── HEADER ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', textTransform: 'uppercase' }}>Orders</Text>
              <Text style={{ color: COLORS.primary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>
                Order Management
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(admin)/orders' as any)}
              style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Ionicons name="refresh" size={20} color={COLORS.primary} onPress={() => { setRefreshing(true); loadOrders(); }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── STATS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <StatCard title="Total"     value={stats.total}     iconName="clipboard-outline"    iconColor={COLORS.primary} />
          <StatCard title="Delivered" value={stats.delivered} iconName="checkmark-done-outline" iconColor={COLORS.success} />
          <StatCard title="Cancelled" value={stats.cancelled} iconName="close-circle-outline"  iconColor={COLORS.error} />
          <StatCard title="Paid"      value={stats.paid}      iconName="card-outline"          iconColor="#4ade80" />
          <StatCard
            title="Revenue"
            value={`₹${stats.revenue.toLocaleString('en-IN')}`}
            iconName="cash-outline"
            iconColor={COLORS.warning}
          />
        </ScrollView>

        {/* ── SEARCH ── */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 16, paddingHorizontal: 16, height: 52,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
          }}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} />
            <TextInput
              placeholder="Search Order ID or Member..."
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={(v) => { setSearch(v); setCurrentPage(1); }}
              style={{ flex: 1, marginLeft: 12, color: 'white', fontWeight: '600', fontSize: 13 }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── STATUS FILTER CHIPS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          {filterChip('All', 'all', statusFilter, setStatusFilter)}
          {ORDER_STATUS_LIST.map(s => filterChip(s.label, s.id, statusFilter, setStatusFilter))}
        </ScrollView>

        {/* ── PAYMENT + DELIVERY FILTERS ── */}
        <View style={{ paddingHorizontal: 24, flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {filterChip('All Payments', 'all', paymentFilter, setPaymentFilter)}
          {filterChip('Paid',         'paid',    paymentFilter, setPaymentFilter)}
          {filterChip('Pending',      'pending', paymentFilter, setPaymentFilter)}
          <TouchableOpacity
            onPress={() => setDeliveryOnly(prev => !prev)}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: deliveryOnly ? COLORS.primary : 'rgba(255,255,255,0.05)',
              borderWidth: 1, borderColor: deliveryOnly ? COLORS.primary : 'rgba(255,255,255,0.1)',
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
          >
            <Ionicons name="bicycle-outline" size={13} color={deliveryOnly ? 'white' : 'rgba(255,255,255,0.4)'} />
            <Text style={{ color: deliveryOnly ? 'white' : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
              Delivery Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── ORDER LIST ── */}
        <View style={{ paddingHorizontal: 24, gap: 12 }}>
          {paginated.length === 0 ? (
            <View style={{
              paddingVertical: 80, alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: 32, borderWidth: 1, borderStyle: 'dashed',
              borderColor: 'rgba(255,255,255,0.08)',
            }}>
              <MaterialCommunityIcons name="package-variant" size={48} color="rgba(255,255,255,0.08)" />
              <Text style={{ color: 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', marginTop: 16, letterSpacing: 2 }}>
                No orders found
              </Text>
            </View>
          ) : paginated.map((o: any) => {
            const ss = getStatusStyle(o.status);
            const isPaid = normalizeKey(o.paymentStatus) === 'paid';
            return (
              <View key={o.id} style={{
                backgroundColor: COLORS.card,
                borderRadius: 24, borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}>
                {/* Card body */}
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(adminPages)/order-details', params: { id: o.id } } as any)}
                  activeOpacity={0.85}
                  style={{ padding: 20 }}
                >
                  {/* Row 1: Order ID + status badge */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View>
                      <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>
                        {o.orderId || `#${o.id}`}
                      </Text>
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', marginTop: 2, textTransform: 'uppercase' }}>
                        {o.customerName || o.shippingName || 'Customer'}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: ss.bg, paddingHorizontal: 12, paddingVertical: 6,
                      borderRadius: 20, borderWidth: 1, borderColor: ss.border,
                    }}>
                      <Text style={{ color: ss.text, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {formatStatusLabel(o.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: Amount + Payment */}
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <View style={{
                      backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6,
                      borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
                    }}>
                      <Ionicons name="cash-outline" size={12} color={COLORS.warning} />
                      <Text style={{ color: COLORS.textSecondary, fontSize: 10, fontWeight: '700' }}>
                        ₹{Number(o.total).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: isPaid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      borderWidth: 1, borderColor: isPaid ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                    }}>
                      <Ionicons name="card-outline" size={12} color={isPaid ? COLORS.success : COLORS.warning} />
                      <Text style={{ color: isPaid ? COLORS.success : COLORS.warning, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                        {o.paymentStatus || 'Pending'}
                      </Text>
                    </View>
                    {(o.items?.length ?? 0) > 0 && (
                      <View style={{
                        backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6,
                        borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
                      }}>
                        <Ionicons name="cube-outline" size={12} color={COLORS.primary} />
                        <Text style={{ color: COLORS.textSecondary, fontSize: 10, fontWeight: '700' }}>
                          {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Footer Actions */}
                <View style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingHorizontal: 20, paddingVertical: 14,
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                    <Text style={{ color: COLORS.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '-'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setStatusModal({ order: o })}
                      style={{
                        backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10,
                        borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Ionicons name="swap-vertical-outline" size={13} color="white" />
                      <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>Status</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/(adminPages)/order-details', params: { id: o.id } } as any)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 10,
                        borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 32, paddingHorizontal: 24 }}>
            <TouchableOpacity
              disabled={currentPage === 1}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{
                width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                opacity: currentPage === 1 ? 0.25 : 1,
              }}
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              {currentPage} / {totalPages}
            </Text>
            <TouchableOpacity
              disabled={currentPage === totalPages}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              style={{
                width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                opacity: currentPage === totalPages ? 0.25 : 1,
              }}
            >
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── STATUS UPDATE MODAL ── */}
      <Modal visible={!!statusModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: COLORS.modal,
            borderTopLeftRadius: 40, borderTopRightRadius: 40,
            padding: 32, paddingBottom: 52,
            borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
          }}>
            <View style={{ width: 48, height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, alignSelf: 'center', marginBottom: 28 }} />
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 }}>
              Update Status
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 24 }}>
              {statusModal?.order?.orderId}
            </Text>
            <View style={{ gap: 10 }}>
              {statusModal && getNextStatuses(statusModal.order.status).map(s => {
                const active = normalizeKey(statusModal.order.status) === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => updateStatus(statusModal.order.id, s.id)}
                    style={{
                      padding: 18, borderRadius: 18,
                      backgroundColor: active ? 'white' : 'rgba(255,255,255,0.05)',
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      borderWidth: 1, borderColor: active ? 'white' : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Text style={{
                      color: active ? 'black' : 'rgba(255,255,255,0.5)',
                      fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1,
                    }}>{s.label}</Text>
                    {active && <Ionicons name="checkmark-circle" size={20} color="black" />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => setStatusModal(null)}
              style={{ marginTop: 20, padding: 14, alignItems: 'center' }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.25)', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2 }}>
                DISMISS
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
