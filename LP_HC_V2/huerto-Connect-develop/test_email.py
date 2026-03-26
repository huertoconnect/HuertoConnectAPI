import sys
sys.path.append("D:/HuertoConnect_API/auth-service")

import asyncio
from app.services.mail_service import _build_otp_html

html = _build_otp_html("123456", "login", "Abiel")
with open("test_email.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Dumped HTML to test_email.html")
