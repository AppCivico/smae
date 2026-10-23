.PHONY: release

# make release N=010 S=rc [V=3.10.0]
release:
	@utils/release.sh "$(N)" "$(S)" "$(V)"
