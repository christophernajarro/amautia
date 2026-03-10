"""Email service using aiosmtplib. Falls back to console log when SMTP not configured."""
import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body_html: str) -> bool:
    """Send HTML email. Returns True on success, False on error."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        # Dev mode: log to console
        logger.info(f"[EMAIL→{to}] {subject}\n{body_html[:300]}")
        return True

    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Amautia <{settings.SMTP_USER}>"
        msg["To"] = to
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        await aiosmtplib.send(
            msg, hostname=settings.SMTP_HOST, port=settings.SMTP_PORT,
            username=settings.SMTP_USER, password=settings.SMTP_PASS,
            use_tls=settings.SMTP_TLS,
        )
        return True
    except Exception as e:
        logger.error(f"Email error to {to}: {e}")
        return False


# ─── Email Templates ───

def _base(content: str, title: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>{title}</title></head>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:32px 0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:#4f46e5;padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:24px">🎓 Amautia</h1>
      <p style="color:#c7d2fe;margin:4px 0 0;font-size:14px">Plataforma educativa con IA</p>
    </div>
    <div style="padding:32px">{content}</div>
    <div style="background:#f1f5f9;padding:16px 32px;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">© 2026 Amautia · <a href="#" style="color:#6366f1">Desuscribirse</a></p>
    </div>
  </div>
</body></html>"""


async def send_welcome(to: str, name: str, role: str):
    role_text = {"profesor": "como Profesor", "alumno": "como Alumno", "superadmin": "como Administrador"}.get(role, "")
    content = f"""
<h2 style="color:#1e293b;margin-top:0">¡Bienvenido, {name}! 🎉</h2>
<p style="color:#64748b">Tu cuenta ha sido creada {role_text} en Amautia.</p>
<p style="color:#64748b">Ya puedes acceder a la plataforma y comenzar a usar todas las herramientas de IA.</p>
<div style="margin:24px 0;text-align:center">
  <a href="http://localhost:3000/login" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
    Ingresar a Amautia →
  </a>
</div>
<p style="color:#94a3b8;font-size:13px">Si tienes preguntas, contáctanos en soporte@amautia.com</p>"""
    await send_email(to, "¡Bienvenido a Amautia!", _base(content, "Bienvenido"))


async def send_exam_corrected(to: str, name: str, exam_title: str, score: float, total: float, feedback: str):
    pct = round(score / total * 100) if total > 0 else 0
    color = "#10b981" if pct >= 70 else "#f59e0b" if pct >= 50 else "#ef4444"
    content = f"""
<h2 style="color:#1e293b;margin-top:0">Tu examen ha sido corregido 📋</h2>
<p style="color:#64748b">El examen <strong>{exam_title}</strong> ya tiene resultados.</p>
<div style="background:#f8fafc;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
  <div style="font-size:48px;font-weight:700;color:{color}">{pct}%</div>
  <div style="color:#64748b;font-size:14px">{score}/{total} puntos</div>
</div>
<div style="background:#f0fdf4;border-left:4px solid #10b981;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0">
  <p style="margin:0;color:#166534;font-size:14px"><strong>Retroalimentación:</strong> {feedback}</p>
</div>
<div style="margin:24px 0;text-align:center">
  <a href="http://localhost:3000/alumno/examenes" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
    Ver detalles →
  </a>
</div>"""
    await send_email(to, f"Resultado: {exam_title}", _base(content, "Examen corregido"))


async def send_payment_received(to: str, name: str, plan: str, amount: float):
    content = f"""
<h2 style="color:#1e293b;margin-top:0">Pago recibido ✅</h2>
<p style="color:#64748b">Hola {name}, recibimos tu comprobante de pago.</p>
<div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0">
  <div style="display:flex;justify-content:space-between;margin-bottom:8px">
    <span style="color:#64748b">Plan:</span><strong>{plan}</strong>
  </div>
  <div style="display:flex;justify-content:space-between">
    <span style="color:#64748b">Monto:</span><strong>S/ {amount:.2f}</strong>
  </div>
</div>
<p style="color:#64748b">Tu suscripción será activada en las próximas <strong>horas</strong> tras verificar el pago.</p>
<p style="color:#94a3b8;font-size:13px">¿Dudas? Escríbenos a pagos@amautia.com</p>"""
    await send_email(to, "Pago recibido — Amautia", _base(content, "Pago recibido"))


async def send_payment_approved(to: str, name: str, plan: str):
    content = f"""
<h2 style="color:#1e293b;margin-top:0">¡Suscripción activada! 🚀</h2>
<p style="color:#64748b">Hola {name}, tu pago fue verificado y el plan <strong>{plan}</strong> está activo.</p>
<p style="color:#64748b">Ya tienes acceso completo a todas las funcionalidades.</p>
<div style="margin:24px 0;text-align:center">
  <a href="http://localhost:3000" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
    Ir a Amautia →
  </a>
</div>"""
    await send_email(to, "¡Tu suscripción está activa! — Amautia", _base(content, "Suscripción activa"))


async def send_study_plan_ready(to: str, name: str, plan_title: str):
    content = f"""
<h2 style="color:#1e293b;margin-top:0">Tu plan de estudio está listo 📚</h2>
<p style="color:#64748b">Hola {name}, el Tutor IA generó tu plan personalizado:</p>
<div style="background:#eef2ff;border-radius:8px;padding:16px;margin:16px 0">
  <strong style="color:#4f46e5">{plan_title}</strong>
</div>
<p style="color:#64748b">El plan incluye temas priorizados, ejercicios y recursos basados en tus resultados.</p>
<div style="margin:24px 0;text-align:center">
  <a href="http://localhost:3000/alumno/progreso" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
    Ver mi plan →
  </a>
</div>"""
    await send_email(to, "Plan de estudio personalizado listo", _base(content, "Plan de estudio"))
