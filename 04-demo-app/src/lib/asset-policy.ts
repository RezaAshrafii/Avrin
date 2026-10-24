export const PLACEHOLDER_SHA='7bad8283e602e2d7dd6e7252db6d9160abcab07e85bd7ec3472c13ca4363ed19';
export function allowedPhoto(p:{use_image_in_demo?:boolean;image_demo_status?:string;image_files?:string[]},exists:(p:string)=>boolean){
 return p.use_image_in_demo===true&&p.image_demo_status==='real_product_photo'&&!!p.image_files?.[0]&&exists(p.image_files[0]);
}
