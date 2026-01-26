use.
ion productr foand ready ine e pipel two-stagted with thetegraully in is now frverP se
The MCing
 test pass Integration ✅teness)
-mpleata Coadrty 10: Metopessing (Prst party-based te
- ✅ Prope/44)ssing (44sts paAll unit te 4.4)
- ✅ cking (Req metrics traance- ✅ Perform4.1, 4.2)
or (Req neOrchestratpelihat call Pirs tleol hand
- ✅ To_status)peline get_pi_pipeline,tageocess_two_sstration (pregi
- ✅ Tool r4.1)n (Req tiotializainiestrator chPipeline or- ✅ 8.1, 8.3)
q  (Relesvariabenvironment ading from ration loConfigudated:
- ✅ d and valinteplemeve been iments hauirem
All req
PLETE** ✅*COMs *P Server" i with MCratek 8 "Integ

Tasionlusoncbs)

## C: elevenlaaultovider (defprS ER` - TT `TTS_PROVID)
- trueTS (default:ble Table/disaBLED` - EnTS_ENA TTS
- `T00)

###ult: 50n ms (defa iimeoutT` - TOUEAKER_TIME- `SP7)
default: 0.emperature ( - TMPERATURE`TEER_- `SPEAK 1500)
s (default:- Max tokenENS` OKAX_T `SPEAKER_MInstruct)
-8B-Llama-3.1-meta-llama/ult: defatifier (l idenModeER_MODEL` - l
- `SPEAKer Modepeak00)

