from rest_framework.routers import DefaultRouter

from apps.leads.views import LeadScoreEventViewSet, LeadViewSet

router = DefaultRouter()
router.register("score-events", LeadScoreEventViewSet, basename="lead-score-event")
router.register("", LeadViewSet, basename="lead")

urlpatterns = router.urls
