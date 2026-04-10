import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/api";
import { COLORS } from "../../theme/colors";

/* REUSABLE COMPONENTS */
const Label = ({ children, required }: any) => (
  <Text className="text-text-secondary text-[9px] font-black uppercase tracking-widest mb-2 ml-1">
    {children} {required && <Text className="text-red-500">*</Text>}
  </Text>
);

const StyledInput = ({ ...props }: any) => (
  <TextInput
    placeholderTextColor={COLORS.textMuted}
    className="bg-card border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold text-xs mb-4"
    {...props}
  />
);

const StepIcon = ({ name, active, completed }: any) => (
  <View
    className={`w-8 h-8 rounded-full items-center justify-center border ${
      active
        ? "bg-primary border-primary"
        : completed
          ? "bg-success/20 border-success/40"
          : "bg-card border-slate-700"
    }`}
  >
    <Ionicons
      name={completed ? "checkmark" : name}
      size={16}
      color={active || completed ? COLORS.white : COLORS.textMuted}
    />
  </View>
);

const AdminAddVehicle = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<any>({
    title: "",
    brand: "",
    model: "",
    variant: "",
    yom: "",
    reg_year: "",
    engine_cc: "",
    mileage: "",
    fuel_type: "Petrol",
    transmission: "Manual",
    km_driven: "",
    owners: "1",
    color: "",
    city: "",
    area: "",
    pincode: "",
    expected_price: "",
    advance_amount_paid: "",
    negotiable: false,
    insurance_valid: "",
    road_tax_paid: false,
    rc_available: false,
    insurance_available: false,
    puc_available: false,
    loan_status: "Clear",
    images: {
      front: "",
      back: "",
      side: "",
      dashboard: "",
      rc: "",
    },
    description: "",
    seller_name: "",
    seller_phone: "",
    seller_email: "",
    status: "draft",
    type: "Bike",
  });

  useEffect(() => {
    if (id) {
      fetchVehicleDetails();
    }
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const data = await apiService.getVehicleById(Number(id));
      setForm({
        ...data,
        images:
          typeof data.images === "string"
            ? JSON.parse(data.images)
            : data.images || {
                front: "",
                back: "",
                side: "",
                dashboard: "",
                rc: "",
              },
      });
    } catch (err) {
      Alert.alert("Error", "Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async (type: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera roll permissions are required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setForm((prev: any) => ({
        ...prev,
        images: { ...prev.images, [type]: base64 },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.expected_price) {
      Alert.alert("Input Error", "Title and Expected Price are required.");
      return;
    }

    if (Number(form.expected_price) < 5000) {
      Alert.alert("Error", "Price cannot be less than 5000");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        images: JSON.stringify(form.images),
      };

      if (id) {
        // await apiService.updateVehicle(Number(id), payload);
        Alert.alert("Success", "Vehicle updated successfully (Simulation)");
      } else {
        // await apiService.createVehicle(payload);
        Alert.alert("Success", "Vehicle listed successfully (Simulation)");
      }
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save vehicle");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: "Basic", icon: "car-outline" },
    { id: 2, name: "Specs", icon: "settings-outline" },
    { id: 3, name: "Price", icon: "cash-outline" },
    { id: 4, name: "Legal", icon: "document-text-outline" },
    { id: 5, name: "Self", icon: "person-outline" },
  ];

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View className="space-y-4">
            <Label>Vehicle Type</Label>
            <View className="flex-row gap-4 mb-4">
              {["Car", "Bike"].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setForm({ ...form, type })}
                  className={`flex-1 flex-row items-center justify-center p-4 rounded-2xl border-2 ${
                    form.type === type
                      ? "bg-primary border-primary"
                      : "bg-card border-slate-700"
                  }`}
                >
                  <Ionicons
                    name={type === "Car" ? "car" : "bicycle"}
                    size={20}
                    color={form.type === type ? COLORS.white : COLORS.textMuted}
                  />
                  <Text
                    className={`font-black uppercase text-[10px] ml-2 ${form.type === type ? "text-white" : "text-text-secondary"}`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label required>Vehicle Title</Label>
            <StyledInput
              value={form.title}
              onChangeText={(txt: string) => setForm({ ...form, title: txt })}
              placeholder={`e.g. ${form.type === "Bike" ? "Yamaha R15 V4 2022" : "Toyota Camry SE 2021"}`}
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Label>Brand</Label>
                <StyledInput
                  value={form.brand}
                  onChangeText={(txt: string) =>
                    setForm({ ...form, brand: txt })
                  }
                  placeholder="e.g. Yamaha"
                />
              </View>
              <View className="flex-1">
                <Label>Model</Label>
                <StyledInput
                  value={form.model}
                  onChangeText={(txt: string) =>
                    setForm({ ...form, model: txt })
                  }
                  placeholder="e.g. R15 V4"
                />
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Label>Variant</Label>
                <StyledInput
                  value={form.variant}
                  onChangeText={(txt: string) =>
                    setForm({ ...form, variant: txt })
                  }
                  placeholder="e.g. Racing Blue"
                />
              </View>
              <View className="flex-1">
                <Label>Year of Mfg</Label>
                <StyledInput
                  value={form.yom}
                  keyboardType="numeric"
                  onChangeText={(txt: string) => setForm({ ...form, yom: txt })}
                  placeholder="2022"
                />
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View className="space-y-4">
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Label>Engine CC</Label>
                <StyledInput
                  value={form.engine_cc}
                  keyboardType="numeric"
                  onChangeText={(txt: string) =>
                    setForm({ ...form, engine_cc: txt })
                  }
                  placeholder="155"
                />
              </View>
              <View className="flex-1">
                <Label>Mileage (km/l)</Label>
                <StyledInput
                  value={form.mileage}
                  keyboardType="numeric"
                  onChangeText={(txt: string) =>
                    setForm({ ...form, mileage: txt })
                  }
                  placeholder="45"
                />
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Label>Fuel Type</Label>
                <View className="bg-card border border-slate-700 rounded-2xl p-4 mb-4">
                  <Text className="text-white font-bold text-xs">
                    {form.fuel_type}
                  </Text>
                </View>
              </View>
              <View className="flex-1">
                <Label>Transmission</Label>
                <View className="bg-card border border-slate-700 rounded-2xl p-4 mb-4">
                  <Text className="text-white font-bold text-xs">
                    {form.transmission}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Label>KM Driven</Label>
                <StyledInput
                  value={form.km_driven}
                  keyboardType="numeric"
                  onChangeText={(txt: string) =>
                    setForm({ ...form, km_driven: txt })
                  }
                  placeholder="12000"
                />
              </View>
              <View className="flex-1">
                <Label>Owners</Label>
                <StyledInput
                  value={form.owners}
                  keyboardType="numeric"
                  onChangeText={(txt: string) =>
                    setForm({ ...form, owners: txt })
                  }
                  placeholder="1"
                />
              </View>
            </View>

            <Label>Color</Label>
            <StyledInput
              value={form.color}
              onChangeText={(txt: string) => setForm({ ...form, color: txt })}
              placeholder="Metallic Black"
            />
          </View>
        );
      case 3:
        return (
          <View className="space-y-4">
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Label>City</Label>
                <StyledInput
                  value={form.city}
                  onChangeText={(txt: string) =>
                    setForm({ ...form, city: txt })
                  }
                  placeholder="Chennai"
                />
              </View>
              <View className="flex-1">
                <Label>Pincode</Label>
                <StyledInput
                  value={form.pincode}
                  keyboardType="numeric"
                  onChangeText={(txt: string) =>
                    setForm({ ...form, pincode: txt })
                  }
                  placeholder="600001"
                />
              </View>
            </View>

            <Label required>Expected Base Price (₹)</Label>
            <StyledInput
              value={form.expected_price}
              keyboardType="numeric"
              onChangeText={(txt: string) =>
                setForm({ ...form, expected_price: txt })
              }
              placeholder="145000"
            />

            <View className="bg-primary/10 border border-primary/20 p-6 rounded-[2rem] mb-6">
              <Text className="text-primary text-[8px] font-black uppercase tracking-widest mb-1">
                Pricing Preview
              </Text>
              <View className="flex-row items-baseline gap-2">
                <Text className="text-white font-black text-2xl">
                  ₹{(Number(form.expected_price || 0) + 2000).toLocaleString()}
                </Text>
                <Text className="text-primary/60 font-bold text-[10px]">
                  Net Display Price
                </Text>
              </View>
              <Text className="text-primary/40 text-[7px] mt-2 italic">
                * Includes ₹2,000 fixed platform commission
              </Text>
            </View>

            <View className="flex-row items-center justify-between mb-6 bg-card p-4 rounded-2xl border border-slate-700">
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                Price Negotiable
              </Text>
              <Switch
                value={form.negotiable}
                onValueChange={(val) => setForm({ ...form, negotiable: val })}
                trackColor={{ false: COLORS.slate700, true: COLORS.primary }}
                thumbColor={form.negotiable ? COLORS.primary : COLORS.textMuted}
              />
            </View>

            <Label>Listing Status</Label>
            <View className="flex-row gap-2">
              {["draft", "published", "sold"].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setForm({ ...form, status: s })}
                  className={`flex-1 p-3 rounded-xl border ${form.status === s ? "bg-primary border-primary" : "bg-card border-slate-700"}`}
                >
                  <Text
                    className={`text-center font-black text-[8px] uppercase tracking-widest ${form.status === s ? "text-white" : "text-text-secondary"}`}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View className="space-y-4">
            {[
              { label: "RC Book Available", key: "rc_available" },
              { label: "Insurance Available", key: "insurance_available" },
              { label: "Pollution (PUC) Clear", key: "puc_available" },
              { label: "Road Tax Paid", key: "road_tax_paid" },
            ].map((item) => (
              <View
                key={item.key}
                className="flex-row items-center justify-between bg-card p-4 rounded-2xl mb-2 border border-slate-700"
              >
                <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                  {item.label}
                </Text>
                <Switch
                  value={form[item.key]}
                  onValueChange={(val) => setForm({ ...form, [item.key]: val })}
                  trackColor={{ false: COLORS.slate700, true: COLORS.success }}
                />
              </View>
            ))}

            <Label>Insurance Valid Till</Label>
            <StyledInput
              value={form.insurance_valid}
              onChangeText={(txt: string) =>
                setForm({ ...form, insurance_valid: txt })
              }
              placeholder="YYYY-MM-DD"
            />

            <Label>Loan / Finance Status</Label>
            <View className="flex-row gap-4">
              {["Clear", "Active"].map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setForm({ ...form, loan_status: st })}
                  className={`flex-1 p-4 rounded-2xl border ${form.loan_status === st ? "bg-primary border-primary" : "bg-card border-slate-700"}`}
                >
                  <Text
                    className={`text-center font-black text-[9px] uppercase tracking-widest ${form.loan_status === st ? "text-white" : "text-text-secondary"}`}
                  >
                    {st === "Clear" ? "No Loan" : "Hypothecated"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 5:
        return (
          <View className="space-y-6">
            <Label>Vehicle Photos Gallery</Label>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-4 mb-4"
            >
              {["front", "back", "side", "dashboard", "rc"].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleImagePick(type)}
                  className="w-32 h-32 rounded-[2rem] bg-card border border-slate-700 border-dashed items-center justify-center mr-4"
                >
                  {form.images[type] ? (
                    <Image
                      source={{ uri: form.images[type] }}
                      className="w-full h-full rounded-[2rem]"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="camera-outline"
                        size={24}
                        color={COLORS.textMuted}
                      />
                      <Text className="text-text-secondary text-[8px] font-black uppercase mt-1">
                        {type}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View className="bg-card border border-slate-700 p-6 rounded-[2rem] space-y-4">
              <Text className="text-text-secondary text-[10px] font-black uppercase tracking-widest">
                Seller Context
              </Text>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Label>Seller Name</Label>
                  <StyledInput
                    value={form.seller_name}
                    onChangeText={(txt: string) =>
                      setForm({ ...form, seller_name: txt })
                    }
                    placeholder="Enter name"
                  />
                </View>
                <View className="flex-1">
                  <Label>Seller Phone</Label>
                  <StyledInput
                    value={form.seller_phone}
                    keyboardType="phone-pad"
                    onChangeText={(txt: string) =>
                      setForm({ ...form, seller_phone: txt })
                    }
                    placeholder="9876543210"
                  />
                </View>
              </View>
              <Label>Listing Description</Label>
              <StyledInput
                value={form.description}
                onChangeText={(txt: string) =>
                  setForm({ ...form, description: txt })
                }
                placeholder="Mention engine health, scratches, etc..."
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        {/* STEPPER BAR */}
        <View className="flex-row justify-between px-6 py-4 bg-background border-b border-slate-700">
          {steps.map((step) => (
            <TouchableOpacity
              key={step.id}
              onPress={() => setCurrentStep(step.id)}
              className="items-center"
            >
              <StepIcon
                name={step.icon}
                active={currentStep === step.id}
                completed={currentStep > step.id}
              />
              <Text
                className={`text-[7px] font-black uppercase mt-2 ${currentStep === step.id ? "text-primary" : "text-text-secondary"}`}
              >
                {step.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 p-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="bg-card border border-slate-700 rounded-[3rem] p-8 shadow-2xl mb-10">
              {renderCurrentStep()}
            </View>
            <View className="h-24" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* BOTTOM NAVIGATION */}
        <View className="absolute bottom-0 left-0 right-0 bg-background p-6 flex-row justify-between items-center border-t border-slate-700">
          <TouchableOpacity
            disabled={currentStep === 1}
            onPress={() => setCurrentStep((p) => p - 1)}
            className={`px-8 py-4 rounded-2xl flex-row items-center ${currentStep === 1 ? "opacity-20" : "bg-card"}`}
          >
            <Ionicons name="chevron-back" size={18} color={COLORS.white} />
            <Text className="text-white font-black uppercase text-[10px] ml-2">
              Back
            </Text>
          </TouchableOpacity>

          {currentStep < steps.length ? (
            <TouchableOpacity
              onPress={() => setCurrentStep((p) => p + 1)}
              className="bg-primary px-10 py-4 rounded-2xl flex-row items-center"
            >
              <Text className="text-background font-black uppercase text-[10px] mr-2">
                Continue
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.background}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="bg-primary px-10 py-4 rounded-2xl flex-row items-center shadow-lg"
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <>
                  <Text className="text-background font-black uppercase text-[10px] mr-2">
                    Finalize Listing
                  </Text>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color={COLORS.background}
                  />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AdminAddVehicle;
