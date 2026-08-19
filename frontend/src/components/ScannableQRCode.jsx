import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Authentic, Genuinely Scannable QR Code Component using qrcode.react
 * Encodes real URLs / Patient Emergency Passport Data
 */
export default function ScannableQRCode({ value = 'https://vaultcare.ai/emergency/PAT-98421', size = 120 }) {
  return (
    <div className="bg-white p-2.5 rounded-2xl border border-[#E5E0D5] shadow-xs inline-flex items-center justify-center flex-shrink-0 select-none">
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#FFFFFF"
        fgColor="#000000"
        level="H"
        includeMargin={true}
      />
    </div>
  );
}
