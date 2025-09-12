import React, { useEffect, useRef, useState } from "react";
import * as StellarBase from "stellar-base";
import { Buffer } from "buffer";

// Polyfills
if (!window.Buffer) window.Buffer = Buffer;
if (!window.global) window.global = window;
if (!window.process) window.process = { env: {} };

// Aliases
const { TransactionBuilder, Networks, Operation, Asset, Keypair, Account } = StellarBase;

// ----- Constants -----
const HORIZON = "https://horizon-testnet.stellar.org";
const NETWORK = Networks.TESTNET;
const EXPLORER_TX = (h) => `https://stellar.expert/explorer/testnet/tx/${h}`;

// ----- UI atoms -----
const Box = (p)=><div style={{border:"1px solid #e5e7eb",borderRadius:12,padding:14,background:"#fff",...p.style}}>{p.children}</div>;
const Row = ({children, gap=8}) => <div style={{display:"flex",gap,flexWrap:"wrap"}}>{children}</div>;
const Col = ({children, style}) => <div style={{flex:1,minWidth:260,...style}}>{children}</div>;
const Label = ({children}) => <div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>{children}</div>;
const Input = (p)=><input {...p} style={{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:10}}/>;
const TextArea = (p)=><textarea {...p} style={{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:10,fontFamily:"monospace",fontSize:12}}/>;
const Btn=({children,onClick,disabled,kind="primary"})=>{
  const s=kind==="danger"?{background:"#e11d48",color:"#fff"}:
           kind==="ghost"?{background:"#f3f4f6"}:
           kind==="success"?{background:"#059669",color:"#fff"}:
           {background:"#4f46e5",color:"#fff"};
  return <button onClick={onClick} disabled={disabled}
    style={{...s,padding:"8px 12px",borderRadius:10,border:"none",cursor:"pointer",opacity:disabled?0.6:1}}>{children}</button>;
};
const JSONView=({data})=><pre style={{background:"#0b1020",color:"#cbd5e1",padding:10,borderRadius:10,overflow:"auto",fontSize:12}}>{data?JSON.stringify(data,null,2):""}</pre>;

// ----- LocalStorage helpers -----
const useLocalState=(k,init)=>{ const [v,setV]=useState(()=>{try{const s=localStorage.getItem(k);return s?JSON.parse(s):init}catch{return init}}); useEffect(()=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}},[k,v]); return [v,setV]; };
const getLS=(k,d=null)=>{try{const s=localStorage.getItem(k);return s?JSON.parse(s):d}catch{return d}};
const setLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};

// ----- API wrapper (base + prefix) -----
function joinPath(base, prefix, path){
  const b = base.replace(/\/+$/,'');
  const p = prefix ? ('/' + prefix.replace(/^\/+|\/+$/g,'')) : '';
  const pp = path.startsWith('/') ? path : '/' + path;
  return b + p + pp;
}
async function api(baseUrl, prefix, path, method="GET", body){
  const url = joinPath(baseUrl, prefix, path);
  const init={ method, headers:{ "Content-Type":"application/json" } };
  if (body) init.body = JSON.stringify(body);
  const r = await fetch(url, init);
  const text = await r.text();
  let json; try{ json = text? JSON.parse(text) : null }catch{ json = { raw:text } }
  if(!r.ok){
    const msg = json?.detail || json?.message || `${r.status} ${r.statusText}`;
    throw new Error(`API ${method} ${url} → ${msg}`);
  }
  return json;
}

// ----- Horizon REST (READ-ONLY) -----
async function hget(path){
  const r = await fetch(HORIZON + path);
  if(!r.ok) throw new Error(`Horizon ${path} ${r.status}`);
  return r.json();
}
async function getAccount(pub){ return hget(`/accounts/${pub}`); }
async function getBaseFee(){
  try{
    const s = await hget(`/fee_stats`);
    return Number(s?.fee_charged?.p95 || s?.max_fee?.mode || 100);
  }catch{ return 100; }
}

// ----- Crypto (AES-GCM + PBKDF2) -----
const te=new TextEncoder(), td=new TextDecoder();
const toB64=(buf)=>{const b=new Uint8Array(buf);let s="";for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s)};
const fromB64=(s)=>{const x=atob(s);const b=new Uint8Array(x.length);for(let i=0;i<x.length;i++)b[i]=x.charCodeAt(i);return b.buffer};
async function deriveKey(password,salt,it=250000){
  const m = await crypto.subtle.importKey("raw", te.encode(password), {name:"PBKDF2"}, false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:it,hash:"SHA-256"}, m, {name:"AES-GCM",length:256}, false, ["encrypt","decrypt"]);
}
async function encryptSecret(secret,password){
  const salt=crypto.getRandomValues(new Uint8Array(16)); const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await deriveKey(password,salt); const enc=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,te.encode(secret));
  return {version:1,kdf:"PBKDF2-SHA256",iter:250000,alg:"AES-GCM",salt:toB64(salt),iv:toB64(iv),enc:toB64(enc),createdAt:new Date().toISOString()};
}
async function decryptSecret(bundle,password){
  const salt=new Uint8Array(fromB64(bundle.salt)); const iv=new Uint8Array(fromB64(bundle.iv));
  const key=await deriveKey(password,salt,bundle.iter||250000);
  const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,fromB64(bundle.enc));
  return td.decode(pt);
}
const assetFromRef=({code,issuer})=>{const c=(code||"").toUpperCase(); if(c==="XLM"||!issuer) return Asset.native(); return new Asset(c,issuer)};

