"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, updateDoc, doc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAdmin } from "@/context/AdminContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card, CardHeader, FilterBar, FilterInput,
  Table, Tr, Td, Badge, Btn, LiveBadge, EmptyState,
  Modal, FormField, FormInput,
} from "@/components/ui";

const SCHOOL_COLORS = ["#0D1B2A","#00B4D8","#10B981","#8B5CF6","#F43F5E","#F5A623"];

function getInitials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).join("");
}
function getAreaCode(place: string) {
  if (!place) return "LOC";
  const c = place.trim().toUpperCase();
  const combined = (c[0] + c.slice(1).replace(/[AEIOU]/g,"")).replace(/[^A-Z]/g,"");
  return combined.slice(0,4).padEnd(3, combined[combined.length-1] || "X");
}
function generateSchoolCode(name: string, village: string) {
  return `${getInitials(name)}-${getAreaCode(village)}`;
}

function QRDisplay({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-36 h-36 bg-white border-2 border-navy rounded-xl flex items-center justify-center p-2 shadow">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=0f2744`}
          alt={`QR for ${value}`}
          className="w-full h-full object-contain"
        />
      </div>
      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{value}</span>
    </div>
  );
}

function WABadge({ config }: { config: any }) {
  if (!config?.phoneNumber)
    return <span className="text-[10px] bg-slate-100 text-slate-400 font-semibold px-2 py-0.5 rounded-full">⬜ Not set</span>;
  if (config?.verified)
    return <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">✅ Active</span>;
  return <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">⚠️ Pending</span>;
}

