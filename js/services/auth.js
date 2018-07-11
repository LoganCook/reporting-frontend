define(['app', 'options'], function (app, options) {
  'use strict';

  /**
   * Authentication service provider
   *
   * Provider APIs enable the service injectable to anything, most important: angular.config
   * of route
   */
  app.provider('AuthService', function () {
    var re = /^([a-zA-Z].*)@(.*).edu.au$/;
    var user = null,
      domain = null;

    function setUp() {
      user = sessionStorage['email'];
      // Only a part of domain
      domain = _getDomain(user);
    }

    function _getDomain(address) {
      var r = re.exec(address);
      if (r && r.length == 3) {
        return r[2];
      } else {
        return null;
      }
    }

    // Check if an email address from a domain by its part before edu.au
    function inDomain(address, namePart) {
      if (domain) {
        return domain === namePart;
      } else {
        return false;
      }
    }

    function isAdmin() {
      return inDomain(user, 'ersa');
    }

    return {
      setUp: setUp,
      $get: function () {
        return {
          isAdmin: isAdmin,
          getUserEmail: function getUserEmail() {
            return user;
          },
          getUserDomain: function () {
            return domain + '.edu.au';
          },
          getUserOrgName: function () {
            return options['domains'][this.getUserDomain()];
          }
        };
      }
    };
  });

});