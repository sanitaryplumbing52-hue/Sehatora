from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.core.dashboard import dashboard_summary
from apps.core.views import CustomFieldViewSet, TagViewSet

router = DefaultRouter()
router.register("tags", TagViewSet, basename="tag")
router.register("custom-fields", CustomFieldViewSet, basename="custom-field")

urlpatterns = [path("dashboard/summary/", dashboard_summary, name="dashboard-summary")] + router.urls
