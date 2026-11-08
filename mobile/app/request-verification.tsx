import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../src/supabase";
import { useSession } from "../src/session";

const ID_TYPES = [
  "National Identification Number (NIN) Slip",
  "National Identity Card",
  "International Passport",
  "Driver's License",
  "Permanent Voter's Card (PVC)",
  "Government-issued Residence Permit",
  "Government-issued Work Permit",
  "Refugee or Asylum Identification",
  "Foreign Government-issued ID",
  "Other Recognized Government ID",
];

const CATEGORIES = [
  "Celebrity",
  "Public Figure",
  "Musician / Recording Artist",
  "Actor / Actress",
  "Content Creator / Influencer",
  "Business Owner / Entrepreneur",
  "Politician",
  "Professional",
  "Athlete / Sportsperson",
  "Journalist / Media Personality",
  "Author / Writer",
  "Community Leader",
  "Organization Representative",
  "Other",
];

const EVIDENCE: Record<string, string[]> = {
  Celebrity: [
    "Independent media coverage",
    "Official website or public profile",
  ],
  "Public Figure": [
    "Credible public recognition",
    "Independent media coverage",
  ],
  "Musician / Recording Artist": [
    "Official music releases",
    "Artist or label profile",
    "Independent recognition",
  ],
  "Actor / Actress": [
    "Film or television credits",
    "Production or agency confirmation",
  ],
  "Content Creator / Influencer": [
    "Public creator account links",
    "Proof of account ownership",
  ],
  "Business Owner / Entrepreneur": [
    "Business registration",
    "Proof of ownership or management",
  ],
  Politician: [
    "Official government or electoral records",
    "Credible public records",
  ],
  Professional: [
    "Professional license where applicable",
    "Official professional listing",
  ],
  "Athlete / Sportsperson": [
    "Official team or federation record",
    "Competition records",
  ],
  "Journalist / Media Personality": [
    "Media organization profile",
    "Published work",
  ],
  "Author / Writer": [
    "Published work",
    "Publisher or official author profile",
  ],
  "Community Leader": [
    "Organization confirmation",
    "Independent community recognition",
  ],
  "Organization Representative": [
    "Organization registration",
    "Proof of authority to represent it",
  ],
  Other: ["Evidence supporting your public identity"],
};

