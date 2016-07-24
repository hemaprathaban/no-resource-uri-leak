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

// We are using a library under MPL-2.0 here
const {enablePolicy} = require ('./resource-filter/init');


/* Preferences keys */
const PREF_REDIRECT_MASKED = 'redirect.enableMasking';
const PREF_URI_RESOURCE_BLOCKED = 'uri.resource.enableBlocking';
const PREF_URI_CHROME_BLOCKED = 'uri.chrome.enableBlocking';
const PREF_URI_CHROME_WHITELIST = 'uri.chrome.exposedList';
const PREF_URI_RESOURCE_WHITELIST = 'uri.resource.exposedList';
const PREF_RESTRICT_ABOUT = 'uri.about.restricted';
const PREF_DEBUG_ENABLED = 'debug.enabled';

const _$prefs = require ('sdk/simple-prefs').prefs;

const update = $prefs => enablePolicy ({__proto__: null
	,enableDebug: !!$prefs[PREF_DEBUG_ENABLED]
	,blockResourceURIs: !!$prefs[PREF_URI_RESOURCE_BLOCKED]
	,blockChromeURIs: !!$prefs[PREF_URI_CHROME_BLOCKED]
	,enableRedirectMasking: !!$prefs[PREF_REDIRECT_MASKED]
	,restrictAboutPages: !!$prefs[PREF_RESTRICT_ABOUT]
	,exposedResourceDomains:
		String ($prefs[PREF_URI_RESOURCE_WHITELIST]).split (/[,\s]+/)
	,exposedChromeDomains:
		String ($prefs[PREF_URI_CHROME_WHITELIST]).split (/[,\s]+/)
});

update (_$prefs);
require ('sdk/simple-prefs').on ('control.update', () => void update (_$prefs));

