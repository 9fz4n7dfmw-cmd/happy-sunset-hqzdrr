import React, { useState, useEffect } from "react";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // بيانات التليجرام المدمجة
  const BOT_TOKEN = "8910192329:AAGefMwiyLv7OHdo0LY9o9vvcndJnG_dYE4";
  const CHAT_ID = "5131572958";

  // بيانات فورم الطلاب
  const [studentName, setStudentName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [age, setAge] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("page") === "admin") {
      setIsAdmin(true);
      if (sessionStorage.getItem("admin_authed") === "true") {
        setIsAuthenticated(true);
      }
    }

    if (!window.firebaseConfigured) {
      const script1 = document.createElement("script");
      script1.src =
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js";
      const script2 = document.createElement("script");
      script2.src =
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js";

      script1.onload = () => {
        document.body.appendChild(script2);
        script2.onload = () => {
          const firebaseConfig = {
            apiKey: "AIzaSyC_tEJWFxvlqTU37tDD1COXNjPe_YrGRJM",
            authDomain: "rattel-839ff.firebaseapp.com",
            projectId: "rattel-839ff",
            storageBucket: "rattel-839ff.appspot.com",
            messagingSenderId: "687730534452",
            appId: "1:687730534452:web:918a704a4987a1a6468261",
          };
          if (!window.firebase?.apps?.length) {
            window.firebase.initializeApp(firebaseConfig);
            window.db = window.firebase.firestore();
            window.firebaseConfigured = true;

            if (
              params.get("page") === "admin" &&
              sessionStorage.getItem("admin_authed") === "true"
            ) {
              fetchRequests();
            }
          }
        };
      };
      document.body.appendChild(script1);
    } else if (
      params.get("page") === "admin" &&
      sessionStorage.getItem("admin_authed") === "true"
    ) {
      fetchRequests();
    }
  }, []);

  const fetchRequests = () => {
    if (window.db) {
      window.db
        .collection("studentsRequests")
        .orderBy("date", "desc")
        .onSnapshot((snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRequests(docs);
        });
    } else {
      setTimeout(fetchRequests, 1000);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "shehab67") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authed", "true");
      fetchRequests();
    } else {
      alert("كلمة المرور غير صحيحة!");
    }
  };

  const handleDeleteRequest = async (id) => {
    if (window.confirm("هل أنت متأكد من أرشفة وحذف هذا الطلب؟")) {
      try {
        await window.db.collection("studentsRequests").doc(id).delete();
      } catch (error) {
        alert("حدث خطأ أثناء الحذف.");
      }
    }
  };

  const packages = [
    { title: "باقة شهرية (٤ حصص)", price: "399 جنيه", popular: false },
    { title: "باقة شهرية (٨ حصص)", price: "799 جنيه", popular: false },
    { title: "باقة ٣ شهور (٢٨ حصة)", price: "2799 جنيه", popular: false },
    { title: "باقة ٦ شهور (٤٨ حصة)", price: "4799 جنيه", popular: true },
    { title: "باقة سنوية (٩٦ حصة)", price: "9599 جنيه", popular: false },
  ];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 600;
          const scaleSize = MAX_WIDTH / img.width;
          if (img.width > MAX_WIDTH) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
          setScreenshotBase64(compressedBase64);
          setFormError("");
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!studentName.trim()) {
      return setFormError("برجاء كتابة الاسم الكامل للطالب.");
    }
    if (!whatsapp.trim() || whatsapp.trim().length < 11) {
      return setFormError("برجاء كتابة رقم واتساب صحيح لا يقل عن 11 رقماً.");
    }
    if (!age || parseInt(age) <= 0 || parseInt(age) > 100) {
      return setFormError("برجاء كتابة عمر صحيح للطالب.");
    }
    if (!screenshotBase64) {
      return setFormError("برجاء رفع صورة إيصال التحويل لتأكيد الاشتراك.");
    }

    setLoading(true);
    try {
      if (window.db) {
        // 1. حفظ البيانات في فايربيز
        await window.db.collection("studentsRequests").add({
          name: studentName,
          whatsappNumber: whatsapp,
          studentAge: age,
          packageName: selectedPkg ? selectedPkg.title : "غير محدد",
          packagePrice: selectedPkg ? selectedPkg.price : "غير محدد",
          receiptImage: screenshotBase64,
          date: new Date().toLocaleString("ar-EG"),
        });

        // 2. إرسال تنبيه لتليجرام
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: `🔔 طالب جديد!\n👤 الاسم: ${studentName}\n📞 الواتساب: ${whatsapp}\n🎂 العمر: ${age}\n📦 الباقة: ${selectedPkg?.title}`,
          }),
        });

        setFormSubmitted(true);
      }
    } catch (error) {
      setFormError("حدث خطأ أثناء إرسال البيانات، يرجى المحاولة مرة أخرى.");
    }
    setLoading(false);
  };

  if (isAdmin) {
    if (!isAuthenticated) {
      return (
        <div
          style={{
            backgroundColor: "#f3f4f6",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            direction: "rtl",
            fontFamily: "sans-serif",
          }}
        >
          <form
            onSubmit={handleAdminLogin}
            style={{
              backgroundColor: "#fff",
              padding: "30px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              width: "100%",
              maxWidth: "380px",
              textAlign: "center",
            }}
          >
            <h2 style={{ color: "#064e3b", marginBottom: "20px" }}>
              🔒 تسجيل دخول لوحة التحكم
            </h2>
            <input
              type="password"
              placeholder="أدخل كلمة المرور"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                marginBottom: "15px",
                textAlign: "center",
                fontSize: "16px",
              }}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                backgroundColor: "#064e3b",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              دخول
            </button>
          </form>
        </div>
      );
    }

    return (
      <div
        style={{
          backgroundColor: "#f3f4f6",
          color: "#333",
          minHeight: "100vh",
          direction: "rtl",
          padding: "30px",
          fontFamily: "sans-serif",
          textAlign: "right",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "3px solid #d4af37",
            paddingBottom: "10px",
            marginBottom: "20px",
          }}
        >
          <h1 style={{ color: "#064e3b", margin: 0 }}>📊 لوحة تحكم منصة رتل</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem("admin_authed");
              setIsAuthenticated(false);
            }}
            style={{
              backgroundColor: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "8px 15px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            تسجيل خروج
          </button>
        </div>
        <p style={{ fontSize: "18px" }}>
          إجمالي الطلبات الجديدة المتبقية:{" "}
          <b style={{ color: "#064e3b", fontSize: "22px" }}>
            {requests.length}
          </b>
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
            marginTop: "25px",
          }}
        >
          {requests.map((req) => {
            const cleanPhone = String(req.whatsappNumber).replace(
              /[^0-9]/g,
              ""
            );
            const msg = encodeURIComponent(
              `السلام عليكم يا أ/ ${req.name}، معك منصة رتل لتعليم القرآن الكريم. لقد استلمنا إيصال الدفع لـ (${req.packageName})، ونحن جاهزون الآن لتنسيق مواعيد الحصص المناسبة لكم بإذن الله.`
            );
            const waLink = `https://wa.me/${cleanPhone}?text=${msg}`;

            return (
              <div
                key={req.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                  borderRight: "5px solid #064e3b",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      margin: "0 0 10px 0",
                    }}
                  >
                    📅 {req.date}
                  </p>
                  <h3 style={{ margin: "5px 0", color: "#064e3b" }}>
                    👤 الطالب: {req.name}
                  </h3>
                  <p style={{ margin: "5px 0" }}>
                    🎂 السن: {req.studentAge} سنة
                  </p>
                  <p style={{ margin: "5px 0" }}>
                    📦 الباقة: <b>{req.packageName}</b> ({req.packagePrice})
                  </p>
                  <p style={{ margin: "15px 0 5px 0" }}>📞 مراسلة فورية:</p>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      textAlign: "center",
                      backgroundColor: "#25d366",
                      color: "#fff",
                      padding: "10px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      textDecoration: "none",
                      marginBottom: "15px",
                    }}
                  >
                    💬 مراسلة وتنسيق المواعيد
                  </a>

                  <div style={{ marginTop: "15px" }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        marginBottom: "5px",
                      }}
                    >
                      🧾 صورة إيصال التحويل:
                    </p>
                    {req.receiptImage ? (
                      <img
                        src={req.receiptImage}
                        alt="إيصال"
                        style={{
                          width: "100%",
                          maxHeight: "300px",
                          objectFit: "contain",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                          backgroundColor: "#eee",
                        }}
                      />
                    ) : (
                      <p style={{ color: "red" }}>لا يوجد صورة</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRequest(req.id)}
                  style={{
                    width: "100%",
                    backgroundColor: "#059669",
                    color: "#fff",
                    border: "none",
                    padding: "10px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginTop: "20px",
                  }}
                >
                  ✅ تم التواصل والأرشفة
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#064e3b",
        color: "#fff",
        minHeight: "100vh",
        direction: "rtl",
        padding: "20px",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ marginTop: "40px" }}>
        <div
          style={{
            border: "2px solid #d4af37",
            borderRadius: "50%",
            width: "100px",
            height: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            color: "#d4af37",
            backgroundColor: "rgba(0,0,0,0.2)",
            margin: "0 auto",
            fontWeight: "bold",
          }}
        >
          رتل
        </div>
        <h1 style={{ color: "#d4af37", fontSize: "32px", marginTop: "20px" }}>
          منصة رتل العالمية لتعليم القرآن الكريم
        </h1>
        <p
          style={{
            fontSize: "18px",
            opacity: "0.9",
            maxWidth: "600px",
            margin: "10px auto",
          }}
        >
          نأخذ بيدك وبيد أطفالك من الحروف الأولى وحتى الختام والاتقان، بأحدث
          الطرق التعليمية التفاعلية.
        </p>
      </div>

      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(214, 175, 55, 0.3)",
          borderRadius: "20px",
          padding: "30px",
          maxWidth: "850px",
          margin: "40px auto",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ color: "#d4af37", marginTop: 0, fontSize: "24px" }}>
          لماذا تختار منصة رتل
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginTop: "25px",
          }}
        >
          <div
            style={{
              padding: "15px",
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: "12px",
            }}
          >
            <span style={{ fontSize: "30px" }}>🌎</span>
            <h4 style={{ margin: "10px 0 5px 0", color: "#d4af37" }}>
              教育 تعليم بكل اللغات
            </h4>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.8 }}>
              أكاديمية عالمية متخصصة في تعليم القرآن واللغة العربية لجميع
              الجنسيات بمختلف لغات العالم.
            </p>
          </div>
          <div
            style={{
              padding: "15px",
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: "12px",
            }}
          >
            <span style={{ fontSize: "30px" }}>👥</span>
            <h4 style={{ margin: "10px 0 5px 0", color: "#d4af37" }}>
              +٢٥ ألف طالب وطالبة
            </h4>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.8 }}>
              ثقة آلاف العائلات حول العالم تجمعنا في بيئة إيمانية تعليمية
              متكاملة لجميع الأعمار.
            </p>
          </div>
          <div
            style={{
              padding: "15px",
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: "12px",
            }}
          >
            <span style={{ fontSize: "30px" }}>👨‍🏫</span>
            <h4 style={{ margin: "10px 0 5px 0", color: "#d4af37" }}>
              +١٠٠٠ معلم ومعلمة
            </h4>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.8 }}>
              نخبة من المدرسين المعتمدين والمجازين بالقراءات العشر لضمان جودة
              الحفظ والتجويد.
            </p>
          </div>
        </div>
        <p
          style={{
            fontSize: "15px",
            marginTop: "25px",
            opacity: 0.9,
            fontStyle: "italic",
            color: "#e5e7eb",
          }}
        >
          💡 جميع حصصنا فردية (معلم خاص لكل طالب) لضمان التركيز الكامل والمتابعة
          الدقيقة لتقدمك أو تقدم طفلك.
        </p>
      </div>

      <h2 style={{ color: "#d4af37", fontSize: "26px", marginTop: "40px" }}>
        🛒 اختر الباقة المناسبة وابدأ الآن
      </h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        {packages.map((pkg, index) => (
          <div
            key={index}
            style={{
              border: pkg.popular
                ? "3px solid #d4af37"
                : "1px solid rgba(255,255,255,0.2)",
              borderRadius: "15px",
              padding: "25px",
              width: "260px",
              backgroundColor: pkg.popular
                ? "rgba(214,175,55,0.1)"
                : "rgba(255,255,255,0.05)",
            }}
          >
            {pkg.popular && (
              <div
                style={{
                  backgroundColor: "#d4af37",
                  color: "#064e3b",
                  padding: "3px 10px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  display: "inline-block",
                  marginBottom: "10px",
                  fontWeight: "bold",
                }}
              >
                الأكثر طلباً
              </div>
            )}
            <h3 style={{ fontSize: "20px", margin: "10px 0" }}>{pkg.title}</h3>
            <h2
              style={{ color: "#d4af37", fontSize: "32px", margin: "10px 0" }}
            >
              {pkg.price}
            </h2>
            <button
              onClick={() => {
                setSelectedPkg(pkg);
                setShowModal(true);
                setFormError("");
              }}
              style={{
                backgroundColor: "#d4af37",
                color: "#064e3b",
                border: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "15px",
                width: "100%",
                fontSize: "16px",
              }}
            >
              اشتراك الآن
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "15px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              color: "#333",
              padding: "30px",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "450px",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              boxSizing: "border-box",
              textAlign: "right",
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "15px",
                left: "15px",
                background: "none",
                border: "none",
                fontSize: "22px",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              ✕
            </button>
            {!formSubmitted ? (
              <>
                <h3
                  style={{
                    color: "#064e3b",
                    textAlign: "center",
                    marginBottom: "20px",
                  }}
                >
                  خطوات الاشتراك والتأكيد
                </h3>
                <div
                  style={{
                    backgroundColor: "#eff6ff",
                    color: "#1e40af",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    marginBottom: "15px",
                    border: "1px solid #bfdbfe",
                    fontWeight: "500",
                  }}
                >
                  📢 <b>ملحوظة هامة:</b> بمجرد تحويل المبلغ وملء البيانات أدناه،
                  سيتواصل معك فريق الدعم فوراً عبر الواتساب لتنسيق المواعيد
                  الأنسب لك وتحديد المعلم.
                </div>
                <div
                  style={{
                    backgroundColor: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    lineHeight: "1.8",
                  }}
                >
                  <p>
                    <b>1. تحويل المبلغ الخاص بالباقة:</b>
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      margin: "10px 0",
                    }}
                  >
                    <span>
                      رقم فودافون كاش:{" "}
                      <b style={{ color: "#064e3b" }}>01010848410</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("01010848410")}
                      style={{ padding: "3px 8px", cursor: "pointer" }}
                    >
                      نسخ
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      عنوان إنستا باي:{" "}
                      <b style={{ color: "#064e3b" }}>shehab_67</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("shehab_67")}
                      style={{ padding: "3px 8px", cursor: "pointer" }}
                    >
                      نسخ
                    </button>
                  </div>
                  {copied && (
                    <p
                      style={{
                        color: "green",
                        fontSize: "14px",
                        textAlign: "center",
                        marginTop: "5px",
                      }}
                    >
                      تم النسخ!
                    </p>
                  )}
                </div>
                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <p>
                    <b>2. بيانات التأكيد بعد الدفع:</b>
                  </p>
                  {formError && (
                    <div
                      style={{
                        backgroundColor: "#fee2e2",
                        color: "#dc2626",
                        padding: "10px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      ⚠️ {formError}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      setFormError("");
                    }}
                    style={{
                      padding: "12px",
                      borderRadius: "5px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="رقم الواتساب"
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(e.target.value);
                      setFormError("");
                    }}
                    style={{
                      padding: "12px",
                      borderRadius: "5px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="العمر"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      setFormError("");
                    }}
                    style={{
                      padding: "12px",
                      borderRadius: "5px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                  />
                  <label>ارفع صورة إيصال التحويل:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: "#064e3b",
                      color: "#fff",
                      border: "none",
                      padding: "14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {loading ? "جاري الإرسال..." : "تأكيد وإرسال الطلب"}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <h2 style={{ color: "green" }}>تم إرسال طلبك بنجاح! 🎉</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormSubmitted(false);
                  }}
                  style={{
                    backgroundColor: "#064e3b",
                    color: "#fff",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginTop: "20px",
                  }}
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