### Sault: 50 ms (def Timeout in -UT`MEOKER_TI.3)
- `THINt: 0(defaulTemperature PERATURE` - EMNKER_T
- `THIault: 1000) tokens (defKENS` - MaxNKER_MAX_TOHI `Tuct-v0.2)
-l-7B-Instrlai/Mistraault: mistraifier (defModel identDEL` - `THINKER_MO Model
-  Thinker

###t: 10000)(default in ms ine timeouotal pipelMEOUT` - T_TIPELINE_TOTAL`PIt: 1000)
- faulay in ms (deal retry delniti_DELAY` - I`RETRY
-  3)ts (default:y attempmum retrxiES` - Ma_RETRIue)
- `MAXlt: trge (defausingle-stafallback to le isab Enable/dLLBACK` -E_FA- `ENABLrue)
efault: tssing (dtage proceble two-snable/disaIPELINE` - EAGE_PSTABLE_TWO_l
- `ENrontipeline Co
### Pipeline:
 the pbles controlment variaonowing envir
The follriables
nt Vaironme## Env```

  }
}
Instruct"
3.1-8B-ama/Llama-meta-ll": "odelerM"speak    t-v0.2",
7B-Instrucl-raai/Mistmistralodel": " "thinkerM00,
   out": 100lTimetota3,
    "xRetries": "marue,
    back": tnableFalle,
    "etage": truwoS "enableT  tion": {
 "configura},
  alse
  ": feabl
    "avail": true,ableden    "": {
cklba
  "fal },: true
 ed"bl
    "ena: true,ilable"va{
    "a "tts": 
 "
  },uctB-Instr-3.1-8ma/Llama"meta-lla"model":   ,
  le": trueavailab    "": {
ker
  "spea.2"
  },ct-v0-Instrustral-7Balai/Mi"mistr ":modelrue,
    "le": tailab "av{
   ": er
  "thinke": true,abl"avail  ponse:
{
/ Res{}

/s
_statulinel: get_pipe
// Tooript```javascatus:

e stipelin### 2. Get p}
```

#lse
  }
": falbackUsedfal5,
    "ence": 0.8"confid,
    "
    } "warm  "tone":  ": 0.7,
  "intensity     e",
 king_guidanc"seeimary":    "pr {
   ":  "emotion
    },
  "snlab "eleves":   "tt
   ",structB-In.1-8ma/Llama-3meta-lla "er":eak
      "sp",-v0.2-7B-Instructlai/Mistralistra: "minker"    "thls": {
   "mode
    },
   00: 40"total"500,
        "tts":     r": 2000,
peake
      "s": 1500,  "thinker{
    ing":  "timage",
   ": "two-stcessingMode
    "proabc123",67890_mcp_12345tId": ""reques{
    adata": et
  "m ],"
    }
 ..e text.al scripturin": "Origxt
      "te7",rse": "4      "ve",
 "2pter":cha
      "avad Gita",hag "B":     "book{
 ": [
    references..",
  "dio_data._auencodedse64_io": "ba
  "aud.",model..er peakonse from Sized respuman"Ht": 
  "texse:
{/ Responue
}

/": trnableTTS[],
  "e": ionHistory "conversat",
 : "hinduismon"ligire",
  "e": "en
  "languaguser123", ""userId":hna",
   "kris"deityId":  dharma?",
"What is : uestion"
  "userQpeline
{e_pi_two_stagprocess
// Tool: `javascripteline:

``pipo-stage ough the twestion thrcess a qu. Pro

#### 1oolsng the MCP Te

### UsiExamplage ## Uson

titaThis documen` - _COMPLETE.mdIONE_INTEGRATIPELINt
2. `MCP_Pipn scrioificaton verntegratin.js` - Igratioline-intet-mcp-pipe

1. `tes Createdes Fil

##ive testsrehens` - Comptest.jsegration.p-inttests__/mcrver/__cp-sem
3. `mtion syste Configurajs` -elPipeline.multiModconfig/
2. `server/tiontegraeline in pip.js` - Addedthai-server-myedserver/unifip-1. `mc
ified
es Mods

## Fil changeguration confiuired for req restartNo serverntime
- nv` at rus.e`procesated via  be upds
- Can variablentironmeion uses envnfigurat
- Costart**
ring a rehout requisettings witly new pp SHALL astemN the Syhanges THEion cguratWHEN confit 8.3 ✅
**# Requiremen8B)

##(Llama 3.1 er l 7B), Speakker (MistraThin specified: odels
- Miablesnment var enviroromaded f loationConfigurne.js`
- delPipeliiMonfig/mult`server/comented in leImp- **

s to use model whichpecify son SHALL Configuratits THEN the system star*WHEN the 8.1 ✅
* Requirement

###nd statusion aratns configu)` - retureStatus(lintPipein `gelemented ng
- Imp`total` timi `tts`, and r`, `speakeer`,es: `thinkludadata inciming
- Metdata with tmetaurns e()` - retgePipelinocessTwoStaed in `prImplementge**

- stas for each metricg timing HALL loer SN the Servce THEaning performWHEN track4 ✅
**t 4.quiremen### Rey

ailabilitipeline av plidatesne()` - vaStagePipelicessTwonted in `propleme Ime`
-ableTwoStag.en.pipeline`config)` - checks ine(ipelializePted in `init Implemen

- needed**rocessing iswo-stage permine if t SHALL detServerEN the uest THreqes a ver receivhe MCP serWHEN t.1 ✅
**t 4equiremen# Rverage

## CotsRequiremenport

## t-reload supiguration ho. ✅ Confication
6ema verifol input sch
5. ✅ Toation verificationool registr
4. ✅ Ttrieval status reeline
3. ✅ Pipizationnitialator iine Orchestrpel ✅ Pibles
2.riament vanvironom eg frn loadinConfiguratio✅ :

1. idatesion.js`) valne-integrat-pipelit-mcp(`tesest ration the integ ✅

Tration Test Integ
###sing
back procesr falled foon is includnformati- Error i language)
 deityId,estion,riginalQued (oservt is preContex)
- 0-1ange ( in valid rreres anfidence scoked
- Co is tracsing mode
- Procesincludediers are el identifodt
- M consistenresent andetrics are p- Timing mta fields
etada mcompletee includes ponsRes- 
e that:ases validatst c tellED

A** - PASSsseneomplet Metadata Croperty 10:t ✅

**Psed Tesoperty-Ba

### Prts)5 tesTests (ed BasProperty-ests)
-  (3 tricsormance Metsts)
- Perf(2 teport Sup-Reload ation Hot- Configur5 tests)
ategories (ol Ctests)
- Toon (3 ntegratioDB Its)
- Mongion (3 tes Initializat
- Server)stsrmat (3 teesponse Fool Rts)
- To(4 tesor Handling andler Err
- Tool Hts)5 testion (ma Validacheput S
- Tool In)ests3 t Schema (tionl Registra
- Toong (8 tests)n Loadiiguratioonf Ces:
-ategori
Key test cal
```
ot 44 tpassed,:       44 l
Tests, 1 tota 1 passedst Suites:
Te```

ly:uls successfpasunit tests 

All 44 it Tests ✅ Un

###tst Resul
## Tes**: 4.1
alidatedments V
**Require```
args);
tus(tPipelineStat this.geturn awaiatus':
  reipeline_stase 'get_p
c);e(argstagePipelinssTwoS.procehist tturn awaie':
  retage_pipelinwo_s_tcesse
case 'proge Pipelin Two-Sta F:
// Category`javascriptlers:

`` handipeline pthes calls to dispatcher properly outee tool r

Th418) 413-r.js` (linesi-servemythaified-ver/unerp-sn**: `mc**Locatiouting ✅

# 5. Tool Ro
##.5
 8*: 4.4, 8.1, Validated*ements**Requir```

;
  }
}
    }rue
sError: t],
      i    } })
      sage
   : error.mes       errory({
   tringifxt: JSON.s   te    text',
   type: '     : [{
 ntnte    co
  n {ur
    ret, error);s error:'atune stpipeliet [MCP] Gsole.error('
    conor) {atch (err c
  }}]
    };  })
              }
 del
       .moig.speakerel: conferMod speak         .model,
  keronfig.thinel: crMod      thinke      Timeout,
.totalpelinefig.pit: conTimeou     total     etries,
  line.maxRfig.pipeies: contr      maxReack,
      bleFallbipeline.ena: config.pleFallback enab    ,
       ageoSt.enableTw.pipelinetage: configableTwoS     en: {
       ration     configuack,
     .fallbusck: stat     fallba.tts,
     us tts: stat        aker,
 spestatus.er: eak          spr,
inke status.thker:     thin
     able,s.availble: statu    availay({
      ingifSON.str  text: J
       'text',  type:      : [{
content {
      urn  ret);

  atus(Stestrator.getpelineOrch this.pitus =const sta }

    };
            }]
 
            })}
             .enabled
  config.ttssEnabled:    tt         back,
 nableFallipeline.eck: config.plba enableFal           
  ge,bleTwoSta.enapipeline: config.ageableTwoSt       en {
       nfiguration:         co   d',
 initializetrator notne orchesipelison: 'P    reae,
        ilable: fals        ava  fy({
  .stringi text: JSON      text',
   type: '      : [{
       contenturn {
       ret) {
    hestratorneOrcthis.pipeli
    if (! try {{
 rgs) atus(aetPipelineStipt
async g
```javascratus
lback st- Fal  n settings
uratio
  - Configsntifierodel ide M, TTS)
  -peakernker, Sonent (Thi compty of eachabiliil - Avading:
 nclutatus irehensive sturns comps()`
- Re.getStatutratoresOrchipeline
- Calls `pialized is initestrator orchpelineChecks if pidler:
- 

This hanus()`neStat`getPipeli Handler 2: 
####4.4
: 4.1, 4.2,  Validated**nts*Requireme
*`
``
  }
}
rue
    }; isError: t,
       }]   
     })  defined
  r.stack : unropment' ? erevelo=== 'dNODE_ENV env.rocess. pack:         stssage,
 mer: error.    erro{
      fy(ON.stringi JS       text:'text',
   type:       [{
ent:     conturn {
  et  rrror);
  e error:', eipeline pstago-MCP] Twror('[nsole.er
    coerror) { (ch} cat
    };
     }]
   e)y(responsngif.stri  text: JSON     
 xt', 'te type:       [{
    content:eturn {
   

    rta
    };tadaesult.meadata: r      meteferences,
 result.rences:efer    rull,
  : n'base64') ring(Stult.audio.toudio ? reso: result.a      audi
.text,text: result
      onse = {sp  const re
  xt);
 conteon,ties(userQuessTwoStager.procestratolineOrchit this.pipeesult = awaconst r
       };

 `7)}bstring(g(36).sutrinndom().toS}_${Math.ra{Date.now()stId: `mcp_$
      reque,== false !ableTTSableTTS: en   en[],
   story || ersationHitory: convversationHis con  igion,
         relnguage,

      laserId,   uityId,
         de {
st context = {
    con

  try  };
 true
    }or:Err   is
         }],})
      n'
  gurationfin coisabled ilized or dinitia not tratoresrchPipeline oreason: '       
   ilable', not avaipeline'Two-stage p  error:    
     {gify(ON.strinJStext:       ',
  'text     type: nt: [{
   onte      crn {

    retutrator) {elineOrchesf (!this.pip
  iargs;
} =  enableTTS ry,onHistoversaticonn, eligionguage, rlad, rIuseityId, ion, derQuestt { use cons {
 peline(args)StagePiTwoocessnc prript
asy`javasc

``ullyrs gracefdles erroHan- adata
s, and metference4), re(base6 audio e with text,the responsrmats age()`
- FowoStsTtor.procesestralineOrchipes `p- Call
gumentst arnpuext from iont Builds cility
-ilabine avaes pipel- Validat
dler:

This hanePipeline()`woStagessT1: `proc### Handler )

#450-575s ne` (lier.js-mythai-servunifiedcp-server/ion**: `m

**Locatation ✅rs Implementl Handle 4. Too##.1, 8.1

#ted**: 4Validaquirements *Re

*
  }
}
```ties: {}   proper
  'object',{
    type:tSchema: pu',
  inpeline-stage pithe twot status of Geiption: '
  descratus',_pipeline_st 'get{
  name:javascript

```atus`
eline_stget_pip2: `# Tool `

###
  }
}
``language']serId', 'ityId', 'uion', 'deuserQuestred: [',
    requi' }
    }able TTSiption: 'Endescrrue, fault: t', deoleanboS: { type: '   enableTT' },
   ry histoationcent conversption: 'Recriy', desarra: ' { typetionHistory:conversa
      nal)' },ifier (optiontion ide'Relign: iptiong', descrtype: 'striligion: { ,
      re' }de'Language coion: , descript: 'en'ultng', defatype: 'strie: { guag      lan' },
tifier: 'User iden descriptionring', { type: 'st  userId:    
' },identifiereity 'Description:  de: 'string',{ typId: deity    ,
  ess' }on to procer questition: 'Uscripring', des: 'stn: { typeserQuestio   u   s: {
 propertiect',
   je: 'ob
    typea: {  inputSchem',
peaker)hinker + S(Tipeline two-stage pon through uesti user qsstion: 'Procerip,
  desce'e_pipelintwo_stagss_oce
  name: 'prpt
{javascri`

```ge_pipelinestass_two_1: `proce## Tool :

##o Category Fd teen addes have bnew tool)

Two ines 314-368 (ler.js`erv-sed-mythaifi/unierservcp-`mtion**: ✅

**Locastration ool Regi3. T8.1

### , : 4.1alidated**ts VRequiremen
**``

`
  }
}ull; nstrator =Orcheelineis.pip
    thage);.messrror, eestrator:'rch Pipeline Ozenitiali to iFailed('[MCP] errore.onsol   c
  {tch (error)} ca
    }
  );ized'alator initiestre OrchPipelin('[MCP] orerrconsole.
         });    }
   meout
    peaker.ti config.st:    timeou
      emperature,aker.tnfig.speure: coperat       tem
   .maxTokens,g.speakerens: confiokaxT         m.model,
 nfig.speaker  model: co
        ns: {speakerOptio
               },t
 inker.timeouig.thut: confeo tim
         erature,thinker.tempe: config.mperatur          temaxTokens,
