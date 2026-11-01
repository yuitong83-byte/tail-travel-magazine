// Run from this public-only project: node source/build.cjs
// Edit data/itinerary.json; keep stable day/item IDs and projectId to retain local notes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'data/itinerary.json'),'utf8'));
const meta=JSON.parse(fs.readFileSync(path.join(root,'data/photo-manifest.json'),'utf8'));
let renderer=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').split('// Static magazine pages already exist')[0];
renderer=renderer.replace("const DATA=JSON.parse(document.getElementById('trip-data').textContent);",'const DATA=INPUT_DATA;').replace(/const ASSETS=JSON.parse\(document.getElementById\('asset-data'\).textContent\);[\s\S]*?const STORAGE_KEY=/,'const ASSETS=INPUT_ASSETS;\nconst STORAGE_KEY=');
const template=fs.readFileSync(path.join(__dirname,'template.html'),'utf8');
const safe=x=>JSON.stringify(x).replaceAll('<','\\u003c');
for(const [file,sample] of [['index.html',false],['nov05.html',true]]){
 const d=structuredClone(data);delete d.previewDay;if(sample)d.previewDay='2026-11-05';
 const a=Object.fromEntries(Object.entries(meta).map(([id,v])=>[id,{...v,data:v.file}]));
 const c={RESULT:null,INPUT_DATA:d,INPUT_ASSETS:a,location:{hash:''},structuredClone,Intl,Date,Object,JSON,setTimeout,clearTimeout,document:{querySelector:()=>null},localStorage:{getItem:()=>null,setItem:()=>{}}};vm.createContext(c);
 vm.runInContext(renderer+'\nRESULT=DATA.days.map((d,i)=>{dayIndex=i;return dayMarkup(d)});',c);
 const pages=c.RESULT.map((s,i)=>s.replace(/(?<![\w-])id="([^"]+)"/g,(_,id)=>`id="ssr-${i+1}-${id}"`).replace(/for="([^"]+)"/g,(_,id)=>`for="ssr-${i+1}-${id}"`)).join('');
 let out=template.replace('@@PAGES@@',pages).replace('@@DATA@@',safe(d)).replace('@@ASSETS@@',safe(meta));
 out=out.replace(/(<input class="page-radio"[^>]*id="f(\d)"[^>]*?)(?:\s+checked)?\s*>/g,(_,head,n)=>head.replace(/\s+checked/g,'')+(Number(n)===(sample?5:1)?' checked':'')+'>');
 fs.writeFileSync(path.join(root,file),out);
 console.log(file+' rebuilt; static photos + seven daily layouts.');
}
