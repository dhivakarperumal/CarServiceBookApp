import React from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../theme/colors";

/* ===== STATUS FLOW ===== */

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
  id?: string;
  _id?: string;
  issueId?: string;
  issue_id?: string;
  issue: string;
  issueAmount?: number;
  issueStatus?: "pending" | "approved" | "rejected";
};

type Booking = {
  id?: number;
  bookingId: string;
  name: string;
  phone: string;
  brand?: string;
  model?: string;
  vehicleNumber?: string;
  registrationNumber?: string;
  issue?: string;
  preferredDate?: string;
  assignedEmployeeName?: string;
  address?: string;
  location?: string;
  issues?: Issue[];
  issueAmount?: number;
  issueStatus?: string;
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
    itemId: string,
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
  console.log("BookingModal render", { booking: booking.bookingId, issuesCount: booking.issues?.length, issues: booking.issues });

  const bookingSpare = spareParts?.find((sp) => {
    const serviceIdMatch = booking.serviceId != null && sp.serviceId === booking.serviceId;
    const idMatch = booking.id != null && sp.serviceId === booking.id;
    const nameMatch = sp.serviceName === booking.bookingId || sp.serviceName === booking.bookingId?.toString();
    return serviceIdMatch || idMatch || nameMatch;
  });

  const effectiveServiceId = bookingSpare?.serviceId || booking.serviceId || booking.id || null;

  /* ===== STATUS TRACKER ===== */
  const StatusTracker = ({ currentStatus }: { currentStatus: string }) => {
    const normalized =
      STATUS_NORMALIZER[currentStatus] || currentStatus;

    const activeIndex = STATUS_FLOW.indexOf(normalized);

    return (
      <View className="mt-6 px-3">

        {/* ===== TOP: 1 ─── 2 ─── 3 ===== */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-center">

            {STATUS_FLOW.map((status, index) => {
              const isCompleted = index <= activeIndex;

              return (
                <React.Fragment key={status}>

                  {/* NUMBER CIRCLE */}
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center border-2 ${isCompleted
                        ? "bg-primary border-primary"
                        : "bg-card border-gray700"
                      }`}
                  >
                    <Text
                      className={`text-xs font-bold ${isCompleted ? "text-white" : "text-gray400"
                        }`}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  {/* LINE */}
                  {index !== STATUS_FLOW.length - 1 && (
                    <View
                      style={{
                        height: 2,
                        width: 20,
                        backgroundColor:
                          index < activeIndex
                            ? COLORS.primary
                            : COLORS.gray700,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}

          </View>
        </ScrollView>

        {/* ===== BOTTOM: DETAILS LIST ===== */}
        <View className="mt-5 space-y-2">
          {STATUS_FLOW.map((status, index) => {
            const isCompleted = index <= activeIndex;

            return (
              <Text
                key={status}
                className={`text-sm ${isCompleted ? "text-primary" : "text-gray400"
                  }`}
              >
                {index + 1}. {status.replace(/_/g, " ")}
              </Text>
            );
          })}
        </View>

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


            {/* BASIC DETAILS */}
            <Text className="text-text-secondary mb-1">
              <Text className="text-primary">Name: </Text>
              {booking.name}
            </Text>

            <Text className="text-text-secondary mb-1">
              <Text className="text-primary">Phone: </Text>
              {booking.phone}
            </Text>

            {/* NEW FIELDS (LIKE WEB) */}
            <Text className="text-text-secondary mb-1">
              <Text className="text-primary">Brand: </Text>
              {booking.brand || "N/A"}
            </Text>

            <Text className="text-text-secondary mb-1">
              <Text className="text-primary">Model: </Text>
              {booking.model || "N/A"}
            </Text>

            <Text className="text-text-secondary mb-1">
              <Text className="text-primary">Reg No: </Text>
              {booking.vehicleNumber || booking.registrationNumber || "N/A"}
            </Text>

            {/* ISSUE */}
            {booking.issue && (
              <Text className="text-text-secondary mt-1 mb-1">
                <Text className="text-primary">Issue: </Text>
                {booking.issue}
              </Text>
            )}

            {/* SERVICE DATE */}
            {booking.preferredDate && (
              <Text className="text-text-secondary">
                <Text className="text-primary">Service Date: </Text>
                {new Date(booking.preferredDate).toLocaleDateString()}
              </Text>
            )}

            {/* ASSIGNED MECHANIC */}
            {booking.assignedEmployeeName && (
              <View
                style={{
                  backgroundColor: COLORS.primary + "15",
                  padding: 8,
                  borderRadius: 8,
                  marginTop: 6,
                  borderWidth: 1,
                  borderColor: COLORS.primary + "30",
                }}
              >
                <Text style={{ color: COLORS.primary, fontWeight: "bold" }}>
                  🔧 Assigned Mechanic: {booking.assignedEmployeeName}
                </Text>
              </View>
            )}

            {/* ADDRESS */}
            <Text className="text-text-secondary mt-2">
              <Text className="text-primary">Address: </Text>
              {booking.address || booking.location || "N/A"}
            </Text>

            {/* ===== SPARE PARTS ===== */}
            {bookingSpare?.parts?.length ? (
              <View className="mt-6">
                <Text className="text-primary font-bold mb-2">
                  🔧 Spare Parts
                </Text>

                {bookingSpare?.parts?.map((part) => {
                  const status = part.status || "pending";

                  return (
                    <View
                      key={part.id}
                      className="p-3 rounded-lg mb-2 bg-card"
                    >
                      <Text className="text-text-primary font-semibold">
                        {part.partName}
                      </Text>

                      <Text className="text-text-secondary text-sm">
                        {part.qty} × ₹{part.price} = ₹{part.total}
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

                      {/* ✅ APPROVE / REJECT FIX */}
                      {status === "pending" && bookingSpare?.serviceId && (
                        <View className="flex-row gap-2 mt-2">
                          <TouchableOpacity
                            onPress={() =>
                              onApprove(
                                bookingSpare.serviceId,
                                part.id,
                                "approved",
                                "part"
                              )
                            }
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: COLORS.success,
                              minWidth: 90,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text className="text-center text-xs font-bold text-white">
                              Approve
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() =>
                              onApprove(
                                bookingSpare.serviceId,
                                part.id,
                                "rejected",
                                "part"
                              )
                            }
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: COLORS.error,
                              minWidth: 90,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text className="text-center text-xs font-bold text-white">
                              Reject
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text className="text-text-secondary mt-4 text-sm">
                No spare parts added for this booking.
              </Text>
            )}

            {/* ===== ISSUES ===== */}
            {booking.issues?.length ? (
              <View className="mt-6">
                <Text className="text-primary font-bold mb-2">
                  ⚙️ Issues
                </Text>

                {booking.issues.map((issue) => {
                  const issueId = issue.id || issue._id || issue.issueId || issue.issue_id || "";
                  const status = issue.issueStatus || "pending";
                  const amount = issue.issueAmount != null ? issue.issueAmount : booking.issueAmount;

                  return (
                    <View key={issueId || issue.issue} className="p-3 bg-card rounded-lg mb-2">
                      <Text className="text-text-secondary">
                        {issue.issue}
                      </Text>

                      {amount != null && (
                        <Text className="text-text-secondary text-sm mt-1">
                          Amount: ₹{Number(amount).toFixed(2)}
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

                      {/* ✅ ISSUE APPROVAL FIX */}
                      {status === "pending" && effectiveServiceId && issueId && (
                        <View className="flex-row gap-2 mt-2">
                          <TouchableOpacity
                            onPress={() =>
                              onApprove(
                                effectiveServiceId,
                                issueId,
                                "approved",
                                "issue"
                              )
                            }
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: COLORS.success,
                              minWidth: 72,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text className="text-white text-xs font-bold">
                              Approve
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() =>
                              onApprove(
                                effectiveServiceId,
                                issueId,
                                "rejected",
                                "issue"
                              )
                            }
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: COLORS.error,
                              minWidth: 72,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text className="text-white text-xs font-bold">
                              Reject
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : booking.issue ? (
              <View className="mt-6">
                <Text className="text-primary font-bold mb-2">
                  ⚙️ Issue
                </Text>
                <Text className="text-text-secondary mb-2">{booking.issue}</Text>
                {booking.issueAmount != null && (
                  <Text className="text-text-secondary text-sm">
                    Amount: ₹{Number(booking.issueAmount).toFixed(2)}
                  </Text>
                )}
                <Text className="text-text-secondary text-sm mt-2">
                  Status: <Text className="font-bold" style={{ color: booking.issueStatus === 'approved' ? COLORS.success : booking.issueStatus === 'rejected' ? COLORS.error : COLORS.warning }}>{(booking.issueStatus || 'pending').toUpperCase()}</Text>
                </Text>
              </View>
            ) : (
              <Text className="text-text-secondary mt-4 text-sm">
                No issue details available for this booking.
              </Text>
            )}

            {/* STATUS */}
            <StatusTracker currentStatus={booking.status} />

            {/* CLOSE */}
            <TouchableOpacity
              onPress={onClose}
              className="mt-6 p-3 rounded-lg bg-primary"
            >
              <Text className="text-center text-white font-bold">
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