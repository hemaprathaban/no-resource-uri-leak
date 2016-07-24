/* -*- indent-tabs-mode: nil; js-indent-level: 2; tab-width: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* ResourceFilter: A direct workaround for https://bugzil.la/863246 */

const unload = require ('sdk/system/unload');
const {components, Cc, Ci, Cm, Cr} = require ('chrome');
const {XPCOMUtils} = require ('resource://gre/modules/XPCOMUtils.jsm');

const registrar = Cm.QueryInterface (Ci.nsIComponentRegistrar);
const categoryManager = Cc['@mozilla.org/categorymanager;1']
  .getService (Ci.nsICategoryManager);

/**
  The 'evaluate' callback must not perform any blocking processing.
*/
exports.registerContentPolicy = ({evaluate, contractId, uuid, description}) => {
  if ('function' != typeof evaluate) {
    throw new TypeError ('evaluate must be a function');
  }
  
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
    ,shouldLoad (... args) {
      try {
        if (evaluate (... args)) {
          return Ci.nsIContentPolicy.ACCEPT;
        }
      } catch (e) {
        console.exception (e);
      }
      return Ci.nsIContentPolicy.REJECT_REQUEST;
    }
    ,shouldProcess () {
      return Ci.nsIContentPolicy.ACCEPT;
    }
  };
  
  const classId = components.ID (uuid);
  const category = 'content-policy';
  registrar.registerFactory (classId, description, contractId, policy);
  categoryManager.addCategoryEntry (category, contractId, contractId, false, true);
  
  unload.when (() => {
    categoryManager.deleteCategoryEntry (category, contractId, false);
    registrar.unregisterFactory (classId, policy);
  });
};
