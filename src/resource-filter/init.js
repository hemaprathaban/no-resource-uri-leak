/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* ResourceFilter: A direct workaround for https://bugzil.la/863246 */

/**
  Prevents content from loading resource:// URIs without breaking add-ons.
  @param resourceDomain (optional) e.g. 'gre' for resource://gre/
*/
exports.addFilter = resourceDomain => {
  try {
    const {processes, remoteRequire} = require ('sdk/remote/parent');
    remoteRequire ('./content-policy', module);
  
    // For every current and future process
    processes.forEvery (process => void process.port.emit ('init', resourceDomain));
  } catch (e) {
    // Not multiprocess
    require ('./content-policy').init (resourceDomain);
  }
};
