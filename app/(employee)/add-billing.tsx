import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
      placeholderTextColor="#94A3B8"
      className="w-full bg-slate-900/30 rounded-xl border border-slate-700 px-5 py-4 text-text-primary font-bold"
    />
  </View>
);

const SectionTitle = ({ title }: { title: string }) => (
  <Text className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">
    {title}
  </Text>
);

export default function AddBillingScreen() {
  const router = useRouter();
  const { directServiceId, id } = useLocalSearchParams();
  const { user: userProfile } = useAuth();

  const generateInvoiceNo = (currentCount = 0) =>
    `INV${String(currentCount + 1).padStart(3, "0")}`;

  const [billingMode, setBillingMode] = useState<"online" | "manual">("online");
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [parts, setParts] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [invoiceNo, setInvoiceNo] = useState<string>(generateInvoiceNo(0));
  const [billingCount, setBillingCount] = useState(0);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [labour, setLabour] = useState("");
  const [gstPercent, setGstPercent] = useState("18");
  const [workforceCharges, setWorkforceCharges] = useState("");

  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualContactNumber, setManualContactNumber] = useState("");
  const [manualVehicleBrand, setManualVehicleBrand] = useState("");
  const [manualVehicleModel, setManualVehicleModel] = useState("");
  const [manualPlateNumber, setManualPlateNumber] = useState("");

  const [newPartName, setNewPartName] = useState("");
  const [newPartQty, setNewPartQty] = useState("1");
  const [newPartPrice, setNewPartPrice] = useState("0");

  useEffect(() => {
    fetchMyServices();
  }, [userProfile?.id]);

  useEffect(() => {
    if (directServiceId && !loading) {
      const match = services.find(
        (s) => s.id.toString() === directServiceId.toString(),
      );
      if (match) {
        selectService(match);
      } else {
        fetchDirectService(directServiceId.toString());
      }
    }
  }, [directServiceId, services, loading]);

  useEffect(() => {
    setInvoiceNo(generateInvoiceNo(billingCount));
  }, [selectedService, billingMode, billingCount]);

  useEffect(() => {
    if (id) {
      fetchBillingForEdit(id as string);
    }
  }, [id]);

  const filteredServices = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return services;
    return services.filter((s) => {
      const text = `${s.bookingId || s.booking_id || s.id || ""} ${
        s.name || s.customer_name || ""
      } ${s.phone || s.mobile || s.contactNumber || ""} ${
        s.brand || s.vehicleBrand || ""
      } ${s.model || s.vehicleModel || ""} ${
        s.vehicleNumber || s.regNo || s.registrationNumber || ""
      }`.toLowerCase();
      return text.includes(searchTerm);
    });
  }, [services, search]);

  const matchingProducts = useMemo(() => {
    if (!newPartName.trim()) return [];
    return products
      .filter((product) =>
        (product.name || "")
          .toString()
          .toLowerCase()
          .includes(newPartName.toLowerCase()),
      )
      .slice(0, 6);
  }, [products, newPartName]);

  const fetchMyServices = async () => {
    try {
      setLoading(true);
      const [serviceRes, productRes, billingRes] = await Promise.all([
        api.get("/all-services"),
        api.get("/products"),
        api.get("/billings"),
      ]);

      const mechanicName =
        userProfile?.username ||
        (userProfile as any)?.displayName ||
        (userProfile as any)?.name ||
        "";

      const myServices = (serviceRes.data || []).filter((s: any) => {
        const assignedMatch =
          (s.assignedEmployeeName || s.assigned_to || s.assignedEmployee || "")
            .toString()
            .toLowerCase() === mechanicName.toLowerCase();
        const status = (s.serviceStatus || s.status || s.service_status || "")
          .toString()
          .trim()
          .toLowerCase();
        const isBillPending = [
          "bill pending",
          "waiting for bill",
          "service completed",
          "pending billing",
          "billing pending",
        ].includes(status);
        return assignedMatch && isBillPending;
      });

      setServices(myServices);
      setProducts(Array.isArray(productRes.data) ? productRes.data : []);
      const billingItems = Array.isArray(billingRes.data)
        ? billingRes.data
        : [];
      setBillingCount(billingItems.length);
      setInvoiceNo(generateInvoiceNo(billingItems.length));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load assigned services or products");
    } finally {
      setLoading(false);
    }
  };

  const selectService = async (s: any) => {
    try {
      setSelectedService(s);
      setSearch("");
      setBillingMode("online");
      setServiceDropdownOpen(false);

      const res = await api.get(`/all-services/${s.id}`);
      const data = res.data;

      const partsData = (data.parts || [])
        .filter((p: any) => (p.status || "").toLowerCase() !== "rejected")
        .map((p: any) => ({
          partName: p.partName,
          qty: Number(p.qty || 0),
          price: Number(p.price || 0),
          total: Number(p.qty || 0) * Number(p.price || 0),
        }));

      const issuesData = (data.issues || [])
        .filter((i: any) => (i.issueStatus || "").toLowerCase() !== "rejected")
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

  const fetchDirectService = async (id: string) => {
    try {
      const res = await api.get(`/all-services/${id}`);
      const service = res.data;

      // Check if assigned to this mechanic
      const mechanicName =
        userProfile?.username ||
        (userProfile as any)?.displayName ||
        (userProfile as any)?.name ||
        "";

      if (
        (service.assignedEmployeeName || "").toLowerCase() !==
        mechanicName.toLowerCase()
      ) {
        Alert.alert("Error", "Service not assigned to you");
        return;
      }

      selectService(service);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load service");
    }
  };

  const fetchBillingForEdit = async (billingId: string) => {
    try {
      setLoading(true);

      const res = await api.get(`/billings/${billingId}`);
      const bill = res.data;

      setInvoiceNo(bill.invoiceNo || "");

      const isManual =
        bill.billingType?.toLowerCase() === "manual" ||
        !bill.serviceId;

      setBillingMode(isManual ? "manual" : "online");

      // ------------------------- 
      // ONLINE BILLING PREFILL
      // -------------------------
      if (!isManual && bill.serviceId) {
        const matchedService = services.find(
          (s) => String(s.id) === String(bill.serviceId)
        );

        if (matchedService) {
          // Use selectService to populate parts and issues
          await selectService(matchedService);
        } else {
          // fallback fetch service if not in dropdown list
          try {
            const serviceRes = await api.get(`/all-services/${bill.serviceId}`);
            // Use selectService to populate parts and issues
            await selectService(serviceRes.data);
          } catch (err) {
            console.log("Service fetch failed", err);
          }
        }
      } else if (isManual) {
        setSelectedService(null);
      }

      // ------------------------- 
      // MANUAL BILLING PREFILL
      // -------------------------
      setManualCustomerName(bill.customerName || "");
      setManualContactNumber(bill.mobileNumber || "");
      setManualPlateNumber(
        bill.plateNumber || bill.registrationNumber || ""
      );

      const carParts = (bill.car || "").split(" ");
      setManualVehicleBrand(carParts[0] || "");
      setManualVehicleModel(carParts.slice(1).join(" ") || "");

      // ------------------------- 
      // PARTS PREFILL
      // -------------------------
      setParts(
        (bill.parts || []).map((p: any) => ({
          partName: p.partName || "",
          qty: Number(p.qty || 0),
          price: Number(p.price || 0),
          total:
            Number(p.total || 0) ||
            Number(p.qty || 0) * Number(p.price || 0),
        }))
      );

      // ------------------------- 
      // ISSUES PREFILL
      // -------------------------
      setIssues(
        (bill.issues || []).map((i: any) => ({
          issueName: i.issueName || i.issue || "",
          amount: Number(i.amount || 0),
        }))
      );

      setWorkforceCharges(String(bill.labour || 0));
      setGstPercent(String(bill.gstPercent || 18));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  const addManualPart = () => {
    if (!newPartName.trim()) {
      Alert.alert("Missing Part", "Enter a part name before adding.");
      return;
    }

    const quantity = Number(newPartQty || 0);
    const price = Number(newPartPrice || 0);

    if (quantity <= 0 || price < 0) {
      Alert.alert(
        "Invalid values",
        "Quantity must be positive and price cannot be negative.",
      );
      return;
    }

    setParts((prev) => [
      ...prev,
      {
        partName: newPartName.trim(),
        qty: quantity,
        price,
        total: quantity * price,
      },
    ]);
    setNewPartName("");
    setNewPartQty("1");
    setNewPartPrice("0");
  };

  const updatePart = (
    index: number,
    field: "partName" | "qty" | "price",
    value: string,
  ) => {
    setParts((prev) =>
      prev.map((part, i) => {
        if (i !== index) return part;
        const updated = { ...part };
        if (field === "qty") {
          updated.qty = value === "" ? 0 : Number(value);
        } else if (field === "price") {
          updated.price = value === "" ? 0 : Number(value);
        } else {
          updated.partName = value;
        }
        updated.total = Number(updated.qty || 0) * Number(updated.price || 0);
        return updated;
      }),
    );
  };

  const removePart = (index: number) => {
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = (nextCount = billingCount) => {
    setBillingMode("online");
    setSelectedService(null);
    setSearch("");
    setServiceDropdownOpen(false);
    setParts([]);
    setIssues([]);
    setLabour("");
    setWorkforceCharges("");
    setGstPercent("18");
    setManualCustomerName("");
    setManualContactNumber("");
    setManualVehicleBrand("");
    setManualVehicleModel("");
    setManualPlateNumber("");
    setNewPartName("");
    setNewPartQty("1");
    setNewPartPrice("0");
    setInvoiceNo(generateInvoiceNo(nextCount));
  };

  const partsTotal = parts.reduce((sum, p) => sum + p.total, 0);
  const issueTotal =
    billingMode === "online" ? issues.reduce((sum, i) => sum + i.amount, 0) : 0;
  const labourAmount = Number(labour || workforceCharges || 0);
  const gst = Number(gstPercent || 0);

  const subTotal = partsTotal + issueTotal + labourAmount;
  const gstAmount = (subTotal * gst) / 100;
  const grandTotal = subTotal + gstAmount;

  const handleGenerateBill = async () => {
    if (billingMode === "online" && !selectedService) {
      Alert.alert(
        "Incomplete",
        "Please select a pending job to create billing.",
      );
      return;
    }

    if (billingMode === "manual") {
      if (
        !manualCustomerName.trim() ||
        !manualContactNumber.trim() ||
        !manualVehicleBrand.trim() ||
        !manualVehicleModel.trim() ||
        !manualPlateNumber.trim()
      ) {
        Alert.alert("Incomplete", "Please fill all manual billing details.");
        return;
      }
    }

    if (parts.length === 0 && labourAmount === 0) {
      Alert.alert("No Charges", "Bill cannot be empty. Add parts or labour.");
      return;
    }

    try {
      setSubmitting(true);
      const bookingId =
        billingMode === "manual"
          ? `MAN-${Date.now()}`
          : selectedService.bookingId;
      const customerName =
        billingMode === "manual"
          ? manualCustomerName.trim()
          : selectedService.name;
      const mobileNumber =
        billingMode === "manual"
          ? manualContactNumber.trim()
          : selectedService.phone;
      const car =
        billingMode === "manual"
          ? `${manualVehicleBrand.trim()} ${manualVehicleModel.trim()}`.trim()
          : `${selectedService.brand || ""} ${selectedService.model || ""}`.trim();
      const uid =
        billingMode === "manual" ? userProfile?.id : selectedService.uid;

      const payload = {
        invoiceNo,
        serviceId: billingMode === "manual" ? null : selectedService.id,
        bookingId,
        uid,
        customerName,
        mobileNumber,
        car,
        plateNumber:
          billingMode === "manual"
            ? manualPlateNumber.trim()
            : selectedService.regNo || selectedService.plateNumber || "",
        parts,
        issues: billingMode === "online" ? issues : [],
        partsTotal,
        issueTotal,
        labour: labourAmount,
        gstPercent: gst,
        gstAmount,
        subTotal,
        grandTotal,
        paymentStatus: "Pending",
        paymentMode: "",
        status: billingMode === "manual" ? "Manual Generated" : "Generated",
        createdAt: new Date().toISOString(),
      };

      if (id) {
        await api.put(`/billings/${id}`, payload);
      } else {
        await api.post("/billings", payload);
      }

      if (billingMode === "online") {
        await api
          .put(`/all-services/${selectedService.id}/status`, {
            serviceStatus: "Bill Generated",
          })
          .catch((err) => console.log("Status update failed:", err));
      }

      const nextCount = billingCount + 1;
      setBillingCount(nextCount);
      resetForm(nextCount);
      Alert.alert(
        "Success",
        id ? "Invoice updated successfully." : "Invoice created successfully.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(employee)/billing"),
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* FIXED HEADER */}
      <View className="px-6 pt-8 pb-4 bg-background border-b border-slate-800">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-3 bg-slate-900/30 rounded-2xl border border-slate-700"
          >
            <Ionicons name="chevron-back" size={20} color="#64748B" />
          </TouchableOpacity>

          <View className="flex-1 min-w-0">
            <Text
              className="text-text-primary text-[17px] font-black uppercase tracking-tight"
              numberOfLines={1}
            >
              Generate Billing
            </Text>
          </View>
        </View>

        <View className="mt-4 w-full flex-row items-center rounded-full bg-slate-900/90 p-1 border border-slate-700">
          {[
            { mode: "online", label: "Online Booking" },
            { mode: "manual", label: "Manual Entry" },
          ].map((option) => (
            <TouchableOpacity
              key={option.mode}
              onPress={() => {
                setBillingMode(option.mode as "online" | "manual");
                if (option.mode === "manual") {
                  setSelectedService(null);
                  setIssues([]);
                }
              }}
              className={`flex-1 py-3 rounded-full items-center justify-center ${billingMode === option.mode ? "bg-primary" : "bg-slate-900"}`}
            >
              <Text
                className={`text-[10px] font-black uppercase tracking-wider ${billingMode === option.mode ? "text-text-primary" : "text-text-muted"}`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-[14px] uppercase tracking-[0.35em] text-text-primary font-black mt-4 ml-1">
          Invoice No :{invoiceNo}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* CONTENT */}
          <View className="px-6 pt-7 pb-24">
            {loading && services.length === 0 ? (
              <View className="py-20 items-center bg-card rounded-[32px] border border-dashed border-slate-700">
                <Ionicons name="refresh-circle" size={48} color="#0EA5E9" />
                <Text className="text-slate-500 font-black text-[10px] uppercase mt-4 tracking-[2px]">
                  Preparing invoice engine...
                </Text>
              </View>
            ) : (
              <>
                {billingMode === "online" && (
                  <View className="flex-row flex-wrap gap-4 mb-6">
                    <View className="flex-1 min-w-[280px] bg-card rounded-[28px] p-6 border border-slate-700">
                      <SectionTitle title="Verification Queue" />
                      <Text className="text-[10px] uppercase tracking-widest text-text-muted mb-4">
                        Jobs pulled from
                        https://cars.qtechx.com/api/all-services/
                      </Text>

                      {filteredServices.length === 0 ? (
                        <View className="rounded-2xl border border-slate-700 bg-slate-900/30 px-4 py-5">
                          <Text className="text-[10px] text-text-muted uppercase tracking-widest">
                            No pending billing jobs found.
                          </Text>
                          <Text className="text-sm font-black text-text-primary mt-2">
                            Try searching by Booking ID, phone, or vehicle
                            model.
                          </Text>
                        </View>
                      ) : (
                        <View className="rounded-2xl border border-slate-700 bg-slate-900/30 overflow-hidden">
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              setServiceDropdownOpen((prev) => !prev)
                            }
                            className="flex-row items-center justify-between px-4 py-4 bg-slate-900/50 border-b border-slate-700"
                          >
                            <Text
                              className={`text-sm font-black ${selectedService ? "text-text-primary" : "text-text-muted"}`}
                            >
                              {selectedService
                                ? `${selectedService.bookingId || `Job ${selectedService.id}`} | ${selectedService.name}`
                                : "-- Select Assigned Job --"}
                            </Text>
                            <Ionicons
                              name={
                                serviceDropdownOpen
                                  ? "chevron-up"
                                  : "chevron-down"
                              }
                              size={18}
                              color="#94A3B8"
                            />
                          </TouchableOpacity>

                          {serviceDropdownOpen && (
                            <ScrollView
                              className="max-h-56 bg-slate-900/30"
                              showsVerticalScrollIndicator
                            >
                              {filteredServices.map((service) => (
                                <TouchableOpacity
                                  key={service.id}
                                  onPress={() => {
                                    if (selectedService?.id === service.id) {
                                      setSelectedService(null);
                                      setParts([]);
                                      setIssues([]);
                                      setServiceDropdownOpen(false);
                                      return;
                                    }
                                    selectService(service);
                                  }}
                                  className={`px-4 py-4 border-b border-slate-700 ${selectedService?.id === service.id ? "bg-slate-900/50" : "bg-slate-900/20"}`}
                                >
                                  <Text className="text-sm font-black text-text-primary">
                                    {service.bookingId || `Job ${service.id}`}
                                  </Text>
                                  <Text className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
                                    {service.name} • {service.brand}{" "}
                                    {service.model}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          )}
                        </View>
                      )}

                      {selectedService && (
                        <View className="mt-4 rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-900/50 to-slate-900/20 p-5">
                          <View className="flex-row items-start justify-between mb-3">
                            <View className="flex-1">
                              <Text className="text-[10px] uppercase tracking-widest text-success font-black mb-1">
                                ✓ Selected Job
                              </Text>
                              <Text className="text-base font-black text-text-primary">
                                {selectedService.bookingId ||
                                  `Job ${selectedService.id}`}
                              </Text>
                              <Text className="text-[10px] text-text-muted mt-2">
                                {selectedService.name}
                              </Text>
                              <Text className="text-[9px] text-text-muted mt-1">
                                {selectedService.brand} {selectedService.model}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedService(null);
                                setParts([]);
                                setIssues([]);
                              }}
                              className="bg-error/20 border border-error rounded-xl px-3 py-2"
                            >
                              <Text className="text-[10px] font-black text-error uppercase tracking-widest">
                                Unselect
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </>
            )}

            {billingMode === "manual" && (
              <View className="bg-card rounded-[28px] p-6 mb-6 border border-slate-700">
                <Text className="text-xl font-black text-text-primary mb-4">
                  Walk-In Information
                </Text>
                <View className="flex-row flex-wrap gap-4">
                  <View className="flex-1 min-w-[280px]">
                    <CustomInput
                      label="Customer Name"
                      value={manualCustomerName}
                      onChangeText={setManualCustomerName}
                      placeholder="Enter Customer Full Name"
                    />
                  </View>
                  <View className="flex-1 min-w-[280px]">
                    <CustomInput
                      label="Contact Number"
                      value={manualContactNumber}
                      onChangeText={setManualContactNumber}
                      keyboardType="phone-pad"
                      placeholder="Ex: +91 98765 4321"
                    />
                  </View>
                  <View className="flex-1 min-w-[280px]">
                    <CustomInput
                      label="Vehicle Brand"
                      value={manualVehicleBrand}
                      onChangeText={setManualVehicleBrand}
                      placeholder="Ex: Honda Motors"
                    />
                  </View>
                  <View className="flex-1 min-w-[280px]">
                    <CustomInput
                      label="Vehicle Model"
                      value={manualVehicleModel}
                      onChangeText={setManualVehicleModel}
                      placeholder="Ex: Unicorn 160 BS6"
                    />
                  </View>
                  <View className="flex-1 min-w-[280px]">
                    <CustomInput
                      label="Plate Number"
                      value={manualPlateNumber}
                      onChangeText={setManualPlateNumber}
                      placeholder="Ex: MH-12-XX-123"
                    />
                  </View>
                </View>
              </View>
            )}

            <View className="bg-card rounded-[28px] p-6 mb-6 border border-slate-700">
              <View className="flex-col gap-2 items-center justify-between mb-5">
                <Text className="text-xl font-black text-text-primary">
                  Spare Parts Inventory
                </Text>
                <Text className="text-[10px] uppercase tracking-widest text-text-muted">
                  List of components used in this service cycle
                </Text>
              </View>

              <View className="flex-col gap-4 mb-6">
                <View className="bg-gradient-to-r from-slate-900/50 to-slate-900/20 rounded-3xl border border-slate-700/60 p-6">
                  <Text className="text-[9px] uppercase tracking-widest text-text-muted font-black mb-4">
                    ⚙️ Add New Part to Inventory
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    <View className="flex-1 min-w-[220px]">
                      <TextInput
                        placeholder="Search or type part name"
                        placeholderTextColor="#64748B"
                        value={newPartName}
                        onChangeText={(value) => {
                          setNewPartName(value);
                          const match = products.find(
                            (product) =>
                              (product.name || "").toString().toLowerCase() ===
                              value.toLowerCase(),
                          );
                          if (match && match.price != null) {
                            setNewPartPrice(String(match.price));
                          }
                        }}
                        className="w-full bg-slate-900/40 border border-slate-700/60 rounded-2xl px-5 py-4 text-text-primary font-bold text-sm"
                      />
                    </View>
                    <View className="w-24">
                      <TextInput
                        placeholder="Qty"
                        placeholderTextColor="#64748B"
                        value={newPartQty}
                        onChangeText={setNewPartQty}
                        keyboardType="numeric"
                        className="w-full bg-slate-900/40 border border-slate-700/60 rounded-2xl px-4 py-4 text-text-primary font-bold text-center text-sm"
                      />
                    </View>
                    <View className="w-28">
                      <TextInput
                        placeholder="Unit Price"
                        placeholderTextColor="#64748B"
                        value={newPartPrice}
                        onChangeText={setNewPartPrice}
                        keyboardType="numeric"
                        className="w-full bg-slate-900/40 border border-slate-700/60 rounded-2xl px-4 py-4 text-text-primary font-bold text-center text-sm"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={addManualPart}
                      className="min-w-[140px] bg-gradient-to-r from-primary to-accent rounded-2xl px-5 py-4 items-center justify-center border border-primary/40 shadow-lg"
                    >
                      <Text className="text-white font-black uppercase tracking-widest text-xs">
                        + Add Part
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {matchingProducts.length > 0 && (
                <View className="bg-gradient-to-r from-slate-900/50 to-slate-900/20 rounded-3xl border border-slate-700/60 p-5 mb-6">
                  <View className="flex-row items-center gap-2 mb-4">
                    <Ionicons name="layers-outline" size={16} color="#0EA5E9" />
                    <Text className="text-[10px] uppercase tracking-widest font-black text-primary">
                      Matching Spare Parts Found
                    </Text>
                  </View>
                  <View className="gap-3">
                    {matchingProducts.map((product) => (
                      <TouchableOpacity
                        key={product.id || product.name}
                        onPress={() => {
                          setNewPartName(product.name || "");
                          setNewPartPrice(
                            String(product.price || product.offerPrice || "0"),
                          );
                        }}
                        className="bg-gradient-to-r from-slate-900/40 to-slate-900/20 rounded-2xl border border-slate-700/50 p-4 flex-row items-center justify-between"
                      >
                        <View className="flex-1">
                          <Text className="text-sm font-black text-text-primary">
                            {product.name}
                          </Text>
                          <View className="flex-row items-center gap-2 mt-2">
                            <View className="bg-primary/20 rounded-lg px-2 py-1 border border-primary/40">
                              <Text className="text-[10px] font-black text-primary">
                                {product.category || "Spare Part"}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-lg font-black text-accent">
                            ₹{product.price || product.offerPrice || "0"}
                          </Text>
                          <Ionicons
                            name="add-circle-outline"
                            size={20}
                            color="#0EA5E9"
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View>
                {parts.length === 0 ? (
                  <View className="px-6 py-16 items-center justify-center bg-gradient-to-b from-slate-900/30 to-slate-900/10 rounded-3xl border-2 border-dashed border-slate-700">
                    <Ionicons name="layers-outline" size={42} color="#0EA5E9" />
                    <Text className="text-text-muted uppercase tracking-widest mt-5 font-bold text-sm">
                      No Parts Added Yet
                    </Text>
                    <Text className="text-[10px] text-text-muted mt-2 text-center max-w-xs">
                      Add spare parts using the form above
                    </Text>
                  </View>
                ) : (
                  <View className="gap-4">
                    {parts.map((part, index) => (
                      <View
                        key={`${part.partName}-${index}`}
                        className="bg-gradient-to-r from-slate-900/40 to-slate-900/20 rounded-3xl border border-slate-700/60 p-5 shadow-lg"
                      >
                        <View className="flex-row items-start justify-between mb-4">
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-3">
                              <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center border border-primary/40">
                                <Text className="text-[11px] font-black text-primary">
                                  {index + 1}
                                </Text>
                              </View>
                              <View className="flex-1">
                                <TextInput
                                  value={part.partName}
                                  onChangeText={(value) =>
                                    updatePart(index, "partName", value)
                                  }
                                  placeholder="Part description"
                                  placeholderTextColor="#94A3B8"
                                  className="text-sm font-bold text-text-primary"
                                />
                              </View>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => removePart(index)}
                            className="bg-error/15 rounded-xl p-2 border border-error/30"
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#EF4444"
                            />
                          </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-3 mb-3">
                          <View className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-700/50 p-4">
                            <Text className="text-[8px] uppercase tracking-widest text-text-muted font-black mb-2">
                              Quantity
                            </Text>
                            <TextInput
                              keyboardType="numeric"
                              value={part.qty === 0 ? "" : String(part.qty)}
                              onChangeText={(value) =>
                                updatePart(index, "qty", value)
                              }
                              placeholder="0"
                              placeholderTextColor="#64748B"
                              className="text-base font-black text-text-primary"
                            />
                          </View>
                          <View className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-700/50 p-4">
                            <Text className="text-[8px] uppercase tracking-widest text-text-muted font-black mb-2">
                              Unit Price (₹)
                            </Text>
                            <TextInput
                              keyboardType="numeric"
                              value={part.price === 0 ? "" : String(part.price)}
                              onChangeText={(value) =>
                                updatePart(index, "price", value)
                              }
                              placeholder="0"
                              placeholderTextColor="#64748B"
                              className="text-base font-black text-text-primary"
                            />
                          </View>
                        </View>

                        <View className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-4">
                          <View className="flex-row items-center justify-between">
                            <View>
                              <Text className="text-[8px] uppercase tracking-widest text-text-muted font-black mb-1">
                                Subtotal
                              </Text>
                              <Text className="text-2xl font-black text-primary">
                                ₹{part.total.toLocaleString()}
                              </Text>
                            </View>
                            <View className="bg-primary/20 rounded-xl px-3 py-2 border border-primary/40">
                              <Text className="text-[10px] font-black text-primary">
                                {part.qty} × ₹{part.price.toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row flex-wrap gap-4 mb-20 items-start">
              <View className="flex-1 min-w-[300px] bg-card rounded-[28px] p-6 border border-slate-700">
                <Text className="text-xl font-black text-text-primary mb-4">
                  Accounting Summary
                </Text>
                <View className="space-y-4">
                  <View className="bg-slate-900/30 rounded-2xl p-4 border border-slate-700">
                    <Text className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
                      Workforce Charges (₹)
                    </Text>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={workforceCharges}
                      onChangeText={setWorkforceCharges}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-4 text-text-primary font-bold"
                    />
                  </View>

                  <View className="bg-slate-900/30 rounded-2xl mt-2 p-4 border border-slate-700">
                    <Text className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
                      Taxation Layer (%)
                    </Text>
                    <TextInput
                      placeholder="18"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={gstPercent}
                      onChangeText={setGstPercent}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-4 text-text-primary font-bold"
                    />
                  </View>

                  <View className="bg-slate-900/30 rounded-2xl mt-2 p-4 border border-slate-700">
                    <Text className="text-[10px] uppercase tracking-widest text-text-muted mb-3">
                      Subtotal
                    </Text>
                    <Text className="text-2xl font-black text-text-primary">
                      ₹{subTotal.toLocaleString()}
                    </Text>
                  </View>

                  <View className="bg-slate-900/30 rounded-2xl mt-2 p-4 border border-slate-700">
                    <Text className="text-[10px] uppercase tracking-widest text-text-muted mb-3">
                      Tax Amount
                    </Text>
                    <Text className="text-2xl font-black text-text-primary">
                      ₹{gstAmount.toFixed(2)}
                    </Text>
                  </View>

                  <View className="bg-slate-900/50 rounded-2xl mt-2 p-6 border border-slate-700">
                    <Text className="text-[10px] uppercase tracking-widest text-text-muted mb-3">
                      Grand Payable Total
                    </Text>
                    <Text className="text-4xl font-black text-emerald-400">
                      ₹{grandTotal.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="w-full bg-card rounded-[28px] mt-2 p-6 border border-slate-700">
                <Text className="text-xl font-black text-text-primary mb-4">
                  Review & Commit
                </Text>
                <Text className="text-[10px] uppercase tracking-widest text-text-muted mb-4">
                  Finalize invoice details and submit to billing history.
                </Text>
                <TouchableOpacity
                  onPress={handleGenerateBill}
                  disabled={submitting}
                  className={`w-full py-5 rounded-2xl items-center justify-center ${submitting ? "bg-slate-600" : "bg-primary"}`}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-black uppercase tracking-widest">
                      Commit Invoice
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    resetForm();
                    router.replace("/(employee)/billing");
                  }}
                  className="mt-4 py-4 rounded-2xl border border-slate-700 items-center justify-center"
                >
                  <Text className="text-text-muted font-black uppercase tracking-widest">
                    Cancel Operation
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