// ----- TX summary for modal -----
function summarizeTx(xdr){
  try{
    const tx = TransactionBuilder.fromXDR(xdr, NETWORK);
    const ops = tx.operations.map((op,i)=>{
      switch(op.type){
        case "payment": return `#${i+1} payment ${op.amount} ${op.asset.code||"XLM"} → ${op.destination}`;
        case "pathPaymentStrictSend": return `#${i+1} pathSend ${op.sendAmount} ${op.sendAsset.code||"XLM"} → min ${op.destMin} ${op.destAsset.code||"XLM"}`;
        case "pathPaymentStrictReceive": return `#${i+1} pathRecv max ${op.sendMax} ${op.sendAsset.code||"XLM"} → ${op.destAmount} ${op.destAsset.code||"XLM"}`;
        default: return `#${i+1} ${op.type}`;
      }
    });
    return ops.join("\n");
  }catch{ return "(Không đọc được XDR)" }
}

// ----- Robust balances → asset list -----
function extractAssets(payload) {
  function toArrayBalances(x) {
    if (!x) return [];
    if (Array.isArray(x)) return x;
    if (typeof x === "object" && x.balances !== undefined) {
      const b = x.balances;
      if (Array.isArray(b)) return b;
      if (b && typeof b === "object") {
        return Object.values(b).flatMap(v => Array.isArray(v) ? v : [v]);
      }
    }
    if (typeof x === "object" && x.data !== undefined) {
      const d = x.data;
      if (Array.isArray(d)) return d;
      if (d && typeof d === "object") {
        return Object.values(d).flatMap(v => Array.isArray(v) ? v : [v]);
      }
    }
    if (typeof x === "object") {
      return Object.values(x).flatMap(v => Array.isArray(v) ? v : [v]);
    }
    return [];
  }
  const arr = toArrayBalances(payload);
  const out = [];
  for (const b of arr) {
    const isNative =
      b?.asset_type === "native" ||
      (!b?.asset_code && !b?.asset_issuer && (b?.code === "XLM" || b?.type === "native"));
    const code = isNative ? "XLM" : (b?.asset_code || b?.code || b?.ticker || "XLM");
    const issuer = isNative ? "" : (b?.asset_issuer || b?.issuer || b?.issuer_address || "");
    const balance = Number(b?.balance ?? b?.amount ?? b?.free ?? 0);
    out.push({ code, issuer, balance });
  }
  const seen = new Set(); const uniq=[];
  for (const a of out){
    const k = `${a.code}|${a.issuer||""}`;
    if (seen.has(k)) continue; seen.add(k); uniq.push(a);
  }
  return uniq.sort((x,y)=> (x.code+(x.issuer||"")).localeCompare(y.code+(y.issuer||"")));
}

// ================== APP ==================
export default function App(){ return <InnerApp/> }

