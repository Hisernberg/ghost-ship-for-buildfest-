import { useState, useEffect, useCallback } from "react";
import { apiFetch, assetUrl } from "../utils/api";

const defaultOfficerProfile = {
  full_name: "Officer A. Rahman",
  role_title: "Customs Risk Officer",
  badge_id: "ID CR-4172",
  email: "arahman@ghostship.local",
  terminal: "Terminal 4",
  shift_name: "Morning Shift",
  photo_url: null,
};

function mapManagerToProfile(manager) {
  if (!manager) return defaultOfficerProfile;
  return {
    full_name: manager.full_name || defaultOfficerProfile.full_name,
    role_title: manager.role_title || defaultOfficerProfile.role_title,
    badge_id: manager.badge_id || defaultOfficerProfile.badge_id,
    email: manager.email || "",
    terminal: manager.terminal || "",
    shift_name: manager.shift_name || "",
    photo_url: assetUrl(manager.photo_url || null),
  };
}

export function useOfficer(activeManager = null) {
  const [profile, setProfile] = useState(defaultOfficerProfile);
  const [form, setForm] = useState(defaultOfficerProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (activeManager) {
      const mapped = mapManagerToProfile(activeManager);
      setProfile(mapped);
      setForm(mapped);
      setMessage("");
      return;
    }

    async function loadOfficerProfile() {
      try {
        const response = await apiFetch("/api/officer-profile");
        const payload = await response.json();
        if (payload?.ok && payload.profile) {
          const nextProfile = { ...payload.profile, photo_url: assetUrl(payload.profile.photo_url) };
          setProfile(nextProfile);
          setForm(nextProfile);
        }
      } catch {
        // Keep local defaults if profile service is unavailable.
      }
    }

    loadOfficerProfile();
  }, [activeManager]);

  const updateField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  }, []);

  const saveProfile = useCallback(async (photoFile) => {
    setSaving(true);
    setMessage("");

    try {
      if (activeManager) {
        const nextProfile = { ...form };
        if (photoFile) {
          nextProfile.photo_url = URL.createObjectURL(photoFile);
        }
        setProfile(nextProfile);
        setForm(nextProfile);
        setMessage("Manager profile updated for this session.");
        return nextProfile;
      }

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key !== "photo_url") {
          formData.append(key, value ?? "");
        }
      });
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const response = await apiFetch("/api/officer-profile", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Could not save officer profile");
      }

      const nextProfile = { ...payload.profile, photo_url: assetUrl(payload.profile.photo_url) };
      setProfile(nextProfile);
      setForm(nextProfile);
      setMessage("Officer profile updated successfully.");
      return nextProfile;
    } catch (err) {
      setMessage(err.message || "Could not save officer profile");
      return null;
    } finally {
      setSaving(false);
    }
  }, [activeManager, form]);

  return {
    profile,
    form,
    saving,
    message,
    updateField,
    saveProfile,
  };
}
