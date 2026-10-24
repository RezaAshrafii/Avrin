'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="notFound container"><span className="eyebrow">هتل اورین · پیش‌نمایش</span><h1>نمایش این بخش ممکن نشد</h1><p>دوباره تلاش کنید یا به صفحهٔ اصلی برگردید.</p><div className="heroButtons"><button className="button" onClick={reset}>تلاش دوباره</button><Link href="/fa" className="button buttonGhost">صفحهٔ اصلی</Link></div></main>}
