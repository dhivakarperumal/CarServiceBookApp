import React from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { COLORS } from "../../theme/colors";

const STATUS_FLOW = [
    "BOOKED",
    "CALL_VERIFIED",
    "APPROVED",
    "PROCESSING",
    "WAITING_SPARE",
    "SERVICE_GOING",
    "BILL_PENDING",
    "BILL_COMPLETED",
    "SERVICE_COMPLETED",
];

const STATUS_NORMALIZER: Record<string, string> = {
    "Booked": "BOOKED",
    "Appointment Booked": "BOOKED",
    "Call Verified": "CALL_VERIFIED",
    "Confirmed": "APPROVED",
    "Approved": "APPROVED",
    "In Progress": "PROCESSING",
    "Processing": "PROCESSING",
    "Waiting for Spare": "WAITING_SPARE",
    "Service Going on": "SERVICE_GOING",
    "Bill Pending": "BILL_PENDING",
    "Bill Completed": "BILL_COMPLETED",
    "Service Completed": "SERVICE_COMPLETED",
    "Completed": "SERVICE_COMPLETED",
    "Cancelled": "CANCELLED",
};

/* ===== TYPES ===== */

type Part = {
    id: string;
    partName: string;
    qty: number;
    price: number;
    total: number;
    status: "pending" | "approved" | "rejected";
};

type Issue = {
    id: string;
    issue: string;
    issueAmount?: number;
    issueStatus?: "pending" | "approved" | "rejected";
    createdAt?: string;
};

type Booking = {
    bookingId: string;
    name: string;
    phone: string;
    brand?: string;
    model?: string;
    vehicleNumber?: string;
    registrationNumber?: string;
    issue?: string;
    preferredDate?: string;
    preferredTimeSlot?: string;
    assignedEmployeeName?: string;
    address?: string;
    location?: string;
    issues?: Issue[];
    issueAmount?: number;
    issueStatus?: string;
    createdAt?: string;
    serviceId?: number;
    status: string;
};

type SpareService = {
    serviceId: number;
    serviceName: string;
    parts: Part[];
};

type Props = {
    visible: boolean;
    booking: Booking;
    spareParts: SpareService[];
    onClose: () => void;
    onApprove: (
        serviceId: number,
        itemId: string | null,
        status: "approved" | "rejected",
        type?: "part" | "issue"
    ) => void;
};

/* ===== COMPONENT ===== */

