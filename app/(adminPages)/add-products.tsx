import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ActivityIndicator, 
  Alert, 
  Platform,
  Switch
} from "react-native";
import { api } from "../../services/api";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from 'expo-image-picker';

/* REUSABLE COMPONENTS */
const Label = ({ children, required }: any) => (
  <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
    {children} {required && <Text className="text-red-500">*</Text>}
  </Text>
);

const StyledInput = ({ ...props }: any) => (
  <TextInput
    placeholderTextColor="#475569"
    className="bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold text-xs mb-4"
    {...props}
  />
);

const AdminAddProduct = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editData = params.editData ? JSON.parse(params.editData as string) : null;

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState({
    id: "",
    name: "",
    slug: "",
    brand: "",
    description: "",
    mrp: "",
    offer: "",
    offerPrice: "",
    tags: "",
    category: "General",
    warrantyAvailable: false,
    warrantyMonths: "",
    returnAvailable: false,
    returnDays: "",
    isFeatured: false,
    isActive: true,
    rating: "",
  });

  const [variants, setVariants] = useState([
    { sku: "", position: "", material: "", stock: "" },
  ]);

  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState("");

  /* AUTO SLUG */
  useEffect(() => {
    if (product.name) {
      setProduct((prev) => ({
        ...prev,
        slug: product.name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, ""),
      }));
    }
  }, [product.name]);

  /* AUTO OFFER PRICE */
  useEffect(() => {
    const mrp = Number(product.mrp || 0);
    const offer = Number(product.offer || 0);
    if (mrp && offer >= 0) {
      const offerPrice = mrp - (mrp * offer) / 100;
      setProduct((prev) => ({ ...prev, offerPrice: offerPrice.toFixed(2) }));
    }
  }, [product.mrp, product.offer]);

  /* LOAD EDIT DATA */
  useEffect(() => {
    if (editData) {
      let cleanThumbnail = editData.thumbnail || "";
      if (typeof cleanThumbnail === 'string' && cleanThumbnail.startsWith('[')) {
        try {
          const parsed = JSON.parse(cleanThumbnail);
          cleanThumbnail = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : "";
        } catch (e) {
          console.error("Malformed thumbnail:", e);
        }
      }

      setProduct({
        ...editData,
        tags: Array.isArray(editData.tags)
          ? editData.tags.join(", ")
          : editData.tags || "",
        warrantyAvailable: editData?.warranty?.available || false,
        warrantyMonths: editData?.warranty?.available ? String(editData?.warranty?.months || "") : "",
        returnAvailable: editData?.returnPolicy?.available || false,
        returnDays: editData?.returnPolicy?.available ? String(editData?.returnPolicy?.days || "") : "",
        rating: String(editData?.rating || ""),
        mrp: String(editData.mrp || ""),
        offer: String(editData.offer || ""),
        offerPrice: String(editData.offerPrice || ""),
      });
      setVariants(editData.variants?.map((v: any) => ({
        sku: v.sku || "",
        position: v.position || "",
        material: v.material || "",
        stock: String(v.stock || "")
      })) || [{ sku: "", position: "", material: "", stock: "" }]);
      setImages(editData.images || []);
      setThumbnail(cleanThumbnail);
    }
  }, []);

  /* GENERATE PRODUCT ID */
  const generateProductId = async () => {
    try {
      const res = await api.get("/products");
      const products = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const count = products.length + 1;
      return `PR${String(count).padStart(3, "0")}`;
    } catch {
      return `PR${Date.now().toString().slice(-6)}`;
    }
  };

  /* CHANGE HANDLERS */
  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    (newVariants[index] as any)[field] = value;
    setVariants(newVariants);
  };

  const addVariant = () =>
    setVariants([...variants, { sku: "", position: "", material: "", stock: "" }]);

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  /* IMAGE HANDLING */
  const pickImage = async () => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset: any) => {
        // Return base64 with data URI prefix if available
        if (asset.base64) {
          return `data:image/jpeg;base64,${asset.base64}`;
        }
        return asset.uri;
      });

      setImages([...images, ...selectedImages]);
      if (!thumbnail && selectedImages.length > 0) {
        setThumbnail(selectedImages[0]);
      }
    }
  } catch (error) {
    console.error("Error picking image:", error);
    Alert.alert("Error", "Something went wrong while picking images.");
  }
};

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (thumbnail === imageToRemove) {
      setThumbnail(updated.length > 0 ? updated[0] : "");
    }
  };

  /* SUBMIT */
  const handleSubmit = async () => {
    if (!product.name || !product.mrp) {
      Alert.alert("Input Error", "Product Name and MRP are required.");
      return;
    }

    setLoading(true);
    try {
      let productId = product.id;
      if (!editData) productId = await generateProductId();

      const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);

      const productData = {
        id: productId,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        description: product.description,
        mrp: Number(product.mrp),
        offer: Number(product.offer),
        offerPrice: Number(product.offerPrice),
        warranty: {
          available: product.warrantyAvailable,
          months: product.warrantyAvailable ? Number(product.warrantyMonths || 0) : 0,
        },
        returnPolicy: {
          available: product.returnAvailable,
          days: product.returnAvailable ? Number(product.returnDays || 0) : 0,
        },
        rating: product.rating || "0",
        variants: variants.map((v) => ({ ...v, stock: Number(v.stock) })),
        images,
        thumbnail,
        tags: product.tags ? product.tags.split(",").map((t) => t.trim()) : [],
        totalStock,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
      };

      if (!editData) {
        await api.post("/products", productData);
        Alert.alert("Success", `Product ${productId} Added Successfully`);
      } else {
        await api.put(`/products/${editData.docId || editData.id}`, productData);
        Alert.alert("Success", `Product ${productId} Updated Successfully`);
      }

      router.replace("/(admin)/products");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.message || "Error saving product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAwareScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* HEADER */}
          <View className="flex-row items-center gap-4 mb-8">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-2xl font-black uppercase tracking-tighter">
                {editData ? "Update Product" : "Add Product"}
              </Text>
              <Text className="text-sky-500 text-[10px] font-black uppercase tracking-widest">
                Vehicle Spare Parts & Components
              </Text>
            </View>
          </View>

          {/* FORM CONTAINER */}
          <View className="bg-slate-900/50 p-6 rounded-[32px] border border-white/5 shadow-2xl mb-12">
            
            {/* BASIC INFO */}
            <Label required>Product Name</Label>
            <StyledInput 
              value={product.name} 
              onChangeText={(val: string) => setProduct({...product, name: val})}
              placeholder="e.g. Bosch Brake Pad Set"
            />

            <Label>Brand</Label>
            <StyledInput 
              value={product.brand} 
              onChangeText={(val: string) => setProduct({...product, brand: val})}
              placeholder="e.g. Bosch / Brembo"
            />

            <Label>Category</Label>
            <View className="flex-row flex-wrap gap-2 mb-4">
               {['General', 'Exterior', 'Interior', 'Engine', 'Electronics', 'Brakes', 'Suspension'].map((cat) => (
                  <TouchableOpacity 
                     key={cat}
                     onPress={() => setProduct({...product, category: cat})}
                     className={`px-4 py-2 rounded-xl border ${product.category === cat ? 'bg-sky-500 border-sky-400' : 'bg-slate-900 border-white/5'}`}
                  >
                     <Text className={`${product.category === cat ? 'text-white' : 'text-slate-500'} text-[10px] font-black uppercase tracking-tighter`}>{cat}</Text>
                  </TouchableOpacity>
               ))}
            </View>

            <Label>Description</Label>
            <StyledInput 
              value={product.description} 
              onChangeText={(val: string) => setProduct({...product, description: val})}
              placeholder="Detailed specifications..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View className="h-px bg-white/5 my-6" />

            {/* PRICING */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Label required>MRP (₹)</Label>
                <StyledInput 
                  value={product.mrp} 
                  keyboardType="numeric"
                  onChangeText={(val: string) => setProduct({...product, mrp: val})}
                  placeholder="2499"
                />
              </View>
              <View className="flex-1">
                <Label>Offer %</Label>
                <StyledInput 
                  value={product.offer} 
                  keyboardType="numeric"
                  onChangeText={(val: string) => setProduct({...product, offer: val})}
                  placeholder="15"
                />
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Label>Final Price (₹)</Label>
                <View className="bg-slate-800/50 rounded-2xl px-5 py-4 mb-4 border border-white/5">
                   <Text className="text-sky-400 font-bold text-xs">{product.offerPrice || "0.00"}</Text>
                </View>
              </View>
              <View className="flex-1">
                <Label>Rating (0-5)</Label>
                <StyledInput 
                  value={product.rating} 
                  keyboardType="numeric"
                  onChangeText={(val: string) => setProduct({...product, rating: val})}
                  placeholder="4.5"
                />
              </View>
            </View>

            <View className="h-px bg-white/5 my-6" />

            {/* VARIANTS */}
            <View className="flex-row justify-between items-center mb-4">
              <Label>Product Variants</Label>
              <TouchableOpacity onPress={addVariant} className="bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/20">
                <Text className="text-sky-500 text-[10px] font-black uppercase">+ Add</Text>
              </TouchableOpacity>
            </View>

            {variants.map((v, i) => (
              <View key={i} className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 mb-4 relative">
                {variants.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => removeVariant(i)}
                    className="absolute top-2 right-2 w-6 h-6 items-center justify-center"
                  >
                    <Ionicons name="close-circle" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-[8px] font-black uppercase mb-1 ml-1">SKU</Text>
                    <TextInput 
                      className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white text-[10px] font-bold"
                      value={v.sku}
                      onChangeText={(val) => handleVariantChange(i, 'sku', val)}
                      placeholder="SKU001"
                      placeholderTextColor="#334155"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-[8px] font-black uppercase mb-1 ml-1">Stock</Text>
                    <TextInput 
                      className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white text-[10px] font-bold"
                      value={v.stock}
                      keyboardType="numeric"
                      onChangeText={(val) => handleVariantChange(i, 'stock', val)}
                      placeholder="10"
                      placeholderTextColor="#334155"
                    />
                  </View>
                </View>
                <View className="flex-row gap-2 mt-2">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-[8px] font-black uppercase mb-1 ml-1">Position</Text>
                    <TextInput 
                      className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white text-[10px] font-bold"
                      value={v.position}
                      onChangeText={(val) => handleVariantChange(i, 'position', val)}
                      placeholder="Front Left"
                      placeholderTextColor="#334155"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-[8px] font-black uppercase mb-1 ml-1">Material</Text>
                    <TextInput 
                      className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white text-[10px] font-bold"
                      value={v.material}
                      onChangeText={(val) => handleVariantChange(i, 'material', val)}
                      placeholder="Ceramic"
                      placeholderTextColor="#334155"
                    />
                  </View>
                </View>
              </View>
            ))}

            <View className="h-px bg-white/5 my-6" />

            {/* IMAGES */}
            <View className="flex-row justify-between items-center mb-4">
              <Label>Product Gallery</Label>
              <TouchableOpacity onPress={pickImage} className="bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <Text className="text-amber-500 text-[10px] font-black uppercase">Upload Images</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
              {images.length === 0 ? (
                <View className="w-32 h-32 bg-slate-950 rounded-2xl border border-white/5 border-dashed items-center justify-center">
                  <MaterialIcons name="image" size={24} color="#1e293b" />
                  <Text className="text-gray-700 text-[8px] font-black uppercase mt-2">No Images</Text>
                </View>
              ) : (
                images.map((img, i) => (
                  <View key={i} className={`mr-4 relative ${thumbnail === img ? 'border-2 border-sky-500 p-0.5 rounded-2xl' : ''}`}>
                    <Image source={{ uri: img }} className="w-32 h-32 rounded-2xl bg-slate-950" />
                    <TouchableOpacity 
                      onPress={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center border-2 border-slate-950 shadow-lg"
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </TouchableOpacity>
                    {thumbnail !== img && (
                      <TouchableOpacity 
                        onPress={() => setThumbnail(img)}
                        className="absolute bottom-2 left-2 bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10"
                      >
                        <Text className="text-white text-[7px] font-black uppercase">Set Main</Text>
                      </TouchableOpacity>
                    )}
                    {thumbnail === img && (
                      <View className="absolute bottom-2 left-2 bg-sky-500 px-2 py-1 rounded-lg">
                        <Text className="text-white text-[7px] font-black uppercase">Main Image</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>

            <View className="h-px bg-white/5 my-6" />

            {/* ADDITIONAL OPTIONS */}
            <View className="bg-slate-950/30 p-4 rounded-3xl border border-white/5 mb-6">
               <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white text-[10px] font-black uppercase">Warranty Policy</Text>
                  <Switch 
                    value={product.warrantyAvailable} 
                    onValueChange={(val) => setProduct({...product, warrantyAvailable: val})}
                    trackColor={{ false: "#1e293b", true: "#0284c7" }}
                    thumbColor={product.warrantyAvailable ? "#38bdf8" : "#94a3b8"}
                  />
               </View>
               {product.warrantyAvailable && (
                 <StyledInput 
                    value={product.warrantyMonths}
                    onChangeText={(val: string) => setProduct({...product, warrantyMonths: val})}
                    placeholder="Duration in Months (e.g. 12)"
                    keyboardType="numeric"
                 />
               )}

               <View className="flex-row justify-between items-center mb-4 mt-2">
                  <Text className="text-white text-[10px] font-black uppercase">Return Policy</Text>
                  <Switch 
                    value={product.returnAvailable} 
                    onValueChange={(val) => setProduct({...product, returnAvailable: val})}
                    trackColor={{ false: "#1e293b", true: "#22c55e" }}
                    thumbColor={product.returnAvailable ? "#4ade80" : "#94a3b8"}
                  />
               </View>
               {product.returnAvailable && (
                 <StyledInput 
                    value={product.returnDays}
                    onChangeText={(val: string) => setProduct({...product, returnDays: val})}
                    placeholder="Return Window in Days (e.g. 7)"
                    keyboardType="numeric"
                 />
               )}
            </View>

            <Label>Tags (Comma separated)</Label>
            <StyledInput 
              value={product.tags} 
              onChangeText={(val: string) => setProduct({...product, tags: val})}
              placeholder="breaks, bosch, car-spare, spare-parts"
            />

            <View className="flex-row gap-8 mb-8 ml-2">
               <View className="flex-row items-center gap-2">
                  <Switch 
                    value={product.isFeatured} 
                    onValueChange={(val) => setProduct({...product, isFeatured: val})}
                  />
                  <Text className="text-gray-500 text-[10px] font-black uppercase">Featured</Text>
               </View>
               <View className="flex-row items-center gap-2">
                  <Switch 
                    value={product.isActive} 
                    onValueChange={(val) => setProduct({...product, isActive: val})}
                  />
                  <Text className="text-gray-500 text-[10px] font-black uppercase">Active</Text>
               </View>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={loading}
              className={`rounded-3xl overflow-hidden ${loading ? 'opacity-50' : ''}`}
            >
              <View className="bg-sky-500 py-5 items-center flex-row justify-center gap-3">
                 {loading ? <ActivityIndicator color="white" /> : (
                   <>
                    <Text className="text-white font-black uppercase tracking-widest">
                      {editData ? "Update Component →" : "Register Product →"}
                    </Text>
                   </>
                 )}
              </View>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default AdminAddProduct;