function InnerApp(){
  // API config
  const DEFAULT_API = import.meta.env.VITE_API_BASE || "http://localhost:8000";
  const [apiBase, setApiBase] = useLocalState("syp.apiBase", DEFAULT_API);
  const [apiPrefix, setApiPrefix] = useLocalState("syp.apiPrefix", ""); // ví dụ: "", "/api", "/chain"

  // Views
  const [view, setView] = useLocalState("syp.view", "welcome");

  // Wallet & vault
  const [currentPub, setCurrentPub] = useLocalState("syp.current.pub", "");
  const [vault, setVault] = useLocalState("syp.vault", {}); // pub -> bundle
  const currentVault = currentPub ? vault[currentPub] : null;
  const saveVault = (pub,bundle)=>{ const v={...(getLS("syp.vault",{})),[pub]:{pub,...bundle}}; setVault(v); setLS("syp.vault",v); };
  const removeVault = (pub)=>{ const v={...(getLS("syp.vault",{}))}; delete v[pub]; setVault(v); setLS("syp.vault",v); if(currentPub===pub) setCurrentPub(""); };

  // Trust state (first-time only)
  const [connected, setConnected] = useLocalState("syp.connected", false);
  const [trustedOnce, setTrustedOnce] = useLocalState("syp.trusted.once", false);

  // Unlock session
  const [unlocked,setUnlocked]=useState(false);
  const [unlockTTL,setUnlockTTL]=useLocalState("syp.unlock.ttlMin",15);
  const [autoExtend,setAutoExtend]=useLocalState("syp.unlock.extend",true);
  const [unlockUntil,setUnlockUntil]=useState(0);
  const secretRef=useRef(""); const lockTimer=useRef(null);
  const scheduleAutoLock=(ms)=>{ if(lockTimer.current) clearTimeout(lockTimer.current); lockTimer.current=setTimeout(()=>lockNow(),ms); };
  const lockNow=()=>{ secretRef.current=""; setUnlocked(false); setUnlockUntil(0); if(lockTimer.current) clearTimeout(lockTimer.current); };
  const unlockWithPassword=async(pwd)=>{
    if(!currentVault) throw new Error("Chưa có Secure Bundle");
    const sec = await decryptSecret(currentVault, pwd);
    secretRef.current=sec; setUnlocked(true);
    const ms=Math.max(1,parseInt(unlockTTL,10))*60*1000; setUnlockUntil(Date.now()+ms); scheduleAutoLock(ms);
  };
  const touchUnlock=()=>{ if(!unlocked||!autoExtend) return; const ms=Math.max(1,parseInt(unlockTTL,10))*60*1000; setUnlockUntil(Date.now()+ms); scheduleAutoLock(ms); };
  useEffect(()=>{ lockNow(); setConnected(false); },[currentPub]);

  // Create/Import flow
  const [createResp,setCreateResp]=useState(null);
  const [importMethod,setImportMethod]=useState("secret");
  const [importSecret,setImportSecret]=useState("");
  const [importMnemonic,setImportMnemonic]=useState("");
  const [importMnemonicPass,setImportMnemonicPass]=useState("");
  const [pw,setPw]=useState(""); const [pw2,setPw2]=useState(""); const pwOK = pw && pw===pw2 && pw.length>=8;

  // Balances
  const [balances,setBalances]=useState(null);
  const [assetList,setAssetList]=useState([]);
  const refreshBalances=async(pub)=>{
    if(!pub) return;
    try{
      const r = await api(apiBase, apiPrefix, `/wallet/balances?public_key=${encodeURIComponent(pub)}`);
      setBalances(r);
      setAssetList(extractAssets(r));
    }catch(e){ setBalances({error:e.message}); setAssetList([]); }
  };

  // Onboard
  const [obXdr,setObXdr]=useState(""); const [obResp,setObResp]=useState(null);
  const beginOnboard=async()=>{
    const r = await api(apiBase, apiPrefix, "/onboard/begin", "POST", { public_key: currentPub });
    setObXdr(r?.xdr||""); return r;
  };
  const completeOnboard=async(signedXdr)=>{
    const r = await api(apiBase, apiPrefix, "/onboard/complete", "POST", { public_key: currentPub, signed_xdr: signedXdr });
    setObResp(r); return r;
  };
  const submitSigned = async (signedXdr)=> api(apiBase, apiPrefix, "/tx/submit", "POST", { signed_xdr: signedXdr });

  // Modals
  const [trustOpen,setTrustOpen]=useState(false);
  const [signReq,setSignReq]=useState(null);

  // Actions
  const doCreate = async ()=>{
    try{
      const r = await api(apiBase, apiPrefix, "/wallet/create", "POST", { use_mnemonic:true, words:12, fund:true });
      setCreateResp(r);
    }catch(e){ alert(e.message); }
  };
  const doImport = async ()=>{
    try{
      let r;
      if (importMethod==="secret"){
        r = await api(apiBase, apiPrefix, "/wallet/import", "POST", { secret: importSecret, fund:true });
      } else {
        r = await api(apiBase, apiPrefix, "/wallet/import-mnemonic", "POST", { mnemonic: importMnemonic, passphrase: importMnemonicPass, account_index:0, fund:true });
      }
      setCreateResp(r);
    }catch(e){ alert(e.message); }
  };
  const confirmPassword = async ()=>{
    if (!createResp?.secret || !createResp?.public_key) return alert("Thiếu dữ liệu ví. Hãy Create/Import trước.");
    if (!pwOK) return alert("Mật khẩu chưa hợp lệ (>=8 ký tự & trùng xác nhận).");
    const bundle = await encryptSecret(createResp.secret, pw);
    saveVault(createResp.public_key, bundle);
    setCurrentPub(createResp.public_key);
    setCreateResp(null); setPw(""); setPw2("");
    setView("dashboard");
    setTimeout(()=>{ if(!trustedOnce){ setTrustOpen(true); } }, 50); // auto Trust lần đầu
    refreshBalances(createResp.public_key);
  };

  const handleTrusted = async ()=>{
    setConnected(true); setTrustOpen(false);
    if (trustedOnce) return; // chỉ onboard 1 lần
    try{
      const r = await beginOnboard();
      if (!r?.xdr) { alert("Không nhận được XDR khi onboard"); return; }
      setSignReq({
        xdr: r.xdr,
        meta: { type:"onboard", pub: currentPub },
        onDone: async (signed)=>{
          await completeOnboard(signed);
          await refreshBalances(currentPub);
          setTrustedOnce(true);
          alert("Onboard xong! (đã airdrop SYP nếu BE cấu hình)");
        }
      });
    }catch(e){ alert(e.message); }
  };

  const signWithVault = async (xdr)=>{
    if (!unlocked) throw new Error("Wallet locked — hãy Unlock trước.");
    const tx = TransactionBuilder.fromXDR(xdr, NETWORK);
    tx.sign(Keypair.fromSecret(secretRef.current));
    touchUnlock();
    return tx.toXDR();
  };

  // ----- SEND (chọn asset trong ví) -----
  const [sendDest,setSendDest]=useState("");
  const [sendAmount,setSendAmount]=useState("1");
  const [sendAssetIdx,setSendAssetIdx]=useState(0);
  const [sendRes,setSendRes]=useState(null);

  async function buildPaymentXDR(assetRef){
    if(!currentPub) throw new Error("Chưa chọn tài khoản");
    const accJson = await getAccount(currentPub);
    const fee = await getBaseFee();
    const acc = new Account(currentPub, accJson.sequence);
    const asset = assetFromRef(assetRef);
    const tx = new TransactionBuilder(acc, { fee:String(fee), networkPassphrase: NETWORK })
      .addOperation(Operation.payment({ destination: sendDest, asset, amount: sendAmount }))
      .setTimeout(180).build();
    return tx.toXDR();
  }
  const doSend=async()=>{
    if(!connected) return alert("Chưa Trust");
    if(!assetList.length) return alert("Không có tài sản để gửi");
    const a = assetList[Math.min(sendAssetIdx, assetList.length-1)];
    try{
      const xdr = await buildPaymentXDR({code:a.code, issuer:a.issuer||undefined});
      setSignReq({
        xdr,
        meta:{ type:"payment", amount: sendAmount, asset: a.code, dest: sendDest },
        onDone: async (signed)=>{
          const r = await submitSigned(signed);
          setSendRes(r); refreshBalances(currentPub);
        }
      });
    }catch(e){ alert(e.message); }
  };

  // ----- SWAP (quote từ API) -----
  const [swapTab,setSwapTab]=useState("send"); // send | receive
  const [srcIdx,setSrcIdx]=useState(0);
  const [dstMode,setDstMode]=useState("fromList"); // fromList | custom
  const [dstIdx,setDstIdx]=useState(0);
  const [dstCustom,setDstCustom]=useState({code:"USDC", issuer:""});
  const [sendAmt,setSendAmt]=useState("10");
  const [recvAmt,setRecvAmt]=useState("10");
  const [slip,setSlip]=useState(200);
  const [quote,setQuote]=useState(null);
  const [swapRes,setSwapRes]=useState(null);

  const dstList = assetList;
  function pickAssetByIdx(idx, list=assetList){
    const a = list[Math.min(Math.max(0, idx), Math.max(0, list.length-1))];
    return a ? { code:a.code, issuer:a.issuer||undefined } : { code:"XLM" };
  }
  const currentSrc = pickAssetByIdx(srcIdx);
  const currentDst = dstMode==="fromList" ? pickAssetByIdx(dstIdx, dstList) : dstCustom;

  const getQuote = async ()=>{
    if (!connected) return alert("Chưa Trust");
    let body;
    if (swapTab==="send"){
      body = { mode:"send", source_asset: currentSrc, source_amount: sendAmt, dest_asset: currentDst, max_paths:5, slippage_bps: slip };
    } else {
      body = { mode:"receive", dest_asset: currentDst, dest_amount: recvAmt, source_asset: currentSrc, max_paths:5, slippage_bps: slip };
    }
    try{
      const r = await api(apiBase, apiPrefix, "/swap/quote", "POST", body);
      setQuote(r);
    }catch(e){ alert(e.message); }
  };

  const mapPath=(path=[])=>path.map(p=>p.asset_type==="native"?Asset.native():new Asset(p.asset_code,p.asset_issuer));
  async function buildSwapXDR(){
    if(!currentPub) throw new Error("Chưa chọn tài khoản");
    if(!quote?.found) throw new Error("Chưa có quote khả dụng");
    const accJson = await getAccount(currentPub);
    const fee = await getBaseFee();
    const acc = new Account(currentPub, accJson.sequence);
    const sa = assetFromRef(currentSrc); const da = assetFromRef(currentDst); const path = mapPath(quote.raw?.path||[]);
    const tb = new TransactionBuilder(acc, { fee:String(fee), networkPassphrase: NETWORK });
    if (swapTab==="send") {
      tb.addOperation(Operation.pathPaymentStrictSend({
        sendAsset: sa,
        sendAmount: quote.source_amount,
        destination: currentPub,
        destAsset: da,
        destMin: quote.dest_min_suggest,
        path
      }));
    } else {
      tb.addOperation(Operation.pathPaymentStrictReceive({
        sendAsset: sa,
        sendMax: quote.source_max_suggest,
        destination: currentPub,
        destAsset: da,
        destAmount: quote.destination_amount,
        path
      }));
    }
    return tb.setTimeout(180).build().toXDR();
  }
  const doSwap = async ()=>{
    if(!connected) return alert("Chưa Trust");
    try{
      const xdr = await buildSwapXDR();
      setSignReq({
        xdr,
        meta:{ type:"swap", mode: swapTab },
        onDone: async (signed)=>{
          const r = await submitSigned(signed);
          setSwapRes(r); refreshBalances(currentPub);
        }
      });
    }catch(e){ alert(e.message); }
  };

  // Auto refresh balances on dashboard
  useEffect(()=>{ if(view==="dashboard"){ refreshBalances(currentPub) } },[view]);

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",padding:20}}>
      <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gap:12}}>

        {/* Config bar */}
        <Box>
          <Row>
            <Col><Label>API Base</Label><Input value={apiBase} onChange={(e)=>setApiBase(e.target.value)} placeholder="http://localhost:8000" /></Col>
            <Col><Label>API Prefix</Label><Input value={apiPrefix} onChange={(e)=>setApiPrefix(e.target.value)} placeholder="(vd) /api hoặc để trống" /></Col>
            <Col style={{display:"flex",alignItems:"end",gap:8}}>
              <Btn kind="ghost" onClick={async()=>{try{const r=await fetch(joinPath(apiBase, apiPrefix, "/healthz")); alert(r.ok?"health ok":"health fail") }catch{ alert("health unreachable")}}}>Ping</Btn>
            </Col>
          </Row>
        </Box>

        {/* Views */}
        {view==="welcome" && (
          <Box>
            <h2 style={{marginTop:0}}>Bắt đầu</h2>
            <Row>
              <Col>
                <h3>Create Wallet</h3>
                <Btn onClick={doCreate}>Create (12 từ + secret)</Btn>
                {createResp && (
                  <div style={{marginTop:8}}>
                    {createResp.mnemonic && (<><Label>Mnemonic</Label><TextArea rows={3} readOnly value={createResp.mnemonic}/></>)}
                    <Label>Public</Label><Input readOnly value={createResp.public_key}/>
                    {createResp.secret && (<><Label>Secret (sao lưu ngay)</Label><Input readOnly value={createResp.secret}/></>)}
                    <div style={{marginTop:8}}><Btn kind="success" onClick={()=>setView("setpassword")}>Tiếp tục → Đặt mật khẩu</Btn></div>
                  </div>
                )}
              </Col>
              <Col>
                <h3>Import Wallet</h3>
                <div style={{marginBottom:6}}>
                  <label><input type="radio" name="im" checked={importMethod==="secret"} onChange={()=>setImportMethod("secret")} /> Secret</label>
                  <label style={{marginLeft:12}}><input type="radio" name="im" checked={importMethod==="mnemonic"} onChange={()=>setImportMethod("mnemonic")} /> Mnemonic</label>
                </div>
                {importMethod==="secret" ? (
                  <>
                    <Label>Secret (S...)</Label>
                    <Input value={importSecret} onChange={(e)=>setImportSecret(e.target.value)} placeholder="S..."/>
                  </>
                ) : (
                  <>
                    <Label>Mnemonic</Label>
                    <TextArea rows={3} value={importMnemonic} onChange={(e)=>setImportMnemonic(e.target.value)} placeholder="12/24 từ"/>
                    <Label>Passphrase (tuỳ chọn)</Label>
                    <Input value={importMnemonicPass} onChange={(e)=>setImportMnemonicPass(e.target.value)} />
                  </>
                )}
                <div style={{marginTop:8}}>
                  <Btn kind="ghost" onClick={doImport} disabled={importMethod==="secret" ? !importSecret : !importMnemonic}>Import</Btn>
                </div>
                {createResp && (
                  <div style={{marginTop:8}}>
                    <Label>Public</Label><Input readOnly value={createResp.public_key}/>
                    {createResp.secret && (<><Label>Secret (sao lưu)</Label><Input readOnly value={createResp.secret}/></>)}
                    <div style={{marginTop:8}}><Btn kind="success" onClick={()=>setView("setpassword")}>Tiếp tục → Đặt mật khẩu</Btn></div>
                  </div>
                )}
              </Col>
            </Row>
          </Box>
        )}

        {view==="setpassword" && (
          <Box>
            <h2 style={{marginTop:0}}>Tạo & xác nhận mật khẩu ví</h2>
            <Row>
              <Col>
                <Label>Mật khẩu (>= 8 ký tự)</Label>
                <Input type="password" value={pw} onChange={(e)=>setPw(e.target.value)} />
                <Label>Xác nhận mật khẩu</Label>
                <Input type="password" value={pw2} onChange={(e)=>setPw2(e.target.value)} />
                <div style={{marginTop:8}}>
                  <Btn onClick={confirmPassword} disabled={!createResp?.secret || !pwOK}>Xác nhận & Mã hóa secret → Dashboard</Btn>
                </div>
              </Col>
              <Col>
                <Label>Thông tin đã tạo/import</Label>
                <JSONView data={createResp || {note:"Hãy Create/Import ở bước trước"}}/>
              </Col>
            </Row>
          </Box>
        )}

        {view==="dashboard" && (
          <>
            <Box>
              <h2 style={{marginTop:0}}>Dashboard</h2>
              <Row>
                <Col>
                  <Label>Public key</Label>
                  <Input value={currentPub} onChange={(e)=>setCurrentPub(e.target.value)} placeholder="G..."/>
                  <div style={{marginTop:6, fontSize:12}}>
                    Trust: {connected ? <span style={{color:"#059669"}}>Trusted</span> : <span style={{color:"#b91c1c"}}>Not trusted</span>}
                  </div>
                </Col>
                <Col style={{alignSelf:"end"}}>
                  <Row>
                    <div style={{alignSelf:"center",fontSize:13}}>Vault: {unlocked? <span style={{color:"#059669"}}>Unlocked (~{Math.max(0,Math.ceil((unlockUntil-Date.now())/60000))}m)</span> : <span style={{color:"#b91c1c"}}>Locked</span>}</div>
                    <UnlockInline onUnlock={unlockWithPassword} disabled={!currentVault} unlocked={unlocked}
                                  onLock={lockNow} onExtend={touchUnlock} />
                    <div style={{fontSize:12,alignSelf:"center"}}>
                      TTL:
                      <select style={{marginLeft:6,padding:"4px 8px"}} value={unlockTTL} onChange={(e)=>setUnlockTTL(parseInt(e.target.value,10))}>
                        <option value={5}>5m</option><option value={15}>15m</option><option value={30}>30m</option><option value={60}>60m</option>
                      </select>
                      <label style={{marginLeft:8}}>
                        <input type="checkbox" checked={autoExtend} onChange={(e)=>setAutoExtend(e.target.checked)} /> auto-extend
                      </label>
                    </div>
                  </Row>
                </Col>
              </Row>
              <Row style={{marginTop:8, gap:8}}>
                {!connected ? (
                  <Btn onClick={()=>setTrustOpen(true)}>Connect / Trust</Btn>
                ) : (
                  <div style={{fontSize:12,color:"#64748b"}}>Đã trust. (Không hiển thị re-onboard để tránh spam)</div>
                )}
                <Btn kind="ghost" onClick={()=>refreshBalances(currentPub)} disabled={!currentPub}>Refresh Balances</Btn>
                <Btn kind="danger" onClick={()=>{ if(confirm("Xóa Secure Bundle local?")) { removeVault(currentPub); }}}>Xóa bundle</Btn>
              </Row>
            </Box>

            <Box>
              <h3 style={{marginTop:0}}>Tài sản</h3>
              <JSONView data={balances}/>
            </Box>

            {/* SEND */}
            <Box>
              <h3 style={{marginTop:0}}>Send</h3>
              <Row>
                <Col>
                  <Label>Chọn tài sản</Label>
                  <select style={{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:10}}
                          value={sendAssetIdx} onChange={(e)=>setSendAssetIdx(parseInt(e.target.value,10))}>
                    {assetList.map((a,idx)=>(
                      <option key={a.code+"|"+(a.issuer||"")+idx} value={idx}>
                        {a.code}{a.issuer?`:${a.issuer.slice(0,6)}…${a.issuer.slice(-4)}`:" (XLM)"} · balance {a.balance}
                      </option>
                    ))}
                  </select>
                </Col>
                <Col><Label>Amount</Label><Input value={sendAmount} onChange={(e)=>setSendAmount(e.target.value)} /></Col>
                <Col><Label>Destination (G...)</Label><Input value={sendDest} onChange={(e)=>setSendDest(e.target.value)} /></Col>
                <Col style={{display:"flex",alignItems:"end"}}><Btn onClick={doSend} disabled={!connected || !currentPub || !sendDest || !sendAmount || !assetList.length}>Send</Btn></Col>
              </Row>
              <div style={{marginTop:8}}>
                {sendRes?.hash && <div style={{fontSize:13}}>Hash: <a href={EXPLORER_TX(sendRes.hash)} target="_blank" rel="noreferrer">{sendRes.hash}</a></div>}
                <JSONView data={sendRes}/>
              </div>
            </Box>

            {/* SWAP */}
            <Box>
              <h3 style={{marginTop:0}}>Swap</h3>
              <Row>
                <Col>
                  <Label>Chế độ</Label>
                  <select style={{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:10}} value={swapTab} onChange={(e)=>setSwapTab(e.target.value)}>
                    <option value="send">Send (bán From → mua To)</option>
                    <option value="receive">Receive (mua To với tối đa From)</option>
                  </select>
                </Col>
                <Col>
                  <Label>Slippage (bps)</Label>
                  <Input value={slip} onChange={(e)=>setSlip(parseInt(e.target.value||"0",10))}/>
                </Col>
              </Row>

              <Row>
                <Col>
                  <h4>From (source)</h4>
                  <Label>Asset</Label>
                  <select style={{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:10}}
                          value={srcIdx} onChange={(e)=>setSrcIdx(parseInt(e.target.value,10))}>
                    {assetList.map((a,idx)=>(
                      <option key={"src"+idx} value={idx}>
                        {a.code}{a.issuer?`:${a.issuer.slice(0,6)}…${a.issuer.slice(-4)}`:" (XLM)"} · bal {a.balance}
                      </option>
                    ))}
                  </select>
                  {swapTab==="send" && (<><Label>Source amount</Label><Input value={sendAmt} onChange={(e)=>setSendAmt(e.target.value)} /></>)}
                </Col>

                <Col>
                  <h4>To (destination)</h4>
                  <Label>Chọn</Label>
                  <select style={{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:10}}
                          value={dstMode} onChange={(e)=>setDstMode(e.target.value)}>
                    <option value="fromList">Từ danh sách ví</option>
                    <option value="custom">Tự nhập (code+issuer)</option>
                  </select>
                  {dstMode==="fromList" ? (
                    <>
                      <Label>Asset</Label>
                      <select style={{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:10}}
                              value={dstIdx} onChange={(e)=>setDstIdx(parseInt(e.target.value,10))}>
                        {assetList.map((a,idx)=>(
                          <option key={"dst"+idx} value={idx}>
                            {a.code}{a.issuer?`:${a.issuer.slice(0,6)}…${a.issuer.slice(-4)}`:" (XLM)"}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <Label>Code</Label><Input value={dstCustom.code} onChange={(e)=>setDstCustom({...dstCustom, code:e.target.value.toUpperCase()})}/>
                      <Label>Issuer</Label><Input value={dstCustom.issuer||""} onChange={(e)=>setDstCustom({...dstCustom, issuer:e.target.value.trim()})}/>
                    </>
                  )}
                  {swapTab==="receive" && (<><Label>Destination amount</Label><Input value={recvAmt} onChange={(e)=>setRecvAmt(e.target.value)} /></>)}
                </Col>
              </Row>

              <Row style={{marginTop:8}}>
                <Btn onClick={getQuote} disabled={!connected}>Quote</Btn>
                <Btn kind="ghost" onClick={()=>setQuote(null)}>Clear</Btn>
                <div style={{alignSelf:"center",fontSize:12,color:"#475569"}}>{quote? (quote.found? "Found route" : "No route") : "Chưa có quote"}</div>
              </Row>

              {quote && (
                <>
                  <div style={{fontSize:13, marginTop:8}}>
                    Found: {String(quote.found)} | Route: {(quote.path_assets||[]).join(" → ")||"(direct)"}
                  </div>
                  <JSONView data={quote} />
                  {quote.found && <Btn onClick={doSwap} disabled={!connected}>Execute Swap</Btn>}
                </>
              )}

              {swapRes && (
                <div style={{marginTop:8}}>
                  <Label>Kết quả</Label>
                  {swapRes.hash && <div style={{fontSize:13}}>Hash: <a href={EXPLORER_TX(swapRes.hash)} target="_blank" rel="noreferrer">{swapRes.hash}</a></div>}
                  <JSONView data={swapRes} />
                </div>
              )}
            </Box>
          </>
        )}

        <div style={{textAlign:"center",fontSize:12,color:"#64748b"}}>
          • Flow: Create/Import → Set Password → Dashboard (auto Trust lần đầu → Sign onboard) · Send chọn asset trong ví · Swap nhận quote từ API.
        </div>
      </div>

      {/* Modals */}
      {trustOpen && (
        <TrustModal pub={currentPub}
          onCancel={()=>setTrustOpen(false)}
          onTrust={handleTrusted}
        />
      )}

      {signReq && (
        <SignModal
          xdr={signReq.xdr}
          meta={signReq.meta}
          locked={!unlocked}
          tryUnlock={unlockWithPassword}   // unlock ngay trong modal
          onCancel={()=>setSignReq(null)}
          onConfirm={async()=>{
            const signed = await signWithVault(signReq.xdr); // ký (đã unlock)
            await signReq.onDone?.(signed);
            setSignReq(null);
          }}
        />
      )}
    </div>
  );
}

// ----- Inline Unlock widget -----
function UnlockInline({ onUnlock, disabled, unlocked, onLock, onExtend }){
  const [pwd,setPwd]=useState(""); const [busy,setBusy]=useState(false);
  if (unlocked) {
    return <Row><Btn kind="ghost" onClick={onExtend}>Gia hạn</Btn><Btn kind="danger" onClick={onLock}>Lock now</Btn></Row>;
  }
  const go=async()=>{ try{ setBusy(true); await onUnlock(pwd); setPwd(""); }catch(e){ alert("Unlock thất bại: "+e.message) }finally{ setBusy(false) } };
  return (
    <Row>
      <Input type="password" value={pwd} onChange={(e)=>setPwd(e.target.value)} placeholder="Mật khẩu ký" disabled={disabled||busy}/>
      <Btn onClick={go} disabled={disabled||busy||!pwd}>{busy?"Unlocking…":"Unlock"}</Btn>
    </Row>
  );
}

// ----- Trust modal -----
function TrustModal({ pub, onCancel, onTrust }){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,zIndex:50}}>
      <div style={{background:"#fff",borderRadius:12,padding:16,maxWidth:560,width:"100%",boxShadow:"0 10px 30px rgba(0,0,0,.2)"}}>
        <h3 style={{margin:"4px 0 8px",fontSize:18}}>Connect / Trust This App</h3>
        <div style={{fontSize:13,color:"#475569",marginBottom:8}}>
          Ứng dụng yêu cầu quyền sử dụng địa chỉ công khai của bạn để ký giao dịch.
        </div>
        <div style={{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:8,padding:8,marginBottom:8,fontFamily:"monospace",fontSize:12}}>
          {pub ? pub : "(chưa có public key)"}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <Btn kind="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn onClick={onTrust} disabled={!pub}>Trust</Btn>
        </div>
      </div>
    </div>
  );
}

