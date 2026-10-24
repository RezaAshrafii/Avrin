import DemoPage from '@/components/DemoPage';
import { notFound } from 'next/navigation';
import { site } from '@/data/site';
export default async function Page({params,searchParams}:{params:Promise<{slug?:string[]}>,searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const p=await params; const q=await searchParams; const path=p.slug||[]; const flat=path.join('/');
 const known=['','rooms','book','book/confirmation','restaurant','restaurant/menu','restaurant/cart','restaurant/order-preview','gallery','about','facilities','contact','faq','policy','privacy','blog'];
 if(!known.includes(flat)&&!(path.length===2&&path[0]==='rooms'&&site.rooms.some(r=>r.slug===path[1])))notFound();
 return <DemoPage route={'/fa'+(path.length?'/'+flat:'')} query={Object.fromEntries(Object.entries(q).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]))}/>;
}
