import re
from pathlib import Path

js_source = Path("C:/Users/abiel/OneDrive/Documentos/huerto-connect-api/src/templates/otp-email.template.js").read_text(encoding="utf-8")
py_dest = Path("D:/HuertoConnect_API/auth-service/app/services/mail_service.py")

# Extract the HTML template from JS
match = re.search(r"const html = `(<!doctype html>.*?)`;", js_source, re.DOTALL)
html_str = match.group(1)

# Convert JS template literals to Python f-string format
# ${cidImg('logo', 44, 44, 'Huerto Connect')} -> {_cid_img('logo', 44, 44, 'Huerto Connect')}
html_str = re.sub(r"\$\{cidImg\(([^)]+)\)\}", r"{_cid_img(\1)}", html_str)
html_str = html_str.replace("${emailHeaderBadge}", "{email_header_badge}")
html_str = html_str.replace("${safeName}", "{safe_name}")
html_str = html_str.replace("${emailTitle}", "{email_title}")
html_str = html_str.replace("${emailMessage}", "{email_message}")
html_str = html_str.replace("${otpSectionLabel}", "{otp_section_label}")
html_str = html_str.replace("${otpDigits}", "{otp_digits}")
html_str = html_str.replace("${otpFooterLegend}", "{otp_footer_legend}")
html_str = html_str.replace("${expiresInMinutes}", "{expires_in_minutes}")
html_str = html_str.replace("${emailWarning}", "{email_warning}")
html_str = html_str.replace("${verificationButton}", "{verification_button}")
html_str = html_str.replace("${securityNotice}", "{security_notice}")
html_str = html_str.replace("${new Date().getFullYear()}", '{datetime.now(timezone.utc).year}')
html_str = html_str.replace("${escapeHtml(emailSubject)}", "{_escape_html(email_subject)}")
# Handle `{` or `}` that are CSS inside style blocks by double escaping them, except our variables
html_str = re.sub(r"(?<!\{)\{(?!_cid_img|email_header_badge|safe_name|email_title|email_message|otp_section_label|otp_digits|otp_footer_legend|expires_in_minutes|email_warning|verification_button|security_notice|datetime\.now|_escape_html)", "{{", html_str)
html_str = re.sub(r"(?<!\})\}(?!\})", "}}", html_str)
# Now fix our variables back
known_vars = ["_cid_img", "email_header_badge", "safe_name", "email_title", "email_message", "otp_section_label", "otp_digits", "otp_footer_legend", "expires_in_minutes", "email_warning", "verification_button", "security_notice", "datetime.now", "_escape_html"]
for v in known_vars:
    html_str = html_str.replace(f"{{{{{v}", f"{{{v}")
    # We must be careful about the closing brackets. The regex already skipped the opening brackets for these vars, so only the closing brackets need fixing?
    # Wait, the second regex replaced ALL single `}` with `}}`. So our variables look like `{var}}`. Let's fix them to `{var}`.
    html_str = re.sub(r"\{(" + "|".join([v.replace('.', r'\.') for v in known_vars]) + r"[^}]*)\}\}", r"{\1}", html_str)