function LogoUploader({ logoUrl, logoFile, uploadProgress, onFileChange }: {
  logoUrl: string; logoFile: File | null;
  uploadProgress: number | null; onFileChange: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = logoFile ? URL.createObjectURL(logoFile) : logoUrl;
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="w-28 h-28 rounded-full border-4 border-dashed border-slate-300 hover:border-navy bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden transition group relative"
      >
        {preview ? (
          <>
            <img src={preview} alt="logo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-full">
              <span className="text-white text-xs font-bold">Change</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-navy transition">
            <span className="text-3xl">🏫</span>
            <span className="text-[10px] font-bold">Upload Logo</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden" onChange={e => { if (e.target.files?.[0]) onFileChange(e.target.files[0]); }} />
      {uploadProgress !== null && uploadProgress < 100 && (
        <div className="w-full">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Uploading…</span><span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-navy rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}
      {uploadProgress === 100 && (
        <span className="text-[11px] text-emerald-600 font-bold">✅ Logo uploaded</span>
      )}
      <p className="text-[10px] text-slate-400 text-center">PNG, JPG, SVG · Max 2 MB</p>
    </div>
  );
}

const PRESET_COLORS = ["#0D1B2A","#1E40AF","#0F766E","#7C3AED","#BE123C","#B45309","#166534","#1D4ED8"];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-slate-500 mb-2">School Theme Color</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESET_COLORS.map(c => (
          <button key={c} onClick={() => onChange(c)}
            className={`w-8 h-8 rounded-lg border-2 transition cursor-pointer ${value === c ? "border-navy scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
            style={{ background: c }} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-10 h-8 rounded cursor-pointer border border-slate-200" />
        <span className="font-mono text-[12px] text-slate-500">{value}</span>
      </div>
      <div className="mt-3 rounded-xl overflow-hidden border border-slate-200">
        <div className="h-8 flex items-center justify-center" style={{ background: value }}>
          <span className="text-white text-[11px] font-bold">Splash screen preview</span>
        </div>
        <div className="h-6 flex items-center justify-center bg-white">
          <span className="text-[10px] font-bold" style={{ color: value }}>Login page accent</span>
        </div>
      </div>
    </div>
  );
}

type ModalTab = "info" | "branding" | "whatsapp";

export default function SchoolsPage() {
  const { schools, teachers, students } = useAdmin();
  const router = useRouter();

  const [search,          setSearch]          = useState("");
  const [showModal,       setShowModal]        = useState(false);
  const [showQR,          setShowQR]           = useState<{ code: string; name: string; logoUrl: string; color: string } | null>(null);
  const [saving,          setSaving]           = useState(false);
  const [preview,         setPreview]          = useState("");
  const [activeTab,       setActiveTab]        = useState<ModalTab>("info");
  const [logoFile,        setLogoFile]         = useState<File | null>(null);
  const [uploadProgress,  setUploadProgress]   = useState<number | null>(null);
  const [uploadedLogoUrl, setUploadedLogoUrl]  = useState("");
  const [testing,         setTesting]          = useState(false);
  const [testResult,      setTestResult]       = useState<"success"|"fail"|null>(null);

  const emptyForm = {
    school_name:"", village:"", district:"", state:"",
    adminName:"", adminEmail:"", adminPhone:"",
    primaryColor:"#0D1B2A", tagline:"",
    waPhone:"", waPhoneNumberId:"", waAccessToken:"", waBusinessId:"",
    waTriggerAttendance:true, waTriggerFees:true, waTriggerExams:true,
    waTriggerAnnouncements:true, waTriggerEmergency:true,
  };
  const [form, setForm] = useState(emptyForm);

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    if (form.school_name && form.village) setPreview(generateSchoolCode(form.school_name, form.village));
    else setPreview("");
  }, [form.school_name, form.village]);

  const filtered = schools.filter(s =>
    !search || (s.name || s.schoolName || s.id || "").toLowerCase().includes(search.toLowerCase())
  );

  const resetModal = () => {
    setShowModal(false); setActiveTab("info"); setForm(emptyForm);
    setLogoFile(null); setUploadProgress(null); setUploadedLogoUrl(""); setTestResult(null);
  };

  const uploadLogo = (schoolCode: string): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!logoFile) { resolve(""); return; }
      const ext = logoFile.name.split(".").pop();
      const task = uploadBytesResumable(ref(storage, `school_logos/${schoolCode}.${ext}`), logoFile);
      task.on("state_changed",
        snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        () => getDownloadURL(task.snapshot.ref).then(resolve).catch(reject),
      );
    });

  const validateForm = () => {
    if (!form.school_name || !form.village) {
      alert("Please fill in School Name and Village / Location before continuing.");
      setActiveTab("info");
      return false;
    }
    if (!form.adminName || !form.adminEmail) {
      alert("Please fill in Admin Name and Admin Email.");
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

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://1b59c4a1-d915-4b50-bf44-dacb602b7bf8-00-32892q8c36byf.janeway.replit.dev";

      const superAdminKey =
        process.env.NEXT_PUBLIC_SUPER_ADMIN_KEY || "VIDLYM_SUPER_2026_XK9M";

      const endpoint = `${apiUrl}/api/super/schools/create`;
      console.log("[Onboard] Calling:", endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-super-admin-key": superAdminKey,
        },
        body: JSON.stringify({
          schoolName:        form.school_name,
          location:          form.village,
          district:          form.district,
          state:             form.state,
          principalName:     form.adminName,
          principalEmail:    form.adminEmail,
          principalPhone:    form.adminPhone,
          principalPassword: "School@123",
          primaryColor:      form.primaryColor,
          tagline:           form.tagline,
          logoUrl,
          ...(whatsappConfig ? { whatsappConfig } : {}),
        }),
      });

      let data: any = null;
      try { data = await res.json(); } catch { /**/ }

      if (!res.ok) {
        console.error("[Onboard] API error:", data);
        alert(data?.error || "School onboarding failed.");
        return;
      }

      console.log("[Onboard] Success:", data);
      const school_code = data?.schoolCode || data?.school_code || tempCode;

      setShowModal(false);
      setShowQR({ code: school_code, name: form.school_name, logoUrl, color: form.primaryColor });
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

  const testWhatsApp = async () => {
    if (!form.waPhoneNumberId || !form.waAccessToken || !form.waPhone) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/whatsapp/test", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phoneNumberId: form.waPhoneNumberId, accessToken: form.waAccessToken, toPhone: form.waPhone }),
      });
      setTestResult(res.ok ? "success" : "fail");
    } catch { setTestResult("fail"); }
    finally  { setTesting(false); }
  };

  const toggleStatus = async (id: string, current?: string) =>
    updateDoc(doc(db,"schools",id), { status: current === "suspended" ? "active" : "suspended" });

  const TABS: { key: ModalTab; label: string; icon: string }[] = [
    { key:"info",     label:"School Info", icon:"🏫" },
    { key:"branding", label:"Branding",    icon:"🎨" },
    { key:"whatsapp", label:"WhatsApp",    icon:"💬" },
  ];

  const TRIGGER_LABELS = [
    { key:"waTriggerAttendance",    label:"Attendance alerts" },
    { key:"waTriggerFees",          label:"Fee reminders" },
    { key:"waTriggerExams",         label:"Exam results" },
    { key:"waTriggerAnnouncements", label:"Announcements" },
    { key:"waTriggerEmergency",     label:"Emergency notices" },
  ] as const;

  return (
    <DashboardLayout title="Schools Management">

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { icon:"🏫", label:"Total Schools",  val: schools.length,                                                    cls:"text-navy" },
          { icon:"✅", label:"Active",          val: schools.filter(s => s.status !== "suspended").length,             cls:"text-emerald-500" },
          { icon:"⊘",  label:"Suspended",       val: schools.filter(s => s.status === "suspended").length,             cls:"text-rose-400" },
          { icon:"💬", label:"WhatsApp Active", val: schools.filter(s => (s as any).whatsappConfig?.verified).length, cls:"text-green-500" },
        ].map(({ icon, label, val, cls }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
            <div className={`text-3xl font-black ${cls}`}>{val}</div>
            <div className="text-sm text-slate-500 font-medium mt-1">{icon} {label}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="🏫 All Schools" count={filtered.length}>
          <LiveBadge collection="schools" />
          <Btn variant="gold" onClick={() => setShowModal(true)}>＋ Onboard School</Btn>
        </CardHeader>
        <FilterBar>
          <FilterInput placeholder="🔍  Search schools…" value={search} onChange={setSearch} />
        </FilterBar>
        <Table headers={["School","Code","Location","Admin","Teachers","Students","WhatsApp","Status","Actions"]}>
          {filtered.length > 0 ? filtered.map((s, i) => {
            const tCount  = teachers.filter(t  => t.schoolId  === s.id || t.school_id  === s.id).length;
            const sCount  = students.filter(st => st.schoolId === s.id || st.school_id === s.id).length;
            const code    = (s as any).school_code || s.id;
            const logoUrl = (s as any).logoUrl     || "";
            const color   = (s as any).primaryColor || SCHOOL_COLORS[i % 6];
            return (
              <Tr key={s.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200"
                      style={{ background: logoUrl ? "#fff" : color }}>
                      {logoUrl
                        ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                        : <span className="text-[11px] font-black text-white">{(s.name||s.schoolName||"S").slice(0,2).toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <div className="font-bold text-navy text-[13px]">{s.name||s.schoolName||s.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{(s as any).school_id||"—"}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[12px] bg-navy/5 text-navy px-2 py-1 rounded">{code}</span>
                    <button onClick={() => setShowQR({ code, name: s.name||s.schoolName||s.id, logoUrl, color })}
                      className="text-slate-400 hover:text-navy" title="Show QR">📱</button>
                  </div>
                </Td>
                <Td>
                  <div className="text-[12px]">
                    <div className="font-semibold text-slate-700">{(s as any).village||s.city||"—"}</div>
                    <div className="text-slate-400 text-[10px]">{(s as any).district||""}{(s as any).state ? ` · ${(s as any).state}` : ""}</div>
                  </div>
                </Td>
                <Td>
                  <div className="text-[12px]">
                    <div className="font-semibold text-slate-700">{s.adminName||"—"}</div>
                    <div className="text-slate-400 text-[10px]">{s.adminEmail||""}</div>
                  </div>
                </Td>
                <Td><strong>{tCount}</strong></Td>
                <Td><strong>{sCount}</strong></Td>
                <Td><WABadge config={(s as any).whatsappConfig} /></Td>
                <Td><Badge status={s.status||"active"} /></Td>
                <Td>
                  <div className="flex gap-2">
                    <Btn variant="teal"   onClick={() => router.push(`/schools/${s.id}`)}>👁 View</Btn>
                    <Btn variant="danger" onClick={() => toggleStatus(s.id, s.status)}>
                      {s.status === "suspended" ? "✓ Enable" : "⊘ Suspend"}
                    </Btn>
                  </div>
                </Td>
              </Tr>
            );
          }) : <EmptyState icon="🏫" message="No schools yet — onboard your first school!" />}
        </Table>
      </Card>

      {/* ══ QR MODAL ══ */}
      {showQR && (
        <Modal title={`📱 QR Code — ${showQR.name}`} onClose={() => setShowQR(null)}>
          <div className="flex flex-col items-center gap-6 py-4">
            <QRDisplay value={showQR.code} />
            <p className="text-[12px] text-slate-500 text-center max-w-xs">
              Share this QR code with teachers and parents to join <strong>{showQR.name}</strong>.
              Scanning it will pre-fill the school code in the app.
            </p>
            <Btn variant="gold" onClick={() => setShowQR(null)}>Done</Btn>
          </div>
        </Modal>
      )}

      {/* ══ ONBOARD MODAL ══ */}
      {showModal && (
        <Modal title="🏫 Onboard New School" onClose={resetModal}>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition
                  ${activeTab === t.key ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3">

            {/* ── TAB 1: School Info ── */}
          
