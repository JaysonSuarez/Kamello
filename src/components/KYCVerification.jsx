import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Camera, CheckCircle2, FileText, Loader2, ShieldCheck, Upload, UserCheck, Clock } from 'lucide-react';
import '../styles.css';

export default function KYCVerification({ user, profile, onVerified }) {
  const isRejected = profile?.verification_status === 'rejected';
  const [step, setStep] = useState(profile?.verification_status === 'in_review' ? 4 : 1);
  const [loading, setLoading] = useState(false);
  const [idFile, setIdFile] = useState(null); // Archivo PDF real
  const [selfieBlob, setSelfieBlob] = useState(null); // Blob de la selfie
  const [selfiePreview, setSelfiePreview] = useState(null); // URL para vista previa
  const [showCongratz, setShowCongratz] = useState(false);

  const navigate = useNavigate();

  // Realtime: Escuchar cuando el admin nos apruebe
  React.useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('kyc_realtime')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, payload => {
        if (payload.new.verification_status === 'verified') {
          // Auto-conectar al ser aprobado para que el dashboard no sea "inútil"
          supabase.from('profiles').update({ is_online: true }).eq('id', user.id).then(() => {
            setShowCongratz(true);
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const ADMIN_USER_ID = '3611fe9d-b578-40f8-af53-c17d42dc740d';

  const submitKYC = async () => {
    if (!idFile || !selfieBlob) return alert("Faltan documentos");
    setLoading(true);
    try {
      // 1. Subir PDF a Supabase Storage
      const idFileName = `${user.id}/id_${Date.now()}.pdf`;
      const { error: idUploadError } = await supabase.storage
        .from('kyc_documents')
        .upload(idFileName, idFile, { upsert: true });
      if (idUploadError) throw idUploadError;
      const { data: idPublicData } = supabase.storage.from('kyc_documents').getPublicUrl(idFileName);

      // 2. Subir Selfie a Supabase Storage
      const selfieFileName = `${user.id}/selfie_${Date.now()}.jpg`;
      const { error: selfieUploadError } = await supabase.storage
        .from('kyc_documents')
        .upload(selfieFileName, selfieBlob, { contentType: 'image/jpeg', upsert: true });
      if (selfieUploadError) throw selfieUploadError;
      const { data: selfiePublicData } = supabase.storage.from('kyc_documents').getPublicUrl(selfieFileName);

      // 3. Actualizar perfil en BD con links reales
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'in_review',
          id_document_url: idPublicData.publicUrl,
          selfie_url: selfiePublicData.publicUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      // 4. Notificar al admin vía push (usamos la anon key para máxima confiabilidad)
      try {
        const notifRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bright-responder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: ADMIN_USER_ID,
            title: '🚨 Nuevo Kamellador en Revisión',
            body: `${profile?.full_name || 'Un nuevo usuario'} acaba de enviar sus documentos de verificación. Entra a revisar.`,
            data: { url: '/admin' }
          })
        });
        const notifJson = await notifRes.json();
        console.log('Admin notificado:', notifJson);
      } catch (notifErr) {
        console.warn('No se pudo notificar al admin:', notifErr);
      }

      setStep(4);
    } catch (err) {
      alert("Error al enviar documentos: " + err.message);
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
        video: { facingMode: 'user' } 
      });
      setStream(s);
    } catch (err) {
      alert("No se pudo acceder a la cámara.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      setSelfieBlob(blob);
      setSelfiePreview(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.8);
    
    stopCamera();
  };

  // EFECTO CRÍTICO: Si el admin rechaza mientras el usuario está viendo la pantalla,
  // forzamos el regreso al paso 1 para que vea el mensaje de error.
  React.useEffect(() => {
    if (profile?.verification_status === 'rejected') {
      setStep(1);
    }
  }, [profile?.verification_status]);

  React.useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="app-shell" style={{ background: '#1f2c45', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', textAlign: 'center', flexShrink: 0 }}>
        <ShieldCheck className="w-12 h-12" style={{ color: '#00cba9', margin: '0 auto 12px' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px' }}>Seguridad Kamello</h1>
        <p style={{ color: '#a4b1c6', fontSize: '0.9rem' }}>Verificación de identidad requerida.</p>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ flex: 1, background: 'white', borderRadius: '32px 32px 0 0', padding: '30px 20px', color: '#1f2c45', overflowY: 'auto' }}>
        
        {step === 1 && (
          <div className="animate-fade-in-up">
            {isRejected && (
              <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#c53030', marginBottom: 8 }}>
                  <ShieldCheck className="w-5 h-5" />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>DOCUMENTOS RECHAZADOS</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#742a2a', margin: 0, lineHeight: 1.4 }}>
                  Tu verificación previa no fue aprobada. Por favor, asegúrate de que el PDF de la cédula sea legible y la selfie tenga buena iluminación.
                </p>
              </div>
            )}
            
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>Documentos Requeridos</h2>
            <div style={{ background: '#f7f3f1', padding: 16, borderRadius: 16, marginBottom: 16 }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px' }}>1. Cédula en PDF</p>
              <p style={{ fontSize: '0.85rem', color: '#5f6a79' }}>Foto de ambos lados en un solo archivo.</p>
            </div>
            <div style={{ background: '#f7f3f1', padding: 16, borderRadius: 16, marginBottom: 30 }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px' }}>2. Selfie Biometríca</p>
              <p style={{ fontSize: '0.85rem', color: '#5f6a79' }}>Foto actual de tu rostro.</p>
            </div>
            <button onClick={() => setStep(2)} className="btn-primary btn-primary--accent">
              {isRejected ? "Enviar nuevamente documentos" : "Comenzar Verificación"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>Subir Cédula</h2>
            <p style={{ fontSize: '0.9rem', color: '#5f6a79', marginBottom: 24 }}>Sube tu documento en formato PDF.</p>
            <label style={{ display: 'block', background: '#f7f3f1', border: '2px dashed #efe7e2', borderRadius: 20, padding: 40, textAlign: 'center', cursor: 'pointer', marginBottom: 24 }}>
              {idFile ? <p style={{ fontWeight: 800, color: '#00cba9' }}>✅ {idFile.name}</p> : <><Upload className="w-12 h-12 mx-auto text-[#a4b1c6] mb-4" /><p style={{ fontWeight: 700 }}>Toca para subir PDF</p></>}
              <input type="file" accept="application/pdf" hidden onChange={(e) => setIdFile(e.target.files[0])} />
            </label>
            <button onClick={() => setStep(3)} disabled={!idFile} className="btn-primary btn-primary--accent">Continuar a Selfie</button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 24 }}>Selfie Biométrica</h2>
            <div style={{ width: 240, height: 240, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 24px', border: '4px solid #ff7665', background: '#f7f3f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selfiePreview ? <img src={selfiePreview} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : stream ? <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} /> : <Camera className="w-12 h-12 text-[#a4b1c6]" />}
            </div>
            {!stream && !selfiePreview && <button onClick={startCamera} className="btn-primary" style={{ background: '#1f2c45' }}>Activar Cámara</button>}
            {stream && <button onClick={capturePhoto} className="btn-primary btn-primary--accent">Capturar Foto</button>}
            {selfiePreview && <button onClick={submitKYC} disabled={loading} className="btn-primary btn-primary--accent">{loading ? "Enviando..." : "Enviar a Revisión"}</button>}
            {selfiePreview && <button onClick={() => { setSelfiePreview(null); startCamera(); }} className="mt-4 text-[#ff7665] font-bold w-full">Repetir Foto</button>}
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in-up" style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
              <span style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 120, height: 120, marginTop: -60, marginLeft: -60,
                borderRadius: '50%', border: '2px solid rgba(255,118,101,0.25)',
                animation: 'k-pulse 2.4s ease-in-out infinite', pointerEvents: 'none'
              }} />
              <span style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 96, height: 96, marginTop: -48, marginLeft: -48,
                borderRadius: '50%', border: '2px solid rgba(255,118,101,0.40)',
                animation: 'k-pulse 2.4s ease-in-out 0.8s infinite', pointerEvents: 'none'
              }} />
              <div style={{ position: 'relative', zIndex: 1, width: 80, height: 80, background: '#fff0ee', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 35px rgba(255,118,101,0.20)' }}>
                <Clock className="w-10 h-10" style={{ color: '#ff7665' }} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 12, color: '#1f2c45' }}>Documentos en Revisión</h2>
            <p style={{ color: '#5f6a79', fontSize: '1rem', lineHeight: 1.6, marginBottom: 40 }}>
              Estamos verificando tu identidad para garantizar la seguridad de la comunidad Kamello.
            </p>
            <div style={{ background: '#f7f3f1', padding: 20, borderRadius: 24, textAlign: 'left', marginBottom: 40 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#1f2c45', fontWeight: 800 }}>Tiempo estimado: <b>5 a 15 minutos</b></p>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} style={{ color: '#ff7665', fontWeight: 800, fontSize: '0.9rem', background: 'none', border: 'none' }}>Cerrar Sesión</button>
          </div>
        )}
      </div>

      {/* Congratulations Modal */}
      {showCongratz && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(31,44,69,0.9)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="animate-scale-in" style={{ background: 'white', borderRadius: 44, padding: '48px 32px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 30px 70px rgba(0,0,0,0.4)' }}>
            <div style={{ width: 100, height: 100, background: '#e6fffb', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', border: '4px solid #00cba9' }}>
              <CheckCircle2 className="w-12 h-12" style={{ color: '#00cba9' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#1f2c45', marginBottom: 16, fontWeight: 900 }}>¡Perfil Aprobado!</h2>
            <p style={{ color: '#5f6a79', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 40 }}>
              ¡Felicidades! Ya eres parte oficial de los <b>Kamelladores</b>. Prepárate para recibir tus primeras ofertas.
            </p>
            <button 
              onClick={() => {
                setShowCongratz(false);
                if (onVerified) onVerified();
              }} 
              className="btn-primary"
              style={{ background: '#00cba9', height: 64, borderRadius: 24, fontSize: '1.2rem', boxShadow: '0 12px 30px rgba(0,203,169,0.3)' }}
            >
              ¡Empezar ahora!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