new_func = f'''def _cid_img(key: str, width: int, height: int, alt: str = "") -> str:
    return f\'<img src="cid:{{key}}@huerto" width="{{width}}" height="{{height}}" alt="{{alt}}" style="display:inline-block;vertical-align:middle;border:0;outline:none;" />\'

def _build_otp_html(
    otp_code: str,
    action: str,
    recipient_name: str = "Usuario",
    expires_in_minutes: int = 5,
    verify_url: str = "",
) -> str:
    is_registro = action == "registro"
    is_reset = action in ("reset_password", "reset-password")

    safe_name = _escape_html(recipient_name)
    safe_code = _escape_html(otp_code)

    if is_registro:
        email_subject = "Huerto Connect - Confirma tu registro"
        email_title = "Confirma tu registro"
        email_message = 'Usa el siguiente c&oacute;digo para activar tu cuenta en <strong style="color:#2E7D32;">Huerto Connect</strong>.'
        email_warning = "Si no creaste esta cuenta, ignora este correo."
        button_text = "Activar cuenta"
        email_header_badge = "Verificaci&oacute;n de registro de cuenta"
    elif is_reset:
        email_subject = "Huerto Connect - Cambia tu contrasena"
        email_title = "Cambia tu contrasena"
        email_message = 'Usa el siguiente c&oacute;digo para autorizar el <strong style="color:#2E7D32;">cambio de contrase&ntilde;a</strong> de tu cuenta.'
        email_warning = "Si no solicitaste este cambio, ignora este correo y revisa la seguridad de tu cuenta."
        button_text = "Cambiar contrasena"
        email_header_badge = "Restablecimiento de contrase&ntilde;a"
    else:
        email_subject = "Huerto Connect - Verifica tu cuenta"
        email_title = "Verifica tu cuenta"
        email_message = 'Usa el siguiente c&oacute;digo para completar tu inicio de sesi&oacute;n en <strong style="color:#2E7D32;">Huerto Connect</strong>.'
        email_warning = "Si no solicitaste este acceso, ignora este correo y protege tu cuenta."
        button_text = "Verificar acceso"
        email_header_badge = "Verificaci&oacute;n de cuenta"

    otp_section_label = "Parcela de recuperaci&oacute;n" if is_reset else "Parcela de verificaci&oacute;n"
    otp_footer_legend = "protegiendo tu cuenta digital" if is_reset else "cultivando seguridad"
    
    security_notice = (
        f"{{_cid_img('shield', 18, 18)}} <strong>Aviso de seguridad:</strong> Si no solicitaste este cambio, ignora este correo."
        if is_reset else
        f"{{_cid_img('shield', 18, 18)}} <strong>Aviso de seguridad:</strong> Nunca compartas este c&oacute;digo OTP. Nuestro equipo no solicita este c&oacute;digo por chat, llamada o redes sociales."
    )

    otp_digits = "".join(
        f\'<td align="center" style="padding:0 3px;">\'
        f\'<div style="width:46px;height:58px;line-height:58px;text-align:center;font-size:28px;font-weight:800;\'
        f"font-family:'Segoe UI',Arial,sans-serif;color:#1565C0;background-color:#FFFFFF;\'
        f\'border:2px solid #8D6E63;border-radius:10px;">{{d}}</div></td>\'
        for d in safe_code
    )

    verification_button = ""
    if verify_url:
        safe_url = _escape_html(verify_url)
        verification_button = f"""
        <tr>
          <td align="center" style="padding:6px 28px 24px 28px;">
            <a href="{{safe_url}}" style="display:inline-block;padding:15px 40px;border-radius:999px;
               background-color:#2E7D32;color:#FFFFFF;font-size:15px;font-weight:700;
               text-decoration:none;text-align:center;letter-spacing:0.4px;">
              {{button_text}}
            </a>
          </td>
        </tr>"""

    return f"""{html_str}"""
'''

py_src = py_dest.read_text(encoding="utf-8")
new_py_src = re.sub(r"def _build_otp_html\(.*?return f\"\"\"<!doctype html>.*?</html>\"\"\"", new_func, py_src, flags=re.DOTALL)

# Add imports and caching
imports_and_cache = """from email.mime.image import MIMEImage
from pathlib import Path
import json

PNG_CACHE_PATH = Path(__file__).parent / "png_cache.json"
PNG_CACHE = {}
if PNG_CACHE_PATH.exists():
    with open(PNG_CACHE_PATH, "r") as f:
        PNG_CACHE = json.load(f)

# ===================== MAGIC-LINK TOKEN HELPERS ====================="""
new_py_src = new_py_src.replace("# ===================== MAGIC-LINK TOKEN HELPERS =====================", imports_and_cache)

# Embeed images in send_otp_email
attachment_code = """        msg.attach(MIMEText(html_body, "html", "utf-8"))

        for key, b64_str in PNG_CACHE.items():
            img_data = base64.b64decode(b64_str)
            img = MIMEImage(img_data, _subtype="png")
            img.add_header("Content-ID", f"<{key}@huerto>")
            img.add_header("X-Attachment-Id", f"{key}@huerto")
            img.add_header("Content-Disposition", "inline")
            msg.attach(img)"""

new_py_src = new_py_src.replace('        msg.attach(MIMEText(html_body, "html", "utf-8"))', attachment_code)

py_dest.write_text(new_py_src, encoding="utf-8")
print("Patched successfully!")
