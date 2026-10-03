# Produce the six store screenshots from a running rig (node server.mjs).
. "$(dirname "$0")/rig.sh"
scrollto() { # scroll <main> so the card holding leaf text $1 sits $2 px below the header
  ev "const m=document.querySelector('main'); const h=[...m.querySelectorAll('*')].filter(e=>e.childElementCount===0&&e.textContent.trim()===$(printf '%s' "$1" | python -c 'import json,sys;print(json.dumps(sys.stdin.read()))')).at(${3:-0}); const r=h.getBoundingClientRect(), mr=m.getBoundingClientRect(); m.scrollBy(0, r.top-mr.top-${2:-12}); await new Promise(r=>setTimeout(r,900)); m.scrollTop"
}

curl -s "localhost:9400/reload?route=workouts" >/dev/null
sleep 2

# 1. Today's workout
go workouts; sleep 2; shot 1-workouts

# 2. Set logging: bench press with a warm-up and three working sets, set 5 ready to add
tapt "Barbell Bench Press"
scrollto "Barbell Bench Press" 30
ev "const i=[...document.querySelectorAll('main input')].filter(x=>x.offsetParent&&!x.value&&x.type!=='range'&&x.type!=='checkbox')[0]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'8'); i.dispatchEvent(new Event('input',{bubbles:true})); i.blur(); await new Promise(r=>setTimeout(r,600)); i.value"
shot 2-set-logging

# 3. Meals
go meals; sleep 2; shot 3-meals

# 4. Community
go community; sleep 2; shot 4-community

# 5. Following a diet: Eat > Foods > Diets, card expanded
go foods; tapt Diets; ev "const c=[...document.querySelectorAll('main *')].filter(e=>e.childElementCount===0&&e.textContent.trim()==='Mediterranean').at(-1); c.closest('button,[role=button]')?.click(); await new Promise(r=>setTimeout(r,1500)); 'ok'"
scrollto Mediterranean 25 -1
shot 5-diets

# 6. Progress: weight trend
go goals; sleep 2; shot 6-progress

curl -s localhost:9400/log
