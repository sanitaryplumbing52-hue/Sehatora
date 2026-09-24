from rest_framework.routers import DefaultRouter

from apps.deals.views import DealViewSet, PipelineStageViewSet, PipelineViewSet

router = DefaultRouter()
router.register("pipelines", PipelineViewSet, basename="pipeline")
router.register("stages", PipelineStageViewSet, basename="pipeline-stage")
router.register("", DealViewSet, basename="deal")

urlpatterns = router.urls