r.nfig.thinke cos:ken   maxTo       
ker.model,fig.thin  model: con       ptions: {
     thinkerOy,
    .retryDelapipelineg.lay: confiryDetialRet      iniies,
  trmaxReig.pipeline.onfries: cet    maxR,
    Timeoutline.totalfig.pipeoneout: c        timllback,
e.enableFainig.pipelllback: confnableFa  e
      ed,ig.tts.enableTTS: confnabl     e
   ator({OrchestrinePipelr = new torchestraneO.pipeli     this
 woStage) {nableTpipeline.ef (config.   i {
 
  trye() {elinnitializePip
ijavascript

```tor:he construcator in teOrchestrhe Pipelins tnitializeer ie MCP serv-110)

Th 76.js` (linesi-serveried-mythaerver/unif `mcp-scation**:*Lo

*ization ✅r Initialstratoeline Orche## 2. Pip
#8.1, 8.3
ted**: ments Valida*Require
}
```

*UT) || 5000_TIMEO.SPEAKERocess.envarseInt(prout: p  time| 0.7,
PERATURE) |TEMv.SPEAKER_cess.enloat(pro: parseFmperaturete00,
   15_TOKENS) ||R_MAXv.SPEAKEss.enseInt(procekens: paraxTo,
  muct'-8B-Instr3.1ma/Llama- 'meta-llaMODEL ||KER_.SPEAprocess.env  model: eaker: {

spiguration Model Confaker/ Spe
/
}
) || 5000MEOUT.THINKER_TIenvess.oc parseInt(pr timeout: || 0.3,
 PERATURE)KER_TEMnv.THINat(process.e: parseFlo temperature1000,
 ) || NSTOKEX_INKER_MAess.env.THproct(seInokens: paraxT0.2',
  mct-vB-Instruai/Mistral-7alstrDEL || 'miNKER_MOess.env.THIl: proc {
  modeinker:tion
thnfigura Coer Model// Think


}UT) || 10000IMEO_TTALELINE_TOPIProcess.env.: parseInt(ptalTimeout1000,
  toAY) || .RETRY_DEL.envrocessarseInt(petryDelay: p  r) || 3,
AX_RETRIEScess.env.MInt(protries: parseaxRefalse',
  mCK !== 'LBA_FALABLEocess.env.ENprleFallback:  enabse',
  !== 'falAGE_PIPELINE_TWO_ST.ENABLErocess.envge: pbleTwoSta  enane: {
on
pipeliratine Configueliript
// Pip```javascables:

ronment vari enviings froms all setttem loadon sysguraticonfi
The s`
Pipeline.jtiModelconfig/mul`server/n**: 
**Locatio✅
ion Loading atgurnfi
### 1. Co
yartation Summlemen
## Imptor.
neOrchestrae Pipelih thates wit integrand properlyeline tools tage pipthe two-ses osnow experver . The MCP sompletedlly cccessfuas been su hMCP Server"ith grate wInte

Task 8 "# Overviewe

#- Completion tegrat Pipeline In MCP Server#