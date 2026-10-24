import type { Metadata } from 'next';
import '../src/styles/tokens.css';
import './globals.css';
export const metadata: Metadata = { title: 'هتل اورین تهران | اقامت، کافه و رستوران', description: 'پیش‌نمایش محلی هتل اورین تهران؛ معرفی اتاق‌ها، رستوران و مسیر دسترسی.', robots: { index:false, follow:false } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="fa" dir="rtl"><body>{children}</body></html>; }
