from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from apps.core.views import global_search, health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),
    # API schema / docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Auth
    path("api/auth/", include("apps.accounts.urls")),
    # Modules
    path("api/", include("apps.core.urls")),
    path("api/contacts/", include("apps.contacts.urls")),
    path("api/companies/", include("apps.companies.urls")),
    path("api/leads/", include("apps.leads.urls")),
    path("api/deals/", include("apps.deals.urls")),
    path("api/", include("apps.activities.urls")),
    path("api/tasks/", include("apps.tasks.urls")),
    path("api/search/", global_search, name="global-search"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
