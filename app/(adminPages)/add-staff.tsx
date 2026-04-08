import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../services/api";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const roles = ["mechanic", "receptionist", "manager", "staff", "admin"];

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  multiline,
  numberOfLines,
  keyboardType,
}: any) => (
  <View className="mb-4">
    <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
      {label}
    </Text>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#64748b"
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      className={`w-full bg-slate-900 rounded-2xl border px-4 py-3 text-white font-bold ${
        error ? "border-red-500" : "border-slate-800"
      }`}
    />
    {error && (
      <Text className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
        {error}
      </Text>
    )}
  </View>
);

const CustomSelect = ({ label, value, options, onSelect, error }: any) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className={`w-full bg-slate-900 rounded-2xl border px-4 py-3 flex-row justify-between items-center ${
          error ? "border-red-500" : "border-slate-800"
        }`}
      >
        <Text
          className={value ? "text-white font-bold" : "text-slate-500"}
        >
          {value || "Select option"}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#0EA5E9"
        />
      </TouchableOpacity>

      {open && (
        <View className="absolute top-full left-0 right-0 bg-slate-900 border border-slate-800 rounded-2xl mt-1 z-50 shadow-2xl">
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
              className="px-4 py-3 border-b border-slate-800 last:border-0"
            >
              <Text className="text-white font-bold capitalize">
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text className="text-red-500 text-[10px] mt-1 ml-1 font-bold">
          {error}
        </Text>
      )}
    </View>
  );
};

