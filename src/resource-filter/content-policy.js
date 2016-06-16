/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* ResourceFilter: A direct workaround for https://bugzil.la/863246 */

/* Internal script: Loaded into every process (parent or content) */

const {components, Cc, Ci, Cm, Cr} = require ('chrome');
const unload = require ('sdk/system/unload');
const {XPCOMUtils} = require ('resource://gre/modules/XPCOMUtils.jsm');

const domains = new Set; // disallowed domains: any if empty
const isDenied = domain => 1 > domains.size || domains.has ('' + domain);
let allowChromeURIs = true;

const policy = {__proto__: null
  /* nsISupports */
  ,QueryInterface: XPCOMUtils.generateQI (['nsIContentPolicy', 'nsIFactory'])
  
  /* nsIFactory */
  ,createInstance (outer, id) {
    if (outer) {
      throw Cr.NS_ERROR_NO_AGGREGATION;
    }
    return this.QueryInterface (id);
  }
  
  /* nsIContentPolicy */
  ,shouldLoad (typeCode, uri, originUri, node, expectedMime, extra, principal) {
    if (!uri || !uri.schemeIs ('resource') || !originUri
      || originUri.schemeIs ('chrome') || originUri.schemeIs ('resource')) {
      
      if (allowChromeURIs || !uri.schemeIs ('chrome')) {
        return Ci.nsIContentPolicy.ACCEPT;
      }
    }
    
    // Non-matching domain or a resource directly loaded into a tab
    if (!isDenied (uri.host) || Ci.nsIContentPolicy.TYPE_DOCUMENT === typeCode) {
      return Ci.nsIContentPolicy.ACCEPT;
    }
    
    // Whitelist about:addons (Add-ons compatibility)
    if (originUri.schemeIs ('about') && 'addons' === originUri.path) {
      return Ci.nsIContentPolicy.ACCEPT;
    }
    
    return Ci.nsIContentPolicy.REJECT_REQUEST;
  }
  ,shouldProcess (typeCode, uri, originUri, node, expectedMime, extra) {
    return Ci.nsIContentPolicy.ACCEPT;
  }
};

const contractId = '@addons.mozilla.org/resource-masking-policy;1';
const classId = components.ID ('{ee3ec15e-6743-47a4-96a7-b551935c93c6}');
const description = 'Masks resource URIs against content';
const category = 'content-policy';

const init = (... args) => {
  const registrar = Cm.QueryInterface (Ci.nsIComponentRegistrar);
  const categoryManager = Cc['@mozilla.org/categorymanager;1']
    .getService (Ci.nsICategoryManager);
  
  const {resourceDomain, blockChromeURIs} = args.pop ();
  try {
    if ('string' === typeof resourceDomain) throw void 0;
    [... resourceDomain].forEach (domain => domains.add ('' + domain));
  } catch (e) {
    resourceDomain && domains.add ('' + resourceDomain);
  }
  
  if (blockChromeURIs) {
    allowChromeURIs = false;
  }
  
  registrar.registerFactory (classId, description, contractId, policy);
  categoryManager.addCategoryEntry (category, contractId, contractId, false, true);
  
  unload.when (() => {
    categoryManager.deleteCategoryEntry (category, contractId, false);
    registrar.unregisterFactory (classId, policy);
  });
};

try {
  require ('sdk/remote/child').process.port.on ('init', init);
} catch (e) {
  // Not multiprocess
  exports.init = init;
}
