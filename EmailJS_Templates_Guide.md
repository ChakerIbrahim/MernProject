# إعدادات قوالب EmailJS لمنصة اعتماد

هذا الدليل يحتوي على الإعدادات التي يجب إدخالها في لوحة تحكم EmailJS، بالإضافة إلى كود HTML الجاهز للنسخ واللصق لكل قالب.

---

## 1. القالب العام (General Platform Notifications)
**Template ID:** `template_w1mnjin`

هذا القالب يُستخدم لإرسال الإشعارات مثل: الموافقة على حساب المؤسسة، الرفض، التنبيهات، وغيرها. يعتمد على النص العربي المرفق مسبقاً.

### أ. إعدادات القالب (Settings)
في صفحة القالب على موقع EmailJS، املأ الحقول كالتالي:

- **To Email:** `{{to_email}}`
- **From Name:** `اعتماد | ProcureBid`
- **From Email:** (اتركه فارغاً)
- **Use Default Email Address:** (ضع علامة صح / مفعّل)
- **Reply To:** (اتركه فارغاً)
- **Bcc:** (اتركه فارغاً)
- **Cc:** (اتركه فارغاً)
- **Subject:** `{{email_subject}}`

### ب. كود القالب (HTML Code)
انسخ الكود التالي والصقه في محرر القالب (اضغط على `< > Code` إذا كنت في المحرر المرئي):

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>{{email_subject}}</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F1EA;font-family:Tahoma,Arial,sans-serif;direction:rtl;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    {{email_subject}}
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#F4F1EA;padding:40px 12px;direction:rtl;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E6E1D8;">
          <tr>
            <td align="center" style="background:#0E2D4A;padding:30px 24px;">
              <div style="font-size:26px;line-height:34px;font-weight:800;color:#FFFFFF;">
                اعتماد <span style="color:#C8963E;">| ProcureBid</span>
              </div>
              <div style="margin-top:8px;color:#D8E1E8;font-size:12px;line-height:18px;">
                منصة المشتريات والمناقصات
              </div>
            </td>
          </tr>
          <tr>
            <td height="4" style="height:4px;background:#C8963E;font-size:4px;line-height:4px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:38px 30px 32px;text-align:right;">
              <h1 style="margin:0 0 16px;color:#0E2D4A;font-size:24px;line-height:34px;font-weight:800;">
                {{email_title}}
              </h1>
              <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:26px;">
                مرحباً <strong style="color:#0E2D4A;">{{to_name}}</strong>،
              </p>
              <p style="margin:0 0 24px;color:#64748B;font-size:14px;line-height:25px;">
                {{intro_text}}
              </p>

              <p style="margin:22px 0 0;padding:13px 16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;color:#64748B;font-size:12px;line-height:21px;text-align:center;">
                {{expiry_text}}
              </p>
              <p style="margin:22px 0 0;color:#94A3B8;font-size:12px;line-height:21px;">
                {{security_note}}
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 30px;background:#FAFAF9;border-top:1px solid #E7E5E4;">
              <div style="color:#0E2D4A;font-size:14px;font-weight:700;">اعتماد | ProcureBid</div>
              <div style="margin-top:6px;color:#94A3B8;font-size:11px;">مشتريات موثوقة ومناقصات شفافة</div>
            </td>
          </tr>
        </table>
        <p style="max-width:560px;margin:18px auto 0;color:#94A3B8;font-size:10px;line-height:16px;text-align:center;">
          هذه رسالة آلية من منصة اعتماد. يرجى عدم الرد على هذه الرسالة.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. قالب التحقق (Verification and Password-Reset)
**Template ID:** `template_ui7ifvr`

هذا القالب يُستخدم لإرسال رموز التحقق وإعادة تعيين كلمة المرور، ويعتمد على التصميم الإنجليزي الذي أرفقته مع المتغير `{{reset_code}}`.

### أ. إعدادات القالب (Settings)
في صفحة القالب على موقع EmailJS، املأ الحقول كالتالي:

- **To Email:** `{{to_email}}`
- **From Name:** `ProcureBid`
- **From Email:** (اتركه فارغاً)
- **Use Default Email Address:** (ضع علامة صح / مفعّل)
- **Reply To:** (اتركه فارغاً)
- **Bcc:** (اتركه فارغاً)
- **Cc:** (اتركه فارغاً)
- **Subject:** `ProcureBid Account Verification`

### ب. كود القالب (HTML Code)
انسخ الكود التالي والصقه في محرر القالب:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>Account Verification Code</title>
</head>

