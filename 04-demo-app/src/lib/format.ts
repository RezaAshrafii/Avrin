export const money=(n:number|null)=>n==null?'برای هماهنگی با پذیرش تماس بگیرید':`${new Intl.NumberFormat('fa-IR').format(n)} تومان`;
export const digits=(s:string)=>s.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
export const normalize=(s:string)=>digits(s).replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').toLocaleLowerCase('fa');
export const slugLabel=(s:string)=>s==='restaurant'?'رستوران':s==='rooms'?'اتاق‌ها':s;