export default function AddStaff() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(isEdit);
  const [errors, setErrors] = useState<any>({});

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    employeeId: "",
    role: "",
    gender: "",
    bloodGroup: "",
    dob: "",
    joiningDate: "",
    qualification: "",
    experience: "",
    shift: "",
    salary: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    timeIn: "",
    timeOut: "",
    status: "active",
  });

  // Load staff for edit
  useEffect(() => {
    if (!isEdit) return;

    const loadStaff = async () => {
      try {
        const res = await api.get(`/staff/${id}`);
        const data = res.data;

        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          employeeId: data.employee_id || "",
          role: data.role || "",
          gender: data.gender || "",
          bloodGroup: data.blood_group || "",
          dob: data.dob || "",
          joiningDate: data.joining_date || "",
          qualification: data.qualification || "",
          experience: data.experience || "",
          shift: data.shift || "",
          salary: data.salary || "",
          address: data.address || "",
          emergencyName: data.emergency_name || "",
          emergencyPhone: data.emergency_phone || "",
          timeIn: data.time_in ? data.time_in.slice(0, 5) : "",
          timeOut: data.time_out ? data.time_out.slice(0, 5) : "",
          status: data.status || "active",
        }));
      } catch (err) {
        console.error("Load error:", err);
        Alert.alert("Error", "Failed to load staff details");
      } finally {
        setFormLoading(false);
      }
    };

    loadStaff();
  }, [id, isEdit]);

  const handleChange = (name: string, value: string) => {
    let nextForm = { ...form, [name]: value };

    // Auto-populate username from email
    if (name === "email" && value.includes("@")) {
      const usernameFromEmail = value.split("@")[0];
      if (!form.username || form.username === form.email.split("@")[0]) {
        nextForm.username = usernameFromEmail;
      }
    }

    // Auto-populate password from phone (new staff only)
    if (!isEdit && (name === "phone" || name === "mobile")) {
      nextForm.password = value;
    }

    setForm(nextForm);
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!form.name?.trim()) newErrors.name = "Name is required";
    if (!form.email?.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email";

    if (!isEdit && !form.password?.trim())
      newErrors.password = "Password required";
    else if (!isEdit && form.password.length < 6)
      newErrors.password = "Password must be 6+ characters";

    if (!form.phone?.trim()) newErrors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "")))
      newErrors.phone = "Invalid phone (10 digits)";

    if (!form.username?.trim()) newErrors.username = "Username required";
    if (!form.role) newErrors.role = "Role required";
    if (!form.salary?.trim()) newErrors.salary = "Salary required";
    if (!form.shift?.trim()) newErrors.shift = "Shift required";
    if (!form.gender) newErrors.gender = "Gender required";
    if (!form.bloodGroup) newErrors.bloodGroup = "Blood group required";
    if (!form.dob?.trim()) newErrors.dob = "DOB required";
    if (!form.joiningDate?.trim())
      newErrors.joiningDate = "Joining date required";
    if (!form.address?.trim()) newErrors.address = "Address required";
    if (!form.timeIn?.trim()) newErrors.timeIn = "Time In required";
    if (!form.timeOut?.trim()) newErrors.timeOut = "Time Out required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Validation", "Please fix the errors");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone,
        employee_id: form.employeeId,
        role: form.role,
        gender: form.gender,
        blood_group: form.bloodGroup,
        dob: form.dob,
        joining_date: form.joiningDate,
        qualification: form.qualification,
        experience: form.experience,
        shift: form.shift,
        salary: form.salary,
        address: form.address,
        emergency_name: form.emergencyName,
        emergency_phone: form.emergencyPhone,
        time_in: form.timeIn,
        time_out: form.timeOut,
        status: form.status,
        password: !isEdit ? form.password : undefined,
      };

      if (isEdit) {
        await api.put(`/staff/${id}`, payload);
        Alert.alert("Success", "Staff updated successfully");
      } else {
        await api.post("/staff", payload);
        Alert.alert("Success", "Staff added successfully");
      }

      setTimeout(() => router.back(), 800);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  if (formLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View className="mb-8 flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-3 bg-slate-900 rounded-2xl border border-slate-800"
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-black text-white">
              {isEdit ? "Edit Staff" : "Register Staff"}
            </Text>
            <Text className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-black">
              {isEdit ? "Update details" : "Auto-create login account"}
            </Text>
          </View>
        </View>

        {/* FORM SECTIONS */}
        <View className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
          {/* PERSONAL DETAILS */}
          <Text className="text-lg font-black text-white mb-4">
            👤 Personal Details
          </Text>

          <CustomInput
            label="Full Name *"
            placeholder="Enter name"
            value={form.name}
            onChangeText={(val) => handleChange("name", val)}
            error={errors.name}
          />

          <CustomInput
            label="Display Name *"
            placeholder="Username"
            value={form.username}
            onChangeText={(val) => handleChange("username", val)}
            error={errors.username}
          />

          <CustomInput
            label="Email *"
            placeholder="staff@example.com"
            value={form.email}
            onChangeText={(val) => handleChange("email", val)}
            error={errors.email}
            keyboardType="email-address"
          />

          {!isEdit && (
            <CustomInput
              label="Password (Auto-set from phone) *"
              placeholder="Set password"
              value={form.password}
              onChangeText={(val) => handleChange("password", val)}
              error={errors.password}
            />
          )}

          <CustomInput
            label="Phone *"
            placeholder="10-digit number"
            value={form.phone}
            onChangeText={(val) => handleChange("phone", val)}
            error={errors.phone}
            keyboardType="phone-pad"
          />

          <CustomSelect
            label="Gender *"
            value={form.gender}
            options={["Male", "Female", "Other"]}
            onSelect={(val) => handleChange("gender", val)}
            error={errors.gender}
          />

          <CustomSelect
            label="Blood Group *"
            value={form.bloodGroup}
            options={bloodGroups}
            onSelect={(val) => handleChange("bloodGroup", val)}
            error={errors.bloodGroup}
          />

          <CustomInput
            label="Date of Birth *"
            placeholder="YYYY-MM-DD"
            value={form.dob}
            onChangeText={(val) => handleChange("dob", val)}
            error={errors.dob}
          />

          <CustomInput
            label="Address *"
            placeholder="Full address"
            value={form.address}
            onChangeText={(val) => handleChange("address", val)}
            error={errors.address}
            multiline
            numberOfLines={3}
          />

          {/* EMPLOYMENT DETAILS */}
          <Text className="text-lg font-black text-white mt-8 mb-4">
            💼 Employment Details
          </Text>

          <CustomSelect
            label="Role *"
            value={form.role}
            options={roles}
            onSelect={(val) => handleChange("role", val)}
            error={errors.role}
          />

          <CustomInput
            label="Salary *"
            placeholder="Monthly salary"
            value={form.salary}
            onChangeText={(val) => handleChange("salary", val)}
            error={errors.salary}
            keyboardType="decimal-pad"
          />

          <CustomInput
            label="Shift *"
            placeholder="e.g., Morning"
            value={form.shift}
            onChangeText={(val) => handleChange("shift", val)}
            error={errors.shift}
          />

          <CustomInput
            label="Time In (HH:MM) *"
            placeholder="09:00"
            value={form.timeIn}
            onChangeText={(val) => handleChange("timeIn", val)}
            error={errors.timeIn}
          />

          <CustomInput
            label="Time Out (HH:MM) *"
            placeholder="18:00"
            value={form.timeOut}
            onChangeText={(val) => handleChange("timeOut", val)}
            error={errors.timeOut}
          />

          <CustomInput
            label="Joining Date *"
            placeholder="YYYY-MM-DD"
            value={form.joiningDate}
            onChangeText={(val) => handleChange("joiningDate", val)}
            error={errors.joiningDate}
          />

          {/* ADDITIONAL DETAILS */}
          <Text className="text-lg font-black text-white mt-8 mb-4">
            📋 Additional Details
          </Text>

          <CustomInput
            label="Qualification"
            placeholder="e.g., Diploma in Mechanical"
            value={form.qualification}
            onChangeText={(val) => handleChange("qualification", val)}
          />

          <CustomInput
            label="Experience (Years)"
            placeholder="e.g., 5"
            value={form.experience}
            onChangeText={(val) => handleChange("experience", val)}
            keyboardType="decimal-pad"
          />

          <CustomInput
            label="Emergency Contact Name"
            placeholder="Name"
            value={form.emergencyName}
            onChangeText={(val) => handleChange("emergencyName", val)}
          />

          <CustomInput
            label="Emergency Contact Phone"
            placeholder="Phone number"
            value={form.emergencyPhone}
            onChangeText={(val) => handleChange("emergencyPhone", val)}
            keyboardType="phone-pad"
          />

          {/* ACTIONS */}
          <View className="flex-row gap-4 mt-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 border border-sky-500 py-4 rounded-2xl items-center"
            >
              <Text className="text-sky-500 font-black uppercase">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="flex-1 bg-sky-500 py-4 rounded-2xl items-center shadow-lg"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-black uppercase">
                  {isEdit ? "Update" : "Register"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
