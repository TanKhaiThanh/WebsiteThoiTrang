<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Khôi phục mật khẩu - ASMAW</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1a1a1a; margin: 0; font-family: serif; font-size: 28px;">ASMAW</h1>
            <p style="color: #666; margin-top: 5px;">Hệ thống thời trang trực tuyến</p>
        </div>
        
        <h2 style="color: #333; font-size: 20px;">Xin chào {{ $name }},</h2>
        <p style="color: #555; line-height: 1.6;">
            Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản tại hệ thống của chúng tôi. Dưới đây là mã OTP (Mật khẩu một lần) của bạn:
        </p>

        <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; padding: 15px 30px; background-color: #f8f9fa; border: 2px dashed #000; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; border-radius: 8px;">
                {{ $otp }}
            </span>
        </div>

        <p style="color: #555; line-height: 1.6;">
            Mã OTP này sẽ hết hạn trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này với bất kỳ ai để đảm bảo an toàn cho tài khoản của bạn.
        </p>
        <p style="color: #555; line-height: 1.6;">
            Nếu bạn không hề yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 13px; text-align: center;">
            &copy; {{ date('Y') }} ASMAW Fashion. All rights reserved.
        </p>
    </div>
</body>
</html>
