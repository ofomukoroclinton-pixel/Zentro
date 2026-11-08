import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../src/supabase";
import { useSession } from "../src/session";

type Request = {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export default function FounderVerification() {
  const { user } = useSession();
  const [rows, setRows] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("zentro_verification_requests")
      .select(
        "id,user_id,status,submitted_at,reviewed_at,reviewed_by"
      )
      .in("status", ["pending", "delayed"])
      .order("submitted_at", { ascending: true })
      .limit(100);

    setLoading(false);

    if (error) {
      Alert.alert("Access denied", error.message);
      return;
    }

    setRows((data || []) as Request[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(
    row: Request,
    status: "approved" | "rejected" | "delayed" | "pending"
  ) {
    if (!user) return;

    try {
      if (status === "approved" || status === "rejected") {
        const { data: request, error: requestError } = await supabase
          .from("zentro_verification_requests")
          .select("user_id")
          .eq("id", row.id)
          .single();

        if (requestError) throw requestError;

        const { error: updateError } = await supabase
          .from("zentro_verification_requests")
          .update({
            status,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
          })
          .eq("id", row.id);

        if (updateError) throw updateError;

        if (status === "approved") {
          const { error } = await supabase
            .from("zentro_verified_members")
            .upsert(
              {
                user_id: request.user_id,
                verified_at: new Date().toISOString(),
                reviewed_by: user.id,
              },
              { onConflict: "user_id" }
            );

          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("zentro_verification_requests")
          .update({ status })
          .eq("id", row.id);

        if (error) throw error;
      }

      await load();

      Alert.alert(
        "Updated",
        status === "delayed"
          ? "Application delayed. You can reopen it whenever you are ready."
          : status === "pending"
          ? "Application reopened for review."
          : `Application ${status}.`
      );
    } catch (error: any) {
      Alert.alert(
        "Action failed",
        error.message || "Founder permission is required."
      );
    }
  }

  function confirmAction(
    row: Request,
    status: "approved" | "rejected" | "delayed" | "pending"
  ) {
    const messages: Record<string, string> = {
      approved: "Approve this applicant and award the verified badge?",
      rejected: "Reject this verification application?",
      delayed: "Put this application on hold?",
      pending: "Reopen this delayed application for review?",
    };

    Alert.alert("Confirm action", messages[status], [
      { text: "Cancel", style: "cancel" },
      {
        text: "Continue",
        onPress: () => updateStatus(row, status),
      },
    ]);
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Founder Verification</Text>
      <Text style={styles.subtitle}>
        Review applications and manage delayed requests.
      </Text>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <Text style={styles.empty}>No applications to review.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.id}>Applicant: {item.user_id}</Text>

            <Text style={styles.status}>
              Status: {item.status.toUpperCase()}
            </Text>

            <Text>
              Submitted:{" "}
              {new Date(item.submitted_at).toLocaleString()}
            </Text>

            {item.status === "pending" ? (
              <View style={styles.actions}>
                <Pressable
                  style={styles.approve}
                  onPress={() => confirmAction(item, "approved")}
                >
                  <Text>Approve</Text>
                </Pressable>

                <Pressable
                  style={styles.reject}
                  onPress={() => confirmAction(item, "rejected")}
                >
                  <Text>Reject</Text>
                </Pressable>

                <Pressable
                  style={styles.delay}
                  onPress={() => confirmAction(item, "delayed")}
                >
                  <Text>Delay</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.reopen}
                onPress={() => confirmAction(item, "pending")}
              >
                <Text style={styles.reopenText}>
                  Reopen for Review
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "900", marginBottom: 5 },
  subtitle: { color: "#666", marginBottom: 16 },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    marginBottom: 12,
  },
  id: { fontWeight: "800", marginBottom: 7 },
  status: { fontWeight: "700", marginBottom: 7 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 14 },
  approve: { padding: 11, backgroundColor: "#dff5e3", borderRadius: 9 },
  reject: { padding: 11, backgroundColor: "#ffe4e4", borderRadius: 9 },
  delay: { padding: 11, backgroundColor: "#fff0cf", borderRadius: 9 },
  reopen: {
    padding: 12,
    backgroundColor: "#e5edff",
    borderRadius: 9,
    marginTop: 14,
  },
  reopenText: { fontWeight: "800", textAlign: "center" },
  empty: { textAlign: "center", marginTop: 35, color: "#777" },
});