// ----- Sign modal (unlock & sign) -----
function SignModal({ xdr, meta, locked, tryUnlock, onCancel, onConfirm }){
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const summary = summarizeTx(xdr);

  const go = async () => {
    setErr("");
    try {
      setBusy(true);
      if (locked) {
        if (!pwd) { setErr("Hãy nhập mật khẩu để ký"); setBusy(false); return; }
        await tryUnlock(pwd);      // unlock ngay trong modal
        setPwd("");
      }
      await onConfirm();            // parent sẽ ký + onDone
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,zIndex:50}}>
      <div style={{background:"#fff",borderRadius:12,padding:16,maxWidth:680,width:"100%",boxShadow:"0 10px 30px rgba(0,0,0,.2)"}}>
        <h3 style={{margin:"4px 0 8px",fontSize:18}}>Sign Transaction</h3>
        <div style={{fontSize:12,color:"#475569",marginBottom:8}}>
          Type: <b>{meta?.type||"custom"}</b>
        </div>

        <div style={{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:8,padding:8,marginBottom:8,whiteSpace:"pre-wrap",fontSize:12}}>
          {summary}
        </div>

        <details style={{marginBottom:10}}><summary style={{cursor:"pointer"}}>XDR</summary>
          <pre style={{background:"#0b1020",color:"#cbd5e1",padding:8,borderRadius:8,overflow:"auto",fontSize:11}}>{xdr}</pre>
        </details>

        {locked && (
          <div style={{marginBottom:10}}>
            <Label>Mật khẩu ký (wallet đang bị khóa)</Label>
            <input
              type="password"
              value={pwd}
              onChange={(e)=>setPwd(e.target.value)}
              placeholder="Nhập mật khẩu để unlock & ký"
              style={{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:10}}
            />
          </div>
        )}

        {err && <div style={{color:"#b91c1c",fontSize:12,marginBottom:8}}>{err}</div>}

        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <Btn kind="ghost" onClick={onCancel} disabled={busy}>Reject</Btn>
          <Btn onClick={go} disabled={busy}>{busy ? "Signing…" : "Confirm & Sign"}</Btn>
        </div>
      </div>
    </div>
  );
}
