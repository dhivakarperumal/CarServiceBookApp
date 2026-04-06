import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const CustomInput = ({ label, required, ...props }: any) => (
  <View className="mb-4">
    <Text className="mb-2 text-[10px] uppercase font-black text-text-muted tracking-wider ml-1">
      {label} {required && <Text className="text-error">*</Text>}
    </Text>
    <TextInput
      {...props}
      placeholderTextColor="#64748B"
      className="w-full bg-card rounded-2xl border border-card px-5 py-4 text-text-primary font-bold"
    />
  </View>
);

export default function AddBillingScreen() {
  const router = useRouter();
  const { directServiceId } = useLocalSearchParams();
  const { user: userProfile } = useAuth();

  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [parts, setParts] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [labour, setLabour] = useState("");
  const [gstPercent, setGstPercent] = useState("0");

  useEffect(() => {
    fetchMyServices();
  }, [userProfile?.id]);

  useEffect(() => {
    if (directServiceId && services.length > 0) {
      const match = services.find(
        (s) => s.id.toString() === directServiceId.toString(),
      );
      if (match) {
        selectService(match);
      }
    }
  }, [directServiceId, services]);

  const fetchMyServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/all-services");

      const mechanicName =
        userProfile?.username ||
        (userProfile as any)?.displayName ||
        (userProfile as any)?.name ||
        "";

      // Filter: Only services assigned to me and "Bill Pending"
      const myServices = (res.data || []).filter((s: any) => {
        const assignedMatch =
          (s.assignedEmployeeName || "").toLowerCase() ===
          mechanicName.toLowerCase();
        const status = (s.serviceStatus || s.status || "")
          .toString()
          .trim()
          .toLowerCase();
        const isBillPending =
          status === "bill pending" ||
          status === "waiting for bill" ||
          status === "service completed";
        return assignedMatch && isBillPending;
      });

      setServices(myServices);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load assigned services");
    } finally {
      setLoading(false);
    }
  };

  const selectService = async (s: any) => {
    try {
      setSelectedService(s);
      setSearch("");

      // Fetch parts from backend for this service
      const res = await api.get(`/all-services/${s.id}`);
      const data = res.data;

      const partsData = (data.parts || [])
        .filter((p: any) => (p.status || "").toLowerCase() === "approved")
        .map((p: any) => ({
          partName: p.partName,
          qty: Number(p.qty || 0),
          price: Number(p.price || 0),
          total: Number(p.qty || 0) * Number(p.price || 0),
        }));

      const issuesData = (data.issues || [])
        .filter((i: any) => (i.issueStatus || "").toLowerCase() === "approved")
        .map((i: any) => ({
          issueName: i.issue,
          amount: Number(i.issueAmount || 0),
        }));

      setParts(partsData);
      setIssues(issuesData);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load service components");
    }
  };

  const partsTotal = parts.reduce((sum, p) => sum + p.total, 0);
  const issueTotal = issues.reduce((sum, i) => sum + i.amount, 0);
  const labourAmount = Number(labour || 0);
  const gst = Number(gstPercent || 0);

  const subTotal = partsTotal + issueTotal + labourAmount;
  const gstAmount = (subTotal * gst) / 100;
  const grandTotal = subTotal + gstAmount;

  const handleGenerateBill = async () => {
    if (!selectedService) {
      Alert.alert("Incomplete", "Please select a vehicle first");
      return;
    }

    if (parts.length === 0 && labourAmount === 0 && issues.length === 0) {
      Alert.alert("No Charges", "Bill cannot be empty. Add labour or parts.");
      return;
    }

    try {
      setSubmitting(true);
      const invoiceNo = `INV-EMP-${Date.now()}`;

      const payload = {
        invoiceNo,
        serviceId: selectedService.id,
        bookingId: selectedService.bookingId,
        uid: selectedService.uid,
        customerName: selectedService.name,
        mobileNumber: selectedService.phone,
        car: `${selectedService.brand || ""} ${selectedService.model || ""}`.trim(),
        parts,
        issues,
        partsTotal,
        issueTotal,
        labour: labourAmount,
        gstPercent: gst,
        gstAmount,
        subTotal,
        grandTotal,
        paymentStatus: "Pending",
        paymentMode: "",
        status: "Generated",
        createdAt: new Date().toISOString(),
      };

      await api.post("/billings", payload);

      // Update service status to "Bill Generated"
      await api
        .put(`/all-services/${selectedService.id}/status`, {
          serviceStatus: "Bill Generated",
        })
        .catch((err) => console.log("Status update failed:", err));

      Alert.alert("Success", "Job invoice generated successfully!");
      router.replace("/(employee)/billing");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate invoice");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="text-text-secondary mt-4 font-medium tracking-widest text-[10px] uppercase">
          Preparing invoice engine...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 p-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center gap-4 mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-3 bg-card rounded-2xl border border-card"
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-black text-text-primary tracking-tight">
                Create Job Invoice
              </Text>
              <Text className="text-xs text-text-secondary font-medium">
                Generate entry for assigned tasks
              </Text>
            </View>
          </View>

          {/* VEHICLE SELECTION */}
          <View className="bg-card p-6 rounded-3xl border border-card mb-6">
            <Text className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">
              Select Vehicle (Pending Bill)
            </Text>

            {!selectedService ? (
              <View>
                <View className="relative">
                  <View className="absolute left-4 top-4 z-10">
                    <Ionicons name="search" size={20} color="#64748b" />
                  </View>
                  <TextInput
                    placeholder="Search car, name, job id..."
                    placeholderTextColor="#64748b"
                    value={search}
                    onChangeText={setSearch}
                    className="w-full pl-12 pr-4 py-4 bg-background border border-card rounded-2xl text-text-primary font-bold"
                  />
                </View>

                {search.length > 0 && (
                  <View className="mt-2 bg-background rounded-2xl border border-card overflow-hidden">
                    {(services || [])
                      .filter((s) =>
                        `${s.bookingId} ${s.name} ${s.brand}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => selectService(s)}
                          className="p-4 border-b border-card last:border-0"
                        >
                          <Text className="text-text-primary font-black">
                            {s.bookingId}
                          </Text>
                          <Text className="text-xs text-text-muted uppercase tracking-widest mt-0.5">
                            {s.name} | {s.brand} {s.model}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
              </View>
            ) : (
              <View className="bg-background p-4 rounded-2xl border border-primary/30 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-primary font-black text-lg">
                    {selectedService.bookingId}
                  </Text>
                  <Text className="text-xs text-text-secondary font-bold mt-0.5">
                    {selectedService.name} • {selectedService.brand}{" "}
                    {selectedService.model}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedService(null)}
                  className="w-10 h-10 bg-card rounded-xl items-center justify-center border border-card"
                >
                  <Ionicons name="close" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {selectedService && (
            <View>
              {/* COMPONENTS OVERVIEW */}
              <View className="bg-slate-800 p-6 rounded-3xl border border-slate-700 mb-6">
                <View className="flex-row items-center justify-between mb-4 pb-2 border-b border-slate-700">
                  <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                    Service Components
                  </Text>
                  <View className="bg-sky-500/10 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-black text-sky-500 uppercase">
                      {parts.length + issues.length} Logged
                    </Text>
                  </View>
                </View>

                {parts.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-[9px] font-black text-slate-400 uppercase mb-3">
                      Spare Parts (Approved)
                    </Text>
                    {parts.map((p, i) => (
                      <View
                        key={i}
                        className="flex-row justify-between mb-2 pb-2 border-b border-slate-700/30"
                      >
                        <View>
                          <Text className="text-xs font-bold text-white">
                            {p.partName}
                          </Text>
                          <Text className="text-[10px] text-slate-500">
                            Qty: {p.qty} × ₹{p.price}
                          </Text>
                        </View>
                        <Text className="text-xs font-black text-sky-500">
                          ₹{p.total.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                    <View className="flex-row justify-between pt-2">
                      <Text className="text-[10px] font-black text-slate-500 uppercase">
                        Parts Total
                      </Text>
                      <Text className="text-sm font-black text-white">
                        ₹{partsTotal.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}

                {issues.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-[9px] font-black text-slate-400 uppercase mb-3">
                      Approved Issues
                    </Text>
                    {issues.map((issue, i) => (
                      <View
                        key={i}
                        className="flex-row justify-between mb-2 pb-2 border-b border-slate-700/30"
                      >
                        <Text className="text-xs font-bold text-white flex-1 mr-2">
                          {issue.issueName}
                        </Text>
                        <Text className="text-xs font-black text-sky-500">
                          ₹{issue.amount.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                    <View className="flex-row justify-between pt-2">
                      <Text className="text-[10px] font-black text-slate-500 uppercase">
                        Issue Total
                      </Text>
                      <Text className="text-sm font-black text-white">
                        ₹{issueTotal.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}

                {!parts.length && !issues.length && (
                  <Text className="text-center text-slate-500 text-xs italic py-4">
                    No approved parts or issues found.
                  </Text>
                )}
              </View>

              {/* INPUTS */}
              <View className="flex-row gap-4 mb-6">
                <View className="flex-1">
                  <CustomInput
                    label="Labour Charges (₹)"
                    value={labour}
                    onChangeText={setLabour}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View className="flex-1">
                  <CustomInput
                    label="GST (%)"
                    value={gstPercent}
                    onChangeText={setGstPercent}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>

              {/* SUMMARY & SUBMIT */}
              <View className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 mb-20">
                <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 text-center">
                  Summary Calculation
                </Text>

                <View className="space-y-4 mb-8">
                  <View className="flex-row justify-between">
                    <Text className="text-xs font-bold text-slate-400 uppercase">
                      Subtotal
                    </Text>
                    <Text className="text-sm font-bold text-slate-200">
                      ₹{subTotal.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs font-bold text-slate-400 uppercase">
                      GST Amount ({gst}%)
                    </Text>
                    <Text className="text-sm font-bold text-slate-200">
                      ₹{gstAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View className="h-px bg-slate-700 my-2" />
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs font-black text-sky-500 uppercase tracking-widest">
                      Grand Total
                    </Text>
                    <Text className="text-3xl font-black text-emerald-500">
                      ₹{grandTotal.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleGenerateBill}
                  disabled={submitting}
                  className={`w-full py-5 rounded-[1.5rem] items-center flex-row justify-center gap-3 ${submitting ? "bg-sky-500/50" : "bg-sky-500 shadow-xl shadow-sky-500/20"}`}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="receipt" size={20} color="white" />
                      <Text className="text-white font-black uppercase tracking-widest">
                        Generate Final Invoice
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
