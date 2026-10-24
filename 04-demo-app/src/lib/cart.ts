export type CartLine={id:number;quantity:number};
export function sanitizeLines(value:unknown,allowedIds:Set<number>):CartLine[]{
 if(!Array.isArray(value))return [];
 const map=new Map<number,number>();
 for(const row of value){if(!row||typeof row!=='object')continue;const x=row as {id?:unknown;quantity?:unknown};const id=Number(x.id),q=Number(x.quantity);if(!Number.isSafeInteger(id)||!allowedIds.has(id)||!Number.isSafeInteger(q)||q<1)continue;map.set(id,Math.min(20,(map.get(id)||0)+q));}
 return [...map].map(([id,quantity])=>({id,quantity}));
}
export function cartTotal(lines:CartLine[],priceById:Map<number,number>){return lines.reduce((sum,line)=>sum+(priceById.get(line.id)||0)*line.quantity,0);}
