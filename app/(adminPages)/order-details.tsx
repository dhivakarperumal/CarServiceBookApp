import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';
import { COLORS } from '../../theme/colors';

/* ─── HELPERS ─── */
const normalizeKey = (s: string) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const formatStatusLabel = (status: string) => {
  const k = normalizeKey(status);
  const map: Record<string, string> = {
    orderplaced:    'Order Placed',
    processing:     'Processing',
    packing:        'Packing',
    outfordelivery: 'Out for Delivery',
    delivered:      'Delivered',
    cancelled:      'Cancelled',
  };
  return map[k] || status || '-';
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  orderplaced:    { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  processing:     { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  packing:        { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  outfordelivery: { bg: 'rgba(6,182,212,0.12)',   text: '#22d3ee', border: 'rgba(6,182,212,0.25)' },
  delivered:      { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  cancelled:      { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
};

const getStatusStyle = (status: string) =>
  STATUS_STYLES[normalizeKey(status)] || {
    bg: 'rgba(255,255,255,0.05)', text: '#94a3b8', border: 'rgba(255,255,255,0.1)',
  };

/* ─── TRACK STEPS ─── */
const TRACK_STEPS = [
  { id: 'orderplaced',    label: 'Order Placed',     icon: 'receipt-outline' },
  { id: 'processing',     label: 'Processing',        icon: 'sync-outline' },
  { id: 'packing',        label: 'Packing',           icon: 'cube-outline' },
  { id: 'outfordelivery', label: 'On the Way',        icon: 'bicycle-outline' },
  { id: 'delivered',      label: 'Delivered',         icon: 'checkmark-circle-outline' },
];

/* ─── SECTION LABEL ─── */
const SectionLabel = ({ text }: { text: string }) => (
  <Text style={{
    color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '900',
    textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10,
  }}>
    {text}
  </Text>
);

/* ─── INFO ROW ─── */
const InfoRow = ({ iconName, label, value }: { iconName: string; label: string; value: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
    <View style={{
      width: 34, height: 34, borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.04)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    }}>
      <Ionicons name={iconName as any} size={15} color={COLORS.textSecondary} />
    </View>
    <View>
      <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Text>
      <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', marginTop: 1 }}>{value || '-'}</Text>
    </View>
  </View>
);

/* ─── CARD WRAPPER ─── */
const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[{
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  }, style]}>
    {children}
  </View>
);

/* ─── MAIN ─── */
export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const [order,   setOrder]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch {
        Alert.alert('Error', 'Failed to load order');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 12, fontWeight: '700' }}>Order not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: COLORS.primary, fontWeight: '900', textTransform: 'uppercase', fontSize: 11 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ss        = getStatusStyle(order.status);
  const isPaid    = normalizeKey(order.paymentStatus) === 'paid';
  const isCancelled = normalizeKey(order.status) === 'cancelled';
  const currentStepIdx = TRACK_STEPS.findIndex(s => s.id === normalizeKey(order.status));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>

      {/* ── HEADER ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 24, paddingTop: 40, paddingBottom: 20,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 42, height: 42, borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.05)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', textTransform: 'uppercase' }}>
            {order.orderId || `Order #${order.id}`}
          </Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 2 }}>
            {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '-'}
          </Text>
        </View>
        {/* Status badge */}
        <View style={{
          backgroundColor: ss.bg, paddingHorizontal: 12, paddingVertical: 6,
          borderRadius: 20, borderWidth: 1, borderColor: ss.border,
        }}>
          <Text style={{ color: ss.text, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
            {formatStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* ── ORDER TRACKING ── */}
        {!isCancelled && (
          <Card>
            <SectionLabel text="Order Tracking" />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              {TRACK_STEPS.map((step, idx) => {
                const done      = currentStepIdx >= 0 && idx <= currentStepIdx;
                const isLast    = idx === TRACK_STEPS.length - 1;
                return (
                  <React.Fragment key={step.id}>
                    <View style={{ alignItems: 'center', gap: 6 }}>
                      <View style={{
                        width: 38, height: 38, borderRadius: 19,
                        backgroundColor: done ? COLORS.primary : 'rgba(255,255,255,0.05)',
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: done ? COLORS.primary : 'rgba(255,255,255,0.1)',
                      }}>
                        <Ionicons
                          name={done ? 'checkmark' : step.icon as any}
                          size={16}
                          color={done ? 'white' : 'rgba(255,255,255,0.25)'}
                        />
                      </View>
                      <Text style={{
                        color: done ? 'white' : 'rgba(255,255,255,0.2)',
                        fontSize: 7, fontWeight: '900', textTransform: 'uppercase',
                        textAlign: 'center', width: 52,
                      }} numberOfLines={2}>
                        {step.label}
                      </Text>
                    </View>
                    {!isLast && (
                      <View style={{
                        flex: 1, height: 2, marginBottom: 20,
                        backgroundColor: idx < currentStepIdx ? COLORS.primary : 'rgba(255,255,255,0.08)',
                        borderRadius: 2,
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </Card>
        )}

        {/* Cancelled reason */}
        {isCancelled && order.cancelledReason && (
          <Card style={{ borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.error} />
              <Text style={{ color: COLORS.error, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                Cancellation Reason
              </Text>
            </View>
            <Text style={{ color: '#f87171', fontSize: 13, fontStyle: 'italic', lineHeight: 20 }}>
              "{order.cancelledReason}"
            </Text>
          </Card>
        )}

        {/* ── CUSTOMER ── */}
        <Card>
          <SectionLabel text="Customer" />
          <InfoRow iconName="person-outline"   label="Name"  value={order.shippingName || order.customerName} />
          <InfoRow iconName="call-outline"     label="Phone" value={order.shippingPhone || order.customerPhone} />
          <InfoRow iconName="mail-outline"     label="Email" value={order.customerEmail} />
        </Card>

        {/* ── SHIPPING ADDRESS ── */}
        <Card>
          <SectionLabel text="Shipping Address" />
          {order.orderType === 'shop' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="storefront-outline" size={18} color={COLORS.textMuted} />
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontStyle: 'italic' }}>
                In-Store Sale (No Shipping)
              </Text>
            </View>
          ) : (
            <>
              <InfoRow iconName="location-outline" label="Address" value={order.shippingAddress} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <InfoRow iconName="business-outline" label="City / State"
                    value={`${order.shippingCity || '-'}, ${order.shippingState || '-'}`} />
                </View>
                <View style={{ flex: 1 }}>
                  <InfoRow iconName="map-outline" label="ZIP / Country"
                    value={`${order.shippingZip || '-'}, ${order.shippingCountry || '-'}`} />
                </View>
              </View>
            </>
          )}
        </Card>

        {/* ── ITEMS ── */}
        <Card>
          <SectionLabel text="Order Items" />
          {/* Table header */}
          <View style={{
            flexDirection: 'row', paddingBottom: 8,
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
            marginBottom: 8,
          }}>
            <Text style={{ flex: 2, color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>Product</Text>
            <Text style={{ flex: 1, color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }}>Qty</Text>
            <Text style={{ flex: 1, color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', textAlign: 'right' }}>Total</Text>
          </View>

          {(order.items || []).map((item: any, idx: number) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: idx < order.items.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(255,255,255,0.04)',
              }}
            >
              <View style={{ flex: 2 }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{item.name}</Text>
                {item.variant ? (
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>{item.variant}</Text>
                ) : null}
              </View>
              <View style={{
                flex: 1, alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 8, paddingVertical: 4,
              }}>
                <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '900' }}>{item.qty}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                  ₹{Number(item.total || item.price * item.qty || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
                  ₹{Number(item.price || 0).toLocaleString('en-IN')} ea
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* ── PAYMENT SUMMARY ── */}
        <Card>
          <SectionLabel text="Payment Summary" />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Subtotal</Text>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>
              ₹{Number(order.subtotal || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          {order.discount > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Discount</Text>
              <Text style={{ color: COLORS.success, fontSize: 13, fontWeight: '700' }}>
                -₹{Number(order.discount).toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <View style={{
            height: 1, backgroundColor: 'rgba(255,255,255,0.08)',
            marginVertical: 12, borderRadius: 1,
          }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Total</Text>
            <Text style={{ color: COLORS.primary, fontSize: 22, fontWeight: '900' }}>
              ₹{Number(order.total || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Payment method + status chips */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <View style={{
              flex: 1, backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 14, padding: 14, alignItems: 'center',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Method
              </Text>
              <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' }}>
                {order.paymentMethod || 'COD'}
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: isPaid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              borderRadius: 14, padding: 14, alignItems: 'center',
              borderWidth: 1, borderColor: isPaid ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Payment
              </Text>
              <Text style={{ color: isPaid ? COLORS.success : COLORS.warning, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' }}>
                {order.paymentStatus || 'Pending'}
              </Text>
            </View>
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}