export default function RequestVerification() {
  const { user } = useSession();

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [idType, setIdType] = useState("");
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [checkingFollowers, setCheckingFollowers] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDraft();
      loadFollowerCount();
    }
  }, [user?.id]);

  async function loadDraft() {
    if (!user) return;

    const { data, error } = await supabase
      .from("zentro_verification_drafts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      Alert.alert("Draft loading failed", error.message);
      return;
    }

    if (!data) return;

    const app = data.application_data || {};

    setDraftId(data.id);
    setStep(data.current_step || 1);
    setIdType(app.idType || "");
    setDocuments(app.documents || {});
    setCategories(app.categories || []);
    setEvidence(app.evidence || {});
  }

  async function loadFollowerCount() {
    if (!user) return;

    setCheckingFollowers(true);

    const { data, error } = await supabase.rpc(
      "get_my_follower_count"
    );

    if (error) {
      setFollowerCount(null);
      Alert.alert(
        "Follower check failed",
        "We couldn't check your followers. Please try again."
      );
    } else {
      setFollowerCount(Number(data ?? 0));
    }

    setCheckingFollowers(false);
  }

  function applicationData() {
    return {
      idType,
      documents,
      categories,
      evidence,
    };
  }

  async function saveDraft() {
    if (!user) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("zentro_verification_drafts")
      .upsert(
        {
          user_id: user.id,
          current_step: step,
          application_data: applicationData(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      Alert.alert("Save failed", error.message);
      return;
    }

    setDraftId(data.id);

    Alert.alert(
      "Saved successfully",
      "Your application has been saved. You can return and continue later."
    );
  }

  async function uploadEvidence(key: string) {
    if (!user) return;

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const extension =
        asset.fileName?.split(".").pop()?.toLowerCase() || "jpg";

      const path =
        `${user.id}/${Date.now()}-${key.replace(/[^a-z0-9]/gi, "_")}.${extension}`;

      const { error } = await supabase.storage
        .from("zentro-verification-private")
        .upload(path, blob, {
          contentType: asset.mimeType || "image/jpeg",
          upsert: false,
        });

      if (error) throw error;

      setDocuments(previous => ({
        ...previous,
        [key]: path,
      }));

      Alert.alert(
        "Uploaded",
        "Your evidence has been uploaded privately."
      );
    } catch (error: any) {
      Alert.alert(
        "Upload failed",
        error.message || "Please try again."
      );
    }
  }

  function toggleCategory(category: string) {
    setCategories(previous =>
      previous.includes(category)
        ? previous.filter(item => item !== category)
        : [...previous, category]
    );
  }

  function toggleEvidence(category: string, item: string) {
    setEvidence(previous => {
      const selected = previous[category] || [];

      return {
        ...previous,
        [category]: selected.includes(item)
          ? selected.filter(value => value !== item)
          : [...selected, item],
      };
    });
  }

  function continueStep() {
    if (step === 1) {
      if (!idType || !documents.government_id) {
        Alert.alert(
          "Incomplete",
          "Please select and upload your government ID."
        );
        return;
      }
    }

    if (step === 2 && categories.length === 0) {
      Alert.alert(
        "Choose a category",
        "Please select at least one category."
      );
      return;
    }

    setStep(previous => Math.min(previous + 1, 3));
  }

  async function cancelDraft() {
    if (!user) return;

    Alert.alert(
      "Start again?",
      "Your saved application progress will be deleted.",
      [
        {
          text: "Keep application",
          style: "cancel",
        },
        {
          text: "Start again",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("zentro_verification_drafts")
              .delete()
              .eq("user_id", user.id);

            if (error) {
              Alert.alert("Error", error.message);
              return;
            }

            setDraftId(null);
            setStep(1);
            setSearch("");
            setIdType("");
            setDocuments({});
            setCategories([]);
            setEvidence({});
          },
        },
      ]
    );
  }

  async function submitApplication() {
    if (!user) return;

    if (checkingFollowers) {
      Alert.alert(
        "Please wait",
        "Your follower count is being checked."
      );
      return;
    }

    const { data, error } = await supabase.rpc(
      "get_my_follower_count"
    );

    if (error) {
      Alert.alert(
        "Check failed",
        "We couldn't verify your follower count."
      );
      return;
    }

    const actualFollowers = Number(data ?? 0);

    setFollowerCount(actualFollowers);

    if (actualFollowers < 1000) {
      Alert.alert(
        "Not eligible yet",
        `You currently have ${actualFollowers.toLocaleString()} followers. You need ${(1000 - actualFollowers).toLocaleString()} more followers before applying.`
      );
      return;
    }

    if (
      !idType ||
      !documents.government_id ||
      categories.length === 0
    ) {
      Alert.alert(
        "Incomplete",
        "Please complete your ID and category information."
      );
      return;
    }

    for (const category of categories) {
      if (!(evidence[category] || []).length) {
        Alert.alert(
          "Incomplete",
          `Select supporting evidence for ${category}.`
        );
        return;
      }

      for (const item of evidence[category]) {
        if (!documents[`${category}:${item}`]) {
          Alert.alert(
            "Missing evidence",
            `Please upload: ${item} for ${category}.`
          );
          return;
        }
      }
    }

    Alert.alert(
      "Eligibility confirmed",
      "Your follower count and application information have passed the initial checks. Secure application submission is not yet enabled."
    );
  }

  if (!user) {
    return (
      <View style={styles.page}>
        <Text>Please sign in first.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Zentro Verification</Text>

      <Text style={styles.subtitle}>
        Application step {step} of 3
      </Text>

      <View style={styles.followerBox}>
        <Text style={styles.followerTitle}>
          Verification eligibility
        </Text>

        {checkingFollowers ? (
          <ActivityIndicator style={{ marginTop: 10 }} />
        ) : followerCount === null ? (
          <Text style={styles.errorText}>
            Unable to check your followers.
          </Text>
        ) : (
          <>
            <Text style={styles.followerText}>
              Your followers: {followerCount.toLocaleString()}
            </Text>

            <Text style={styles.followerText}>
              Required followers: 1,000
            </Text>

            <Text
              style={[
                styles.followerStatus,
                {
                  color:
                    followerCount >= 1000
                      ? "#16803c"
                      : "#c62828",
                },
              ]}
            >
              {followerCount >= 1000
                ? "✓ You meet the follower requirement."
                : `${(1000 - followerCount).toLocaleString()} more followers needed.`}
            </Text>
          </>
        )}

        <Pressable
          style={styles.refreshButton}
          onPress={loadFollowerCount}
        >
          <Text style={styles.refreshText}>
            Refresh follower count
          </Text>
        </Pressable>
      </View>

      {step === 1 && (
        <>
          <Text style={styles.heading}>
            Choose your government ID
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Search government ID..."
            value={search}
            onChangeText={setSearch}
          />

          {ID_TYPES.filter(item =>
            item.toLowerCase().includes(search.toLowerCase())
          ).map(item => (
            <Pressable
              key={item}
              style={[
                styles.option,
                idType === item && styles.selected,
              ]}
              onPress={() => setIdType(item)}
            >
              <Text>
                {idType === item ? "✓ " : ""}
                {item}
              </Text>
            </Pressable>
          ))}

          {!!idType && (
            <>
              <Text style={styles.heading}>
                Upload your {idType}
              </Text>

              <Pressable
                style={styles.upload}
                onPress={() => uploadEvidence("government_id")}
              >
                <Text style={styles.uploadText}>
                  {documents.government_id
                    ? "✓ ID uploaded"
                    : "Upload government ID"}
                </Text>
              </Pressable>
            </>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.heading}>
            Which categories describe you?
          </Text>

          <Text style={styles.subtitle}>
            Select every category that applies.
          </Text>

          {CATEGORIES.map(category => (
            <Pressable
              key={category}
              style={[
                styles.option,
                categories.includes(category) && styles.selected,
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text>
                {categories.includes(category) ? "✓ " : "○ "}
                {category}
              </Text>
            </Pressable>
          ))}

          <Pressable
            style={[
              styles.option,
              categories.length === 0 && styles.selected,
            ]}
            onPress={() => setCategories([])}
          >
            <Text>
              {categories.length === 0 ? "✓ " : "○ "}
              None of these
            </Text>
          </Pressable>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.heading}>
            Supporting evidence
          </Text>

          {categories.map(category => (
            <View key={category}>
              <Text style={styles.category}>
                {category}
              </Text>

              {(EVIDENCE[category] || EVIDENCE.Other).map(item => {
                const selected = (
                  evidence[category] || []
                ).includes(item);

                const key = `${category}:${item}`;

                return (
                  <View key={item} style={styles.evidence}>
                    <Pressable
                      style={styles.option}
                      onPress={() =>
                        toggleEvidence(category, item)
                      }
                    >
                      <Text>
                        {selected ? "✓ " : "○ "}
                        {item}
                      </Text>
                    </Pressable>

                    {selected && (
                      <Pressable
                        style={styles.upload}
                        onPress={() => uploadEvidence(key)}
                      >
                        <Text style={styles.uploadText}>
                          {documents[key]
                            ? "✓ Uploaded"
                            : "Upload evidence"}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </>
      )}

      <View style={styles.navigation}>
        {step > 1 && (
          <Pressable
            style={styles.secondary}
            onPress={() => setStep(step - 1)}
          >
            <Text>← Back</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.secondary}
          onPress={saveDraft}
          disabled={saving}
        >
          <Text>
            {saving ? "Saving..." : "Save for Later"}
          </Text>
        </Pressable>

        {step < 3 ? (
          <Pressable
            style={styles.primary}
            onPress={continueStep}
          >
            <Text style={styles.white}>
              Continue →
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.primary}
            onPress={submitApplication}
          >
            <Text style={styles.white}>
              Check Application
            </Text>
          </Pressable>
        )}
      </View>

      <Pressable
        style={styles.cancel}
        onPress={cancelDraft}
      >
        <Text style={{ color: "#c62828" }}>
          Cancel and Start Again
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 27,
    fontWeight: "900",
    marginBottom: 5,
  },
  subtitle: {
    color: "#777",
    marginBottom: 20,
  },
  heading: {
    fontSize: 19,
    fontWeight: "800",
    marginVertical: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
  },
  option: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#e2e2e2",
    borderRadius: 11,
    marginBottom: 9,
  },
  selected: {
    borderColor: "#2878e5",
    backgroundColor: "#edf5ff",
  },
  upload: {
    padding: 14,
    backgroundColor: "#e9f2ff",
    borderRadius: 10,
    marginVertical: 8,
  },
  uploadText: {
    fontWeight: "800",
    color: "#1764bd",
  },
  category: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 18,
  },
  evidence: {
    marginBottom: 8,
  },
  navigation: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 25,
  },
  primary: {
    backgroundColor: "#1769d2",
    padding: 13,
    borderRadius: 10,
  },
  secondary: {
    backgroundColor: "#eee",
    padding: 13,
    borderRadius: 10,
  },
  white: {
    color: "#fff",
    fontWeight: "800",
  },
  cancel: {
    alignItems: "center",
    padding: 18,
  },
  followerBox: {
    backgroundColor: "#edf5ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
  },
  followerTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  followerText: {
    marginTop: 9,
    fontSize: 15,
  },
  followerStatus: {
    marginTop: 10,
    fontWeight: "900",
  },
  errorText: {
    color: "#c62828",
    marginTop: 10,
  },
  refreshButton: {
    marginTop: 14,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  refreshText: {
    color: "#1764bd",
    fontWeight: "800",
  },
});
