# AI Company Framework

> **Company Is a Word.**
>
> 涓€涓湡瀹炲彲瀹夎鐨?DeepSeek Harness `dsh.bundle`锛?*涓€娆′笅杞姐€佷竴娆″畨瑁?*鍗冲彲鑾峰緱澶?Agent 鍏徃 Skills銆佸伐浣滄祦妯℃澘銆丄gentTeams 杩愯鏃朵笌娲诲姩闈㈡澘銆佸憳宸ヤ晶杈规爮锛屼互鍙婂甫瀹樻柟鎺ュ叆鍚戝鐨勯涔︽満鍣ㄤ汉妗ャ€?
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v0.3.10-blue)](RELEASE_NOTES.md)

[English](README.md) | [绠€浣撲腑鏂嘳(README.zh-CN.md)

## Bundle 鍖呭惈浠€涔堬紙v0.3.0锛?
- **14 涓墎骞?Skills**锛歚company-boss`銆乣company-pipeline`銆乣company-role-template` 鍜?11 涓矖浣?Skills銆?- **7 涓伐浣滄祦妯℃澘**锛坄core/templates/`锛夈€?- **AgentTeams 杩愯鏃?+ Web 娲诲姩闈㈡澘**锛氫互渚濊禆 `@nanmicoder/dsh-agent-teams@0.1.10`锛圡IT锛夋墦鍖咃紝骞剁敱鏈寘 patch 鎸傝浇涓虹嫭绔?Cordis row銆傚洟闃熷垱寤恒€佹垚鍛樹細璇濄€佷緷璧栦换鍔′笌娲诲姩鏍戝紑绠卞嵆鐢紝鏃犻渶棰濆瀹夎銆?- **鍛樺伐渚ц竟鏍忥紙host + Web UI锛?*锛歚plugins/sidebar/` + 澶嶅悎 `client.js`鈥斺€斿崟鍛樺伐鏃犳崯妯″瀷鏀归厤銆佸疄鏃朵細璇?宸ュ叿璋冪敤鏌ョ湅銆佸彂娑堟伅銆傛敹缂栬嚜鑾锋巿鏉冪殑鏈湴渚ф爮鍖咃紙瑙?`NOTICE.md`锛夈€?- **椋炰功鏈哄櫒浜烘ˉ锛坔ost + Web UI锛?*锛歚plugins/feishu/lib/` + 澶嶅悎 `client.js`鈥斺€斿畼鏂?registerApp 鎵爜 onboarding銆丏PAPI 鍑嵁銆丯 鏉￠暱杩炴帴銆佺簿鍑嗚矾鐢变笌 `feishu_*` 宸ュ叿銆傛敹缂栬嚜鑾锋巿鏉冪殑鏈湴 `dsh-feishu-bridge@0.3.1` 骞舵洿鍚?`ai-company-framework-feishu`锛堣 `NOTICE.md`锛夈€?- 鍘熺敓 Bundle 鍏ュ彛 `index.js`銆佸鍚堝鎴风 bundle `client.js`銆佸弻 row Cordis patch `cordis.patch.yml`銆?- 涓嶅寘鍚?RAG 鎴栧悜閲忔绱緷璧栥€?
Bundle 閫氳繃瀹樻柟 `@deepseek-ai/dsh-skill-filesystem` provider 鎸傝浇鍖呭唴 Skill 鏍圭洰褰曪紝涓嶄細鎶婃枃浠跺鍒惰繘鐢ㄦ埛鑷繁鐨?Skills 鐩綍銆?
## 鍝簺姝ラ蹇呴』浜哄伐锛堜笉鍋氳嚜鍔ㄥ寲锛屽睘璁捐锛?
- **妯″瀷鎻愪緵鏂?*锛氫細璇濊繍琛屽墠锛岄渶鍦ㄥ涓昏缃腑閰嶇疆浣犺嚜宸辩殑 provider API Key銆?- **椋炰功鎺堟潈**锛氶娆′娇鐢ㄩ涔︿細鎵撳紑瀹樻柟 `registerApp` 纭閾炬帴/浜岀淮鐮佲€斺€旀壂鐮併€佺鐞嗗憳瀹℃壒銆佹満鍣ㄤ汉鍏ョ兢閮藉湪椋炰功瀹樻柟椤甸潰瀹屾垚銆傛巿鏉冨墠 Bundle 缁濅笉瀛樺偍 App Secret锛堜粎缁?Windows DPAPI銆丆urrentUser 浣滅敤鍩熸湰鍦板姞瀵嗭級锛屼笖**鍙湁鐪熷疄 WebSocket 寤虹珛鍚庢墠鎶?connected**銆?- **宸ヤ綔鍖洪€夋嫨**锛氭柊寤轰細璇濋渶瑕?DSH Desktop 鍘熺敓鐩綍閫夋嫨妗ャ€?- **鍙戝竷**锛氭湰浠撳簱涓嶅湪鏈粡鏄庣‘浜哄伐纭鐨勬儏鍐典笅鍙戝竷 npm 鍖呫€佸垱寤?GitHub Release銆佹帹閫佸垎鏀垨鎻愪氦澶栭儴 PR銆?
## 鑳藉姏杈圭晫

- 妯″瀷銆佸伐鍏枫€佷細璇濄€丼kills 鍜?Bundle 杩愯鏃剁敱 DeepSeek Harness 鎻愪緵銆?- AgentTeams 鎵ц銆佹椿鍔ㄩ潰鏉裤€佸憳宸ヤ晶杈规爮涓庨涔︽爮**鐢辨湰 Bundle 瀹炵幇**锛堜緷璧栨垨鏀剁紪浠ｇ爜锛夛紝瀹夎鍗宠嚜鍔ㄦ縺娲伙紝鏃犻渶鍙﹁鎻掍欢銆?- 椋炰功鎺堟潈鏄汉宸ラ椄闂紱staging 鑳藉姏锛坆ridge 0.4.0 澶氬矖浣嶈櫄鎷熻矾鐢便€佺绾块噸鎶曪級鏈寘涓嶅绉扮ǔ瀹氥€?- 璇氬疄鐘舵€佸師鍒欙細鏈畨瑁?鏈巿鏉?绂荤嚎涓€寰嬪瀹炲睍绀哄苟缁欏紩瀵硷紝缁濅笉璋庢姤灏辩华鎴?connected銆?
## 瀹夎

璇烽€夋嫨瀹為檯浣跨敤鐨?Harness profile锛涗互涓嬩粎浠?`web` 涓轰緥銆?
```powershell
# npm 鍖呭彂甯冨悗
dsh plugin --profile web add ai-company-framework

# 鎴栫洿鎺ュ畨瑁呭寘鏂囦欢
dsh plugin --profile web add .\ai-company-framework-0.3.0.tgz
```

浠庡皻鏈彂甯冪殑浠撳簱 checkout 瀹夎锛?
```powershell
npm pack
dsh plugin --profile web add .\ai-company-framework-0.3.0.tgz
```

> 璇蜂粠**鎵撳寘濂界殑 `.tgz` 鎴?registry 渚濊禆**瀹夎锛屼笉瑕佷粠婧愮爜鐩綍鐩存帴 `add`锛歚dsh plugin add <鐩綍>` 浼氳褰曚负 `link:` 渚濊禆锛屽叾鑷韩渚濊禆涓嶄細琚畨瑁呫€?
瀹夎鍚庢柊寤轰竴涓?Harness 浼氳瘽锛屼娇鏂颁細璇濊幏寰楁洿鏂板悗鐨?Skill 鐩綍銆佸苟璁?Web UI 鎸傝浇娲诲姩闈㈡澘/鍛樺伐渚ф爮/椋炰功鏍忥紝鐒跺悗鐩存帴鎻忚堪鍏徃鎴栧伐浣滄祦鐩爣锛?
> 銆屾惌涓€鏉＄數鍟嗗唴瀹规祦姘寸嚎锛氳皟鐮斻€佸啓浣溿€佽川妫€銆佸畾鍚戣繑宸ャ€佷氦浠樸€傘€?
## 鍗歌浇

```powershell
dsh plugin --profile web remove ai-company-framework
```

鍘熺敓鍗歌浇浼氱Щ闄?profile 渚濊禆銆丅undle layer 涓庡寘鐩綍锛堝惈瀛ゅ効浼犻€掍緷璧栵級銆傛湰鍖呬粠涓嶅悜鐢ㄦ埛 Skill 鏍圭洰褰曞鍒舵枃浠讹紝鍥犳涓嶄細鐮村潖宸叉湁鐢ㄦ埛 Skills銆備綘鑷繁鐨勬暟鎹€斺€斿叕鍙稿洟闃熴€侀涔﹀嚟鎹?娉ㄥ唽琛ㄣ€佹棩蹇椻€斺€旀寜璁捐淇濈暀锛堥厤缃洖婊?鈮?鏁版嵁娓呴櫎锛夈€?
## 楠岃瘉

褰撳墠鍊欓€夌増鏈凡鍦?DSH Desktop 鍐呯疆 `@deepseek-ai/dsh 0.1.0-rc.8` 涓婇獙璇併€傚畠鏄疄娴嬪熀绾匡紝涓嶆槸鑷畾涔?`minFrameworkVersion` 鍗忚銆?
```powershell
node tests\bundle-check.mjs
node tests\client-feishu-check.mjs
powershell -ExecutionPolicy Bypass -File tests\smoke.ps1
powershell -ExecutionPolicy Bypass -File scripts\security-scan.ps1

# 鐪熷疄闅旂 pack/install/load/uninstall
powershell -ExecutionPolicy Bypass -File tests\install-bundle.ps1 `
  -DshBin '<@deepseek-ai\dsh\lib\bin.js 鐨勮矾寰?'
```

闅旂楠屾敹锛圥3/P4/P6锛屽彲澶嶇幇锛夛細鍏ㄦ柊涓存椂 `DSH_HOME` + 鏂?profile + 鐪熷疄 `.tgz`鈥斺€斿弻 row 缁勫悎锛坄ai-company-framework` + `agent-teams`锛夈€?4 Skills 缁忓凡瀹夎 provider 閫愪釜浣撴銆乣feishu_*` 宸ュ叿娉ㄥ唽銆亀eb profile 鐪熷疄鍚姩涓?`window.__DSH_BOOT__` 鍚弻 client bundle銆佷晶鏍?state/reconfigure 璺敱銆侀涔︽湭鎺堟潈鎬侊紙0 bots銆? connected锛夈€佸嵏杞介浂娈嬬暀涓旂敤鎴?Skill 鍝ㄥ叺鍝堝笇涓嶅彉銆備緵搴旈摼锛?4 鍖呴棴鍖?0 缂哄け璁稿彲銆乣pnpm audit --prod` 鏃犳紡娲炪€佷笉渚濊禆 unscoped `dsh-feishu-bridge`銆?
> 瀹夎鏈?pnpm 鍙兘鍑虹幇 "peers missing" 鍛婅锛欴SH profile 浠?`autoInstallPeers:false` 杩愯锛宍@deepseek-ai/cordis` 涓庡悇 `@deepseek-ai/dsh-*` peer 鐢卞涓婚棴鍖呭湪杩愯鏃惰В鏋愩€傝繖鏄鏈熻涓猴紝涓嶆槸瀹夎澶辫触銆?
## 鍖呭唴绋冲畾璧勬簮璺緞

浠?`core/skills/*.md` 鍑哄彂锛?
- 妯℃澘锛歚../templates/`
- 椋炰功 SOP锛歚../feishu-onboarding-sop.md`

provider 浣跨敤 `import.meta.url` 瑙ｆ瀽鍖呮牴锛屼笉渚濊禆 checkout 璺緞銆乄indows 鐢ㄦ埛鍚嶆垨褰撳墠 Session ID銆?
## 鏃ф墜宸ヨ剼鏈?
`scripts/install.ps1` 浠呬负鏃х増鎵嬪伐澶嶅埗娴佺▼淇濈暀锛屼笉杩涘叆 npm 鍖呫€傛寮?Bundle 璺緞鏄?`dsh plugin --profile <name> add <package-or-source>`銆?
## 杩愯鎴浘

![鏋舵瀯鍥綸(assets/architecture.svg)

| AgentTeams 娲诲姩 | 鍛樺伐渚ц竟鏍?|
|---|---|
| ![AgentTeams 娲诲姩](assets/screenshots/agentteams-activity.png) | ![鍛樺伐渚ц竟鏍廬(assets/screenshots/employee-sidebar.png) |

![鍏徃宸ヤ綔娴乚(assets/screenshots/company-created.png)

鎴浘宸茶劚鏁忥紝灞曠ず鐨勬槸鏈?Bundle 鎺ョ嚎鐨勫涓荤晫闈㈣兘鍔涳紱涓嶄唬琛ㄨ繖浜?UI 缁勪欢浠ｇ爜浣嶄簬鏈寘鍐呫€?
## 鏂囨。

- [蹇€熷紑濮媇(docs/QUICKSTART.md)
- [鏋舵瀯璇存槑](docs/ARCHITECTURE.md)
- [Bundle 涓庢墿灞曟寚鍗梋(docs/PLUGINS.md)
- [FAQ](docs/FAQ.md)
- [鏁呴殰鎺掓煡](docs/TROUBLESHOOTING.md)
- [awesome-dsh-plugin 鎻愪氦鍑嗗](docs/DSHMARKET-SUBMISSION.md)

## 澹版槑锛圢OTICE锛?
- 鏀剁紪缁勪欢鏉ユ簮銆佹巿鏉冧笌渚涘簲閾捐竟鐣岃 [NOTICE.md](NOTICE.md)銆備袱涓敹缂栫粍浠舵潵鑷幏鏄庣‘鎺堟潈鐨勬湰鍦?`private:true` 鍖咃紱寮€婧愪緷璧?`@nanmicoder/dsh-agent-teams` 鍙渚濊禆銆佷笉澶嶅埗婧愮爜銆?- 鏈寘**缁濅笉渚濊禆** unscoped npm 鍖?`dsh-feishu-bridge`锛堜笌鏀剁紪婧愮爜鏃犲叧鐨勭涓夋柟鍖咃紝鏃?`dsh.bundle` 鑳藉姏锛夈€?
## 璁稿彲璇?
[MIT](LICENSE) 漏 2026 AI Company Framework contributors
