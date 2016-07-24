/* -*- indent-tabs-mode: nil; js-indent-level: 2; tab-width: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
  ResourceFilter: A direct workaround for https://bugzil.la/863246
  API revision: 2
*/

const setPolicy = (() => {
  try {
    const {processes, remoteRequire} = require ('sdk/remote/parent');
    remoteRequire ('./process/filter', module);
    // For every current and future process
    return options =>
      processes.forEvery (process => void process.port.emit ('setPolicy', options));
  } catch (e) {
    // Not multiprocess
    return require ('./process/filter').setPolicy;
  }
}) ();


/**
  Prevents content from loading resource:// URIs without breaking add-ons.
  Can be called multiple times to update the policy.
*/
exports.enablePolicy = options => void setPolicy (options || {});

