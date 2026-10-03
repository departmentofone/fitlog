# usage: . rig.sh ; ev 'js' ; shot name
ev() { curl -s -G localhost:${RIG:-9400}/eval --data-urlencode "js=$1"; echo; }
shot() { curl -s "localhost:${RIG:-9400}/shot?name=$1" >/dev/null; echo "shot $1"; }
# tap the first visible button/link whose text is exactly $1 (optionally inside selector $2)
tap() { ev "(async()=>{const els=[...document.querySelectorAll('${2:-button, a, [role=tab]}')].filter(e=>e.innerText.trim()===$(printf '%s' "$1" | python -c 'import json,sys;print(json.dumps(sys.stdin.read()))') && e.offsetParent); if(!els.length) return 'NOT FOUND'; els[0].click(); await new Promise(r=>setTimeout(r,${3:-2500})); return 'ok'})()"; }
go() { ev "history.pushState({fitlogRoute:true},'','#/$1'); dispatchEvent(new PopStateEvent('popstate',{state:{fitlogRoute:true}})); await new Promise(r=>setTimeout(r,3000)); document.querySelector('main')?.scrollTo(0,0); location.hash"; }
# click the nearest button around the leaf element whose text is exactly $1
tapt() { ev "const h=[...document.querySelectorAll('body *')].find(e=>e.childElementCount===0&&e.textContent.trim()===$(printf '%s' "$1" | python -c 'import json,sys;print(json.dumps(sys.stdin.read()))')&&e.offsetParent); if(!h) 'NOT FOUND'; else { (h.closest('button,a,[role=tab],[role=button]')||h).click(); await new Promise(r=>setTimeout(r,${2:-2500})); 'ok' }"; }
