/* -*- indent-tabs-mode: nil; js-indent-level: 2; tab-width: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* ResourceFilter: A direct workaround for https://bugzil.la/863246 */

/* Internal script: Loaded into every process (parent or content) */

const {Ci, Cr} = require ('chrome');
const unload = require ('sdk/system/unload');
const {io: ioService, obs: observerService}
	= require ('resource://gre/modules/Services.jsm').Services;

const {registerContentPolicy} = require ('./content-policy');

// Default values
const policyState = {__proto__: null
  ,debug: false
  ,exposedResourceDomains: new Set
  ,exposedChromeDomains: new Set
  ,blockResourceUris: true
  ,blockChromeUris: true
  ,filterRedirects: true
  ,whitelistAboutUris: false
  ,secureAboutUris: new Set (['addons', 'home', 'preferences', 'support', 'newtab', 'debugging', 'config', 'downloads', 'profiles', 'sessionrestore', 'privatebrowsing', 'plugins'])
  ,veryInsecureAboutUris: new Set (['blank', 'srcdoc'])
};


// Note: view-source: scheme is no longer accessible from content (thus no leaks)
const isWhitelistedOrigin = u => (!u)
  || u.schemeIs ('chrome') || u.schemeIs ('resource') || u.schemeIs ('view-source')
  || u.schemeIs ('about') && (!policyState.veryInsecureAboutUris.has (u.path))
    && (policyState.secureAboutUris.has (u.path) || policyState.whitelistAboutUris);

const shouldBeBlocked = u => (!u)
  || policyState.blockResourceUris
    && u.schemeIs ('resource') && (!policyState.exposedResourceDomains.has (u.host))
  || policyState.blockChromeUris
    && u.schemeIs ('chrome') && (!policyState.exposedChromeDomains.has (u.host));

registerContentPolicy ({__proto__: null
  ,contractId: '@addons.mozilla.org/resource-masking-policy;1'
  ,uuid: '{ee3ec15e-6743-47a4-96a7-b551935c93c6}'
  ,description: 'Masks resource URIs against content'
  ,evaluate (typeCode, uri, originUri, node, expectedMime, extra, principal) {
    if (!shouldBeBlocked (uri) || isWhitelistedOrigin (originUri)) {
      return true;
    }
    
    // Allow documents directly loaded into a tab
    if (Ci.nsIContentPolicy.TYPE_DOCUMENT === typeCode) {
      return true;
    }
    
    policyState.debug && console.warn ('ResourceFilter: Rejected'
      , uri.spec, originUri.spec, node, principal);
    return false;
  }
});

/*
  Based on TorButton code, by Yawning Angel
  From https://git.schwanenlied.me/yawning/torbutton/src/fa67687df5fc72c0b6085d9941331277d32319f3/src/components/content-policy.js
*/

// Install a HTTP response handler to check for redirects to URLs with schemes
// that should be internal to the browser.  There's various safeguards and
// checks that cause the body to be unavailable, but the `onLoad()` behavior
// is inconsistent, which results in leaking information about the specific
// user agent instance (eg: what addons are installed).
const requestObserver = {__proto__: null
  ,observe (aSubject, aTopic, aData) {
    const aChannel = aSubject.QueryInterface (Ci.nsIHttpChannel);
    const aStatus = aChannel.responseStatus;
    
    try {
      // If this is a redirect...
      //
      // Note: Technically `304 Not Modifed` isn't a redirect, but receiving that
      // to the proscribed schemes is nonsensical.
      if (aStatus >= 300 && aStatus < 400) {
        const location = aChannel.getResponseHeader ('Location');
        const aUri = ioService.newURI (location, null, null);
        // And it's redirecting into the browser or addon's internal URLs...
        if (shouldBeBlocked (aUri) || aUri.schemeIs ('about')) {
          // Cancel the request.
          policyState.debug && console.warn ('ResourceFilter: Cancelled redirect'
            , aUri.spec, aChannel.owner);
          aSubject.cancel (Cr.NS_BINDING_ABORTED);
        }
      }
    } catch (e) {
      console.exception (e);
    }
  }
};

try {
  observerService.addObserver (requestObserver, 'http-on-examine-response', false);
  unload.when (() =>
    observerService.removeObserver (requestObserver, 'http-on-examine-response'));
} catch (e) {}

const setPolicy = ({enableRedirectMasking, blockChromeURIs, blockResourceURIs
  , enableDebug, restrictAboutPages, exposedResourceDomains, exposedChromeDomains}) =>
{
  policyState.filterRedirects = !!enableRedirectMasking;
  policyState.blockChromeUris = !!blockChromeURIs;
  policyState.blockResourceUris = !!blockResourceURIs;
  policyState.debug = !!enableDebug;
  policyState.whitelistAboutUris = !restrictAboutPages;
  policyState.exposedResourceDomains = new Set (exposedResourceDomains || []);
  policyState.exposedChromeDomains = new Set (exposedChromeDomains || []);
};

try {
  require ('sdk/remote/child').process.port.on ('setPolicy'
    , (_, options) => setPolicy (options));
} catch (e) {
  // Not multiprocess
  exports.setPolicy = setPolicy;
}
