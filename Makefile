# -*- coding: utf-8; tab-width: 4 -*-
# vim: ts=4 noet ai

# Part of No Resource URI Leak
# Copyright © 2016  Desktopd Project
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.


# Basic options
addon_ext = .xpi
git_command = git
rsvg_command = rsvg-convert
zopflipng_command = zopflipng
net_access_delay = 5

# Silent rules resembling Automake
default_verbosity = 0
V_at = $(v_at_$(V))
v_at_ = $(v_at_$(default_verbosity))
v_at_0 = @
v_at_1 = 
V_XPI = $(v_xpi_$(V))
v_xpi_ = $(v_xpi_$(default_verbosity))
v_xpi_0 = @echo '  XPI     ' $@;
v_xpi_1 = 
V_RSVG = $(v_rsvg_$(V))
v_rsvg_ = $(v_rsvg_$(default_verbosity))
v_rsvg_0 = @echo '  RSVG    ' $@;
v_rsvg_1 = 

# Important paths
builds_dir = ./builds
branding_src_dir = ./branding
src_dir = ./src
version_info_path = ./version_info
git_submodule_jpm_sh = ./tools/jpm.sh
addon_path = $(builds_dir)/latest


all: addon
.PHONY:	all addon git-submodule git-submodule-check deps deps-check \
	$(addon_path) branding icon rsvg-check clean distclean

addon: deps-check $(addon_path)
$(addon_path):
	$(V_at)$(V_XPI)( \
		[ "$(V_at)" ] && export JPM_SILENT=1 ;\
		buildDir=$(builds_dir)/`date +%s` ;\
		rmdir $(builds_dir)/* >/dev/null 2>&1 ;\
		mkdir -p "$$buildDir" ;\
		addonName=`$(git_submodule_jpm_sh)/bin/jpm-build.sh printPkgName 3>&1 > "$$buildDir/build.zip"` ;\
		mv "$$buildDir/build.zip" "$$buildDir/$$addonName$(addon_ext)" ;\
		cd $(builds_dir)/ ;\
		rm -f ./latest ;\
		ln -fs "`basename "$$buildDir"`" ./latest ;\
	)

deps: git-submodule
deps-check: git-submodule-check

git-submodule-check:
	@[ -d $(git_submodule_jpm_sh)/bin ] || { echo "Run 'make deps' first!" ; false ;}

git-submodule:
	@echo "Git will access online repositories!!!"
	@echo "Interrupt within $(net_access_delay) seconds if you are not ready..."
	sleep $(net_access_delay)
	@echo "Now invoking Git!"
	$(git_command) submodule update --init --recursive

branding: icon
icon: rsvg-check $(src_dir)/icon.png $(src_dir)/icon64.png

rsvg-check:
	$(V_at)which $(rsvg_command) >/dev/null

$(src_dir)/icon.png:
	$(V_at)$(V_RSVG)( \
		set -e ;\
		$(rsvg_command) -w 96 -h 96 $(branding_src_dir)/icon.svg \
			> $(src_dir)/icon~tmp.png ;\
		which $(zopflipng_command) >/dev/null 2>&1 || { \
			echo 'Warning: zopflipng not available' ;\
			mv $(src_dir)/icon~tmp.png $(src_dir)/icon.png ;\
			exit ;} ;\
		$(zopflipng_command) --iterations=200 --splitting=3 --filters=01234mepb --lossy_8bit --lossy_transparent $(src_dir)/icon~tmp.png $(src_dir)/icon.png ;\
		rm -f $(src_dir)/icon~tmp.png ;\
	)

$(src_dir)/icon64.png:
	$(V_at)$(V_RSVG)( \
		set -e ;\
		$(rsvg_command) -w 128 -h 128 $(branding_src_dir)/icon.svg \
			> $(src_dir)/icon64~tmp.png ;\
		which $(zopflipng_command) >/dev/null 2>&1 || { \
			echo 'Warning: zopflipng not available' ;\
			mv $(src_dir)/icon64~tmp.png $(src_dir)/icon64.png ;\
			exit ;} ;\
		$(zopflipng_command) --iterations=200 --splitting=3 --filters=01234mepb --lossy_8bit --lossy_transparent $(src_dir)/icon64~tmp.png $(src_dir)/icon64.png ;\
		rm -f $(src_dir)/icon64~tmp.png ;\
	)

clean:

distclean: clean
	rm -f $(src_dir)/icon~tmp.png $(src_dir)/icon64~tmp.png \
		$(src_dir)/icon.png $(src_dir)/icon64.png
	rm -f $(api_docs_path)

