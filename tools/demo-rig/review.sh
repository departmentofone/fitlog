# Extra helpers for reviews, on top of rig.sh. Usage: . review.sh (RIG=<port> for a second rig)
. "$(dirname "${BASH_SOURCE[0]}")/rig.sh"
OUTDIR="$(dirname "${BASH_SOURCE[0]}")/out"
vp() { curl -s "localhost:${RIG:-9400}/viewport?w=$1&h=$2&s=${3:-2}" >/dev/null; sleep 0.5; }
# full-height shot of the current screen: grow the viewport to fit <main>'s content, shoot, restore
tall() {
  local h; h=$(ev "const m=document.querySelector('main'); Math.min(6000, Math.ceil(m.scrollHeight + (innerHeight - m.clientHeight)))")
  vp 390 "$h" ${2:-1}; sleep 1; shot "$1"; vp 390 844 2
}