const BookingModal: React.FC<Props> = ({
    visible,
    booking,
    spareParts,
    onClose,
    onApprove,
}) => {
    const bookingSpare = spareParts?.find(
        (sp) =>
            sp.serviceId === booking.serviceId ||
            sp.serviceName === booking.bookingId
    );

    const StatusTracker = ({ currentStatus }: { currentStatus: string }) => {
        const normalized =
            STATUS_NORMALIZER[currentStatus] || currentStatus;

        const activeIndex = STATUS_FLOW.indexOf(normalized);

        return (
            <View className="flex-row flex-wrap justify-center mt-6">
                {STATUS_FLOW.map((status, index) => {
                    const isCompleted = index <= activeIndex;

                    return (
                        <View key={status} className="items-center m-2">
                            <View
                                className={`w-11 h-11 rounded-full items-center justify-center border-2 ${isCompleted
                                    ? "bg-primary border-primary"
                                    : "bg-card border-gray700"
                                    }`}
                            >
                                <Text
                                    className={`font-bold text-xs ${isCompleted ? "text-text-primary" : "text-gray400"
                                        }`}
                                >
                                    {index + 1}
                                </Text>
                            </View>

                            <Text
                                className={`text-[10px] text-center mt-1 w-[70px] ${isCompleted ? "text-primary" : "text-gray500"
                                    }`}
                            >
                                {status.replace("_", " ")}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/70 justify-center px-4">
                <View
                    className="rounded-2xl p-4 max-h-[90%]"
                    style={{
                        backgroundColor: COLORS.background,
                        borderWidth: 1,
                        borderColor: COLORS.primary,
                    }}
                >
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* CLOSE */}
                        <TouchableOpacity
                            onPress={onClose}
                            className="absolute right-2 top-2 z-10"
                        >
                            <Text className="text-text-secondary text-xl">✕</Text>
                        </TouchableOpacity>

                        {/* HEADER */}
                        <Text className="text-primary text-lg font-bold mb-4">
                            Booking ID: {booking.bookingId}
                        </Text>

                        {/* DETAILS */}
                        <View className="space-y-2">
                            <Text className="text-text-secondary">
                                <Text className="text-primary">Name: </Text>
                                {booking.name}
                            </Text>

                            <Text className="text-text-secondary">
                                <Text className="text-primary">Phone: </Text>
                                {booking.phone}
                            </Text>

                            <Text className="text-text-secondary">
                                <Text className="text-primary">Brand: </Text>
                                {booking.brand}
                            </Text>

                            <Text className="text-text-secondary">
                                <Text className="text-primary">Model: </Text>
                                {booking.model}
                            </Text>

                            <Text className="text-text-secondary">
                                <Text className="text-primary">Reg No: </Text>
                                {booking.vehicleNumber ||
                                    booking.registrationNumber ||
                                    "N/A"}
                            </Text>

                            <Text className="text-text-secondary">
                                <Text className="text-primary">Issue: </Text>
                                {booking.issue}
                            </Text>

                            {booking.preferredDate && (
                                <Text className="text-text-secondary">
                                    <Text className="text-primary">Date: </Text>
                                    {new Date(
                                        booking.preferredDate
                                    ).toLocaleDateString()}
                                </Text>
                            )}

                            {booking.assignedEmployeeName && (
                                <View
                                    className="p-2 rounded-lg mt-2"
                                    style={{
                                        backgroundColor: COLORS.primary + "20",
                                    }}
                                >
                                    <Text className="text-primary font-bold">
                                        🔧 {booking.assignedEmployeeName}
                                    </Text>
                                </View>
                            )}

                            <Text className="text-text-secondary">
                                <Text className="text-primary">Address: </Text>
                                {booking.address || booking.location}
                            </Text>
                        </View>

                        {/* ===== SPARE PARTS ===== */}
                        {bookingSpare?.parts?.length > 0 && (
                            <View className="mt-6">
                                <Text className="text-primary font-bold mb-2">
                                    🔧 Spare Parts
                                </Text>

                                {bookingSpare.parts.map((part) => {
                                    const status = part.status || "pending";

                                    return (
                                        <View
                                            key={part.id}
                                            className="p-3 rounded-lg mb-2 bg-card"

                                        >
                                            <Text className="text-text-primary
 font-semibold">
                                                {part.partName}
                                            </Text>

                                            <Text className="text-text-secondary text-sm">
                                                {part.qty} × ₹{part.price} = ₹
                                                {part.total}
                                            </Text>

                                            <Text
                                                className="text-xs mt-1 font-bold"
                                                style={{
                                                    color:
                                                        status === "approved"
                                                            ? COLORS.success
                                                            : status === "rejected"
                                                                ? COLORS.error
                                                                : COLORS.warning,
                                                }}
                                            >
                                                {status.toUpperCase()}
                                            </Text>

                                            {status === "pending" && (
                                                <View className="flex-row gap-2 mt-2">
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            onApprove(
                                                                bookingSpare.serviceId,
                                                                part.id,
                                                                "approved"
                                                            )
                                                        }
                                                        className="flex-1 p-2 rounded-lg"
                                                        style={{ backgroundColor: COLORS.success }}
                                                    >
                                                        <Text className="text-text-primary
 text-center text-xs font-bold">
                                                            Approve
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            onApprove(
                                                                bookingSpare.serviceId,
                                                                part.id,
                                                                "rejected"
                                                            )
                                                        }
                                                        className="flex-1 p-2 rounded-lg"
                                                        style={{ backgroundColor: COLORS.error }}
                                                    >
                                                        <Text className="text-text-primary
 text-center text-xs font-bold">
                                                            Reject
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}

                                <Text className="text-right text-primary font-bold mt-2">
                                    Total: ₹
                                    {bookingSpare.parts
                                        .reduce((sum, p) => sum + Number(p.total), 0)
                                        .toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* ===== ISSUES ===== */}
                        <View className="mt-6">
                            <Text className="text-primary font-bold mb-2">
                                ⚙️ Service Issues
                            </Text>

                            {booking.issues && booking.issues.length > 0 ? (
                                booking.issues.map((issue) => {
                                    const status = issue.issueStatus || "pending";

                                    return (
                                        <View key={issue.id} className="p-3 rounded-lg mb-2 bg-card" >
                                            <Text className="text-text-secondary text-sm">{issue.issue}</Text>

                                            {issue.issueAmount && (
                                                <Text className="text-warning font-bold">
                                                    ₹{issue.issueAmount}
                                                </Text>
                                            )}

                                            <Text
                                                style={{
                                                    color:
                                                        status === "approved"
                                                            ? COLORS.success
                                                            : status === "rejected"
                                                                ? COLORS.error
                                                                : COLORS.warning,
                                                }}
                                            >
                                                {status.toUpperCase()}
                                            </Text>

                                            {status === "pending" && booking.serviceId && (
                                                <View className="flex-row gap-2 mt-2">
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            onApprove(booking.serviceId!, issue.id, "approved", "issue")
                                                        }
                                                        className="flex-1 p-2 rounded-lg bg-success"
                                                    >
                                                        <Text className="text-text-primary
 text-center text-xs font-bold">
                                                            Approve
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            onApprove(booking.serviceId!, issue.id, "rejected", "issue")
                                                        }
                                                        className="flex-1 p-2 rounded-lg bg-error"
                                                    >
                                                        <Text className="text-text-primary
 text-center text-xs font-bold">
                                                            Reject
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })
                            ) : booking.issue ? (
                                <Text className="text-text-secondary">{booking.issue}</Text>
                            ) : (
                                <Text className="text-gray500">No issues</Text>
                            )}
                        </View>

                        <View className="mt-6">
                            {booking.status !== "CANCELLED" ? (
                                <StatusTracker currentStatus={booking.status} />
                            ) : (
                                <Text className="text-error text-center font-bold">
                                    ❌ Booking Cancelled
                                </Text>
                            )}
                        </View>

                        {/* CLOSE BUTTON */}
                        <TouchableOpacity
                            onPress={onClose}
                            className="mt-6 p-3 rounded-lg bg-primary"
                        >
                            <Text className="text-text-primary
 text-center font-bold">
                                Close
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default BookingModal;