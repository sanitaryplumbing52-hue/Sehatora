from rest_framework.routers import DefaultRouter

from apps.activities.views import ActivityViewSet, NotificationViewSet

router = DefaultRouter()
router.register("activities", ActivityViewSet, basename="activity")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = router.urls