<body style="margin:0;padding:0;background-color:#F4F1EA;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">

    <!-- Preheader -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        Use this code to verify your ProcureBid account.
    </div>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
        style="background-color:#F4F1EA;padding:40px 12px;">
        <tr>
            <td align="center">

                <!-- Card -->
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
                    style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E6E1D8;">

                    <!-- Header -->
                    <tr>
                        <td align="center" style="background:#0E2D4A;padding:32px 24px;">

                            <div style="font-size:26px;line-height:32px;font-weight:800;color:#FFFFFF;">
                                Procure<span style="color:#C8963E;">Bid</span>
                            </div>

                            <div style="margin-top:8px;color:#D8E1E8;font-size:12px;line-height:18px;">
                                Procurement &amp; Bidding Platform
                            </div>

                        </td>
                    </tr>

                    <!-- Accent -->
                    <tr>
                        <td height="4" style="height:4px;background:#C8963E;font-size:4px;line-height:4px;">
                            &nbsp;
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td align="center" style="padding:42px 32px 36px;">

                            <!-- Lock Icon -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center"
                                        style="
                                            width:56px;
                                            height:56px;
                                            background:#F4F1EA;
                                            border:1px solid #E4D8C3;
                                            border-radius:50%;
                                            font-size:24px;
                                            font-weight:bold;
                                            color:#0E2D4A;
                                        ">
                                        🔒
                                    </td>
                                </tr>
                            </table>

                            <h1 style="
                                margin:20px 0 12px;
                                color:#0E2D4A;
                                font-size:24px;
                                line-height:32px;
                                font-weight:800;
                            ">
                                Account Verification
                            </h1>

                            <p style="
                                margin:0 0 14px;
                                color:#334155;
                                font-size:15px;
                                line-height:24px;
                            ">
                                Hello, <strong style="color:#0E2D4A;">{{to_name}}</strong>.
                            </p>

                            <p style="
                                margin:0 0 28px;
                                color:#64748B;
                                font-size:14px;
                                line-height:23px;
                            ">
                                We received a request to verify your ProcureBid account or reset your password. Use the code below to continue.
                            </p>

                            <p style="
                                margin:0 0 10px;
                                color:#64748B;
                                font-size:12px;
                                line-height:18px;
                                font-weight:700;
                                letter-spacing:1px;
                            ">
                                VERIFICATION CODE
                            </p>

                            <!-- Reset Code -->
                            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">

                                        <div style="
                                            display:inline-block;
                                            min-width:220px;
                                            padding:18px 24px;
                                            background:#F8F6F1;
                                            border:2px dashed #C8963E;
                                            border-radius:10px;
                                        ">
                                            <span style="
                                                font-family:'Courier New',Courier,monospace;
                                                font-size:32px;
                                                line-height:38px;
                                                font-weight:700;
                                                color:#0E2D4A;
                                                letter-spacing:7px;
                                            ">
                                                {{reset_code}}
                                            </span>
                                        </div>

                                    </td>
                                </tr>
                            </table>

                            <!-- Expiration -->
                            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
                                style="
                                    margin-top:24px;
                                    background:#F8FAFC;
                                    border:1px solid #E2E8F0;
                                    border-radius:8px;
                                ">
                                <tr>
                                    <td align="center"
                                        style="
                                            padding:13px 16px;
                                            color:#64748B;
                                            font-size:12px;
                                            line-height:19px;
                                        ">
                                        This verification code is valid for
                                        <strong style="color:#0E2D4A;">1 hour</strong>.
                                    </td>
                                </tr>
                            </table>

                            <!-- Security Warning -->
                            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
                                style="
                                    margin-top:24px;
                                    background:#FFF9EF;
                                    border:1px solid #EAD7B2;
                                    border-radius:8px;
                                ">
                                <tr>
                                    <td style="
                                        padding:14px 16px;
                                        color:#64748B;
                                        font-size:12px;
                                        line-height:20px;
                                    ">

                                        <strong style="color:#0E2D4A;">
                                            Security notice
                                        </strong>

                                        <br>

                                        If you did not request this code,
                                        please ignore this email and consider
                                        securing your account.

                                    </td>
                                </tr>
                            </table>

                            <p style="
                                margin:24px 0 0;
                                color:#94A3B8;
                                font-size:12px;
                                line-height:20px;
                            ">
                                ProcureBid will never ask you to share your
                                password or verification code.
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center"
                            style="
                                padding:24px 30px;
                                background:#FAFAF9;
                                border-top:1px solid #E7E5E4;
                            ">

                            <div style="
                                color:#0E2D4A;
                                font-size:14px;
                                font-weight:700;
                            ">
                                Procure<span style="color:#C8963E;">Bid</span>
                            </div>

                            <div style="
                                margin-top:6px;
                                color:#94A3B8;
                                font-size:11px;
                            ">
                                Secure procurement. Transparent bidding.
                            </div>

                            <div style="
                                margin-top:12px;
                                color:#A8A29E;
                                font-size:10px;
                            ">
                                &copy; 2026 ProcureBid. All rights reserved.
                            </div>

                        </td>
                    </tr>

                </table>

                <p style="
                    max-width:520px;
                    margin:18px auto 0;
                    color:#94A3B8;
                    font-size:10px;
                    line-height:16px;
                    text-align:center;
                ">
                    This is an automated message from ProcureBid.
                    Please do not reply directly to this email.
                </p>

            </td>
        </tr>
    </table>

</body>
</html>
```
