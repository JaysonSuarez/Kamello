import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, CheckCircle2, FileText, Loader2, ShieldCheck, Upload, UserCheck } from 'lucide-react';
import '../styles.css'; // Asegurar que toma los estilos

export default function KYCVerification({ user, profile, onVerified }) {
  const [step, setStep] = useState(profile?.verification_status === 'in_review' ? 4 : 1);
  const [loading, setLoading] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

  // Simulador de subida
  const handleUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === 'id') setIdFile(URL.createObjectURL(file));
    if (type === 'selfie') setSelfieFile(URL.createObjectURL(file));
  };

  const submitKYC = async () => {
    if (!idFile || !selfieFile) return alert("Faltan documentos");
    setLoading(true);
    try {
      // En producción aquí se subiría a Supabase Storage:
      // await supabase.storage.from('kyc_documents').upload(`${user.id}/id.jpg`, rawFile);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'in_review',
          id_document_url: 'uploaded_id_mock',
          selfie_url: 'uploaded_selfie_mock'
        })
        .eq('id', user.id);

      if (error) throw error;

      // Avisar a todos los administradores
      const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true);
      if (admins && admins.length > 0) {
        for (const admin of admins) {
          fetch('/api/v1/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: admin.id,
              title: "🔔 Nuevo Kamellador Registrado",
              body: "Alguien ha enviado sus documentos. Toca para verificar y aprobar.",
              data: { url: "/admin" }
            })
          }).catch(e => console.log("Push admin error:", e));
        }
      }

      setStep(4);
    } catch (err) {
      alert("Error al enviar documentos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // BOTÓN DE DESARROLLO: Para simular que un admin aprobó el KYC y probar la notificación
  const simulateAdminApproval = async () => {
    setLoading(true);
    try {
      // 1. Aprobar en BD
      await supabase.from('profiles').update({ verification_status: 'verified' }).eq('id', user.id);
      
      // 2. Enviar notificación Push al Kamellador
      await fetch('/api/v1/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: "✅ ¡Identidad Verificada!",
          body: "Tu perfil ha sido aprobado. Ya puedes empezar a recibir ofertas en Kamello.",
          data: { url: "/dashboard" }
        })
      });

      onVerified(); // Actualiza el estado global para dejarlo entrar al dashboard
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [stream, setStream] = useState(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: step === 2 ? 'environment' : 'user' } 
      });
      setStream(s);
    } catch (err) {
      alert("No se pudo acceder a la cámara. Por favor permite los permisos.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = (type) => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    if (type === 'id') setIdFile(dataUrl);
    if (type === 'selfie') setSelfieFile(dataUrl);
    stopCamera();
  };

  React.useEffect(() => {
    return () => stopCamera();
  }, []);

  // Bind stream to video whenever it changes
  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, step]);

  return (
    <div className="app-shell" style={{ background: '#1f2c45', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ padding: '20px', textAlign: 'center', flexShrink: 0 }}>
        <ShieldCheck className="w-12 h-12" style={{ color: '#00cba9', margin: '0 auto 12px' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px' }}>Seguridad Kamello</h1>
        <p style={{ color: '#a4b1c6', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Para proteger a nuestra comunidad, necesitamos verificar tu identidad antes de que puedas aceptar servicios.
        </p>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Content */}
      <div style={{ flex: 1, background: 'white', borderRadius: '32px 32px 0 0', padding: '30px 20px', color: '#1f2c45', overflowY: 'auto' }}>
        
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>¿Qué necesitamos?</h2>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, background: '#f7f3f1', padding: 16, borderRadius: 16 }}>
              <FileText className="w-8 h-8 text-[#ff7665]" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, margin: '0 0 4px' }}>Documento de Identidad</p>
                <p style={{ fontSize: '0.85rem', color: '#5f6a79', margin: 0 }}>Foto clara de tu cédula por ambos lados.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 30, background: '#f7f3f1', padding: 16, borderRadius: 16 }}>
              <UserCheck className="w-8 h-8 text-[#ff7665]" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, margin: '0 0 4px' }}>Selfie de Verificación</p>
                <p style={{ fontSize: '0.85rem', color: '#5f6a79', margin: 0 }}>Una foto actual de tu rostro para comparar biométricamente.</p>
              </div>
            </div>

            <button onClick={() => setStep(2)} className="btn-primary btn-primary--accent">
              Comenzar Verificación
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>Documento de Identidad</h2>
            <p style={{ fontSize: '0.9rem', color: '#5f6a79', marginBottom: 24 }}>Sube tu cédula por ambos lados en un **único archivo PDF**.</p>

            <label style={{ display: 'block', background: '#f7f3f1', border: '2px dashed #efe7e2', borderRadius: 20, padding: 40, textAlign: 'center', cursor: 'pointer', marginBottom: 24 }}>
              {idFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: '#ff7665', color: 'white', padding: '12px 20px', borderRadius: 12, fontWeight: 800, fontSize: '0.8rem' }}>PDF CARGADO</div>
                  <p style={{ fontSize: '0.85rem', color: '#1f2c45', fontWeight: 600 }}>{idFile.name || "cedula_completa.pdf"}</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-[#a4b1c6] mb-4" />
                  <p style={{ fontWeight: 700, color: '#1f2c45' }}>Toca para subir PDF</p>
                  <p style={{ fontSize: '0.75rem', color: '#5f6a79', marginTop: 4 }}>Máximo 5MB</p>
                </>
              )}
              <input 
                type="file" 
                accept="application/pdf" 
                hidden 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setIdFile(file);
                }} 
              />
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>Atrás</button>
              <button onClick={() => setStep(3)} disabled={!idFile} className="btn-primary btn-primary--accent" style={{ flex: 2 }}>
                Continuar a Selfie
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>Selfie Biométrica</h2>
            <p style={{ fontSize: '0.9rem', color: '#5f6a79', marginBottom: 24 }}>Mira a la cámara y mantén tu rostro en el centro.</p>

            <div style={{ width: 240, height: 240, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 24px', border: '4px solid #ff7665', position: 'relative', background: '#f7f3f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selfieFile ? (
                <img src={selfieFile} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : stream ? (
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              ) : (
                <Camera className="w-12 h-12 text-[#a4b1c6]" />
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              {!stream && !selfieFile && (
                <button onClick={startCamera} className="btn-primary" style={{ background: '#1f2c45' }}>
                   <Camera className="w-5 h-5" /> Activar Cámara Frontal
                </button>
              )}
              {stream && (
                <button onClick={() => capturePhoto('selfie')} className="btn-primary btn-primary--accent">
                  Capturar Selfie
                </button>
              )}
              {selfieFile && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setSelfieFile(null); startCamera(); }} className="btn-secondary" style={{ flex: 1 }}>Repetir</button>
                  <button onClick={submitKYC} disabled={loading} className="btn-primary btn-primary--accent" style={{ flex: 2 }}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Enviar a Revisión"}
                  </button>
                </div>
              )}
              {!selfieFile && (
                <button onClick={() => { stopCamera(); setStep(2); }} className="btn-secondary" style={{ border: 'none' }}>Atrás</button>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in-up" style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
              <div className="pulse-ring" style={{ borderColor: '#00cba9' }}></div>
              <div style={{ width: '100%', height: '100%', background: '#00cba9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>Documentos en Revisión</h2>
            <p style={{ color: '#5f6a79', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 40 }}>
              Nuestro sistema de IA y el equipo de seguridad están verificando tu identidad. Esto suele tardar unos minutos. 
              <strong> Te notificaremos cuando estés listo.</strong>
            </p>

            {/* Simulación para Testing */}
            <div style={{ padding: 16, background: '#f7f3f1', borderRadius: 16, border: '1px dashed #a4b1c6' }}>
              <p style={{ fontSize: '0.8rem', color: '#5f6a79', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase' }}>🔧 Herramienta de Prueba</p>
              <button onClick={simulateAdminApproval} disabled={loading} className="btn-primary" style={{ background: '#1f2c45', padding: '10px' }}>
                {loading ? "Aprobando..." : "Simular Aprobación Admin"}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
