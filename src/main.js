/* -*- coding: utf-8; tab-width: 4; indent-tabs-mode: t -*-
vim: ts=4 noet ai */

/**
	No Resource URI Leak -- Fill the hole, stop fingerprinting.

	Copyright © 2016  Desktopd Project

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as
	published by the Free Software Foundation, either version 3 of the
	License, or (at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.

	@license GPL-3.0+
	@file
*/

'use strict';

// Stop all access attempts to resource:// URIs from the Web
const filteredDomain = void 0; // everything
const blockChromeURIs = !!require ('sdk/simple-prefs').prefs.blockChromeURIs;

console.log (require ('sdk/simple-prefs').prefs);
// The core code is under MPL-2.0
require ('./resource-filter/init').addFilter (filteredDomain, blockChromeURIs);

