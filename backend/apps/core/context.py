"""Thread-local storage for the current request's tenant and user.

Populated by CurrentOrganizationMiddleware on every request so that
TenantManager (apps.core.models) can transparently scope querysets
without every view having to filter by organization by hand.
"""

import threading

_local = threading.local()


def set_current_organization(organization):
    _local.organization = organization


def get_current_organization():
    return getattr(_local, "organization", None)


def set_current_user(user):
    _local.user = user


def get_current_user():
    return getattr(_local, "user", None)


def clear():
    _local.organization = None
    _local.user = None
