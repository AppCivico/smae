#!/usr/bin/env bash
# Uso: utils/release.sh <release> [sufixo] [versao]
#   utils/release.sh 010 rc          -> 3.10.0
#   utils/release.sh 010 bugfixes    -> 3.10.N (N = correções já tagueadas + 1)
#   utils/release.sh 010 hotfixes 3.10.5
set -euo pipefail

CONTRATO=3
ARQUIVO=backend/src/common/versao.ts

die() { echo "erro: $*" >&2; exit 1; }

N=${1:-}
S=${2:-}
V=${3:-}

[[ $N =~ ^[0-9]{3}$ ]] || die "release deve ter 3 dígitos (ex.: 010)"
[[ -z $S || $S =~ ^[a-z0-9-]+$ ]] || die "sufixo inválido: $S"

cd "$(git rev-parse --show-toplevel)"
git diff --quiet && git diff --cached --quiet || die "há alterações não commitadas"

DATA=$(date +%Y-%m-%d)
TAG="v$(date +%Y.%m.%d)-release-$N${S:+-$S}"
git rev-parse -q --verify "refs/tags/$TAG" >/dev/null && die "tag $TAG já existe"

MINOR=$((10#$N))
case $S in
    '' | homol* | rc*) CORRECAO=0 ;;
    *) CORRECAO=1 ;;
esac

if [[ -z $V ]]; then
    if ((CORRECAO)); then
        TAGS_DE_CORRECAO=$(git tag -l "v*-release-$N-*" | grep -Ev -- "-release-$N-(homol|rc)" || true)
        # tags antigas não têm "SMAE x.y.z" na mensagem; nelas vale a contagem
        CONTAGEM=$(grep -c . <<<"$TAGS_DE_CORRECAO" || true)
        MAIOR=$(git tag -l "v*-release-$N-*" --format='%(contents:subject)' |
            sed -nE "s/^SMAE $CONTRATO\.$MINOR\.([0-9]+)$/\1/p" | sort -n | tail -1)
        PATCH=$(( (${MAIOR:-0} > CONTAGEM ? ${MAIOR:-0} : CONTAGEM) + 1 ))
    else
        PATCH=0
    fi
    V="$CONTRATO.$MINOR.$PATCH"
fi
[[ $V =~ ^$CONTRATO\.$MINOR\.([0-9]+)$ ]] || die "versão $V não corresponde a $CONTRATO.$MINOR.x"
if ((CORRECAO)); then
    ((BASH_REMATCH[1] > 0)) || die "sufixo '$S' é correção; a versão precisa terminar em .1 ou mais"
else
    ((BASH_REMATCH[1] == 0)) || die "rc/homol/sem sufixo usa $CONTRATO.$MINOR.0"
fi

echo "versão: $V"
echo "tag:    $TAG"
echo "data:   $DATA"
read -r -p "confirma? [s/N] " OK
[[ $OK == s ]] || die "cancelado"

cat > "$ARQUIVO" <<TS
// Gerado por utils/release.sh, não editar à mão.
export const VERSAO_SMAE = {
    versao: '$V',
    data: '$DATA',
    tag: '$TAG',
};
TS

git add "$ARQUIVO"
git commit -m "chore(release): SMAE $V"
git tag -a "$TAG" -m "SMAE $V"
echo "ok. para publicar: git push && git push origin $TAG"
