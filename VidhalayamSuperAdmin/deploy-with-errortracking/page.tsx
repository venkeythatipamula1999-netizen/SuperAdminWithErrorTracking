const validateForm = () => {
  if (!form.school_name || !form.village) {
    alert("Please fill in School Name and Village / Location before continuing.");
    setActiveTab("info");
    return false;
  }

  if (!form.adminName || !form.adminEmail) {
    alert("Please fill in Admin Name and Admin Email in the School Info tab.");
    setActiveTab("info");
    return false;
  }

  if (logoFile && logoFile.size > 2 * 1024 * 1024) {
    alert("Logo file must be under 2 MB.");
    setActiveTab("branding");
    return false;
  }

  return true;
};

const createSchool = async () => {
  if (!validateForm()) return;

  setSaving(true);

  try {
    let logoUrl = "";
    const tempCode = generateSchoolCode(form.school_name, form.village);

    /* ---------------- LOGO UPLOAD ---------------- */

    if (logoFile) {
      setActiveTab("branding");

      try {
        logoUrl = await uploadLogo(tempCode);
        setUploadedLogoUrl(logoUrl);
      } catch (err) {
        console.error("[Onboard] Logo upload failed:", err);
        alert("Logo upload failed. Please try again.");
        return;
      }
    }

    /* ---------------- WHATSAPP CONFIG ---------------- */

    const whatsappConfig =
      form.waPhoneNumberId && form.waAccessToken && form.waPhone
        ? {
            phoneNumber: form.waPhone,
            phoneNumberId: form.waPhoneNumberId,
            accessToken: form.waAccessToken,
            businessAccountId: form.waBusinessId,
            verified: testResult === "success",
            enabledTriggers: {
              attendance: form.waTriggerAttendance,
              fees: form.waTriggerFees,
              exams: form.waTriggerExams,
              announcements: form.waTriggerAnnouncements,
              emergency: form.waTriggerEmergency,
            },
          }
        : null;

    /* ---------------- API CONFIG ---------------- */

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ??
      "https://1b59c4a1-d915-4b50-bf44-dacb602b7bf8-00-32892q8c36byf.janeway.replit.dev";

    const superAdminKey =
      process.env.NEXT_PUBLIC_SUPER_ADMIN_KEY ?? "VIDLYM_SUPER_2026_XK9M";

    const endpoint = `${apiUrl}/api/super/schools/create`;

    console.log("[Onboard] API Endpoint:", endpoint);

    /* ---------------- API CALL ---------------- */

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-super-admin-key": superAdminKey,
      },
      body: JSON.stringify({
        schoolName: form.school_name,
        location: form.village,
        district: form.district,
        state: form.state,

        principalName: form.adminName,
        principalEmail: form.adminEmail,
        principalPhone: form.adminPhone,

        principalPassword: "School@123",

        primaryColor: form.primaryColor,
        tagline: form.tagline,
        logoUrl,

        ...(whatsappConfig ? { whatsappConfig } : {}),
      }),
    });

    let data: any = null;

    try {
      data = await res.json();
    } catch {
      console.error("[Onboard] Failed to parse API response");
    }

    if (!res.ok) {
      console.error("[Onboard] API error:", data);
      alert(data?.error || "School onboarding failed.");
      return;
    }

    console.log("[Onboard] Success:", data);

    /* ---------------- SUCCESS UI ---------------- */

    const school_code = data?.schoolCode || data?.school_code || tempCode;

    setShowModal(false);

    setShowQR({
      code: school_code,
      name: form.school_name,
      logoUrl,
      color: form.primaryColor,
    });

    setForm(emptyForm);
    setLogoFile(null);
    setUploadProgress(null);
    setUploadedLogoUrl("");
    setActiveTab("info");

  } catch (err) {
    console.error("[Onboard] Unexpected error:", err);
    alert("Network error while creating school. Please try again.");
  } finally {
    setSaving(false);
  }
};
